<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	let { stack }: { stack: string[] } = $props();
	// Editor code only loads for the owner (same dialog as the Skills section)
	const editor = $derived(
		page.data.signedIn === true ? import('./edit/SkillsEditor.svelte').then((module) => module.default) : null
	);
</script>

<div class="bg-inverse text-inverse-fg">
	<div class="container-page flex flex-wrap items-center justify-between gap-x-10 gap-y-4 py-6">
		<h2 class="sr-only">{m.stack_label()}</h2>
		<ul
			class="m-0 flex list-none flex-wrap gap-x-10 gap-y-3 p-0 font-mono text-[15px] tracking-[1px]"
		>
			<li aria-hidden="true" class="text-inverse-subtle uppercase">{m.stack_label()}</li>
			{#each stack as tech, i (i)}
				<li>{tech}</li>
			{/each}
		</ul>
		{#await editor then SkillsEditor}
			{#if SkillsEditor}<SkillsEditor />{/if}
		{/await}
	</div>
</div>
