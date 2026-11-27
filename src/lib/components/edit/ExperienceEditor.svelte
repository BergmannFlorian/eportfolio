<script lang="ts">
	import {
		EDIT_LIMITS,
		EXPERIENCE_KINDS,
		NEW_ORGANIZATION,
		NO_ORGANIZATION,
		type EditSections,
		type Localized
	} from '#lib/content/edit.js';
	import { sendImage, type ImageChoice } from '#lib/media/send-image.js';
	import { m } from '#lib/paraglide/messages.js';
	import { baseLocale, locales } from '#lib/paraglide/runtime.js';
	import ImagePicker from '../ImagePicker.svelte';
	import EditDialog from './EditDialog.svelte';
	import { FIELD, HINT, LABEL } from './field.js';
	import ListEditor from './ListEditor.svelte';
	import LocaleField from './LocaleField.svelte';
	import SkillPicker from './SkillPicker.svelte';

	/** Dialog of one experience (experienceId), or of a new one (null) */
	interface Props {
		experienceId: number | null;
		/** Title of the experience, for the dialog title */
		name?: string;
		triggerLabel?: string;
		icon?: 'edit' | 'add';
		class?: string;
	}

	let { experienceId, name, triggerLabel, icon = 'edit', class: className = '' }: Props = $props();
	let data = $state<EditSections['experience'] | null>(null);
	const uid = $props.id();

	const kindLabels = {
		job: m.edit_experience_kind_job(),
		education: m.edit_experience_kind_education(),
		other: m.edit_experience_kind_other()
	};

	const emptyText = (): Localized => Object.fromEntries(locales.map((locale) => [locale, '']));
	const short = (value: Localized) => {
		const textValue = value[baseLocale] ?? '';
		return textValue.length > 60 ? `${textValue.slice(0, 60)}…` : textValue;
	};

	// Logo of the chosen organization: picked here, saved through /admin/media after the experience
	let logoChoice = $state<ImageChoice | null>(null);
	let replacingLogo = $state(false);
	let removeLogo = $state(false);

	const currentLogo = $derived(
		data?.options.organizations.find((organization) => organization.id === data?.experience.organizationId)?.logo ?? null
	);
	const hasOrganization = $derived(
		data !== null &&
			(data.experience.organizationId > 0 ||
				(data.experience.organizationId === NEW_ORGANIZATION && data.experience.newOrganization.trim() !== ''))
	);

	function resetLogo() {
		logoChoice = null;
		replacingLogo = false;
		removeLogo = false;
	}

	async function afterSave(id: number | null) {
		if (id === null || (!logoChoice && !(removeLogo && currentLogo))) return;
		// A new organization only gets its id on save: read it back
		const response = await fetch(`/admin/content/experience?id=${id}`);
		if (!response.ok) throw new Error(String(response.status));
		const saved: EditSections['experience'] = await response.json();
		const organizationId = saved.experience.organizationId;
		if (organizationId <= 0) return;
		await sendImage(
			logoChoice
				? { target: 'logo', id: organizationId, action: 'save', choice: logoChoice }
				: { target: 'logo', id: organizationId, action: 'remove' }
		);
	}
</script>

<EditDialog
	section="experience"
	id={experienceId}
	title={name ?? m.edit_experience_new()}
	context={m.edit_experience_context()}
	hint="{m.edit_experience_hint()} {m.edit_shared_hint()}"
	{triggerLabel}
	{icon}
	bind:data
	onload={resetLogo}
	isDirty={() => logoChoice !== null || removeLogo}
	{afterSave}
	afterSaveError={m.edit_error_logo()}
	remove={{
		label: m.edit_experience_delete(),
		confirm: m.edit_experience_delete_confirm(),
		conflict: m.edit_experience_delete_conflict()
	}}
	class={className}
