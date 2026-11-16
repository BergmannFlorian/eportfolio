import { m } from '#lib/paraglide/messages.js';

/**
 * Contenu de la page d'accueil.
 * Les textes traduisibles sont des fonctions de message (appelées au rendu,
 * pour respecter la langue de la requête) ; noms propres et URL sont invariants.
 */

type Text = () => string;

export const contact = {
	email: 'florian.bergmann@ik.me',
	linkedin: 'https://linkedin.com/in/florian-bergmann'
};

export const stack = [
	'Nuxt',
	'Vue.js',
	'TypeScript',
	'Symfony',
	'Laravel',
	'Node.js',
	'SQL',
	'Docker',
	'Flutter'
];

export interface Work {
	name: string;
	domain: string;
	url: string;
}

export const works: Work[] = [
	{ name: 'Breitling', domain: 'breitling.com', url: 'https://www.breitling.com' },
	{ name: 'Lacoste UNDW3', domain: 'undw3-shop.lacoste.com', url: 'https://undw3-shop.lacoste.com' },
	{ name: 'Magic Pass', domain: 'magicpass.ch', url: 'https://www.magicpass.ch' },
	{ name: 'Rhône FM', domain: 'rhonefm.ch', url: 'https://www.rhonefm.ch' },
	{ name: 'Orllati', domain: 'orllati.ch', url: 'https://www.orllati.ch' },
	{ name: 'Hugo Reitzel', domain: 'hugoreitzel.ch', url: 'https://www.hugoreitzel.ch' },
	{ name: 'Abbaye St-Maurice', domain: 'abbaye-stmaurice.ch', url: 'https://www.abbaye-stmaurice.ch' },
	{ name: 'IOMEDIA', domain: 'iomedia.ch', url: 'https://www.iomedia.ch' }
];

export interface SkillGroup {
	title: Text;
	items: string[];
}

export const skills: SkillGroup[] = [
	{
		title: m.skills_languages,
		items: ['HTML', 'CSS / SCSS', 'JavaScript', 'TypeScript', 'PHP', 'SQL / MySQL', 'Bash', 'Twig', 'MJML']
	},
	{
		title: m.skills_frameworks,
		items: ['Nuxt 2 / 3', 'Vue.js', 'Symfony 5', 'Laravel', 'Node.js', 'Flutter', 'Scrum']
	},
	{
		title: m.skills_tools,
		items: ['Docker', 'Git', 'GitHub', 'Jira', 'Slack', 'VS Code', 'DBeaver']
	}
];

export interface Job {
	date: Text;
	role: Text;
	org: string;
}

export const jobs: Job[] = [
	{ date: m.job_iomedia_date, role: m.job_iomedia_role, org: 'IOMEDIA SA' },
	{ date: m.job_workstreams_date, role: m.job_workstreams_role, org: 'Workstreams' },
	{ date: m.job_cpnv_date, role: m.job_cpnv_role, org: 'CPNV' },
	{ date: m.job_nagra_date, role: m.job_nagra_role, org: 'Nagravision' },
	{ date: m.job_nestle_date, role: m.job_nestle_role, org: 'Nestlé PTC' }
];

export interface Fact {
	label: Text;
	value: Text;
}

export const facts: Fact[] = [
	{ label: m.fact_age, value: m.fact_age_value },
	{ label: m.fact_home, value: () => '1426 Concise' },
	{ label: m.fact_nationality, value: m.fact_nationality_value },
	{ label: m.fact_mobility, value: m.fact_mobility_value },
	{ label: m.fact_references, value: m.fact_references_value }
];

export interface SpokenLanguage {
	name: Text;
	level: Text;
	/** Niveau affiché par la barre, en pourcentage */
	percent: number;
}

export const spokenLanguages: SpokenLanguage[] = [
	{ name: m.lang_fr, level: m.lang_fr_level, percent: 100 },
	{ name: m.lang_en, level: m.lang_en_level, percent: 55 },
	{ name: m.lang_de, level: m.lang_de_level, percent: 35 }
];

export interface Hobby {
	name: Text;
	why: Text;
}

export const hobbies: Hobby[] = [
	{ name: m.hobby_cooking, why: m.hobby_cooking_why },
	{ name: m.hobby_reading, why: m.hobby_reading_why },
	{ name: m.hobby_anime, why: m.hobby_anime_why },
	{ name: m.hobby_games, why: m.hobby_games_why }
];

/** Numérotation « 01 », « 02 »… utilisée dans les grilles. */
export const pad = (index: number) => String(index + 1).padStart(2, '0');
