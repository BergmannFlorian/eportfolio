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
import type { HomeContent, HomeJob, PersonalProject, SiteContact, SiteImage } from '#lib/content/types.js';
import type { RatedCategory, RatedSkill } from '#lib/cv/skills.js';
import type { Formation, Job, Project as CvProject, PublicCV, SkillCatalog, SkillRefs } from '#lib/cv/types.js';
import { m } from '#lib/paraglide/messages.js';
import { baseLocale, type Locale } from '#lib/paraglide/runtime.js';
import { mediaUrl } from '#lib/server/media/storage.js';
import { loadPortfolio, type Experience, type Portfolio, type ProjectKind } from './portfolio.js';
import { rateSkills, type RatableSkill, type SkillUse } from './skills.js';

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

/** Categories of the CV skills table, in order */
function cvCategories(portfolio: Portfolio) {
	return portfolio.categories.filter((category) => category.onCv);
}

/** Skills shown on the CV: ticked "CV", in a category shown on the CV */
function cvSkillIds(portfolio: Portfolio): Set<number> {
	const categories = new Set(cvCategories(portfolio).map((category) => category.id));
	return new Set(
		portfolio.skills.filter((skill) => skill.onCv && categories.has(skill.categoryId)).map((skill) => skill.id)
	);
}

// ─── Skill levels ───────────────────────────────────────────────────────────

/**
 * Recency level of every skill used in an experience (jobs first, then education).
 * Personal projects come last: an online or in-progress project counts as used
 * today, an archived one until the end of its year.
 */
function rateAllSkills(portfolio: Portfolio, now = new Date()): RatedCategory[] {
	const shown = cvSkillIds(portfolio);
	const skills: RatableSkill[] = portfolio.skills
		.filter((skill) => shown.has(skill.id))
		.map((skill) => ({ id: skill.id, name: skill.name, category: categoryCode(portfolio, skill.categoryId) ?? '' }));
	const categories = cvCategories(portfolio);
	const rated = rateSkills(
		skillUses(portfolio, now),
		skills,
		categories.map((category) => category.code),
		now
	);
	return categories.map((category) => ({ code: category.code, name: category.name, skills: rated[category.code] }));
}

/** Uses of the skills, rated by rateSkills: experiences (jobs first), then personal projects */
function skillUses(portfolio: Portfolio, now: Date): SkillUse[] {
	const today = now.toISOString().slice(0, 10);
	const experiences = [
		...portfolio.experiences.filter((experience) => experience.kind === 'job'),
		...portfolio.experiences.filter((experience) => experience.kind !== 'job')
	].map((experience) => ({ end: experience.end ?? today, skillIds: experience.skillIds, personal: false }));
	const projects = portfolio.projects
		.filter((project) => project.experienceId === null)
		.flatMap((project) => {
			const current = project.status === 'online' || project.status === 'in_progress';
			const end = current ? today : project.year ? `${project.year}-12-31` : null;
			return end ? [{ end, skillIds: project.skillIds, personal: true }] : [];
		});
	return [...experiences, ...projects];
}

/**
 * Level of every skill, shown on the CV or not, for the skill editor (null: never used).
 * Same computation as the CV, read from the base locale.
 */
export async function getSkillLevels(now = new Date()): Promise<Map<number, Omit<RatedSkill, 'name'>>> {
	const portfolio = await loadPortfolio(baseLocale);
	// One pseudo-category per skill: names may repeat across categories
	const skills = portfolio.skills.map((skill) => ({ id: skill.id, name: skill.name, category: String(skill.id) }));
	const rated = rateSkills(skillUses(portfolio, now), skills, skills.map((skill) => skill.category), now);
	const levels = new Map<number, Omit<RatedSkill, 'name'>>();
	for (const skill of portfolio.skills) {
		const [entry] = rated[String(skill.id)];
		if (entry) levels.set(skill.id, { level: entry.level, personalOnly: entry.personalOnly });
	}
	return levels;
}

/** Uploaded image with its description, or null when there is none. */
function siteImage(file: string | null, alt: string): SiteImage | null {
	const url = mediaUrl(file);
	return url ? { url, alt } : null;
}

function projectKindLabels(locale: Locale): Record<ProjectKind, string> {
	const options = { locale };
	return {
		website: m.project_kind_website(undefined, options),
		script: m.project_kind_script(undefined, options),
		app: m.project_kind_app(undefined, options)
	};
}

// ─── Legacy CV format (src/routes/cv components) ────────────────────────────

