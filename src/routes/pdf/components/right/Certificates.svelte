<script lang="ts">
    import type { Certificate } from "$lib/interfaces/cv";

    export let certificates: Certificate[];
</script>

<div>
    <div>Certifications</div>
    <div>
        {#each certificates as certificate}
            <div>{certificate}</div>
        {/each}
    </div>
</div>
