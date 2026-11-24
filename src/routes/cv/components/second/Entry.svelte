<script lang="ts" module>
	import type { Project } from '#lib/cv/types.js';

	/** One job or formation, as shown on the pages after the first one. */
	export interface CvEntry {
		key: string;
		date: string;
		title: string;
		organization: string;
		tasks: string[];
		projects: Project[];
	}
</script>

<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import H3 from '../fonts/H3.svelte';

	let { entry }: { entry: CvEntry } = $props();
</script>

<div class="w-full">
	<!-- Same width on both sides so the title is centered on the page -->
	<div class="grid grid-cols-[170px_1fr_170px] items-center gap-x-3 pb-2">
		<H3 style="bg-cv-dark text-cv-light px-2.5 whitespace-nowrap">{entry.date.toUpperCase()}</H3>
		<H3 style="text-center">{entry.title.toUpperCase()}</H3>
		<div class="pr-5 text-right">
			{entry.organization.toUpperCase()}
		</div>
	</div>
	<div class="pl-4">
		<ul class="list-disc pl-4">
			{#each entry.tasks as task (task)}
				<li>{task}</li>
			{/each}
		</ul>
		{#if entry.projects.length > 0}
			<div class="pt-2">
				<div class="pl-1">{m.cv_projects()}</div>
				<ul class="list-disc pl-4">
					{#each entry.projects as project (project.name)}
						<li>
							<div class="flex">
								<div class="font-bold">{project.name}</div>
								{#if project.link}
									<a href={project.link}>: {project.link}</a>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
	<div class="mt-2 mb-1 flex w-full justify-center">
		<hr class="w-15 border-3 border-solid text-cv-light" />
	</div>
</div>
