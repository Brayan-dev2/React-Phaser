export default class Paddle {
  constructor(scene, x, y, color = 0xffffff) {
    this.scene = scene

    // Cria um retângulo de 16x100 pixels
    this.sprite = scene.add.rectangle(x, y, 16, 100, color)

    // Adiciona física arcade ao retângulo existente
    scene.physics.add.existing(this.sprite)

    // Imóvel: a raquete não é empurrada quando a bola bate
    this.sprite.body.setImmovable(true)

    // Não sai da tela
    this.sprite.body.setCollideWorldBounds(true)
  }

  moveUp()   { this.sprite.body.setVelocityY(-350) }
  moveDown() { this.sprite.body.setVelocityY(350) }
  stop()     { this.sprite.body.setVelocityY(0) }
}