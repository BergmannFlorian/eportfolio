/**
 * Content access layer used by the JSON API.
 *
 * Every read of portfolio content for the API goes through these functions.
 * Today they read the JSON files and message catalogs; when the data moves to
 * MariaDB (db/schema.sql), only this module needs to change.
 *
 * Private fields (address, birthdate, references) never leave getPublicCV().
 */

import type {
	ApiCertificate,
	ApiExperience,
	ApiProfile,
	ApiProject,
	ApiSkills
} from '#lib/api/types.js';
import { facts, hobbies, spokenLanguages, stack, t, works } from '#lib/content/index.js';
import { getDate } from '#lib/cv/helpers.js';
import { rateSkills, SKILL_CATEGORIES } from '#lib/cv/skills.js';
import type { Formation, Job, PublicCV } from '#lib/cv/types.js';
import { m } from '#lib/paraglide/messages.js';
import type { Locale } from '#lib/paraglide/runtime.js';
import { getPublicCV, skills as catalog } from '#lib/server/cv/index.js';

/** "DD.MM.YYYY" → "YYYY-MM-DD" */
function isoDate(date: string): string {
	const [day, month, year] = date.split('.');
	return `${year}-${month}-${day}`;
}

function slug(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

/** Stable id that does not depend on the locale (built from the French data). */
function experienceId(kind: 'job' | 'education', entry: Job | Formation): string {
	const owner = entry.company || ('name' in entry ? entry.name : entry.title);
	const start = getDate(entry.start);
	return `${kind}-${slug(owner)}-${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
}

interface Entry {
	id: string;
	kind: 'job' | 'education';
	data: Job | Formation;
	/** Same entry in the base locale, for locale-independent ids */
	base: Job | Formation;
}

function entries(cv: PublicCV, base: PublicCV): Entry[] {
	return [
		...cv.jobs.map((job, i) => ({ kind: 'job' as const, data: job, base: base.jobs[i] })),
		...cv.formations.map((formation, i) => ({
			kind: 'education' as const,
			data: formation,
			base: base.formations[i]
		}))
	].map((entry) => ({ ...entry, id: experienceId(entry.kind, entry.base) }));
}

const featuredUrls = new Set(works.map((work) => work.url));

function projectId(name: string): string {
	return slug(name);
}

export function getCV(locale: Locale) {
	return { cv: getPublicCV(locale), skills: catalog };
}

export function getProfile(locale: Locale): ApiProfile {
	const { infos } = getPublicCV(locale);
	return {
		name: infos.contact.name,
		email: infos.contact.email,
		city: infos.contact.city,
		age: infos.contact.age,
		headline: m.hero_eyebrow(undefined, { locale }),
		bio: m.hero_lead(undefined, { locale }),
		about: m.about_text(undefined, { locale }),
		title: infos.title,
		socials: infos.socials.map((social) => ({
			network: social.name,
			url: /^https?:\/\//.test(social.link) ? social.link : `https://${social.link}`
		})),
		facts: facts.map((fact) => ({ label: t(fact.label, locale), value: t(fact.value, locale) })),
		languages: spokenLanguages.map((language) => ({
			name: t(language.name, locale),
			level: t(language.level, locale),
			percent: language.percent
		})),
		hobbies: hobbies.map((hobby) => ({ name: t(hobby.name, locale), reason: t(hobby.why, locale) }))
	};
}

export function getExperiences(locale: Locale, kind?: 'job' | 'education'): ApiExperience[] {
	const all = entries(getPublicCV(locale), getPublicCV('fr'));
	return all
		.filter((entry) => !kind || entry.kind === kind)
		.map(({ id, kind, data, base }) => ({
			id,
			kind,
			title: 'title' in data ? data.title : data.name,
			degree: 'degree' in data && data.degree ? data.degree : null,
			organization: data.company || null,
			start: isoDate(data.start),
			end: isoDate(data.end),
			tasks: data.tasks,
			skills: SKILL_CATEGORIES.flatMap((category) =>
				data.skills[category].map((ref) => catalog[category][ref]).filter(Boolean)
			),
			projectIds: base.projects.map((project) => projectId(project.name))
		}));
}

export function getProjects(locale: Locale, featuredOnly = false): ApiProject[] {
	const all = entries(getPublicCV(locale), getPublicCV('fr'));
	return all.flatMap(({ id: experienceId, data, base }) =>
		data.projects
			.map((project, i) => {
				const baseName = base.projects[i]?.name ?? project.name;
				return {
					id: projectId(baseName),
					name: project.name,
					url: project.link,
					image: project.img,
					// Shown in the home page "Work" grid
					featured: !!project.link && featuredUrls.has(project.link),
					experienceId,
					tasks: project.tasks,
					details: project.details
				};
			})
			.filter((project) => !featuredOnly || project.featured)
	);
}

export function getSkills(locale: Locale): ApiSkills {
	const cv = getPublicCV(locale);
	const rated = rateSkills([...cv.jobs, ...cv.formations], catalog);
	const names = {
		langs: m.skills_languages,
		libs: m.skills_frameworks,
		tools: m.skills_tools
	};
	return {
		stack,
		categories: SKILL_CATEGORIES.map((code) => ({
			code,
			name: names[code](undefined, { locale }),
			skills: rated[code]
		}))
	};
}

export function getCertificates(locale: Locale): ApiCertificate[] {
	return getPublicCV(locale).certificates.map((certificate) => ({
		title: certificate.title,
		date: isoDate(certificate.date),
		url: certificate.link || null
	}));
}
