<script lang="ts">
	import { LABEL } from './field.js';

	/** Skills to tick, grouped by category (project technologies, experience skills) */
	interface Props {
		legend: string;
		skills: { id: number; name: string; category: string }[];
		selected: number[];
	}

	let { legend, skills, selected = $bindable() }: Props = $props();

	// Skills by category, in the catalog order
	const groups = $derived.by(() => {
		const byCategory = new Map<string, { id: number; name: string }[]>();
		for (const skill of skills) byCategory.set(skill.category, [...(byCategory.get(skill.category) ?? []), skill]);
		return [...byCategory];
	});
</script>

<fieldset class="m-0 flex flex-col gap-3 border-0 p-0">
	<legend class="pb-2 {LABEL}">{legend}</legend>
	{#each groups as [category, group] (category)}
		<div class="flex flex-col gap-2">
			<span class="font-mono text-xs text-fg-subtle uppercase">{category}</span>
			<div class="flex flex-wrap gap-2">
				{#each group as skill (skill.id)}
					<label
						class="cursor-pointer border border-chip-border px-2.5 py-1.5 font-mono text-xs has-checked:border-inverse has-checked:bg-inverse has-checked:text-inverse-fg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
					>
						<input type="checkbox" value={skill.id} bind:group={selected} class="sr-only" />
						{skill.name}
					</label>
				{/each}
			</div>
		</div>
	{/each}
</fieldset>
