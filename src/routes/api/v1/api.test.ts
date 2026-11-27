// API tests against the test database (db/test/fixtures.sql, recreated by db/test/setup.ts).
import { afterAll, describe, expect, it } from 'vitest';
import type { ApiCertificate, ApiError, ApiExperience, ApiIndex, ApiProfile, ApiProject, ApiSkills } from '#lib/api/types.js';
import { SKILL_LEVELS } from '#lib/cv/skills.js';
import { ageFromIso } from '#lib/server/content/portfolio.js';
import { clearContentCache } from '#lib/server/content/index.js';
import { resetPool } from '#lib/server/db/index.js';
import { reroute } from '../../../hooks.js';
import { GET as getIndex } from './+server.js';
import { GET as getNotFound } from './[...rest]/+server.js';
import { GET as getCertificates } from './certificates/+server.js';
import { GET as getCv } from './cv/+server.js';
import { GET as getExperiences } from './experiences/+server.js';
import { GET as getProfile } from './profile/+server.js';
import { GET as getProjects } from './projects/+server.js';
import { GET as getSkills } from './skills/+server.js';

// Handlers are called directly with a minimal request event: no HTTP server needed.
type Handler = (event: { url: URL; request: Request; params: Record<string, string> }) => Response | Promise<Response>;

async function call<T = unknown>(handler: unknown, path: string, headers: Record<string, string> = {}) {
	const url = new URL(path, 'http://localhost');
	const response = await (handler as Handler)({ url, request: new Request(url, { headers }), params: {} });
	return { response, body: (await response.json()) as T };
}

const endpoints: [string, unknown][] = [
	['/api/v1', getIndex],
	['/api/v1/profile', getProfile],
	['/api/v1/experiences', getExperiences],
	['/api/v1/projects', getProjects],
	['/api/v1/skills', getSkills],
	['/api/v1/certificates', getCertificates],
	['/api/v1/cv', getCv]
];

