<script lang="ts">
    import { onMount } from "svelte";
    import Console from "./Console.svelte";

    let scInnerWidth = $state(0);
    let scOuterWidth = $state(0);
    let scInnerHeight = $state(0);
    let scOuterHeight = $state(0);

    const { data } = $props();

    const katakana =
        "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン";
    const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";

    const alphabet = katakana + latin + nums;

    const fontSize = 16;

    onMount(() => {
        const canvas = document.getElementById("matrix") as HTMLCanvasElement;
        const context = canvas?.getContext("2d");
        if (canvas && context) {
            canvas.width = scInnerWidth;
            canvas.height = scInnerHeight;

            const columns = canvas.width / fontSize;

            const rainDrops: number[] = [];
            for (let x = 0; x < columns; x++) {
                rainDrops[x] = Math.random() * canvas.height;
            }

            setInterval(() => {
                context.fillStyle = "rgba(255, 255, 255, 0.1)";
                context.fillRect(0, 0, canvas.width, canvas.height);

                context.fillStyle = "#000";
                context.font = fontSize + "px monospace";

                for (let i = 0; i < rainDrops.length; i++) {
                    const text = alphabet.charAt(
                        Math.floor(Math.random() * alphabet.length),
                    );
                    context.fillText(
                        text,
                        i * fontSize,
                        rainDrops[i] * fontSize,
                    );

                    if (
                        rainDrops[i] * fontSize > canvas.height &&
                        Math.random() > 0.975
                    ) {
                        rainDrops[i] = 0;
                    }
                    rainDrops[i]++;
                }
            }, 30);
        }
    });
</script>

<svelte:window
    bind:innerWidth={scInnerWidth}
    bind:outerWidth={scOuterWidth}
    bind:innerHeight={scInnerHeight}
    bind:outerHeight={scOuterHeight}
/>

<div class="w-full flex justify-center flex-wrap">
    <canvas id="matrix" class="w-dvw h-dvh fixed top-0 left-0 -z-10"></canvas>
    <Console {data}></Console>
</div>

<style>
</style>
