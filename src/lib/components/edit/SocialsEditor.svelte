<script lang="ts">
	import { EDIT_LIMITS, type SocialEdit } from '#lib/content/edit.js';
	import { m } from '#lib/paraglide/messages.js';
	import EditDialog from './EditDialog.svelte';
	import { FIELD } from './field.js';
	import ListEditor from './ListEditor.svelte';

	/** Social links of the CV contact column (and the site footer for "linkedin") */
	let { class: className = '' }: { class?: string } = $props();
	let data = $state<{ items: SocialEdit[] } | null>(null);

	const create = (): SocialEdit => ({ network: '', url: '' });
</script>

<EditDialog
	section="socials"
	title={m.edit_socials_title()}
	context={m.edit_context_cv()}
	triggerLabel={m.edit_socials_title()}
	hint={m.edit_socials_hint()}
	translated={false}
	bind:data
	class={className}
>
	{#if data}
		<ListEditor compact bind:items={data.items} name={(social) => social.network} {create}>
			{#snippet item(i)}
				{@const social = data!.items[i]}
				<input
					type="text"
					required
					pattern={'[a-z0-9\\-]{1,50}'}
					maxlength="50"
					autocapitalize="off"
					spellcheck="false"
					aria-label={m.edit_social_network()}
					placeholder={m.edit_social_network_hint()}
					bind:value={social.network}
					class="{FIELD} min-h-10 flex-[0_1_10rem] font-mono"
				/>
				<input
					type="url"
					required
					maxlength={EDIT_LIMITS.url}
					aria-label={m.edit_social_url()}
					placeholder="https://"
					bind:value={social.url}
					class="{FIELD} min-h-10 flex-[1_1_16rem]"
				/>
			{/snippet}
		</ListEditor>
	{/if}
</EditDialog>
