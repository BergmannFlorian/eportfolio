<script lang="ts">
    import type { Job as JobI } from "$lib/interfaces/cv";
    import Job from "./Job.svelte";

    export let jobs: JobI[];
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
