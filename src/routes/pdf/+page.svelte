<script lang="ts">
    import type { CV } from "../3d/interfaces.js";

    const { data } = $props();
    let cv = null;
    if (data.cv) cv = data.cv as CV;
</script>

{#if cv}
    <h1>{cv.infos.contact.name}</h1>
{/if}
