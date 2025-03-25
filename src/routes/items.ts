import * as THREE from "three";
import type { CV, Job } from "./interfaces";
import { depth } from "three/tsl";

export class Floor extends THREE.Mesh {
    constructor(scene: THREE.Scene) {
        const floorGeometry = new THREE.PlaneGeometry(50, 50); // Width and height of the plane
        const floorMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
        });
        super(floorGeometry, floorMaterial)
        this.position.y = -0.01;
        this.rotation.x = Math.PI / 2;
        scene.add(this);
    }
}

export class Cube extends THREE.Mesh {
    constructor(scene: THREE.Scene) {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        super(geometry, material);
        this.position.y = 1;
        this.position.z = 1;

        const edges = new THREE.EdgesGeometry(geometry);
        const lines = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x00000 }),
        );
        this.add(lines);

        const arrowHelper = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            2,
            0x00000,
        );
        this.add(arrowHelper);

        scene.add(this);
    }

    move(movement: THREE.Vector3) {
        this.position.x += movement.x;
        this.position.z += movement.z;
        this.rotation.y = -new THREE.Vector2(movement.x, movement.z).angle();
    }
}

export class Experience extends THREE.Mesh {
    width: number;

    constructor(
        private job: Job,
        pos: THREE.Vector3,
        scene: THREE.Scene
    ) {
        let width = 5;
        let height = 5;
        let depth = width / 2;
        const geometry = new THREE.BoxGeometry(depth, height, height);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        super(geometry, material);
        this.position.x = pos.x;
        this.position.z = pos.z;
        this.position.y = height / 2;
        this.width = width;

        scene.add(this);
    }
}