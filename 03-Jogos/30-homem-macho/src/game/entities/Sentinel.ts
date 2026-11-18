/** `ENT-002` Sentinela distorcida — patrulha, telegrafa, investe (P2: combate legível). */
import Phaser from 'phaser';
import { SENTINEL, TILE } from '../data/tuning';
import { patrolDirection } from '../../core/patrol';
import { PAL } from '../data/palette';

type SentinelState = 'patrol' | 'telegraph' | 'lunge' | 'recover' | 'dead';

export class Sentinel extends Phaser.Physics.Arcade.Sprite {
  hp = SENTINEL.hp;
  state: SentinelState = 'patrol';
  /**
   * `MEC-004` de moedas: avisa a cena que este corpo caiu. A moeda é dada **uma vez**, na morte —
   * e a entidade não sabe quanto vale, porque o preço é dado do jogo (`tuning.ts`), não do ator.
   */
  onDeath?: () => void;
  facing: 1 | -1 = -1;

  private homeX: number;
  private minX: number;
  private maxX: number;
  private stateUntil = 0;
  /** `LVL-04.md` §5.2: direção vem do relógio, não da própria posição. */
  private sync = false;

  constructor(scene: Phaser.Scene, x: number, y: number, facing: 1 | -1 = -1, patrolTiles = SENTINEL.patrolTiles) {
    super(scene, x - TILE / 2, y, 'sentinel');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.facing = facing;
    this.setFlipX(facing === 1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(SENTINEL.body.width, SENTINEL.body.height);
    body.setOffset((this.width - SENTINEL.body.width) / 2, this.height - SENTINEL.body.height);
    body.setMaxVelocityY(900);
    this.homeX = this.x;
    this.minX = this.x - patrolTiles * TILE * 0.5;
    this.maxX = this.x + patrolTiles * TILE * 0.5;
    this.setDepth(18);
  }

  /** Liga a formação (`patrol_sync`): todas as Sentinelas da sala viram no mesmo quadro. */
  enableFormation(): void { this.sync = true; }

  get alive(): boolean { return this.state !== 'dead'; }

  hit(damage: number): void {
    if (!this.alive) return;
    this.hp -= damage;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => this.clearTint());
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(this.facing * 90);
    if (this.hp <= 0) this.die();
  }

  private die(): void {
    this.state = 'dead';
    this.onDeath?.();
    (this.body as Phaser.Physics.Arcade.Body).setEnable(false);
    this.scene.tweens.add({ targets: this, alpha: 0, y: this.y + 10, duration: 260, onComplete: () => this.destroy() });
  }

  update(time: number, player: Phaser.GameObjects.Sprite): void {
    if (!this.alive) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dx = player.x - this.x;
    const dy = Math.abs((player.y - 40) - (this.y - 40));

    switch (this.state) {
      case 'patrol': {
        if (this.sync) {
          // fase travada: a direção é a mesma para todas, em todo instante
          const dir = patrolDirection(time, SENTINEL.patrolTiles, SENTINEL.speed, TILE);
          this.facing = dir;
          body.setVelocityX(dir * SENTINEL.speed);
        } else {
          body.setVelocityX(this.facing * SENTINEL.speed);
          if (this.x <= this.minX && this.facing === -1) this.facing = 1;
          if (this.x >= this.maxX && this.facing === 1) this.facing = -1;
        }
        this.setFlipX(this.facing === 1);
        if (Math.abs(dx) < 130 && dy < 90) this.enter('telegraph', time, SENTINEL.telegraphMs, body);
        break;
      }
      case 'telegraph': {
        body.setVelocityX(0);
        this.facing = dx > 0 ? 1 : -1;
        this.setFlipX(this.facing === 1);
        this.setTint(PAL.threat);
        if (time > this.stateUntil) { this.clearTint(); this.enter('lunge', time, 200, body); }
        break;
      }
      case 'lunge': {
        body.setVelocityX(this.facing * (SENTINEL.lungePx / 0.2));
        if (time > this.stateUntil) this.enter('recover', time, SENTINEL.recoverMs, body);
        break;
      }
      case 'recover': {
        body.setVelocityX(0);
        if (time > this.stateUntil) this.enter('patrol', time, 0, body);
        break;
      }
      default: break;
    }
  }

  private enter(state: SentinelState, time: number, ms: number, body: Phaser.Physics.Arcade.Body): void {
    this.state = state;
    this.stateUntil = time + ms;
    if (state !== 'lunge') body.setVelocityX(0);
  }

  /** Só causa dano durante o investimento — o telegraph existe para ser lido. */
  get dangerous(): boolean { return this.state === 'lunge'; }
}
