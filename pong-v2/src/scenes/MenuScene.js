import Phaser from 'phaser'
export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu') }

  create() {
    const { width: W, height: H } = this.cameras.main

    // Fundo escuro
    this.add.rectangle(W/2, H/2, W, H, 0x1a1a2e)

    // Linha central pontilhada
    for (let y = 0; y < H; y += 30) {
      this.add.rectangle(W/2, y + 10, 4, 18, 0x444466)
    }

    // Título
    this.add.text(W/2, H/2 - 60, 'PONG', {
      fontSize: '64px',
      fontFamily: 'monospace',
      color: '#ffffff'
    }).setOrigin(0.5)

    // Instrução
    this.add.text(W/2, H/2 + 20, 'Pressione ESPAÇO para jogar', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#aaaaaa'
    }).setOrigin(0.5)

    // Detectar tecla ESPAÇO e iniciar o jogo
    const space = this.input.keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    space.on('down', () => {
      this.scene.start('Game')
    })
  }
}