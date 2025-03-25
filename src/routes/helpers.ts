import * as THREE from "three";

export class Helpers {
    constructor(scene: THREE.Scene) {
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);
    }
}