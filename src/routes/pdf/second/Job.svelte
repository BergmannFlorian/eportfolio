<script lang="ts">
    import { dateFormat, shortDate } from "$lib/helpers";
    import type { Job } from "$lib/interfaces/cv";

    export let job: Job;

    let displayProjects = true;
    if (job.projects.length < 1) displayProjects = false;
    if (job.projects.length === 1 && job.projects[0].link === "")
        displayProjects = false;
</script>

<div class="w-full">
    <div class="text-dark px-5 py-1 grid bg-gray-300">
        <div class="grid grid-cols-3 font-bold">
            <div class="justify-self-start">
                {`${dateFormat(job.start)} - ${dateFormat(job.end)}`.toUpperCase()}
            </div>
            <div class="justify-self-center">
                {job.title.toUpperCase()}
            </div>
            <div class="justify-self-end text-nowrap">
                {job.company.toUpperCase()}
            </div>
        </div>
    </div>
    <div class="px-5 pt-1">
        <div class="flex w-full px-3 pb-3">
            <ul
                class="{displayProjects
                    ? 'w-[50%] border-solid border-r-1 border-gray-300 pr-2'
                    : 'w-full'} list-disc"
            >
                {#each job.tasks as task}
                    <li>{task}</li>
                {/each}
            </ul>
            {#if displayProjects}
                <ul class="w-[50%] list-disc pl-4">
                    {#each job.projects as project}
                        <li>
                            {project.name}
                            {#if project.link}
                                <a href={project.link}>: {project.link}</a>
                            {/if}
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
</div>

<style>
</style>
