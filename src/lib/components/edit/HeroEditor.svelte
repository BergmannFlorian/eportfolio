<script lang="ts">
	import { EDIT_LIMITS, type HeroEdit } from '#lib/content/edit.js';
	import { m } from '#lib/paraglide/messages.js';
	import EditDialog from './EditDialog.svelte';
	import { FIELD, HINT, LABEL } from './field.js';
	import LocaleField from './LocaleField.svelte';

	let { class: className = '' }: { class?: string } = $props();
	let data = $state<HeroEdit | null>(null);
	const uid = $props.id();
</script>

<EditDialog section="hero" title={m.edit_hero_title()} hint={m.edit_shared_hint()} bind:data class={className}>
	{#if data}
		<div class="flex flex-col gap-1.5">
			<label for="{uid}-email" class={LABEL}>
				{m.edit_email()} <span class={HINT}>{m.edit_email_hint()}</span>
			</label>
			<input
				id="{uid}-email"
				type="email"
				required
				maxlength={EDIT_LIMITS.email}
				autocomplete="email"
				bind:value={data.email}
				class={FIELD}
			/>
		</div>
		<LocaleField label={m.edit_headline()} bind:value={data.headline} maxlength={EDIT_LIMITS.headline} />
		<LocaleField label={m.edit_bio()} bind:value={data.bio} maxlength={EDIT_LIMITS.bio} multiline rows={5} />
	{/if}
</EditDialog>
