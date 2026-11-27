<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { deLocalizeHref, localizeHref } from '#lib/paraglide/runtime.js';
	import LocaleSwitch from './LocaleSwitch.svelte';
	import ThemeSelect from './ThemeSelect.svelte';

	// Section links point to the home page so they also work from other pages
	const home = localizeHref('/');
	const path = $derived(deLocalizeHref(page.url.pathname));

	const links = [
		{ href: `${home}#realisations`, label: m.nav_works, activeOn: '/projets' },
		{ href: `${home}#competences`, label: m.nav_skills },
		{ href: `${home}#parcours`, label: m.nav_journey },
		{ href: `${home}#apropos`, label: m.nav_about },
		{ href: localizeHref('/cv'), label: m.nav_cv }
	];
</script>

<header class="border-b border-border bg-bg">
	<div class="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
		<a href={home} class="flex items-center gap-3 text-fg-strong no-underline" aria-label={m.nav_home()}>
			<span
				aria-hidden="true"
				class="flex size-11 items-center justify-center bg-inverse font-display text-lg tracking-[1px] text-inverse-fg"
				>FB</span
			>
			<span aria-hidden="true" class="font-display text-lg">Florian Bergmann</span>
		</a>

		<nav aria-label={m.nav_label()} class="flex flex-wrap items-center gap-x-6 gap-y-1">
			{#each links as link (link.href)}
				{@const active = link.activeOn !== undefined && path.startsWith(link.activeOn)}
				<a
					href={link.href}
					aria-current={active ? 'page' : undefined}
					class="inline-flex min-h-11 items-center px-1 text-[15px] no-underline hover:text-fg-strong {active
						? 'text-fg-strong underline decoration-accent decoration-2 underline-offset-[6px]'
						: 'text-fg-muted'}">{link.label()}</a
				>
			{/each}
		</nav>

		<div class="flex flex-wrap items-center gap-4">
			<ThemeSelect />
			<LocaleSwitch />
			{#if page.data.signedIn}
				<form method="POST" action={localizeHref('/admin/logout')}>
					<button type="submit" class="btn-outline cursor-pointer px-5 py-3 text-[15px]"
						>{m.admin_logout()}</button
					>
				</form>
			{:else}
				<a href={localizeHref('/admin/login')} rel="nofollow" class="btn-outline px-5 py-3 text-[15px]"
					>{m.nav_edit()}</a
				>
			{/if}
			<a href="{home}#contact" class="btn-primary px-5 py-3 text-[15px]">{m.nav_contact()}</a>
		</div>
	</div>
</header>
