/**
 * Types du CV (repris de l'ancien projet).
 * Les dates sont au format suisse « JJ.MM.AAAA ».
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

/** Index dans les listes de `SkillCatalog`. */
export interface SkillRefs {
	langs: number[];
	libs: number[];
	tools: number[];
	buisness: number[];
}

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

export interface SkillCatalog {
	langs: string[];
	libs: string[];
	tools: string[];
	buisness?: string[];
}

/**
 * Version publique envoyée au navigateur : sans adresse, sans date de naissance
 * (remplacée par l'âge calculé) et sans références (coordonnées de tiers).
 */
export interface PublicCV extends Omit<CV, 'infos'> {
	infos: Omit<Infos, 'contact' | 'references'> & {
		contact: { name: string; email: string; city: string; age: number };
	};
}
