/**
 * `ENT-006` O Comandante (`LVL-14.md` §5).
 *
 * A entidade só executa: estado, fase, ataque e geometria vêm de `core/comandante.ts`.
 * Nenhum tempo aqui — todos vêm de `data/tuning.ts` (`COMANDANTE`).
 *
 * As três coisas que este chefe tem e os outros três não:
 *   - **ele não anda.** A velocidade horizontal é zero em todos os estados e o pivô é o
 *     `setFlipX`. Se alguém acrescentar perseguição, a arena deixa de mudar de tamanho e o
 *     eclipse perde a função (§6.5).
 *   - **o céu decide o ataque.** `setSky()` é a única entrada que troca `ATK-13` por `ATK-14`;
 *     a FSM nunca escolhe sozinha qual dos dois cabe (§5.2).
 *   - **a lança sai da mão.** Depois de `ATK-14` ele fica `desarmado` por 1.200 ms, e é a
 *     única janela grande da luta (§5.3).
 */
import Phaser from 'phaser';
import { COMANDANTE, PLAYER, TILE } from '../data/tuning';
import {
  comandanteAttack, comandanteDrift, comandanteDuration, comandanteOpen, comandantePhase,
  nextComandanteState,
  type ComandanteEvent, type ComandanteState, type ComandanteTiming,
} from '../../core/comandante';
import type { Sky } from '../../core/eclipse';

const TIMING: ComandanteTiming = {
  introMs: COMANDANTE.introMs,
  lungeWindupMs: COMANDANTE.lungeWindupMs,
  lungeMs: COMANDANTE.lungeMs,
  lungeRecoverMs: COMANDANTE.lungeRecoverMs,
  lungeRecoverPhase2Ms: COMANDANTE.lungeRecoverPhase2Ms,
  spearWindupMs: COMANDANTE.spearWindupMs,
  spearFlightMs: COMANDANTE.spearFlightMs,
  unarmedMs: COMANDANTE.unarmedMs,
  transitionMs: COMANDANTE.transitionMs,
  deathHoldMs: COMANDANTE.deathHoldMs,
};

/** Ele espera um respiro entre golpes — o ciclo de §6.3 é feito de ataque + respiro. */
const IDLE_MS = 500;

export class Comandante extends Phaser.Physics.Arcade.Sprite {
  hp: number = COMANDANTE.hp;
  state: ComandanteState = 'entrada';
  phase: 1 | 2 = 1;
  /** A estocada só machuca na execução, e só a quem está na frente (§5.3). */
  dangerous = false;
  /** A lança no ar, quando ela está voando (`ATK-14`). */
  spear: { x: number; y: number } | null = null;
  /** `x` de nascimento: serve de asserção — ele **nunca** muda de coluna (§6.5). */
  readonly homeX: number;

  private sinceState = 0;
  private deathProcessed = false;
  private facing: 1 | -1 = -1;
  private spearSprite?: Phaser.GameObjects.Image;
  private spearVx = 0;
  private telegraphSprite?: Phaser.GameObjects.Rectangle;

