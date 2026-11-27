<script lang="ts">
	import { EDIT_LIMITS, type LanguageEdit } from '#lib/content/edit.js';
	import { m } from '#lib/paraglide/messages.js';
	import { baseLocale, locales } from '#lib/paraglide/runtime.js';
	import EditDialog from './EditDialog.svelte';
	import { FIELD, HINT, LABEL } from './field.js';
	import ListEditor from './ListEditor.svelte';
	import LocaleField from './LocaleField.svelte';

	let { class: className = '' }: { class?: string } = $props();
	let data = $state<{ items: LanguageEdit[] } | null>(null);
	const uid = $props.id();

	const empty = () => Object.fromEntries(locales.map((locale) => [locale, '']));
	const create = (): LanguageEdit => ({ code: '', name: empty(), cefr: '', percent: 50, level: empty() });

	function validate({ items }: { items: LanguageEdit[] }) {
		const codes = items.map((language) => language.code.trim().toLowerCase());
		return new Set(codes).size === codes.length ? null : m.edit_language_duplicate();
	}
</script>

<EditDialog section="languages" title={m.about_languages()} hint={m.edit_shared_hint()} bind:data {validate} class={className}>
	{#if data}
		<ListEditor bind:items={data.items} name={(language) => language.name[baseLocale]} {create}>
			{#snippet item(i)}
				{@const language = data!.items[i]}
				<div class="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
					<div class="flex flex-col gap-1.5">
						<label for="{uid}-{i}-code" class={LABEL}>
							{m.edit_language_code()} <span class={HINT}>{m.edit_language_code_hint()}</span>
						</label>
						<input
							id="{uid}-{i}-code"
							type="text"
							required
							pattern={'[a-z]{2,3}'}
							maxlength={EDIT_LIMITS.languageCode}
							autocapitalize="off"
							spellcheck="false"
							bind:value={language.code}
							class="{FIELD} font-mono"
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<label for="{uid}-{i}-cefr" class={LABEL}>
							{m.edit_language_cefr()} <span class={HINT}>{m.edit_language_cefr_hint()}</span>
						</label>
						<input
							id="{uid}-{i}-cefr"
							type="text"
							required
							maxlength={EDIT_LIMITS.cefr}
							bind:value={language.cefr}
							class="{FIELD} font-mono"
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<label for="{uid}-{i}-percent" class={LABEL}>{m.edit_language_percent()}</label>
						<input
							id="{uid}-{i}-percent"
							type="number"
							required
							min="0"
							max="100"
							step="1"
							bind:value={language.percent}
							class={FIELD}
						/>
					</div>
				</div>
				<LocaleField label={m.edit_language_name()} bind:value={language.name} maxlength={EDIT_LIMITS.languageName} />
				<LocaleField label={m.edit_language_level()} bind:value={language.level} maxlength={EDIT_LIMITS.level} />
			{/snippet}
		</ListEditor>
	{/if}
</EditDialog>
