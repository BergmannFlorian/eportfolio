import { describe, expect, it } from 'vitest';
import { rateSkills, type RatableSkill } from './skills.js';

const skills: RatableSkill[] = [
	{ id: 1, name: 'TypeScript', category: 'langs' },
	{ id: 2, name: 'PHP', category: 'langs' },
	{ id: 3, name: 'Cobol', category: 'langs' },
	{ id: 4, name: 'SvelteKit', category: 'libs' },
	{ id: 5, name: 'Astro', category: 'libs' }
];
const now = new Date('2026-11-24T12:00:00Z');

describe('rateSkills', () => {
	it('rates skills by how recently they were used', () => {
		const rated = rateSkills(
			[
				{ end: '2025-06-30', skillIds: [1], personal: false },
				{ end: '2023-01-31', skillIds: [2, 4], personal: false },
				{ end: '2012-06-30', skillIds: [3], personal: false }
			],
			skills,
			now
		);
		expect(rated).toEqual({
			langs: [
				{ name: 'TypeScript', level: 'top', personalOnly: false },
				{ name: 'PHP', level: 'mid', personalOnly: false },
				{ name: 'Cobol', level: 'bottom', personalOnly: false }
			],
			libs: [{ name: 'SvelteKit', level: 'mid', personalOnly: false }],
			tools: []
		});
	});

	it('keeps the best level of a skill used several times', () => {
		const rated = rateSkills(
			[
				{ end: '2012-06-30', skillIds: [3], personal: false },
				{ end: '2026-01-31', skillIds: [3], personal: false }
			],
			skills,
			now
		);
		expect(rated.langs).toEqual([{ name: 'Cobol', level: 'top', personalOnly: false }]);
	});

	it('adds personal project skills last, flagged personalOnly', () => {
		const rated = rateSkills(
			[
				{ end: '2023-01-31', skillIds: [1, 4], personal: false },
				{ end: '2026-11-24', skillIds: [4, 5], personal: true }
			],
			skills,
			now
		);
		expect(rated.langs).toEqual([{ name: 'TypeScript', level: 'mid', personalOnly: false }]);
		expect(rated.libs).toEqual([
			{ name: 'SvelteKit', level: 'top', personalOnly: false },
			{ name: 'Astro', level: 'top', personalOnly: true }
		]);
	});
});
