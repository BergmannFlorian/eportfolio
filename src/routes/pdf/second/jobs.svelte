<script lang="ts">
    import { dateFormat } from "$lib/helpers";
    import type { Job } from "$lib/interfaces/cv";

    export let jobs: Job[];

    function getDate(start: string, end: string): string {
        return `${start.split(".")[2]} - ${end.split(".")[2]}`;
    }
</script>

<div class="w-full flex flex-col py-7">
    <div
        class="text-[19px] text-center w-full tracking-[5px] font-questrial text-gray-dark"
    >
        {"expériences".toUpperCase()}
    </div>
    {#each jobs as job}
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
            <div class="flex justify-self-center justify-center pb-2">
                <hr class="border-solid border-3 w-15 text-gray" />
            </div>
            <div class="px-5">
                <div class="flex w-full px-3 pb-3">
                    <ul class="w-[50%] list-disc border-solid border-r-1 pr-2">
                        {#each job.tasks as task}
                            <li>{task}</li>
                        {/each}
                    </ul>
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
                </div>
            </div>
        </div>
    {/each}
</div>

<style>
    .head {
        /* background-color: #3b3b3b; */
        /* color: #b4b4b4; */
        background-color: #b4b4b4;
        color: #3b3b3b;
    }
    .border-r-1 {
        border-color: #d3d3d3;
    }
</style>
