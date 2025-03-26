import * as THREE from "three";
import type { Job } from "./interfaces";
import { stringToDate } from "./helpers";
import { Text } from "./font";

export class Floor extends THREE.Mesh {
    constructor(scene: THREE.Scene) {
        const floorGeometry = new THREE.PlaneGeometry(500, 500); // Width and height of the plane
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
        const materialFront = new THREE.MeshBasicMaterial({ color: 0x000000 });
        super(geometry, [materialFront, material, material, material, material, material]);
        this.position.y = 1;
        this.position.z = 1;

        new LinesBox(geometry, this);

        const arrowHelper = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 1, 0),
            1,
            0x000000,
        );
        this.add(arrowHelper);

        scene.add(this);
    }

    move(movement: THREE.Vector3) {
        this.position.x += movement.x;
        this.position.z += movement.z;
        if (movement.length() != 0) {
            this.rotation.y = -new THREE.Vector2(movement.x, movement.z).angle();
        }
    }
}

class LinesBox extends THREE.LineSegments {
    constructor(box: THREE.BoxGeometry, mesh: THREE.Mesh, color: THREE.ColorRepresentation = 0x00000) {
        super(
            new THREE.EdgesGeometry(box),
            new THREE.LineBasicMaterial({ color: color }),
        );
        mesh.add(this);
    }
}

export class Experience extends THREE.Mesh {
    width: number;

    constructor(
        private job: Job,
        pos: THREE.Vector3,
        scene: THREE.Scene
    ) {
        let start = stringToDate(job.start)
        let end = stringToDate(job.end);
        let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);

        let height = diff * 10 + 5;
        let width = height / 2 + 5;
        let depth = width / 2;

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        super(geometry, material);
        this.position.x = pos.x + width / 2;
        this.position.z = pos.z + depth / 2;
        this.position.y = height / 2;
        this.width = width;

        new LinesBox(geometry, this);

        const companyTxt = new Text(job.company, 1, new THREE.Vector3(0, 0, -depth / 2), this);

        scene.add(this);
    }
}