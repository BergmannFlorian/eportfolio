<script lang="ts">
    import { dateFormat, getDate } from "$lib/helpers";
    import type { Formation } from "$lib/interfaces/cv";

    export let formations: Formation[];

    formations = formations.sort((a, b) => {
        return getDate(b.start).getTime() - getDate(a.start).getTime();
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

<div class="w-full align-top text-[11px]">
    {#each formations as formation}
        <div class="mb-3">
            <div class="w-full grid grid-cols-10">
                <div class="col-span-3 font-bold text-nowrap flex flex-nowrap">
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
                <div class="font-bold text-[12px] col-span-7">
                    {formation.name}
                </div>
            </div>
            <div>
                <ul class="list-disc pl-3">
                    {#each formation.tasks as task}
                        <li>{task}</li>
                    {/each}
                </ul>
            </div>
        </div>
    {/each}
</div>
