<script lang="ts">
	import { EDIT_LIMITS, type HobbyEdit } from '#lib/content/edit.js';
	import { m } from '#lib/paraglide/messages.js';
	import { baseLocale, locales } from '#lib/paraglide/runtime.js';
	import EditDialog from './EditDialog.svelte';
	import ListEditor from './ListEditor.svelte';
	import LocaleField from './LocaleField.svelte';

	/** context / triggerLabel: when opened from another page (the CV toolbar) */
	let {
		class: className = '',
		context,
		triggerLabel
	}: { class?: string; context?: string; triggerLabel?: string } = $props();
	let data = $state<{ items: HobbyEdit[] } | null>(null);

	const empty = () => Object.fromEntries(locales.map((locale) => [locale, '']));
	const create = (): HobbyEdit => ({ name: empty(), reason: empty() });
</script>

<EditDialog
	section="hobbies"
	title={m.about_hobbies()}
	hint={m.edit_shared_hint()}
	{context}
	{triggerLabel}
	bind:data
	class={className}
>
	{#if data}
		<ListEditor bind:items={data.items} name={(hobby) => hobby.name[baseLocale]} {create}>
			{#snippet item(i)}
				{@const hobby = data!.items[i]}
				<LocaleField label={m.edit_hobby_name()} bind:value={hobby.name} maxlength={EDIT_LIMITS.hobbyName} />
				<LocaleField
					label={m.edit_hobby_reason()}
					bind:value={hobby.reason}
					maxlength={EDIT_LIMITS.hobbyReason}
					required={false}
				/>
			{/snippet}
		</ListEditor>
	{/if}
</EditDialog>
