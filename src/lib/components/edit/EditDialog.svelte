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
		/** Row of the section (project id); none for a new project */
		id?: number | null;
		title: string;
		context?: string;
		/** Visible text of the button, "Edit" by default */
		triggerLabel?: string;
		icon?: 'edit' | 'add' | 'order';
		/** Shows the "empty translation falls back to French" note */
		translated?: boolean;
		/** Note shown above the fields */
		hint?: string;
		/** Content being edited, null until loaded */
		data: EditSections[S] | null;
		/** Extra check before saving, returns an error message */
		validate?: (data: EditSections[S]) => string | null;
		/** Called once the content is loaded, to set up state kept outside `data` */
		onload?: (data: EditSections[S]) => void;
		/** Changes kept outside `data` (asks before closing) */
		isDirty?: () => boolean;
		/** Runs after the section is saved, with the row id (a created project's id) */
		afterSave?: (id: number | null) => Promise<void>;
		/** Message when afterSave fails (the section itself is saved) */
		afterSaveError?: string;
		class?: string;
		children: Snippet;
	}

	let {
		section,
		id = null,
		title,
		context = m.edit_context_home(),
		triggerLabel,
		icon = 'edit',
		translated = true,
		hint,
		data = $bindable(),
		validate,
		onload,
		isDirty,
		afterSave,
		afterSaveError,
		class: className = '',
		children
	}: Props = $props();

	const uid = $props.id();
	let dialog: HTMLDialogElement;
	let loading = $state(false);
	let busy = $state(false);
	let error = $state<string | null>(null);
	let snapshot = '';
	// Row being edited: becomes the created id once a new project is saved, so saving
	// again (e.g. after a failed image upload) updates it instead of creating another
	let rowId = $state<number | null>(null);
	const endpoint = $derived(`/admin/content/${section}${rowId === null ? '' : `?id=${rowId}`}`);
	const icons = {
		edit: 'M4 20h4L19 9l-4-4L4 16v4z M13 7l4 4',
		add: 'M12 5v14M5 12h14',
		order: 'M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4'
	};

	async function open() {
		error = null;
		data = null;
		rowId = id;
		loading = true;
		dialog.showModal();
		try {
			const response = await fetch(endpoint);
			if (!response.ok) throw new Error(String(response.status));
			const loaded: EditSections[S] = await response.json();
			onload?.(loaded);
			data = loaded;
			snapshot = JSON.stringify(data);
		} catch {
			error = m.edit_error_load();
		} finally {
			loading = false;
		}
	}

	function cancel() {
		const dirty = data !== null && (JSON.stringify(data) !== snapshot || isDirty?.() === true);
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
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});
			if (!response.ok) throw new Error(String(response.status));
			const saved: { id: number | null } = await response.json();
			rowId = saved.id ?? rowId;
			snapshot = JSON.stringify(data);
		} catch {
			error = m.edit_error_save();
			busy = false;
			return;
		}
		try {
			await afterSave?.(rowId);
			dialog.close();
		} catch {
			error = afterSaveError ?? m.edit_error_save();
		} finally {
			busy = false;
			await invalidateAll();
		}
	}
</script>

<button
	type="button"
	onclick={open}
	aria-label={triggerLabel ? undefined : m.edit_button_label({ section: title })}
	class="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 border border-border-strong bg-bg px-3.5 text-sm font-medium text-fg-strong normal-case tracking-normal hover:border-accent hover:bg-accent hover:text-accent-fg {className}"
>
	<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d={icons[icon]} /></svg>
	{triggerLabel ?? m.edit_button()}
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
			{#if hint || translated}
				<p class="m-0 text-sm text-fg-subtle">
					{#if hint}{hint}{/if}
					{#if translated}{m.edit_fallback_hint()}{/if}
				</p>
			{/if}
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
