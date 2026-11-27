<script lang="ts">
	import { dateFormat } from '#lib/cv/helpers.js';
	import type { Certificate } from '#lib/cv/types.js';
	import H3 from '../fonts/H3.svelte';

	let { certificates }: { certificates: Certificate[] } = $props();
</script>

<table class="w-full text-[11px]">
	<tbody class="w-full">
		{#each certificates as certificate, i (i)}
			<tr class="w-full pb-3">
				<td class="w-[30%] text-cv-dark">
					<H3>{dateFormat(certificate.date).toUpperCase()}</H3>
				</td>
				<td>
					<H3>{certificate.title.toUpperCase()}</H3>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
