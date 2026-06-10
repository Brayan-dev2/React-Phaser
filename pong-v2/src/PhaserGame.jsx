import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import BootScene from './scenes/BootScene'
import MenuScene from './scenes/MenuScene'
import GameScene from './scenes/GameScene'

export default function PhaserGame() {
  const divRef = useRef(null)

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,       // detecta WebGL ou Canvas automaticamente
      width: 800,
      height: 500,
      parent: divRef.current,  // monta o canvas dentro do nosso div
      physics: {
        default: 'arcade',
        arcade: { debug: false }
      },
      scene: [BootScene, MenuScene, GameScene]
    }

    const game = new Phaser.Game(config)

    // Cleanup: destrói o jogo ao desmontar o componente
    return () => game.destroy(true)
  }, []) // [] = executa só uma vez

  return <div ref={divRef} />
}