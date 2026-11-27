<script lang="ts">
	import LocaleSwitch from '#lib/components/LocaleSwitch.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { localizeHref } from '#lib/paraglide/runtime.js';
	import type { LayoutProps } from './$types';

	// Administration chrome: logo and language only (no site navigation)
	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="flex min-h-screen flex-col bg-bg text-fg">
	<header class="border-b border-border bg-bg">
		<div class="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
			<a
				href={localizeHref('/')}
				class="flex items-center gap-3 text-fg-strong no-underline"
				aria-label={m.nav_home()}
			>
				<span
					aria-hidden="true"
					class="flex size-11 items-center justify-center bg-inverse font-display text-lg tracking-[1px] text-inverse-fg"
					>FB</span
				>
				<span aria-hidden="true" class="font-display text-lg">Florian Bergmann</span>
			</a>
			<LocaleSwitch />
		</div>
	</header>

	<main id="main" class="flex flex-1 justify-center px-4 pt-18 pb-24">
		{@render children()}
	</main>
</div>
