import { describe, expect, it } from 'vitest';
import type { ApiError, ApiExperience, ApiIndex, ApiProfile, ApiProject, ApiSkills } from '#lib/api/types.js';
import { ageFrom } from '#lib/cv/helpers.js';
import { SKILL_CATEGORIES, SKILL_LEVELS } from '#lib/cv/skills.js';
import privateSource from '#lib/server/cv/fr.json';
import { reroute } from '../../../hooks.js';
import { GET as getIndex } from './+server.js';
import { GET as getNotFound } from './[...rest]/+server.js';
import { GET as getCertificates } from './certificates/+server.js';
import { GET as getCv } from './cv/+server.js';
import { GET as getExperiences } from './experiences/+server.js';
import { GET as getProfile } from './profile/+server.js';
import { GET as getProjects } from './projects/+server.js';
import { GET as getSkills } from './skills/+server.js';

// Handlers are called directly with a minimal request event: no server needed.
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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

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
		const { response } = await call(getProfile, '/api/v1/profile');
		expect(response.headers.get('content-language')).toBe('fr');
	});

	it('uses ?lang', async () => {
		const fr = await call<ApiProfile>(getProfile, '/api/v1/profile?lang=fr');
		const en = await call<ApiProfile>(getProfile, '/api/v1/profile?lang=en');
		expect(en.response.headers.get('content-language')).toBe('en');
		expect(en.body.bio).not.toBe(fr.body.bio);
		expect(en.body.hobbies.map((h) => h.name)).toContain('Cooking');
		expect(fr.body.hobbies.map((h) => h.name)).toContain('Cuisine');
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

	it('rejects an unsupported ?lang with a JSON 400', async () => {
		const { response, body } = await call<ApiError>(getProfile, '/api/v1/profile?lang=de');
		expect(response.status).toBe(400);
		expect(body).toEqual({ error: { status: 400, message: expect.stringContaining('"de"') } });
	});
});

describe('/api/v1/profile', () => {
	it('returns the public profile with a computed age', async () => {
		const { body } = await call<ApiProfile>(getProfile, '/api/v1/profile');
		expect(body.name).toBe('Florian Bergmann');
		expect(body.age).toBe(ageFrom(privateSource.infos.contact.age));
		expect(body.socials.every((s) => s.url.startsWith('https://'))).toBe(true);
		expect(body.languages.every((l) => l.percent >= 0 && l.percent <= 100)).toBe(true);
		expect(body.facts.length).toBeGreaterThan(0);
	});
});

describe('/api/v1/experiences', () => {
	it('returns jobs and education with ISO dates', async () => {
		const { body } = await call<ApiExperience[]>(getExperiences, '/api/v1/experiences');
		expect(body.length).toBe(privateSource.jobs.length + privateSource.formations.length);
		for (const experience of body) {
			expect(experience.start).toMatch(ISO_DATE);
			expect(experience.end).toMatch(ISO_DATE);
			expect(experience.end >= experience.start).toBe(true);
		}
	});

	it.each(['job', 'education'] as const)('filters by kind=%s', async (kind) => {
		const { body } = await call<ApiExperience[]>(getExperiences, `/api/v1/experiences?kind=${kind}`);
		expect(body.length).toBeGreaterThan(0);
		expect(body.every((e) => e.kind === kind)).toBe(true);
	});

	it('rejects an unknown kind', async () => {
		const { response } = await call(getExperiences, '/api/v1/experiences?kind=hobby');
		expect(response.status).toBe(400);
	});

	it('keeps the same unique ids in every locale', async () => {
		const fr = await call<ApiExperience[]>(getExperiences, '/api/v1/experiences?lang=fr');
		const en = await call<ApiExperience[]>(getExperiences, '/api/v1/experiences?lang=en');
		const ids = fr.body.map((e) => e.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(en.body.map((e) => e.id)).toEqual(ids);
	});

	it('links only to existing projects', async () => {
		const experiences = await call<ApiExperience[]>(getExperiences, '/api/v1/experiences');
		const projects = await call<ApiProject[]>(getProjects, '/api/v1/projects');
		const projectIds = new Set(projects.body.map((p) => p.id));
		for (const id of experiences.body.flatMap((e) => e.projectIds)) expect(projectIds).toContain(id);
	});
});

describe('/api/v1/projects', () => {
	it('featured=true returns the 8 projects of the home page grid', async () => {
		const { body } = await call<ApiProject[]>(getProjects, '/api/v1/projects?featured=true');
		expect(body).toHaveLength(8);
		expect(body.every((p) => p.featured && p.url)).toBe(true);
	});

	it('every project belongs to an existing experience, ids stable across locales', async () => {
		const experiences = await call<ApiExperience[]>(getExperiences, '/api/v1/experiences');
		const experienceIds = new Set(experiences.body.map((e) => e.id));
		const fr = await call<ApiProject[]>(getProjects, '/api/v1/projects?lang=fr');
		const en = await call<ApiProject[]>(getProjects, '/api/v1/projects?lang=en');
		for (const project of fr.body) expect(experienceIds).toContain(project.experienceId);
		expect(en.body.map((p) => p.id)).toEqual(fr.body.map((p) => p.id));
	});

	it('rejects an invalid featured value', async () => {
		const { response } = await call(getProjects, '/api/v1/projects?featured=yes');
		expect(response.status).toBe(400);
	});
});

describe('/api/v1/skills', () => {
	it('returns every category with valid levels', async () => {
		const { body } = await call<ApiSkills>(getSkills, '/api/v1/skills?lang=en');
		expect(body.categories.map((c) => c.code)).toEqual([...SKILL_CATEGORIES]);
		expect(body.categories.map((c) => c.name)).toEqual(['Languages', 'Frameworks', 'Tools']);
		for (const skill of body.categories.flatMap((c) => c.skills)) {
			expect(SKILL_LEVELS).toContain(skill.level);
		}
		expect(body.stack.length).toBeGreaterThan(0);
	});
});

describe('/api/v1/certificates', () => {
	it('returns certificates with ISO dates', async () => {
		const { body } = await call<{ title: string; date: string; url: string | null }[]>(
			getCertificates,
			'/api/v1/certificates'
		);
		expect(body.length).toBe(privateSource.certificates.length);
		for (const certificate of body) expect(certificate.date).toMatch(ISO_DATE);
	});
});

describe('/api/v1/cv', () => {
	it('returns the public CV without private fields', async () => {
		const { body } = await call<{ cv: { infos: Record<string, unknown> & { contact: Record<string, unknown> } } }>(
			getCv,
			'/api/v1/cv'
		);
		expect(body.cv.infos).not.toHaveProperty('references');
		expect(body.cv.infos.contact).not.toHaveProperty('address');
		expect(typeof body.cv.infos.contact.age).toBe('number');
	});
});

describe('privacy', () => {
	const { contact, references } = privateSource.infos;
	const secrets = [
		contact.address,
		contact.age,
		...references.flatMap((reference) => [reference.name, reference.phone])
	];

	it.each(endpoints)('%s never exposes the address, birthdate or references', async (path, handler) => {
		for (const lang of ['fr', 'en']) {
			const { body } = await call(handler, `${path}?lang=${lang}`);
			const text = JSON.stringify(body);
			for (const secret of secrets) expect(text).not.toContain(secret);
		}
	});
});
