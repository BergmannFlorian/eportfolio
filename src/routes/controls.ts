import * as THREE from "three";

export class Controls {
    move = new THREE.Vector3(0, 0, 0);
    keyPressed: string[] = [];
    sprintSpeed = 0.5;
    walkSpeed = 0.2;
    moveSpeed = 0;
    keys = {
        up: ["KeyW", "KeyZ", "ArrowUp"],
        down: ["KeyS", "ArrowDown"],
        right: ["KeyA", "KeyQ", "ArrowLeft"],
        left: ["KeyD", "ArrowRight"],
    }

    constructor() {
        this.moveSpeed = (this.walkSpeed);
        addEventListener(
            "keyup",
            (event) => {
                this.checkShiftKey(event);
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
    }

    isOneOfKeysPressed(keys: string[]) {
        return this.keyPressed.some((keyCode) => keys.includes(keyCode));
    }

    updateMove() {
        this.move.x = 0;
        this.move.z = 0;
        if (this.isOneOfKeysPressed(this.keys.right)) {
            this.move.x += this.moveSpeed;
        }
        if (this.isOneOfKeysPressed(this.keys.left)) {
            this.move.x -= this.moveSpeed;
        }
        if (this.isOneOfKeysPressed(this.keys.up)) {
            this.move.z += this.moveSpeed;
        }
        if (this.isOneOfKeysPressed(this.keys.down)) {
            this.move.z -= this.moveSpeed;
        }
    }

    checkShiftKey(event: KeyboardEvent) {
        this.moveSpeed = event.shiftKey ? this.sprintSpeed : this.walkSpeed;
    }
}