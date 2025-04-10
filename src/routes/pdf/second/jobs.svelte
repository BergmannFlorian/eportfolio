<script lang="ts">
    import type { Job as JobI, Project } from "$lib/interfaces/cv";
    import Job from "./Job.svelte";

    export let jobs: JobI[];

    function displayProjects(projects: Project[]): boolean {
        if (projects.length < 1) return false;
        if (projects.length === 1 && projects[0].link === "") return false;
        return true;
    }
</script>

<div class="w-full flex flex-col py-7">
    <div
        class="text-[19px] text-center w-full tracking-[5px] font-questrial text-gray-dark"
    >
        {"expériences".toUpperCase()}
    </div>
    {#each jobs as job}
        <Job {job}></Job>
    {/each}
</div>
