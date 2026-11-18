/**
 * `ENT-004` O Alferes da Ronda (`LVL-08.md` §5).
 * A entidade só executa: estado, fase e regra do eco são de `core/alferes.ts`.
 * Nenhum tempo aqui — todos vêm de `data/tuning.ts` (`ALFERES`).
 */
import Phaser from 'phaser';
import { ALFERES, TILE } from '../data/tuning';
import {
  alferesDuration, alferesPhase, chooseAlferesAttack, damageAlferes, nextAlferesState,
  shouldProcessAlferesDeath, shouldSpawnEcho,
  type AlferesAttack, type AlferesState, type AlferesTiming,
} from '../../core/alferes';

const TIMING: AlferesTiming = {
  introMs: ALFERES.introMs,
  windupMs: ALFERES.windupMs,
  lungeMs: Math.round((ALFERES.lunge.px / ALFERES.lunge.speed) * 1000),
  recoverMs: ALFERES.recoverMs,
  recoverPhase2Ms: ALFERES.recoverPhase2Ms,
  echoDelayMs: ALFERES.echoDelayMs,
  echoMs: ALFERES.echoMs,
  transitionMs: ALFERES.transitionMs,
  deathHoldMs: ALFERES.deathHoldMs,
};

export class Alferes extends Phaser.Physics.Arcade.Sprite {
  hp: number = ALFERES.hp;
  state: AlferesState = 'entrada';
  phase: 1 | 2 = 1;
  attack: AlferesAttack = 'ATK-04';
  /** Dano só existe na execução, nunca no telegraph (§5.3). */
  dangerous = false;
  /** Faixa do eco ativo, em px; `null` quando o eco não está no ar. */
  echo: { from: number; to: number } | null = null;

  private sinceState = 0;
  private sinceLunge = 0;
  private echoSpawned = false;
  private attackCount = 0;
  private deathProcessed = false;
  /** Ponto de partida da estocada — é onde o eco nasce (§5.3). */
  private lungeOriginX = 0;
  private facing: 1 | -1 = -1;
  private line?: Phaser.GameObjects.Rectangle;
  private echoLine?: Phaser.GameObjects.Rectangle;

