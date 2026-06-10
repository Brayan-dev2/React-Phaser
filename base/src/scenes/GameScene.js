import * as Phaser from 'phaser'
import Square from '../objects/square'

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('Game')
    }

    preload() {
        // Load assets here
    }

    create() {
        // Create game objects here
        const {width: W, height: H} = this.cameras.main
        this.add.quadrado(W/2, H/2, 50, 50, 0xff0000)

        this.Quadrado1 = new quadrado(this, W/2 - 100, H/2, 20, 0x00ff00)

        this.physics.add.collider(this.Quadrado1.sprite, this.Quadrado1.sprite)
        this.onHit, null, this
    }

    update() {
        // Update game logic here
    }
}