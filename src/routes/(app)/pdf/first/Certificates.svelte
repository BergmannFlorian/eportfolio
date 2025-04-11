<script lang="ts">
    import { dateFormat } from "$lib/helpers";
    import type { Certificate } from "$lib/interfaces/cv";

    export let certificates: Certificate[];
</script>

<table class="w-full text-[11px]">
    <tbody class="w-full">
        {#each certificates as certificate}
            <tr class="w-full">
                <td class="font-bold w-[30%] text-gray"
                    >{dateFormat(certificate.date).toUpperCase()}</td
                >
                <td class="font-bold">{certificate.title.toUpperCase()}</td>
            </tr>
        {/each}
    </tbody>
</table>
