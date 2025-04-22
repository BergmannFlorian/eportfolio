<script lang="ts">
    import { onMount } from "svelte";
    import Job1 from "./Job1.svelte";
    import type { Job } from "$lib/interfaces/cv";

    interface Props {
        jobs: Job[];
        start: number;
        addPage: any;
    }

    let { jobs, start, addPage }: Props = $props();

    jobs = jobs.slice(start);

    onMount(() => {
        const jobsEl = document.getElementById("jobs");
        if (jobsEl) {
            let startIndex: null | number = null;
            const bottom = jobsEl.offsetTop + jobsEl.offsetHeight;
            [...jobsEl.children].forEach((jobEl, index) => {
                const job = jobEl as HTMLElement;
                if (job.offsetTop + job.offsetHeight > bottom)
                    startIndex ||= index;
                if (startIndex) {
                    job.remove();
                }
            });
            if (startIndex) {
                addPage(startIndex + start);
            }
        }
    });
</script>

<div class="w-full h-full flex flex-col py-7">
    <div
        class="text-[19px] text-center w-full tracking-[5px] font-questrial text-gray-dark"
    >
        {"expériences".toUpperCase()}
    </div>
    <div id="jobs" class="w-full h-full">
        {#each jobs as job}
            <!-- <Job {job}></Job> -->
            <Job1 {job}></Job1>
        {/each}
    </div>
</div>
