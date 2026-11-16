<script lang="ts">
	import '@fontsource/questrial';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/jetbrains-mono';
	import '../app.css';

	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import { deLocalizeHref, locales, localizeHref } from '#lib/paraglide/runtime.js';
	import { theme, themeInitScript } from '#lib/theme/theme.svelte.js';
	import type { LayoutProps } from './$types';

	// Shared root layout: fonts, styles, theme, hreflang links.
	// The site chrome (banner, header, footer) lives in (site)/+layout.svelte;
	// the printable CV (cv/) has its own layout.

	let { children }: LayoutProps = $props();

	onMount(() => theme.start());

	const canonicalPath = $derived(deLocalizeHref(page.url.pathname));
</script>

<svelte:head>
	<!-- Sets data-theme before first paint to avoid a theme flash -->
	{@html `<script>${themeInitScript()}</script>`}
	<link rel="icon" href={favicon} />
	{#each locales as locale (locale)}
		<link
			rel="alternate"
			hreflang={locale}
			href={new URL(localizeHref(canonicalPath, { locale }), page.url.origin).href}
		/>
	{/each}
</svelte:head>

{@render children()}
