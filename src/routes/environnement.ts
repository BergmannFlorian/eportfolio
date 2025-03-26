import * as THREE from "three";

export class Renderer extends THREE.WebGLRenderer {
    constructor(container: Element) {
        super(
            { antialias: true }
        );
        this.setSize(innerWidth, innerHeight);
        this.shadowMap.enabled = true;
        this.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.domElement);
    }
}

export class Camera extends THREE.PerspectiveCamera {
    baseY: number = 0;
    zoom: number = 1;

    constructor(position: THREE.Vector3) {
        super(
            50,
            innerWidth / innerHeight,
            1,
            1000,
        );
        this.baseY = position.y;
        this.position.set(position.x, position.y, position.z);

        addEventListener("wheel", (event) => {
            this.zoom = Math.min(
                Math.max(0.125, this.zoom + event.deltaY * -0.001),
                4,
            );
        });
    }

    move(position: THREE.Vector3) {
        this.position.x = position.x;
        this.position.z = position.z - this.baseY / this.zoom;

        this.lookAt(position);
    }
}

export class Light extends THREE.DirectionalLight {
    constructor(scene: THREE.Scene) {
        super(0xffffff, 1.0);
        this.position.set(4, 4, 8);
        this.castShadow = true;

        scene.add(this);
    }
}