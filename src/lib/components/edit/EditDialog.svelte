<script lang="ts" generics="S extends EditSection">
	import type { Snippet } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import type { EditSection, EditSections } from '#lib/content/edit.js';
	import { m } from '#lib/paraglide/messages.js';

	/**
	 * "Edit" button + dialog of one content section, for the signed-in owner.
	 * Loads the section from /admin/content/<section> when opened (every locale),
	 * the section editor binds `data` and renders its fields, then saves it back.
	 * Nothing is written before "Save"; closing with changes asks first.
	 */
	interface Props {
		section: S;
		title: string;
		context?: string;
		/** Note shown above the fields */
		hint?: string;
		/** Content being edited, null until loaded */
		data: EditSections[S] | null;
		/** Extra check before saving, returns an error message */
		validate?: (data: EditSections[S]) => string | null;
		class?: string;
		children: Snippet;
	}

	let {
		section,
		title,
		context = m.edit_context_home(),
		hint,
		data = $bindable(),
		validate,
		class: className = '',
		children
	}: Props = $props();

	const uid = $props.id();
	let dialog: HTMLDialogElement;
	let loading = $state(false);
	let busy = $state(false);
	let error = $state<string | null>(null);
	let snapshot = '';

	async function open() {
		error = null;
		data = null;
		loading = true;
		dialog.showModal();
		try {
			const response = await fetch(`/admin/content/${section}`);
			if (!response.ok) throw new Error(String(response.status));
			data = await response.json();
			snapshot = JSON.stringify(data);
		} catch {
			error = m.edit_error_load();
		} finally {
			loading = false;
		}
	}

	function cancel() {
		const dirty = data !== null && JSON.stringify(data) !== snapshot;
		if (dirty && !confirm(m.edit_discard())) return;
		dialog.close();
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!data || busy) return;
		error = validate?.(data) ?? null;
		if (error) return;
		busy = true;
		try {
			const response = await fetch(`/admin/content/${section}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});
			if (!response.ok) throw new Error(String(response.status));
			dialog.close();
			await invalidateAll();
		} catch {
			error = m.edit_error_save();
		} finally {
			busy = false;
		}
	}
</script>

<button
	type="button"
	onclick={open}
	aria-label={m.edit_button_label({ section: title })}
	class="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 border border-border-strong bg-bg px-3.5 text-sm font-medium text-fg-strong normal-case tracking-normal hover:border-accent hover:bg-accent hover:text-accent-fg {className}"
>
	<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z M13 7l4 4" /></svg>
	{m.edit_button()}
</button>

<dialog
	bind:this={dialog}
	aria-labelledby="{uid}-title"
	oncancel={(event) => {
		event.preventDefault();
		cancel();
	}}
	class="m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-200 flex-col border-0 border-t-2 border-border-strong bg-surface p-0 text-fg backdrop:bg-[rgb(20_20_20/0.55)] open:flex"
>
	<form onsubmit={submit} class="flex min-h-0 flex-1 flex-col">
		<div class="flex items-baseline justify-between gap-4 px-7 pt-6">
			<div class="flex flex-col gap-1.5">
				<p class="m-0 font-mono text-[13px] text-accent">{context}</p>
				<h2 id="{uid}-title" class="m-0 font-display text-3xl leading-[1.1] font-normal text-fg-strong">{title}</h2>
			</div>
			<button
				type="button"
				onclick={cancel}
				aria-label={m.edit_close()}
				class="flex size-11 shrink-0 cursor-pointer items-center justify-center text-fg-subtle hover:text-fg-strong"
			>
				<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
			</button>
		</div>

		<div class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-7 py-6">
			<p class="m-0 text-sm text-fg-subtle">
				{#if hint}{hint}{/if}
				{m.edit_fallback_hint()}
			</p>
			{#if loading}
				<p class="m-0 py-10 text-center text-fg-muted">{m.edit_loading()}</p>
			{:else if data}
				{@render children()}
			{/if}
		</div>

		{#if error}
			<p role="alert" class="mx-7 mb-4 border-l-3 border-accent bg-bg px-3.5 py-3 text-[15px]">{error}</p>
		{/if}

		<div class="flex flex-wrap justify-end gap-3 border-t border-border px-7 pt-5 pb-6">
			<button type="button" onclick={cancel} class="btn-outline min-h-11 cursor-pointer px-5 text-[15px]"
				>{m.edit_cancel()}</button
			>
			<button
				type="submit"
				disabled={busy || !data}
				class="btn-primary min-h-11 cursor-pointer px-5 text-[15px] disabled:cursor-not-allowed disabled:opacity-45"
				>{busy ? m.edit_saving() : m.edit_save()}</button
			>
		</div>
	</form>
</dialog>
