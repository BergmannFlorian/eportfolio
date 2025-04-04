import * as THREE from "three";
import { Font as ThreeFont, FontLoader, TextGeometry } from "three/examples/jsm/Addons.js";
import { fillText, getBox, getBoxSize, getCenter, HelpPoint, Position2, type Position3 } from "./helpers";
import { COLORS, FONTS } from "./const";
import type { Font as IFont } from "./interfaces";
import { LinesBox } from "./items";

let threeFont: ThreeFont;

export async function loadFont() {
    const loader = new FontLoader();
    threeFont = await loader.loadAsync(`fonts/${FONTS.name}.json`);
}

export class Text extends THREE.Group {
    height: number = 0;
    texts: THREE.Mesh[] = [];
    constructor(text: string, font: IFont, maxWidth: number, position: Position3, center: boolean = false) {
        super();

        const textGeoParams = {
            font: threeFont,
            size: font.size,
            depth: font.depth,
            curveSegments: 12,
            bevelEnabled: false,
            bevelThickness: 1,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 5
        }
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });

        let textGeo = new TextGeometry(text, textGeoParams);
        textGeo.computeBoundingBox();

        let textsGeo: TextGeometry[] = []
        textsGeo = [textGeo];

        if (textGeo.boundingBox && getBoxSize(textGeo).width > maxWidth) {
            const words = text.split(" ");
            let currentLine = "";
            const lines: TextGeometry[] = [];

            if (words.every((word, index) => {
                let textGeoWraped = new TextGeometry(currentLine + ` ${word}`, textGeoParams);
                textGeoWraped.computeBoundingBox();
                if (!textGeoWraped.boundingBox) return false;
                if (getBoxSize(textGeoWraped).width > maxWidth) {
                    lines.push(new TextGeometry(currentLine.trim(), textGeoParams))
                    currentLine = word;
                } else {
                    currentLine += ` ${word}`;
                }
                if (index === words.length - 1) {
                    lines.push(new TextGeometry(currentLine.trim(), textGeoParams));
                }
                return true;
            })) {
                textsGeo = lines;
            }
        }

        textsGeo.forEach((geo, index) => {
            const text = new THREE.Mesh(geo, material);
            text.position.y = - this.height;

            const size = getBoxSize(text);
            this.height += size.height;

            if (center) {
                text.position.x -= size.width / 2;
            }

            this.add(new THREE.Box3Helper(getBox(text), COLORS.red));
            // this.add(new HelpPoint(text.position));

            this.add(text);
        })
        // this.add(new HelpPoint(this.position));

        this.position.y += this.height;
        this.position.add(position);

        this.rotateY(Math.PI);
    }
}

class TextCanevas {
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