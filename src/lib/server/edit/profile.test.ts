// Profile editor (home page) against the test database (db/test/fixtures.sql).
// Every test restores what it changes: other test files read the same fixtures.
import { afterAll, describe, expect, it } from 'vitest';
import type { EditSection, EditSections } from '#lib/content/edit.js';
import { clearContentCache, getCV, getHomeContent } from '#lib/server/content/index.js';
import { resetPool, writeQuery } from '#lib/server/db/index.js';
import { EditError, parseSection, readSection, writeSection } from './index.js';

afterAll(async () => {
	clearContentCache();
	await resetPool();
});

/** Runs `change`, then puts the section back as it was */
async function withRestore<S extends EditSection>(section: S, change: (before: EditSections[S]) => Promise<void>) {
	const before = await readSection(section);
	try {
		await change(structuredClone(before));
	} finally {
		await writeSection(section, before);
		clearContentCache();
	}
}

describe('readSection', () => {
	it('returns every locale as stored, without fallback', async () => {
		expect(await readSection('hero')).toEqual({
			email: 'jane@example.com',
			headline: { fr: 'Développeuse test', en: 'Test developer' },
			bio: { fr: 'Bio en français.', en: 'Bio in English.' }
		});
		const { items } = await readSection('facts');
		expect(items.map((fact) => fact.label)).toEqual([
			{ fr: 'Domicile', en: 'Location' },
			{ fr: 'Nationalité', en: 'Nationality' },
			// No English row in the fixtures
			{ fr: 'Voiture', en: '' }
		]);
		expect(items[0]).toMatchObject({ icon: '', onSite: true, onCv: false });
		expect((await readSection('languages')).items[1]).toEqual({
			code: 'en',
			name: { fr: 'Anglais', en: 'English' },
			cefr: 'B2',
			// The CEFR code is added on display, not stored in the label
			level: { fr: 'Courant', en: 'Fluent' }
		});
	});
});

describe('parseSection', () => {
	const hero = { email: 'a@b.ch', headline: { fr: 'Titre', en: '' }, bio: { fr: ' Bio ', en: 'Bio' } };
	const language = { code: 'DE', name: { fr: 'Allemand', en: '' }, cefr: 'a2', level: { fr: 'Scolaire', en: '' } };

	it('trims texts and normalizes codes', () => {
		expect(parseSection('hero', hero).bio).toEqual({ fr: 'Bio', en: 'Bio' });
		expect(parseSection('languages', { items: [language] }).items[0]).toMatchObject({ code: 'de', cefr: 'A2' });
	});

	it('refuses missing French, invalid values and unknown shapes', () => {
		const invalid: [EditSection, unknown][] = [
			['hero', { ...hero, headline: { fr: ' ', en: 'Title' } }],
			['hero', { ...hero, email: 'not-an-email' }],
			['hero', { ...hero, bio: { fr: 'x'.repeat(2001), en: '' } }],
			['about', { about: 'text' }],
			['facts', { items: [{ icon: '<b>', onSite: true, onCv: true, label: { fr: 'A' }, value: { fr: 'B' } }] }],
			['facts', { items: 'nope' }],
			['languages', { items: [language, { ...language, code: 'de' }] }],
			['languages', { items: [{ ...language, cefr: 'D1' }] }],
			['languages', { items: [{ ...language, cefr: '' }] }],
			['languages', { items: [{ ...language, code: 'deu1' }] }],
			['hobbies', { items: Array.from({ length: 31 }, () => ({ name: { fr: 'x' }, reason: {} })) }],
			['hobbies', null]
		];
		for (const [section, body] of invalid) {
			expect(() => parseSection(section, body), JSON.stringify(body).slice(0, 80)).toThrow(EditError);
		}
	});

	it('accepts an optional hobby reason', () => {
		expect(parseSection('hobbies', { items: [{ name: { fr: 'Vélo' }, reason: {} }] }).items[0].reason).toEqual({
			fr: '',
			en: ''
		});
	});
});

describe('writeSection', () => {
	it('updates the hero texts without touching the other person texts', async () => {
		await withRestore('hero', async (hero) => {
			const [before] = await writeQuery<{ cv_title: string; photo_alt: string }>(
				"SELECT cv_title, photo_alt FROM person_i18n WHERE person_id = 1 AND locale = 'fr'"
			);
			await writeSection('hero', { ...hero, headline: { fr: 'Nouveau titre', en: '' } });
			clearContentCache();
			expect((await getHomeContent('fr')).headline).toBe('Nouveau titre');
			// Empty English falls back to French
			expect((await getHomeContent('en')).headline).toBe('Nouveau titre');
			const [after] = await writeQuery("SELECT cv_title, photo_alt FROM person_i18n WHERE person_id = 1 AND locale = 'fr'");
			expect(after).toEqual(before);
		});
	});

	it('replaces a list in the given order, each translation falling back field by field', async () => {
		await withRestore('hobbies', async ({ items }) => {
			await writeSection('hobbies', {
				items: [{ name: { fr: 'Vélo', en: '' }, reason: { fr: 'Endurance', en: 'Stamina' } }, items[1], items[0]]
			});
			clearContentCache();
			expect((await getHomeContent('en')).hobbies).toEqual([
				{ name: 'Vélo', why: 'Stamina' },
				{ name: 'Reading', why: 'Focus' },
				{ name: 'Cooking', why: 'Rigour' }
			]);
			expect((await getCV('fr')).cv.infos.hobbys[0]).toBe('Vélo (endurance)');
		});
	});

	it('shares language names and keeps the facts flags', async () => {
		await withRestore('languages', async ({ items }) => {
			await withRestore('facts', async (facts) => {
				facts.items.reverse();
				facts.items[0].onSite = true;
				await writeSection('facts', facts);
				await writeSection('languages', {
					items: [
						...items,
						{ code: 'de', name: { fr: 'Allemand', en: 'German' }, cefr: 'A2', level: { fr: 'Scolaire', en: '' } }
					]
				});
				clearContentCache();
				const home = await getHomeContent('en');
				// The bar follows the CEFR level
				expect(home.languages.at(-1)).toEqual({ name: 'German', level: 'Scolaire (A2)', percent: 30 });
				// Age first, then the facts shown on the site, in the new order
				expect(home.facts.slice(1).map((fact) => fact.label)).toEqual(['Voiture', 'Nationality', 'Location']);
			});
		});
	});

	it('writes nothing when a statement fails', async () => {
		const before = await readSection('languages');
		const broken = { ...before.items[0], code: 'xx', level: { fr: 'x'.repeat(200), en: '' } };
		// Bypasses parseSection: the too long level fails after the first rows were written
		await expect(writeSection('languages', { items: [before.items[1], broken] })).rejects.toThrow();
		expect(await readSection('languages')).toEqual(before);
	});
});

describe('language levels', () => {
	it('shows the CEFR code after the optional label, whatever the label says', async () => {
		const { levelText } = await import('#lib/content/cefr.js');
		expect(levelText('B1', 'Technique (B1)', 'Langue maternelle')).toBe('Technique (B1)');
		// An outdated code in the label is replaced by the real level
		expect(levelText('B2', 'Technique (B1)', 'Langue maternelle')).toBe('Technique (B2)');
		expect(levelText('C1', '', 'Langue maternelle')).toBe('C1');
		expect(levelText('native', '', 'Langue maternelle')).toBe('Langue maternelle');
		expect(levelText('native', 'Maternelle', 'Langue maternelle')).toBe('Maternelle');
		// Outside the scale (older data): the label as is
		expect(levelText('fluent', 'Courant', 'Langue maternelle')).toBe('Courant');
	});
});
