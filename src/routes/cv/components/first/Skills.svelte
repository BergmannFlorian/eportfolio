<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { getDate } from '#lib/cv/helpers.js';
	import type { Formation, Job, PublicCV, SkillCatalog, SkillRefs } from '#lib/cv/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import H3 from '../fonts/H3.svelte';

	interface SkillsCat {
		type: number;
		name: string;
	}

	let { cv, skills }: { cv: PublicCV; skills: SkillCatalog } = $props();

	const TYPE = { top: 1, mid: 0, bottom: -1 };

	/** Utilisé il y a moins de MIN ans → « Experience », plus de MAX ans → « Notion ». */
	const MIN = 2;
	const MAX = 5;

	function getType(end: string, short: Date, long: Date): number {
		const date = getDate(end);
		if (date > short) return TYPE.top;
		if (date < long) return TYPE.bottom;
		return TYPE.mid;
	}

	function addSkill(refs: number[], source: string[] | undefined, dest: SkillsCat[], type: number) {
		if (!source) return;
		for (const ref of refs) {
			const name = source[ref];
			if (name === undefined) continue;
			const existing = dest.find((skill) => skill.name === name);
			if (existing) existing.type = Math.max(type, existing.type);
			else dest.push({ type, name });
		}
	}

	const categories = $derived.by(() => {
		const short = new Date();
		short.setFullYear(short.getFullYear() - MIN);
		const long = new Date();
		long.setFullYear(long.getFullYear() - MAX);

		const result = { langs: [] as SkillsCat[], libs: [] as SkillsCat[], tools: [] as SkillsCat[] };
		const experiences: { end: string; skills: SkillRefs }[] = [
			...(cv.jobs as Job[]),
			...(cv.formations as Formation[])
		];
		for (const exp of experiences) {
			const type = getType(exp.end, short, long);
			addSkill(exp.skills.langs, skills.langs, result.langs, type);
			addSkill(exp.skills.libs, skills.libs, result.libs, type);
			addSkill(exp.skills.tools, skills.tools, result.tools, type);
		}
		return result;
	});

	const rows = $derived([
		{ title: m.cv_level_top(), type: TYPE.top },
		{ title: m.cv_level_mid(), type: TYPE.mid },
		{ title: m.cv_level_bottom(), type: TYPE.bottom }
	]);

	const cols = $derived([
		{ title: m.cv_col_langs(), skills: categories.langs },
		{ title: m.cv_col_libs(), skills: categories.libs },
		{ title: m.cv_col_tools(), skills: categories.tools }
	]);

	// Compétences mises en avant (en gras et remontées en tête de cellule) avant impression
	const highlighted = new SvelteSet<string>();

	function toggle(name: string) {
		if (highlighted.has(name)) highlighted.delete(name);
		else highlighted.add(name);
	}

	function cell(list: SkillsCat[], type: number) {
		const items = list.filter((skill) => skill.type === type);
		return [
			...items.filter((skill) => highlighted.has(skill.name)),
			...items.filter((skill) => !highlighted.has(skill.name))
		];
	}
</script>

<table class="w-full border-solid text-[9px]">
	<thead class="font-bold">
		<tr class="border-b border-cv-light text-center">
			<td class="w-[25%] border-r border-cv-light"></td>
			{#each cols as col (col.title)}
				<td class="w-[25%]">
					<H3>{col.title.toLocaleUpperCase()}</H3>
				</td>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each rows as row (row.type)}
			<tr>
				<td class="border-r border-cv-light text-[7px] font-bold">
					{row.title.toUpperCase()}
				</td>
				{#each cols as col (col.title)}
					<td>
						{#each cell(col.skills, row.type) as skill (skill.name)}
							<button
								type="button"
								class="w-full cursor-pointer {highlighted.has(skill.name) ? 'font-bold' : ''}"
								aria-pressed={highlighted.has(skill.name)}
								onclick={() => toggle(skill.name)}
							>
								{skill.name.toUpperCase()}
							</button>
						{/each}
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<style>
	td {
		padding: 5px;
	}
</style>
