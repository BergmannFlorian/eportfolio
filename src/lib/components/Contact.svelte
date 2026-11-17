<script lang="ts">
		import { m } from '#lib/paraglide/messages.js';
	import ArrowRight from './icons/ArrowRight.svelte';
	let { email }: { email: string } = $props();
</script>

<section
	id="contact"
	aria-labelledby="contact-title"
	class="mt-20 bg-inverse text-inverse-fg sm:mt-28"
>
	<div
		class="container-page flex flex-wrap items-end justify-between gap-10 pt-20 pb-20 sm:pt-24 sm:pb-24"
	>
		<div class="flex max-w-[720px] flex-col gap-5">
			<p class="m-0 font-mono text-sm text-inverse-subtle">{m.contact_kicker()}</p>
			<h2
				id="contact-title"
				class="m-0 font-display text-[clamp(40px,6vw,72px)] leading-none font-normal tracking-[-1px]"
			>
				{m.contact_title_1()}<br />{m.contact_title_2()}
			</h2>
		</div>
		<a
			href="mailto:{email}"
			class="inline-flex min-h-11 max-w-full items-center gap-3 bg-bg px-6 py-[18px] text-[17px] font-medium break-all text-fg no-underline transition-colors hover:bg-accent hover:text-accent-fg sm:px-8"
		>
			{email}
			<ArrowRight />
		</a>
	</div>
</section>
