import * as THREE from "three";
import type { Job } from "./interfaces";
import { HelpPoint, Position3, stringToDate } from "./helpers";
import { Text } from "./font";
import { BUILDING, COLORS, PLAYER } from "./const";
import { Building } from "./buildings";

export class Floor extends THREE.Mesh {
    constructor(scene: THREE.Scene) {
        const floorGeometry = new THREE.PlaneGeometry(500, 500); // Width and height of the plane
        const floorMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.gray,
            side: THREE.DoubleSide,
        });
        super(floorGeometry, floorMaterial)
        this.position.y = -0.01;
        this.rotation.x = Math.PI / 2;
        scene.add(this);
    }
}

export class Player extends THREE.Mesh {
    constructor(scene: THREE.Scene) {
        const geometry = new THREE.BoxGeometry(PLAYER.size.width, PLAYER.size.height, PLAYER.size.width);
        const material = new THREE.MeshBasicMaterial({ color: COLORS.white });
        const materialFront = new THREE.MeshBasicMaterial({ color: COLORS.black });
        super(geometry, [materialFront, material, material, material, material, material]);
        this.position.set(PLAYER.pos.x, PLAYER.pos.y + PLAYER.size.height / 2, PLAYER.pos.y);

        new LinesBox(geometry, this);

        scene.add(this);
    }

    move(movement: THREE.Vector3) {
        this.position.x += movement.x;
        this.position.z += movement.z;
        if (movement.length() != 0) {
            this.rotation.y = -new THREE.Vector2(movement.x, movement.z).angle();
        }
    }
}

export class LinesBox extends THREE.LineSegments {
    constructor(box: THREE.BoxGeometry, mesh: THREE.Mesh, color: THREE.ColorRepresentation = COLORS.black) {
        super(
            new THREE.EdgesGeometry(box),
            new THREE.LineBasicMaterial({ color: color }),
        );
        mesh.add(this);
    }
}

export class Experience extends THREE.Group {
    width: number;

    constructor(private job: Job, pos: Position3) {
        super();

        let start = stringToDate(job.start)
        let end = stringToDate(job.end);
        let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);

        let height = diff * 10 + 5;

        const building = new Building(pos, 5);
        const companyTxt = new Text(job.company, 1, new Position3(pos.x + BUILDING.size.width / 2, BUILDING.door.height + 1, pos.z));

        this.width = BUILDING.size.width;

        this.add(building, companyTxt)
    }
}