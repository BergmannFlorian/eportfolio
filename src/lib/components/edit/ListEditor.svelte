<script lang="ts" generics="T extends object">
	import { tick, type Snippet } from 'svelte';
	import { pad } from '#lib/content/types.js';
	import { m } from '#lib/paraglide/messages.js';

	/**
	 * Editable list of a section editor: one card per item with move up/down and remove,
	 * plus "Add". The item fields come from the `item` snippet (index of the item).
	 * `compact`: one row per item (fields and buttons side by side), for long lists.
	 */
	interface Props {
		items: T[];
		/** Short name of an item, shown on its card and in the button labels */
		name: (item: T) => string;
		/** New item of the "Add" button (no button without it) */
		create?: () => T;
		/** Text of the "Add" button */
		addLabel?: string;
		compact?: boolean;
		item: Snippet<[number]>;
	}

	let { items = $bindable(), name, create, addLabel, compact = false, item }: Props = $props();
	let list: HTMLOListElement;

	function move(from: number, to: number) {
		[items[from], items[to]] = [items[to], items[from]];
	}

	async function add() {
		if (!create) return;
		items.push(create());
		await tick();
		list.lastElementChild?.querySelector<HTMLElement>('input, textarea, select')?.focus();
	}

	const icon = 'flex size-9 cursor-pointer items-center justify-center text-fg-subtle hover:bg-inverse hover:text-inverse-fg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-fg-subtle';
</script>

{#snippet controls(i: number, label: string)}
	<span class="flex shrink-0 gap-1">
		<button type="button" class={icon} disabled={i === 0} onclick={() => move(i, i - 1)} aria-label={m.edit_move_up({ item: label })}>
			<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
		</button>
		<button type="button" class={icon} disabled={i === items.length - 1} onclick={() => move(i, i + 1)} aria-label={m.edit_move_down({ item: label })}>
			<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
		</button>
		<button type="button" class={icon} onclick={() => items.splice(i, 1)} aria-label={m.edit_remove({ item: label })}>
			<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
		</button>
	</span>
{/snippet}

<div class="flex flex-col {compact ? 'gap-3' : 'gap-4'}">
	{#if items.length === 0}
		<p class="m-0 border-[1.5px] border-dashed border-chip-border bg-bg text-center text-fg-muted {compact ? 'py-4' : 'py-8'}">
			{m.edit_empty()}
		</p>
	{/if}
	<ol bind:this={list} class="m-0 flex list-none flex-col p-0 {compact ? 'gap-2' : 'gap-4'}">
		{#each items as entry, i (entry)}
			{@const label = name(entry) || m.edit_untitled()}
			{#if compact}
				<li class="flex flex-wrap items-center gap-x-3 gap-y-2 border border-border bg-bg py-2 pr-2 pl-3">
					<span class="font-mono text-[13px] text-fg-subtle">{pad(i)}</span>
					<div class="flex min-w-0 flex-[1_1_320px] flex-wrap items-center gap-x-4 gap-y-2">{@render item(i)}</div>
					{@render controls(i, label)}
				</li>
			{:else}
				<li class="flex flex-col gap-5 border border-border bg-bg p-4 sm:p-5">
					<div class="flex items-center justify-between gap-3 border-b border-border pb-3">
						<span class="flex min-w-0 items-baseline gap-3">
							<span class="font-mono text-[13px] text-fg-subtle">{pad(i)}</span>
							<span class="truncate font-medium text-fg-strong">{label}</span>
						</span>
						{@render controls(i, label)}
					</div>
					{@render item(i)}
				</li>
			{/if}
		{/each}
	</ol>
	{#if create}
		<button type="button" onclick={add} class="btn-outline cursor-pointer self-start px-5 text-[15px] {compact ? 'min-h-10' : 'min-h-11'}">
			<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
			{addLabel ?? m.edit_add()}
		</button>
	{/if}
</div>
