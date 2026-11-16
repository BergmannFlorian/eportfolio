<script lang="ts">
	import { contact } from '#lib/content/index.js';
	import { m } from '#lib/paraglide/messages.js';

	const year = new Date().getFullYear();
	const linkClass = 'inline-flex min-h-11 items-center text-fg-subtle no-underline hover:text-fg-strong';
</script>

<footer class="bg-bg text-fg-subtle">
	<div class="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 text-sm">
		<span>© {year} Florian Bergmann · {m.footer_location()}</span>
		<ul class="m-0 flex list-none flex-wrap gap-x-7 p-0">
			<li><a class={linkClass} href={contact.linkedin}>LinkedIn</a></li>
			<li><a class={linkClass} href="mailto:{contact.email}">{m.footer_email()}</a></li>
			<li><a class={linkClass} href="#top">{m.footer_top()} <span aria-hidden="true">&nbsp;↑</span></a></li>
		</ul>
	</div>
</footer>
