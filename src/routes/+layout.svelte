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

	// Layout racine commun : polices, styles, thème, liens hreflang.
	// Le site (bandeau, header, footer) est dans (site)/+layout.svelte ;
	// le CV imprimable (cv/) a sa propre mise en page.

	let { children }: LayoutProps = $props();

	onMount(() => theme.start());

	const canonicalPath = $derived(deLocalizeHref(page.url.pathname));
</script>

<svelte:head>
	<!-- Pose data-theme avant le premier rendu pour éviter un flash de thème -->
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