  onDefeated?: () => void;
  onChanged?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'comandante');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.homeX = x;
    this.setOrigin(0.5, 1);
    this.setDepth(18);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(COMANDANTE.body.width, COMANDANTE.body.height);
    body.setOffset((this.width - COMANDANTE.body.width) / 2, this.height - COMANDANTE.body.height);
    body.setAllowGravity(true);
    // `setImmovable` NÃO: contra um corpo estático do Arcade ninguém se separa e ele cai pelo
    // piso. A imunidade a knockback vem de `takeHit` nunca aplicar velocidade.
    this.enterState('entrada', scene.time.now);
  }

  get alive(): boolean { return this.state !== 'morte'; }

  /** A janela: o `desarmado` é a única abertura grande, e a `recuperacao` a pequena. */
  get open(): boolean { return comandanteOpen(this.state); }

  /** `CEN-100` manda: na luz ele só tem `ATK-13`, na sombra só `ATK-14` (§5.2). */
  setSky(sky: Sky): void {
    if (!this.alive) return;
    if (sky === 'sombra' && this.state === 'luz') this.fire('sky-dark', this.scene.time.now);
    else if (sky === 'luz' && this.state === 'sombra') this.fire('sky-light', this.scene.time.now);
  }

  private enterState(next: ComandanteState, now: number): void {
    const previous = this.state;
    this.state = next;
    this.sinceState = now;
    this.dangerous = false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    // ele não anda: nenhum estado liga `velocityX` (§6.5). O `drift` é 0 por contrato.
    body.setVelocityX(comandanteDrift());
    this.scene.tweens.killTweensOf(this);
    this.hideTelegraph();

    switch (next) {
      case 'entrada':
        this.clearTint();
        this.setScale(1);
        break;

      case 'luz':
        this.clearTint();
        body.setVelocityX(0);
        break;

      case 'sombra':
        // na sombra a silhueta ganha luz de contorno (`VIS-004`); o corpo, não o piso
        this.setTint(0x8f9ad8);
        break;

      case 'telegraph-estocada':
        this.setTint(0xd95555);
        this.setScale(1);
        // §5.3: ele **gira** até a direção do jogador e a lança desce à altura do quadril.
        // Não há linha no chão — a referência é o corpo dele, porque ele não se move.
        this.showTelegraph(COMANDANTE.lunge.px, 0.55);
        this.scene.tweens.add({
          targets: this, scaleY: 0.94, duration: TIMING.lungeWindupMs, yoyo: false,
        });
        break;

      case 'estocada':
        this.clearTint();
        this.hideTelegraph();
        this.dangerous = true;
        this.scene.tweens.add({ targets: this, scaleX: 1.06, duration: 90, yoyo: true });
        break;

      case 'recuperacao':
        this.clearTint();
        this.setScale(1);
        break;

      case 'telegraph-lanca':
        this.setTint(0xd95555);
        this.setScale(1);
        // §5.3: ele ergue a lança acima da cabeça e a sombra no chão **encurta**
        this.showTelegraph(COMANDANTE.spear.px, 0.35);
        this.scene.tweens.add({
          targets: this, y: this.y - 10, duration: TIMING.spearWindupMs / 2, yoyo: true,
        });
        break;

      case 'lanca':
        this.clearTint();
        this.hideTelegraph();
        this.throwSpear();
        break;

      case 'desarmado':
        // a lança não está na mão: ele fica sem nada, e é a deixa para avançar (§5.3)
        this.setTint(0xf2c66d);
        break;

      case 'transicao-fase':
        this.setTint(0xf2c66d);
        // §5.5: ele **finca a lança no chão**
        this.scene.tweens.add({ targets: this, angle: this.facing * 4, duration: 220, yoyo: true });
        break;

      case 'morte': {
        body.setVelocityX(0);
        body.setEnable(false);
        this.clearTint();
        this.hideTelegraph();
        this.destroySpear();
        this.scene.tweens.killTweensOf(this);
        // §5.6: ele **entrega a lança**, não cai. A capa com o estandarte escorrega.
        this.scene.tweens.add({
          targets: this, angle: this.facing * 6, alpha: 0.3, duration: TIMING.deathHoldMs,
        });
        if (!this.deathProcessed) {
          this.deathProcessed = true;
          this.onDefeated?.();
        }
        break;
      }
    }
    void previous;
    this.onChanged?.();
  }

  /**
   * O telegraph não é uma linha no chão: é o **corpo dele** (ele não se move, então o corpo
   * já é a régua). Um retângulo na altura da lança basta para dar leitura sem virar HUD.
   */
  private showTelegraph(alcance: number, alpha: number): void {
    this.hideTelegraph();
    const x = this.x + this.facing * (alcance / 2);
    this.telegraphSprite = this.scene.add.rectangle(x, TILE * 6.0, alcance, 6, 0xd95555, alpha)
      .setDepth(14);
    this.scene.tweens.add({ targets: this.telegraphSprite, alpha: 0.15, duration: 180, yoyo: true, repeat: 2 });
  }

  private hideTelegraph(): void {
    this.telegraphSprite?.destroy();
    this.telegraphSprite = undefined;
  }

  /** `ATK-14`: um projétil reto de 7 tiles a 500 px/s — **não é instantâneo** (§5.3). */
  private throwSpear(): void {
    this.destroySpear();
    this.spearVx = this.facing * COMANDANTE.spear.speed;
    this.spearSprite = this.scene.add.image(this.x + this.facing * 36, TILE * 5.4, 'spear')
      .setDepth(17).setFlipX(this.facing === -1);
    this.spear = { x: this.spearSprite.x, y: this.spearSprite.y };
  }

  private stepSpear(): void {
    const s = this.spearSprite;
    if (!s) return;
    const t = this.scene.game.loop.delta / 1000;
    s.x += this.spearVx * t;
    this.spear = { x: s.x, y: s.y };
  }

  /** A lança acertou: some da tela e o `desarmado` segue contando o tempo (§5.3). */
  consumeSpear(): void { this.destroySpear(); }

  private destroySpear(): void {
    this.spearSprite?.destroy();
    this.spearSprite = undefined;
    this.spear = null;
  }

  private fire(event: ComandanteEvent, now: number): void {
    const next = nextComandanteState(this.state, event, this.phase);
    if (next !== this.state) this.enterState(next, now);
  }

  /**
   * Um passo. `playerX` decide o pivô (as oito direções viram flip + ângulo), nunca o `x`.
   */
  update(time: number, playerX: number, floorY: number): void {
    if (!this.alive) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    // trava o x: mesmo que algo empurre, ele volta ao posto. É o §6.5 em código.
    body.setVelocityX(0);
    this.x = this.homeX;

    this.stepSpear();

    // a lança voa até o alcance de 7 tiles; depois volta (1.200 ms de desarmado)
    if (this.spearSprite) {
      const viajou = Math.abs(this.spearSprite.x - this.homeX);
      if (viajou > COMANDANTE.spear.px) this.destroySpear();
    }

    if (this.state === 'luz' || this.state === 'sombra' || this.state === 'recuperacao'
      || this.state === 'telegraph-estocada' || this.state === 'telegraph-lanca') {
      const dir: 1 | -1 = playerX < this.x ? -1 : 1;
      if (dir !== this.facing) { this.facing = dir; this.setFlipX(dir === 1); }
    }

    const elapsed = time - this.sinceState;

    if (this.state === 'luz' || this.state === 'sombra') {
      if (elapsed >= IDLE_MS) this.fire('attack-chosen', time);
      return;
    }

    const duration = comandanteDuration(this.state, this.phase, TIMING);
    if (duration === null || elapsed < duration) return;

    switch (this.state) {
      case 'entrada': this.fire('intro-done', time); break;
      case 'telegraph-estocada': this.setScale(1); this.fire('windup-done', time); break;
      case 'estocada':
        this.dangerous = false;
        this.fire('attack-done', time);
        break;
      case 'recuperacao': this.fire('recover-done', time); break;
      case 'telegraph-lanca': this.fire('windup-done', time); break;
      case 'lanca':
        this.destroySpear();
        this.fire('attack-done', time);
        break;
      case 'desarmado': this.fire('spear-returned', time); break;
      case 'transicao-fase': this.fire('phase-done', time); break;
      default: break;
    }
    void floorY;
    void comandanteAttack;
  }

  /** A estocada alcança 6 tiles à frente, na altura do corpo — pular não resolve (§5.3). */
  get lungeReachPx(): number { return COMANDANTE.lunge.px; }

  takeHit(damage: number): void {
    if (!this.alive) return;
    // imune a knockback: só a vida muda, nunca a posição (§5.1)
    this.hp = Math.max(0, this.hp - damage);
    this.setTintFill(0xe6dfd2);
    this.scene.time.delayedCall(70, () => {
      if (this.state === 'morte') return;
      if (this.state === 'sombra') this.setTint(0x8f9ad8);
      else if (this.state === 'telegraph-estocada' || this.state === 'telegraph-lanca') this.setTint(0xd95555);
      else if (this.state === 'desarmado' || this.state === 'transicao-fase') this.setTint(0xf2c66d);
      else this.clearTint();
    });

    const nextPhase = comandantePhase(this.hp, COMANDANTE.phase2At);
    if (nextPhase !== this.phase && this.hp > 0) {
      this.phase = nextPhase;
      // §5.5: a transição só começa da luz ou da sombra; no meio de um golpe, o golpe termina
      if (this.state === 'luz' || this.state === 'sombra') {
        this.enterState('transicao-fase', this.scene.time.now);
      }
      return;
    }
    if (this.hp <= 0) this.enterState('morte', this.scene.time.now);
    this.onChanged?.();
  }

  /** Ponto de dano, para a cena comparar com o corpo do jogador. */
  get lungeDamage(): number { return COMANDANTE.lunge.damage; }
  get spearDamage(): number { return COMANDANTE.spear.damage; }
  /** Altura do quadril, onde a estocada passa — `HAB-07` não salva de uma lança alta. */
  get hipOffsetPx(): number { return PLAYER.body.height * 0.6; }
}
