import { Position2, Position3, Size2 } from "./helpers";
import type { Font } from "./interfaces";

export const CONTROLS = {
    mode: {
        fly: 0,
        fps: 1
    }
}

export const PLAYER = {
    pos: new Position2(0, 0),
    size: new Size2(1, 2),
    speed: {
        walk: 0.2,
        sprint: 0.5,
    }
}

export const CAMERA = {
    fly: {
        position: new Position3(0, 10, -15),
    },
    fps: {
        position: new Position3(0, PLAYER.size.height / 2, 0),
    }
}

export const COLORS = {
    black: 0x000000,
    gray: 0x858585,
    lightBlue: 0xc4efff,
    lightGray: 0xebebeb,
    lightYellow: 0xfff0cf,
    red: 0xc70000,
    white: 0xffffff,
}

export const SCENE = {
    floor: {
        color: COLORS.gray,
        size: new Size2(500, 500)
    }
}

export const BUILDING = {
    size: new Size2(20, 7),
    wall: {
        depth: 0.5
    },
    colors: {
        front: COLORS.white,
        back: COLORS.black,
    },
    window: {
        size: new Size2(2.5, 1.5),
        height: PLAYER.size.height
    },
    door: {
        size: new Size2(PLAYER.size.width * 4, PLAYER.size.height + 1)
    }
}

export const FONTS = {
    name: 'Arial_Regular',
    title1: {
        size: 1,
        depth: 0.1,
        spacing: 0.1,
    } as Font,
    title2: {
        size: 0.8,
        depth: 0.1,
        spacing: 0.1,
    } as Font,
    title3: {
        size: 0.5,
        depth: 0.1,
        spacing: 0.1,
    } as Font,
    standard: {
        size: 0.2,
        depth: 0,
        spacing: 0.05
    } as Font,
}