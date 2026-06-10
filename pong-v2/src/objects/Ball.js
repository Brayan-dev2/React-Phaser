import Phaser from 'phaser'
export default class Ball {
  constructor(scene, x, y) {
    this.scene = scene

    // Círculo branco com raio 10
    this.sprite = scene.add.circle(x, y, 10, 0xffffff)
    scene.physics.add.existing(this.sprite)

    // Referência circular para acessar instância a partir do sprite
    this.sprite.ballObj = this

    // Rebate nas bordas superior e inferior da tela
    this.sprite.body.setCollideWorldBounds(true)

    // Nota: não desativar `checkCollision.left/right` aqui —
    // isso também previne colisões com outras bodies (raquetes).
    // A colisão com as laterais será controlada via limites do mundo.

    // bounce(1,1) = sem perda de energia ao rebater
    this.sprite.body.setBounce(1, 1)

    // efeito visual simples: deixa a bola mais visível
    this.sprite.setDepth(1)

  }

  launch() {
    // Direção aleatória a cada lançamento
    const vx = Math.random() > 0.5 ? 240 : -240
    const vy = Phaser.Math.Between(-160, 160)
    this.sprite.body.setVelocity(vx, vy)
  }

  reset(cx, cy) {
    // Volta ao centro e para
    this.sprite.setPosition(cx, cy)
    this.sprite.body.setVelocity(0, 0)
  }
}
