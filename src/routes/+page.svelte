<script lang="ts">
    import { onMount } from "svelte";
    import * as THREE from "three";

    $: outerWidth = 0;
    $: innerWidth = 0;
    $: outerHeight = 0;
    $: innerHeight = 0;

    let container: Element;
    const walkSpeed = 0.2;
    const sprintSpeed = 0.5;
    let moveSpeed = 0.1;
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
            50,
            innerWidth / innerHeight,
            1,
            1000,
        );
        camera.position.x = 5;
        camera.position.y = 10;

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

        // Stickman
        const head = new THREE.Bone();
        const neck = new THREE.Bone();
        const shoulder = new THREE.Bone();
        const rightArm = new THREE.Bone();
        const leftArm = new THREE.Bone();
        const rightLeg = new THREE.Bone();
        const leftLeg = new THREE.Bone();

        head.add(neck);
        neck.add(shoulder);
        neck.add(rightArm);
        neck.add(leftArm);
        shoulder.add(rightLeg);
        shoulder.add(leftLeg);

        const bones = [
            head,
            neck,
            shoulder,
            rightArm,
            leftArm,
            rightLeg,
            leftLeg,
        ];

        head.position.y = 5;
        head.position.z = -2;

        neck.position.y = -0.3;

        shoulder.position.y = -1.5;

        rightArm.position.y = -1;
        rightArm.position.z = 1;

        leftArm.position.y = -1;
        leftArm.position.z = -1;

        rightLeg.position.y = -2;
        rightLeg.position.z = 1;

        leftLeg.position.y = -2;
        leftLeg.position.z = -1;

        const geometry = new THREE.CylinderGeometry(0.2, 0.2);
        const position = geometry.attributes.position;

        const vertex = new THREE.Vector3();

        const skinIndices = [];
        const skinWeights = [];

        for (let i = 0; i < position.count; i++) {
            vertex.fromBufferAttribute(position, i);

            // compute skinIndex and skinWeight based on some configuration data
            const y = vertex.y + 1;
            const skinIndex = Math.floor(y / 2);
            const skinWeight = (y % 1) / 1;
            skinIndices.push(skinIndex, skinIndex + 1, 0, 0);
            skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
        }

        geometry.setAttribute(
            "skinIndex",
            new THREE.Uint16BufferAttribute(skinIndices, 4),
        );
        geometry.setAttribute(
            "skinWeight",
            new THREE.Float32BufferAttribute(skinWeights, 4),
        );

        // create skinned mesh and skeleton
        // Cube
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const mesh = new THREE.SkinnedMesh(geometry, material);
        const skeleton = new THREE.Skeleton(bones);

        // see example from THREE.Skeleton
        mesh.add(head);

        // bind the skeleton to the mesh
        mesh.bind(skeleton);

        scene.add(mesh);

        const helper = new THREE.SkeletonHelper(mesh);
        scene.add(helper);

        camera.lookAt(head.position);

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

        function checkShiftKey(event: KeyboardEvent) {
            moveSpeed = event.shiftKey ? sprintSpeed : walkSpeed;
        }

        function onKeyDown(event: KeyboardEvent) {
            checkShiftKey(event);
            if (keyPressed.indexOf(event.code) === -1) {
                keyPressed.push(event.code);
                updateMove();
            }
        }

        function onKeyUp(event: KeyboardEvent) {
            checkShiftKey(event);
            const index = keyPressed.indexOf(event.code);
            if (index >= 0) {
                delete keyPressed[index];
                updateMove();
            }
        }

        document.addEventListener("keydown", onKeyDown, false);
        document.addEventListener("keyup", onKeyUp, false);

        function animate() {
            camera.position.x = (head.position.x += move.x) + 5;
            camera.position.z = head.position.z += move.z;
            camera.lookAt(head.position);

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
