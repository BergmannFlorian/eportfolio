/** Home page data, loaded from the database by src/routes/(site)/+page.server.ts. */

/** An uploaded image (served at /media/…) with its description. */
export interface SiteImage {
	url: string;
	alt: string;
}

export interface HomeWork {
	/** Database id, used by the image editor when signed in */
	projectId: number;
	name: string;
	/** Card background (grayscale, under a veil) */
	image: SiteImage | null;
	domain: string;
	url: string;
	skills: string[];
}

/** Personal project (no experience), shown as a detailed card. */
export interface HomePersonalWork {
	/** Database id, used by the image editor when signed in */
	projectId: number;
	name: string;
	/** Card background (grayscale, under a veil), as for client works */
	image: SiteImage | null;
	/** Project tasks, joined */
	description: string;
	skills: string[];
	url: string | null;
	domain: string | null;
}

export interface HomeSkillGroup {
	title: string;
	items: string[];
}

export interface HomeJob {
	date: string;
	role: string;
	org: string;
	/** Database id of the organization (null for e.g. a language stay) */
	organizationId: number | null;
	/** Uploaded logo URL */
	logo: string | null;
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
	/** Uploaded portrait, or null for the default one */
	portrait: SiteImage | null;
	stack: string[];
	works: HomeWork[];
	personalWorks: HomePersonalWork[];
	skills: HomeSkillGroup[];
	jobs: HomeJob[];
	facts: HomeFact[];
	languages: HomeLanguage[];
	hobbies: HomeHobby[];
}

/** One block of the personal projects page, loaded by src/routes/(site)/projets/+page.server.ts. */
export interface PersonalProject {
	/** Stable identifier (same as the API project id) */
	id: string;
	/** Database id, used by the image editor when signed in */
	projectId: number;
	image: SiteImage | null;
	kind: 'website' | 'script' | 'app' | null;
	kindLabel: string | null;
	name: string;
	description: string;
	skills: string[];
	url: string | null;
	domain: string | null;
	/** "Visit the website" for a website, "View the project" otherwise */
	visitLabel: string;
	highlights: string[];
	snippet: string | null;
	/** Type, year, status, hosting: only the known ones */
	facts: { label: string; value: string }[];
	/** false when the card already shows everything: the "More info" button is hidden */
	hasMore: boolean;
}

/** Contact links shown in the site header and footer. */
export interface SiteContact {
	email: string;
	linkedin: string | null;
}

/** "01", "02"… numbering used in the grids. */
export const pad = (index: number) => String(index + 1).padStart(2, '0');
