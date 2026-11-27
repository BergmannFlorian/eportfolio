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

export interface EditSections {
	hero: HeroEdit;
	about: AboutEdit;
	facts: { items: FactEdit[] };
	languages: { items: LanguageEdit[] };
	hobbies: { items: HobbyEdit[] };
}

export type EditSection = keyof EditSections;

export const EDIT_SECTIONS: readonly EditSection[] = ['hero', 'about', 'facts', 'languages', 'hobbies'];

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
	/** Items per list */
	items: 30
} as const;

export const LANGUAGE_CODE = /^[a-z]{2,3}$/;
