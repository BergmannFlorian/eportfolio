<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { ImageSlotKind } from '#lib/media/prepare-image.js';
	import { sendImage, type ImageChoice } from '#lib/media/send-image.js';
	import { m } from '#lib/paraglide/messages.js';
	import { locales } from '#lib/paraglide/runtime.js';
	import ImagePicker from './ImagePicker.svelte';

	/**
	 * Image edit button + dialog of the portrait and the organization logos, only
	 * rendered for the signed-in owner (project images are edited in the project editor).
	 * - overlay: "Change…" button over an existing image
	 * - add: dashed placeholder filling its container, for an empty slot
	 * - badge / add-square: small controls for the Journey logos
	 */
	interface Props {
		target: ImageSlotKind;
		/** Organization id (none for the portrait) */
		id?: number | null;
		hasImage: boolean;
		variant: 'overlay' | 'add' | 'badge' | 'add-square';
		/** Shown above the dialog title, e.g. the company name */
		context: string;
		class?: string;
	}

	let { target, id = null, hasImage, variant, context, class: className = '' }: Props = $props();

	let dialog: HTMLDialogElement;
	let isOpen = $state(false);
	let choice = $state<ImageChoice | null>(null);
	let alt = $state<Record<string, string>>({});
	let currentFile = $state<string | null>(null);
	let busy = $state(false);
	let error = $state<string | null>(null);

	const needsAlt = $derived(target !== 'logo');
	const uid = $derived(`${target}-${id ?? 0}`);

	const title = $derived(
		{ portrait: m.image_dialog_portrait(), project: m.image_dialog_project(), logo: m.image_dialog_logo() }[target]
	);

	const triggerLabel = $derived(
		target === 'logo'
			? hasImage
				? m.image_edit_logo({ org: context })
				: m.image_add_logo({ org: context })
			: hasImage
				? target === 'portrait'
					? m.image_change_photo()
					: m.image_change()
				: m.image_add()
	);

	async function open() {
		choice = null;
		error = null;
		currentFile = null;
		alt = Object.fromEntries(locales.map((l) => [l, '']));
		isOpen = true;
		dialog.showModal();
		if (!hasImage) return;
		const params = new URLSearchParams({ target, ...(id === null ? {} : { id: String(id) }) });
		const response = await fetch(`/admin/media?${params}`);
		if (!response.ok) return;
		const slot: { file: string | null; alt: Record<string, string> } = await response.json();
		currentFile = slot.file;
		if (needsAlt) alt = { ...alt, ...slot.alt };
	}

	function close() {
		dialog.close();
	}

	async function send(action: 'save' | 'remove') {
		busy = true;
		error = null;
		try {
			await sendImage({ target, id, action, choice, alt: needsAlt ? alt : null });
			close();
			await invalidateAll();
		} catch {
			error = m.image_error_save();
		} finally {
			busy = false;
		}
	}

	const canSave = $derived(!busy && (choice !== null || (hasImage && needsAlt)));
	const pencil = 'M4 20h4L19 9l-4-4L4 16v4z M13 7l4 4';
</script>

{#if variant === 'overlay'}
	<button
		type="button"
		onclick={open}
		class="inline-flex min-h-10 cursor-pointer items-center gap-2 border border-border-strong bg-bg px-3.5 text-sm font-medium text-fg-strong hover:border-accent hover:bg-accent hover:text-accent-fg {className}"
	>
		<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d={pencil} /></svg>
		{triggerLabel}
	</button>
{:else if variant === 'add'}
	<button
		type="button"
		onclick={open}
		class="flex cursor-pointer flex-col items-center justify-center gap-2.5 border-[1.5px] border-dashed border-chip-border text-[15px] text-fg-subtle hover:border-border-strong hover:text-fg-strong {className}"
	>
		<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
		{triggerLabel}
	</button>
{:else if variant === 'badge'}
	<button
		type="button"
		onclick={open}
		aria-label={triggerLabel}
		title={triggerLabel}
		class="flex size-7 cursor-pointer items-center justify-center border border-border-strong bg-bg text-fg-strong hover:border-accent hover:bg-accent hover:text-accent-fg {className}"
	>
		<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d={pencil} /></svg>
	</button>
{:else}
	<button
		type="button"
		onclick={open}
		aria-label={triggerLabel}
		title={triggerLabel}
		class="flex size-14 cursor-pointer items-center justify-center border-[1.5px] border-dashed border-chip-border text-fg-subtle hover:border-border-strong hover:text-fg-strong {className}"
	>
		<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
	</button>
{/if}

<dialog
	bind:this={dialog}
	aria-labelledby="image-dialog-title-{uid}"
	onclose={() => (isOpen = false)}
	class="m-auto w-[calc(100%-32px)] max-w-160 border-0 border-t-2 border-border-strong bg-surface p-0 text-fg backdrop:bg-[rgb(20_20_20/0.55)]"
>
	<div class="flex items-baseline justify-between gap-4 px-7 pt-6">
		<div class="flex flex-col gap-1.5">
			<p class="m-0 font-mono text-[13px] text-accent">{context}</p>
			<h2 id="image-dialog-title-{uid}" class="m-0 font-display text-3xl leading-[1.1] font-normal text-fg-strong">
				{title}
			</h2>
		</div>
		<button
			type="button"
			onclick={close}
			aria-label={m.image_close()}
			class="flex size-11 cursor-pointer items-center justify-center text-fg-subtle hover:text-fg-strong"
		>
			<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
		</button>
	</div>

	<div class="flex flex-col gap-6 px-7 py-6">
		<!-- Recreated at every opening: starts on a fresh upload tab -->
		{#if isOpen}
			<ImagePicker {target} {currentFile} bind:choice />
		{/if}

		{#if needsAlt}
			<fieldset class="m-0 flex flex-col gap-3 border-0 p-0">
				<legend class="pb-1 text-sm font-medium">
					{m.image_alt_legend()} <span class="font-normal text-fg-subtle">{m.image_alt_hint()}</span>
				</legend>
				{#each locales as l (l)}
					<div class="flex flex-col gap-1.5">
						<label for="alt-{uid}-{l}" class="font-mono text-xs text-fg-subtle uppercase">{l}</label>
						<input
							id="alt-{uid}-{l}"
							type="text"
							lang={l}
							maxlength="255"
							bind:value={alt[l]}
							class="min-h-11 w-full border border-border bg-bg px-3 text-[15px] text-fg focus:border-fg-strong focus:outline-2 focus:outline-offset-1 focus:outline-accent"
						/>
					</div>
				{/each}
			</fieldset>
		{/if}

		{#if error}
			<p role="alert" class="m-0 border-l-3 border-accent bg-bg px-3.5 py-3 text-[15px]">{error}</p>
		{/if}
	</div>

	<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border px-7 pt-5 pb-6">
		{#if hasImage}
			<button
				type="button"
				disabled={busy}
				onclick={() => send('remove')}
				class="min-h-11 cursor-pointer text-sm text-fg-muted underline underline-offset-4 hover:text-accent disabled:opacity-45"
				>{m.image_remove()}</button
			>
		{:else}
			<span></span>
		{/if}
		<div class="flex gap-3">
			<button type="button" onclick={close} class="btn-outline min-h-11 cursor-pointer px-5 text-[15px]"
				>{m.image_cancel()}</button
			>
			<button
				type="button"
				disabled={!canSave}
				onclick={() => send('save')}
				class="btn-primary min-h-11 cursor-pointer px-5 text-[15px] disabled:cursor-not-allowed disabled:opacity-45"
				>{busy ? m.image_saving() : m.image_save()}</button
			>
		</div>
	</div>
</dialog>
