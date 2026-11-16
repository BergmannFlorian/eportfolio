<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { theme } from '#lib/theme/theme.svelte.js';
	import { isThemeId, themes } from '#lib/theme/themes.js';

	function onchange(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		theme.set(isThemeId(value) ? value : 'system');
	}
</script>

<label class="flex items-center gap-2 text-sm text-fg-subtle">
	<span class="sr-only">{m.theme_label()}</span>
	<svg
		aria-hidden="true"
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.75"
		stroke-linecap="round"
		stroke-linejoin="round"
		><circle cx="12" cy="12" r="9" /><path d="M12 3v18" /><path
			d="M12 3a9 9 0 0 1 0 18z"
			fill="currentColor"
		/></svg
	>
	<select
		value={theme.preference}
		{onchange}
		class="min-h-11 cursor-pointer border border-border bg-bg py-2 pr-2 pl-2 text-sm text-fg hover:border-border-strong"
	>
		<option value="system">{m.theme_system()}</option>
		{#each themes as t (t.id)}
			<option value={t.id}>{t.label()}</option>
		{/each}
	</select>
</label>
