<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { localizeHref } from '#lib/paraglide/runtime.js';
	import LocaleSwitch from './LocaleSwitch.svelte';
	import ThemeSelect from './ThemeSelect.svelte';

	const links = [
		{ href: '#realisations', label: m.nav_works },
		{ href: '#competences', label: m.nav_skills },
		{ href: '#parcours', label: m.nav_journey },
		{ href: '#apropos', label: m.nav_about },
		{ href: localizeHref('/cv'), label: m.nav_cv }
	];
</script>

<header class="border-b border-border bg-bg">
	<div class="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
		<a href="#top" class="flex items-center gap-3 text-fg-strong no-underline" aria-label={m.nav_home()}>
			<span
				aria-hidden="true"
				class="flex size-11 items-center justify-center bg-inverse font-display text-lg tracking-[1px] text-inverse-fg"
				>FB</span
			>
			<span aria-hidden="true" class="font-display text-lg">Florian Bergmann</span>
		</a>

		<nav aria-label={m.nav_label()} class="flex flex-wrap items-center gap-x-6 gap-y-1">
			{#each links as link (link.href)}
				<a
					href={link.href}
					class="inline-flex min-h-11 items-center px-1 text-[15px] text-fg-muted no-underline hover:text-fg-strong"
					>{link.label()}</a
				>
			{/each}
		</nav>

		<div class="flex flex-wrap items-center gap-4">
			<ThemeSelect />
			<LocaleSwitch />
			<a href="#contact" class="btn-primary px-5 py-3 text-[15px]">{m.nav_contact()}</a>
		</div>
	</div>
</header>
