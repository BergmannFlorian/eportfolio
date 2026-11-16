<script lang="ts">
	let { page, total }: { page: number; total: number } = $props();
</script>

<div class="absolute right-5 bottom-4 text-cv-light">{page} / {total}</div>
