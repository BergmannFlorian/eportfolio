/**
 * Content access layer: every read of portfolio content (API, home page, CV page)
 * goes through these functions, which shape the data loaded by loadPortfolio()
 * from MariaDB.
 *
 * Private fields (address, birthdate, references) are never loaded, except the
 * birthdate turned into an age inside loadPortfolio().
 */

import type {
	ApiCertificate,
	ApiExperience,
	ApiProfile,
	ApiProject,
	ApiSkills
} from '#lib/api/types.js';
import type { HomeContent, SiteContact } from '#lib/content/types.js';
import { rateSkills, SKILL_CATEGORIES, type SkillCategoryCode } from '#lib/cv/skills.js';
import type { Formation, Job, Project as CvProject, PublicCV, SkillCatalog, SkillRefs } from '#lib/cv/types.js';
import { m } from '#lib/paraglide/messages.js';
import type { Locale } from '#lib/paraglide/runtime.js';
import { loadPortfolio, type Experience, type Portfolio } from './portfolio.js';

export { clearContentCache } from './portfolio.js';

const dateLocales: Record<string, string> = { fr: 'fr-CH', en: 'en-GB' };

/** "YYYY-MM-DD" → "DD.MM.YYYY" (format used by the CV components) */
function toSwissDate(iso: string): string {
	const [year, month, day] = iso.split('-');
	return `${day}.${month}.${year}`;
}

function todayIso(): string {
	return new Date().toISOString().slice(0, 10);
}

