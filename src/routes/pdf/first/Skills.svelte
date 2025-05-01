<script lang="ts">
    import { getDate } from "$lib/helpers";
    import type { CV, Formation, Job } from "$lib/interfaces/cv";
    import type { Skills } from "$lib/interfaces/skills";
    import H3 from "../fonts/H3.svelte";

    interface SkillsCat {
        type: number;
        name: string;
    }

    const TYPE = { top: 1, mid: 0, bottom: -1 };

    const MIN = 2;
    const MAX = 5;

    const langs: SkillsCat[] = [];
    const libs: SkillsCat[] = [];
    const tools: SkillsCat[] = [];
    const buisness: SkillsCat[] = [];

    const { data } = $props();
    const cv = $state(data.cv ? (data.cv as CV) : null);
    const skills = $state(data.skills ? (data.skills as Skills) : null);

    const short = new Date();
    short.setFullYear(short.getFullYear() - MIN);
    const long = new Date();
    long.setFullYear(long.getFullYear() - MAX);

    function getType(jobEnd: string): number {
        const date = getDate(jobEnd);
        if (date > short) return TYPE.top;
        if (date < long) return TYPE.bottom;
        return TYPE.mid;
    }

    function addSkill(
        array: number[],
        source: string[],
        dest: SkillsCat[],
        type: number,
    ) {
        if (!skills) return;
        array.forEach((item) => {
            const index = dest.map((e) => e.name).indexOf(source[item]);
            if (index < 0) {
                dest.push({
                    type: type,
                    name: source[item],
                });
            } else {
                dest[index].type = Math.max(type, langs[index].type);
            }
        });
    }

    function addSkills(experiences: Job[] | Formation[]) {
        if (!skills) return;
        experiences.forEach((exp) => {
            const type = getType(exp.end);
            addSkill(exp.skills.langs, skills.langs, langs, type);
            addSkill(exp.skills.libs, skills.libs, libs, type);
            addSkill(exp.skills.tools, skills.tools, tools, type);
            addSkill(exp.skills.buisness, skills.buisness, buisness, type);
        });
    }

    function boldSkill(target: EventTarget | null) {
        if (!target) return;
        const elem = target as Element;
        const parent = elem.parentElement;
        if (!parent) return;
        if (elem.classList.toggle("font-bold")) {
            parent.insertBefore(elem, elem.parentElement.firstChild);
        } else {
            [...parent.children].forEach((child) => {
                if (child.classList.contains("font-bold")) {
                    child.after(elem);
                }
            });
        }
    }

    if (cv && skills) {
        cv.jobs;
        addSkills(cv.jobs);
        addSkills(cv.formations);
    }

    const content = {
        rows: [
            {
                title: `Experience`,
                type: TYPE.top,
            },
            {
                title: `Connaissance`,
                type: TYPE.mid,
            },
            {
                title: `Notion`,
                type: TYPE.bottom,
            },
        ],
        cols: [
            {
                title: "langages",
                skills: langs,
            },
            {
                title: "framework / bibliotèque",
                skills: libs,
            },
            {
                title: "outils",
                skills: tools,
            },
            // {
            //     title: "compétences métiers",
            //     skills: buisness
            // }
        ],
    };
</script>

<table class="w-full border-solid text-[9px]">
    <thead class="font-bold">
        <tr class="border-b border-light text-center">
            <td class="border-r border-light w-[25%]"></td>
            {#each content.cols as col}
                <td class="w-[25%]">
                    <H3>{col.title.toLocaleUpperCase()}</H3></td
                >
            {/each}
        </tr>
    </thead>
    <tbody>
        {#each content.rows as row}
            <tr>
                <td class="text-[7px] font-bold border-r border-light">
                    {row.title.toUpperCase()}
                </td>
                {#each content.cols as col}
                    <td>
                        {#each col.skills.filter((skill) => skill.type === row.type) as skill}
                            <button
                                class="w-full"
                                onclick={(event) => boldSkill(event.target)}
                            >
                                {skill.name.toUpperCase()}
                            </button>
                        {/each}
                    </td>
                {/each}
            </tr>
        {/each}
    </tbody>
</table>

<style>
    td {
        padding: 5px;
    }
</style>
