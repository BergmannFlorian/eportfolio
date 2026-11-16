<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		kicker,
		lines,
		children
	}: {
		/** Heading id, referenced by aria-labelledby on the section */
		id: string;
		kicker: string;
		/** Heading lines, separated by a line break */
		lines: string[];
		children?: Snippet;
	} = $props();
</script>

<div class="flex flex-col gap-4">
	<p class="kicker">{kicker}</p>
	<h2 {id} class="section-title">
		{#each lines as line, i (i)}{#if i > 0}<br />{/if}{line}{/each}
	</h2>
	{@render children?.()}
</div>
