<script lang="ts">
	import type { Localized } from '#lib/content/edit.js';
	import { m } from '#lib/paraglide/messages.js';
	import { baseLocale, locales } from '#lib/paraglide/runtime.js';
	import { FIELD, HINT, LABEL, TEXTAREA } from './field.js';

	/**
	 * One translated field: an input per locale, side by side on wide screens.
	 * The other locales show the French text as placeholder (what the site falls back to).
	 */
	interface Props {
		label: string;
		/** Shown after the label */
		hint?: string;
		value: Localized;
		maxlength: number;
		multiline?: boolean;
		rows?: number;
		/** French required (default) */
		required?: boolean;
	}

	let { label, hint, value = $bindable(), maxlength, multiline = false, rows = 3, required = true }: Props = $props();
	const uid = $props.id();
</script>

<fieldset class="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
	<legend class="pb-2 {LABEL}">
		{label}{#if hint} <span class={HINT}>{hint}</span>{/if}
	</legend>
	<div class="grid gap-3 sm:grid-cols-2">
		{#each locales as locale (locale)}
			{@const isBase = locale === baseLocale}
			<div class="flex min-w-0 flex-col gap-1.5">
				<label for="{uid}-{locale}" class="font-mono text-xs text-fg-subtle uppercase">
					{locale}{#if required && isBase}<span class="normal-case {HINT}"> · {m.edit_required()}</span>{/if}
				</label>
				{#if multiline}
					<textarea
						id="{uid}-{locale}"
						lang={locale}
						{rows}
						{maxlength}
						required={required && isBase}
						placeholder={isBase ? '' : value[baseLocale]}
						bind:value={value[locale]}
						class={TEXTAREA}
					></textarea>
				{:else}
					<input
						id="{uid}-{locale}"
						type="text"
						lang={locale}
						{maxlength}
						required={required && isBase}
						placeholder={isBase ? '' : value[baseLocale]}
						bind:value={value[locale]}
						class={FIELD}
					/>
				{/if}
			</div>
		{/each}
	</div>
</fieldset>
