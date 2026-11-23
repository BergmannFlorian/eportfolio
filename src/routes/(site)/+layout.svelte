<script lang="ts">
	import ConstructionBanner from '#lib/components/ConstructionBanner.svelte';
	import SiteFooter from '#lib/components/SiteFooter.svelte';
	import SiteHeader from '#lib/components/SiteHeader.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<a
	href="#contenu"
	class="sr-only z-50 bg-inverse px-4 py-3 text-inverse-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
	>{m.skip_link()}</a
>

<div id="top" class="flex min-h-screen flex-col">
	<ConstructionBanner />
	<SiteHeader />
	<main id="contenu" class="flex-1">
		{@render children()}
	</main>
	<SiteFooter contact={data.contact} />
</div>
