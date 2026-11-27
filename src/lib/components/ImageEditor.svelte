<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { LibraryImage } from '#lib/media/library.js';
	import {
		IMAGE_FORMATS,
		MAX_SOURCE_BYTES,
		formatBytes,
		prepareImage,
		type ImageSlotKind,
		type PreparedImage
	} from '#lib/media/prepare-image.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, locales } from '#lib/paraglide/runtime.js';

	/**
	 * Image edit button + dialog, only rendered for the signed-in owner. The image comes
	 * from a new upload or from the library of files already uploaded.
	 * - overlay: "Change…" button over an existing image
	 * - add: dashed placeholder filling its container, for an empty slot
	 * - badge / add-square: small controls for the Journey logos
	 */
	interface Props {
		target: ImageSlotKind;
		/** Project or organization id (none for the portrait) */
		id?: number | null;
		hasImage: boolean;
		variant: 'overlay' | 'add' | 'badge' | 'add-square';
		/** Shown above the dialog title, e.g. the project or company name */
		context: string;
		class?: string;
	}

	let { target, id = null, hasImage, variant, context, class: className = '' }: Props = $props();

	let dialog: HTMLDialogElement;
	let input: HTMLInputElement;
	let tab = $state<'upload' | 'library'>('upload');
	let prepared = $state<PreparedImage | null>(null);
	let picked = $state<LibraryImage | null>(null);
	let sourceSize = $state(0);
	let preview = $state<string | null>(null);
	let alt = $state<Record<string, string>>({});
	let currentFile = $state<string | null>(null);
	let library = $state<LibraryImage[] | null>(null);
	let libraryError = $state(false);
	let confirmDelete = $state<string | null>(null);
	let busy = $state(false);
	let error = $state<string | null>(null);
	let dragging = $state(false);

	const locale = getLocale();
	const needsAlt = $derived(target !== 'logo');
	const format = $derived(IMAGE_FORMATS[target]);
	const uid = $derived(`${target}-${id ?? 0}`);
	// SVG files are only accepted as logos
	const choices = $derived((library ?? []).filter((image) => target === 'logo' || image.type !== 'svg'));

	const labels = $derived(
		{
			portrait: { title: m.image_dialog_portrait(), hint: m.image_hint_portrait(), ratio: m.image_ratio_portrait() },
			project: { title: m.image_dialog_project(), hint: m.image_hint_project(), ratio: m.image_ratio_project() },
			logo: { title: m.image_dialog_logo(), hint: m.image_hint_logo(), ratio: m.image_ratio_logo() }
		}[target]
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

	/** Clears the chosen image (upload or library), keeps the tab and the descriptions. */
	function reset() {
		if (preview) URL.revokeObjectURL(preview);
		prepared = null;
		picked = null;
		preview = null;
		sourceSize = 0;
		error = null;
		confirmDelete = null;
		if (input) input.value = '';
	}

	async function open() {
		reset();
		tab = 'upload';
		library = null;
		currentFile = null;
		alt = Object.fromEntries(locales.map((l) => [l, '']));
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
		reset();
	}

	async function choose(file: File | undefined) {
		if (!file) return;
		error = null;
		if (file.size > MAX_SOURCE_BYTES) {
			error = m.image_error_large();
			return;
		}
		try {
			busy = true;
			const result = await prepareImage(file, target);
			reset();
			prepared = result;
			sourceSize = file.size;
			preview = URL.createObjectURL(result.blob);
		} catch {
			error = m.image_error_read();
		} finally {
			busy = false;
		}
	}

	async function showLibrary() {
		tab = 'library';
		if (library) return;
		libraryError = false;
		try {
			const response = await fetch('/admin/media/library');
			if (!response.ok) throw new Error(String(response.status));
			library = await response.json();
		} catch {
			libraryError = true;
		}
	}

	function pick(image: LibraryImage) {
		reset();
		picked = image;
	}

	/** Deletes an unused file, after a second click on the same button. */
	async function deleteFromLibrary(image: LibraryImage) {
		if (confirmDelete !== image.file) {
			confirmDelete = image.file;
			return;
		}
		confirmDelete = null;
		error = null;
		const response = await fetch(`/admin/media/library?${new URLSearchParams({ file: image.file })}`, {
			method: 'DELETE'
		});
		if (response.ok) library = (library ?? []).filter((entry) => entry.file !== image.file);
		else error = m.image_error_delete();
	}

	function usage(image: LibraryImage): string {
		if (image.usedBy.length === 0) return m.image_library_unused();
		return image.usedBy.map((use) => (use.target === 'portrait' ? m.image_library_portrait() : use.name)).join(', ');
	}

	async function send(action: 'save' | 'remove') {
		const body = new FormData();
		body.set('target', target);
		if (id !== null) body.set('id', String(id));
		body.set('action', action);
		if (action === 'save') {
			if (prepared) body.set('file', prepared.blob, 'image');
			else if (picked) body.set('existing', picked.file);
			for (const l of locales) body.set(`alt_${l}`, alt[l] ?? '');
		}
		busy = true;
		error = null;
		try {
			const response = await fetch('/admin/media', { method: 'POST', body });
			if (!response.ok) throw new Error(String(response.status));
			close();
			await invalidateAll();
		} catch {
			error = m.image_error_save();
		} finally {
			busy = false;
		}
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		choose(event.dataTransfer?.files[0]);
	}

	const canSave = $derived(!busy && (prepared !== null || picked !== null || (hasImage && needsAlt)));
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
	onclose={reset}
	class="m-auto w-[calc(100%-32px)] max-w-160 border-0 border-t-2 border-border-strong bg-surface p-0 text-fg backdrop:bg-[rgb(20_20_20/0.55)]"
>
	<div class="flex items-baseline justify-between gap-4 px-7 pt-6">
		<div class="flex flex-col gap-1.5">
			<p class="m-0 font-mono text-[13px] text-accent">{context}</p>
			<h2 id="image-dialog-title-{uid}" class="m-0 font-display text-3xl leading-[1.1] font-normal text-fg-strong">
				{labels.title}
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
		<input
			bind:this={input}
			type="file"
			accept={target === 'logo' ? 'image/svg+xml,image/png,image/webp,image/jpeg' : 'image/png,image/webp,image/jpeg'}
			class="sr-only"
			tabindex="-1"
			onchange={(event) => choose(event.currentTarget.files?.[0])}
		/>

		{#if !prepared && !picked}
			<div class="flex flex-col gap-4">
				<div class="flex border-b border-border">
					{#each [{ key: 'upload', label: m.image_tab_upload() }, { key: 'library', label: m.image_tab_library() }] as item (item.key)}
						<button
							type="button"
							aria-pressed={tab === item.key}
							onclick={() => (item.key === 'library' ? showLibrary() : (tab = 'upload'))}
							class="-mb-px min-h-11 cursor-pointer border-b-2 px-4 text-[15px] {tab === item.key
								? 'border-accent font-medium text-fg-strong'
								: 'border-transparent text-fg-muted hover:text-fg-strong'}">{item.label}</button
						>
					{/each}
				</div>

				{#if tab === 'upload'}
					<button
						type="button"
						onclick={() => input.click()}
						ondragover={(event) => {
							event.preventDefault();
							dragging = true;
						}}
						ondragleave={() => (dragging = false)}
						ondrop={onDrop}
						class="flex min-h-60 cursor-pointer flex-col items-center justify-center gap-3 border-[1.5px] border-dashed bg-bg p-6 text-center text-fg-muted hover:border-border-strong {dragging
							? 'border-border-strong'
							: 'border-chip-border'}"
					>
						<svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
						<span class="text-base font-medium text-fg-strong">{m.image_drop()}</span>
						<span class="text-sm text-fg-subtle">{labels.hint}</span>
					</button>
				{:else}
					<div class="flex flex-col gap-3">
						<p class="m-0 text-sm text-fg-subtle">{m.image_library_hint()}</p>
						{#if libraryError}
							<p role="alert" class="m-0 border-l-3 border-accent bg-bg px-3.5 py-3 text-[15px]">
								{m.image_error_library()}
							</p>
						{:else if library === null}
							<p class="m-0 py-6 text-center text-fg-muted">{m.image_library_loading()}</p>
						{:else if choices.length === 0}
							<p class="m-0 border-[1.5px] border-dashed border-chip-border bg-bg py-10 text-center text-fg-muted">
								{m.image_library_empty()}
							</p>
						{:else}
							<ul
								class="m-0 grid max-h-96 list-none grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-x-3 gap-y-4 overflow-y-auto p-0 pr-1"
							>
								{#each choices as image (image.file)}
									<li class="flex min-w-0 flex-col gap-1.5">
										<button
											type="button"
											onclick={() => pick(image)}
											aria-label="{usage(image)} · {image.type.toUpperCase()} · {formatBytes(image.size, locale)}"
											class="relative block cursor-pointer border border-border bg-bg p-0 hover:border-accent"
										>
											<img
												src={image.url}
												alt=""
												loading="lazy"
												class="block aspect-square w-full {target === 'logo' || image.type === 'svg'
													? 'bg-white object-contain p-2'
													: 'object-cover'}"
											/>
											{#if image.file === currentFile}
												<span class="absolute top-1.5 left-1.5 bg-accent px-1.5 py-0.5 font-mono text-[11px] text-accent-fg"
													>{m.image_library_current()}</span
												>
											{/if}
										</button>
										<span class="flex items-start justify-between gap-2 text-xs">
											<span class="line-clamp-2 min-w-0 text-fg-subtle">{usage(image)}</span>
											{#if image.usedBy.length === 0}
												<button
													type="button"
													onclick={() => deleteFromLibrary(image)}
													class="shrink-0 cursor-pointer underline underline-offset-2 {confirmDelete === image.file
														? 'font-medium text-accent'
														: 'text-fg-muted hover:text-accent'}"
													>{confirmDelete === image.file
														? m.image_library_delete_confirm()
														: m.image_library_delete()}</button
												>
											{/if}
										</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex flex-wrap items-start gap-x-6 gap-y-5">
				<div class="flex flex-col gap-2">
					<img
						src={prepared ? preview : picked?.url}
						alt=""
						style:aspect-ratio={format.ratio ?? 1}
						class="block border border-border {target === 'logo'
							? 'w-30 bg-white object-contain p-2'
							: target === 'portrait'
								? 'w-40 object-cover grayscale'
								: 'w-60 object-cover'}"
					/>
					<span class="font-mono text-xs text-fg-subtle">{labels.ratio}</span>
				</div>
				<dl class="m-0 flex min-w-50 flex-1 flex-col border-t-2 border-border-strong text-sm">
					{#if prepared}
						{#if prepared.sourceWidth > 0}
							<div class="flex justify-between gap-3 border-b border-border py-2.5">
								<dt class="text-fg-subtle">{m.image_original()}</dt>
								<dd class="m-0 font-medium">
									{prepared.sourceWidth} × {prepared.sourceHeight} · {formatBytes(sourceSize, locale)}
								</dd>
							</div>
						{/if}
						<div class="flex justify-between gap-3 border-b border-border py-2.5">
							<dt class="text-fg-subtle">{m.image_sent()}</dt>
							<dd class="m-0 font-medium">
								{prepared.blob.type.replace('image/', '').replace('svg+xml', 'SVG').toUpperCase()}
								{#if prepared.width > 0}· {prepared.width} × {prepared.height}{/if}
								· {formatBytes(prepared.blob.size, locale)}
							</dd>
						</div>
					{:else if picked}
						<div class="flex justify-between gap-3 border-b border-border py-2.5">
							<dt class="text-fg-subtle">{m.image_from_library()}</dt>
							<dd class="m-0 font-medium">{picked.type.toUpperCase()} · {formatBytes(picked.size, locale)}</dd>
						</div>
					{/if}
				</dl>
			</div>
			<button
				type="button"
				onclick={() => {
					const fromLibrary = picked !== null;
					reset();
					if (!fromLibrary) input.click();
				}}
				class="btn-outline min-h-10 cursor-pointer self-start px-4 text-sm">{m.image_other()}</button
			>
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
