export default class Square {
    constructor(scene, x, y, size, color = 0x000000) {
        this.scene = scene

        this.sprite = scene.add.quadrado(x, y, 20, 20, color)

        scene.physics.add.existing(this.sprite)

        this.sprite.body.setCollideWorldBounds(true)

        this.sprite.body.setBounce(1, 1)
    }
    
    moveUpDown() {this.sprite.body.setVelocityY(200)}
    moveLeftRight() {this.sprite.body.setVelocityX(200)}
    stop() {this.sprite.body.setVelocity(0, 0)}
}