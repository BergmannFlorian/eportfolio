<script lang="ts">
	import { EDIT_LIMITS, type FactEdit } from '#lib/content/edit.js';
	import { solarIcons } from '#lib/cv/icons.js';
	import { m } from '#lib/paraglide/messages.js';
	import { baseLocale, locales } from '#lib/paraglide/runtime.js';
	import EditDialog from './EditDialog.svelte';
	import { FIELD, LABEL } from './field.js';
	import ListEditor from './ListEditor.svelte';
	import LocaleField from './LocaleField.svelte';

	/** context / triggerLabel: when opened from another page (the CV toolbar) */
	let {
		class: className = '',
		context,
		triggerLabel
	}: { class?: string; context?: string; triggerLabel?: string } = $props();
	let data = $state<{ items: FactEdit[] } | null>(null);
	const uid = $props.id();

	// Icons the CV can draw (src/lib/cv/icons.ts)
	const icons = Object.keys(solarIcons).map((name) => `solar:${name}`);
	const empty = () => Object.fromEntries(locales.map((locale) => [locale, '']));
	const create = (): FactEdit => ({ icon: '', onSite: true, onCv: true, label: empty(), value: empty() });
</script>

<EditDialog
	section="facts"
	title={m.about_facts()}
	hint="{m.edit_facts_hint()} {m.edit_shared_hint()}"
	{context}
	{triggerLabel}
	bind:data
	class={className}
>
	{#if data}
		<ListEditor bind:items={data.items} name={(fact) => fact.label[baseLocale]} {create}>
			{#snippet item(i)}
				{@const fact = data!.items[i]}
				<LocaleField label={m.edit_fact_label()} bind:value={fact.label} maxlength={EDIT_LIMITS.factLabel} />
				<LocaleField label={m.edit_fact_value()} bind:value={fact.value} maxlength={EDIT_LIMITS.factValue} />
				<div class="flex flex-wrap items-end gap-x-6 gap-y-4">
					<div class="flex min-w-50 flex-col gap-1.5">
						<label for="{uid}-{i}-icon" class={LABEL}>{m.edit_fact_icon()}</label>
						<div class="flex items-center gap-2">
							<span class="flex size-11 shrink-0 items-center justify-center border border-border text-fg-strong">
								{#if solarIcons[fact.icon.replace(/^solar:/, '')]}
									<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"
										>{@html solarIcons[fact.icon.replace(/^solar:/, '')]}</svg
									>
								{/if}
							</span>
							<select id="{uid}-{i}-icon" bind:value={fact.icon} class="{FIELD} cursor-pointer">
								<option value="">{m.edit_fact_icon_none()}</option>
								{#each icons as icon (icon)}
									<option value={icon}>{icon.replace(/^solar:/, '')}</option>
								{/each}
								{#if fact.icon && !icons.includes(fact.icon)}
									<option value={fact.icon}>{fact.icon}</option>
								{/if}
							</select>
						</div>
					</div>
					<label class="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]">
						<input type="checkbox" bind:checked={fact.onSite} class="size-4.5 accent-accent" />
						{m.edit_fact_on_site()}
					</label>
					<label class="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]">
						<input type="checkbox" bind:checked={fact.onCv} class="size-4.5 accent-accent" />
						{m.edit_fact_on_cv()}
					</label>
				</div>
			{/snippet}
		</ListEditor>
	{/if}
</EditDialog>
