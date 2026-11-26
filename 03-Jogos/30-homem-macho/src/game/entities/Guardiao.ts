/**
 * `ENT-007` O Guardião Duplo — **um corpo** (`LVL-15.md` §5). O chefe é o par: `GameScene`
 * instancia dois destes e trata o par como **uma** entidade em `MEC-009`.
 *
 * A entidade só executa: estado, janela, revivificação e alternância de ataque são de
 * `core/duo.ts`. Nenhum tempo aqui — todos vêm de `data/tuning.ts` (`GUARDIAO`).
 *
 * As três coisas que fazem este corpo diferente dos quatro chefes anteriores:
 *   - **a queda não é a morte.** A 0 HP ele fica no chão, visível, em `queda`, até o parceiro
 *     terminar a canalização de 4 s (§5.5);
 *   - **o sobrevivente recua.** `ATK-18` não é ataque: ele vai para 8+ tiles e preenche o
 *     formulário. Nenhum chefe do jogo fica *menos* agressivo ao perder — este fica (§5.3);
 *   - **ele carrega instrumento, não arma.** O carimbo na mão é o ataque e é o tema.
 */
import Phaser from 'phaser';
import { GUARDIAO, PLAYER, TILE } from '../data/tuning';
import {
  duoAttackFor, duoDuration, duoFelled, nextDuoState, type DuoAttack, type DuoBodyState,
  type DuoEvent, type DuoTiming,
} from '../../core/duo';

const TIMING: DuoTiming = {
  introMs: GUARDIAO.introMs,
  lanternWindupMs: GUARDIAO.bodyWindupMs,
  lanternMs: GUARDIAO.lanternMs,
  lanternRecoverMs: GUARDIAO.lanternRecoverMs,
  sealWindupMs: GUARDIAO.sealWindupMs,
  sealFlightMs: GUARDIAO.sealFlightMs,
  sealRecoverMs: GUARDIAO.sealRecoverMs,
  reviveMs: GUARDIAO.reviveMs,
  interruptDamage: GUARDIAO.interruptDamage,
  suspendMaxMs: GUARDIAO.suspendMs,
};

/** Respiro entre ataques: o ciclo de §6.3 é ataque + respiro curto. */
const IDLE_MS = 300;

export class Guardiao extends Phaser.Physics.Arcade.Sprite {
  hp: number = GUARDIAO.hpPerBody;
  state: DuoBodyState = 'entrada';
  attack: DuoAttack = 'ATK-16';
  /** O arco da lanterna só machuca na execução (§5.3). */
  dangerous = false;
  /** O selo no ar, quando ele existe (`ATK-17`). */
  seal: { x: number; y: number } | null = null;
  /** `x` de nascimento: os dois **nunca trocam de lado** (§6.5). */
  readonly homeX: number;
  /** Qual dos dois ele é (0 ou 1) — só para a ordem dos ataques e o `aria-label`. */
  readonly index: number;

  private sinceState = 0;
  private attackCount = 0;
  private facing: 1 | -1 = -1;
  private sealSprite?: Phaser.GameObjects.Image;
  private sealVx = 0;
  private telegraphSprite?: Phaser.GameObjects.Rectangle;

  /** Quanto de dano já caiu em quem canaliza: 30 interrompe (§5.5). */
  private interruptAcc = 0;

