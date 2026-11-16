<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { Job as JobData } from '#lib/cv/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import H2 from '../fonts/H2.svelte';
	import Job from './Job.svelte';

	interface Props {
		jobs: JobData[];
		/** Index du premier poste affiché sur cette page */
		start: number;
		/** Appelé avec l'index du premier poste qui ne tient pas, pour créer une page suivante */
		addPage: (startIndex: number) => void;
	}

	let { jobs, start, addPage }: Props = $props();

	let container: HTMLDivElement;
	// Nombre de postes affichés sur cette page (tous au départ, réduit après mesure)
	let count = $state<number | null>(null);

	const visible = $derived(jobs.slice(start, count === null ? undefined : start + count));

	onMount(async () => {
		await tick();
		const bottom = container.offsetTop + container.offsetHeight;
		const children = [...container.children] as HTMLElement[];
		const overflow = children.findIndex((el) => el.offsetTop + el.offsetHeight > bottom);
		// Au moins un poste par page, pour éviter une boucle infinie si un poste est trop long
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
