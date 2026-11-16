<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
</script>

<div role="note" class="bg-accent text-accent-fg">
	<p class="m-0 flex w-full items-center justify-center gap-3 px-4 py-2.5 text-center text-sm font-medium">
		<svg
			aria-hidden="true"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="shrink-0"
			><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path
				d="M12 9v4M12 17h.01"
			/></svg
		>
		{m.construction_banner()}
	</p>
</div>
