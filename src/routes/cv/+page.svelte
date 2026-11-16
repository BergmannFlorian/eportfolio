<script lang="ts">
	import '@fontsource/teachers/400.css';
	import '@fontsource/teachers/700.css';

	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, locales, localizeHref } from '#lib/paraglide/runtime.js';
	import Certificates from './components/first/Certificates.svelte';
	import Formations from './components/first/Formations.svelte';
	import Infos from './components/first/Infos.svelte';
	import Section from './components/first/Section.svelte';
	import Skills from './components/first/Skills.svelte';
	import H1 from './components/fonts/H1.svelte';
	import PageNumber from './components/PageNumber.svelte';
	import Jobs from './components/second/Jobs.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cv = $derived(data.cv);
	const current = getLocale();

	// Index du premier poste de chaque page « Expériences » (pagination côté client)
	const pagesStartIndex = $state([0]);

	function addJobsPage(startIndex: number) {
		if (!pagesStartIndex.includes(startIndex)) pagesStartIndex.push(startIndex);
	}
</script>

<svelte:head>
	<title>{m.cv_meta_title()}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="cv-screen min-h-screen bg-neutral-200 text-black">
	<!-- Barre d'outils (non imprimée) -->
	<div
		class="toolbar sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-cv-dark px-4 py-3 font-sans text-sm text-white"
	>
		<a href={localizeHref('/')} class="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
			>← {m.cv_back()}</a
		>
		<p class="m-0 text-neutral-300">{m.cv_hint()}</p>
		<div class="flex items-center gap-4">
			{#each locales as locale (locale)}
				<a
					href={localizeHref('/cv', { locale })}
					hreflang={locale}
					aria-current={locale === current ? 'true' : undefined}
					data-sveltekit-reload
					class="inline-flex min-h-11 items-center uppercase {locale === current
						? 'font-bold underline underline-offset-4'
						: 'text-neutral-300 hover:text-white'}">{locale}</a
				>
			{/each}
			<button
				type="button"
				onclick={() => window.print()}
				class="min-h-11 cursor-pointer bg-white px-4 font-medium text-cv-dark hover:bg-neutral-200"
				>{m.cv_print()}</button
			>
		</div>
	</div>

	<div class="pdf pt-1 font-cv text-[14px] font-normal">
		<div class="page">
			<div class="h-full w-[7cm] max-w-[7cm] min-w-[7cm]">
				<Infos infos={cv.infos} />
			</div>
			<div class="right flex h-full flex-col gap-y-5 py-5 pr-5 pl-2">
				<H1><div class="whitespace-pre-line">{cv.infos.title}</div></H1>
				<Section title={m.cv_section_skills()}>
					<Skills {cv} skills={data.skills} />
				</Section>
				<Section title={m.cv_section_certificates()}>
					<Certificates certificates={cv.certificates} />
				</Section>
				<Section title={m.cv_section_formations()}>
					<Formations formations={cv.formations} />
				</Section>
			</div>
			<PageNumber page={1} total={pagesStartIndex.length + 1} />
		</div>
		{#each pagesStartIndex as start, index (start)}
			<div class="page">
				<Jobs jobs={cv.jobs} addPage={addJobsPage} {start} />
				<PageNumber page={index + 2} total={pagesStartIndex.length + 1} />
			</div>
		{/each}
	</div>
</div>

<style>
	.pdf :global(*) {
		box-sizing: border-box;
	}

	.page {
		width: 21cm;
		height: 29.7cm;
		margin: 1cm auto;
		border: 1px #d3d3d3 solid;
		border-radius: 5px;
		background: white;
		box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-wrap: nowrap;
		flex-shrink: 0;
		position: relative;
		overflow: hidden;
	}

	@page {
		size: A4;
		margin: 0;
	}

	@media print {
		.toolbar {
			display: none;
		}
		.cv-screen {
			background: none;
		}
		.page {
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
			margin: 0;
			border: initial;
			border-radius: initial;
			box-shadow: initial;
			background: initial;
			page-break-after: always;
			break-after: page;
			padding-top: 0;
		}
		.pdf {
			padding: 0;
		}
	}
</style>
