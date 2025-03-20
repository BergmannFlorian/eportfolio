<script lang="ts">
    import { onMount } from "svelte";
    import * as THREE from "three";

    $: innerHeight = 0;
    $: innerWidth = 0;
    $: outerHeight = 0;
    $: outerWidth = 0;

    const move = new THREE.Vector3(0, 0, 0);
    const keyPressed: string[] = [];
    const sprintSpeed = 0.5;
    const walkSpeed = 0.2;
    const base = {
        camera: {
            x: 15,
            y: 10,
            z: 0,
        },
    };

    let container: Element;
    let moveSpeed = 0.1;
    let scale = 1;

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
            50,
            innerWidth / innerHeight,
            1,
            1000,
        );
        camera.position.set(base.camera.x, base.camera.y, base.camera.z);

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(50, 50); // Width and height of the plane
        const floorMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -0.01;
        floor.rotation.x = Math.PI / 2;
        scene.add(floor);

        // Cube
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.y = 1;
        cube.position.z = 1;
        scene.add(cube);

        const edges = new THREE.EdgesGeometry(geometry);
        const lines = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x00000 }),
        );
        cube.add(lines);
        camera.lookAt(cube.position);

        // Light
        const light1 = new THREE.DirectionalLight(0xffffff, 1.0);
        light1.position.set(4, 4, 8);
        light1.castShadow = true;
        scene.add(light1);

        // Helpers
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        const arrowHelper = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            2,
            0x00000,
        );
        cube.add(arrowHelper);

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

        function checkShiftKey(event: KeyboardEvent) {
            moveSpeed = event.shiftKey ? sprintSpeed : walkSpeed;
        }

        addEventListener(
            "keydown",
            (event) => {
                checkShiftKey(event);
                if (keyPressed.indexOf(event.code) === -1) {
                    keyPressed.push(event.code);
                    updateMove();
                }
            },
            false,
        );

        addEventListener(
            "keyup",
            (event) => {
                checkShiftKey(event);
                const index = keyPressed.indexOf(event.code);
                if (index >= 0) {
                    delete keyPressed[index];
                    updateMove();
                }
            },
            false,
        );

        addEventListener("wheel", (event) => {
            scale = Math.min(Math.max(0.125, scale + event.deltaY * -0.001), 4);
        });

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
            camera.position.x =
                (cube.position.x += move.x) + base.camera.x / scale;
            camera.position.z = cube.position.z += move.z;

            cube.rotation.y = -new THREE.Vector2(move.x, move.z).angle();
            camera.lookAt(cube.position);

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
