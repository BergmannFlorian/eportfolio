<script module lang="ts">
    import * as THREE from "three";
    import { browser } from "$app/environment";
    import { Renderer, Light } from "./environnement";
    import { Experience, Floor } from "./items";
    import { Helpers, Position3 } from "./helpers";
    import type { CV } from "./interfaces";
    import { loadFont, TextCanevas } from "./font";
    import { Player } from "./controls";

    let scInnerWidth = $state(0);
    let scOuterWidth = $state(0);
    let scInnerHeight = $state(0);
    let scOuterHeight = $state(0);

    if (browser) {
        let container = document.getElementById("container");
        if (container) {
            await loadFont();

            const cvFile = await fetch("cv.json");
            const cv = (await cvFile.json()) as CV;

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xd4f7ff);

            const renderer = new Renderer(container);
            const floor = new Floor(scene);
            const player = new Player(renderer, scene);
            const light = new Light(scene);

            const helpers = new Helpers(scene);

            let pos = new Position3(0, 0.1, 10);

            const boxs3: THREE.Box3[] = [];
            cv.jobs.forEach((job, index) => {
                let experience = new Experience(job, pos);
                scene.add(experience);
                pos.x += experience.width + 5;

                boxs3.push(new THREE.Box3().setFromObject(experience));
            });

            addEventListener(
                "resize",
                (event) => {
                    player.camera.resize(innerWidth / innerHeight);

                    renderer.setSize(innerWidth, innerHeight);
                },
                false,
            );

            function animate() {
                player.animate();

                const playerBox = new THREE.Box3().setFromObject(player);
                setTimeout(() => {
                    player.controls.switchMode(
                        boxs3.some((box3) => box3.intersectsBox(playerBox)),
                    );
                }, 300);

                renderer.render(scene, player.camera);
            }

            renderer.setAnimationLoop(animate);
        }
    }
</script>

<svelte:window
    bind:innerWidth={scInnerWidth}
    bind:outerWidth={scOuterWidth}
    bind:innerHeight={scInnerHeight}
    bind:outerHeight={scOuterHeight}
/>
<div id="container"></div>
