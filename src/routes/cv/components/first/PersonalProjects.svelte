<script lang="ts">
	import type { PersonalProject } from '#lib/cv/types.js';

	let { projects }: { projects: PersonalProject[] } = $props();
</script>

<div class="flex w-full flex-col gap-3.5 pl-2 text-[11px]">
	{#each projects as project (project.name)}
		<article class="flex flex-col gap-1">
			<header class="flex items-baseline justify-between gap-3">
				<h3 class="m-0 font-display font-bold">
					{project.name}
					{#if project.kind}<span class="font-normal text-neutral-500">· {project.kind}</span>{/if}
				</h3>
				{#if project.link}
					<a href={project.link} class="text-[10.5px] whitespace-nowrap text-inherit no-underline"
						>{project.linkLabel}</a
					>
				{/if}
			</header>
			<p class="m-0 leading-normal">{project.description}</p>
			{#if project.skills.length > 0}
				<p class="m-0 text-[9px] tracking-[0.3px] text-neutral-600">
					{project.skills.join(' · ').toUpperCase()}
				</p>
			{/if}
		</article>
	{/each}
</div>
