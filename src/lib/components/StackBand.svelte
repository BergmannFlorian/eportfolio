<script lang="ts">
	import { stack } from '#lib/content/index.js';
	import { m } from '#lib/paraglide/messages.js';
</script>

<div class="bg-inverse text-inverse-fg">
	<div class="container-page py-6">
		<h2 class="sr-only">{m.stack_label()}</h2>
		<ul
			class="m-0 flex list-none flex-wrap gap-x-10 gap-y-3 p-0 font-mono text-[15px] tracking-[1px]"
		>
			<li aria-hidden="true" class="text-inverse-subtle uppercase">{m.stack_label()}</li>
			{#each stack as tech (tech)}
				<li>{tech}</li>
			{/each}
		</ul>
	</div>
</div>
