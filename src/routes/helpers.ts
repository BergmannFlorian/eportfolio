import * as THREE from "three";

export class Helpers {
    constructor(scene: THREE.Scene) {
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);
    }
}

export function stringToDate(date: string): Date {
    let dateParts = date.split('.');
    return new Date(`${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`);
}

export class HelpPoint extends THREE.Mesh {
    constructor(pos: THREE.Vector3, scene: THREE.Mesh) {
        const geometry = new THREE.SphereGeometry(0.5, 32, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xc70000 });

        super(geometry, material);

        this.position.fromArray([...pos])
        scene.add(this);
    }
}