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
    const keyPressed: string[] = [];

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

        // const controls = new MapControls(camera, renderer.domElement);
        // controls.enableDamping = true;

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
        function isOneOfKeysPressed(keys: string[]) {
            return keyPressed.some((keyCode) => keys.includes(keyCode));
        }

        function updateMove() {
            move.x = 0;
            move.z = 0;
            if (isOneOfKeysPressed(["KeyW", "KeyZ", "ArrowUp"])) {
                move.x -= moveSpeed;
            }
            if (isOneOfKeysPressed(["KeyS", "ArrowDown"])) {
                move.x += moveSpeed;
            }
            if (isOneOfKeysPressed(["KeyA", "KeyQ", "ArrowLeft"])) {
                move.z += moveSpeed;
            }
            if (isOneOfKeysPressed(["KeyD", "ArrowRight"])) {
                move.z -= moveSpeed;
            }
        }

        function onKeyPress(event: KeyboardEvent) {
            if (keyPressed.indexOf(event.code) === -1) {
                keyPressed.push(event.code);
                updateMove();
            }
        }

        function onKeyUp(event: KeyboardEvent) {
            const index = keyPressed.indexOf(event.code);
            if (index >= 0) {
                delete keyPressed[index];
                updateMove();
            }
        }

        document.addEventListener("keypress", onKeyPress, false);
        document.addEventListener("keyup", onKeyUp, false);

        function animate() {
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;

            camera.position.x = (cube.position.x += move.x) + 5;
            camera.position.z = cube.position.z += move.z;
            // camera.rotation.y = Math.PI;
            // camera.lookAt(cube.position);

            // controls.update();

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
