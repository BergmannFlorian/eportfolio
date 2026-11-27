// Project editor against the test database (db/test/fixtures.sql).
// Every test restores what it changes: other test files read the same fixtures
// (the API tests check the exact positions).
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { EditSections, ProjectEdit } from '#lib/content/edit.js';
import { clearContentCache, getHomeContent, getPersonalProjects } from '#lib/server/content/index.js';
import { resetPool, writeQuery } from '#lib/server/db/index.js';
import { EditError, parseSection, readSection, writeSection } from './index.js';

let positions: { id: number; position: number; featured: number }[];
let side: EditSections['project'];

beforeAll(async () => {
	positions = await writeQuery('SELECT id, position, featured FROM project ORDER BY id');
	side = await readSection('project', 3);
});

afterEach(async () => {
	// Back to the fixtures: projects created by a test, project 3, order and selection
	await writeQuery('DELETE FROM project WHERE id > 4');
	await writeSection('project', side, 3);
	for (const row of positions) {
		await writeQuery('UPDATE project SET position = ?, featured = ? WHERE id = ?', [row.position, row.featured, row.id]);
	}
	clearContentCache();
});

afterAll(async () => {
	await resetPool();
});

const valid = (): ProjectEdit => ({
	name: 'New tool',
	url: 'https://tool.example.com',
	experienceId: null,
	featured: true,
	kind: 'script',
	year: 2025,
	status: 'online',
	hosting: 'GitHub',
	snippet: '$ tool',
	tasks: [{ fr: 'Un outil', en: '' }],
	details: [],
	skillIds: [1]
});

describe('project section', () => {
	it('reads a project with its texts, technologies and the editor choices', async () => {
		const { project, options } = side;
		expect({ ...project, skillIds: [...project.skillIds].sort() }).toEqual({
			name: 'Side Project',
			url: 'https://side.example.com',
			experienceId: null,
			featured: true,
			kind: 'script',
			year: 2024,
			status: 'archived',
			hosting: 'GitHub',
			snippet: '$ side --help',
			tasks: [{ fr: 'Application de test', en: 'Test app' }],
			details: [{ fr: 'Point clé', en: 'Highlight' }],
			skillIds: [1, 4]
		});
		expect(options.experiences[0]).toEqual({ id: 1, label: 'Développeuse web · Acme SA · 2023' });
		expect(options.skills.map((skill) => skill.name)).toEqual(['TypeScript', 'SQL', 'Cobol', 'SvelteKit', 'Git']);
		expect(options.skills[0].category).toBe('Langages');
		// The current image comes with the project, to show it in the same dialog
		expect(side.image).toBeNull();
		expect((await readSection('project', 1)).image).toEqual({
			file: 'abcdefabcdefabcdefabcdefabcdefab.webp',
			url: '/media/abcdefabcdefabcdefabcdefabcdefab.webp',
			alt: { fr: 'Boutique Acme', en: 'Acme shop' }
		});
		// A new project starts empty and featured
		expect(await readSection('project', null)).toMatchObject({
			project: { name: '', featured: true, tasks: [] },
			image: null
		});
		await expect(readSection('project', 999)).rejects.toThrow(EditError);
	});

	it('refuses invalid projects', () => {
		const invalid: Partial<Record<keyof ProjectEdit, unknown>>[] = [
			{ name: ' ' },
			{ url: 'javascript:alert(1)' },
			{ url: 'not a url' },
			{ kind: 'game' },
			{ status: 'done' },
			{ year: 1800 },
			{ skillIds: ['1'] },
			{ tasks: [{ fr: '', en: 'Only English' }] },
			{ featured: 'yes' }
		];
		for (const change of invalid) {
			expect(() => parseSection('project', { project: { ...valid(), ...change } }), JSON.stringify(change)).toThrow(
				EditError
			);
		}
		expect(parseSection('project', { project: { ...valid(), url: '', kind: '', status: '', year: null } }).project).toMatchObject({
			url: '',
			kind: '',
			year: null
		});
	});

	it('updates a project shown on the pages', async () => {
		await writeSection(
			'project',
			parseSection('project', {
				project: {
					...side.project,
					name: 'Side Project 2',
					tasks: [{ fr: 'Deuxième', en: '' }, ...side.project.tasks],
					details: [],
					skillIds: [5]
				}
			}),
			3
		);
		clearContentCache();
		const [personal] = await getPersonalProjects('en');
		expect(personal).toMatchObject({
			name: 'Side Project 2',
			// Empty English falls back to French
			description: 'Deuxième Test app',
			skills: ['Git'],
			hasMore: true
		});
		expect((await getHomeContent('fr')).personalWorks[0].name).toBe('Side Project 2');
	});

	it('refuses unknown experiences or skills and writes nothing', async () => {
		for (const change of [{ experienceId: 999 }, { skillIds: [1, 999] }]) {
			await expect(writeSection('project', { ...side, project: { ...side.project, name: 'Changed', ...change } }, 3)).rejects.toThrow(
				EditError
			);
		}
		expect((await readSection('project', 3)).project.name).toBe('Side Project');
	});

	it('creates a project at the end of the list', async () => {
		const id = await writeSection('project', parseSection('project', { project: valid() }), null);
		expect(id).toBeGreaterThan(4);
		const { items } = await readSection('projects');
		expect(items.at(-1)).toEqual({ id, name: 'New tool', organization: null, featured: true });
		clearContentCache();
		expect((await getHomeContent('en')).personalWorks.map((work) => work.name)).toEqual(['Side Project', 'New tool']);
	});
});

describe('projects section', () => {
	it('lists every project with its organization', async () => {
		expect((await readSection('projects')).items).toEqual([
			{ id: 1, name: 'Acme Shop', organization: 'Acme SA', featured: true },
			{ id: 2, name: 'School App', organization: 'École Test', featured: false },
			{ id: 3, name: 'Side Project', organization: null, featured: true },
			{ id: 4, name: 'Tiny App', organization: null, featured: false }
		]);
	});

	it('reorders, selects and deletes projects in one go', async () => {
		const id = await writeSection('project', parseSection('project', { project: valid() }), null);
		const { items } = await readSection('projects');
		const kept = items.filter((item) => item.id !== id).reverse();
		kept[0].featured = true; // Tiny App
		await writeSection('projects', parseSection('projects', { items: kept }));
		expect((await readSection('projects')).items.map((item) => [item.name, item.featured])).toEqual([
			['Tiny App', true],
			['Side Project', true],
			['School App', false],
			['Acme Shop', true]
		]);
		await expect(readSection('project', id!)).rejects.toThrow(EditError);
		clearContentCache();
		expect((await getHomeContent('fr')).personalWorks.map((work) => work.name)).toEqual(['Tiny App', 'Side Project']);
	});

	it('refuses a list naming an unknown project', async () => {
		const { items } = await readSection('projects');
		await expect(writeSection('projects', { items: [...items, { id: 999, name: '', organization: null, featured: false }] })).rejects.toThrow(
			EditError
		);
		expect(() => parseSection('projects', { items: [items[0], items[0]] })).toThrow(EditError);
		expect((await readSection('projects')).items).toHaveLength(4);
	});
});
