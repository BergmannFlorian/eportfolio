<script lang="ts">
	import { EDIT_LIMITS, type AboutEdit } from '#lib/content/edit.js';
	import { m } from '#lib/paraglide/messages.js';
	import EditDialog from './EditDialog.svelte';
	import LocaleField from './LocaleField.svelte';

	let { class: className = '' }: { class?: string } = $props();
	let data = $state<AboutEdit | null>(null);
</script>

<EditDialog section="about" title={m.edit_about_title()} hint={m.edit_shared_hint()} bind:data class={className}>
	{#if data}
		<LocaleField label={m.edit_about()} bind:value={data.about} maxlength={EDIT_LIMITS.about} multiline rows={8} />
	{/if}
</EditDialog>
