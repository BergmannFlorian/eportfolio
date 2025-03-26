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

export class Wall extends THREE.Mesh {
    constructor(pos: THREE.Vector3) {
        const door = {
            width: 3,
            height: 2.5
        }
        const window = {
            width: 2,
            height: 1.5
        }
        const wall = {
            width: 3,
            height: 1,
        }

        let x = pos.x;
        let y = pos.y;

        const tiltWallShape = new THREE.Shape()
            .moveTo(pos.x, pos.y)
            .lineTo(x += wall.width, y)

            .lineTo(x, y += wall.height + window.height)
            .lineTo(x += window.width, y)
            .lineTo(x, y -= window.height)
            .lineTo(x -= window.width, y)
            .lineTo(x, y -= wall.height)
            .lineTo(x += window.width, y)

            .lineTo(x += wall.width, y)
            .lineTo(x, y += door.height)
            .lineTo(x += door.width, y)
            .lineTo(x, y -= door.height)
            .lineTo(x += wall.width, y)

            .lineTo(x, y += wall.height + window.height)
            .lineTo(x += window.width, y)
            .lineTo(x, y -= window.height)
            .lineTo(x -= window.width, y)
            .lineTo(x, y -= wall.height)
            .lineTo(x += window.width, y)

            .lineTo(x += wall.width, y)
            .lineTo(x, y += wall.height + window.height + wall.height)
            .lineTo(pos.x, y)

            .lineTo(pos.x, pos.y);
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
        this.position.z = -2;
    }
}