function toLegacyCV(portfolio: Portfolio): { cv: PublicCV; skills: SkillCatalog; levels: RatedCategory[] } {
	// Catalog: CV skill names per CV category code, in display order; experiences reference them by index
	const shown = cvSkillIds(portfolio);
	const codes = cvCategories(portfolio).map((category) => category.code);
	const catalog: SkillCatalog = Object.fromEntries(codes.map((code) => [code, []]));
	const refOf = new Map<number, { category: string; index: number }>();
	for (const skill of portfolio.skills) {
		const category = categoryCode(portfolio, skill.categoryId);
		if (!shown.has(skill.id) || !category) continue;
		refOf.set(skill.id, { category, index: catalog[category].length });
		catalog[category].push(skill.name);
	}

	const refs = (skillIds: number[]): SkillRefs => {
		const result: SkillRefs = Object.fromEntries(codes.map((code) => [code, []]));
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
	const kindLabels = projectKindLabels(portfolio.locale);
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
		personalProjects: portfolio.projects
			.filter((project) => project.experienceId === null)
			.map((project) => ({
				name: project.name,
				kind: project.kind ? kindLabels[project.kind] : null,
				description: project.tasks.join(' '),
				// Technologies shown on the CV only (same order as project.skills)
				skills: project.skills.filter((_, i) => shown.has(project.skillIds[i])),
				link: project.url,
				linkLabel: project.url ? displayUrl(project.url) : null
			})),
		portrait: siteImage(person.photoFile, person.photoAlt),
		certificates: portfolio.certificates.map((certificate) => ({
			title: certificate.title,
			date: toSwissDate(certificate.issuedOn),
			link: certificate.url ?? ''
		}))
	};

	return { cv, skills: catalog, levels: rateAllSkills(portfolio) };
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
		photo: siteImage(person.photoFile, person.photoAlt),
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
			organizationLogo: mediaUrl(experience.organizationLogo),
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
			image: mediaUrl(project.imageFile),
			imageAlt: project.imageFile ? project.imageAlt : null,
			featured: project.featured,
			position: project.position,
			experienceId: project.experienceId === null ? null : (experienceIds.get(project.experienceId) ?? null),
			tasks: project.tasks,
			details: project.details,
			skills: project.skills,
			kind: project.kind,
			year: project.year,
			status: project.status,
			hosting: project.hosting,
			snippet: project.snippet
		}));
}

export async function getSkills(locale: Locale): Promise<ApiSkills> {
	const portfolio = await loadPortfolio(locale);
	return {
		stack: portfolio.skills.filter((skill) => skill.inStack).map((skill) => skill.name),
		// Same categories and skills as the CV skills table
		categories: rateAllSkills(portfolio)
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

/** Every personal project (not tied to an experience), for the personal projects page. */
export async function getPersonalProjects(locale: Locale): Promise<PersonalProject[]> {
	const portfolio = await loadPortfolio(locale);
	const options = { locale };
	const kindLabels = projectKindLabels(locale);
	const statusLabels = {
		online: m.project_status_online(undefined, options),
		in_progress: m.project_status_in_progress(undefined, options),
		archived: m.project_status_archived(undefined, options)
	};

	return portfolio.projects
		.filter((project) => project.experienceId === null)
		.map((project) => {
			const kindLabel = project.kind ? kindLabels[project.kind] : null;
			// Facts beyond the type, which the card already shows as a badge
			const extraFacts = [
				project.year === null ? null : { label: m.project_fact_year(undefined, options), value: String(project.year) },
				project.status === null
					? null
					: { label: m.project_fact_status(undefined, options), value: statusLabels[project.status] },
				project.hosting === null
					? null
					: { label: m.project_fact_hosting(undefined, options), value: project.hosting }
			].filter((fact) => fact !== null);
			const typeFact = kindLabel ? [{ label: m.project_fact_type(undefined, options), value: kindLabel }] : [];

			return {
				id: slug(project.name),
				projectId: project.id,
				image: siteImage(project.imageFile, project.imageAlt),
				kind: project.kind,
				kindLabel,
				name: project.name,
				description: project.tasks.join(' '),
				skills: project.skills,
				url: project.url,
				domain: project.url ? displayUrl(project.url) : null,
				visitLabel:
					project.kind === 'website'
						? m.project_visit_site(undefined, options)
						: m.project_visit(undefined, options),
				highlights: project.details,
				snippet: project.snippet,
				facts: [...typeFact, ...extraFacts],
				hasMore: project.details.length > 0 || !!project.snippet || extraFacts.length > 0
			};
		});
}

export async function getSiteContact(locale: Locale): Promise<SiteContact> {
	const portfolio = await loadPortfolio(locale);
	return {
		email: portfolio.person.email,
		linkedin: portfolio.socials.find((social) => social.network === 'linkedin')?.url ?? null
	};
}

/** Experiences of the home page "Journey" section (onSite), or the hidden ones, most recent first */
function journey(portfolio: Portfolio, onSite: boolean): HomeJob[] {
	return portfolio.experiences
		.filter((experience) => experience.onSite === onSite)
		.sort((a, b) => b.start.localeCompare(a.start))
		.map((experience) => ({
			experienceId: experience.id,
			onSite,
			start: experience.start,
			date: periodLabel(experience, portfolio.locale),
			role: experience.title,
			org: experience.organization ?? '',
			organizationId: experience.organizationId,
			logo: mediaUrl(experience.organizationLogo)
		}));
}

/** Experiences hidden from the home page, listed for the signed-in owner so they can be edited. */
export async function getHiddenJourney(locale: Locale): Promise<HomeJob[]> {
	return journey(await loadPortfolio(locale), false);
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
		portrait: siteImage(person.photoFile, person.photoAlt),
		stack: portfolio.skills.filter((skill) => skill.inStack).map((skill) => skill.name),
		works: portfolio.projects
			.filter((project) => project.featured && project.experienceId !== null && project.url)
			.map((project) => ({
				projectId: project.id,
				name: project.name,
				image: siteImage(project.imageFile, project.imageAlt),
				domain: hostname(project.url!),
				url: project.url!,
				skills: project.skills
			})),
		personalWorks: portfolio.projects
			.filter((project) => project.featured && project.experienceId === null)
			.map((project) => ({
				projectId: project.id,
				name: project.name,
				image: siteImage(project.imageFile, project.imageAlt),
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
		jobs: journey(portfolio, true),
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
