/**
 * One experience or education, edited from its row of the home page Journey section.
 * The organization is picked from the existing ones or created by name; its logo is
 * saved by the dialog through /admin/media. Positions (the CV order) follow the dates:
 * they are renumbered, most recent first, after every change.
 */

import {
	EDIT_LIMITS as MAX,
	EXPERIENCE_KINDS,
	NEW_ORGANIZATION,
	NO_ORGANIZATION,
	type EditSections,
	type ExperienceEdit,
	type ExperienceOptions
} from '#lib/content/edit.js';
import { locales } from '#lib/paraglide/runtime.js';
import { writeQuery, writeTransaction, type Transaction } from '#lib/server/db/index.js';
import { mediaUrl } from '#lib/server/media/storage.js';
import {
	EditError,
	bool,
	byParent,
	checkIds,
	insertTranslations,
	integer,
	isoDate,
	list,
	localized,
	localizedText,
	personId,
	record,
	skillIdList,
	skillOptions,
	text,
	type Row,
	type SectionHandler
} from './shared.js';

async function options(): Promise<ExperienceOptions> {
	const [organizations, skills] = await Promise.all([
		writeQuery<{ id: number; name: string; logo_file: string | null }>(
			'SELECT id, name, logo_file FROM organization ORDER BY name'
		),
		skillOptions()
	]);
	return {
		organizations: organizations.map((organization) => {
			const url = mediaUrl(organization.logo_file);
			return {
				id: organization.id,
				name: organization.name,
				logo: url && organization.logo_file ? { file: organization.logo_file, url } : null
			};
		}),
		skills
	};
}

const empty = (): ExperienceEdit => ({
	kind: 'job',
	organizationId: NO_ORGANIZATION,
	newOrganization: '',
	start: '',
	end: '',
	onSite: true,
	title: Object.fromEntries(locales.map((locale) => [locale, ''])),
	degree: Object.fromEntries(locales.map((locale) => [locale, ''])),
	tasks: [],
	skillIds: []
});

async function readExperience(id: number): Promise<{ experience: ExperienceEdit; projects: string[] }> {
	const [[row], texts, tasks, taskTexts, skills, projects] = await Promise.all([
		writeQuery<{
			kind: ExperienceEdit['kind'];
			organization_id: number | null;
			start_date: string;
			end_date: string | null;
			on_site: number;
		}>('SELECT kind, organization_id, start_date, end_date, on_site FROM experience WHERE id = ?', [id]),
		writeQuery<Row>('SELECT locale, title, degree FROM experience_i18n WHERE experience_id = ?', [id]),
		writeQuery<{ id: number }>('SELECT id FROM experience_task WHERE experience_id = ? ORDER BY position, id', [id]),
		writeQuery<Row>(
			`SELECT t.experience_task_id, t.locale, t.text FROM experience_task_i18n t
			JOIN experience_task k ON k.id = t.experience_task_id WHERE k.experience_id = ?`,
			[id]
		),
		writeQuery<{ skill_id: number }>('SELECT skill_id FROM experience_skill WHERE experience_id = ?', [id]),
		writeQuery<{ name: string }>('SELECT name FROM project WHERE experience_id = ? ORDER BY position, id', [id])
	]);
	if (!row) throw new EditError('Unknown experience');
	const byTask = byParent(taskTexts, 'experience_task_id');
	return {
		experience: {
			kind: row.kind,
			organizationId: row.organization_id ?? NO_ORGANIZATION,
			newOrganization: '',
			start: row.start_date,
			end: row.end_date ?? '',
			onSite: Number(row.on_site) === 1,
			title: localized(texts, 'title'),
			degree: localized(texts, 'degree'),
			tasks: tasks.map((task) => localized(byTask.get(task.id) ?? [], 'text')),
			skillIds: skills.map((skill) => skill.skill_id)
		},
		projects: projects.map((project) => project.name)
	};
}

function parseExperience(value: unknown): ExperienceEdit {
	const input = record(value, 'experience');
	if (!EXPERIENCE_KINDS.includes(input.kind as ExperienceEdit['kind'])) throw new EditError('kind: invalid');
	const organizationId = integer(input.organizationId, 'organizationId', NEW_ORGANIZATION, 2 ** 32 - 1);
	const newOrganization = text(
		input.newOrganization ?? '',
		MAX.organizationName,
		'newOrganization',
		organizationId === NEW_ORGANIZATION
	);
	const start = isoDate(input.start, 'start');
	const end = input.end === '' || input.end === null || input.end === undefined ? '' : isoDate(input.end, 'end');
	if (end && end < start) throw new EditError('end: before start');
	return {
		kind: input.kind as ExperienceEdit['kind'],
		organizationId,
		newOrganization: organizationId === NEW_ORGANIZATION ? newOrganization : '',
		start,
		end,
		onSite: bool(input.onSite, 'onSite'),
		title: localizedText(input.title, MAX.experienceTitle, 'title'),
		degree: localizedText(input.degree, MAX.experienceTitle, 'degree', false),
		tasks: list(input.tasks, 'tasks').map((task, i) => localizedText(task, MAX.experienceTask, `tasks[${i}]`)),
		skillIds: skillIdList(input.skillIds, 'skillIds')
	};
}

