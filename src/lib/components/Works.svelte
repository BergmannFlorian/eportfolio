<script lang="ts">
	import { page } from '$app/state';
	import { pad, type HomePersonalWork, type HomeWork } from '#lib/content/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { localizeHref } from '#lib/paraglide/runtime.js';
	import ArrowRight from './icons/ArrowRight.svelte';
	import ArrowUpRight from './icons/ArrowUpRight.svelte';
	import SectionIntro from './SectionIntro.svelte';
	let { works, personalWorks }: { works: HomeWork[]; personalWorks: HomePersonalWork[] } = $props();
	const signedIn = $derived(page.data.signedIn === true);
	// Editor code only loads for the owner
	const editors = $derived(
		signedIn
			? Promise.all([import('./edit/ProjectEditor.svelte'), import('./edit/ProjectsEditor.svelte')]).then(
					([project, projects]) => ({ ProjectEditor: project.default, ProjectsEditor: projects.default })
				)
			: null
	);
</script>

<!-- Owner control of a card: edit the project (texts and image) -->
{#snippet cardControls(work: { projectId: number; name: string })}
	{#await editors then loaded}
		{#if loaded}
			<loaded.ProjectEditor projectId={work.projectId} name={work.name} class="absolute right-3 bottom-3 z-10" />
		{/if}
	{/await}
{/snippet}

<section
	id="realisations"
	aria-labelledby="realisations-title"
	class="container-page flex flex-col gap-12 pt-20 sm:pt-28"
>
	<div class="flex flex-wrap items-end justify-between gap-6">
		<SectionIntro
			id="realisations-title"
			kicker={m.works_kicker()}
			lines={[m.works_title_1(), m.works_title_2()]}
		/>
		<p class="m-0 max-w-[380px] leading-[1.6] text-fg-subtle">{m.works_desc()}</p>
	</div>

	{#if signedIn}
		{#await editors then loaded}
			{#if loaded}
				<div class="-mt-4 flex flex-wrap gap-3">
					<loaded.ProjectEditor projectId={null} triggerLabel={m.edit_project_add()} icon="add" />
					<loaded.ProjectsEditor />
				</div>
			{/if}
		{/await}
	{/if}

	<ul
		class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] border-t border-l border-t-border-strong border-l-border p-0"
	>
		{#each works as work, i (work.projectId)}
			<li class="relative border-r border-b border-border">
				<a
					href={work.url}
					class="group relative isolate flex h-full min-h-42 flex-col gap-6 overflow-hidden p-7 text-fg no-underline transition-colors hover:text-inverse-fg {work.image
						? ''
						: 'hover:bg-inverse'} {signedIn ? 'pb-20' : ''}"
				>
					{#if work.image}
						<!-- Decorative background: grayscale image under a veil (see .work-veil in app.css) -->
						<img
							src={work.image.url}
							alt=""
							loading="lazy"
							class="absolute inset-0 -z-20 size-full object-cover grayscale transition-transform duration-500 group-hover:scale-[1.04]"
						/>
						<span aria-hidden="true" class="work-veil absolute inset-0 -z-10"></span>
					{/if}
					<span class="flex items-start justify-between gap-3">
						<span class="font-mono text-[13px]">{pad(i)}</span>
						<ArrowUpRight />
					</span>
					<span class="flex flex-col gap-1.5">
						<span class="font-display text-[26px] leading-[1.15]">{work.name}</span>
						{#if work.skills.length > 0}
							<span class="flex flex-wrap gap-2 py-1.5">
								{#each work.skills as skill (skill)}
									<span
										class="border border-chip-border px-2 py-0.5 font-mono text-xs group-hover:border-inverse-subtle"
										>{skill}</span
									>
								{/each}
							</span>
						{/if}
						<span class="text-sm text-fg-subtle group-hover:text-inverse-subtle">{work.domain}</span>
					</span>
				</a>
				{#if signedIn}{@render cardControls(work)}{/if}
			</li>
		{/each}
	</ul>

	{#if personalWorks.length > 0}
		<div class="flex flex-col gap-6 pt-4">
			<div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
				<div class="flex flex-col gap-2">
					<h3 class="label-caps">{m.works_personal_title()}</h3>
					<p class="m-0 max-w-[380px] text-[15px] leading-[1.6] text-fg-subtle">
						{m.works_personal_desc()}
					</p>
				</div>
				<a href={localizeHref('/projets')} class="btn-outline px-5 text-[15px]">
					{m.works_personal_all()}
					<ArrowRight size={16} />
				</a>
			</div>

			<ul
				class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(320px,1fr))] border-t border-l border-t-border-strong border-l-border p-0"
			>
				{#each personalWorks as work, i (work.projectId)}
					<li class="relative border-r border-b border-border">
						<!-- Only linked cards react to hover (group) -->
						<svelte:element
							this={work.url ? 'a' : 'div'}
							href={work.url ?? undefined}
							class="relative isolate flex h-full min-h-56 flex-col gap-6 overflow-hidden bg-surface p-7 text-fg no-underline transition-colors [--veil-color:var(--surface)] {work.url
								? `group hover:text-inverse-fg ${work.image ? '' : 'hover:bg-inverse'}`
								: ''} {signedIn ? 'pb-20' : ''}"
						>
							{#if work.image}
								<img
									src={work.image.url}
									alt=""
									loading="lazy"
									class="absolute inset-0 -z-20 size-full object-cover grayscale transition-transform duration-500 group-hover:scale-[1.04]"
								/>
								<span aria-hidden="true" class="work-veil absolute inset-0 -z-10"></span>
							{/if}
							<span class="flex items-start justify-between gap-3">
								<span class="font-mono text-[13px]">{pad(i)}</span>
								{#if work.url}<ArrowUpRight />{/if}
							</span>
							<span class="flex flex-col gap-3">
								<span class="font-display text-[26px] leading-[1.15]">{work.name}</span>
								{#if work.description}
									<span class="text-[15px] leading-[1.6] text-fg-muted {work.url
										? 'group-hover:text-inverse-fg'
										: ''}"
										>{work.description}</span
									>
								{/if}
								{#if work.skills.length > 0}
									<span class="flex flex-wrap gap-2 pt-1">
										{#each work.skills as skill (skill)}
											<span
												class="border border-chip-border px-2 py-0.5 font-mono text-xs {work.url
													? 'group-hover:border-inverse-subtle'
													: ''}"
												>{skill}</span
											>
										{/each}
									</span>
								{/if}
								{#if work.domain}
									<span class="text-sm break-all text-fg-subtle {work.url
										? 'group-hover:text-inverse-subtle'
										: ''}"
										>{work.domain}</span
									>
								{/if}
							</span>
						</svelte:element>
						{#if signedIn}{@render cardControls(work)}{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</section>
