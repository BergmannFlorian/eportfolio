<script lang="ts">
    import { dateFormat } from "$lib/helpers";
    import type { Job } from "$lib/interfaces/cv";

    export let job: Job;

    let displayProjects = true;
    if (job.projects.length < 1) {
        displayProjects = false;
    }
    if (job.projects.length === 1 && job.projects[0].link === "") {
        displayProjects = false;
    }
</script>

<div class="w-full">
    <div class="grid grid-cols-3 justify-between pb-2">
        <div class="bg-dark text-light font-bold pl-5 text-left">
            {`${dateFormat(job.start)} - ${dateFormat(job.end)}`.toUpperCase()}
        </div>
        <div class="text-center font-bold">
            {job.title.toUpperCase()}
        </div>
        <div class="pr-5 text-right">
            {job.company.toUpperCase()}
        </div>
    </div>
    <div class="w-full flex">
        <ul
            class="{displayProjects
                ? 'w-[50%] border-solid border-r-1 border-gray-300'
                : 'w-full'} list-disc pl-8"
        >
            {#each job.tasks as task}
                <li>{task}</li>
            {/each}
        </ul>
        {#if displayProjects}
            <div class="w-[50%]">
                <div class="pl-1">Exemples de réalisations :</div>
                <ul class="list-disc pl-4">
                    {#each job.projects as project}
                        <li>
                            {project.name}
                            {#if project.link}
                                <a href={project.link}>: {project.link}</a>
                            {/if}
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
