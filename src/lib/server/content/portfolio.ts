import { query } from '#lib/server/db/index.js';
import { baseLocale, type Locale } from '#lib/paraglide/runtime.js';

/**
 * Loads the whole portfolio for one locale in a handful of queries.
 * Translated columns fall back to the base locale (fr) when a translation is missing.
 * The address and the references are never selected; the birthdate is only
 * used to compute the age.
 */

export interface Portfolio {
	locale: Locale;
	person: {
		name: string;
		email: string;
		postalCode: string | null;
		city: string | null;
		age: number | null;
		photoUrl: string | null;
		headline: string;
		bio: string;
		about: string;
		cvTitle: string;
	};
	socials: { network: string; url: string }[];
	facts: { icon: string | null; onSite: boolean; onCv: boolean; label: string; value: string }[];
	languages: { code: string; cefr: string; percent: number; name: string; level: string }[];
	hobbies: { name: string; reason: string }[];
	certificates: { title: string; issuer: string | null; issuedOn: string; url: string | null }[];
	categories: { id: number; code: string; name: string }[];
	skills: { id: number; categoryId: number; name: string; inStack: boolean; onSite: boolean }[];
	experiences: Experience[];
	/** All projects, including personal ones not tied to an experience */
	projects: (Project & { experienceId: number | null })[];
}

export interface Experience {
	id: number;
	kind: 'job' | 'education' | 'other';
	category: string;
	organization: string | null;
	start: string;
	end: string | null;
	onSite: boolean;
	title: string;
	/** Title in the base locale, used to build locale-independent ids */
	baseTitle: string;
	degree: string | null;
	tasks: string[];
	skillIds: number[];
	projects: Project[];
}

export type ProjectKind = 'website' | 'script' | 'app';
export type ProjectStatus = 'online' | 'in_progress' | 'archived';

export interface Project {
	id: number;
	name: string;
	url: string | null;
	image: string | null;
	featured: boolean;
	kind: ProjectKind | null;
	year: number | null;
	status: ProjectStatus | null;
	hosting: string | null;
	/** Usage example (shell command…), shown as code */
	snippet: string | null;
	position: number;
	tasks: string[];
	details: string[];
	/** Technologies used (project_skill), by category then position */
	skills: string[];
	skillIds: number[];
}

/** Age in completed years at `now` from a "YYYY-MM-DD" birthdate. */
export function ageFromIso(birthdate: string, now = new Date()): number {
	const [year, month, day] = birthdate.split('-').map(Number);
	let age = now.getFullYear() - year;
	const hadBirthday =
		now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() >= day);
	if (!hadBirthday) age--;
	return age;
}

const bool = (value: unknown) => Number(value) === 1;

/** SQL for a translated column with fallback: COALESCE(t.col, b.col) */
const tr = (column: string, alias = column) => `COALESCE(t.${column}, b.${column}) AS ${alias}`;

