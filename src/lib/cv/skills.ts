import { getDate } from './helpers.js';
import type { SkillCatalog, SkillRefs } from './types.js';

/**
 * Skill level from how recently the skill was used:
 * `top` = less than RECENT_YEARS ago, `bottom` = more than OLD_YEARS ago, `mid` otherwise.
 */
export type SkillLevel = 'top' | 'mid' | 'bottom';

export const SKILL_LEVELS: readonly SkillLevel[] = ['top', 'mid', 'bottom'];

const RECENT_YEARS = 2;
const OLD_YEARS = 5;

const rank: Record<SkillLevel, number> = { top: 1, mid: 0, bottom: -1 };

export type SkillCategoryCode = 'langs' | 'libs' | 'tools';

export const SKILL_CATEGORIES: readonly SkillCategoryCode[] = ['langs', 'libs', 'tools'];

export interface RatedSkill {
	name: string;
	level: SkillLevel;
}

export interface SkillSource {
	/** End date, "DD.MM.YYYY" */
	end: string;
	skills: SkillRefs;
}

function levelFor(end: string, now: Date): SkillLevel {
	const date = getDate(end);
	const recent = new Date(now);
	recent.setFullYear(recent.getFullYear() - RECENT_YEARS);
	const old = new Date(now);
	old.setFullYear(old.getFullYear() - OLD_YEARS);
	if (date > recent) return 'top';
	if (date < old) return 'bottom';
	return 'mid';
}

/**
 * Rates every skill referenced by the given experiences. A skill used in several
 * experiences keeps its best (most recent) level. Order follows first appearance.
 */
export function rateSkills(
	sources: SkillSource[],
	catalog: SkillCatalog,
	now = new Date()
): Record<SkillCategoryCode, RatedSkill[]> {
	const result: Record<SkillCategoryCode, RatedSkill[]> = { langs: [], libs: [], tools: [] };
	for (const source of sources) {
		const level = levelFor(source.end, now);
		for (const category of SKILL_CATEGORIES) {
			for (const ref of source.skills[category]) {
				const name = catalog[category][ref];
				if (name === undefined) continue;
				const existing = result[category].find((skill) => skill.name === name);
				if (!existing) result[category].push({ name, level });
				else if (rank[level] > rank[existing.level]) existing.level = level;
			}
		}
	}
	return result;
}
