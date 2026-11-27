/**
 * CV types (ported from the legacy project).
 * Dates use the Swiss "DD.MM.YYYY" format.
 */

export interface Social {
	name: string;
	link: string;
}

export interface Reference {
	name: string;
	title: string;
	company: string;
	phone: string;
}

export interface Lang {
	name: string;
	level: string;
}

export interface Infos {
	title: string;
	description: string;
	contact: {
		name: string;
		email: string;
		address: string;
		city: string;
		age: string;
	};
	socials: Social[];
	references: Reference[];
	langs: Lang[];
	hobbys: string[];
	others: { title: string; icon: string }[];
}

export interface Project {
	name: string;
	link: string | null;
	tasks: string[];
	details: string[];
	img: string | null;
}

/** Indexes into the `SkillCatalog` lists, per category code of the CV. */
export type SkillRefs = Record<string, number[]>;

export interface Job {
	category: string;
	title: string;
	company: string;
	start: string;
	end: string;
	tasks: string[];
	skills: SkillRefs;
	projects: Project[];
}

export interface Formation {
	name: string;
	degree: string;
	company: string;
	start: string;
	end: string;
	tasks: string[];
	course: string[];
	skills: SkillRefs;
	projects: Project[];
}

export interface Certificate {
	title: string;
	date: string;
	link: string;
}

export interface CV {
	infos: Infos;
	jobs: Job[];
	formations: Formation[];
	certificates: Certificate[];
}

/** Skill names shown on the CV, per category code ('langs', 'libs', 'tools'…), in display order. */
export type SkillCatalog = Record<string, string[]>;

/** Personal project (not tied to a job), shown on the first page. */
export interface PersonalProject {
	name: string;
	/** Localized type label ("Site web", "Script"…) */
	kind: string | null;
	description: string;
	skills: string[];
	link: string | null;
	/** Link without protocol, e.g. "bergmann-florian.ch" */
	linkLabel: string | null;
}

/**
 * Public version sent to the browser: no address, no birthdate (replaced by
 * the computed age) and no references (third-party contact details).
 */
export interface PublicCV extends Omit<CV, 'infos'> {
	infos: Omit<Infos, 'contact' | 'references'> & {
		contact: { name: string; email: string; city: string; age: number };
	};
	personalProjects: PersonalProject[];
	/** Uploaded portrait (/media/…), or null for the default photo */
	portrait: { url: string; alt: string } | null;
}
