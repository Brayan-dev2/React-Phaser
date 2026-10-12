import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { Jogo } from './scenes/Jogo.js'

/* Este componente coloca o jogo do Phaser dentro do React.
   - useRef: guarda a <div> onde o jogo vai morar.
   - useEffect: roda quando a tela aparece e desliga o jogo ao sair dela. */
export default function PhaserGame() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return undefined

    const config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      parent: containerRef.current,
      backgroundColor: '#0b1020',
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',                     // o "motor" de física que usamos
        arcade: {
          gravity: { y: 1500 },                // gravidade: puxa tudo para baixo
          debug: false                         // true = mostra as caixas de colisão
        }
      },
      scene: [Jogo],
    }

    const jogo = new Phaser.Game(config)

    // Deixamos o jogo visível na página para você explorar pelo console (F12):
    // digite  jogo.scene.getScene('Jogo')  e aperte Enter!
    window.jogo = jogo

    // Limpeza: quando sair da tela, o jogo é desligado (evita "jogos fantasmas")
    return () => {
      jogo.destroy(true)
    }
  }, [])

  return <div ref={containerRef} className="phaser-host" />
}
