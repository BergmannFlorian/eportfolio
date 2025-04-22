<script lang="ts">
    import { getDate } from "$lib/helpers";
    import type { CV, Formation, Job } from "$lib/interfaces/cv";
    import type { Skills } from "$lib/interfaces/skills";

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
        row: [
            {
                title: `Il y a moins de ${MIN} an${MIN > 1 ? "s" : ""}`,
                type: TYPE.top,
            },
            {
                title: `Il y a entre ${MIN} et ${MAX} an${MAX > 1 ? "s" : ""}`,
                type: TYPE.mid,
            },
            {
                title: `Il y a plus de ${MAX} an${MAX > 1 ? "s" : ""}`,
                type: TYPE.bottom,
            },
        ],
        col: [langs, libs, tools],
    };
</script>

<table class="w-full border-solid text-[9px]">
    <thead class="font-bold">
        <tr class="border-b border-light">
            <td class="border-r border-light w-[25%]"></td>
            <td class="w-[25%]">LANGUAGES</td>
            <td class="w-[25%]">FRAMEWORK / BIBLIOTHÈQUE</td>
            <td class="w-[25%]">OUTILS</td>
        </tr>
    </thead>
    <tbody>
        {#each content.row as row}
            <tr>
                <td class="text-[7px] font-bold border-r border-light">
                    {row.title.toUpperCase()}
                </td>
                {#each content.col as col}
                    <td>
                        {#each col.filter((skill) => skill.type === row.type) as skill}
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
        padding: 10px;
    }
</style>
