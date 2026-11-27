<script lang="ts">
	import { page } from '$app/state';
	import defaultPortrait from '#lib/assets/portrait.jpg';
	import type { HomeContent } from '#lib/content/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import ArrowRight from './icons/ArrowRight.svelte';
	import ImageEditor from './ImageEditor.svelte';
	let {
		headline,
		bio,
		email,
		portrait
	}: Pick<HomeContent, 'headline' | 'bio' | 'email' | 'portrait'> = $props();
	const signedIn = $derived(page.data.signedIn === true);
</script>

<section class="container-page flex flex-wrap items-end gap-16 pt-16 pb-20 sm:pt-22 sm:pb-24">
	<div class="flex min-w-0 flex-[999_1_560px] flex-col gap-8">
		<p
			class="m-0 flex items-center gap-3 font-mono text-sm tracking-[1px] text-fg-subtle uppercase"
		>
			<span aria-hidden="true" class="h-0.5 w-8 shrink-0 bg-accent"></span>
			{headline}
		</p>
		<h1
			class="m-0 font-display text-[clamp(56px,9vw,128px)] leading-[0.95] font-normal tracking-[-2px] text-fg-strong"
		>
			Florian<br />Bergmann
		</h1>
		<p class="m-0 max-w-[620px] text-xl leading-[1.6] text-fg-muted">{bio}</p>
		<div class="flex flex-wrap gap-4 pt-2">
			<a href="#realisations" class="btn-primary px-7 py-4">
				{m.hero_cta_works()}
				<ArrowRight />
			</a>
			<a href="mailto:{email}" class="btn-outline px-7 py-[15px]">{m.hero_cta_contact()}</a>
		</div>
		{#if signedIn}
			<!-- Editor code only loads for the owner -->
			{#await import('./edit/HeroEditor.svelte') then { default: HeroEditor }}
				<HeroEditor class="self-start" />
			{/await}
		{/if}
	</div>

	<figure class="m-0 flex max-w-[420px] flex-[1_1_340px] flex-col gap-3">
		<div class="relative">
			<img
				src={portrait?.url ?? defaultPortrait}
				alt={portrait?.alt || m.hero_portrait_alt()}
				width="420"
				height="525"
				class="block aspect-[4/5] w-full object-cover object-top grayscale"
			/>
			{#if signedIn}
				<ImageEditor
					target="portrait"
					hasImage={portrait !== null}
					variant="overlay"
					context={m.image_dialog_portrait()}
					class="absolute right-3 bottom-3"
				/>
			{/if}
		</div>
		<figcaption class="flex justify-between font-mono text-[13px] text-fg-subtle">
			<span>{m.hero_location()}</span>
			<span>FR · EN · DE</span>
		</figcaption>
	</figure>
</section>
