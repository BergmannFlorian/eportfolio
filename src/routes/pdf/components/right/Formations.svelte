<script lang="ts">
    import type { Formation } from "$lib/interfaces/cv";

    export let formations: Formation[];

    function getDate(start: string, end: string): string {
        return `${start.split(".")[2]} - ${end.split(".")[2]}`;
    }
</script>

<table class="w-full">
    <tbody class="w-full align-top text-[11px]">
        {#each formations as formation}
            <tr class="w-full">
                <td class="font-bold w-[15%] py-0.5 text-gray">
                    {getDate(formation.start, formation.end)}
                </td>
                <td class="font-bold w-[15%] py-0.5">{formation.company}</td>
                <td class="py-0.5">
                    <div class="font-bold text-[12px]">{formation.name}</div>
                    <ul class="list-disc pl-3">
                        {#each formation.tasks as task}
                            <li>{task}</li>
                        {/each}
                    </ul>
                </td>
                <td></td>
            </tr>
        {/each}
    </tbody>
</table>
