<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { Job as JobData } from '#lib/cv/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import H2 from '../fonts/H2.svelte';
	import Job from './Job.svelte';

	interface Props {
		jobs: JobData[];
		/** Index of the first job shown on this page */
		start: number;
		/** Called with the index of the first job that does not fit, to create the next page */
		addPage: (startIndex: number) => void;
	}

	let { jobs, start, addPage }: Props = $props();

	let container: HTMLDivElement;
	// Number of jobs shown on this page (all at first, reduced after measuring)
	let count = $state<number | null>(null);

	const visible = $derived(jobs.slice(start, count === null ? undefined : start + count));

	onMount(async () => {
		await tick();
		const bottom = container.offsetTop + container.offsetHeight;
		const children = [...container.children] as HTMLElement[];
		const overflow = children.findIndex((el) => el.offsetTop + el.offsetHeight > bottom);
		// At least one job per page, to avoid an infinite loop when a single job is too long
		if (overflow > 0) {
			count = overflow;
			addPage(start + overflow);
		}
	});
</script>

<div class="flex h-full w-full flex-col py-7">
	<H2>{m.cv_section_jobs().toUpperCase()}</H2>
	<div bind:this={container} class="min-h-0 w-full flex-1">
		{#each visible as job (job.title + job.start)}
			<Job {job} />
		{/each}
	</div>
</div>
