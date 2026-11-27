<script lang="ts">
	import {
		EDIT_LIMITS,
		PROJECT_KINDS,
		PROJECT_STATUSES,
		type EditSections,
		type Localized
	} from '#lib/content/edit.js';
	import { sendImage, type ImageChoice } from '#lib/media/send-image.js';
	import { m } from '#lib/paraglide/messages.js';
	import { baseLocale, locales } from '#lib/paraglide/runtime.js';
	import ImagePicker from '../ImagePicker.svelte';
	import EditDialog from './EditDialog.svelte';
	import { FIELD, HINT, LABEL, TEXTAREA } from './field.js';
	import ListEditor from './ListEditor.svelte';
	import LocaleField from './LocaleField.svelte';

	/** Dialog of one project (projectId), or of a new one (null) */
	interface Props {
		projectId: number | null;
		/** Project name, for the dialog title */
		name?: string;
		triggerLabel?: string;
		icon?: 'edit' | 'add';
		class?: string;
	}

	let { projectId, name, triggerLabel, icon = 'edit', class: className = '' }: Props = $props();
	let data = $state<EditSections['project'] | null>(null);
	const uid = $props.id();

	const kindLabels = {
		website: m.project_kind_website(),
		script: m.project_kind_script(),
		app: m.project_kind_app()
	};
	const statusLabels = {
		online: m.project_status_online(),
		in_progress: m.project_status_in_progress(),
		archived: m.project_status_archived()
	};

	// Skills by category, in the catalog order
	const skillGroups = $derived.by(() => {
		const groups = new Map<string, { id: number; name: string }[]>();
		for (const skill of data?.options.skills ?? []) {
			groups.set(skill.category, [...(groups.get(skill.category) ?? []), skill]);
		}
		return [...groups];
	});

	const emptyText = (): Localized => Object.fromEntries(locales.map((locale) => [locale, '']));

	// Image: chosen here, saved through /admin/media once the project is saved
	let choice = $state<ImageChoice | null>(null);
	let replacing = $state(false);
	let removeImage = $state(false);
	let imageAlt = $state<Localized>(emptyText());
	let altSnapshot = '';

	function onload(loaded: EditSections['project']) {
		choice = null;
		replacing = false;
		removeImage = false;
		imageAlt = { ...emptyText(), ...(loaded.image?.alt ?? {}) };
		altSnapshot = JSON.stringify(imageAlt);
	}

	const altChanged = () => JSON.stringify(imageAlt) !== altSnapshot;

	async function afterSave(id: number | null) {
		if (id === null) return;
		const hadImage = data?.image != null;
		if (removeImage) {
			if (hadImage) await sendImage({ target: 'project', id, action: 'remove' });
		} else if (choice || (hadImage && altChanged())) {
			await sendImage({ target: 'project', id, action: 'save', choice, alt: imageAlt });
		}
	}
	const short = (value: Localized) => {
		const textValue = value[baseLocale] ?? '';
		return textValue.length > 60 ? `${textValue.slice(0, 60)}…` : textValue;
	};
</script>

<EditDialog
	section="project"
	id={projectId}
	title={name ?? m.edit_project_new()}
	context={m.edit_project_context()}
	hint={m.edit_project_hint()}
	{triggerLabel}
	{icon}
	bind:data
	{onload}
	isDirty={() => choice !== null || removeImage || altChanged()}
	{afterSave}
	afterSaveError={m.edit_error_image()}
	class={className}
