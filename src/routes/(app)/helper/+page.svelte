<script lang="ts">
    import type { Skills } from "$lib/interfaces/skills.js";
    const { data } = $props();
    const skills = $state(data.skills ? (data.skills as Skills) : null);

    let langsSelected: string[] = $state([]);
    let libsSelected: string[] = $state([]);
    let toolsSelected: string[] = $state([]);

    function clear() {
        langsSelected = [];
        libsSelected = [];
        toolsSelected = [];
    }
</script>

<div class="p-5">
    <h1 class="text-2xl font-bold">Compétences</h1>
    {#if skills}
        <div class=" flex flex-col gap-y-5">
            <div>
                <button class="p-1 border-1 rounded-xl" onclick={() => clear()}
                    >Clear</button
                >
                <div class=" text-xl">Languages :</div>
                <div class="flex flex-wrap gap-x-2">
                    {#each skills.langs as lang, index}
                        <button
                            onclick={() =>
                                langsSelected[index]
                                    ? delete langsSelected[index]
                                    : (langsSelected[index] = lang)}
                            class="p-1 border-1 rounded-xl"
                        >
                            {lang}
                        </button>
                    {/each}
                </div>
                <div class=" text-xl">Languages séléctionné :</div>
                <div>{langsSelected.join(", ")}</div>
                <div>{Object.keys(langsSelected).join(",")}</div>
            </div>
            <div>
                <div class=" text-xl">Libs :</div>
                <div class="flex gap-x-2">
                    {#each skills.libs as lib, index}
                        <button
                            onclick={() =>
                                libsSelected[index]
                                    ? delete libsSelected[index]
                                    : (libsSelected[index] = lib)}
                            class="p-1 border-1 rounded-xl"
                        >
                            {lib}
                        </button>
                    {/each}
                </div>
                <div class=" text-xl">Libs séléctionné :</div>
                <div>{libsSelected.join(", ")}</div>
                <div>{Object.keys(libsSelected).join(",")}</div>
            </div>
            <div>
                <div class=" text-xl">Tools :</div>
                <div class="flex gap-x-2">
                    {#each skills.tools as tool, index}
                        <button
                            onclick={() =>
                                toolsSelected[index]
                                    ? delete toolsSelected[index]
                                    : (toolsSelected[index] = tool)}
                            class="p-1 border-1 rounded-xl"
                        >
                            {tool}
                        </button>
                    {/each}
                </div>
                <div class=" text-xl">Tools séléctionné :</div>
                <div>{toolsSelected.join(", ")}</div>
                <div>{Object.keys(toolsSelected).join(",")}</div>
            </div>
        </div>
    {/if}
</div>
