import * as THREE from "three";
import type { Job } from "./interfaces";
import { HelpPoint, Position3, Size2, stringToDate } from "./helpers";
import { Text } from "./font";
import { BUILDING, COLORS, FONTS, PLAYER } from "./const";
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
    building: Building;
    texts: Text[];

    constructor(private job: Job, pos: Position3, scene: THREE.Scene) {
        super();

        let start = stringToDate(job.start)
        let end = stringToDate(job.end);
        let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);

        this.building = new Building(pos, Math.ceil(diff) * 2);

        this.texts = [
            new Text(job.title, FONTS.title1, BUILDING.size.width, new Position3(pos.x + BUILDING.size.width / 2, BUILDING.door.size.height + 3.2, pos.z - 0.1), true),
            new Text(job.company, FONTS.title2, BUILDING.size.width, new Position3(pos.x + BUILDING.size.width / 2, BUILDING.door.size.height + 2, pos.z - 0.1), true),
            new Text(`${job.start} - ${job.end}`, FONTS.title3, BUILDING.size.width, new Position3(pos.x + BUILDING.size.width / 2, BUILDING.door.size.height + 1, pos.z - 0.1), true),
        ]

        let currentHeight = pos.y;
        job.tasks.reverse().forEach(task => {
            const text = new Text(task, FONTS.standard, 7, new Position3(pos.x + BUILDING.size.width / 2, currentHeight, pos.z + BUILDING.size.width / 2))
            currentHeight += text.height;
            this.texts.push(text);
        });

        this.add(this.building, ...this.texts);

        scene.add(this);
    }

    get width(): number {
        return BUILDING.size.width;
    }
}