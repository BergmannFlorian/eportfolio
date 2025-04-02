import * as THREE from "three";
import type { Job } from "./interfaces";
import { Position3, stringToDate } from "./helpers";
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
        this.width = BUILDING.size.width;

        let start = stringToDate(job.start)
        let end = stringToDate(job.end);
        let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);

        this.add(
            new Building(pos, Math.ceil(diff) * 2),
            new Text(job.title, 1, BUILDING.size.width, new Position3(pos.x + BUILDING.size.width / 2, BUILDING.door.size.height + 3, pos.z - 0.1)),
            new Text(job.company, 0.8, BUILDING.size.width, new Position3(pos.x + BUILDING.size.width / 2, BUILDING.door.size.height + 1.5, pos.z - 0.1)),
            new Text(`${job.start} - ${job.end}`, 0.5, BUILDING.size.width, new Position3(pos.x + BUILDING.size.width / 2, BUILDING.door.size.height + 1, pos.z - 0.1)),
            new Text(job.tasks.reduce((tasks, task) => `${tasks}- ${task}\n`), 0.2, 7, new Position3(pos.x + BUILDING.size.width / 2, 0, pos.z + BUILDING.size.width / 2))
        )
    }
}