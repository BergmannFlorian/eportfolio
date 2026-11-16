<script lang="ts">
	import { dateFormat } from '#lib/cv/helpers.js';
	import type { Job } from '#lib/cv/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import H3 from '../fonts/H3.svelte';

	let { job }: { job: Job } = $props();
</script>

<div class="w-full">
	<div class="grid grid-cols-3 justify-between pb-2">
		<H3 style="bg-cv-dark text-cv-light pl-5"
			>{`${dateFormat(job.start)} - ${dateFormat(job.end)}`.toUpperCase()}</H3
		>
		<H3 style="text-center">{job.title.toUpperCase()}</H3>
		<div class="pr-5 text-right">
			{job.company.toUpperCase()}
		</div>
	</div>
	<div class="pl-4">
		<ul class="list-disc pl-4">
			{#each job.tasks as task (task)}
				<li>{task}</li>
			{/each}
		</ul>
		{#if job.projects.length > 0}
			<div class="pt-2">
				<div class="pl-1">{m.cv_projects()}</div>
				<ul class="list-disc pl-4">
					{#each job.projects as project (project.name)}
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
