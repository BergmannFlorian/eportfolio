<script lang="ts">
	import type { Snippet } from 'svelte';
	import H2 from '../fonts/H2.svelte';

	let {
		title,
		center = false,
		children
	}: { title: string; center?: boolean; children: Snippet } = $props();
</script>

<div class="flex w-full flex-wrap justify-center">
	<H2>{title.toUpperCase()}</H2>
	<div class="mb-3 flex w-[90%] {center ? 'mt-2 justify-center' : ''}">
		<hr class="w-15 border-3 border-solid text-cv-light" />
	</div>
	<div class="w-full">
		{@render children()}
	</div>
</div>
