<script lang="ts">
	import { page } from '$app/state';
	import type { HomeJob } from '#lib/content/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import SectionIntro from './SectionIntro.svelte';

	/** `hidden`: experiences not shown on the site, only listed for the signed-in owner */
	let { jobs, hidden = [] }: { jobs: HomeJob[]; hidden?: HomeJob[] } = $props();

	const signedIn = $derived(page.data.signedIn === true);
	const rows = $derived(
		signedIn && hidden.length > 0 ? [...jobs, ...hidden].sort((a, b) => b.start.localeCompare(a.start)) : jobs
	);
	// The logo column only exists once a logo is set
	const showLogos = $derived(rows.some((job) => job.logo));
	// Editor code only loads for the owner
	const editor = $derived(
		signedIn ? import('./edit/ExperienceEditor.svelte').then((module) => module.default) : null
	);
</script>

<section
	id="parcours"
	aria-labelledby="parcours-title"
	class="container-page flex flex-col gap-12 pt-20 sm:pt-28"
>
	<div class="flex flex-wrap items-end justify-between gap-6">
		<SectionIntro
			id="parcours-title"
			kicker={m.journey_kicker()}
			lines={[m.journey_title_1(), m.journey_title_2()]}
		/>
		{#await editor then ExperienceEditor}
			{#if ExperienceEditor}
				<ExperienceEditor experienceId={null} triggerLabel={m.edit_experience_add()} icon="add" />
			{/if}
		{/await}
	</div>

	<ol class="m-0 list-none border-t border-border-strong p-0">
		{#each rows as job (job.experienceId)}
			<li
				class="flex flex-wrap gap-x-8 gap-y-2 border-b border-border {showLogos
					? 'items-center py-5'
					: 'items-baseline py-6'}"
			>
				<span class="flex flex-[0_0_220px] flex-col gap-1.5 font-mono text-sm text-fg-subtle">
					{job.date}
					{#if !job.onSite}
						<span class="self-start border border-border-strong px-2 py-0.5 text-xs text-fg-muted"
							>{m.journey_hidden()}</span
						>
					{/if}
				</span>
				{#if showLogos}
					<!-- Logo shown as provided, whole (never cropped) -->
					<span class="flex size-14 shrink-0 items-center justify-center {job.onSite ? '' : 'opacity-55'}">
						{#if job.logo}
							<span class="flex size-14 items-center justify-center border border-border bg-white p-2">
								<img
									src={job.logo}
									alt={m.journey_logo_alt({ org: job.org })}
									loading="lazy"
									class="block max-h-full max-w-full object-contain"
								/>
							</span>
						{/if}
					</span>
				{/if}
				<span class="flex-[999_1_280px] font-display text-2xl {job.onSite ? '' : 'text-fg-subtle'}">{job.role}</span>
				<span class="flex-none text-[15px] font-semibold tracking-[0.5px] uppercase {job.onSite ? '' : 'text-fg-subtle'}"
					>{job.org}</span
				>
				{#await editor then ExperienceEditor}
					{#if ExperienceEditor}
						<ExperienceEditor experienceId={job.experienceId} name={job.role} class="self-center" />
					{/if}
				{/await}
			</li>
		{/each}
	</ol>
</section>
