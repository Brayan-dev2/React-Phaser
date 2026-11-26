/**
 * `ENT-005` O Forjador (`LVL-12.md` §5).
 *
 * A entidade só executa: estado, fase, escolha de ataque e a geometria dos três golpes são
 * de `core/forge.ts`. Nenhum tempo aqui — todos vêm de `data/tuning.ts` (`FORJADOR`).
 *
 * Duas coisas que este chefe tem e os outros dois não:
 *   - `trabalhando`: ele martela a bigorna e **ignora o jogador**. Se o jogador sai de
 *     alcance, ele volta a trabalhar — não persegue, não ruge, não espera (§5.2).
 *   - `gate: 'none'`: ele **não tranca a porta**. A saída de L12-05 existe sempre (§8).
 */
import Phaser from 'phaser';
import { FORJADOR, PLAYER, TILE } from '../data/tuning';
import {
  chooseForgeAttack, damageForge, forgeDuration, forgeEngages, forgePhase, inForgeArc,
  nextForgeState, shouldProcessForgeDeath, waveFrontX, waveReach,
  type ForgeAttack, type ForgeEvent, type ForgeState, type ForgeTiming,
} from '../../core/forge';

const TIMING: ForgeTiming = {
  arcWindupMs: FORJADOR.arcWindupMs,
  arcMs: FORJADOR.arcMs,
  arcRecoverMs: FORJADOR.arcRecoverMs,
  arcRecoverPhase2Ms: FORJADOR.arcRecoverPhase2Ms,
  pieceWindupMs: FORJADOR.pieceWindupMs,
  pieceMs: FORJADOR.pieceMs,
  pieceRecoverMs: FORJADOR.pieceRecoverMs,
  waveWindupMs: FORJADOR.waveWindupMs,
  waveMs: FORJADOR.waveMs,
  waveRecoverMs: FORJADOR.waveRecoverMs,
  transitionMs: FORJADOR.transitionMs,
  deathHoldMs: FORJADOR.deathHoldMs,
};

export class Forjador extends Phaser.Physics.Arcade.Sprite {
  hp: number = FORJADOR.hp;
  state: ForgeState = 'trabalhando';
  phase: 1 | 2 = 1;
  attack: ForgeAttack = 'ATK-10';
  /** Dano do arco só existe na execução, nunca no telegraph (§5.3). */
  dangerous = false;
  /** Posição da peça em brasa, quando ela está no ar (`ATK-11`). */
  piece: { x: number; y: number } | null = null;
  /** Faixa ativa da onda de bigorna (`ATK-12`), em px. */
  wave: { from: number; to: number } | null = null;
  /** Onde o **frente** da onda está agora — é ele que machuca, não a faixa inteira. */
  waveFront: number | null = null;

  private sinceState = 0;
  private attackCount = 0;
  private deathProcessed = false;
  private facing: 1 | -1 = -1;
  private pieceSprite?: Phaser.GameObjects.Image;
  private pieceVx = 0;
  private pieceVy = 0;
  private pieceBounces = 0;
  private waveSprite?: Phaser.GameObjects.Rectangle;
  private arcSprite?: Phaser.GameObjects.Rectangle;

