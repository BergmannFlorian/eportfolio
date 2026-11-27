<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { deLocalizeHref, localizeHref } from '#lib/paraglide/runtime.js';
	import LocaleSwitch from './LocaleSwitch.svelte';
	import ThemeMenu from './ThemeMenu.svelte';
	import ThemeSegmented from './ThemeSegmented.svelte';

	// Three layouts, never more than two lines:
	// - ≥ 1200px: one line (logo, links, controls)
	// - 768–1199px: controls next to the logo, links centered on a second line
	// - < 768px: logo and a "Menu" button opening a panel over the page

	// Section links point to the home page so they also work from other pages
	const home = localizeHref('/');
	const path = $derived(deLocalizeHref(page.url.pathname));
	const signedIn = $derived(page.data.signedIn === true);

	const links = [
		{ href: `${home}#realisations`, label: m.nav_works, activeOn: '/projets' },
		{ href: `${home}#competences`, label: m.nav_skills },
		{ href: `${home}#parcours`, label: m.nav_journey },
		{ href: `${home}#apropos`, label: m.nav_about },
		{ href: localizeHref('/cv'), label: m.nav_cv }
	];

	const isActive = (link: (typeof links)[number]) =>
		link.activeOn !== undefined && path.startsWith(link.activeOn);

	let menuOpen = $state(false);
	let menuButton: HTMLButtonElement;

	afterNavigate(() => (menuOpen = false));

	function onKeydown(event: KeyboardEvent) {
		if (menuOpen && event.key === 'Escape') {
			menuOpen = false;
			menuButton.focus();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#snippet navLinks(gap: string)}
	<nav aria-label={m.nav_label()} class="flex items-center {gap}">
		{#each links as link (link.href)}
			{@const active = isActive(link)}
			<a
				href={link.href}
				aria-current={active ? 'page' : undefined}
				class="inline-flex min-h-11 items-center px-1 text-[15px] whitespace-nowrap no-underline hover:text-fg-strong {active
					? 'text-fg-strong underline decoration-accent decoration-2 underline-offset-[6px]'
					: 'text-fg-muted'}">{link.label()}</a
			>
		{/each}
	</nav>
{/snippet}

{#snippet editOrLogout(wide: boolean)}
	{@const size = wide ? 'min-h-12 w-full justify-center' : 'min-h-11 px-[18px]'}
	{#if signedIn}
		<form method="POST" action={localizeHref('/admin/logout')} class={wide ? 'w-full' : ''}>
			<button type="submit" class="btn-outline {size} cursor-pointer text-[15px] whitespace-nowrap"
				>{m.admin_logout()}</button
			>
		</form>
	{:else}
		<a
			href={localizeHref('/admin/login')}
			rel="nofollow"
			class="btn-outline {size} text-[15px] whitespace-nowrap">{m.nav_edit()}</a
		>
	{/if}
{/snippet}

<header class="relative border-b border-border bg-bg">
	<div
		class="container-page flex items-center justify-between gap-4 py-3 wide:gap-6 wide:py-4"
	>
		<a
			href={home}
			class="flex shrink-0 items-center gap-3 text-fg-strong no-underline"
			aria-label={m.nav_home()}
		>
			<span
				aria-hidden="true"
				class="flex size-11 items-center justify-center bg-inverse font-display text-lg tracking-[1px] text-inverse-fg"
				>FB</span
			>
			<span aria-hidden="true" class="font-display text-lg whitespace-nowrap">Florian Bergmann</span>
		</a>

		<!-- Desktop: links on the same line -->
		<div class="hidden wide:block">{@render navLinks('gap-5')}</div>

		<!-- Tablet and desktop: controls -->
		<div class="hidden shrink-0 items-center gap-3 md:flex">
			<ThemeMenu />
			<LocaleSwitch />
			{@render editOrLogout(false)}
			<a href="{home}#contact" class="btn-primary min-h-11 px-5 text-[15px] whitespace-nowrap"
				>{m.nav_contact()}</a
			>
		</div>

		<!-- Mobile: menu button -->
		<button
			bind:this={menuButton}
			type="button"
			aria-expanded={menuOpen}
			aria-controls="mobile-menu"
			onclick={() => (menuOpen = !menuOpen)}
			class="btn-outline min-h-11 shrink-0 cursor-pointer gap-2.5 px-3.5 text-[15px] md:hidden"
		>
			<svg
				aria-hidden="true"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			>
				{#if menuOpen}<path d="M6 6l12 12M18 6L6 18" />{:else}<path d="M4 7h16M4 12h16M4 17h16" />{/if}
			</svg>
			{menuOpen ? m.menu_close() : m.menu_open()}
		</button>
	</div>

	<!-- Tablet: links centered on a second line -->
	<div class="hidden border-t border-border md:block wide:hidden">
		<div class="container-page flex justify-center">{@render navLinks('gap-7')}</div>
	</div>

	<!-- Mobile: panel over the page -->
	{#if menuOpen}
		<div
			id="mobile-menu"
			class="absolute inset-x-0 top-full z-30 flex flex-col gap-6 border-b border-border-strong bg-bg px-4 pt-2 pb-6 md:hidden"
		>
			<nav aria-label={m.nav_label()}>
				<ul class="m-0 list-none p-0">
					{#each links as link (link.href)}
						{@const active = isActive(link)}
						<li class="border-b border-border">
							<a
								href={link.href}
								aria-current={active ? 'page' : undefined}
								onclick={() => (menuOpen = false)}
								class="flex min-h-14 items-center justify-between font-display text-2xl text-fg-strong no-underline hover:text-accent"
							>
								{link.label()}
								{#if active}<span aria-hidden="true" class="size-2 bg-accent"></span>{/if}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
			<div class="flex flex-wrap items-center justify-between gap-4">
				<ThemeSegmented />
				<LocaleSwitch />
			</div>
			<div class="flex flex-col gap-3">
				<a
					href="{home}#contact"
					onclick={() => (menuOpen = false)}
					class="btn-primary min-h-12 justify-center text-[15px]">{m.nav_contact()}</a
				>
				{@render editOrLogout(true)}
			</div>
		</div>
	{/if}
</header>
