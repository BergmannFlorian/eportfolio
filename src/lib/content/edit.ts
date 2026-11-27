/**
 * Content editing (signed-in owner): data exchanged with /admin/content/<section>.
 * Translated fields hold one string per locale; an empty string means "not translated",
 * the site then shows the French text. French is required where the site needs a text.
 */

/** Text per locale ('' when unset) */
export type Localized = Record<string, string>;

export interface HeroEdit {
	email: string;
	headline: Localized;
	bio: Localized;
}

export interface AboutEdit {
	about: Localized;
}

export interface FactEdit {
	/** CV icon, "solar:<name>" (src/lib/cv/icons.ts), '' for none */
	icon: string;
	onSite: boolean;
	onCv: boolean;
	label: Localized;
	value: Localized;
}

export interface LanguageEdit {
	/** Spoken language code: 'fr', 'de'… */
	code: string;
	/** Language name, shared by every person speaking it */
	name: Localized;
	/** 'native', 'C1', 'B2'… */
	cefr: string;
	/** Level bar on the site, 0-100 */
	percent: number;
	/** Level shown on the site and the CV, e.g. 'Courant (B2)' */
	level: Localized;
}

export interface HobbyEdit {
	name: Localized;
	reason: Localized;
}

export const PROJECT_KINDS = ['website', 'script', 'app'] as const;
export const PROJECT_STATUSES = ['online', 'in_progress', 'archived'] as const;

/** One project, edited from its card (?id=<project id>, none for a new project) */
export interface ProjectEdit {
	/** Not translated */
	name: string;
	url: string;
	/** Experience the project was made in, null for a personal project */
	experienceId: number | null;
	/** Shown on the home page */
	featured: boolean;
	kind: '' | (typeof PROJECT_KINDS)[number];
	year: number | null;
	status: '' | (typeof PROJECT_STATUSES)[number];
	hosting: string;
	/** Usage example (shell command…) */
	snippet: string;
	/** Description, one paragraph per task (home cards, CV) */
	tasks: Localized[];
	/** Key points of the personal projects page */
	details: Localized[];
	skillIds: number[];
}

/** Choices of the project editor, sent with the project (ignored when saving) */
export interface ProjectOptions {
	experiences: { id: number; label: string }[];
	skills: { id: number; name: string; category: string }[];
}

/** Current image of a project (read only in the project section) */
export interface ProjectImage {
	file: string;
	/** /media/<file> */
	url: string;
	alt: Localized;
}

/** Row of the projects order dialog */
export interface ProjectOrderItem {
	id: number;
	name: string;
	/** Organization of the experience, null for a personal project (read only) */
	organization: string | null;
	featured: boolean;
}

/** A skill of the catalog. The id is kept: projects and experiences reference skills. */
export interface SkillEdit {
	/** null for a new skill */
	id: number | null;
	/** Not translated */
	name: string;
	/** Home page "Stack" band */
	inStack: boolean;
	/** Home page "Skills" section */
	onSite: boolean;
	/** Projects and experiences using it (read only, lost on deletion) */
	uses: number;
}

/** Skill category: fixed set (the CV relies on their codes), names and skills editable */
export interface SkillCategoryEdit {
	id: number;
	name: Localized;
	skills: SkillEdit[];
}

export const EXPERIENCE_KINDS = ['job', 'education', 'other'] as const;

/** Organization choice of an experience: no organization, or a new one named `newOrganization` */
export const NO_ORGANIZATION = 0;
export const NEW_ORGANIZATION = -1;

/** One experience or education, edited from its Journey row (?id=, none for a new one) */
export interface ExperienceEdit {
	kind: (typeof EXPERIENCE_KINDS)[number];
	/** Existing organization id, NO_ORGANIZATION or NEW_ORGANIZATION */
	organizationId: number;
	newOrganization: string;
	/** YYYY-MM-DD */
	start: string;
	/** YYYY-MM-DD, '' while ongoing */
	end: string;
	/** Shown in the home page Journey section (always on the CV) */
	onSite: boolean;
	title: Localized;
	/** Education only */
	degree: Localized;
	tasks: Localized[];
	skillIds: number[];
}

export interface ExperienceOptions {
	organizations: { id: number; name: string; logo: { file: string; url: string } | null }[];
	skills: ProjectOptions['skills'];
}

export interface EditSections {
	hero: HeroEdit;
	about: AboutEdit;
	facts: { items: FactEdit[] };
	languages: { items: LanguageEdit[] };
	hobbies: { items: HobbyEdit[] };
	/** The image is read here, but saved through /admin/media (same dialog) */
	project: { project: ProjectEdit; options: ProjectOptions; image: ProjectImage | null };
	projects: { items: ProjectOrderItem[] };
	skills: { categories: SkillCategoryEdit[] };
	/** `projects`: names of the projects made during it (read only, edited on their cards) */
	experience: { experience: ExperienceEdit; options: ExperienceOptions; projects: string[] };
}

export type EditSection = keyof EditSections;

export const EDIT_SECTIONS: readonly EditSection[] = [
	'hero',
	'about',
	'facts',
	'languages',
	'hobbies',
	'project',
	'projects',
	'skills',
	'experience'
];

/** Maximum lengths, mirrored by the database columns */
export const EDIT_LIMITS = {
	email: 255,
	headline: 255,
	bio: 2000,
	about: 4000,
	factLabel: 100,
	factValue: 255,
	languageCode: 5,
	languageName: 100,
	cefr: 10,
	level: 100,
	hobbyName: 100,
	hobbyReason: 255,
	projectName: 255,
	projectUrl: 500,
	hosting: 100,
	snippet: 2000,
	projectText: 2000,
	/** Items per list */
	items: 30,
	/** Projects in the order dialog */
	projects: 200,
	/** Technologies of a project, skills of a category */
	skills: 100,
	skillName: 100,
	categoryName: 100,
	experienceTitle: 255,
	organizationName: 255,
	experienceTask: 2000
} as const;

export const LANGUAGE_CODE = /^[a-z]{2,3}$/;