  onChanged?: () => void;
  /** A canalização terminou: a cena devolve a vida ao parceiro caído (§5.5). */
  onRevive?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, index: number) {
    super(scene, x, y, 'guardiao');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.homeX = x;
    this.index = index;
    this.setOrigin(0.5, 1);
    this.setDepth(18);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(GUARDIAO.body.width, GUARDIAO.body.height);
    body.setOffset((this.width - GUARDIAO.body.width) / 2, this.height - GUARDIAO.body.height);
    body.setAllowGravity(true);
    // `setImmovable` NÃO: contra corpo estático do Arcade ele cairia pelo piso.
    this.enterState('entrada', scene.time.now);
  }

  get alive(): boolean { return this.state !== 'morte'; }
  /** Em `queda` ele existe, está no chão e **não** é morte (§5.5). */
  get felled(): boolean { return this.state === 'queda'; }

  private enterState(next: DuoBodyState, now: number): void {
    this.state = next;
    this.sinceState = now;
    this.dangerous = false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    this.scene.tweens.killTweensOf(this);
    this.hideTelegraph();

    switch (next) {
      case 'entrada':
      case 'ativo':
        this.setAngle(0);
        this.setAlpha(1);
        this.clearTint();
        break;

      case 'telegraph':
        this.setTint(0xd95555);
        this.attackCount += 1;
        this.attack = duoAttackFor(this.index + this.attackCount - 1, null);
        // §5.3: ergue o carimbo como martelo. Não há linha no chão — a informação é o braço.
        this.showTelegraph(this.attack === 'ATK-16' ? GUARDIAO.lantern.px : GUARDIAO.seal.px,
          this.attack === 'ATK-16' ? 0.55 : 0.3);
        break;

      case 'golpe':
        this.clearTint();
        this.hideTelegraph();
        if (this.attack === 'ATK-16') this.dangerous = true;
        else this.throwSeal();
        this.scene.tweens.add({ targets: this, scaleX: 1.06, duration: 80, yoyo: true });
        break;

      case 'recuperacao':
        this.setScale(1);
        this.clearTint();
        break;

      case 'queda':
        // ele **não é removido**: fica no chão, visível, esperando o carimbo do outro
        this.setTint(0x6a6472);
        this.setAngle(this.facing * 8);
        this.destroySeal();
        break;

      case 'canalizando':
        // `ATK-18`: ele **recua** e preenche o formulário — nada de fúria (§5.3)
        this.clearTint();
        this.setAngle(0);
        this.interruptAcc = 0;
        this.scene.tweens.add({
          targets: this, scaleY: 0.94, duration: 500, yoyo: true, repeat: -1,
        });
        break;

      case 'morte':
        body.setEnable(false);
        this.clearTint();
        this.destroySeal();
        this.scene.tweens.killTweensOf(this);
        // §5.6: os dois **carimbam o próprio avental** e sentam
        this.scene.tweens.add({
          targets: this, angle: this.facing * 12, alpha: 0.25, duration: GUARDIAO.deathHoldMs,
        });
        break;
    }
    this.onChanged?.();
  }

  /** O telegraph é curto e a informação é o braço: um retângulo na altura do carimbo. */
  private showTelegraph(alcance: number, alpha: number): void {
    this.hideTelegraph();
    const x = this.x + this.facing * (alcance / 2);
    this.telegraphSprite = this.scene.add.rectangle(x, TILE * 6.1, alcance, 6, 0xd95555, alpha)
      .setDepth(14);
    this.scene.tweens.add({
      targets: this.telegraphSprite, alpha: 0.12, duration: 160, yoyo: true, repeat: 2,
    });
  }

  private hideTelegraph(): void {
    this.telegraphSprite?.destroy();
    this.telegraphSprite = undefined;
  }

  /** `ATK-17`: projétil lento de 6 tiles a 400 px/s — dá para ver chegando (§5.3). */
  private throwSeal(): void {
    this.destroySeal();
    this.sealVx = this.facing * GUARDIAO.seal.speed;
    this.sealSprite = this.scene.add.image(this.x + this.facing * 28, TILE * 5.9, 'seal')
      .setDepth(17);
    this.seal = { x: this.sealSprite.x, y: this.sealSprite.y };
  }

  private stepSeal(): void {
    const s = this.sealSprite;
    if (!s) return;
    const t = this.scene.game.loop.delta / 1000;
    s.x += this.sealVx * t;
    this.seal = { x: s.x, y: s.y };
    if (Math.abs(s.x - this.homeX) > GUARDIAO.seal.px) this.destroySeal();
  }

  /** O selo acertou: some e o jogador ganha uma marca (`1 / 2`). */
  consumeSeal(): void { this.destroySeal(); }

  private destroySeal(): void {
    this.sealSprite?.destroy();
    this.sealSprite = undefined;
    this.seal = null;
  }

  private fire(event: DuoEvent['type'], now: number): void {
    const next = nextDuoState(this.state, event, this.attack);
    if (next !== this.state) this.enterState(next, now);
  }

  /** Um passo. `playerX` decide o pivô; `partnerX` decide para onde ele recua. */
  update(time: number, playerX: number, partnerX: number, floorY: number): void {
    if (this.state === 'morte') return;
    const body = this.body as Phaser.Physics.Arcade.Body;

    this.stepSeal();

    if (this.state === 'ativo' || this.state === 'telegraph' || this.state === 'recuperacao') {
      const dir: 1 | -1 = playerX < this.x ? -1 : 1;
      if (dir !== this.facing) { this.facing = dir; this.setFlipX(dir === 1); }
    }

    // §5.1: ele **não persegue** — mantém a distância do parceiro, a 90 px/s
    if (this.state === 'ativo' || this.state === 'canalizando') {
      const alvo = this.state === 'canalizando'
        // `ATK-18`: recua para 8+ tiles do jogador, nunca na direção dele
        ? this.x + (Math.abs(this.x - playerX) < GUARDIAO.retreatTiles * TILE
          ? (playerX < this.x ? 1 : -1) * GUARDIAO.retreatTiles * TILE : 0)
        : this.x;
      const dx = alvo - this.x;
      body.setVelocityX(Math.abs(dx) > 4 ? Math.sign(dx) * GUARDIAO.speedPxS : 0);
      // e não cola no parceiro: os dois mantêm 10 tiles de separação (§6.5)
      const separacao = Math.abs(this.x - partnerX);
      if (separacao < GUARDIAO.minSeparation * TILE * 0.5) {
        body.setVelocityX(Math.sign(this.x - partnerX) * GUARDIAO.speedPxS);
      }
    } else if (this.state !== 'queda') {
      body.setVelocityX(0);
    }

    const elapsed = time - this.sinceState;
    const duration = duoDuration(this.state, this.attack, TIMING);
    if (duration !== null && elapsed >= duration) {
      switch (this.state) {
        case 'entrada': this.fire('attack-chosen', time); break;
        case 'telegraph': this.fire('windup-done', time); break;
        case 'golpe': this.dangerous = false; this.fire('attack-done', time); break;
        case 'recuperacao': this.fire('recover-done', time); break;
        case 'canalizando':
          this.fire('revive-done', time);
          this.onRevive?.();
          break;
        default: break;
      }
      return;
    }
    if (this.state === 'ativo' && elapsed >= IDLE_MS) this.fire('attack-chosen', time);
    void floorY;
  }

  /** O sobrevivente começa a canalização por ordem da cena (`ATK-18`, §5.3). */
  startRevive(now: number): void {
    // ele larga o que estiver fazendo para preencher o formulário: `ATK-18` é a prioridade
    if (this.state !== 'queda' && this.state !== 'morte') {
      this.enterState('canalizando', now);
    }
  }

  /** `MEC-009` (§5.6): os dois caem juntos — o corpo travado em `queda` também morre. */
  markDead(now: number): void {
    if (this.state !== 'morte') this.enterState('morte', now);
  }

  /** O parceiro voltou: o corpo caído **não** volta sozinho — quem revive é a cena. */
  markRevived(now: number): void {
    if (this.state === 'queda') this.enterState('ativo', now);
  }

  takeHit(damage: number): void {
    if (this.state === 'morte' || this.state === 'queda') return;
    this.hp = Math.max(0, this.hp - damage);
    this.setTintFill(0xe6dfd2);
    this.scene.time.delayedCall(60, () => {
      if (this.state === 'morte' || this.state === 'queda') return;
      this.clearTint();
    });

    // §5.5: interromper exige **30 de dano** em quem canaliza, não 30 de um golpe
    if (this.state === 'canalizando') {
      this.interruptAcc += damage;
      if (this.interruptAcc >= GUARDIAO.interruptDamage) {
        // interrompido: ele volta a atacar, o caído **continua** caído e a janela recomeça
        this.interruptAcc = 0;
        this.enterState('ativo', this.scene.time.now);
        return;
      }
    }

    if (duoFelled(this.hp)) this.enterState('queda', this.scene.time.now);
    else this.onChanged?.();
  }

  /** A cena devolve a vida na revivificação (§5.5: 50%). */
  setHp(hp: number): void { this.hp = hp; this.onChanged?.(); }

  /** Ponto de dano do arco, para a cena comparar com o corpo do jogador. */
  get lanternDamage(): number { return GUARDIAO.lantern.damage; }
  get sealDamage(): number { return GUARDIAO.seal.damage; }
  get chestOffsetPx(): number { return PLAYER.body.height * 0.55; }
}
