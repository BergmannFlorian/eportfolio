<script lang="ts">
	import { jobs } from '#lib/content/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import SectionIntro from './SectionIntro.svelte';
</script>

<section
	id="parcours"
	aria-labelledby="parcours-title"
	class="container-page flex flex-col gap-12 pt-20 sm:pt-28"
>
	<SectionIntro
		id="parcours-title"
		kicker={m.journey_kicker()}
		lines={[m.journey_title_1(), m.journey_title_2()]}
	/>

	<ol class="m-0 list-none border-t border-border-strong p-0">
		{#each jobs as job (job.org)}
			<li class="flex flex-wrap items-baseline gap-x-8 gap-y-2 border-b border-border py-6">
				<span class="flex-[0_0_220px] font-mono text-sm text-fg-subtle">{job.date()}</span>
				<span class="flex-[999_1_320px] font-display text-2xl">{job.role()}</span>
				<span class="flex-none text-[15px] font-semibold tracking-[0.5px] uppercase">{job.org}</span>
			</li>
		{/each}
	</ol>
</section>
