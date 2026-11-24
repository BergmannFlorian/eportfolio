<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import type { RatedSkill, RatedSkills, SkillLevel } from '#lib/cv/skills.js';
	import { m } from '#lib/paraglide/messages.js';
	import H3 from '../fonts/H3.svelte';

	// Levels are computed server-side (same as /api/v1/skills)
	let { levels: categories }: { levels: RatedSkills } = $props();

	const hasPersonalOnly = $derived(
		Object.values(categories).some((list) => list.some((skill) => skill.personalOnly))
	);

	const rows = $derived<{ title: string; level: SkillLevel }[]>([
		{ title: m.cv_level_top(), level: 'top' },
		{ title: m.cv_level_mid(), level: 'mid' },
		{ title: m.cv_level_bottom(), level: 'bottom' }
	]);

	const cols = $derived([
		{ title: m.cv_col_langs(), skills: categories.langs },
		{ title: m.cv_col_libs(), skills: categories.libs },
		{ title: m.cv_col_tools(), skills: categories.tools }
	]);

	// Skills highlighted before printing (bold and moved to the top of their cell)
	const highlighted = new SvelteSet<string>();

	function toggle(name: string) {
		if (highlighted.has(name)) highlighted.delete(name);
		else highlighted.add(name);
	}

	function cell(list: RatedSkill[], level: SkillLevel) {
		const items = list.filter((skill) => skill.level === level);
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
		{#each rows as row (row.level)}
			<tr>
				<td class="border-r border-cv-light text-[7px] font-bold">
					{row.title.toUpperCase()}
				</td>
				{#each cols as col (col.title)}
					<td>
						{#each cell(col.skills, row.level) as skill (skill.name)}
							<button
								type="button"
								class="w-full cursor-pointer {highlighted.has(skill.name) ? 'font-bold' : ''}"
								aria-pressed={highlighted.has(skill.name)}
								onclick={() => toggle(skill.name)}
							>
								{skill.name.toUpperCase()}{skill.personalOnly ? '*' : ''}
							</button>
						{/each}
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
{#if hasPersonalOnly}
	<p class="m-0 pt-1 text-right text-[7px]">{m.cv_skill_personal_note()}</p>
{/if}

<style>
	td {
		padding: 5px;
	}
</style>