  onDefeated?: () => void;
  onChanged?: () => void;
  /** `ATK-05`: a cada âncora que acorda, a cena é avisada (o relógio é do pátio). */
  onAnchorCall?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'alferes');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(18);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(ALFERES.body.width, ALFERES.body.height);
    body.setOffset((this.width - ALFERES.body.width) / 2, this.height - ALFERES.body.height);
    body.setAllowGravity(true);
    this.enterState('entrada', scene.time.now);
  }

  get alive(): boolean { return this.state !== 'morte'; }

  private enterState(next: AlferesState, now: number): void {
    const previous = this.state;
    this.state = next;
    this.sinceState = now;
    this.dangerous = next === 'estocada';
    const body = this.body as Phaser.Physics.Arcade.Body;

    switch (next) {
      case 'entrada':
      case 'idle':
      case 'recuperacao':
      case 'transicao-fase':
        body.setVelocityX(0);
        if (next !== 'transicao-fase') { this.clearTint(); this.setAngle(0); }
        break;

      case 'telegraph':
        body.setVelocityX(0);
        this.lungeOriginX = this.x;
        this.echoSpawned = false;
        this.setTint(0xd95555);
        this.scene.tweens.add({
          targets: this, scaleY: 0.92, angle: this.facing * -5,
          duration: TIMING.windupMs * 0.8, yoyo: true,
        });
        this.showLine();
        break;

      case 'estocada':
        this.clearTint();
        this.setAngle(0);
        this.setScale(1);
        this.sinceLunge = now;
        body.setVelocityX(this.facing * ALFERES.lunge.speed);
        this.scene.tweens.add({ targets: this, scaleX: 1.06, duration: 120, yoyo: true });
        break;

      case 'eco': {
        body.setVelocityX(0);
        this.hideLine();
        // o eco nasce onde ele estava, não onde ele está: a resposta é passar, não perseguir
        const origem = this.lungeOriginX;
        const fim = origem + this.facing * ALFERES.lunge.px;
        this.echo = { from: Math.min(origem, fim), to: Math.max(origem, fim) };
        const meio = (this.echo.from + this.echo.to) / 2;
        const largura = this.echo.to - this.echo.from;
        this.echoLine = this.scene.add.rectangle(meio, TILE * 6.5, largura, 6, 0xf2c66d, 0.85)
          .setDepth(15);
        this.scene.tweens.add({ targets: this.echoLine, alpha: 0.25, duration: 160, yoyo: true, repeat: 2 });
        this.dangerous = true;   // o eco machuca 15
        break;
      }

      case 'morte': {
        body.setVelocityX(0);
        body.setEnable(false);
        this.clearTint();
        this.hideLine();
        this.echo = null;
        this.echoLine?.destroy();
        this.echoLine = undefined;
        // desmonte: ele senta, e a metade de areia o alcança (§5.6)
        this.scene.tweens.add({ targets: this, angle: this.facing * 14, alpha: 0.2, duration: TIMING.deathHoldMs });
        if (shouldProcessAlferesDeath(previous, this.hp, this.deathProcessed)) {
          this.deathProcessed = true;
          this.onDefeated?.();
        }
        break;
      }
    }
    this.onChanged?.();
  }

  /** `VIS-009`: com zero cobertura, a referência do golpe é o **piso** (§5.3). */
  private showLine(): void {
    this.hideLine();
    const largura = ALFERES.lunge.px;
    const x = this.x + this.facing * (largura / 2);
    this.line = this.scene.add.rectangle(x, TILE * 6.9, largura, 6, 0xd95555, 0.9).setDepth(15);
  }

  private hideLine(): void {
    this.line?.destroy();
    this.line = undefined;
  }

  private fire(event: Parameters<typeof nextAlferesState>[1], now: number): void {
    const next = nextAlferesState(this.state, event, this.phase, this.attack);
    if (next !== this.state) this.enterState(next, now);
  }

  update(time: number, targetX: number): void {
    if (!this.alive) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const duration = alferesDuration(this.state, this.phase, TIMING);
    const elapsed = time - this.sinceState;

    if (this.state === 'idle' || this.state === 'entrada' || this.state === 'transicao-fase') {
      const dir: 1 | -1 = targetX < this.x ? -1 : 1;
      if (dir !== this.facing) { this.facing = dir; this.setFlipX(dir === 1); }
    }

    // `ATK-06`: nasce no meio da estocada, uma única vez (§5.2)
    if (shouldSpawnEcho(this.phase, this.state, time - this.sinceLunge, this.echoSpawned, TIMING)) {
      this.echoSpawned = true;
      this.fire('echo-done', time);
      return;
    }

    if (this.state === 'estocada') {
      body.setVelocityX(this.facing * ALFERES.lunge.speed);
    }

    if (duration !== null && elapsed >= duration) {
      switch (this.state) {
        case 'entrada': this.fire('intro-done', time); break;
        case 'telegraph': this.fire('windup-done', time); break;
        case 'estocada': this.fire('lunge-done', time); break;
        case 'eco':
          this.echo = null;
          this.dangerous = false;
          this.echoLine?.destroy();
          this.echoLine = undefined;
          this.fire('echo-done', time);
          break;
        case 'recuperacao': this.fire('recover-done', time); break;
        case 'transicao-fase': this.fire('phase-done', time); break;
        default: break;
      }
      return;
    }

    if (this.state === 'idle' && elapsed > 260) {
      this.attackCount += 1;
      // em fase 2 o eco ocupa uma das duas escolhas; em fase 1 só existe ATK-04 (§5.3)
      this.attack = chooseAlferesAttack(this.phase, this.attackCount % 2 === 0);
      if (this.attack === 'ATK-06') this.onAnchorCall?.();   // `ATK-05`/relógio: a areia responde
      this.fire('attack-chosen', time);
    }
  }

  takeHit(damage: number): void {
    if (!this.alive) return;
    this.hp = damageAlferes(this.hp, damage);
    this.setTintFill(0xe6dfd2);
    this.scene.time.delayedCall(70, () => { if (this.state !== 'telegraph') this.clearTint(); });

    const nextPhase = alferesPhase(this.hp, ALFERES.phase2At);
    if (nextPhase !== this.phase && this.hp > 0) {
      this.phase = nextPhase;
      this.enterState('transicao-fase', this.scene.time.now);
      return;
    }
    if (this.hp <= 0) this.enterState('morte', this.scene.time.now);
    this.onChanged?.();
  }

  clampTo(minX: number, maxX: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.x < minX) { this.x = minX; body.setVelocityX(0); }
    if (this.x > maxX) { this.x = maxX; body.setVelocityX(0); }
  }
}
