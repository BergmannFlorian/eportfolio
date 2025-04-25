<script lang="ts">
    import { dateFormat } from "$lib/helpers";
    import type { Job } from "$lib/interfaces/cv";
    import H3 from "../fonts/H3.svelte";

    export let job: Job;
</script>

<div class="w-full">
    <div class="grid grid-cols-3 justify-between pb-2">
        <H3 style="bg-dark text-light pl-5"
            >{`${dateFormat(job.start)} - ${dateFormat(job.end)}`.toUpperCase()}</H3
        >
        <H3 style="text-center">{job.title.toUpperCase()}</H3>
        <div class="pr-5 text-right">
            {job.company.toUpperCase()}
        </div>
    </div>
    <div class="pl-4">
        <ul class="list-disc pl-4">
            {#each job.tasks as task}
                <li>{task}</li>
            {/each}
        </ul>
        {#if job.projects.length > 0}
            <div class="pt-2">
                <div class="pl-1">Exemples de réalisations :</div>
                <ul class="list-disc pl-4">
                    {#each job.projects as project}
                        <li>
                            <div class="flex">
                                <div class="font-bold">{project.name}</div>
                                {#if project.link}
                                    <a href={project.link}>: {project.link}</a>
                                {/if}
                            </div>
                        </li>
                    {/each}
                </ul>
            </div>
        {/if}
    </div>
    <div class="flex w-full mb-1 justify-center mt-2">
        <hr class="border-solid border-3 w-15 text-light" />
    </div>
</div>

<style>
</style>
