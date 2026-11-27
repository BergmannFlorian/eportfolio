<script lang="ts">
	import { pad, type PersonalProject } from '#lib/content/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { page } from '$app/state';
	import ArrowUpRight from './icons/ArrowUpRight.svelte';
	import ImageEditor from './ImageEditor.svelte';

	let { project, index }: { project: PersonalProject; index: number } = $props();
	const signedIn = $derived(page.data.signedIn === true);

	let open = $state(false);
	const panelId = $derived(`projet-${project.id}-details`);
</script>

<li class="flex flex-wrap gap-x-12 gap-y-6 border-b border-border py-10">
	<div class="flex flex-[0_0_180px] flex-col items-start gap-3.5">
		<span class="font-mono text-[13px] text-fg-subtle">{pad(index)}</span>
		{#if project.kindLabel}
			<span
				class="border border-border-strong px-2.5 py-1 font-mono text-xs tracking-[1px] uppercase"
				>{project.kindLabel}</span
			>
		{/if}
	</div>

	<div class="flex min-w-0 flex-[999_1_560px] flex-wrap gap-x-10 gap-y-8">
	<div class="flex min-w-0 flex-[999_1_380px] flex-col gap-5">
		<h2 class="m-0 font-display text-4xl leading-[1.1] font-normal tracking-[-0.5px] text-fg-strong">
			{project.name}
		</h2>
		{#if project.description}
			<p class="m-0 max-w-[760px] text-lg leading-[1.6] text-fg-muted">{project.description}</p>
		{/if}
		{#if project.skills.length > 0}
			<ul class="m-0 flex list-none flex-wrap gap-2 p-0">
				{#each project.skills as skill (skill)}
					<li class="border border-chip-border bg-surface px-2.5 py-1 font-mono text-xs">{skill}</li>
				{/each}
			</ul>
		{/if}

		{#if project.url || project.hasMore}
			<div class="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
				{#if project.url}
					<a href={project.url} class="btn-primary px-5 text-[15px]">
						{project.visitLabel}
						<ArrowUpRight size={16} />
					</a>
				{/if}
				{#if project.hasMore}
					<button
						type="button"
						class="btn-outline cursor-pointer bg-transparent px-5 text-[15px]"
						aria-expanded={open}
						aria-controls={panelId}
						onclick={() => (open = !open)}
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
							><path d="M5 12h14" />{#if !open}<path d="M12 5v14" />{/if}</svg
						>
						{open ? m.project_less() : m.project_more()}
					</button>
				{/if}
			</div>
		{/if}

	</div>

		<!-- Project image (16:10), beside the text; below it on small screens -->
		{#if project.image}
			<figure class="relative m-0 max-w-105 flex-[1_1_320px]">
				<img
					src={project.image.url}
					alt={project.image.alt}
					loading="lazy"
					class="block aspect-[16/10] w-full border border-border object-cover"
				/>
				{#if signedIn}
					<ImageEditor
						target="project"
						id={project.projectId}
						hasImage={true}
						variant="overlay"
						context={project.name}
						class="absolute right-3 bottom-3"
					/>
				{/if}
			</figure>
		{:else if signedIn}
			<ImageEditor
				target="project"
				id={project.projectId}
				hasImage={false}
				variant="add"
				context={project.name}
				class="aspect-[16/10] max-w-105 flex-[1_1_320px]"
			/>
		{/if}

		{#if project.hasMore}
			<div
				id={panelId}
				hidden={!open}
				class="mt-2 flex basis-full flex-wrap gap-x-12 gap-y-8 border border-border bg-surface p-6 sm:p-8"
			>
				<div class="flex min-w-0 flex-[999_1_420px] flex-col gap-4">
					{#if project.highlights.length > 0}
						<h3 class="label-caps text-[13px]">{m.project_highlights()}</h3>
						<ul class="m-0 flex list-none flex-col gap-3 p-0">
							{#each project.highlights as highlight (highlight)}
								<li class="flex gap-3.5 leading-[1.6] text-fg-muted">
									<span aria-hidden="true" class="mt-[9px] size-2 shrink-0 bg-accent"></span>
									<span>{highlight}</span>
								</li>
							{/each}
						</ul>
					{/if}
					{#if project.snippet}
						<div class="flex flex-col gap-2.5 pt-2">
							<h3 class="label-caps text-[13px]">{m.project_usage()}</h3>
							<pre
								class="m-0 overflow-x-auto bg-inverse px-5 py-4 font-mono text-sm leading-[1.6] text-inverse-fg">{project.snippet}</pre>
						</div>
					{/if}
				</div>
				{#if project.facts.length > 0}
					<dl class="m-0 flex flex-[1_1_260px] flex-col border-t-2 border-border-strong">
						{#each project.facts as fact (fact.label)}
							<div class="flex justify-between gap-4 border-b border-border py-3 text-[15px]">
								<dt class="text-fg-subtle">{fact.label}</dt>
								<dd class="m-0 text-right font-medium">{fact.value}</dd>
							</div>
						{/each}
					</dl>
				{/if}
			</div>
		{/if}
	</div>
</li>
