import * as THREE from "three";
import { Font, FontLoader, TextGeometry } from "three/examples/jsm/Addons.js";

let font: Font;
let texts: TextGeometry[] = [];

export async function loadFont() {
    const loader = new FontLoader();
    font = await loader.loadAsync('font.json');
}

export class Text extends THREE.Mesh {
    constructor(text: string, size: number, position: THREE.Vector3, mesh: THREE.Mesh) {
        const textGeo = new TextGeometry(text, {
            font: font,
            size: size,
            depth: 0.1,
            curveSegments: 12,
            bevelEnabled: false,
            bevelThickness: 1,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 5
        })
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
        super(textGeo, material);
        this.position.set(position.x, position.y, position.z);
        this.rotateY(Math.PI);



        mesh.add(this);
    }
}