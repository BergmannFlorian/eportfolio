<script lang="ts">
    import { dateFormat, getDate } from "$lib/helpers";
    import type { Formation } from "$lib/interfaces/cv";

    export let formations: Formation[];

    formations.sort((a, b) => {
        return getDate(a.start).getDate() - getDate(a.start).getDate();
    });

    function formatDate(start: string, end: string): string {
        const startDate = getDate(start);
        const endDate = getDate(end);
        if (startDate.getFullYear() === endDate.getFullYear()) {
            return `${dateFormat(start, { month: "short" })} - ${dateFormat(end, { month: "short", year: "numeric" })}`;
        } else {
            return `${startDate.getFullYear()} - ${endDate.getFullYear()}`;
        }
    }
</script>

<table class="w-full">
    <tbody class="w-full align-top text-[11px]">
        {#each formations as formation}
            <tr class="py-0.5">
                <td class="w-[30%]">
                    <div class="font-bold text-nowrap flex flex-nowrap">
                        <div class="text-gray pr-2">
                            {formatDate(
                                formation.start,
                                formation.end,
                            ).toUpperCase()}
                        </div>
                        <div class="font-bold">
                            {formation.company}
                        </div>
                    </div>
                </td>
                <td>
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
