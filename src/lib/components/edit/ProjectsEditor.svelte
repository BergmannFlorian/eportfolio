<script lang="ts">
	import type { ProjectOrderItem } from '#lib/content/edit.js';
	import { m } from '#lib/paraglide/messages.js';
	import EditDialog from './EditDialog.svelte';
	import ListEditor from './ListEditor.svelte';

	/** Order of every project, home page selection and deletion */
	let { class: className = '' }: { class?: string } = $props();
	let data = $state<{ items: ProjectOrderItem[] } | null>(null);
</script>

<EditDialog
	section="projects"
	title={m.edit_projects_title()}
	triggerLabel={m.edit_projects_button()}
	icon="order"
	hint={m.edit_projects_hint()}
	translated={false}
	bind:data
	class={className}
>
	{#if data}
		<ListEditor bind:items={data.items} name={(project) => project.name}>
			{#snippet item(i)}
				{@const project = data!.items[i]}
				<div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[15px]">
					<span class="text-fg-subtle">{project.organization ?? m.edit_projects_personal()}</span>
					<label class="flex min-h-11 cursor-pointer items-center gap-2.5">
						<input type="checkbox" bind:checked={project.featured} class="size-4.5 accent-accent" />
						{m.edit_project_featured()}
					</label>
				</div>
			{/snippet}
		</ListEditor>
	{/if}
</EditDialog>
