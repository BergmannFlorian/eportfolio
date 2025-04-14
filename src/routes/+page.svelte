<script lang="ts">
    import type { CV } from "$lib/interfaces/cv.js";

    const { data } = $props();
    let cv = $state(data.cv ? (data.cv as CV) : null);
</script>

{#if cv}
    <h1>{cv.infos.contact.name}</h1>
{/if}
