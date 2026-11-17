<script lang="ts">
	import { pad, type HomeWork } from '#lib/content/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import ArrowUpRight from './icons/ArrowUpRight.svelte';
	import SectionIntro from './SectionIntro.svelte';
	let { works }: { works: HomeWork[] } = $props();
</script>

<section
	id="realisations"
	aria-labelledby="realisations-title"
	class="container-page flex flex-col gap-12 pt-20 sm:pt-28"
>
	<div class="flex flex-wrap items-end justify-between gap-6">
		<SectionIntro
			id="realisations-title"
			kicker={m.works_kicker()}
			lines={[m.works_title_1(), m.works_title_2()]}
		/>
		<p class="m-0 max-w-[380px] leading-[1.6] text-fg-subtle">{m.works_desc()}</p>
	</div>

	<ul
		class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] border-t border-l border-t-border-strong border-l-border p-0"
	>
		{#each works as work, i (work.url)}
			<li class="border-r border-b border-border">
				<a
					href={work.url}
					class="group flex h-full min-h-42 flex-col justify-between gap-6 p-7 text-fg no-underline transition-colors hover:bg-inverse hover:text-inverse-fg"
				>
					<span class="flex items-start justify-between gap-3">
						<span class="font-mono text-[13px]">{pad(i)}</span>
						<ArrowUpRight />
					</span>
					<span class="flex flex-col gap-1.5">
						<span class="font-display text-[26px] leading-[1.15]">{work.name}</span>
						<span class="text-sm text-fg-subtle group-hover:text-inverse-subtle">{work.domain}</span>
					</span>
				</a>
			</li>
		{/each}
	</ul>
</section>
