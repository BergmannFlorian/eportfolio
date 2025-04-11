<script lang="ts">
    import { dateFormat } from "$lib/helpers";
    import type { Job } from "$lib/interfaces/cv";

    export let job: Job;

    let displayProjects = true;
    if (job.projects.length < 1) displayProjects = false;
    if (job.projects.length === 1 && job.projects[0].link === "")
        displayProjects = false;
</script>

<div class="w-full">
    <div class="head px-5 py-1 grid">
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
                class="list-disc {displayProjects
                    ? 'w-[50%] border-solid border-r-1 pr-2'
                    : 'w-full'}"
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
    .head {
        background-color: #b4b4b4;
        color: #3b3b3b;
    }
    .border-r-1 {
        border-color: #d3d3d3;
    }
</style>
