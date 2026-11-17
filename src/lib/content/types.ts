/** Home page data, loaded from the database by src/routes/(site)/+page.server.ts. */

export interface HomeWork {
	name: string;
	domain: string;
	url: string;
}

export interface HomeSkillGroup {
	title: string;
	items: string[];
}

export interface HomeJob {
	date: string;
	role: string;
	org: string;
}

export interface HomeFact {
	label: string;
	value: string;
}

export interface HomeLanguage {
	name: string;
	level: string;
	/** Level shown by the bar, in percent */
	percent: number;
}

export interface HomeHobby {
	name: string;
	why: string;
}

export interface HomeContent {
	headline: string;
	bio: string;
	about: string;
	email: string;
	stack: string[];
	works: HomeWork[];
	skills: HomeSkillGroup[];
	jobs: HomeJob[];
	facts: HomeFact[];
	languages: HomeLanguage[];
	hobbies: HomeHobby[];
}

/** Contact links shown in the site header and footer. */
export interface SiteContact {
	email: string;
	linkedin: string | null;
}

/** "01", "02"… numbering used in the grids. */
export const pad = (index: number) => String(index + 1).padStart(2, '0');
