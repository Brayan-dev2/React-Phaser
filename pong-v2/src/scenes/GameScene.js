import Phaser from 'phaser'
import Paddle from '../objects/Paddle'
import Ball   from '../objects/Ball'

export default class GameScene extends Phaser.Scene {
  constructor() { super('Game') }

  create() {
    const { width: W, height: H } = this.cameras.main

    // Fundo
    this.add.rectangle(W/2, H/2, W, H, 0x1a1a2e)

    // Criar raquetes e bola
    this.player = new Paddle(this, 40, H/2, 0x5599ee)   // azul
    this.enemy  = new Paddle(this, W - 40, H/2, 0xee5555) // vermelho
    this.ball   = new Ball(this, W/2, H/2)

    // Registrar colisões: bola ↔ raquetes
    this.physics.add.collider(
      this.ball.sprite, this.player.sprite,
      this.onHit, null, this
    )
    this.physics.add.collider(
      this.ball.sprite, this.enemy.sprite,
      this.onHit, null, this
    )

    // Ajusta colisões com os limites do mundo: desativa left/right
    // para permitir que a bola saia pelas laterais e registre pontos,
    // mas mantém colisão com topo/rodapé.
    this.physics.world.setBoundsCollision(false, false, true, true)

    // Teclas de seta + WASD
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd    = this.input.keyboard.addKeys({ up: 'W', down: 'S' })

    // Placar
    this.pScore = 0
    this.eScore = 0
    this.scoreText = this.add.text(W/2, 28, '0  :  0', {
      fontSize: '28px', fontFamily: 'monospace', color: '#ffffff'
    }).setOrigin(0.5)

    // Lançar bola após 1.2s
    this.time.delayedCall(1200, () => this.ball.launch())
  }

  // Chamado a cada colisão bola ↔ raquete
  onHit(ball, paddle) {
    const v   = ball.body.velocity
    const spd = Math.min(
      Math.sqrt(v.x*v.x + v.y*v.y) * 1.06, // +6% a cada rebatida
      520                                      // velocidade máxima
    )
    const ang = Math.atan2(v.y, v.x)
    ball.body.setVelocity(Math.cos(ang)*spd, Math.sin(ang)*spd)

    // Efeito visual: pop de escala e mudança de cor conforme velocidade
    // `ball` aqui é o GameObject (circle). Usamos tween para 'pop'.
    try {
      // pop rápido
      this.tweens.add({
        targets: ball,
        scale: 1.25,
        duration: 60,
        yoyo: true,
        ease: 'Power1'
      })

      // cor baseada na velocidade
      let color = 0xffffff
      if (spd > 440) color = 0xff4444
      else if (spd > 380) color = 0xffcc66
      else if (spd > 320) color = 0xffff88
      // circle usa setFillStyle
      if (typeof ball.setFillStyle === 'function') ball.setFillStyle(color)

      // Efeito visual simples de colisão: círculo breve de foco
      const effect = this.add.circle(ball.x, ball.y, 14, 0xffffff, 0.22).setDepth(5)
      this.tweens.add({
        targets: effect,
        alpha: 0,
        scale: 1.8,
        duration: 140,
        ease: 'Quad.easeOut',
        onComplete: () => effect.destroy()
      })
    } catch (e) {
      // se algo falhar, não quebramos a física
      // console.warn(e)
    }
  }

  update() {
    const W = this.cameras.main.width

    // Controle do jogador
    if (this.cursors.up.isDown   || this.wasd.up.isDown)
      this.player.moveUp()
    else if (this.cursors.down.isDown || this.wasd.down.isDown)
      this.player.moveDown()
    else
      this.player.stop()

    // IA: segue a bola com velocidade limitada
    const diff = this.ball.sprite.y - this.enemy.sprite.y
    if      (diff >  6) this.enemy.moveDown()
    else if (diff < -6) this.enemy.moveUp()
    else                this.enemy.stop()

    // Verificar ponto (bola saiu pela lateral)
    if (this.ball.sprite.x < -15)  this.addPoint('enemy')
    if (this.ball.sprite.x > W+15)  this.addPoint('player')
  }

  addPoint(who) {
    if (who === 'player') this.pScore++
    else                   this.eScore++

    this.scoreText.setText(this.pScore + '  :  ' + this.eScore)

    const { width: W, height: H } = this.cameras.main
    this.ball.reset(W/2, H/2)

    // Verifica vitória (primeiro a 5)
    if (this.pScore >= 5 || this.eScore >= 5) {
      this.showGameOver()
      return
    }

    // Próximo ponto após 1.1s
    this.time.delayedCall(1100, () => this.ball.launch())
  }

  showGameOver() {
    const { width: W, height: H } = this.cameras.main
    const won = this.pScore >= 5

    this.add.text(W/2, H/2,
      won ? 'Você ganhou!' : 'CPU ganhou!', {
      fontSize: '36px', fontFamily: 'monospace',
      color: won ? '#66ff88' : '#ff6666'
    }).setOrigin(0.5)

    this.add.text(W/2, H/2 + 50,
      'ESPAÇO = jogar de novo  |  ESC = menu', {
      fontSize: '13px', fontFamily: 'monospace',
      color: '#aaaaaa'
    }).setOrigin(0.5)

    this.input.keyboard
      .addKey('SPACE').on('down', () => this.scene.restart())
    this.input.keyboard
      .addKey('ESC').on('down', () => this.scene.start('Menu'))
  }
}