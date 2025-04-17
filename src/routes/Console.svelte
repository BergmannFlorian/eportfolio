<script lang="ts">
    import { shortDate } from "$lib/helpers.js";
    import type { CV } from "$lib/interfaces/cv.js";
    import { onMount } from "svelte";

    const SPEED = {
        console: 10,
        user: 10,
    };

    class Console {
        title: string | null;
        text: string | null;
        constructor(title: string | null = null, text: string | null = null) {
            this.title = title;
            this.text = text;
        }
    }

    const { data } = $props();
    let cv = $state(data.cv ? (data.cv as CV) : null);

    function timeout(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function displayConsole(
        lines: Console[],
        parent: HTMLElement,
        cursor: HTMLElement,
    ) {
        for (const line of lines) {
            const div = document.createElement("div");
            div.classList = "flex";
            parent.appendChild(div);

            const text = document.createElement("div");
            div.appendChild(text);

            div.appendChild(cursor);

            if (line.title) {
                for (let i = 0; i < line.title.length; i++) {
                    await timeout(SPEED.console);
                    text.innerHTML += line.title[i];
                }
                text.innerText += ": ";
                if (line.text) {
                    await timeout(500);
                    for (let i = 0; i < line.text.length; i++) {
                        await timeout(SPEED.user);
                        text.innerHTML += line.text[i];
                    }
                }
            } else text.innerText += "...";
            await timeout(500);
        }
    }

    onMount(() => {
        let container = document.getElementById("container");
        let cursor = document.getElementById("cursor");
        if (container && cursor && cv) {
            const lines = [
                new Console("contact"),
                new Console("name", cv.infos.contact.name),
                new Console("title", cv.infos.title),
                new Console("email", cv.infos.contact.email),
                ...cv.infos.socials.map((social) => {
                    return new Console(social.name, social.link);
                }),
                // new Console("references", "sur demande"),
                new Console(),
                new Console("jobs"),
                ...cv.jobs.map((job) => {
                    return new Console(
                        shortDate(job.start, job.end),
                        `${job.title} - ${job.company}`,
                    );
                }),
                new Console(),
                new Console("formations"),
                ...cv.formations.map((formation) => {
                    return new Console(
                        shortDate(formation.start, formation.end),
                        `${formation.name} - ${formation.company}`,
                    );
                }),
            ];

            displayConsole(lines, container, cursor);
        }
    });
</script>

<div class="font-teachers w-[80%] flex justify-center pt-10">
    <!-- {#if cv}
        <div>
            <div>&#123</div>
            <div class="flex pl-4">
                <div class="flex justify-end">name: "</div>
                <div class="text-4xl">{cv.infos.contact.name}</div>
                ",
            </div>
            <div class="flex pl-4">
                title: "
                <div>{cv.infos.title}</div>
                ",
            </div>
            <div>&#125</div>
        </div>
    {/if} -->
    <div
        id="container"
        class="bg-dark text-light w-full p-5 border-3 border-light rounded-xl bg-radial from-gray to-dark font-[Inconsolata] text-shadow-[0_0_5px] text-shadow-light"
    >
        <div id="cursor">_</div>
    </div>
</div>

<style>
    #cursor {
        animation: pulse 1s infinite;
    }

    @keyframes pulse {
        0% {
            opacity: 0;
        }
        50% {
            opacity: 0;
        }
        51% {
            opacity: 1;
        }
        100% {
            opacity: 1;
        }
    }
</style>
