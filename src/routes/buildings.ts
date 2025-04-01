import * as THREE from "three";
import { Position2, Position3, Size } from "./helpers";
import { BUILDING, COLORS } from "./const";

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
    constructor(origin: Position3) {
        const floorGeometry = new THREE.PlaneGeometry(BUILDING.size.width, BUILDING.size.width);
        const floorMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.lightGray,
            side: THREE.DoubleSide,
        });
        super(floorGeometry, floorMaterial);

        this.rotation.x = Math.PI / 2;
        this.position.set(origin.x + BUILDING.size.width / 2, origin.y, origin.z + BUILDING.size.width / 2)
    }
}

class Floor extends THREE.Group {
    size: Size;
    floor: number;

    constructor(floor: number, pos: Position3) {
        super()
        this.size = BUILDING.size;
        this.floor = floor * this.size.height + pos.y;

        const south = new Wall(new Position3(pos.x, this.floor, pos.z), 0, { withDoor: !floor });
        const est = new Wall(new Position3(pos.x + this.size.width, this.floor, pos.z), Math.PI / 2);
        const north = new Wall(new Position3(pos.x + this.size.width, this.floor, pos.z + this.size.width), Math.PI);
        const west = new Wall(new Position3(pos.x + 0, this.floor, pos.z + this.size.width), Math.PI * 1.5);

        const ground = new Ground(new Position3(pos.x, this.floor, pos.z));

        this.add(south, est, north, west, ground);
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
    constructor(pos: Position2, size: Size = BUILDING.window.size) {
        let x = pos.x - size.width / 2;
        let y = pos.y - size.height / 2;
        super(new Position2(x, y), size);
    }
}

class Glass extends THREE.Mesh {
    constructor(pos: Position2, size: Size = BUILDING.window.size) {
        const glassGeometry = new THREE.PlaneGeometry(BUILDING.window.size.width, BUILDING.window.size.height);
        const calizStella_mat = new THREE.MeshPhysicalMaterial({
            metalness: 1,
            roughness: 0,
            clearcoat: 1,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            color: COLORS.lightBlue,
        })

        super(glassGeometry, calizStella_mat);

        const pos3 = new Position3(pos.x, pos.y, BUILDING.wall.depth / 2)
        this.position.add(pos3);
    }
}

class Door extends SquareHole {
    constructor(pos: Position2, size: Size = BUILDING.door.size) {
        let x = pos.x - size.width / 2;
        let y = pos.y;
        super(new Position2(x, y), size)
    }
}

export class Wall extends THREE.Mesh {
    constructor(pos: Position3, angle: number, { size = BUILDING.size, withDoor = false } = {}) {
        let x = 0;
        let y = 0;
        const tiltWallShape = new THREE.Shape()
            .moveTo(x, y)
            .lineTo(x += size.width, y)
            .lineTo(x, y += size.height)
            .lineTo(x -= size.width, y)

        const windowRPos = new Position2(size.width / 5, BUILDING.window.height)
        const windowLPos = new Position2((size.width / 5) * 4, BUILDING.window.height);
        const windowCPos = new Position2(size.width / 2, BUILDING.window.height);

        const windowR = new Window(windowRPos);
        const windowL = new Window(windowLPos);

        tiltWallShape.holes.push(windowR, windowL);

        if (withDoor) {
            const door = new Door(new Position2(size.width / 2, 0));
            tiltWallShape.holes.push(door);
        } else {
            const windowC = new Window(windowCPos);
            tiltWallShape.holes.push(windowC);
        }

        const tiltWallGeometry = new THREE.ExtrudeGeometry(
            [tiltWallShape],
            {
                steps: 1,
                depth: BUILDING.wall.depth,
                curveSegments: 32,
                bevelEnabled: true,
                bevelThickness: 0.01,
                bevelSize: -0.01,
                bevelOffset: 0,
                bevelSegments: 3,
            },
        );

        super(
            tiltWallGeometry,
            // new THREE.MeshBasicMaterial({ vertexColors: true, color: BUILDING.colors.back, side: THREE.DoubleSide }),
            [
                new THREE.MeshBasicMaterial({ color: BUILDING.colors.front }),
                new THREE.MeshBasicMaterial({ color: BUILDING.colors.back }),
                new THREE.MeshBasicMaterial({ color: BUILDING.colors.front }),
            ]
        );

        const glassR = new Glass(windowRPos);
        const glassL = new Glass(windowLPos);
        this.add(glassR, glassL);

        if (!withDoor) {
            const glassC = new Glass(windowCPos);
            this.add(glassC);
        }

        this.rotateY(-angle);
        this.position.add(pos);
    }
}