// Values from db/test/fixtures.sql
const FIXTURE = {
	birthdate: '1990-05-15',
	privateValues: ['Rue Secrète 42', '1990-05-15', '15.05.1990', 'Robert Secret', '+41000000000'],
	experienceIds: ['job-acme-sa-2023-01', 'job-old-corp-2010-02', 'education-ecole-test-2019-09']
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

afterAll(async () => {
	await resetPool();
});

describe('common behaviour', () => {
	it.each(endpoints)('%s answers JSON with public cache and CORS headers', async (path, handler) => {
		const { response } = await call(handler, path);
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
		expect(response.headers.get('cache-control')).toBe('public, max-age=300');
		expect(response.headers.get('access-control-allow-origin')).toBe('*');
		expect(response.headers.get('vary')).toBe('Accept-Language');
	});

	it('index lists exactly the implemented endpoints', async () => {
		const { body } = await call<ApiIndex>(getIndex, '/api/v1');
		expect(body.version).toBe('v1');
		expect(body.locales).toEqual(['fr', 'en']);
		expect(body.endpoints.map((e) => e.path).sort()).toEqual(
			endpoints.map(([path]) => path).filter((path) => path !== '/api/v1').sort()
		);
	});

	it('unknown paths answer a JSON 404', async () => {
		const { response, body } = await call<ApiError>(getNotFound, '/api/v1/nope');
		expect(response.status).toBe(404);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(body.error.status).toBe(404);
		expect(body.error.message).toContain('/api/v1/nope');
	});

	it('/api is never rerouted from a localized URL', () => {
		const reroutePath = (path: string) => reroute({ url: new URL(path, 'http://localhost'), fetch });
		expect(reroutePath('/api/v1/profile')).toBe('/api/v1/profile');
		expect(reroutePath('/en/api/v1')).toBe('/en/api/v1');
		expect(reroutePath('/en/cv')).toBe('/cv');
	});
});

describe('locale', () => {
	it('defaults to French', async () => {
		const { response, body } = await call<ApiProfile>(getProfile, '/api/v1/profile');
		expect(response.headers.get('content-language')).toBe('fr');
		expect(body.bio).toBe('Bio en français.');
	});

	it('uses ?lang', async () => {
		const { response, body } = await call<ApiProfile>(getProfile, '/api/v1/profile?lang=en');
		expect(response.headers.get('content-language')).toBe('en');
		expect(body.bio).toBe('Bio in English.');
		expect(body.hobbies.map((h) => h.name)).toEqual(['Cooking', 'Reading']);
	});

	it('falls back to Accept-Language, honouring q-values', async () => {
		const english = await call(getProfile, '/api/v1/profile', { 'accept-language': 'en-GB,en;q=0.9' });
		expect(english.response.headers.get('content-language')).toBe('en');

		const weighted = await call(getProfile, '/api/v1/profile', { 'accept-language': 'fr;q=0.4,en;q=0.8' });
		expect(weighted.response.headers.get('content-language')).toBe('en');

		const unsupported = await call(getProfile, '/api/v1/profile', { 'accept-language': 'de-CH,de' });
		expect(unsupported.response.headers.get('content-language')).toBe('fr');
	});

	it('?lang wins over Accept-Language', async () => {
		const { response } = await call(getProfile, '/api/v1/profile?lang=fr', { 'accept-language': 'en' });
		expect(response.headers.get('content-language')).toBe('fr');
	});

	it('falls back to French when a translation is missing', async () => {
		const { body } = await call<{ cv: { infos: { others: { title: string }[] } } }>(getCv, '/api/v1/cv?lang=en');
		expect(body.cv.infos.others.map((o) => o.title)).toEqual(['Nationality Swiss', 'Voiture Permis B']);
	});

	it('rejects an unsupported ?lang with a JSON 400', async () => {
		const { response, body } = await call<ApiError>(getProfile, '/api/v1/profile?lang=de');
		expect(response.status).toBe(400);
		expect(body).toEqual({ error: { status: 400, message: expect.stringContaining('"de"') } });
	});
});

describe('/api/v1/profile', () => {
	it('returns the public profile with a computed age', async () => {
		const { body } = await call<ApiProfile>(getProfile, '/api/v1/profile?lang=en');
		expect(body).toMatchObject({
			name: 'Jane Doe',
			email: 'jane@example.com',
			city: '1000 Lausanne',
			age: ageFromIso(FIXTURE.birthdate),
			headline: 'Test developer',
			title: 'CV title',
			socials: [{ network: 'linkedin', url: 'https://linkedin.com/in/jane-doe' }],
			facts: [
				{ label: 'Location', value: 'Lausanne' },
				{ label: 'Nationality', value: 'Swiss' }
			],
			languages: [
				{ name: 'French', level: 'Native', percent: 100 },
				{ name: 'English', level: 'Fluent (B2)', percent: 70 }
			]
		});
	});
});

describe('/api/v1/experiences', () => {
	it('returns jobs and education with ISO dates, ongoing ones without end', async () => {
		const { body } = await call<ApiExperience[]>(getExperiences, '/api/v1/experiences');
		expect(body.map((e) => e.id).sort()).toEqual([...FIXTURE.experienceIds].sort());
		for (const experience of body) {
			expect(experience.start).toMatch(ISO_DATE);
			if (experience.end !== null) expect(experience.end >= experience.start).toBe(true);
		}
		const ongoing = body.find((e) => e.id === 'job-acme-sa-2023-01');
		expect(ongoing).toMatchObject({
			end: null,
			organization: 'Acme SA',
			tasks: ['Développer des API', 'Maintenir des sites'],
			skills: ['TypeScript', 'SvelteKit', 'Git'],
			projectIds: ['acme-shop']
		});
	});

	it.each([
		['job', 2],
		['education', 1]
	] as const)('filters by kind=%s', async (kind, count) => {
		const { body } = await call<ApiExperience[]>(getExperiences, `/api/v1/experiences?kind=${kind}`);
		expect(body).toHaveLength(count);
		expect(body.every((e) => e.kind === kind)).toBe(true);
	});

	it('rejects an unknown kind', async () => {
		const { response } = await call(getExperiences, '/api/v1/experiences?kind=hobby');
		expect(response.status).toBe(400);
	});

	it('keeps the same ids in every locale and translates the content', async () => {
		const fr = await call<ApiExperience[]>(getExperiences, '/api/v1/experiences?lang=fr');
		const en = await call<ApiExperience[]>(getExperiences, '/api/v1/experiences?lang=en');
		expect(en.body.map((e) => e.id)).toEqual(fr.body.map((e) => e.id));
		expect(fr.body.find((e) => e.id === 'job-acme-sa-2023-01')?.title).toBe('Développeuse web');
		expect(en.body.find((e) => e.id === 'job-acme-sa-2023-01')?.title).toBe('Web developer');
	});

	it('links only to existing projects', async () => {
		const experiences = await call<ApiExperience[]>(getExperiences, '/api/v1/experiences');
		const projects = await call<ApiProject[]>(getProjects, '/api/v1/projects');
		const projectIds = new Set(projects.body.map((p) => p.id));
		for (const id of experiences.body.flatMap((e) => e.projectIds)) expect(projectIds).toContain(id);
	});
});

describe('/api/v1/projects', () => {
	it('returns every project, personal ones without experience', async () => {
		const { body } = await call<ApiProject[]>(getProjects, '/api/v1/projects?lang=en');
		// Sorted by position, then insertion order
		expect(body.map((p) => p.id)).toEqual(['acme-shop', 'school-app', 'side-project', 'tiny-app']);
		expect(body.map((p) => p.position)).toEqual([1, 1, 2, 3]);
		expect(body.find((p) => p.id === 'side-project')?.experienceId).toBeNull();
		expect(body.find((p) => p.id === 'acme-shop')).toMatchObject({
			experienceId: 'job-acme-sa-2023-01',
			tasks: ['Development'],
			details: ['SvelteKit, TypeScript'],
			skills: ['SvelteKit']
		});
		// Technologies ordered by category, then position
		expect(body.find((p) => p.id === 'side-project')).toMatchObject({
			skills: ['TypeScript', 'SvelteKit'],
			kind: 'script',
			year: 2024,
			status: 'archived',
			hosting: 'GitHub',
			snippet: '$ side --help'
		});
		expect(body.find((p) => p.id === 'acme-shop')).toMatchObject({ kind: null, year: null, snippet: null });
	});

	it('featured=true returns only the home page projects', async () => {
		const { body } = await call<ApiProject[]>(getProjects, '/api/v1/projects?featured=true');
		expect(body.map((p) => p.id)).toEqual(['acme-shop', 'side-project']);
	});

	it('rejects an invalid featured value', async () => {
		const { response } = await call(getProjects, '/api/v1/projects?featured=yes');
		expect(response.status).toBe(400);
	});
});

describe('/api/v1/skills', () => {
	it('returns every category with recency levels and the stack', async () => {
		const { body } = await call<ApiSkills>(getSkills, '/api/v1/skills?lang=en');
		expect(body.stack).toEqual(['TypeScript', 'SvelteKit']);
		// The categories shown on the CV, in order (business is not)
		expect(body.categories.map((c) => c.code)).toEqual(['langs', 'libs', 'tools']);
		expect(body.categories.map((c) => c.name)).toEqual(['Languages', 'Frameworks', 'Tools']);

		const skills = body.categories.flatMap((c) => c.skills);
		for (const skill of skills) expect(SKILL_LEVELS).toContain(skill.level);
		// Used in the ongoing job → top; only used until 2012 → bottom
		expect(skills.find((s) => s.name === 'TypeScript')?.level).toBe('top');
		expect(skills.find((s) => s.name === 'Cobol')?.level).toBe('bottom');
	});
});

describe('/api/v1/certificates', () => {
	it('returns certificates with ISO dates', async () => {
		const { body } = await call<ApiCertificate[]>(getCertificates, '/api/v1/certificates');
		expect(body).toEqual([{ title: 'Test Certificate', date: '2024-03-14', url: 'https://example.com/cert' }]);
	});
});

describe('/api/v1/cv', () => {
	it('returns the public CV in the /cv page format', async () => {
		const { body } = await call<{
			cv: { infos: Record<string, unknown> & { contact: Record<string, unknown> }; jobs: { start: string }[] };
			skills: { langs: string[] };
			levels: { code: string; skills: { name: string; level: string }[] }[];
		}>(getCv, '/api/v1/cv');
		const langs = body.levels.find((category) => category.code === 'langs');
		expect(langs?.skills.find((s) => s.name === 'TypeScript')?.level).toBe('top');
		expect(body.cv.infos).not.toHaveProperty('references');
		expect(body.cv.infos.contact).not.toHaveProperty('address');
		expect(body.cv.infos.contact.age).toBe(ageFromIso(FIXTURE.birthdate));
		expect(body.cv.jobs.map((j) => j.start)).toContain('01.01.2023');
		expect(body.skills.langs).toEqual(['TypeScript', 'SQL', 'Cobol']);
	});
});

describe('privacy', () => {
	it.each(endpoints)('%s never exposes the address, birthdate or references', async (path, handler) => {
		for (const lang of ['fr', 'en']) {
			const { body } = await call(handler, `${path}?lang=${lang}`);
			const text = JSON.stringify(body);
			for (const secret of FIXTURE.privateValues) expect(text).not.toContain(secret);
		}
	});
});

describe('database failure', () => {
	it('answers a JSON 500 when the database is unreachable', async () => {
		const port = process.env.DB_PORT;
		process.env.DB_PORT = '1';
		clearContentCache();
		await resetPool();
		try {
			const { response, body } = await call<ApiError>(getProfile, '/api/v1/profile');
			expect(response.status).toBe(500);
			expect(body.error.status).toBe(500);
		} finally {
			process.env.DB_PORT = port;
			clearContentCache();
			await resetPool();
		}
	});
});
