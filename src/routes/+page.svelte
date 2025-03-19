<script lang="ts">
    import { onMount } from "svelte";
    import * as THREE from "three";
    import { MapControls } from "three/addons/controls/MapControls.js";

    $: outerWidth = 0;
    $: innerWidth = 0;
    $: outerHeight = 0;
    $: innerHeight = 0;

    let container: Element;
    const moveSpeed = 0.1;
    const move = new THREE.Vector3(0, 0, 0);

    onMount(() => {
        const scene = new THREE.Scene();

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        renderer.setSize(innerWidth, innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        container.appendChild(renderer.domElement);

        // Camera
        const camera = new THREE.PerspectiveCamera(
            100,
            innerWidth / innerHeight,
            1,
            1000,
        );
        camera.position.x = 5;
        camera.position.y = 10;

        const controls = new MapControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(50, 50); // Width and height of the plane
        const floorMaterial = new THREE.MeshPhongMaterial({
            color: 0x999999,
            side: THREE.DoubleSide,
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = 0;
        floor.rotation.x = Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Cube
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        cube.castShadow = true;
        cube.position.y = 5;
        scene.add(cube);
        camera.lookAt(cube.position);

        // Light
        const light1 = new THREE.DirectionalLight(0xffffff, 1.0);
        light1.position.set(4, 4, 8);
        light1.castShadow = true;
        scene.add(light1);

        // Helpers
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        // Keyboard control
        function onKeyPress(event: KeyboardEvent) {
            updateMove(event.code, true);
        }

        function keyup(event: KeyboardEvent) {
            updateMove(event.code, false);
        }

        function updateMove(eventCode: string, press: boolean) {
            console.log(eventCode, press);
            switch (eventCode) {
                case "KeyW":
                case "KeyZ":
                case "ArrowUp":
                    move.x -= press ? moveSpeed : -moveSpeed;
                    // cube.position.x -= moveSpeed;
                    break;
                case "KeyS":
                case "ArrowDown":
                    move.x += press ? moveSpeed : -moveSpeed;
                    // cube.position.x += moveSpeed;
                    break;
                case "KeyA":
                case "KeyQ":
                case "ArrowLeft":
                    move.z += press ? moveSpeed : -moveSpeed;
                    // cube.position.z += moveSpeed;
                    break;
                case "KeyD":
                case "ArrowRight":
                    move.z -= press ? moveSpeed : -moveSpeed;
                    // cube.position.z -= moveSpeed;
                    break;
                default:
                    console.log(eventCode);
            }
        }
        document.addEventListener("keypress", onKeyPress);
        document.addEventListener("keyup", keyup);

        function animate() {
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;

            cube.position.x += move.x;
            cube.position.z += move.z;
            controls.update();

            renderer.render(scene, camera);
        }

        renderer.setAnimationLoop(animate);
    });
</script>

<svelte:window
    bind:innerWidth
    bind:outerWidth
    bind:innerHeight
    bind:outerHeight
/>
<div bind:this={container}></div>
