<script lang="ts">
    import { dateFormat } from "$lib/helpers";
    import type { Certificate } from "$lib/interfaces/cv";
    import H3 from "../fonts/H3.svelte";

    export let certificates: Certificate[];
</script>

<table class="w-full text-[11px]">
    <tbody class="w-full">
        {#each certificates as certificate}
            <tr class="w-full pb-3">
                <td class="w-[30%] text-dark">
                    <H3>{dateFormat(certificate.date).toUpperCase()}</H3>
                </td>
                <td>
                    <H3>{certificate.title.toUpperCase()}</H3>
                </td>
            </tr>
        {/each}
    </tbody>
</table>
