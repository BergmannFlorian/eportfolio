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

        const building = new Building(pos, Math.ceil(diff) * 2);
        const JobTxt = new Text(job.title, 1, new Position3(pos.x + BUILDING.size.width / 2, BUILDING.door.size.height + 3, pos.z));
        const companyTxt = new Text(job.company, 1, new Position3(pos.x + BUILDING.size.width / 2, BUILDING.door.size.height + 1, pos.z));

        this.width = BUILDING.size.width;

        this.add(building, JobTxt, companyTxt)
    }
}