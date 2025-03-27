<script module lang="ts">
    import * as THREE from "three";
    import { browser } from "$app/environment";
    import { Camera, Renderer, Light } from "./environnement";
    import { Player, Experience, Floor } from "./items";
    import { Helpers } from "./helpers";
    import { Controls } from "./controls";
    import type { CV } from "./interfaces";
    import { loadFont } from "./font";
    import { Building, Wall } from "./buildings";

    const base = {
        camera: {
            position: new THREE.Vector3(0, 10, -15),
        },
    };

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
            const camera = new Camera(base.camera.position);
            // const floor = new Floor(scene);
            const cube = new Player(scene);
            const light = new Light(scene);

            camera.lookAt(cube.position);

            const helpers = new Helpers(scene);

            const controls = new Controls();

            let pos = new THREE.Vector3(0, 0, 10);
            cv.jobs.forEach((job) => {
                let experience = new Experience(job, pos, scene);
                pos.x = experience.position.x + experience.width / 2 + 1;
            });

            const wall = new Wall(new THREE.Vector3(0, 0, 0), true);
            scene.add(wall);

            addEventListener(
                "resize",
                (event) => {
                    camera.aspect = innerWidth / innerHeight;
                    camera.updateProjectionMatrix();

                    renderer.setSize(innerWidth, innerHeight);
                },
                false,
            );

            function animate() {
                cube.move(controls.move);
                camera.move(cube.position);

                renderer.render(scene, camera);
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
