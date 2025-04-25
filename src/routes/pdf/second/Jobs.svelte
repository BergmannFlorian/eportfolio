<script lang="ts">
    import { onMount } from "svelte";
    import type { Job as JobI } from "$lib/interfaces/cv";
    import Job from "./Job.svelte";
    import H2 from "../fonts/H2.svelte";

    interface Props {
        jobs: JobI[];
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
    <H2>{"expériences".toUpperCase()}</H2>
    <div id="jobs" class="w-full h-full">
        {#each jobs as job}
            <Job {job}></Job>
        {/each}
    </div>
</div>
