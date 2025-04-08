<script lang="ts">
    import type { Job } from "$lib/interfaces/cv";

    export let job: Job;
</script>

<div>
    <div>{job.title}</div>
    <div>
        <div>{job.start} - {job.end}</div>
        <div>{job.company}</div>
    </div>
    <div>
        {#each job.tasks as task}
            <div>{task}</div>
        {/each}
    </div>
    <div>
        {#each job.projects as project}
            <div>
                <div>{project.name}</div>
                <div>{project.link}</div>
            </div>
        {/each}
    </div>
</div>
