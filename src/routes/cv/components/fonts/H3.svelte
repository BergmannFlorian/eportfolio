<script lang="ts">
	import type { Snippet } from 'svelte';

	let { style = '', children }: { style?: string; children: Snippet } = $props();
</script>

<div class="{style} font-display font-bold">
	{@render children()}
</div>
