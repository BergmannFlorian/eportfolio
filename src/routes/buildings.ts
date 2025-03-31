import * as THREE from "three";
import { Position2, Position3, Size } from "./helpers";
import { color } from "three/tsl";

export class Building extends THREE.Group {

    constructor(pos: Position3, nbFloors: number = 1) {
        super();
        for (let f = 0; f < nbFloors; f++) {
            const floor = new Floor(f, pos);
            this.add(floor);
        }
    }
}

class Ground extends THREE.Mesh {

}

class Floor extends THREE.Group {
    size: Size;
    floor: number;

    constructor(floor: number = 0, pos: Position3) {
        super()
        this.size = new Size(20, 5);
        this.floor = floor * this.size.height;

        const south = new Wall(new Position3(pos.x, this.floor, pos.y), 0, this.size, !floor);
        const est = new Wall(new Position3(pos.x + this.size.width, this.floor, pos.y), Math.PI / 2, this.size);
        const north = new Wall(new Position3(pos.x + this.size.width, this.floor, pos.y + this.size.width), Math.PI, this.size);
        const west = new Wall(new Position3(pos.x + 0, this.floor, pos.y + this.size.width), Math.PI * 1.5, this.size);

        this.add(south, est, north, west);
        // this.add(south);
    }
}

class SquareHole extends THREE.Path {
    constructor(pos: Position2, size: Size) {
        super();
        this.moveTo(pos.x, pos.y)
            .lineTo(pos.x + size.width, pos.y)
            .lineTo(pos.x + size.width, pos.y + size.height)
            .lineTo(pos.x, pos.y + size.height)
            .lineTo(pos.x, pos.y);
    }
}

class Window extends SquareHole {
    constructor(pos: Position2, size: Size | null = null) {
        size ||= new Size(2.5, 1.5);
        let x = pos.x - size.width / 2;
        let y = pos.y - size.height / 2;
        super(new Position2(x, y), size);
    }
}

class Door extends SquareHole {
    constructor(pos: Position2, size: Size | null = null) {
        size ||= new THREE.Vector2(4, 2.5);
        let x = pos.x - size.width / 2;
        let y = 0;
        super(new Position2(x, y), size)
    }
}

export class Wall extends THREE.Mesh {
    constructor(pos: Position3, angle: number, size: Size, withDoor: boolean = false, color: THREE.ColorRepresentation = 0x000000) {
        let x = 0;
        let y = 0;
        const tiltWallShape = new THREE.Shape()
            .moveTo(x, y)
            .lineTo(x += size.width, y)
            .lineTo(x, y += size.height)
            .lineTo(x -= size.width, y)
            .lineTo(x, y);

        const windowR = new Window(new Position2(size.width / 5, size.height / 2));
        const windowL = new Window(new Position2((size.width / 5) * 4, size.height / 2));
        tiltWallShape.holes.push(windowR, windowL);

        if (withDoor) {
            const door = new Door(new Position2(size.width / 2, 0));
            tiltWallShape.holes.push(door);
        } else {
            const windowC = new Window(new Position2(size.width / 2, size.height / 2));
            tiltWallShape.holes.push(windowC);
        }

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
            new THREE.MeshBasicMaterial({ color: color }),
        );

        this.rotateY(-angle);
        this.position.add(pos);
    }
}