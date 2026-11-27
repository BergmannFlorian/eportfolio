<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { LibraryImage } from '#lib/media/library.js';
	import {
		IMAGE_FORMATS,
		MAX_SOURCE_BYTES,
		formatBytes,
		prepareImage,
		type ImageSlotKind,
		type PreparedImage
	} from '#lib/media/prepare-image.js';
	import type { ImageChoice } from '#lib/media/send-image.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	/**
	 * Chooses an image for a slot: a new file (cropped and converted in the browser)
	 * or a file of the library. The parent saves `choice` with sendImage().
	 * Used by ImageEditor (portrait, logos) and inside the project editor.
	 */
	interface Props {
		target: ImageSlotKind;
		/** File currently in the slot, marked in the library */
		currentFile?: string | null;
		/** Chosen image, null until one is picked */
		choice: ImageChoice | null;
		/** Smaller drop zone, inside another form */
		compact?: boolean;
	}

	let { target, currentFile = null, choice = $bindable(), compact = false }: Props = $props();

	let input: HTMLInputElement;
	let tab = $state<'upload' | 'library'>('upload');
	let prepared = $state<PreparedImage | null>(null);
	let picked = $state<LibraryImage | null>(null);
	let sourceSize = $state(0);
	let preview = $state<string | null>(null);
	let library = $state<LibraryImage[] | null>(null);
	let libraryError = $state(false);
	let confirmDelete = $state<string | null>(null);
	let busy = $state(false);
	let error = $state<string | null>(null);
	let dragging = $state(false);

	const locale = getLocale();
	const format = $derived(IMAGE_FORMATS[target]);
	// SVG files are only accepted as logos
	const choices = $derived((library ?? []).filter((image) => target === 'logo' || image.type !== 'svg'));

	const labels = $derived(
		{
			portrait: { hint: m.image_hint_portrait(), ratio: m.image_ratio_portrait() },
			project: { hint: m.image_hint_project(), ratio: m.image_ratio_project() },
			logo: { hint: m.image_hint_logo(), ratio: m.image_ratio_logo() }
		}[target]
	);

	/** Forgets the chosen image, keeps the tab */
	function clear() {
		if (preview) URL.revokeObjectURL(preview);
		prepared = null;
		picked = null;
		preview = null;
		sourceSize = 0;
		error = null;
		confirmDelete = null;
		choice = null;
		if (input) input.value = '';
	}

	onDestroy(() => {
		if (preview) URL.revokeObjectURL(preview);
	});

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
			clear();
			prepared = result;
			sourceSize = file.size;
			preview = URL.createObjectURL(result.blob);
			choice = { blob: result.blob };
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
		clear();
		picked = image;
		choice = { existing: image.file };
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

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		choose(event.dataTransfer?.files[0]);
	}
</script>

<div class="flex flex-col gap-4">
	<input
		bind:this={input}
		type="file"
		accept={target === 'logo' ? 'image/svg+xml,image/png,image/webp,image/jpeg' : 'image/png,image/webp,image/jpeg'}
		class="sr-only"
		tabindex="-1"
		onchange={(event) => choose(event.currentTarget.files?.[0])}
	/>

	{#if !prepared && !picked}
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
				class="flex cursor-pointer flex-col items-center justify-center gap-3 border-[1.5px] border-dashed bg-bg p-6 text-center text-fg-muted hover:border-border-strong {compact
					? 'min-h-40'
					: 'min-h-60'} {dragging ? 'border-border-strong' : 'border-chip-border'}"
			>
				<svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
				<span class="text-base font-medium text-fg-strong">{busy ? m.edit_loading() : m.image_drop()}</span>
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
						class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-x-3 gap-y-4 overflow-y-auto p-0 pr-1 {compact
							? 'max-h-72'
							: 'max-h-96'}"
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
				clear();
				if (!fromLibrary) input.click();
			}}
			class="btn-outline min-h-10 cursor-pointer self-start px-4 text-sm">{m.image_other()}</button
		>
	{/if}

	{#if error}
		<p role="alert" class="m-0 border-l-3 border-accent bg-bg px-3.5 py-3 text-[15px]">{error}</p>
	{/if}
</div>
