<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { theme } from '#lib/theme/theme.svelte.js';
	import { themeOptions } from './theme-options.js';

	// Système / Clair / Sombre side by side (mobile menu)
	const options = $derived(themeOptions());
</script>

<div role="group" aria-label={m.theme_label()} class="flex border border-border">
	{#each options as option (option.value)}
		<button
			type="button"
			aria-pressed={theme.preference === option.value}
			onclick={() => theme.set(option.value)}
			class="min-h-11 cursor-pointer px-3 text-sm {theme.preference === option.value
				? 'bg-inverse text-inverse-fg'
				: 'text-fg-subtle hover:text-fg-strong'}"
		>
			{option.label}
		</button>
	{/each}
</div>
