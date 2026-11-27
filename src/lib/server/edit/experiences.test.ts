// Experience editor against the test database (db/test/fixtures.sql).
// Every test restores what it changes: other test files read the same fixtures.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { NEW_ORGANIZATION, NO_ORGANIZATION, type EditSections, type ExperienceEdit } from '#lib/content/edit.js';
import { clearContentCache, getCV, getHiddenJourney, getHomeContent } from '#lib/server/content/index.js';
import { resetPool, writeQuery } from '#lib/server/db/index.js';
import { EditError, parseSection, readSection, removeFromSection, writeSection } from './index.js';

const saved = new Map<number, EditSections['experience']>();

beforeAll(async () => {
	for (const id of [1, 2, 3]) saved.set(id, await readSection('experience', id));
});

afterEach(async () => {
	await writeQuery('DELETE FROM experience WHERE id > 3');
	await writeQuery('DELETE FROM organization WHERE id > 3');
	for (const [id, data] of saved) await writeSection('experience', data, id);
	clearContentCache();
});

afterAll(async () => {
	await resetPool();
});

const job = (change: Partial<ExperienceEdit> = {}): ExperienceEdit => ({
	kind: 'job',
	organizationId: NEW_ORGANIZATION,
	newOrganization: 'Nouvelle SA',
	start: '2015-03-01',
	end: '2016-02-29',
	onSite: true,
	title: { fr: 'Stagiaire', en: '' },
	degree: { fr: 'ignored', en: '' },
	tasks: [{ fr: 'Tâche', en: 'Task' }],
	skillIds: [5],
	...change
});

/** Parses like the route does, then saves */
const save = (experience: ExperienceEdit, id: number | null) =>
	writeSection('experience', parseSection('experience', { experience }), id);

describe('experience section', () => {
	it('reads an experience with its choices and projects', async () => {
		const data = saved.get(1)!;
		expect({ ...data.experience, skillIds: [...data.experience.skillIds].sort() }).toEqual({
			kind: 'job',
			organizationId: 1,
			newOrganization: '',
			start: '2023-01-01',
			end: '',
			onSite: true,
			title: { fr: 'Développeuse web', en: 'Web developer' },
			degree: { fr: '', en: '' },
			tasks: [
				{ fr: 'Développer des API', en: 'Build APIs' },
				expect.objectContaining({ fr: expect.any(String) })
			],
			skillIds: [1, 4, 5]
		});
		expect(data.projects).toEqual(['Acme Shop']);
		expect(data.options.organizations.find((organization) => organization.id === 1)).toEqual({
			id: 1,
			name: 'Acme SA',
			logo: { file: 'fedcba9876543210fedcba9876543210.svg', url: '/media/fedcba9876543210fedcba9876543210.svg' }
		});
		expect((await readSection('experience', null)).experience).toMatchObject({ organizationId: NO_ORGANIZATION, start: '' });
		await expect(readSection('experience', 999)).rejects.toThrow(EditError);
	});

	it('refuses invalid experiences', () => {
		const invalid: Partial<Record<keyof ExperienceEdit, unknown>>[] = [
			{ kind: 'hobby' },
			{ start: '2023-02-30' },
			{ start: '01.03.2015' },
			{ end: '2014-01-01' },
			{ newOrganization: ' ' },
			{ organizationId: -2 },
			{ title: { fr: '', en: 'Intern' } },
			{ skillIds: [0] }
		];
		for (const change of invalid) {
			expect(() => parseSection('experience', { experience: { ...job(), ...change } }), JSON.stringify(change)).toThrow(
				EditError
			);
		}
		// Only education keeps a degree; the new organization name is dropped for an existing one
		expect(parseSection('experience', { experience: job({ organizationId: 2 }) }).experience.newOrganization).toBe('');
	});

	it('updates an experience shown on the home page and the CV', async () => {
		const education = structuredClone(saved.get(3)!.experience);
		await save({ ...education, onSite: false, title: { fr: 'Diplôme modifié', en: '' }, degree: { fr: 'Info', en: 'IT' } }, 3);
		clearContentCache();
		expect((await getHomeContent('fr')).jobs.map((row) => row.experienceId)).toEqual([1]);
		expect((await getHiddenJourney('en')).map((row) => [row.experienceId, row.role])).toEqual([
			[3, 'Diplôme modifié'],
			[2, 'Employee']
		]);
		expect((await getCV('en')).cv.formations[0]).toMatchObject({ name: 'Diplôme modifié', degree: 'IT' });
	});

	it('creates an experience with a new organization, the CV order following the dates', async () => {
		const id = await save(job(), null);
		const [organization] = await writeQuery<{ id: number }>("SELECT id FROM organization WHERE name = 'Nouvelle SA'");
		expect((await readSection('experience', id)).experience).toMatchObject({
			organizationId: organization.id,
			degree: { fr: '', en: '' }
		});
		clearContentCache();
		expect((await getCV('fr')).cv.jobs.map((entry) => entry.title)).toEqual(['Développeuse web', 'Stagiaire', 'Employée']);

		// A "new" organization named like an existing one reuses it
		const again = await save(job({ newOrganization: 'Acme SA', start: '2016-01-01', end: '' }), null);
		expect((await readSection('experience', again)).experience.organizationId).toBe(1);
	});

	it('deletes an experience, unless projects are attached to it', async () => {
		await expect(removeFromSection('experience', 1)).rejects.toMatchObject({ status: 409 });
		await expect(removeFromSection('experience', 999)).rejects.toMatchObject({ status: 404 });
		const id = await save(job({ organizationId: NO_ORGANIZATION }), null);
		await removeFromSection('experience', id!);
		await expect(readSection('experience', id)).rejects.toThrow(EditError);
		await expect(removeFromSection('skills', 1)).rejects.toThrow(EditError);
	});
});
