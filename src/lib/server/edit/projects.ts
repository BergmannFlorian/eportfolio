/**
 * Projects edited from the home page: one project at a time (its card), and the list
 * as a whole (order, home page selection, deletion). The project dialog shows the image
 * read here, but saves it through /admin/media (src/lib/server/media/); a deleted
 * project's image stays in the library.
 */

import {
	EDIT_LIMITS as MAX,
	PROJECT_KINDS,
	PROJECT_STATUSES,
	type EditSections,
	type Localized,
	type ProjectEdit,
	type ProjectImage,
	type ProjectOptions
} from '#lib/content/edit.js';
import { baseLocale } from '#lib/paraglide/runtime.js';
import { writeQuery, writeTransaction, type Transaction } from '#lib/server/db/index.js';
import { mediaUrl } from '#lib/server/media/storage.js';
import { readSlot } from '#lib/server/media/targets.js';
import {
	EditError,
	bool,
	byParent,
	insertTranslations,
	integer,
	items,
	list,
	localized,
	localizedText,
	record,
	text,
	type Row,
	type SectionHandler
} from './shared.js';

type ItemKind = 'task' | 'detail';

async function options(): Promise<ProjectOptions> {
	const [experiences, skills] = await Promise.all([
		writeQuery<{ id: number; title: string | null; organization: string | null; start_date: string }>(
			`SELECT e.id, t.title, o.name AS organization, e.start_date
			FROM experience e
			LEFT JOIN experience_i18n t ON t.experience_id = e.id AND t.locale = ?
			LEFT JOIN organization o ON o.id = e.organization_id
			ORDER BY e.start_date DESC, e.id`,
			[baseLocale]
		),
		writeQuery<{ id: number; name: string; category: string | null }>(
			`SELECT s.id, s.name, COALESCE(t.name, c.code) AS category
			FROM skill s
			JOIN skill_category c ON c.id = s.category_id
			LEFT JOIN skill_category_i18n t ON t.skill_category_id = c.id AND t.locale = ?
			ORDER BY c.position, c.id, s.position, s.id`,
			[baseLocale]
		)
	]);
	return {
		experiences: experiences.map((experience) => ({
			id: experience.id,
			label: [experience.title, experience.organization, experience.start_date.slice(0, 4)].filter(Boolean).join(' · ')
		})),
		skills: skills.map((skill) => ({ id: skill.id, name: skill.name, category: skill.category ?? '' }))
	};
}

const emptyProject = (): ProjectEdit => ({
	name: '',
	url: '',
	experienceId: null,
	featured: true,
	kind: '',
	year: null,
	status: '',
	hosting: '',
	snippet: '',
	tasks: [],
	details: [],
	skillIds: []
});

async function readProject(id: number): Promise<ProjectEdit> {
	const [[project], itemRows, i18nRows, skills] = await Promise.all([
		writeQuery<{
			name: string;
			url: string | null;
			experience_id: number | null;
			featured: number;
			kind: ProjectEdit['kind'] | null;
			year: number | null;
			status: ProjectEdit['status'] | null;
			hosting: string | null;
			snippet: string | null;
		}>(
			'SELECT name, url, experience_id, featured, kind, year, status, hosting, snippet FROM project WHERE id = ?',
			[id]
		),
		writeQuery<{ id: number; kind: ItemKind }>(
			'SELECT id, kind FROM project_item WHERE project_id = ? ORDER BY kind, position, id',
			[id]
		),
		writeQuery<Row>(
			`SELECT t.project_item_id, t.locale, t.text FROM project_item_i18n t
			JOIN project_item i ON i.id = t.project_item_id WHERE i.project_id = ?`,
			[id]
		),
		writeQuery<{ skill_id: number }>('SELECT skill_id FROM project_skill WHERE project_id = ?', [id])
	]);
	if (!project) throw new EditError('Unknown project');
	const i18n = byParent(i18nRows, 'project_item_id');
	const texts = (kind: ItemKind): Localized[] =>
		itemRows.filter((item) => item.kind === kind).map((item) => localized(i18n.get(item.id) ?? [], 'text'));
	return {
		name: project.name,
		url: project.url ?? '',
		experienceId: project.experience_id,
		featured: Number(project.featured) === 1,
		kind: project.kind ?? '',
		year: project.year,
		status: project.status ?? '',
		hosting: project.hosting ?? '',
		snippet: project.snippet ?? '',
		tasks: texts('task'),
		details: texts('detail'),
		skillIds: skills.map((skill) => skill.skill_id)
	};
}

