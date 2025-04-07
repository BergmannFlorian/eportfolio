<script lang="ts">
    import type { CV } from "../3d/interfaces.js";
    import Certificates from "./components/Certificates.svelte";
    import Formations from "./components/Formations.svelte";
    import Infos from "./components/Infos.svelte";
    import Job from "./components/Job.svelte";
    import Skills from "./components/Skills.svelte";

    const { data } = $props();
    let cv = null;
    if (data.cv) cv = data.cv as CV;
</script>

<nav class="no-print">
    <a href="/">home</a>
    <a href="/3d">3D</a>
    <a href="/pdf">PDF</a>
</nav>

{#if cv}
    <div class="pdf">
        <div class="page">
            <div class="left h-full w-[40%]">
                <Infos infos={cv.infos} />
            </div>
            <div class="right p-5">
                <div class="text-2xl">{cv.infos.title}</div>
                <Skills />
                <Certificates certificates={cv.certificates} />
                <Formations formations={cv.formations} />
            </div>
        </div>
        <div class="page">
            {#each cv.jobs as job}
                <Job {job} />
            {/each}
        </div>
    </div>
{/if}

<style>
    .left {
        background-color: #3b3b3b;
        color: #b4b4b4;
    }

    .pdf {
        font: 7pt "Verdana";
    }

    * {
        box-sizing: border-box;
        -moz-box-sizing: border-box;
    }

    .page {
        width: 21cm;
        height: 29.7cm;
        /* padding: 2cm; */
        margin: 1cm auto;
        border: 1px #d3d3d3 solid;
        border-radius: 5px;
        background: white;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-wrap: nowrap;
    }

    @page {
        size: A4;
        margin: 0;
    }

    @media print {
        .page {
            html,
            body {
                width: 21cm;
                height: 29.7cm;
            }
            margin: 0;
            border: initial;
            border-radius: initial;
            width: initial;
            min-height: initial;
            box-shadow: initial;
            background: initial;
            page-break-after: always;
        }
    }
</style>
