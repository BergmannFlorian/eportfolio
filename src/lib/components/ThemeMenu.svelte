<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { theme } from '#lib/theme/theme.svelte.js';
	import type { ThemePreference } from '#lib/theme/themes.js';
	import ThemeIcon from './icons/ThemeIcon.svelte';
	import { themeOptions } from './theme-options.js';

	// Square icon button opening the theme list (header, tablet and desktop)
	let open = $state(false);
	let root: HTMLDivElement;
	let button: HTMLButtonElement;

	const options = $derived(themeOptions());
	const current = $derived(options.find((option) => option.value === theme.preference)?.label ?? '');
	const buttonLabel = $derived(m.theme_current({ theme: current }));

	function choose(value: ThemePreference) {
		theme.set(value);
		open = false;
		button.focus();
	}

	function onWindowClick(event: MouseEvent) {
		if (open && !root.contains(event.target as Node)) open = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') {
			open = false;
			button.focus();
		}
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKeydown} />

<div bind:this={root} class="relative shrink-0">
	<button
		bind:this={button}
		type="button"
		aria-expanded={open}
		aria-controls="theme-menu"
		aria-label={buttonLabel}
		title={buttonLabel}
		onclick={() => (open = !open)}
		class="flex size-11 cursor-pointer items-center justify-center border border-border bg-bg text-fg-muted hover:border-border-strong hover:text-fg-strong"
	>
		<ThemeIcon />
	</button>
	{#if open}
		<ul
			id="theme-menu"
			class="absolute top-full right-0 z-20 m-0 mt-1 flex min-w-36 list-none flex-col border border-border-strong bg-surface p-1"
		>
			{#each options as option (option.value)}
				<li>
					<button
						type="button"
						aria-pressed={theme.preference === option.value}
						onclick={() => choose(option.value)}
						class="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 px-3 text-left text-sm {theme.preference ===
						option.value
							? 'bg-inverse text-inverse-fg'
							: 'text-fg hover:bg-bg'}"
					>
						{option.label}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
