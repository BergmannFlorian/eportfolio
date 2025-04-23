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
    <div class="w-full flex flex-wrap justify-center">
        {#each groups as group}
            {#if group.projects.length > 0}
                <div class=" w-[90%]">
                    <div class="grid grid-cols-[120px_auto] gap-2">
                        <div class="w-full text-right pt-2 text-dark">
                            {group.date}
                        </div>
                        <div
                            class="w-full flex flex-wrap justify-between text-3xl font-bold text-dark"
                        >
                            <div class="w-full">
                                {group.title}
                            </div>
                            <div class="flex flex-wrap gap-2">
                                {#each group.projects as project}
                                    <Card {project} />
                                {/each}
                            </div>
                        </div>
                    </div>
                    <div
                        class="border-solid border-b-1 border-light py-1"
                    ></div>
                </div>
            {/if}
        {/each}
    </div>
{/if}
