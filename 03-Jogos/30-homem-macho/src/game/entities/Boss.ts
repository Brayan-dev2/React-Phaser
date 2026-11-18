/**
 * `ENT-003` Guardião da Passagem (`LVL-03.md` §5).
 * A entidade só executa: a decisão de estado é da FSM pura em `core/boss.ts`.
 * Nenhum tempo aqui — todos vêm de `data/tuning.ts` (`BOSS`).
 */
import Phaser from 'phaser';
import { BOSS } from '../data/tuning';
import {
  bossPhase, chooseAttack, damageBoss, nextBossState, shouldProcessDeath, stateDuration,
  type BossAttack, type BossState, type BossTiming,
} from '../../core/boss';

const TIMING: BossTiming = {
  introMs: BOSS.introMs,
  telegraphMs: BOSS.telegraphMs,
  telegraphPhase2Ms: BOSS.telegraphPhase2Ms,
  chargeMs: BOSS.charge.speed ? Math.round((BOSS.charge.px / BOSS.charge.speed) * 1000) : 620,
  recoverMs: BOSS.recoverMs,
  recoverPhase2Ms: BOSS.recoverPhase2Ms,
  stunMs: BOSS.stunMs,
  areaTelegraphMs: BOSS.areaTelegraphMs,
  areaRecoverMs: BOSS.areaRecoverMs,
  transitionMs: BOSS.transitionMs,
  deathHoldMs: BOSS.deathHoldMs,
};

export class Boss extends Phaser.Physics.Arcade.Sprite {
  hp: number = BOSS.hp;
  state: BossState = 'entrada';
  phase: 1 | 2 = 1;
  attack: BossAttack = 'ATK-01';
  /** Dano só existe na execução, nunca no telegraph (§5.3). */
  dangerous = false;

  private sinceState = 0;
  private attackCount = 0;
  private deathProcessed = false;
  private facing: 1 | -1 = -1;

