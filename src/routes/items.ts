import * as THREE from "three";
import type { Job } from "./interfaces";
import { getBoxSize, HelpPoint, Position3, Size2, stringToDate } from "./helpers";
import { Text } from "./font";
import { BUILDING, COLORS, DIRECTIONS, FONTS, PLAYER } from "./const";
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
    constructor(private job: Job, pos: Position3, scene: THREE.Scene) {
        super();

        let start = stringToDate(job.start)
        let end = stringToDate(job.end);
        let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);

        this.add(
            new Building(pos, Math.ceil(diff) * 2),
            new Text(job.title, FONTS.title1, BUILDING.size.width, new Position3(pos.x + BUILDING.size.width / 2, BUILDING.door.size.height + 3.2, pos.z - 0.1), true),
            new Text(job.company, FONTS.title2, BUILDING.size.width, new Position3(pos.x + BUILDING.size.width / 2, BUILDING.door.size.height + 2, pos.z - 0.1), true),
            new Text(`${job.start} - ${job.end}`, FONTS.title3, BUILDING.size.width, new Position3(pos.x + BUILDING.size.width / 2, BUILDING.door.size.height + 1, pos.z - 0.1), true),
            new Tasks(job.tasks, new Position3(pos.x + BUILDING.size.width - BUILDING.wall.depth * 2, pos.y, pos.z + BUILDING.wall.depth * 2), DIRECTIONS.north),
        );

        scene.add(this);
    }

    get width(): number {
        return getBoxSize(this).width;
    }
}

export class Tasks extends THREE.Group {
    width: number = 7
    border: number = 0.5;
    constructor(tasks: string[], pos: Position3, direction: number) {
        super()
        let y = pos.y;

        tasks.reverse().forEach(task => {
            const text = new Text(task, FONTS.standard, this.width, new Position3(this.width / 2, y, 0), false, COLORS.white)
            y += text.height + FONTS.standard.spacing * 2;
            this.add(text);
        });

        const taskWall = new THREE.Mesh(
            new THREE.BoxGeometry(this.width + this.border * 2, y + this.border, BUILDING.wall.depth),
            new THREE.MeshBasicMaterial({ color: COLORS.black }),
        );
        taskWall.position.add(new THREE.Vector3(0, y / 2, BUILDING.wall.depth / 2 + 0.01));
        this.add(taskWall);

        this.rotateY(direction);

        this.position.add(pos);
        this.position.z += this.width / 2;
    }
}