<script lang="ts">
    import type { CV, Project } from "$lib/interfaces/cv.js";
    import Card from "./Card.svelte";
    import { shortDate } from "$lib/helpers";

    interface Group {
        title: string;
        date: string;
        projects: Project[];
    }

    const { data } = $props();
    const cv = $state(data.cv ? (data.cv as CV) : null);

    let groups: Group[] = $state([]);
    if (cv) {
        groups = cv.jobs.map((job) => {
            return {
                title: job.company,
                date: shortDate(job.start, job.end),
                projects: job.projects,
            };
        });
        groups = groups.concat(
            cv.formations.map((formation) => {
                return {
                    title: formation.company,
                    date: shortDate(formation.start, formation.end),
                    projects: formation.projects,
                };
            }),
        );
    }
</script>

{#if cv}
    <div class="px-5 justify-center">
        {#each groups as group}
            {#if group.projects.length > 0}
                <div>
                    <div class="w-full flex justify-between">
                        <div class="font-bold text-dark">{group.title}</div>
                        <div>{group.date}</div>
                    </div>
                    <div class="flex flex-wrap gap-1 place-content-between">
                        {#each group.projects as project}
                            <Card {project} />
                        {/each}
                    </div>
                    <div
                        class="border-solid border-b-1 border-light py-1"
                    ></div>
                </div>
            {/if}
        {/each}
    </div>
{/if}
