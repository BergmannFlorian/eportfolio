import * as THREE from "three";
import { CAMERA, COLORS, CONTROLS, PLAYER } from "./const";
import { PointerLockControls } from "three/examples/jsm/Addons.js";
import type { Renderer } from "./environnement";
import { Position3 } from "./helpers";
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
            let z = this.getTargetPos().z;
            this.zoom = Math.min(
                Math.max(0.125, this.zoom + event.deltaY * -0.001),
                4,
            );
            if (!this.isFps) {
                this.position.z = z - this.baseY / this.zoom;
                this.lookAt(this.getTargetPos());
            }
        });
    }

    resize(aspect: number) {
        this.aspect = aspect;
        this.updateProjectionMatrix();
    }

    switchMode(isFps: boolean, playerPos: THREE.Vector3) {
        this.isFps = isFps;
        if (this.isFps) {
            this.position.set(this.position.x, PLAYER.size.height, this.position.z + this.baseY / this.zoom);
            this.lookAt(this.position.x, PLAYER.size.height, this.position.z + 1);
        } else {
            this.position.set(this.position.x, this.baseY, this.position.z - this.baseY / this.zoom);
            this.lookAt(this.getTargetPos());
        }
    }

    getTargetPos(): THREE.Vector3 {
        if (this.isFps) {
            return new THREE.Vector3(this.position.x, PLAYER.size.height, this.position.z);
        } else {
            return new THREE.Vector3(this.position.x, PLAYER.size.height, this.position.z + this.baseY / this.zoom);
        }
    }
}

export class Controls extends PointerLockControls {
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
    move: THREE.Vector3 = new THREE.Vector3();

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
        this.move.x = 0;
        this.move.z = 0;
        if (this.isOneOfKeysPressed(this.keys.right)) {
            this.move.x -= this.moveSpeed;
        }
        if (this.isOneOfKeysPressed(this.keys.left)) {
            this.move.x += this.moveSpeed;
        }
        if (this.isOneOfKeysPressed(this.keys.up)) {
            this.move.z += this.moveSpeed;
        }
        if (this.isOneOfKeysPressed(this.keys.down)) {
            this.move.z -= this.moveSpeed;
        }

        this.moveForward(this.move.z);
        this.moveRight(this.move.x);
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
        super(geometry, [material, materialFront, material, material, material, material]);
        this.position.set(PLAYER.pos.x, PLAYER.pos.y + PLAYER.size.height / 2, PLAYER.pos.y);

        new LinesBox(geometry, this);

        this.camera = new Camera();
        this.controls = new Controls(this.camera, renderer);

        this.camera.lookAt(this.position);

        scene.add(this);

        addEventListener('switchMode', () => {
            this.camera.switchMode(this.controls.isFps(), this.position);
        })
    }

    move() {
        this.controls.updateMove();

        const target = this.camera.getTargetPos();
        this.position.x = target.x;
        this.position.z = target.z;

        if (this.controls.move.length() != 0) {
            this.rotation.y = new THREE.Vector2(this.controls.move.x, this.controls.move.z).angle();
        }
    }

    animate() {
        this.move();
    }
}