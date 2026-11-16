<script lang="ts">
	import type { Snippet } from 'svelte';

	let { style = '', children }: { style?: string; children: Snippet } = $props();
</script>

<div class="{style} text-center font-display text-xl tracking-[5px]">
	{@render children()}
</div>
