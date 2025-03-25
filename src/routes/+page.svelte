<script module lang="ts">
    import * as THREE from "three";
    import { browser } from "$app/environment";
    import { Camera, Renderer, Light } from "./environnement";
    import { Cube, Floor } from "./items";
    import { Helpers } from "./helpers";
    import { Controls } from "./controls";

    const base = {
        camera: {
            position: new THREE.Vector3(15, 10, 0),
        },
    };

    let scInnerWidth = $state(0);
    let scOuterWidth = $state(0);
    let scInnerHeight = $state(0);
    let scOuterHeight = $state(0);

    if (browser) {
        let container = document.getElementById("container");
        if (container) {
            const cvFile = await fetch("cv.json");
            const cv = await cvFile.json();
            console.log(cv);

            const scene = new THREE.Scene();

            const renderer = new Renderer(container);
            const camera = new Camera(base.camera.position);
            const floor = new Floor(scene);
            const cube = new Cube(scene);
            const light = new Light(scene);

            camera.lookAt(cube.position);

            const helpers = new Helpers(scene);

            const controls = new Controls();

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
