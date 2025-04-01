import * as THREE from "three";
import { CAMERA, COLORS, CONTROLS, PLAYER } from "./const";
import { PointerLockControls } from "three/examples/jsm/Addons.js";
import type { Renderer } from "./environnement";
import type { Position3 } from "./helpers";
import { LinesBox } from "./items";

export class Camera extends THREE.PerspectiveCamera {
    baseY: number = 0;
    zoom: number = 1;
    isFps: boolean = false;

    constructor(position: Position3 = CAMERA.position) {
        super(
            50,
            innerWidth / innerHeight,
            1,
            1000,
        );
        this.baseY = position.y;
        this.position.add(position);

        addEventListener("wheel", (event) => {
            this.zoom = Math.min(
                Math.max(0.125, this.zoom + event.deltaY * -0.001),
                4,
            );
        });
    }

    move(position: THREE.Vector3) {
        if (this.isFps) {
            this.position.set(position.x, PLAYER.size.height, position.z);
        } else {
            this.position.set(position.x, this.baseY, position.z - this.baseY / this.zoom);
            this.lookAt(position);
        }
    }

    resize(aspect: number) {
        this.aspect = aspect;
        this.updateProjectionMatrix();
    }
}

export class Controls extends PointerLockControls {
    direction = new THREE.Vector3(0, 0, 0);
    keyPressed: string[] = [];
    moveSpeed = 0;
    keys = {
        up: ["KeyW", "KeyZ", "ArrowUp"],
        down: ["KeyS", "ArrowDown"],
        right: ["KeyA", "KeyQ", "ArrowLeft"],
        left: ["KeyD", "ArrowRight"],
        switch: ["Enter", "	Space"],
    }
    mode = CONTROLS.mode.fly;
    clock: THREE.Clock;

    constructor(camera: Camera, renderer: Renderer) {
        super(camera, renderer.domElement);

        this.moveSpeed = PLAYER.speed.walk;
        this.clock = new THREE.Clock();

        addEventListener(
            "keyup",
            (event) => {
                this.checkShiftKey(event);
                this.checkSwitchMode(event.code);
                const index = this.keyPressed.indexOf(event.code);
                if (index >= 0) {
                    delete this.keyPressed[index];
                    this.updateMove();
                }
            },
            false,
        );

        addEventListener(
            "keydown",
            (event) => {
                this.checkShiftKey(event);
                if (this.keyPressed.indexOf(event.code) === -1) {
                    this.keyPressed.push(event.code);
                    this.updateMove();
                }
            },
            false,
        );

        addEventListener(
            "click",
            (event) => {
                if (this.mode === CONTROLS.mode.fps) {
                    this.lock();
                }
            },
            false,
        );
    }

    isOneOfKeysPressed(keys: string[]) {
        return this.keyPressed.some((keyCode) => keys.includes(keyCode));
    }

    updateMove() {
        if (this.isFps()) {
            const camDir = this.getDirection(new THREE.Vector3());
            this.direction.x = camDir.x * this.moveSpeed;
            this.direction.z = camDir.z * this.moveSpeed;
        } else {
            this.direction.x = 0;
            this.direction.z = 0;

            if (this.isOneOfKeysPressed(this.keys.right)) {
                this.direction.x += this.moveSpeed;
            }
            if (this.isOneOfKeysPressed(this.keys.left)) {
                this.direction.x -= this.moveSpeed;
            }
            if (this.isOneOfKeysPressed(this.keys.up)) {
                this.direction.z += this.moveSpeed;
            }
            if (this.isOneOfKeysPressed(this.keys.down)) {
                this.direction.z -= this.moveSpeed;
            }
        }
    }

    checkShiftKey(event: KeyboardEvent) {
        this.moveSpeed = event.shiftKey ? PLAYER.speed.sprint : PLAYER.speed.walk;
    }

    checkSwitchMode(event: string) {
        if (this.isOneOfKeysPressed(this.keys.switch)) {
            this.switchMode();
            dispatchEvent(new Event('switchMode'))
        }
    }

    switchMode() {
        if (this.isFps()) {
            this.mode = CONTROLS.mode.fly;
            this.unlock();
        } else {
            this.mode = CONTROLS.mode.fps;
        }
        console.log(140, this.mode);
    }

    isFps() {
        return this.mode === CONTROLS.mode.fps;
    }
}

export class Player extends THREE.Mesh {
    camera: Camera;
    controls: Controls;

    constructor(renderer: Renderer, scene: THREE.Scene) {
        const geometry = new THREE.BoxGeometry(PLAYER.size.width, PLAYER.size.height, PLAYER.size.width);
        const material = new THREE.MeshBasicMaterial({ color: COLORS.white });
        const materialFront = new THREE.MeshBasicMaterial({ color: COLORS.black });
        super(geometry, [materialFront, material, material, material, material, material]);
        this.position.set(PLAYER.pos.x, PLAYER.pos.y + PLAYER.size.height / 2, PLAYER.pos.y);

        new LinesBox(geometry, this);

        this.camera = new Camera();
        this.controls = new Controls(this.camera, renderer);

        this.camera.lookAt(this.position);

        scene.add(this);

        addEventListener('switchMode', () => {
            this.camera.isFps = this.controls.isFps();
        })
    }

    move(movement: THREE.Vector3) {
        if (this.controls.isFps()) {
            console.log(this.controls.direction, this.controls.getDirection(new THREE.Vector3()));
        } else {
            this.position.x += movement.x;
            this.position.z += movement.z;
        }
        if (movement.length() != 0) {
            this.rotation.y = -new THREE.Vector2(movement.x, movement.z).angle();
        }
    }

    animate() {
        this.move(this.controls.direction);
        this.camera.move(this.position);
    }
}