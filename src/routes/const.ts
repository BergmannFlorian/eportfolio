import { color, depth } from "three/tsl";
import { Position2, Size } from "./helpers";

export const PLAYER = {
    pos: new Position2(0, 0),
    size: new Size(1, 2),
    speed: {
        walk: 0.2,
        sprint: 0.5,
    }
}

export const COLORS = {
    white: 0xffffff,
    black: 0x000000,
    gray: 0x858585,
    lightYellow: 0xfff0cf,
    lightGray: 0xebebeb,
    lightBlue: 0xc4efff,
}

export const SCENE = {
    floor: {
        color: COLORS.gray,
        size: new Size(500, 500)
    }
}

export const BUILDING = {
    size: new Size(20, 7),
    wall: {
        depth: 0.5
    },
    colors: {
        front: COLORS.white,
        back: COLORS.black,
    },
    window: {
        size: new Size(2.5, 1.5),
        height: PLAYER.size.height
    },
    door: {
        size: new Size(PLAYER.size.width * 4, PLAYER.size.height + 1),
        height: 0
    }
}