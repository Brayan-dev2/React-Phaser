import Phaser from 'phaser'
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot') // chave única da cena
  }

  preload() {
    // Aqui você carregaria assets externos, por exemplo:
    // this.load.image('fundo', 'assets/fundo.png')
    // this.load.audio('beep', 'assets/beep.mp3')
  }

  create() {
    // Após o preload, avança para o Menu
    this.scene.start('Menu')
  }
}