function parseProject(value: unknown): ProjectEdit {
	const input = record(value, 'project');
	const url = text(input.url ?? '', MAX.projectUrl, 'url');
	if (url) {
		let protocol = '';
		try {
			protocol = new URL(url).protocol;
		} catch {
			// handled below
		}
		if (protocol !== 'https:' && protocol !== 'http:') throw new EditError('url: invalid');
	}
	const kind = input.kind ?? '';
	if (kind !== '' && !PROJECT_KINDS.includes(kind as (typeof PROJECT_KINDS)[number])) throw new EditError('kind: invalid');
	const status = input.status ?? '';
	if (status !== '' && !PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number])) {
		throw new EditError('status: invalid');
	}
	const texts = (what: 'tasks' | 'details') =>
		list(input[what], what).map((entry, i) => localizedText(entry, MAX.projectText, `${what}[${i}]`));
	const skillIds = list(input.skillIds, 'skillIds', MAX.skills).map((id, i) => integer(id, `skillIds[${i}]`, 1, 2 ** 32 - 1));
	return {
		name: text(input.name, MAX.projectName, 'name', true),
		url,
		experienceId:
			input.experienceId === null ? null : integer(input.experienceId, 'experienceId', 1, 2 ** 32 - 1),
		featured: bool(input.featured, 'featured'),
		kind: kind as ProjectEdit['kind'],
		year: input.year === null || input.year === undefined ? null : integer(input.year, 'year', 1970, 2100),
		status: status as ProjectEdit['status'],
		hosting: text(input.hosting ?? '', MAX.hosting, 'hosting'),
		// Keeps the indentation of the example, only trims the ends of the block
		snippet: text(input.snippet ?? '', MAX.snippet, 'snippet'),
		tasks: texts('tasks'),
		details: texts('details'),
		skillIds: [...new Set(skillIds)]
	};
}

/** Throws unless every id exists in `table` */
async function checkIds(tx: Transaction, table: 'experience' | 'skill', ids: number[], what: string) {
	if (ids.length === 0) return;
	const [{ count }] = await tx.query<{ count: number }>(
		`SELECT COUNT(*) AS count FROM ${table} WHERE id IN (${ids.map(() => '?').join(', ')})`,
		ids
	);
	if (Number(count) !== ids.length) throw new EditError(`${what}: unknown id`);
}

