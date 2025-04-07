import * as THREE from "three";
import { COLORS } from "./const";

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

export class Light extends THREE.Group {
    constructor(scene: THREE.Scene) {
        super();

        const dirLight = new THREE.DirectionalLight(COLORS.white, 1.0);
        dirLight.position.set(4, 4, 8);
        dirLight.castShadow = true;
        this.add(dirLight);

        const AmbLight = new THREE.AmbientLight(COLORS.white); // soft white light

        this.add(AmbLight);

        scene.add(this);
    }
}