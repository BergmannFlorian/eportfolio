<script lang="ts">
	import ProjectBlock from '#lib/components/ProjectBlock.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { localizeHref } from '#lib/paraglide/runtime.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{m.projects_meta_title()}</title>
	<meta name="description" content={m.projects_meta_description()} />
</svelte:head>

<section class="container-page flex flex-col gap-10 pt-10 pb-14 sm:pt-14 sm:pb-18">
	<a
		href="{localizeHref('/')}#realisations"
		class="inline-flex min-h-11 items-center gap-2 self-start font-mono text-sm text-fg-subtle no-underline hover:text-fg-strong"
	>
		<svg
			aria-hidden="true"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg
		>
		{m.projects_back()}
	</a>
	<div class="flex flex-wrap items-end justify-between gap-x-16 gap-y-6">
		<div class="flex flex-col gap-4">
			<p class="kicker">{m.projects_kicker()}</p>
			<h1
				class="m-0 font-display text-[clamp(44px,7vw,88px)] leading-none font-normal tracking-[-1.5px] text-fg-strong"
			>
				{m.projects_title_1()}<br />{m.projects_title_2()}
			</h1>
		</div>
		<p class="m-0 max-w-[420px] text-lg leading-[1.6] text-fg-muted">{m.projects_desc()}</p>
	</div>
</section>

<section aria-label={m.projects_list_label()} class="container-page pb-20 sm:pb-28">
	<ol class="m-0 list-none border-t border-border-strong p-0">
		{#each data.projects as project, i (project.id)}
			<ProjectBlock {project} index={i} />
		{/each}
	</ol>
</section>
