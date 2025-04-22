<script lang="ts">
    import * as THREE from "three";
    import { Renderer, Light } from "./environnement";
    import { Experience, Floor } from "./items";
    import { Helpers, Position3 } from "./helpers";
    import { loadFont } from "./font";
    import { Player } from "./controls";
    import { onMount } from "svelte";
    import type { CV } from "$lib/interfaces/cv";
    import { base } from "$app/paths";
    import TouchControls from "./controls2";

    let scInnerWidth = $state(0);
    let scOuterWidth = $state(0);
    let scInnerHeight = $state(0);
    let scOuterHeight = $state(0);

    const { data } = $props();
    onMount(() => {
        if (data.cv) init(data.cv);
    });

    async function init(cv: CV) {
        let container = document.getElementById("container");
        if (container) {
            await loadFont();

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xd4f7ff);

            const renderer = new Renderer(container);
            const floor = new Floor(scene);
            // const player = new Player(renderer, scene, true);
            const light = new Light(scene);

            const helpers = new Helpers(scene);

            const camera = new THREE.PerspectiveCamera(
                45,
                innerWidth / innerHeight,
                1,
                1000,
            );
            const controls = new TouchControls(container, camera, scene);
            controls.setPosition(0, 1.8, 0);

            let pos = new Position3(0, 0.1, 10);

            const boxs3: THREE.Box3[] = [];
            cv.jobs.forEach((job, index) => {
                let experience = new Experience(job, pos, scene);
                pos.x += experience.width + 5;

                boxs3.push(new THREE.Box3().setFromObject(experience));
            });

            addEventListener(
                "resize",
                (event) => {
                    // player.camera.resize(innerWidth / innerHeight);
                    camera.aspect = innerWidth / innerHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(innerWidth, innerHeight);
                },
                false,
            );

            function animate() {
                controls.update();
                renderer.render(scene, camera);
                // player.animate();
                // const playerBox = new THREE.Box3().setFromObject(player);
                // setTimeout(() => {
                //     player.controls.switchMode(
                //         boxs3.some((box3) => box3.intersectsBox(playerBox)),
                //     );
                // }, 300);
                // renderer.render(scene, player.camera);
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
<div id="container">
    <nav class="fixed left-1 top-1">
        <a class="p-1 bg-black text-white" href="{base}/">Home</a>
    </nav>
</div>