  onDefeated?: () => void;
  onChanged?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'forjador');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(18);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(FORJADOR.body.width, FORJADOR.body.height);
    body.setOffset((this.width - FORJADOR.body.width) / 2, this.height - FORJADOR.body.height);
    body.setAllowGravity(true);
    // `setImmovable` NÃO: contra um corpo estático do Arcade ninguém se separa e ele cai
    // pelo piso. A imunidade a knockback (§5.1) vem de `takeHit` nunca aplicar velocidade.
    this.enterState('trabalhando', scene.time.now);
  }

  get alive(): boolean { return this.state !== 'morte'; }

  /** Ele não sai do posto de trabalho (§5.1): o clamp é a coluna `leashX`. */
  clampTo(minX: number, maxX: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.x < minX) { this.x = minX; body.setVelocityX(0); }
    if (this.x > maxX) { this.x = maxX; body.setVelocityX(0); }
  }

  private enterState(next: ForgeState, now: number): void {
    const previous = this.state;
    this.state = next;
    this.sinceState = now;
    this.dangerous = false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    // todo estado cancela a animação do anterior: sem isto o tween de `trabalhando` fica
    // `repeat: -1` e cada volta do ciclo empilha mais um (a escala desanda)
    this.scene.tweens.killTweensOf(this);

    switch (next) {
      case 'trabalhando':
        body.setVelocityX(0);
        this.clearTint();
        this.setScale(1);
        // ele está **trabalhando**: o martelo bate em ciclo próprio, sem alvo
        this.scene.tweens.add({
          targets: this, scaleY: 0.97, duration: 420, yoyo: true, repeat: -1,
        });
        break;

      case 'telegraph':
        body.setVelocityX(0);
        this.setScale(1);
        this.setTint(0xd95555);
        this.attackCount += 1;
        this.attack = chooseForgeAttack(this.phase, this.attackCount - 1);
        if (this.attack === 'ATK-10') this.showArc();
        else if (this.attack === 'ATK-12') this.showWaveTelegraph();
        break;

      case 'golpe':
        this.clearTint();
        this.hideArc();
        if (this.attack === 'ATK-11') this.firePiece();
        if (this.attack === 'ATK-12') this.startWave();
        if (this.attack === 'ATK-10') this.dangerous = true;
        this.scene.tweens.add({ targets: this, scaleX: 1.05, duration: 90, yoyo: true });
        break;

      case 'recuperacao':
        body.setVelocityX(0);
        this.dangerous = false;
        this.hideArc();
        break;

      case 'transicao-fase':
        body.setVelocityX(0);
        this.setTint(0xf2c66d);
        // ele atira o martelo fora e pega a corrente com as duas mãos (§5.5)
        this.scene.tweens.add({ targets: this, angle: this.facing * 6, duration: 200, yoyo: true });
        break;

      case 'morte': {
        body.setVelocityX(0);
        body.setEnable(false);
        this.clearTint();
        this.hideArc();
        this.destroyPiece();
        this.destroyWave();
        this.scene.tweens.killTweensOf(this);
        // desmonte: ele termina a peça e senta (§5.6)
        this.scene.tweens.add({
          targets: this, angle: this.facing * 12, alpha: 0.25, duration: TIMING.deathHoldMs,
        });
        if (shouldProcessForgeDeath(previous, this.hp, this.deathProcessed)) {
          this.deathProcessed = true;
          this.onDefeated?.();
        }
        break;
      }
    }
    this.onChanged?.();
  }

  /** `VIS-009`: o arco tem forma, cor e som próprios — a corrente é branca (§5.3). */
  private showArc(): void {
    this.hideArc();
    const largura = FORJADOR.arc.px;
    const x = this.x + this.facing * (largura / 2);
    this.arcSprite = this.scene.add.rectangle(x, TILE * 6.2, largura, 8, 0xe6dfd2, 0.9)
      .setDepth(15);
    this.scene.tweens.add({ targets: this.arcSprite, alpha: 0.3, duration: 160, yoyo: true, repeat: 2 });
  }

  private hideArc(): void {
    this.arcSprite?.destroy();
    this.arcSprite = undefined;
  }

  /** A onda é vermelha e vive no piso: a leitura é "sair do chão" (§5.3). */
  private showWaveTelegraph(): void {
    this.hideArc();
    const { from, to } = waveReach(this.x, this.facing, FORJADOR.wave.px);
    this.arcSprite = this.scene.add.rectangle((from + to) / 2, TILE * 6.9, to - from, 6, 0xd95555, 0.5)
      .setDepth(14);
    this.scene.tweens.add({ targets: this.arcSprite, alpha: 0.85, duration: 200, yoyo: true });
  }

  /** `ATK-11`: a peça viaja na altura do peito e quica **uma** vez (§5.3). */
  private firePiece(): void {
    this.destroyPiece();
    const dir = this.facing;
    this.pieceVx = dir * FORJADOR.piece.speed;
    this.pieceVy = -220;
    this.pieceBounces = 0;
    this.pieceSprite = this.scene.add.image(this.x + dir * 40, TILE * 5.2, 'forge_piece')
      .setDepth(17);
    this.piece = { x: this.pieceSprite.x, y: this.pieceSprite.y };
  }

  private destroyPiece(): void {
    this.pieceSprite?.destroy();
    this.pieceSprite = undefined;
    this.piece = null;
  }

  private startWave(): void {
    this.destroyWave();
    this.wave = waveReach(this.x, this.facing, FORJADOR.wave.px);
    const { from, to } = this.wave;
    this.waveSprite = this.scene.add.rectangle((from + to) / 2, TILE * 6.85, to - from, FORJADOR.wave.height, 0xd95555, 0.9)
      .setDepth(15);
    this.scene.tweens.add({ targets: this.waveSprite, alpha: 0.35, duration: 120, yoyo: true, repeat: 4 });
  }

  private destroyWave(): void {
    this.waveSprite?.destroy();
    this.waveSprite = undefined;
    this.wave = null;
    this.waveFront = null;
  }

  private fire(event: ForgeEvent, now: number): void {
    const next = nextForgeState(this.state, event);
    if (next !== this.state) this.enterState(next, now);
  }

  /**
   * Um passo. `playerOnFloor` e `playerX` vêm da cena: o engajamento exige o jogador **no
   * piso**, então quem atravessa voando não acorda o chefe (§5.1).
   */
  update(time: number, playerX: number, playerOnFloor: boolean, floorY: number): void {
    if (!this.alive) return;
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.state === 'trabalhando' || this.state === 'recuperacao') {
      const dir: 1 | -1 = playerX < this.x ? -1 : 1;
      if (dir !== this.facing) { this.facing = dir; this.setFlipX(dir === 1); }
    }

    // a peça anda mesmo durante a recuperação: ela é do mundo, não do estado
    this.stepPiece(floorY);

    const duration = forgeDuration(this.state, this.attack, this.phase, TIMING);
    const elapsed = time - this.sinceState;

    if (this.state === 'trabalhando') {
      const dist = Math.abs(playerX - this.x);
      if (forgeEngages(playerOnFloor, dist, FORJADOR.engageTiles * TILE)) {
        this.fire('engaged', time);
      }
      return;
    }

    if (duration !== null && elapsed >= duration) {
      switch (this.state) {
        case 'telegraph': this.fire('windup-done', time); break;
        case 'golpe':
          this.dangerous = false;
          this.destroyWave();
          this.fire('strike-done', time);
          break;
        case 'recuperacao': this.fire('recover-done', time); break;
        case 'transicao-fase': this.fire('phase-done', time); break;
        default: break;
      }
      return;
    }

    // `ATK-12`: a onda avança pelo piso; o desenho mostra a faixa, o dano segue o frente
    if (this.state === 'golpe' && this.attack === 'ATK-12') {
      this.waveFront = waveFrontX(this.x, this.facing, FORJADOR.wave.px, elapsed, FORJADOR.waveMs);
    }

    // o arco só machuca na execução e só a quem está à frente dele (§5.3)
    if (this.state === 'golpe' && this.attack === 'ATK-10') {
      this.dangerous = inForgeArc(this.x, this.facing, FORJADOR.arc.px, playerX) && playerOnFloor;
    }
    void body;
  }

  /** A peça cai, quica uma vez e morre no segundo toque no piso. */
  private stepPiece(floorY: number): void {
    const s = this.pieceSprite;
    if (!s) return;
    const t = this.scene.game.loop.delta / 1000;
    this.pieceVy += 900 * t;
    s.x += this.pieceVx * t;
    s.y += this.pieceVy * t;
    if (s.y >= floorY - 12) {
      if (this.pieceBounces >= FORJADOR.piece.bounces) { this.destroyPiece(); return; }
      this.pieceBounces += 1;
      s.y = floorY - 12;
      this.pieceVy = -Math.abs(this.pieceVy) * 0.6;
      this.pieceVx *= 0.8;
    }
    this.piece = { x: s.x, y: s.y };
    s.setAngle(s.angle + 220 * t);
  }

  takeHit(damage: number): void {
    if (!this.alive) return;
    this.hp = damageForge(this.hp, damage);
    this.setTintFill(0xe6dfd2);
    this.scene.time.delayedCall(70, () => {
      if (this.state === 'telegraph') this.setTint(0xd95555);
      else if (this.state !== 'morte') this.clearTint();
    });

    const nextPhase = forgePhase(this.hp, FORJADOR.phase2At);
    if (nextPhase !== this.phase && this.hp > 0) {
      this.phase = nextPhase;
      this.enterState('transicao-fase', this.scene.time.now);
      return;
    }
    if (this.hp <= 0) this.enterState('morte', this.scene.time.now);
    this.onChanged?.();
  }

  /** Ponto de dano do arco, para a cena comparar com o corpo do jogador. */
  get arcDamage(): number { return FORJADOR.arc.damage; }
  get pieceDamage(): number { return FORJADOR.piece.damage; }
  get waveDamage(): number { return FORJADOR.wave.damage; }
  /** Altura do peito, onde a peça viaja — `core/forge.pieceHitsPlayer` usa isto. */
  get chestOffsetPx(): number { return PLAYER.body.height * 0.55; }
}
