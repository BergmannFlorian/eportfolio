// CV-only content editor against the test database (db/test/fixtures.sql).
// Every test restores what it changes: other test files read the same fixtures.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { EditSections } from '#lib/content/edit.js';
import { clearContentCache, getCV, getSiteContact } from '#lib/server/content/index.js';
import { resetPool, writeQuery } from '#lib/server/db/index.js';
import { EditError, parseSection, readSection, writeSection } from './index.js';

let before: { cv: EditSections['cv']; certificates: EditSections['certificates']; socials: EditSections['socials'] };

beforeAll(async () => {
	before = {
		cv: await readSection('cv'),
		certificates: await readSection('certificates'),
		socials: await readSection('socials')
	};
});

afterEach(async () => {
	await writeSection('cv', before.cv);
	await writeSection('certificates', before.certificates);
	await writeSection('socials', before.socials);
	clearContentCache();
});

afterAll(async () => {
	await resetPool();
});

describe('cv section', () => {
	it('reads the CV heading, name and city, never the address', async () => {
		expect(before.cv).toEqual({
			name: 'Jane Doe',
			postalCode: '1000',
			city: 'Lausanne',
			cvTitle: { fr: 'Titre du CV', en: 'CV title' }
		});
	});

	it('updates them without touching the address, the bio or the other person texts', async () => {
		const [private_before] = await writeQuery('SELECT address, birthdate FROM person WHERE id = 1');
		const [texts_before] = await writeQuery("SELECT bio, about, photo_alt FROM person_i18n WHERE person_id = 1 AND locale = 'fr'");
		await writeSection(
			'cv',
			parseSection('cv', { name: 'Jane Smith', postalCode: '', city: 'Genève', cvTitle: { fr: 'Ligne 1\nLigne 2', en: '' } })
		);
		clearContentCache();
		const { cv } = await getCV('en');
		expect(cv.infos.contact).toMatchObject({ name: 'Jane Smith', city: 'Genève' });
		// Empty English falls back to French, line breaks kept
		expect(cv.infos.title).toBe('Ligne 1\nLigne 2');
		expect((await writeQuery('SELECT address, birthdate FROM person WHERE id = 1'))[0]).toEqual(private_before);
		expect(
			(await writeQuery("SELECT bio, about, photo_alt FROM person_i18n WHERE person_id = 1 AND locale = 'fr'"))[0]
		).toEqual(texts_before);
	});

	it('refuses a missing name or French heading', () => {
		expect(() => parseSection('cv', { ...before.cv, name: ' ' })).toThrow(EditError);
		expect(() => parseSection('cv', { ...before.cv, cvTitle: { fr: '', en: 'CV' } })).toThrow(EditError);
		expect(() => parseSection('cv', { ...before.cv, postalCode: '12345678901' })).toThrow(EditError);
	});
});

describe('certificates section', () => {
	it('replaces the certificates, sorted by date on the CV', async () => {
		expect(before.certificates.items).toEqual([
			{ title: 'Test Certificate', issuer: 'Example Org', issuedOn: '2024-03-14', url: 'https://example.com/cert' }
		]);
		await writeSection(
			'certificates',
			parseSection('certificates', {
				items: [
					{ title: 'Newer', issuer: '', issuedOn: '2025-01-02', url: '' },
					{ title: 'Older', issuer: 'Org', issuedOn: '2020-06-30', url: 'https://example.com/old' }
				]
			})
		);
		clearContentCache();
		expect((await getCV('fr')).cv.certificates).toEqual([
			{ title: 'Older', date: '30.06.2020', link: 'https://example.com/old' },
			{ title: 'Newer', date: '02.01.2025', link: '' }
		]);
	});

	it('refuses invalid certificates', () => {
		for (const item of [
			{ title: '', issuedOn: '2024-01-01' },
			{ title: 'A', issuedOn: '2024-13-01' },
			{ title: 'A', issuedOn: '2024-01-01', url: 'javascript:alert(1)' }
		]) {
			expect(() => parseSection('certificates', { items: [item] }), JSON.stringify(item)).toThrow(EditError);
		}
	});
});

describe('socials section', () => {
	it('replaces the links in order; the site footer uses the "linkedin" one', async () => {
		await writeSection(
			'socials',
			parseSection('socials', {
				items: [
					{ network: 'GitHub', url: 'https://github.com/jane' },
					{ network: 'linkedin', url: 'https://linkedin.com/in/jane-smith' }
				]
			})
		);
		clearContentCache();
		expect((await getCV('fr')).cv.infos.socials).toEqual([
			{ name: 'github', link: 'github.com/jane' },
			{ name: 'linkedin', link: 'linkedin.com/in/jane-smith' }
		]);
		expect((await getSiteContact('fr')).linkedin).toBe('https://linkedin.com/in/jane-smith');
	});

	it('refuses invalid links', () => {
		for (const item of [
			{ network: 'linked in', url: 'https://example.com' },
			{ network: 'github', url: '' },
			{ network: 'github', url: 'ftp://example.com' }
		]) {
			expect(() => parseSection('socials', { items: [item] }), JSON.stringify(item)).toThrow(EditError);
		}
	});
});
