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
            <div class="head px-5 py-2">
                <div class="flex font-bold">
                    <div class="w-[25%]">
                        {`${dateFormat(job.start)} - ${dateFormat(job.end)}`.toUpperCase()}
                    </div>
                    <div class="">{job.title}</div>
                </div>
                <div class="">{job.company}</div>
                <div class="flex w-[90%]">
                    <hr class="border-solid border-3 w-15 text-gray-light" />
                </div>
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
            <!-- <hr class="border-solid border-0.5 w-full text-gray-light mb-3" /> -->
        </div>
    {/each}
</div>

<style>
    .head {
        background-color: #3b3b3b;
        color: #b4b4b4;
    }
</style>