  onDefeated?: () => void;
  onPillarHit?: () => void;
  /** Avisa a cena para sincronizar a barra e a fase (`EVT` local `game:boss`). */
  onChanged?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'boss');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(18);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(BOSS.body.width, BOSS.body.height);
    body.setOffset((this.width - BOSS.body.width) / 2, this.height - BOSS.body.height);
    body.setAllowGravity(true);
    body.setImmovable(false);
    this.enterState('entrada', scene.time.now);
  }

  get alive(): boolean { return this.state !== 'morte'; }

  private enterState(next: BossState, now: number): void {
    const previous = this.state;
    this.state = next;
    this.sinceState = now;
    this.dangerous = next === 'investida';
    const body = this.body as Phaser.Physics.Arcade.Body;

    switch (next) {
      case 'entrada':
        body.setVelocityX(0);
        break;
      case 'idle':
        body.setVelocityX(0);
        break;
      case 'telegraph':
        body.setVelocityX(0);
        // `P2`: corpo agacha e inclina para trás; contorno de ameaça pulsando
        this.scene.tweens.add({ targets: this, scaleY: 0.92, angle: this.facing * -6, duration: TIMING.telegraphMs * 0.8, yoyo: true });
        this.setTint(0xd95555);
        break;
      case 'investida': {
        this.clearTint();
        this.setAngle(0);
        this.setScale(1);
        body.setVelocityX(this.facing * BOSS.charge.speed);
        this.scene.tweens.add({ targets: this, scaleX: 1.06, duration: 120, yoyo: true });
        break;
      }
      case 'golpe-area':
        body.setVelocityX(0);
        this.setTint(0xf2c66d);
        this.scene.tweens.add({ targets: this, scaleY: 1.1, duration: 220, yoyo: true });
        break;
      case 'atordoado':
        this.clearTint();
        this.setAngle(this.facing * 8);
        body.setVelocityX(0);
        break;
      case 'recuperacao':
        this.clearTint();
        this.setAngle(0);
        body.setVelocityX(0);
        break;
      case 'transicao-fase':
        body.setVelocityX(0);
        this.setTint(0xf2c66d);
        this.scene.tweens.add({ targets: this, scaleX: 1.12, scaleY: 1.12, duration: TIMING.transitionMs * 0.5, yoyo: true });
        break;
      case 'morte': {
        body.setVelocityX(0);
        body.setEnable(false);
        this.clearTint();
        this.scene.tweens.add({ targets: this, angle: this.facing * 90, alpha: 0.15, duration: TIMING.deathHoldMs });
        // o guarda olha o estado *anterior*: já estar em `morte` significa "já processou"
        if (shouldProcessDeath(previous, this.hp, this.deathProcessed)) {
          this.deathProcessed = true;
          this.onDefeated?.();
        }
        break;
      }
    }
    this.onChanged?.();
  }

  /** Evento vindo de fora: `hit-pillar`, `charge-done`, `stun-done`... */
  private fire(event: Parameters<typeof nextBossState>[1], now: number): void {
    const next = nextBossState(this.state, event, this.phase, this.attack);
    if (next !== this.state) this.enterState(next, now);
  }

  update(time: number, targetX: number): void {
    if (!this.alive) return;
    const duration = stateDuration(this.state, this.phase, TIMING);
    const elapsed = time - this.sinceState;

    // virar para o jogador só quando está livre para escolher
    if (this.state === 'idle' || this.state === 'entrada') {
      const dir: 1 | -1 = targetX < this.x ? -1 : 1;
      if (dir !== this.facing) { this.facing = dir; this.setFlipX(dir === 1); }
    }

    if (this.state === 'golpe-area' && elapsed > 120) {
      // a onda viaja para os dois lados; pular é a resposta (§5.3)
      this.clearTint();
    }

    if (duration !== null && elapsed >= duration) {
      switch (this.state) {
        case 'entrada': this.fire('intro-done', time); break;
        case 'telegraph': this.fire('windup-done', time); break;
        case 'investida': this.fire('charge-done', time); break;
        case 'golpe-area': this.fire('area-done', time); break;
        case 'atordoado': this.fire('stun-done', time); break;
        case 'recuperacao': this.fire('recover-done', time); break;
        case 'transicao-fase': this.fire('phase-done', time); break;
        case 'morte': break;
      }
      return;
    }

    // o `idle` escolhe o próximo ataque depois de um respiro curto
    if (this.state === 'idle' && elapsed > 260) {
      this.attackCount++;
      this.attack = chooseAttack(this.phase, this.attackCount % 2 === 0);
      this.fire('attack-chosen', time);
    }
  }

  /** Recebe dano do jogador. Ignora fora das janelas de punição? Não: qualquer acerto conta. */
  takeHit(damage: number): void {
    if (!this.alive) return;
    this.hp = damageBoss(this.hp, damage);
    this.setTintFill(0xe6dfd2);
    this.scene.time.delayedCall(70, () => { if (this.state !== 'telegraph') this.clearTint(); });

    const nextPhase = bossPhase(this.hp, BOSS.phase2At);
    if (nextPhase !== this.phase && this.hp > 0) {
      this.phase = nextPhase;
      this.enterState('transicao-fase', this.scene.time.now);
      return;
    }
    if (this.hp <= 0) this.enterState('morte', this.scene.time.now);
    this.onChanged?.();
  }

  /** Chamado pela cena quando a investida bate no pilar (`ATK-03`). */
  hitPillar(): void {
    if (this.state !== 'investida') return;
    this.enterState('atordoado', this.scene.time.now);
    this.onPillarHit?.();
  }

  /** Imune a knockback, mas não pode sair da arena (§5.1). */
  clampTo(minX: number, maxX: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.x < minX) { this.x = minX; body.setVelocityX(0); }
    if (this.x > maxX) { this.x = maxX; body.setVelocityX(0); }
  }
}
