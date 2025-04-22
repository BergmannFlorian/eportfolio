import * as THREE from 'three'

export interface Options {
    delta: number,         // coefficient of movement
    moveSpeed: number,     // speed of movement
    rotationSpeed: number, // coefficient of rotation
    maxPitch: number       // max camera pitch angle
}

export default class TouchControls {
    container: HTMLElement
    config: Options
    fpsBody: THREE.Object3D
    mouse: THREE.Vector2
    enabled: boolean = true
    #rotationMatrices: THREE.Matrix4[]
    #velocity: THREE.Vector3
    #cameraHolder: THREE.Object3D
    #maxPitch: number
    #isRightMouseDown: boolean = false
    moveForward: boolean = false
    moveBackward: boolean = false
    moveLeft: boolean = false
    moveRight: boolean = false
    #ztouch = 1
    #xtouch = 1
    #keys = {
        up: ["KeyW", "KeyZ", "ArrowUp"],
        down: ["KeyS", "ArrowDown"],
        right: ["KeyA", "KeyQ", "ArrowLeft"],
        left: ["KeyD", "ArrowRight"],
        switch: ["Enter", "	Space"],
    }

    constructor(container: HTMLElement, camera: THREE.Camera, scene: THREE.Scene, options: Options = {
        delta: 0.75,
        moveSpeed: 0.5,
        rotationSpeed: 0.002,
        maxPitch: 55,
    }) {
        this.container = container
        this.config = options

        this.#rotationMatrices = []
        this.#maxPitch = this.config.maxPitch * Math.PI / 180
        this.#velocity = new THREE.Vector3(0, 0, 0)
        this.mouse = new THREE.Vector2()

        this.#cameraHolder = new THREE.Object3D()
        this.#cameraHolder.name = 'cameraHolder'
        this.#cameraHolder.add(camera)

        this.fpsBody = new THREE.Object3D()
        this.fpsBody.add(this.#cameraHolder)

        this.container.addEventListener('contextmenu', (event) => { event.preventDefault() })
        this.container.addEventListener('mousedown', (event) => this.onMouseDown(event))
        this.container.addEventListener('mouseup', (event) => this.onMouseUp(event))

        document.addEventListener('keydown', (event) => this.onKey(event, true))
        document.addEventListener('keyup', (event) => this.onKey(event, false))
        document.addEventListener('mousemove', (event) => this.onMouseMove(event))
        document.addEventListener('mouseout', (event) => this.onMouseOut(event))

        this.#prepareRotationMatrices()

        scene.add(this.fpsBody)
    }

    onMouseDown(event: MouseEvent) {
        if (this.enabled && event.button === 2) {
            this.#isRightMouseDown = true
            event.preventDefault()
            event.stopPropagation()
        }
    }

    onMouseUp(event: MouseEvent) {
        if (this.enabled && event.button === 2) {
            this.#isRightMouseDown = false
        }
    }

    onMouseMove(event: MouseEvent) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

        if (!this.enabled || !this.#isRightMouseDown)
            return

        let movementX = event.movementX || 0
        let movementY = event.movementY || 0
        let rotation = this.#calculateCameraRotation(-1 * movementX, -1 * movementY)

        this.setRotation(rotation.rx, rotation.ry)
    }

    onMouseOut(e: MouseEvent) {
        this.#isRightMouseDown = false
    }

    isOneOfKeysPressed(keys: string[], code: string) {
        return keys.includes(code);
    }

    onKey(e: KeyboardEvent, pressed: boolean) {
        if (!this.enabled)
            return

        if (this.isOneOfKeysPressed(this.#keys.up, e.code)) {
            this.moveForward = pressed;
        }
        if (this.isOneOfKeysPressed(this.#keys.down, e.code)) {
            this.moveBackward = pressed;
        }
        if (this.isOneOfKeysPressed(this.#keys.right, e.code)) {
            this.moveRight = pressed;
        }
        if (this.isOneOfKeysPressed(this.#keys.left, e.code)) {
            this.moveLeft = pressed;
        }
    }

    #prepareRotationMatrices() {
        let rotationMatrixF = new THREE.Matrix4()
        rotationMatrixF.makeRotationY(0)
        this.#rotationMatrices.push(rotationMatrixF)

        let rotationMatrixB = new THREE.Matrix4()
        rotationMatrixB.makeRotationY(180 * Math.PI / 180)
        this.#rotationMatrices.push(rotationMatrixB)

        let rotationMatrixL = new THREE.Matrix4()
        rotationMatrixL.makeRotationY(90 * Math.PI / 180)
        this.#rotationMatrices.push(rotationMatrixL)

        let rotationMatrixR = new THREE.Matrix4()
        rotationMatrixR.makeRotationY((360 - 90) * Math.PI / 180)
        this.#rotationMatrices.push(rotationMatrixR)
    }

    #calculateCameraRotation(dx: number, dy: number, factor: number | null = null) {
        let rFactor = factor ? factor : this.config.rotationSpeed
        let ry = this.fpsBody.rotation.y - (dx * rFactor)
        let rx = this.#cameraHolder.rotation.x - (dy * rFactor)
        rx = Math.max(-this.#maxPitch, Math.min(this.#maxPitch, rx))

        return {
            rx: rx,
            ry: ry
        }
    }

    update() {
        this.#velocity.x += (-1 * this.#velocity.x) * this.config.delta
        this.#velocity.z += (-1 * this.#velocity.z) * this.config.delta

        if (this.moveForward) {
            this.#velocity.z -= this.#ztouch * this.config.moveSpeed * this.config.delta
        }
        if (this.moveBackward) {
            this.#velocity.z += this.#ztouch * this.config.moveSpeed * this.config.delta
        }
        if (this.moveLeft) {
            this.#velocity.x += this.#xtouch * this.config.moveSpeed * this.config.delta
        }
        if (this.moveRight) {
            this.#velocity.x -= this.#xtouch * this.config.moveSpeed * this.config.delta
        }

        this.fpsBody.translateX(this.#velocity.x)
        this.fpsBody.translateY(this.#velocity.y)
        this.fpsBody.translateZ(this.#velocity.z)
    }

    getDirection2(v: THREE.Vector3) {
        let direction = new THREE.Vector3(0, 0, -1)
        let rotation = new THREE.Euler(0, 0, 0, 'YXZ')
        let rx = this.#cameraHolder.rotation.x
        let ry = this.fpsBody.rotation.y

        rotation.set(rx, ry, 0)
        v.copy(direction).applyEuler(rotation)
        return v
    }

    getDirection() {
        let rx = 0
        let ry = 0
        let direction = new THREE.Vector3(0, 0, -1)
        let rotation = new THREE.Euler(0, 0, 0, 'YXZ')

        if (self != undefined) {
            rx = this.#cameraHolder.rotation.x
            ry = this.fpsBody.rotation.y
            console.log(rx, ry)
        }
        return (v: THREE.Vector3) => {
            rotation.set(rx, ry, 0)
            v.copy(direction).applyEuler(rotation)
            return v
        }
    }

    setPosition(x: number, y: number, z: number) {
        this.fpsBody.position.set(x, y, z)
    }

    stopMouseMoving() {
        this.#isRightMouseDown = false
    }

    setRotation(x: number, y: number) {
        if (x !== null)
            this.#cameraHolder.rotation.x = x

        if (y !== null)
            this.fpsBody.rotation.y = y
    }
}