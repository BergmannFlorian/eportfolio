<script lang="ts">
	import { EDIT_LIMITS, type EditSections, type SkillEdit } from '#lib/content/edit.js';
	import { m } from '#lib/paraglide/messages.js';
	import { baseLocale } from '#lib/paraglide/runtime.js';
	import EditDialog from './EditDialog.svelte';
	import { FIELD } from './field.js';
	import ListEditor from './ListEditor.svelte';
	import LocaleField from './LocaleField.svelte';

	/** Skill catalog: names, "Stack" band, "Skills" section, category, order */
	let { class: className = '' }: { class?: string } = $props();
	let data = $state<EditSections['skills'] | null>(null);

	const create = (): SkillEdit => ({ id: null, name: '', inStack: false, onSite: true, uses: 0 });

	/** Moves a skill to the end of another category */
	function moveSkill(from: number, index: number, categoryId: number) {
		if (!data) return;
		const target = data.categories.find((category) => category.id === categoryId);
		if (!target || target === data.categories[from]) return;
		const [skill] = data.categories[from].skills.splice(index, 1);
		target.skills.push(skill);
	}

	function validate({ categories }: EditSections['skills']) {
		const duplicate = categories.some((category) => {
			const names = category.skills.map((skill) => skill.name.trim().toLowerCase());
			return new Set(names).size !== names.length;
		});
		return duplicate ? m.edit_skill_duplicate() : null;
	}

	const check = 'flex min-h-10 cursor-pointer items-center gap-2 text-[15px]';
</script>

<EditDialog section="skills" title={m.edit_skills_title()} hint={m.edit_skills_hint()} bind:data {validate} class={className}>
	{#if data}
		{#each data.categories as category, c (category.id)}
			<section class="flex flex-col gap-4 border-t-2 border-border-strong pt-4">
				<LocaleField label={m.edit_skill_category_name()} bind:value={category.name} maxlength={EDIT_LIMITS.categoryName} />
				<ListEditor
					compact
					bind:items={category.skills}
					name={(skill) => skill.name}
					{create}
					addLabel={m.edit_skill_add()}
				>
					{#snippet item(i)}
						{@const skill = category.skills[i]}
						<input
							type="text"
							required
							maxlength={EDIT_LIMITS.skillName}
							aria-label={m.edit_skill_name()}
							bind:value={skill.name}
							class="{FIELD} min-h-10 flex-[1_1_160px]"
						/>
						<label class={check}>
							<input type="checkbox" bind:checked={skill.inStack} class="size-4.5 accent-accent" />
							{m.edit_skill_in_stack()}
						</label>
						<label class={check}>
							<input type="checkbox" bind:checked={skill.onSite} class="size-4.5 accent-accent" />
							{m.edit_skill_on_site()}
						</label>
						<select
							aria-label={m.edit_skill_category({ skill: skill.name })}
							value={category.id}
							onchange={(event) => moveSkill(c, i, Number(event.currentTarget.value))}
							class="{FIELD} min-h-10 w-auto cursor-pointer"
						>
							{#each data!.categories as target (target.id)}
								<option value={target.id}>{target.name[baseLocale] || target.id}</option>
							{/each}
						</select>
						{#if skill.uses > 0}
							<span class="font-mono text-xs text-fg-subtle">{m.edit_skill_uses({ count: skill.uses })}</span>
						{/if}
					{/snippet}
				</ListEditor>
			</section>
		{/each}
	{/if}
</EditDialog>
