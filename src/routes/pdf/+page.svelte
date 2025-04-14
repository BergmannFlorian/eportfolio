<script lang="ts">
    import type { CV } from "$lib/interfaces/cv";
    import Infos from "./first/Infos.svelte";
    import Skills from "./first/Skills.svelte";
    import Certificates from "./first/Certificates.svelte";
    import Formations from "./first/Formations.svelte";
    import Section from "./first/Section.svelte";
    import Jobs from "./second/Jobs.svelte";

    const { data } = $props();
    let cv = $state(data.cv ? (data.cv as CV) : null);
</script>

{#if cv}
    <div class="pdf font-teachers text-[14px] font-normal pt-1">
        <div class="page">
            <div class="h-full min-w-[7cm] w-[7cm] max-w-[7cm]">
                <Infos infos={cv.infos} />
            </div>
            <div class="right h-full flex flex-col py-5 pr-5 pl-2 gap-y-5">
                <div class="text-[32px] text-dark font-questrial">
                    {cv.infos.title}
                </div>
                <Section title="compétence">
                    <Skills {data} />
                </Section>
                <Section title="certifications">
                    <Certificates certificates={cv.certificates} />
                </Section>
                <Section title="formations">
                    <Formations formations={cv.formations} />
                </Section>
            </div>
        </div>
        <div class="page">
            <Jobs jobs={cv.jobs} />
        </div>
    </div>
{/if}

<style>
    * {
        box-sizing: border-box;
        -moz-box-sizing: border-box;
    }

    .page {
        width: 21cm;
        height: 29.7cm;
        margin: 1cm auto;
        border: 1px #d3d3d3 solid;
        border-radius: 5px;
        background: white;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-wrap: nowrap;
        flex-shrink: 0;
    }

    @page {
        size: A4;
        margin: 0;
    }

    @media print {
        .page {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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

    @media print {
        .pdf {
            padding: 0;
        }
    }
</style>