>
	{#if data}
		{@const project = data.project}
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="flex flex-col gap-1.5">
				<label for="{uid}-name" class={LABEL}>{m.edit_project_name()}</label>
				<input id="{uid}-name" type="text" required maxlength={EDIT_LIMITS.projectName} bind:value={project.name} class={FIELD} />
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="{uid}-url" class={LABEL}>{m.edit_project_url()}</label>
				<input
					id="{uid}-url"
					type="url"
					maxlength={EDIT_LIMITS.projectUrl}
					placeholder="https://"
					bind:value={project.url}
					class={FIELD}
				/>
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="{uid}-experience" class={LABEL}>{m.edit_project_experience()}</label>
				<select id="{uid}-experience" bind:value={project.experienceId} class="{FIELD} cursor-pointer">
					<option value={null}>{m.edit_project_personal()}</option>
					{#each data.options.experiences as experience (experience.id)}
						<option value={experience.id}>{experience.label}</option>
					{/each}
				</select>
			</div>
			<label class="flex min-h-11 cursor-pointer items-center gap-2.5 self-end text-[15px]">
				<input type="checkbox" bind:checked={project.featured} class="size-4.5 accent-accent" />
				{m.edit_project_featured()}
			</label>
		</div>

		<fieldset class="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
			<legend class="pb-2 {LABEL}">
				{m.edit_project_image()} <span class={HINT}>{m.edit_project_image_hint()}</span>
			</legend>
			{#if data.image && removeImage}
				<div class="flex flex-wrap items-center gap-x-5 gap-y-2 border-l-3 border-accent bg-bg px-3.5 py-3 text-[15px]">
					<span>{m.edit_project_image_removed()}</span>
					<button type="button" onclick={() => (removeImage = false)} class="min-h-10 cursor-pointer underline underline-offset-4 hover:text-accent"
						>{m.edit_project_image_keep()}</button
					>
				</div>
			{:else if data.image && !replacing}
				<div class="flex flex-wrap items-end gap-4">
					<img src={data.image.url} alt="" class="block aspect-[16/10] w-60 border border-border object-cover" />
					<div class="flex flex-wrap gap-2">
						<button type="button" onclick={() => (replacing = true)} class="btn-outline min-h-10 cursor-pointer px-4 text-sm"
							>{m.edit_project_image_replace()}</button
						>
						<button
							type="button"
							onclick={() => (removeImage = true)}
							class="min-h-10 cursor-pointer px-2 text-sm text-fg-muted underline underline-offset-4 hover:text-accent"
							>{m.edit_project_image_remove()}</button
						>
					</div>
				</div>
			{:else}
				<ImagePicker target="project" currentFile={data.image?.file ?? null} bind:choice compact />
				{#if data.image}
					<button
						type="button"
						onclick={() => {
							replacing = false;
							choice = null;
						}}
						class="min-h-10 cursor-pointer self-start text-sm text-fg-muted underline underline-offset-4 hover:text-accent"
						>{m.edit_project_image_keep()}</button
					>
				{/if}
			{/if}
			{#if !removeImage && (data.image || choice)}
				<LocaleField
					label={m.edit_project_image_alt()}
					bind:value={imageAlt}
					maxlength={255}
					required={false}
				/>
			{/if}
		</fieldset>

		<div class="flex flex-col gap-3">
			<p class="m-0 {LABEL}">
				{m.edit_project_tasks()} <span class={HINT}>{m.edit_project_tasks_hint()}</span>
			</p>
			<ListEditor bind:items={project.tasks} name={short} create={emptyText}>
				{#snippet item(i)}
					<LocaleField
						label={m.edit_project_text()}
						bind:value={project.tasks[i]}
						maxlength={EDIT_LIMITS.projectText}
						multiline
					/>
				{/snippet}
			</ListEditor>
		</div>

		<fieldset class="m-0 flex flex-col gap-3 border-0 p-0">
			<legend class="pb-2 {LABEL}">{m.edit_project_skills()}</legend>
			{#each skillGroups as [category, skills] (category)}
				<div class="flex flex-col gap-2">
					<span class="font-mono text-xs text-fg-subtle uppercase">{category}</span>
					<div class="flex flex-wrap gap-2">
						{#each skills as skill (skill.id)}
							<label
								class="cursor-pointer border border-chip-border px-2.5 py-1.5 font-mono text-xs has-checked:border-inverse has-checked:bg-inverse has-checked:text-inverse-fg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
							>
								<input type="checkbox" value={skill.id} bind:group={project.skillIds} class="sr-only" />
								{skill.name}
							</label>
						{/each}
					</div>
				</div>
			{/each}
		</fieldset>

		<fieldset class="m-0 flex flex-col gap-4 border-0 border-t border-border p-0 pt-5">
			<legend class="float-left pb-1 {LABEL}">{m.edit_project_details_legend()}</legend>
			<div class="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
				<div class="flex flex-col gap-1.5">
					<label for="{uid}-kind" class={LABEL}>{m.edit_project_kind()}</label>
					<select id="{uid}-kind" bind:value={project.kind} class="{FIELD} cursor-pointer">
						<option value="">{m.edit_project_none()}</option>
						{#each PROJECT_KINDS as kind (kind)}
							<option value={kind}>{kindLabels[kind]}</option>
						{/each}
					</select>
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="{uid}-year" class={LABEL}>{m.edit_project_year()}</label>
					<input id="{uid}-year" type="number" min="1970" max="2100" step="1" bind:value={project.year} class={FIELD} />
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="{uid}-status" class={LABEL}>{m.edit_project_status()}</label>
					<select id="{uid}-status" bind:value={project.status} class="{FIELD} cursor-pointer">
						<option value="">{m.edit_project_none()}</option>
						{#each PROJECT_STATUSES as status (status)}
							<option value={status}>{statusLabels[status]}</option>
						{/each}
					</select>
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="{uid}-hosting" class={LABEL}>{m.edit_project_hosting()}</label>
					<input id="{uid}-hosting" type="text" maxlength={EDIT_LIMITS.hosting} bind:value={project.hosting} class={FIELD} />
				</div>
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="{uid}-snippet" class={LABEL}>{m.edit_project_snippet()}</label>
				<textarea
					id="{uid}-snippet"
					rows="3"
					spellcheck="false"
					maxlength={EDIT_LIMITS.snippet}
					bind:value={project.snippet}
					class="{TEXTAREA} font-mono text-sm"
				></textarea>
			</div>
			<div class="flex flex-col gap-3">
				<p class="m-0 {LABEL}">
					{m.edit_project_details()} <span class={HINT}>{m.edit_project_details_hint()}</span>
				</p>
				<ListEditor bind:items={project.details} name={short} create={emptyText}>
					{#snippet item(i)}
						<LocaleField
							label={m.edit_project_text()}
							bind:value={project.details[i]}
							maxlength={EDIT_LIMITS.projectText}
							multiline
							rows={2}
						/>
					{/snippet}
				</ListEditor>
			</div>
		</fieldset>
	{/if}
</EditDialog>
