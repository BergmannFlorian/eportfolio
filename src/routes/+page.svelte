<script lang="ts">
    import type { CV } from "./3d/interfaces.js";

    const { data } = $props();
    let cv = null;
    if (data.cv) cv = data.cv as CV;
</script>

<nav>
    <a href="/">home</a>
    <a href="/3d">3D</a>
    <a href="/pdf">PDF</a>
</nav>

{#if cv}
    <h1>{cv.infos.contact.name}</h1>
{/if}
