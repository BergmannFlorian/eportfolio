/**
 * Response types of the public JSON API (/api/v1).
 * Dates are ISO 8601 (YYYY-MM-DD). All text fields are in the requested locale.
 */

import type { SkillCategoryCode, SkillLevel } from '#lib/cv/skills.js';

export type ApiLocale = 'fr' | 'en';

export interface ApiError {
	error: { status: number; message: string };
}

export interface ApiIndex {
	name: string;
	version: 'v1';
	locales: ApiLocale[];
	defaultLocale: ApiLocale;
	endpoints: { path: string; description: string; query?: Record<string, string> }[];
}

export interface ApiProfile {
	name: string;
	email: string;
	city: string;
	age: number;
	headline: string;
	bio: string;
	about: string;
	title: string;
	/** Uploaded portrait, path relative to the site (/media/…), or null */
	photo: { url: string; alt: string } | null;
	socials: { network: string; url: string }[];
	facts: { label: string; value: string }[];
	languages: { name: string; level: string; percent: number }[];
	hobbies: { name: string; reason: string }[];
}

export interface ApiExperience {
	/** Stable identifier, e.g. "job-iomedia-sa-2021-12" */
	id: string;
	kind: 'job' | 'education';
	title: string;
	degree: string | null;
	organization: string | null;
	/** Uploaded logo of the organization, path relative to the site (/media/…), or null */
	organizationLogo: string | null;
	start: string;
	/** null while ongoing */
	end: string | null;
	tasks: string[];
	skills: string[];
	projectIds: string[];
}

export interface ApiProject {
	/** Stable identifier, e.g. "breitling" */
	id: string;
	name: string;
	url: string | null;
	/** Uploaded image, path relative to the site (/media/…), or null */
	image: string | null;
	/** Description of the image (null without image) */
	imageAlt: string | null;
	featured: boolean;
	/** Display order (1 = first); projects are returned sorted by it */
	position: number;
	/** null for a personal project */
	experienceId: string | null;
	tasks: string[];
	details: string[];
	/** Technologies used */
	skills: string[];
	kind: 'website' | 'script' | 'app' | null;
	year: number | null;
	status: 'online' | 'in_progress' | 'archived' | null;
	hosting: string | null;
	/** Usage example (shell command…) */
	snippet: string | null;
}

export interface ApiSkills {
	/** Short list shown in the home page "Stack" band */
	stack: string[];
	categories: {
		code: SkillCategoryCode;
		name: string;
		/** personalOnly: only used in personal projects */
		skills: { name: string; level: SkillLevel; personalOnly: boolean }[];
	}[];
}

export interface ApiCertificate {
	title: string;
	date: string;
	url: string | null;
}
