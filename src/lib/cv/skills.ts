/**
 * Skill level from how recently the skill was used:
 * `top` = recent, `mid` = a few years ago, `bottom` = long ago.
 * Computed server-side (src/lib/server/content/skills.ts) and shared by the
 * /cv page and the API.
 */
export type SkillLevel = 'top' | 'mid' | 'bottom';

export const SKILL_LEVELS: readonly SkillLevel[] = ['top', 'mid', 'bottom'];

/** Code of a skill category ('langs', 'libs', 'tools'…), editable categories get one from their name */
export type SkillCategoryCode = string;

export interface RatedSkill {
	name: string;
	level: SkillLevel;
	/** Only used in personal projects (marked with an asterisk on the CV) */
	personalOnly: boolean;
}

/** Rated skills per category code */
export type RatedSkills = Record<SkillCategoryCode, RatedSkill[]>;

/** A column of the CV skills table: a category shown on the CV, in order */
export interface RatedCategory {
	code: SkillCategoryCode;
	name: string;
	skills: RatedSkill[];
}