/** Existing organization id, a new one, or null */
async function resolveOrganization(tx: Transaction, experience: ExperienceEdit): Promise<number | null> {
	if (experience.organizationId === NO_ORGANIZATION) return null;
	if (experience.organizationId !== NEW_ORGANIZATION) {
		await checkIds(tx, 'organization', [experience.organizationId], 'organizationId');
		return experience.organizationId;
	}
	// Names are unique: an existing organization of that name is reused
	const [existing] = await tx.query<{ id: number }>('SELECT id FROM organization WHERE name = ?', [experience.newOrganization]);
	if (existing) return Number(existing.id);
	return tx.insert('INSERT INTO organization (name) VALUES (?)', [experience.newOrganization]);
}

/** Positions follow the dates, most recent first, per kind (the CV order) */
async function renumber(tx: Transaction, pid: number): Promise<void> {
	for (const kind of EXPERIENCE_KINDS) {
		const rows = await tx.query<{ id: number }>(
			'SELECT id FROM experience WHERE person_id = ? AND kind = ? ORDER BY start_date DESC, id',
			[pid, kind]
		);
		for (const [i, row] of rows.entries()) {
			await tx.query('UPDATE experience SET position = ? WHERE id = ?', [i + 1, row.id]);
		}
	}
}

async function writeExperience(experience: ExperienceEdit, id: number | null): Promise<number> {
	const pid = await personId();
	return writeTransaction(async (tx) => {
		await checkIds(tx, 'skill', experience.skillIds, 'skillIds');
		const organizationId = await resolveOrganization(tx, experience);
		const columns = [organizationId, experience.kind, experience.start, experience.end || null, experience.onSite];
		let experienceId: number;
		if (id === null) {
			experienceId = await tx.insert(
				`INSERT INTO experience (person_id, organization_id, kind, start_date, end_date, on_site)
				VALUES (?, ?, ?, ?, ?, ?)`,
				[pid, ...columns]
			);
		} else {
			const [found] = await tx.query('SELECT id FROM experience WHERE id = ? AND person_id = ? FOR UPDATE', [id, pid]);
			if (!found) throw new EditError('Unknown experience', 404);
			await tx.query(
				'UPDATE experience SET organization_id = ?, kind = ?, start_date = ?, end_date = ?, on_site = ? WHERE id = ?',
				[...columns, id]
			);
			experienceId = id;
		}

		await tx.query('DELETE FROM experience_i18n WHERE experience_id = ?', [experienceId]);
		await insertTranslations(tx, 'experience_i18n', 'experience_id', experienceId, {
			title: experience.title,
			// Only education has a degree
			degree: experience.kind === 'education' ? experience.degree : Object.fromEntries(locales.map((l) => [l, '']))
		});

		await tx.query('DELETE FROM experience_task WHERE experience_id = ?', [experienceId]);
		for (const [i, task] of experience.tasks.entries()) {
			const taskId = await tx.insert('INSERT INTO experience_task (experience_id, position) VALUES (?, ?)', [
				experienceId,
				i + 1
			]);
			await insertTranslations(tx, 'experience_task_i18n', 'experience_task_id', taskId, { text: task });
		}

		await tx.query('DELETE FROM experience_skill WHERE experience_id = ?', [experienceId]);
		for (const skillId of experience.skillIds) {
			await tx.query('INSERT INTO experience_skill (experience_id, skill_id) VALUES (?, ?)', [experienceId, skillId]);
		}

		await renumber(tx, pid);
		return experienceId;
	});
}

const experience: SectionHandler<EditSections['experience']> = {
	async read(id) {
		const [data, choices] = await Promise.all([
			id === null ? { experience: empty(), projects: [] } : readExperience(id),
			options()
		]);
		return { ...data, options: choices };
	},
	parse(body) {
		return {
			experience: parseExperience(record(body, 'body').experience),
			options: { organizations: [], skills: [] },
			projects: []
		};
	},
	write: (data, id) => writeExperience(data.experience, id),
	async remove(id) {
		const pid = await personId();
		await writeTransaction(async (tx) => {
			const [found] = await tx.query('SELECT id FROM experience WHERE id = ? AND person_id = ? FOR UPDATE', [id, pid]);
			if (!found) throw new EditError('Unknown experience', 404);
			// Its projects would silently become personal projects: they must be moved first
			const [{ count }] = await tx.query<{ count: number }>(
				'SELECT COUNT(*) AS count FROM project WHERE experience_id = ?',
				[id]
			);
			if (Number(count) > 0) throw new EditError('Experience has projects', 409);
			await tx.query('DELETE FROM experience WHERE id = ?', [id]);
			await renumber(tx, pid);
		});
	}
};

export const experienceSections = { experience };