async function writeProject(project: ProjectEdit, id: number | null): Promise<number> {
	return writeTransaction(async (tx) => {
		await checkIds(tx, 'experience', project.experienceId === null ? [] : [project.experienceId], 'experienceId');
		await checkIds(tx, 'skill', project.skillIds, 'skillIds');
		const columns = [
			project.name,
			project.url || null,
			project.experienceId,
			project.featured,
			project.kind || null,
			project.year,
			project.status || null,
			project.hosting || null,
			project.snippet || null
		];
		let projectId: number;
		if (id === null) {
			// A new project comes last
			const [{ next }] = await tx.query<{ next: number }>('SELECT COALESCE(MAX(position), 0) + 1 AS next FROM project');
			projectId = await tx.insert(
				`INSERT INTO project (name, url, experience_id, featured, kind, year, status, hosting, snippet, position)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[...columns, Number(next)]
			);
		} else {
			const [found] = await tx.query('SELECT id FROM project WHERE id = ? FOR UPDATE', [id]);
			if (!found) throw new EditError('Unknown project');
			await tx.query(
				`UPDATE project SET name = ?, url = ?, experience_id = ?, featured = ?, kind = ?, year = ?,
				status = ?, hosting = ?, snippet = ? WHERE id = ?`,
				[...columns, id]
			);
			projectId = id;
		}

		await tx.query('DELETE FROM project_item WHERE project_id = ?', [projectId]);
		for (const kind of ['task', 'detail'] as const) {
			const texts = kind === 'task' ? project.tasks : project.details;
			for (const [i, entry] of texts.entries()) {
				const itemId = await tx.insert('INSERT INTO project_item (project_id, kind, position) VALUES (?, ?, ?)', [
					projectId,
					kind,
					i + 1
				]);
				await insertTranslations(tx, 'project_item_i18n', 'project_item_id', itemId, { text: entry });
			}
		}

		await tx.query('DELETE FROM project_skill WHERE project_id = ?', [projectId]);
		for (const skillId of project.skillIds) {
			await tx.query('INSERT INTO project_skill (project_id, skill_id) VALUES (?, ?)', [projectId, skillId]);
		}
		return projectId;
	});
}

async function readImage(id: number): Promise<ProjectImage | null> {
	const slot = await readSlot('project', id);
	const url = mediaUrl(slot?.file);
	return slot?.file && url ? { file: slot.file, url, alt: slot.alt } : null;
}

const project: SectionHandler<EditSections['project']> = {
	async read(id) {
		const [data, choices, image] = await Promise.all([
			id === null ? emptyProject() : readProject(id),
			options(),
			id === null ? null : readImage(id)
		]);
		return { project: data, options: choices, image };
	},
	parse(body) {
		return {
			project: parseProject(record(body, 'body').project),
			options: { experiences: [], skills: [] },
			image: null
		};
	},
	write: (data, id) => writeProject(data.project, id)
};

const projects: SectionHandler<EditSections['projects']> = {
	async read() {
		const rows = await writeQuery<{ id: number; name: string; featured: number; organization: string | null }>(
			`SELECT p.id, p.name, p.featured,
				CASE WHEN p.experience_id IS NULL THEN NULL ELSE COALESCE(o.name, t.title, '') END AS organization
			FROM project p
			LEFT JOIN experience e ON e.id = p.experience_id
			LEFT JOIN organization o ON o.id = e.organization_id
			LEFT JOIN experience_i18n t ON t.experience_id = e.id AND t.locale = ?
			ORDER BY p.position, p.id`,
			[baseLocale]
		);
		return {
			items: rows.map((row) => ({
				id: row.id,
				name: row.name,
				organization: row.organization,
				featured: Number(row.featured) === 1
			}))
		};
	},
	parse(body) {
		const parsed = items(body, MAX.projects).map((item, i) => ({
			id: integer(item.id, `items[${i}].id`, 1, 2 ** 32 - 1),
			name: '',
			organization: null,
			featured: bool(item.featured, `items[${i}].featured`)
		}));
		if (new Set(parsed.map((item) => item.id)).size !== parsed.length) throw new EditError('items: duplicate id');
		return { items: parsed };
	},
	async write(data) {
		await writeTransaction(async (tx) => {
			const existing = new Set(
				(await tx.query<{ id: number }>('SELECT id FROM project FOR UPDATE')).map((row) => Number(row.id))
			);
			// The list is the whole set: projects missing from it are deleted. A list naming
			// a project deleted meanwhile is stale and refused.
			const kept = data.items.map((item) => item.id);
			if (kept.some((id) => !existing.has(id))) throw new EditError('items: unknown project');
			const removed = [...existing].filter((id) => !kept.includes(id));
			if (removed.length > 0) {
				await tx.query(`DELETE FROM project WHERE id IN (${removed.map(() => '?').join(', ')})`, removed);
			}
			for (const [i, item] of data.items.entries()) {
				await tx.query('UPDATE project SET position = ?, featured = ? WHERE id = ?', [i + 1, item.featured, item.id]);
			}
		});
		return null;
	}
};

export const projectSections = { project, projects };
