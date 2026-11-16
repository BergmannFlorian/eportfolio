<script lang="ts">
	import portrait from '#lib/assets/portrait.jpg';
	import { contact } from '#lib/content/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import ArrowRight from './icons/ArrowRight.svelte';
</script>

<section class="container-page flex flex-wrap items-end gap-16 pt-16 pb-20 sm:pt-22 sm:pb-24">
	<div class="flex min-w-0 flex-[999_1_560px] flex-col gap-8">
		<p
			class="m-0 flex items-center gap-3 font-mono text-sm tracking-[1px] text-fg-subtle uppercase"
		>
			<span aria-hidden="true" class="h-0.5 w-8 shrink-0 bg-accent"></span>
			{m.hero_eyebrow()}
		</p>
		<h1
			class="m-0 font-display text-[clamp(56px,9vw,128px)] leading-[0.95] font-normal tracking-[-2px] text-fg-strong"
		>
			Florian<br />Bergmann
		</h1>
		<p class="m-0 max-w-[620px] text-xl leading-[1.6] text-fg-muted">{m.hero_lead()}</p>
		<div class="flex flex-wrap gap-4 pt-2">
			<a href="#realisations" class="btn-primary px-7 py-4">
				{m.hero_cta_works()}
				<ArrowRight />
			</a>
			<a href="mailto:{contact.email}" class="btn-outline px-7 py-[15px]">{m.hero_cta_contact()}</a>
		</div>
	</div>

	<figure class="m-0 flex max-w-[420px] flex-[1_1_340px] flex-col gap-3">
		<img
			src={portrait}
			alt={m.hero_portrait_alt()}
			width="420"
			height="525"
			class="block aspect-[4/5] w-full object-cover object-top grayscale"
		/>
		<figcaption class="flex justify-between font-mono text-[13px] text-fg-subtle">
			<span>{m.hero_location()}</span>
			<span>FR · EN · DE</span>
		</figcaption>
	</figure>
</section>
