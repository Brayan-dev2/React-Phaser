/** Config do `Phaser.Game` — GDD §7.10 (escala) e §2.5 (física). */
import Phaser from 'phaser';
import { MOVE, VIEW } from './data/tuning';
import { PAL } from './data/palette';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { GameScene } from './scenes/GameScene';

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: PAL.bg,
    width: VIEW.width,
    height: VIEW.height,
    pixelArt: true,
    roundPixels: true,
    disableContextMenu: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: VIEW.width,
      height: VIEW.height,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: MOVE.gravity }, debug: false },
    },
    scene: [BootScene, PreloadScene, GameScene],
  };
}
