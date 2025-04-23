<script lang="ts">
    import { page } from "$app/state";
    import { toSlug } from "$lib/helpers.js";
    import type { CV, Project } from "$lib/interfaces/cv.js";

    const { data } = $props();
    const cv = $state(data.cv ? (data.cv as CV) : null);
    const slug = page.params.slug;

    let project: Project | null = $state(null);
    if (cv && slug) {
        console.log(slug);
        cv.jobs.every((job) => {
            return job.projects.every((p) => {
                if (toSlug(p.name) === slug) {
                    project = p;
                    return false;
                }
                return true;
            });
        });
    }
</script>

{#if project}
    <div class="w-full flex flex-wrap justify-center">
        {#await import(`$lib/assets/images/projects/${project.img}.jpg`) then { default: src }}
            <img
                {src}
                alt={project.name}
                class="h-[150px] w-full object-cover"
            />
        {/await}
        <div class="w-[80%]">
            <div class="font-questrial font-bold text-dark text-4xl">
                {project.name}
            </div>
        </div>
    </div>
{/if}
