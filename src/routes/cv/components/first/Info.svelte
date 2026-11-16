<script lang="ts">
	import type { Snippet } from 'svelte';
	import { solarIcons } from '#lib/cv/icons.js';

	let { icon = null, children }: { icon?: string | null; children: Snippet } = $props();

	// « solar:map-point-linear » → contenu SVG embarqué (voir src/lib/cv/icons.ts)
	const body = $derived(icon ? solarIcons[icon.replace(/^solar:/, '')] : undefined);
</script>

<div class="flex content-center">
	{#if body}
		<svg
			aria-hidden="true"
			width="1em"
			height="1em"
			viewBox="0 0 24 24"
			class="my-auto shrink-0 pr-0.5"
		>
			{@html body}
		</svg>
	{/if}
	{@render children()}
</div>
