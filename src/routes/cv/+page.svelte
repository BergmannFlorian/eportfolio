<script lang="ts">
	import '@fontsource/teachers/400.css';
	import '@fontsource/teachers/700.css';

	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, locales, localizeHref } from '#lib/paraglide/runtime.js';
	import { dateFormat, getDate, shortDate } from '#lib/cv/helpers.js';
	import Certificates from './components/first/Certificates.svelte';
	import Infos from './components/first/Infos.svelte';
	import PersonalProjects from './components/first/PersonalProjects.svelte';
	import Section from './components/first/Section.svelte';
	import Skills from './components/first/Skills.svelte';
	import H1 from './components/fonts/H1.svelte';
	import PageNumber from './components/PageNumber.svelte';
	import Entries from './components/second/Entries.svelte';
	import type { CvEntry } from './components/second/Entry.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cv = $derived(data.cv);
	const current = getLocale();

	const jobs = $derived<CvEntry[]>(
		cv.jobs.map((job) => ({
			key: job.title + job.start,
			date: `${dateFormat(job.start)} - ${dateFormat(job.end)}`,
			title: job.title,
			organization: job.company,
			tasks: job.tasks,
			projects: job.projects
		}))
	);

	// Most recent first
	const formations = $derived<CvEntry[]>(
		[...cv.formations]
			.sort((a, b) => getDate(b.start).getTime() - getDate(a.start).getTime())
			.map((formation) => ({
				key: formation.name + formation.start,
				date: shortDate(formation.start, formation.end),
				title: [formation.name, formation.degree].filter(Boolean).join(' – '),
				organization: formation.company,
				tasks: formation.tasks,
				projects: []
			}))
	);

	// Index of the first entry on each page (client-side pagination). Jobs come
	// first; formations always start on a new page.
	const jobPages = $state([0]);
	const formationPages = $state([0]);
	const total = $derived(1 + jobPages.length + formationPages.length);

	const addPage = (pages: number[]) => (startIndex: number) => {
		if (!pages.includes(startIndex)) pages.push(startIndex);
	};
</script>

<svelte:head>
	<title>{m.cv_meta_title()}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="cv-screen min-h-screen bg-neutral-200 text-black">
	<!-- Toolbar (hidden when printing) -->
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
					<Skills levels={data.levels} />
				</Section>
				<Section title={m.cv_section_certificates()}>
					<Certificates certificates={cv.certificates} />
				</Section>
				{#if cv.personalProjects.length > 0}
					<Section title={m.cv_section_personal_projects()}>
						<PersonalProjects projects={cv.personalProjects} />
					</Section>
				{/if}
			</div>
			<PageNumber page={1} {total} />
		</div>
		{#each jobPages as start, index (start)}
			<div class="page">
				<Entries title={m.cv_section_jobs()} entries={jobs} addPage={addPage(jobPages)} {start} />
				<PageNumber page={index + 2} {total} />
			</div>
		{/each}
		{#each formationPages as start, index (start)}
			<div class="page">
				<Entries
					title={m.cv_section_formations()}
					entries={formations}
					addPage={addPage(formationPages)}
					{start}
				/>
				<PageNumber page={jobPages.length + index + 2} {total} />
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
