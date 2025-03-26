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