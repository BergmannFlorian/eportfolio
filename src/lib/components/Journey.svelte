<script lang="ts">
	import { page } from '$app/state';
	import type { HomeJob } from '#lib/content/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import ImageEditor from './ImageEditor.svelte';
	import SectionIntro from './SectionIntro.svelte';
	let { jobs }: { jobs: HomeJob[] } = $props();

	const signedIn = $derived(page.data.signedIn === true);
	// The logo column only exists once a logo is set (or to add one when signed in)
	const showLogos = $derived(signedIn || jobs.some((job) => job.logo));
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
		{#each jobs as job (job.date + job.org)}
			<li
				class="flex flex-wrap gap-x-8 gap-y-2 border-b border-border {showLogos
					? 'items-center py-5'
					: 'items-baseline py-6'}"
			>
				<span class="flex-[0_0_220px] font-mono text-sm text-fg-subtle">{job.date}</span>
				{#if showLogos}
					<!-- Logo shown as provided, whole (never cropped) -->
					<span class="relative flex size-14 shrink-0 items-center justify-center">
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
						{#if signedIn && job.organizationId !== null}
							<ImageEditor
								target="logo"
								id={job.organizationId}
								hasImage={job.logo !== null}
								variant={job.logo ? 'badge' : 'add-square'}
								context={job.org}
								class={job.logo ? 'absolute -right-2.5 -bottom-2.5' : ''}
							/>
						{/if}
					</span>
				{/if}
				<span class="flex-[999_1_280px] font-display text-2xl">{job.role}</span>
				<span class="flex-none text-[15px] font-semibold tracking-[0.5px] uppercase">{job.org}</span>
			</li>
		{/each}
	</ol>
</section>
