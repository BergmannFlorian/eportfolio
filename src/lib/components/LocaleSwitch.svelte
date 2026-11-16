<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, locales, localizeHref } from '#lib/paraglide/runtime.js';

	const current = getLocale();
</script>

<nav aria-label={m.locale_label()} class="flex items-center font-mono text-sm">
	{#each locales as locale, i (locale)}
		{#if i > 0}<span aria-hidden="true" class="text-fg-subtle">/</span>{/if}
		<a
			href={localizeHref(page.url.pathname, { locale })}
			hreflang={locale}
			lang={locale}
			aria-current={locale === current ? 'true' : undefined}
			data-sveltekit-reload
			class="inline-flex min-h-11 min-w-8 items-center justify-center uppercase no-underline {locale ===
			current
				? 'text-fg-strong underline decoration-accent decoration-2 underline-offset-4'
				: 'text-fg-subtle hover:text-fg-strong'}"
		>
			{locale}
		</a>
	{/each}
</nav>
