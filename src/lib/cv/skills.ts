/**
 * Skill level from how recently the skill was used:
 * `top` = recent, `mid` = a few years ago, `bottom` = long ago.
 * Computed server-side (src/lib/server/content/skills.ts) and shared by the
 * /cv page and the API.
 */
export type SkillLevel = 'top' | 'mid' | 'bottom';

export const SKILL_LEVELS: readonly SkillLevel[] = ['top', 'mid', 'bottom'];

export type SkillCategoryCode = 'langs' | 'libs' | 'tools';

export const SKILL_CATEGORIES: readonly SkillCategoryCode[] = ['langs', 'libs', 'tools'];

export interface RatedSkill {
	name: string;
	level: SkillLevel;
	/** Only used in personal projects (marked with an asterisk on the CV) */
	personalOnly: boolean;
}

export type RatedSkills = Record<SkillCategoryCode, RatedSkill[]>;
