<script lang="ts">
    import type { Certificate } from "../../3d/interfaces";

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
