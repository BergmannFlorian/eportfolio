import * as THREE from "three";
import { Font, FontLoader, TextGeometry } from "three/examples/jsm/Addons.js";
import { fillText, Position2, type Position3 } from "./helpers";
import { COLORS } from "./const";

let font: Font;

export async function loadFont() {
    const loader = new FontLoader();
    font = await loader.loadAsync('fonts/Arial_Regular.json');
}

export class Text extends THREE.Mesh {
    constructor(text: string, size: number, maxWidth: number, position: Position3) {
        const textGeoParams = {
            font: font,
            size: size,
            depth: 0,
            curveSegments: 12,
            bevelEnabled: false,
            bevelThickness: 1,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 5
        }

        let textGeo = new TextGeometry(text, textGeoParams);
        textGeo.computeBoundingBox();

        if (textGeo.boundingBox && textGeo.boundingBox.getSize(position.toV3()).x > maxWidth) {
            const words = text.split(" ");
            let currentLine = "";

            if (words.every(word => {
                let textGeoWraped = new TextGeometry(currentLine + ` ${word}`, textGeoParams);
                textGeoWraped.computeBoundingBox();
                if (!textGeoWraped.boundingBox) return false;
                if (textGeoWraped.boundingBox.getSize(position.toV3()).x > maxWidth) {
                    currentLine += `\n${word}`;
                } else {
                    currentLine += ` ${word}`;
                    position.y += size;
                }
                return true;
            })) {
                textGeo = new TextGeometry(currentLine, textGeoParams);
                textGeo.computeBoundingBox();
            }
        }

        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
        super(textGeo, material);

        const center = textGeo.boundingBox?.getCenter(new THREE.Vector3());
        this.position.add(position);
        if (center) {
            this.position.add(center);
        }

        this.rotateY(Math.PI);
    }
}

export class TextCanevas {
    constructor(text: string, scene: THREE.Scene) {
        const canvas = document.createElement("canvas");
        canvas.width = 10000;
        canvas.height = 10000;

        const context = canvas.getContext("2d");
        if (context) {
            context.font = "500px Arial";
            context.fillStyle = "white";
            fillText(context, text, 400, 500, new Position2(500, 200));
        }

        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture.generateMipmaps = false;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;

        const floorGeometry = new THREE.PlaneGeometry(4, 3);
        const floorMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            color: COLORS.white,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(floorGeometry, floorMaterial);
        mesh.position.set(2, 1, 20);
        mesh.rotateY(Math.PI);
        scene.add(mesh);
    }
}