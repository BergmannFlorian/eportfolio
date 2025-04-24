<script lang="ts">
    import type { Project } from "$lib/interfaces/cv";
    import { base } from "$app/paths";
    import { toSlug } from "$lib/helpers";

    const { project }: { project: Project } = $props();
</script>

<a
    href="{base}/projects/{toSlug(project.name)}"
    class="bg-dark text-light p-2 rounded-md"
>
    <div class="h-[250px] w-[400px] bg-light rounded-md">
        {#if project.img}
            {#await import(`$lib/assets/images/projects/${project.img}.jpg`) then { default: src }}
                <img
                    {src}
                    alt={project.name}
                    class="w-full h-full object-cover rounded-md"
                />
            {/await}
        {/if}
    </div>
    <div>
        <div class="font-bold self-end text-xl">{project.name}</div>
    </div>
</a>
