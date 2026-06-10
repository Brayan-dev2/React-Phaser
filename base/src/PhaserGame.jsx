import { useEffect, useRef } from 'react';
import Phaser from 'phaser'
import GameScene from './scenes/GameScene'

export default function PhaserGamer() {
  const gameRef = useRef(null)

    useEffect(() => {
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: divRef.current,
            physics: {
                default: 'arcade',
                arcade: { debug: false }
            },
            scene: {GameScene}
        }

        const game = new Phaser.Game(config)

        return () => game.destroy(true) }, [])

    return <div ref={divRef} />
}