<script lang="ts">
	import { page } from '$app/state';
	import type { HomeSkillGroup } from '#lib/content/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import SectionIntro from './SectionIntro.svelte';
	let { skills }: { skills: HomeSkillGroup[] } = $props();
	// Editor code only loads for the owner
	const editor = $derived(
		page.data.signedIn === true ? import('./edit/SkillsEditor.svelte').then((module) => module.default) : null
	);
</script>

<section
	id="competences"
	aria-labelledby="competences-title"
	class="container-page flex flex-wrap gap-16 pt-20 sm:pt-28"
>
	<div class="flex-[1_1_320px]">
		<SectionIntro
			id="competences-title"
			kicker={m.skills_kicker()}
			lines={[m.skills_title_1(), m.skills_title_2()]}
		>
			<p class="m-0 max-w-[360px] leading-[1.6] text-fg-subtle">{m.skills_desc()}</p>
		</SectionIntro>
		{#await editor then SkillsEditor}
			{#if SkillsEditor}<SkillsEditor class="mt-6" />{/if}
		{/await}
	</div>

	<div class="grid min-w-0 flex-[999_1_560px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-10">
		{#each skills as group, i (i)}
			<div class="flex flex-col gap-4 border-t-2 border-border-strong pt-5">
				<h3 class="label-caps">{group.title}</h3>
				<ul class="m-0 flex list-none flex-wrap gap-2 p-0">
					{#each group.items as item (item)}
						<li class="border border-chip-border bg-surface px-3 py-1.5 text-sm">{item}</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
</section>