>
	{#if data}
		{@const experience = data.experience}
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="flex flex-col gap-1.5">
				<label for="{uid}-kind" class={LABEL}>{m.edit_experience_kind()}</label>
				<select id="{uid}-kind" bind:value={experience.kind} class="{FIELD} cursor-pointer">
					{#each EXPERIENCE_KINDS as kind (kind)}
						<option value={kind}>{kindLabels[kind]}</option>
					{/each}
				</select>
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="{uid}-organization" class={LABEL}>{m.edit_experience_organization()}</label>
				<select
					id="{uid}-organization"
					bind:value={experience.organizationId}
					onchange={resetLogo}
					class="{FIELD} cursor-pointer"
				>
					<option value={NO_ORGANIZATION}>{m.edit_experience_no_organization()}</option>
					{#each data.options.organizations as organization (organization.id)}
						<option value={organization.id}>{organization.name}</option>
					{/each}
					<option value={NEW_ORGANIZATION}>{m.edit_experience_new_organization()}</option>
				</select>
			</div>
			{#if experience.organizationId === NEW_ORGANIZATION}
				<div class="flex flex-col gap-1.5 sm:col-start-2">
					<label for="{uid}-new-organization" class={LABEL}>{m.edit_experience_new_organization_name()}</label>
					<input
						id="{uid}-new-organization"
						type="text"
						required
						maxlength={EDIT_LIMITS.organizationName}
						bind:value={experience.newOrganization}
						class={FIELD}
					/>
				</div>
			{/if}
			<div class="flex flex-col gap-1.5">
				<label for="{uid}-start" class={LABEL}>{m.edit_experience_start()}</label>
				<input id="{uid}-start" type="date" required bind:value={experience.start} class={FIELD} />
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="{uid}-end" class={LABEL}>
					{m.edit_experience_end()} <span class={HINT}>{m.edit_experience_end_hint()}</span>
				</label>
				<input id="{uid}-end" type="date" min={experience.start} bind:value={experience.end} class={FIELD} />
			</div>
		</div>

		<label class="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]">
			<input type="checkbox" bind:checked={experience.onSite} class="size-4.5 accent-accent" />
			{m.edit_experience_on_site()}
		</label>

		<LocaleField label={m.edit_experience_title()} bind:value={experience.title} maxlength={EDIT_LIMITS.experienceTitle} />
		{#if experience.kind === 'education'}
			<LocaleField
				label={m.edit_experience_degree()}
				bind:value={experience.degree}
				maxlength={EDIT_LIMITS.experienceTitle}
				required={false}
			/>
		{/if}

		{#if hasOrganization}
			<fieldset class="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
				<legend class="pb-2 {LABEL}">
					{m.edit_experience_logo()} <span class={HINT}>{m.edit_experience_logo_hint()}</span>
				</legend>
				{#if currentLogo && removeLogo}
					<div class="flex flex-wrap items-center gap-x-5 gap-y-2 border-l-3 border-accent bg-bg px-3.5 py-3 text-[15px]">
						<span>{m.edit_experience_logo_removed()}</span>
						<button type="button" onclick={() => (removeLogo = false)} class="min-h-10 cursor-pointer underline underline-offset-4 hover:text-accent"
							>{m.edit_experience_logo_keep()}</button
						>
					</div>
				{:else if currentLogo && !replacingLogo}
					<div class="flex flex-wrap items-end gap-4">
						<span class="flex size-20 items-center justify-center border border-border bg-white p-2">
							<img src={currentLogo.url} alt="" class="block max-h-full max-w-full object-contain" />
						</span>
						<div class="flex flex-wrap gap-2">
							<button type="button" onclick={() => (replacingLogo = true)} class="btn-outline min-h-10 cursor-pointer px-4 text-sm"
								>{m.edit_project_image_replace()}</button
							>
							<button
								type="button"
								onclick={() => (removeLogo = true)}
								class="min-h-10 cursor-pointer px-2 text-sm text-fg-muted underline underline-offset-4 hover:text-accent"
								>{m.edit_experience_logo_remove()}</button
							>
						</div>
					</div>
				{:else}
					<ImagePicker target="logo" currentFile={currentLogo?.file ?? null} bind:choice={logoChoice} compact />
					{#if currentLogo}
						<button
							type="button"
							onclick={() => {
								replacingLogo = false;
								logoChoice = null;
							}}
							class="min-h-10 cursor-pointer self-start text-sm text-fg-muted underline underline-offset-4 hover:text-accent"
							>{m.edit_experience_logo_keep()}</button
						>
					{/if}
				{/if}
			</fieldset>
		{/if}

		<div class="flex flex-col gap-3">
			<p class="m-0 {LABEL}">
				{m.edit_experience_tasks()} <span class={HINT}>{m.edit_experience_tasks_hint()}</span>
			</p>
			<ListEditor bind:items={experience.tasks} name={short} create={emptyText}>
				{#snippet item(i)}
					<LocaleField
						label={m.edit_project_text()}
						bind:value={experience.tasks[i]}
						maxlength={EDIT_LIMITS.experienceTask}
						multiline
						rows={2}
					/>
				{/snippet}
			</ListEditor>
		</div>

		<SkillPicker legend={m.edit_experience_skills()} skills={data.options.skills} bind:selected={experience.skillIds} />

		{#if data.projects.length > 0}
			<p class="m-0 border-t border-border pt-4 text-sm text-fg-subtle">
				{m.edit_experience_projects({ projects: data.projects.join(', ') })}
			</p>
		{/if}
	{/if}
</EditDialog>
