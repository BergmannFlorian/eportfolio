<script lang="ts">
	import { EDIT_LIMITS, type CertificateEdit } from '#lib/content/edit.js';
	import { m } from '#lib/paraglide/messages.js';
	import EditDialog from './EditDialog.svelte';
	import { FIELD, LABEL } from './field.js';
	import ListEditor from './ListEditor.svelte';

	/** Certificates of the CV (sorted by date there) */
	let { class: className = '' }: { class?: string } = $props();
	let data = $state<{ items: CertificateEdit[] } | null>(null);
	const uid = $props.id();

	const create = (): CertificateEdit => ({ title: '', issuer: '', issuedOn: '', url: '' });
</script>

<EditDialog
	section="certificates"
	title={m.edit_certificates_title()}
	context={m.edit_context_cv()}
	triggerLabel={m.edit_certificates_title()}
	hint={m.edit_certificates_hint()}
	translated={false}
	bind:data
	class={className}
>
	{#if data}
		<ListEditor bind:items={data.items} name={(certificate) => certificate.title} {create} reorder={false}>
			{#snippet item(i)}
				{@const certificate = data!.items[i]}
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1.5 sm:col-span-2">
						<label for="{uid}-{i}-title" class={LABEL}>{m.edit_certificate_title()}</label>
						<input id="{uid}-{i}-title" type="text" required maxlength={EDIT_LIMITS.certificateTitle} bind:value={certificate.title} class={FIELD} />
					</div>
					<div class="flex flex-col gap-1.5">
						<label for="{uid}-{i}-issuer" class={LABEL}>{m.edit_certificate_issuer()}</label>
						<input id="{uid}-{i}-issuer" type="text" maxlength={EDIT_LIMITS.issuer} bind:value={certificate.issuer} class={FIELD} />
					</div>
					<div class="flex flex-col gap-1.5">
						<label for="{uid}-{i}-date" class={LABEL}>{m.edit_certificate_date()}</label>
						<input id="{uid}-{i}-date" type="date" required bind:value={certificate.issuedOn} class={FIELD} />
					</div>
					<div class="flex flex-col gap-1.5 sm:col-span-2">
						<label for="{uid}-{i}-url" class={LABEL}>{m.edit_certificate_url()}</label>
						<input id="{uid}-{i}-url" type="url" maxlength={EDIT_LIMITS.url} placeholder="https://" bind:value={certificate.url} class={FIELD} />
					</div>
				</div>
			{/snippet}
		</ListEditor>
	{/if}
</EditDialog>
