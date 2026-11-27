import type { RatedSkills, SkillCategoryCode, SkillLevel } from '#lib/cv/skills.js';

/** `top` = used less than RECENT_YEARS ago, `bottom` = more than OLD_YEARS ago, `mid` otherwise. */
const RECENT_YEARS = 2;
const OLD_YEARS = 5;

const rank: Record<SkillLevel, number> = { top: 1, mid: 0, bottom: -1 };

export interface SkillUse {
	/** Last day the skills were used, "YYYY-MM-DD" */
	end: string;
	skillIds: number[];
	/** Personal project: skills used only there are flagged `personalOnly` */
	personal: boolean;
}

export interface RatableSkill {
	id: number;
	name: string;
	category: SkillCategoryCode;
}

function levelFor(end: string, now: Date): SkillLevel {
	const date = new Date(`${end}T12:00:00Z`);
	const recent = new Date(now);
	recent.setFullYear(recent.getFullYear() - RECENT_YEARS);
	const old = new Date(now);
	old.setFullYear(old.getFullYear() - OLD_YEARS);
	if (date > recent) return 'top';
	if (date < old) return 'bottom';
	return 'mid';
}

/**
 * Rates every skill referenced by the given uses. A skill used several times keeps
 * its best (most recent) level. Order follows first appearance, so pass
 * experiences before personal projects to list project-only skills last.
 * Only skills of the given categories are rated; each category gets a list, even empty.
 */
export function rateSkills(
	uses: SkillUse[],
	skills: RatableSkill[],
	categories: readonly SkillCategoryCode[],
	now = new Date()
): RatedSkills {
	const result: RatedSkills = Object.fromEntries(categories.map((code) => [code, []]));
	const byId = new Map(skills.map((skill) => [skill.id, skill]));
	for (const use of uses) {
		const level = levelFor(use.end, now);
		for (const id of use.skillIds) {
			const skill = byId.get(id);
			if (!skill || !Object.hasOwn(result, skill.category)) continue;
			const list = result[skill.category];
			const existing = list.find((rated) => rated.name === skill.name);
			if (!existing) {
				list.push({ name: skill.name, level, personalOnly: use.personal });
				continue;
			}
			if (rank[level] > rank[existing.level]) existing.level = level;
			if (!use.personal) existing.personalOnly = false;
		}
	}
	return result;
}
