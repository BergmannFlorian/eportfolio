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

export class Size {
    width: number;
    height: number;
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
}

export class Position2 {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    toV2() {
        return new THREE.Vector2(this.x, this.y);
    }
    toV3() {
        return new THREE.Vector3(this.x, this.y, 0);
    }
}

export class Position3 extends Position2 {
    z: number;
    constructor(x: number, y: number, z: number) {
        super(x, y);
        this.z = z;
    }

    toV3() {
        return new THREE.Vector3(this.x, this.y, this.z);
    }
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

export function fillText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number, pos: Position2) {
    var words = text.split(" ");
    var currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
        var word = words[i];
        var width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            ctx.fillText(currentLine, pos.x, pos.y)
            pos.y += lineHeight;
            currentLine = word;
        }
        ctx.fillText(currentLine, pos.x, pos.y)
    }
}