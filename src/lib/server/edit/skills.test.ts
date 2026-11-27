// Skill catalog editor against the test database (db/test/fixtures.sql).
// Deleting a skill also deletes its links: every test restores the catalog and the links.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { EditSections } from '#lib/content/edit.js';
import { clearContentCache, getHomeContent } from '#lib/server/content/index.js';
import { resetPool, writeQuery } from '#lib/server/db/index.js';
import { EditError, parseSection, readSection, writeSection } from './index.js';

type Rows = Record<string, unknown>[];
const saved: Record<string, Rows> = {};
// In insertion order (foreign keys)
const TABLES = ['skill_category', 'skill', 'project_skill', 'experience_skill', 'skill_category_i18n'] as const;

async function insertAll(table: string, rows: Rows) {
	for (const row of rows) {
		const columns = Object.keys(row);
		await writeQuery(
			`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
			Object.values(row)
		);
	}
}

beforeAll(async () => {
	for (const table of TABLES) saved[table] = await writeQuery(`SELECT * FROM ${table}`);
});

afterEach(async () => {
	await writeQuery('DELETE FROM skill'); // cascades to the links
	await writeQuery('DELETE FROM skill_category'); // cascades to the names
	for (const table of TABLES) await insertAll(table, saved[table]);
	clearContentCache();
});

afterAll(async () => {
	await resetPool();
});

/** Parses like the route does, then saves */
const save = (data: unknown) => writeSection('skills', parseSection('skills', data));
const skillNames = (data: EditSections['skills']) => data.categories.map((category) => category.skills.map((skill) => skill.name));

describe('skills section', () => {
	it('reads every category with its skills and their uses', async () => {
		const { categories } = await readSection('skills');
		expect(categories.map((category) => category.name)).toEqual([
			{ fr: 'Langages', en: 'Languages' },
			{ fr: 'Frameworks', en: 'Frameworks' },
			{ fr: 'Outils', en: 'Tools' },
			{ fr: 'Métier', en: 'Business' }
		]);
		expect(categories[0].skills).toEqual([
			// Project 3, experiences 1 and 3
			// Levels as on the CV: ongoing job, education ended in 2022, job ended in 2012
			{ id: 1, name: 'TypeScript', inStack: true, onSite: true, onCv: true, uses: 3, level: 'top', personalOnly: false },
			{ id: 2, name: 'SQL', inStack: false, onSite: true, onCv: true, uses: 1, level: 'mid', personalOnly: false },
			{ id: 3, name: 'Cobol', inStack: false, onSite: false, onCv: true, uses: 1, level: 'bottom', personalOnly: false }
		]);
	});

	it('renames, swaps, moves, adds and orders skills, keeping their links', async () => {
		const data = await readSection('skills');
		const [langs, libs, tools] = data.categories;
		// Swapping two names inside a category must not hit the unique (category, name) key
		langs.skills[0].name = 'Cobol';
		langs.skills[2].name = 'TypeScript';
		langs.skills[1].name = 'PostgreSQL';
		// Git moves to the languages, first; a new skill goes to the stack
		langs.skills.unshift(tools.skills.pop()!);
		libs.skills.push({ id: null, name: 'Svelte', inStack: true, onSite: true, onCv: true, uses: 0, level: null, personalOnly: false });
		libs.name = { fr: 'Bibliothèques', en: '' };
		await save(data);

		const after = await readSection('skills');
		expect(skillNames(after)).toEqual([['Git', 'Cobol', 'PostgreSQL', 'TypeScript'], ['SvelteKit', 'Svelte'], [], []]);
		// Same ids, same links: id 1 (renamed Cobol) is still used 3 times
		expect(after.categories[0].skills[1]).toMatchObject({ id: 1, name: 'Cobol', uses: 3 });
		clearContentCache();
		const home = await getHomeContent('en');
		// Id 1 keeps its "Stack" flag under its new name; Git is not in the stack
		expect(home.stack).toEqual(['Cobol', 'SvelteKit', 'Svelte']);
		// The English name is empty: falls back to French
		expect(home.skills.map((group) => group.title)).toEqual(['Languages', 'Bibliothèques']);
	});

	it('removes a deleted skill from the projects and experiences using it', async () => {
		const data = await readSection('skills');
		data.categories[1].skills = []; // SvelteKit
		await save(data);
		const links = await writeQuery('SELECT * FROM project_skill WHERE skill_id = 4 UNION ALL SELECT * FROM experience_skill WHERE skill_id = 4');
		expect(links).toEqual([]);
		clearContentCache();
		expect((await getHomeContent('fr')).works[0].skills).toEqual([]);
	});

	it('refuses duplicates, unknown categories and unknown skills', async () => {
		const data = await readSection('skills');
		const twice = structuredClone(data);
		twice.categories[0].skills[1].name = ' typescript ';
		expect(() => parseSection('skills', twice)).toThrow(EditError);
		const sameId = structuredClone(data);
		sameId.categories[1].skills.push(sameId.categories[0].skills[0]);
		expect(() => parseSection('skills', sameId)).toThrow(EditError);

		const unknownCategory = structuredClone(data);
		unknownCategory.categories[3].id = 999;
		await expect(save(unknownCategory)).rejects.toThrow(EditError);
		const unknown = structuredClone(data);
		unknown.categories[0].skills[0].id = 999;
		await expect(save(unknown)).rejects.toThrow(EditError);
		// Nothing written
		expect(await readSection('skills')).toEqual(data);
	});

	it('adds, reorders and removes categories, and keeps site-only skills off the CV', async () => {
		const data = await readSection('skills');
		expect(data.categories.map((category) => [category.code, category.onCv])).toEqual([
			['langs', true],
			['libs', true],
			['tools', true],
			['business', false]
		]);
		const [langs, libs, tools] = data.categories;
		// A new "Bibliothèques" category takes SvelteKit, right after the languages
		const added = { id: null, code: '', name: { fr: 'Bibliothèques', en: 'Libraries' }, onCv: true, skills: libs.skills.splice(0) };
		// Git stays on the site only; the empty business category goes (left out)
		tools.skills[0].onCv = false;
		await save({ categories: [langs, added, libs, tools] });

		const after = await readSection('skills');
		expect(after.categories.map((category) => category.code)).toEqual(['langs', 'bibliotheques', 'libs', 'tools']);
		expect(after.categories[1].skills.map((skill) => [skill.id, skill.uses])).toEqual([[4, 3]]);

		clearContentCache();
		const { getCV } = await import('#lib/server/content/index.js');
		const { levels } = await getCV('en');
		// One CV column per category on the CV, in order; Git is off the CV
		expect(levels.map((column) => [column.name, column.skills.map((skill) => skill.name)])).toEqual([
			// Jobs first, then education (SQL)
			['Languages', ['TypeScript', 'Cobol', 'SQL']],
			['Libraries', ['SvelteKit']],
			['Frameworks', []],
			['Tools', []]
		]);
		// Still on the site
		expect((await getHomeContent('en')).skills.at(-1)).toEqual({ title: 'Tools', items: ['Git'] });
	});

	it('removes categories once their skills moved, never two with the same id', async () => {
		const data = await readSection('skills');
		const kept = data.categories.slice(0, 1);
		kept[0].skills.push(...data.categories[1].skills, ...data.categories[2].skills);
		// Removing categories whose skills moved is fine
		await save({ categories: [...kept, data.categories[3]] });
		expect((await readSection('skills')).categories.map((category) => category.code)).toEqual(['langs', 'business']);

		const twice = await readSection('skills');
		expect(() => parseSection('skills', { categories: [twice.categories[0], twice.categories[0]] })).toThrow(EditError);
	});
});
