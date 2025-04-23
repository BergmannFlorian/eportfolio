<script lang="ts">
    import type { Project } from "$lib/interfaces/cv";
    import { base } from "$app/paths";
    import { toSlug } from "$lib/helpers";

    const { project }: { project: Project } = $props();
</script>

<a
    href="{base}/projects/{toSlug(project.name)}"
    class="bg-dark text-light p-2 rounded-md w-[250px] flex flex-wrap"
>
    {#if project.img}
        {#await import(`$lib/assets/images/projects/${project.img}.jpg`) then { default: src }}
            <img
                {src}
                alt={project.name}
                class="h-[150px] w-full object-cover rounded-md"
            />
        {/await}
    {/if}
    <div class="font-bold self-end">{project.name}</div>
</a>
