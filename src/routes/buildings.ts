import * as THREE from "three";
import { LinesBox } from "./items";

export class Building extends THREE.Group {
    heightByFloor: number = 2;

    constructor(width: number, height: number, depth: number) {
        super();
        let nbFloors = Math.floor(height / this.heightByFloor);
        nbFloors = nbFloors < 2 ? 0 : nbFloors - this.heightByFloor;

        const x = 0, y = 0;

        const heartShape = new THREE.Shape();

        heartShape.moveTo(x + 5, y + 5);
        heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
        heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
        heartShape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
        heartShape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
        heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
        heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);

        const geometry = new THREE.ShapeGeometry(heartShape);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const mesh = new THREE.Mesh(geometry, material);
        this.add(mesh);

        // const geometry = new THREE.BoxGeometry(width, height, depth);
        // const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        // super(geometry, material);

        // new LinesBox(geometry, this);
    }
}

class Ground extends THREE.Mesh {

}

class Floor extends THREE.Mesh {

}

class SquareHole extends THREE.Path {
    constructor(pos: THREE.Vector2, size: THREE.Vector2) {
        super();
        this.moveTo(pos.x, pos.y)
            .lineTo(pos.x + size.x, pos.y)
            .lineTo(pos.x + size.x, pos.y + size.y)
            .lineTo(pos.x, pos.y + size.y)
            .lineTo(pos.x, pos.y);
    }
}

class Window extends SquareHole {
    constructor(pos: THREE.Vector2, size: THREE.Vector2 | null = null) {
        size ||= new THREE.Vector2(2, 1);
        let x = pos.x - size.x / 2;
        let y = size.y - size.y / 2;
        super(new THREE.Vector2(x, y), size);
    }
}

class Door extends SquareHole {
    constructor(pos: THREE.Vector2, size: THREE.Vector2 | null = null) {
        size ||= new THREE.Vector2(3, 2);
        let x = pos.x - size.x / 2;
        let y = 0;
        super(new THREE.Vector2(x, y), size)
    }
}

export class Wall extends THREE.Mesh {
    width: number = 15;
    height: number = 5;

    constructor(pos: THREE.Vector3, withDoor: boolean = false) {
        const width = 15;
        const height = 5;

        const tiltWallShape = new THREE.Shape()
            .moveTo(pos.x, pos.y)
            .lineTo(pos.x + width, pos.y)
            .lineTo(pos.x + width, pos.y + height)
            .lineTo(pos.x, pos.y + height)
            .lineTo(pos.x, pos.y);

        const windo = new Window(new THREE.Vector2(width / 4, height / 2));
        const door = new Door(new THREE.Vector2(width / 2, 0));

        tiltWallShape.holes.push(windo, door);

        const tiltWallGeometry = new THREE.ExtrudeGeometry(
            [tiltWallShape],
            {
                steps: 1,
                depth: 0.5,
                bevelEnabled: false,
                curveSegments: 32,
            },
        );
        super(
            tiltWallGeometry,
            new THREE.MeshStandardMaterial({ color: 0xff9999 }),
        );

        this.position.add(pos);
    }
}