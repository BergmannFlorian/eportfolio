<script lang="ts">
	import { pad, type HomePersonalWork, type HomeWork } from '#lib/content/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import ArrowUpRight from './icons/ArrowUpRight.svelte';
	import SectionIntro from './SectionIntro.svelte';
	let { works, personalWorks }: { works: HomeWork[]; personalWorks: HomePersonalWork[] } = $props();
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

	{#if personalWorks.length > 0}
		<div class="flex flex-col gap-6 pt-4">
			<div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
				<h3 class="label-caps">{m.works_personal_title()}</h3>
				<p class="m-0 max-w-[380px] text-[15px] leading-[1.6] text-fg-subtle">
					{m.works_personal_desc()}
				</p>
			</div>

			<ul
				class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(320px,1fr))] border-t border-l border-t-border-strong border-l-border p-0"
			>
				{#each personalWorks as work, i (work.name)}
					<li class="border-r border-b border-border">
						<svelte:element
							this={work.url ? 'a' : 'div'}
							href={work.url ?? undefined}
							class="group flex h-full min-h-56 flex-col justify-between gap-6 bg-surface p-7 text-fg no-underline transition-colors {work.url
								? 'hover:bg-inverse hover:text-inverse-fg'
								: ''}"
						>
							<span class="flex items-start justify-between gap-3">
								<span class="font-mono text-[13px]">{pad(i)}</span>
								{#if work.url}<ArrowUpRight />{/if}
							</span>
							<span class="flex flex-col gap-3">
								<span class="font-display text-[26px] leading-[1.15]">{work.name}</span>
								{#if work.description}
									<span class="text-[15px] leading-[1.6] text-fg-muted group-hover:text-inverse-fg"
										>{work.description}</span
									>
								{/if}
								{#if work.skills.length > 0}
									<span class="flex flex-wrap gap-2 pt-1">
										{#each work.skills as skill (skill)}
											<span
												class="border border-chip-border px-2 py-0.5 font-mono text-xs group-hover:border-inverse-subtle"
												>{skill}</span
											>
										{/each}
									</span>
								{/if}
								{#if work.domain}
									<span class="text-sm break-all text-fg-subtle group-hover:text-inverse-subtle"
										>{work.domain}</span
									>
								{/if}
							</span>
						</svelte:element>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</section>
