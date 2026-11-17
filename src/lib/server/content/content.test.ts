// Home page and CV page data built from the test database (db/test/fixtures.sql).
import { afterAll, describe, expect, it } from 'vitest';
import { resetPool } from '#lib/server/db/index.js';
import { getCV, getHomeContent, getSiteContact } from './index.js';
import { ageFromIso } from './portfolio.js';

afterAll(async () => {
	await resetPool();
});

describe('getHomeContent', () => {
	it('builds the home page in French', async () => {
		const home = await getHomeContent('fr');
		expect(home).toMatchObject({
			headline: 'Développeuse test',
			bio: 'Bio en français.',
			about: 'À propos en français.',
			email: 'jane@example.com',
			stack: ['TypeScript', 'SvelteKit'],
			works: [{ name: 'Acme Shop', domain: 'acme-shop.example.com', url: 'https://www.acme-shop.example.com' }],
			skills: [
				{ title: 'Langages', items: ['TypeScript', 'SQL'] },
				{ title: 'Frameworks', items: ['SvelteKit'] },
				{ title: 'Outils', items: ['Git'] }
			],
			hobbies: [
				{ name: 'Cuisine', why: 'Rigueur' },
				{ name: 'Lecture', why: 'Concentration' }
			]
		});
		// Computed age first, then the facts shown on the site
		expect(home.facts).toEqual([
			{ label: 'Âge', value: `${ageFromIso('1990-05-15')} ans` },
			{ label: 'Domicile', value: 'Lausanne' },
			{ label: 'Nationalité', value: 'Suisse' }
		]);
	});

	it('lists the experiences shown on the site, most recent first, with readable periods', async () => {
		const fr = await getHomeContent('fr');
		expect(fr.jobs).toEqual([
			{ date: "Janv. 2023 – aujourd'hui", role: 'Développeuse web', org: 'Acme SA' },
			{ date: '2019 – 2022', role: 'Diplôme test', org: 'École Test' }
		]);
		const en = await getHomeContent('en');
		expect(en.jobs[0].date).toBe('Jan 2023 – present');
	});
});

describe('getSiteContact', () => {
	it('returns the e-mail and LinkedIn URL', async () => {
		expect(await getSiteContact('fr')).toEqual({
			email: 'jane@example.com',
			linkedin: 'https://linkedin.com/in/jane-doe'
		});
	});
});

describe('getCV', () => {
	it('keeps the legacy CV format used by the /cv components', async () => {
		const { cv, skills } = await getCV('fr');
		expect(cv.infos.contact).toEqual({
			name: 'Jane Doe',
			email: 'jane@example.com',
			city: '1000 Lausanne',
			age: ageFromIso('1990-05-15')
		});
		expect(cv.infos.socials).toEqual([{ name: 'linkedin', link: 'linkedin.com/in/jane-doe' }]);
		expect(cv.infos.hobbys).toEqual(['Cuisine (rigueur)', 'Lecture (concentration)']);
		expect(cv.jobs.map((job) => job.title)).toEqual(['Développeuse web', 'Employée']);
		expect(cv.formations[0]).toMatchObject({
			name: 'Diplôme test',
			degree: 'Informatique',
			company: 'École Test',
			start: '01.09.2019',
			end: '31.07.2022'
		});
		// Skills referenced by index into the catalog
		const job = cv.jobs[0];
		expect(job.skills.langs.map((i) => skills.langs[i])).toEqual(['TypeScript']);
		expect(job.skills.libs.map((i) => skills.libs[i])).toEqual(['SvelteKit']);
		expect(cv.certificates).toEqual([
			{ title: 'Test Certificate', date: '14.03.2024', link: 'https://example.com/cert' }
		]);
	});
});
