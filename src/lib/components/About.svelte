<script lang="ts">
	import { page } from '$app/state';
	import { pad, type HomeContent } from '#lib/content/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import SectionIntro from './SectionIntro.svelte';
	let { about, facts, languages, hobbies }: Pick<HomeContent, 'about' | 'facts' | 'languages' | 'hobbies'> =
		$props();
	const signedIn = $derived(page.data.signedIn === true);
	// Editor code only loads for the owner
	const editors = $derived(
		signedIn
			? Promise.all([
					import('./edit/AboutEditor.svelte'),
					import('./edit/FactsEditor.svelte'),
					import('./edit/LanguagesEditor.svelte'),
					import('./edit/HobbiesEditor.svelte')
				]).then(([about, facts, languages, hobbies]) => ({
					AboutEditor: about.default,
					FactsEditor: facts.default,
					LanguagesEditor: languages.default,
					HobbiesEditor: hobbies.default
				}))
			: null
	);
</script>

<section
	id="apropos"
	aria-labelledby="apropos-title"
	class="container-page flex flex-col gap-14 pt-20 sm:pt-28"
>
	<div class="flex flex-wrap gap-16">
		<div class="flex-[1_1_320px]">
			<SectionIntro
				id="apropos-title"
				kicker={m.about_kicker()}
				lines={[m.about_title_1(), m.about_title_2()]}
			/>
		</div>
		<div class="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
			<p class="m-0 text-xl leading-[1.6] text-fg-muted">
				{about}
			</p>
			{#await editors then loaded}
				{#if loaded}<loaded.AboutEditor class="self-start" />{/if}
			{/await}
		</div>
	</div>

	<div class="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-10">
		<div class="flex flex-col gap-4 border-t-2 border-border-strong pt-5">
			<div class="flex min-h-10 items-center justify-between gap-3">
				<h3 class="label-caps">{m.about_facts()}</h3>
				{#await editors then loaded}
					{#if loaded}<loaded.FactsEditor />{/if}
				{/await}
			</div>
			<dl class="m-0 flex flex-col">
				{#each facts as fact, i (i)}
					<div class="flex justify-between gap-4 border-b border-border py-3 text-[15px]">
						<dt class="text-fg-subtle">{fact.label}</dt>
						<dd class="m-0 text-right font-medium">{fact.value}</dd>
					</div>
				{/each}
			</dl>
		</div>

		<div class="flex flex-col gap-4 border-t-2 border-border-strong pt-5">
			<div class="flex min-h-10 items-center justify-between gap-3">
				<h3 class="label-caps">{m.about_languages()}</h3>
				{#await editors then loaded}
					{#if loaded}<loaded.LanguagesEditor />{/if}
				{/await}
			</div>
			<ul class="m-0 flex list-none flex-col gap-5 p-0">
				{#each languages as language, i (i)}
					<li class="flex flex-col gap-2">
						<div class="flex justify-between gap-4 text-[15px]">
							<span class="font-medium">{language.name}</span>
							<span class="font-mono text-[13px] text-fg-subtle">{language.level}</span>
						</div>
						<div aria-hidden="true" class="h-1 bg-border">
							<div class="h-1 bg-accent" style:width="{language.percent}%"></div>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<div class="flex flex-col gap-5">
		<div class="flex min-h-10 items-center justify-between gap-3">
			<h3 class="label-caps">{m.about_hobbies()}</h3>
			{#await editors then loaded}
				{#if loaded}<loaded.HobbiesEditor />{/if}
			{/await}
		</div>
		<ul
			class="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] border-t border-l border-t-border-strong border-l-border p-0"
		>
			{#each hobbies as hobby, i (i)}
				<li
					class="flex min-h-[150px] flex-col justify-between gap-6 border-r border-b border-border bg-surface p-7"
				>
					<span class="font-mono text-[13px] text-fg-subtle">{pad(i)}</span>
					<span class="flex flex-col gap-1.5">
						<span class="font-display text-[26px] leading-[1.15]">{hobby.name}</span>
						<span class="text-sm text-fg-subtle">{hobby.why}</span>
					</span>
				</li>
			{/each}
		</ul>
	</div>
</section>
