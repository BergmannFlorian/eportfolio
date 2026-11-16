<script lang="ts">
	import { getDate, shortDate } from '#lib/cv/helpers.js';
	import type { Formation } from '#lib/cv/types.js';
	import H3 from '../fonts/H3.svelte';

	let { formations }: { formations: Formation[] } = $props();

	// Copie triée (la plus récente en premier) sans modifier la prop
	const sorted = $derived(
		[...formations].sort((a, b) => getDate(b.start).getTime() - getDate(a.start).getTime())
	);
</script>

<div class="w-full align-top text-[11px]">
	{#each sorted as formation (formation.name)}
		<div class="mb-3">
			<div class="grid w-full grid-cols-10">
				<div class="col-span-3 flex flex-nowrap font-bold text-nowrap">
					<H3 style="text-cv-dark pr-2">
						{shortDate(formation.start, formation.end).toUpperCase()}
					</H3>
					<H3>{formation.company}</H3>
				</div>
				<div class="col-start-4 col-end-11">
					<H3>{formation.name}</H3>
				</div>
				<div class="col-start-4 col-end-11">
					<H3>{formation.degree}</H3>
				</div>
				<ul class="col-start-4 col-end-11 list-disc">
					{#each formation.tasks as task (task)}
						<li>{task}</li>
					{/each}
				</ul>
			</div>
		</div>
	{/each}
</div>
