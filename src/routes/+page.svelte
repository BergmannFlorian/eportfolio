<script lang="ts">
    import type { CV } from "$lib/interfaces/cv.js";

    const { data } = $props();
    let cv = $state(data.cv ? (data.cv as CV) : null);
</script>

<nav>
    <a href="/">home</a>
    <a href="/3d">3D</a>
    <a href="/pdf">PDF</a>
</nav>

{#if cv}
    <h1>{cv.infos.contact.name}</h1>
{/if}
