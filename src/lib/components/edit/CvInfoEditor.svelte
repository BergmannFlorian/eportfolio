<script lang="ts">
	import { EDIT_LIMITS, type CvInfoEdit } from '#lib/content/edit.js';
	import { m } from '#lib/paraglide/messages.js';
	import EditDialog from './EditDialog.svelte';
	import { FIELD, LABEL } from './field.js';
	import LocaleField from './LocaleField.svelte';

	/** CV heading, name and city */
	let { class: className = '' }: { class?: string } = $props();
	let data = $state<CvInfoEdit | null>(null);
	const uid = $props.id();
</script>

<EditDialog
	section="cv"
	title={m.edit_cv_title()}
	context={m.edit_context_cv()}
	triggerLabel={m.edit_cv_title()}
	hint={m.edit_cv_hint()}
	bind:data
	class={className}
>
	{#if data}
		<div class="flex flex-col gap-1.5">
			<label for="{uid}-name" class={LABEL}>{m.edit_cv_name()}</label>
			<input id="{uid}-name" type="text" required maxlength={EDIT_LIMITS.personName} bind:value={data.name} class={FIELD} />
		</div>
		<div class="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-4">
			<div class="flex flex-col gap-1.5">
				<label for="{uid}-postal" class={LABEL}>{m.edit_cv_postal_code()}</label>
				<input id="{uid}-postal" type="text" maxlength={EDIT_LIMITS.postalCode} bind:value={data.postalCode} class={FIELD} />
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="{uid}-city" class={LABEL}>{m.edit_cv_city()}</label>
				<input id="{uid}-city" type="text" maxlength={EDIT_LIMITS.city} bind:value={data.city} class={FIELD} />
			</div>
		</div>
		<LocaleField label={m.edit_cv_heading()} bind:value={data.cvTitle} maxlength={EDIT_LIMITS.cvTitle} multiline rows={3} />
	{/if}
</EditDialog>
