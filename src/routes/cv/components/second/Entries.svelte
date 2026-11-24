<script lang="ts">
	import { onMount, tick } from 'svelte';
	import H2 from '../fonts/H2.svelte';
	import Entry, { type CvEntry } from './Entry.svelte';

	interface Props {
		title: string;
		entries: CvEntry[];
		/** Index of the first entry shown on this page */
		start: number;
		/** Called with the index of the first entry that does not fit, to create the next page */
		addPage: (startIndex: number) => void;
	}

	let { title, entries, start, addPage }: Props = $props();

	let container: HTMLDivElement;
	// Number of entries shown on this page (all at first, reduced after measuring)
	let count = $state<number | null>(null);

	const visible = $derived(entries.slice(start, count === null ? undefined : start + count));

	onMount(async () => {
		await tick();
		const bottom = container.offsetTop + container.offsetHeight;
		const children = [...container.children] as HTMLElement[];
		const overflow = children.findIndex((el) => el.offsetTop + el.offsetHeight > bottom);
		// At least one entry per page, to avoid an infinite loop when a single entry is too long
		if (overflow > 0) {
			count = overflow;
			addPage(start + overflow);
		}
	});
</script>

<div class="flex h-full w-full flex-col py-7">
	<H2>{title.toUpperCase()}</H2>
	<div bind:this={container} class="min-h-0 w-full flex-1">
		{#each visible as entry (entry.key)}
			<Entry {entry} />
		{/each}
	</div>
</div>