async function fetchPortfolio(locale: Locale): Promise<Portfolio> {
	const l = [locale, baseLocale];

	const [people, socials, facts, languages, hobbies, certificates, categories, skills] =
		await Promise.all([
			query<Record<string, string | null>>(
				`SELECT p.id, p.name, p.email, p.postal_code, p.city, p.birthdate, p.photo_url,
					${tr('headline')}, ${tr('bio')}, ${tr('about')}, ${tr('cv_title')}
				FROM person p
				LEFT JOIN person_i18n t ON t.person_id = p.id AND t.locale = ?
				LEFT JOIN person_i18n b ON b.person_id = p.id AND b.locale = ?
				ORDER BY p.id LIMIT 1`,
				l
			),
			query<{ network: string; url: string }>(
				`SELECT network, url FROM social_link ORDER BY position, id`
			),
			query<{ icon: string | null; on_site: number; on_cv: number; label: string; value: string }>(
				`SELECT f.icon, f.on_site, f.on_cv, ${tr('label')}, ${tr('value')}
				FROM fact f
				LEFT JOIN fact_i18n t ON t.fact_id = f.id AND t.locale = ?
				LEFT JOIN fact_i18n b ON b.fact_id = f.id AND b.locale = ?
				ORDER BY f.position, f.id`,
				l
			),
			query<{ code: string; cefr: string; percent: number; name: string; level: string }>(
				`SELECT pl.language_code AS code, pl.cefr, pl.percent,
					COALESCE(ln.name, lb.name) AS name, ${tr('level_label', 'level')}
				FROM person_language pl
				LEFT JOIN language_i18n ln ON ln.language_code = pl.language_code AND ln.locale = ?
				LEFT JOIN language_i18n lb ON lb.language_code = pl.language_code AND lb.locale = ?
				LEFT JOIN person_language_i18n t ON t.person_language_id = pl.id AND t.locale = ?
				LEFT JOIN person_language_i18n b ON b.person_language_id = pl.id AND b.locale = ?
				ORDER BY pl.position, pl.id`,
				[...l, ...l]
			),
			query<{ name: string; reason: string | null }>(
				`SELECT ${tr('name')}, ${tr('reason')}
				FROM hobby h
				LEFT JOIN hobby_i18n t ON t.hobby_id = h.id AND t.locale = ?
				LEFT JOIN hobby_i18n b ON b.hobby_id = h.id AND b.locale = ?
				ORDER BY h.position, h.id`,
				l
			),
			query<{ title: string; issuer: string | null; issued_on: string; url: string | null }>(
				`SELECT title, issuer, issued_on, url FROM certificate ORDER BY issued_on, id`
			),
			query<{ id: number; code: string; name: string | null }>(
				`SELECT c.id, c.code, ${tr('name')}
				FROM skill_category c
				LEFT JOIN skill_category_i18n t ON t.skill_category_id = c.id AND t.locale = ?
				LEFT JOIN skill_category_i18n b ON b.skill_category_id = c.id AND b.locale = ?
				ORDER BY c.position, c.id`,
				l
			),
			query<{ id: number; category_id: number; name: string; in_stack: number; on_site: number }>(
				`SELECT id, category_id, name, in_stack, on_site FROM skill ORDER BY category_id, position, id`
			)
		]);

	const [experiences, tasks, experienceSkills, projects, items, projectSkills] = await Promise.all([
		query<{
			id: number;
			kind: Experience['kind'];
			category: string;
			organization: string | null;
			start_date: string;
			end_date: string | null;
			on_site: number;
			title: string;
			base_title: string;
			degree: string | null;
		}>(
			`SELECT e.id, e.kind, e.category, o.name AS organization, e.start_date, e.end_date, e.on_site,
				${tr('title')}, b.title AS base_title, ${tr('degree')}
			FROM experience e
			LEFT JOIN organization o ON o.id = e.organization_id
			LEFT JOIN experience_i18n t ON t.experience_id = e.id AND t.locale = ?
			LEFT JOIN experience_i18n b ON b.experience_id = e.id AND b.locale = ?
			ORDER BY e.kind, e.position, e.start_date DESC, e.id`,
			l
		),
		query<{ experience_id: number; text: string }>(
			`SELECT k.experience_id, ${tr('text')}
			FROM experience_task k
			LEFT JOIN experience_task_i18n t ON t.experience_task_id = k.id AND t.locale = ?
			LEFT JOIN experience_task_i18n b ON b.experience_task_id = k.id AND b.locale = ?
			ORDER BY k.experience_id, k.position, k.id`,
			l
		),
		query<{ experience_id: number; skill_id: number }>(
			`SELECT es.experience_id, es.skill_id
			FROM experience_skill es JOIN skill s ON s.id = es.skill_id
			ORDER BY es.experience_id, s.category_id, s.position, s.id`
		),
		query<{
			id: number;
			experience_id: number | null;
			name: string;
			url: string | null;
			image: string | null;
			featured: number;
			kind: ProjectKind | null;
			year: number | null;
			status: ProjectStatus | null;
			hosting: string | null;
			snippet: string | null;
			position: number;
		}>(
			`SELECT id, experience_id, name, url, image, featured, kind, year, status, hosting, snippet, position
			FROM project ORDER BY position, id`
		),
		query<{ project_id: number; kind: 'task' | 'detail'; text: string }>(
			`SELECT i.project_id, i.kind, ${tr('text')}
			FROM project_item i
			LEFT JOIN project_item_i18n t ON t.project_item_id = i.id AND t.locale = ?
			LEFT JOIN project_item_i18n b ON b.project_item_id = i.id AND b.locale = ?
			ORDER BY i.project_id, i.kind, i.position, i.id`,
			l
		),
		query<{ project_id: number; skill_id: number; name: string }>(
			`SELECT ps.project_id, ps.skill_id, s.name
			FROM project_skill ps JOIN skill s ON s.id = ps.skill_id
			ORDER BY ps.project_id, s.category_id, s.position, s.id`
		)
	]);

	const person = people[0];
	if (!person) throw new Error('No person found in the database');

	const projectList: (Project & { experienceId: number | null })[] = projects.map((p) => ({
		id: p.id,
		experienceId: p.experience_id,
		name: p.name,
		url: p.url,
		image: p.image,
		featured: bool(p.featured),
		kind: p.kind,
		year: p.year,
		status: p.status,
		hosting: p.hosting,
		snippet: p.snippet,
		position: p.position,
		tasks: items.filter((i) => i.project_id === p.id && i.kind === 'task').map((i) => i.text),
		details: items.filter((i) => i.project_id === p.id && i.kind === 'detail').map((i) => i.text),
		skills: projectSkills.filter((ps) => ps.project_id === p.id).map((ps) => ps.name),
		skillIds: projectSkills.filter((ps) => ps.project_id === p.id).map((ps) => ps.skill_id)
	}));

	return {
		locale,
		person: {
			name: person.name ?? '',
			email: person.email ?? '',
			postalCode: person.postal_code,
			city: person.city,
			age: person.birthdate ? ageFromIso(person.birthdate) : null,
			photoUrl: person.photo_url,
			headline: person.headline ?? '',
			bio: person.bio ?? '',
			about: person.about ?? '',
			cvTitle: person.cv_title ?? ''
		},
		socials,
		facts: facts.map((f) => ({
			icon: f.icon,
			onSite: bool(f.on_site),
			onCv: bool(f.on_cv),
			label: f.label,
			value: f.value
		})),
		languages,
		hobbies: hobbies.map((h) => ({ name: h.name, reason: h.reason ?? '' })),
		certificates: certificates.map((c) => ({
			title: c.title,
			issuer: c.issuer,
			issuedOn: c.issued_on,
			url: c.url
		})),
		categories: categories.map((c) => ({ id: c.id, code: c.code, name: c.name ?? c.code })),
		skills: skills.map((s) => ({
			id: s.id,
			categoryId: s.category_id,
			name: s.name,
			inStack: bool(s.in_stack),
			onSite: bool(s.on_site)
		})),
		experiences: experiences.map((e) => ({
			id: e.id,
			kind: e.kind,
			category: e.category,
			organization: e.organization,
			start: e.start_date,
			end: e.end_date,
			onSite: bool(e.on_site),
			title: e.title ?? '',
			baseTitle: e.base_title ?? e.title ?? '',
			degree: e.degree,
			tasks: tasks.filter((k) => k.experience_id === e.id).map((k) => k.text),
			skillIds: experienceSkills.filter((s) => s.experience_id === e.id).map((s) => s.skill_id),
			projects: projectList.filter((p) => p.experienceId === e.id)
		})),
		projects: projectList
	};
}

// Content changes rarely: keep each locale in memory for a short time.
const CACHE_TTL_MS = 60_000;
const cache = new Map<Locale, { expires: number; value: Promise<Portfolio> }>();

export function loadPortfolio(locale: Locale): Promise<Portfolio> {
	const hit = cache.get(locale);
	if (hit && hit.expires > Date.now()) return hit.value;
	const value = fetchPortfolio(locale);
	cache.set(locale, { expires: Date.now() + CACHE_TTL_MS, value });
	// Never cache a failure
	value.catch(() => cache.delete(locale));
	return value;
}

export function clearContentCache(): void {
	cache.clear();
}