function slug(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

/** Locale-independent id, e.g. "job-iomedia-sa-2021-12" */
function experienceSlug(experience: Experience): string {
	const kind = experience.kind === 'job' ? 'job' : 'education';
	const owner = experience.organization || experience.baseTitle;
	return `${kind}-${slug(owner)}-${experience.start.slice(0, 7)}`;
}

function cityLine(portfolio: Portfolio): string {
	return [portfolio.person.postalCode, portfolio.person.city].filter(Boolean).join(' ');
}

function skillName(portfolio: Portfolio, id: number): string | undefined {
	return portfolio.skills.find((skill) => skill.id === id)?.name;
}

function categoryCode(portfolio: Portfolio, categoryId: number): string | undefined {
	return portfolio.categories.find((category) => category.id === categoryId)?.code;
}

// ─── Legacy CV format (src/routes/cv components) ────────────────────────────

function toLegacyCV(portfolio: Portfolio): { cv: PublicCV; skills: SkillCatalog } {
	// Catalog: skill names per category, in display order; experiences reference them by index
	const catalog: Required<SkillCatalog> = { langs: [], libs: [], tools: [], buisness: [] };
	const refOf = new Map<number, { category: keyof SkillRefs; index: number }>();
	for (const skill of portfolio.skills) {
		const code = categoryCode(portfolio, skill.categoryId);
		const category = (code === 'business' ? 'buisness' : code) as keyof SkillRefs | undefined;
		if (!category || !(category in catalog)) continue;
		refOf.set(skill.id, { category, index: catalog[category].length });
		catalog[category].push(skill.name);
	}

	const refs = (skillIds: number[]): SkillRefs => {
		const result: SkillRefs = { langs: [], libs: [], tools: [], buisness: [] };
		for (const id of skillIds) {
			const ref = refOf.get(id);
			if (ref) result[ref.category].push(ref.index);
		}
		return result;
	};

	const projects = (experience: Experience): CvProject[] =>
		experience.projects.map((project) => ({
			name: project.name,
			link: project.url,
			tasks: project.tasks,
			details: project.details,
			img: project.image
		}));

	const common = (experience: Experience) => ({
		company: experience.organization ?? '',
		start: toSwissDate(experience.start),
		end: toSwissDate(experience.end ?? todayIso()),
		tasks: experience.tasks,
		skills: refs(experience.skillIds),
		projects: projects(experience)
	});

	const jobs: Job[] = portfolio.experiences
		.filter((experience) => experience.kind === 'job')
		.map((experience) => ({ category: experience.category, title: experience.title, ...common(experience) }));

	const formations: Formation[] = portfolio.experiences
		.filter((experience) => experience.kind !== 'job')
		.map((experience) => ({
			name: experience.title,
			degree: experience.degree ?? '',
			course: [],
			...common(experience)
		}));

	const { person } = portfolio;
	const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

	const cv: PublicCV = {
		infos: {
			title: person.cvTitle,
			description: '',
			contact: { name: person.name, email: person.email, city: cityLine(portfolio), age: person.age ?? 0 },
			socials: portfolio.socials.map((social) => ({
				name: social.network,
				link: social.url.replace(/^https?:\/\//, '')
			})),
			langs: portfolio.languages.map((language) => ({ name: language.name, level: language.level })),
			hobbys: portfolio.hobbies.map((hobby) =>
				hobby.reason ? `${hobby.name} (${lowerFirst(hobby.reason)})` : hobby.name
			),
			others: portfolio.facts
				.filter((fact) => fact.onCv)
				.map((fact) => ({ title: `${fact.label} ${fact.value}`, icon: fact.icon ?? '' }))
		},
		jobs,
		formations,
		certificates: portfolio.certificates.map((certificate) => ({
			title: certificate.title,
			date: toSwissDate(certificate.issuedOn),
			link: certificate.url ?? ''
		}))
	};

	return { cv, skills: catalog };
}

/** Public CV in the format of the /cv page (same payload as /api/v1/cv). */
export async function getCV(locale: Locale) {
	return toLegacyCV(await loadPortfolio(locale));
}

// ─── API ────────────────────────────────────────────────────────────────────

export async function getProfile(locale: Locale): Promise<ApiProfile> {
	const portfolio = await loadPortfolio(locale);
	const { person } = portfolio;
	return {
		name: person.name,
		email: person.email,
		city: cityLine(portfolio),
		age: person.age ?? 0,
		headline: person.headline,
		bio: person.bio,
		about: person.about,
		title: person.cvTitle,
		socials: portfolio.socials,
		facts: portfolio.facts
			.filter((fact) => fact.onSite)
			.map((fact) => ({ label: fact.label, value: fact.value })),
		languages: portfolio.languages.map((language) => ({
			name: language.name,
			level: language.level,
			percent: language.percent
		})),
		hobbies: portfolio.hobbies
	};
}

export async function getExperiences(locale: Locale, kind?: 'job' | 'education'): Promise<ApiExperience[]> {
	const portfolio = await loadPortfolio(locale);
	return portfolio.experiences
		.map((experience) => ({ experience, apiKind: experience.kind === 'job' ? 'job' : 'education' }) as const)
		.filter(({ apiKind }) => !kind || apiKind === kind)
		.map(({ experience, apiKind }) => ({
			id: experienceSlug(experience),
			kind: apiKind,
			title: experience.title,
			degree: experience.degree,
			organization: experience.organization,
			start: experience.start,
			end: experience.end,
			tasks: experience.tasks,
			skills: experience.skillIds
				.map((id) => skillName(portfolio, id))
				.filter((name): name is string => !!name),
			projectIds: experience.projects.map((project) => slug(project.name))
		}));
}

export async function getProjects(locale: Locale, featuredOnly = false): Promise<ApiProject[]> {
	const portfolio = await loadPortfolio(locale);
	const experienceIds = new Map(portfolio.experiences.map((e) => [e.id, experienceSlug(e)]));
	return portfolio.projects
		.filter((project) => !featuredOnly || project.featured)
		.map((project) => ({
			id: slug(project.name),
			name: project.name,
			url: project.url,
			image: project.image,
			featured: project.featured,
			experienceId: project.experienceId === null ? null : (experienceIds.get(project.experienceId) ?? null),
			tasks: project.tasks,
			details: project.details,
			skills: project.skills
		}));
}

export async function getSkills(locale: Locale): Promise<ApiSkills> {
	const portfolio = await loadPortfolio(locale);
	const { cv, skills: catalog } = toLegacyCV(portfolio);
	const rated = rateSkills([...cv.jobs, ...cv.formations], catalog);
	const nameOf = (code: SkillCategoryCode) =>
		portfolio.categories.find((category) => category.code === code)?.name ?? code;
	return {
		stack: portfolio.skills.filter((skill) => skill.inStack).map((skill) => skill.name),
		categories: SKILL_CATEGORIES.map((code) => ({ code, name: nameOf(code), skills: rated[code] }))
	};
}

export async function getCertificates(locale: Locale): Promise<ApiCertificate[]> {
	const portfolio = await loadPortfolio(locale);
	return portfolio.certificates.map((certificate) => ({
		title: certificate.title,
		date: certificate.issuedOn,
		url: certificate.url
	}));
}

// ─── Site pages ─────────────────────────────────────────────────────────────

export async function getSiteContact(locale: Locale): Promise<SiteContact> {
	const portfolio = await loadPortfolio(locale);
	return {
		email: portfolio.person.email,
		linkedin: portfolio.socials.find((social) => social.network === 'linkedin')?.url ?? null
	};
}

/** "Déc. 2021 – Juil. 2024", "Févr. – Juin 2021", "2019 – 2021" */
function periodLabel(experience: Experience, locale: Locale): string {
	const intl = dateLocales[locale] ?? locale;
	const parse = (iso: string) => new Date(`${iso}T12:00:00Z`);
	const month = (iso: string) => {
		const text = parse(iso).toLocaleDateString(intl, { month: 'short', timeZone: 'UTC' });
		return text.charAt(0).toUpperCase() + text.slice(1);
	};
	const year = (iso: string) => iso.slice(0, 4);
	const present = m.date_present(undefined, { locale });

	if (experience.kind !== 'job') {
		const end = experience.end ? year(experience.end) : present;
		return year(experience.start) === end ? end : `${year(experience.start)} – ${end}`;
	}
	if (!experience.end) return `${month(experience.start)} ${year(experience.start)} – ${present}`;
	if (year(experience.start) === year(experience.end)) {
		return `${month(experience.start)} – ${month(experience.end)} ${year(experience.end)}`;
	}
	return `${month(experience.start)} ${year(experience.start)} – ${month(experience.end)} ${year(experience.end)}`;
}

/** Host and path without protocol, "www." or trailing slash: "github.com/user/repo". */
function displayUrl(url: string): string {
	try {
		const { hostname: host, pathname } = new URL(url);
		return (host.replace(/^www\./, '') + pathname).replace(/\/$/, '');
	} catch {
		return url;
	}
}

function hostname(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}

export async function getHomeContent(locale: Locale): Promise<HomeContent> {
	const portfolio = await loadPortfolio(locale);
	const { person } = portfolio;

	const ageFact =
		person.age === null
			? []
			: [{ label: m.fact_age(undefined, { locale }), value: m.cv_age({ age: person.age }, { locale }) }];

	return {
		headline: person.headline,
		bio: person.bio,
		about: person.about,
		email: person.email,
		stack: portfolio.skills.filter((skill) => skill.inStack).map((skill) => skill.name),
		works: portfolio.projects
			.filter((project) => project.featured && project.experienceId !== null && project.url)
			.map((project) => ({ name: project.name, domain: hostname(project.url!), url: project.url! })),
		personalWorks: portfolio.projects
			.filter((project) => project.featured && project.experienceId === null)
			.map((project) => ({
				name: project.name,
				description: project.tasks.join(' '),
				skills: project.skills,
				url: project.url,
				domain: project.url ? displayUrl(project.url) : null
			})),
		skills: portfolio.categories
			.map((category) => ({
				title: category.name,
				items: portfolio.skills
					.filter((skill) => skill.categoryId === category.id && skill.onSite)
					.map((skill) => skill.name)
			}))
			.filter((group) => group.items.length > 0),
		jobs: portfolio.experiences
			.filter((experience) => experience.onSite)
			.sort((a, b) => b.start.localeCompare(a.start))
			.map((experience) => ({
				date: periodLabel(experience, locale),
				role: experience.title,
				org: experience.organization ?? ''
			})),
		facts: [
			...ageFact,
			...portfolio.facts.filter((fact) => fact.onSite).map((fact) => ({ label: fact.label, value: fact.value }))
		],
		languages: portfolio.languages.map((language) => ({
			name: language.name,
			level: language.level,
			percent: language.percent
		})),
		hobbies: portfolio.hobbies.map((hobby) => ({ name: hobby.name, why: hobby.reason }))
	};
}
