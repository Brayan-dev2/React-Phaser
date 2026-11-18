/**
 * `ENT-008` O Plantonista — o último chefe do jogo (`LVL-16.md` §5).
 *
 * **Ele não tem vida.** Não existe `hp` nesta classe, e a ausência é a regra: os cinco chefes
 * anteriores tinham barra de vida; este tem **postura** (100/125/150, golpe de 25) e se vence
 * com **três baixas assinadas** no posto (`MEC-011`). `MEC-009` não aparece aqui (`TST-018`).
 *
 * A entidade só executa: postura, atordoamento, protocolo e o leash vêm de `core/posto.ts`;
 * os números vêm de `data/tuning.ts` (`PLANTONISTA`). Nada de mágica neste arquivo.
 *
 * As três coisas que fazem dele o sexto chefe e não o primeiro de novo:
 *   - **a janela é do jogador**. `Atordoado` não é fase 2: é o resultado de bater 4/5/6 vezes,
 *     e é a única janela do jogo que o jogador abre sozinho (§5.2);
 *   - **ele fica pior a cada baixa assinada** — mais rápido na 2ª, mais cedo no protocolo na
 *     3ª. Não é fúria: é o efeito colateral do progresso do jogador (§5.5);
 *   - **ele não persegue**. A ronda é um corpo que anda com uma lanterna acesa; o leash de 8
 *     tiles é o número que faz a luta existir (§6.5).
 */
import Phaser from 'phaser';
import { PLANTONISTA, TILE } from '../data/tuning';
import {
  canHold, canSign, clampToLeash, hitsPerBaixa, poiseFor, protocolTriggered, rendido,
  signComplete, staggered, type PostoState, type PostoTiming,
} from '../../core/posto';

const TIMING: PostoTiming = {
  poise: PLANTONISTA.poise as unknown as readonly [number, number, number],
  golpePoise: PLANTONISTA.golpePoise,
  staggerMs: PLANTONISTA.staggerMs,
  staggerSwayMs: PLANTONISTA.staggerSwayMs,
  channelMs: PLANTONISTA.channelMs,
  staggerSlackMs: PLANTONISTA.staggerSlackMs,
  protocolHits: PLANTONISTA.protocolHits,
  protocolWindowMs: PLANTONISTA.protocolWindowMs,
  protocolMs: PLANTONISTA.protocolMs,
  crackMs: 1400,
  holeMs: 2000,
  maxHoles: 8,
  maxHolesFinal: 10,
  maxAdjacent: 2,
};

/** Respiro entre rondas — o ciclo de §6.3 é ataque + 300 ms de espera. */
const IDLE_MS = 300;

export type PostoAttack = 'ATK-19' | 'ATK-20' | 'ATK-21';

export class Plantonista extends Phaser.Physics.Arcade.Sprite {
  /**
   * A postura da baixa atual. Não é vida: chega a 0 e ele **não morre** — fica `atordoado`.
   * O máximo vem de `poiseFor(baixas + 1)` (100 → 125 → 150).
   */
  poise: number = PLANTONISTA.poise[0];
  /** Baixas **assinadas** (0..3). Sobrevive à morte do jogador (§10.1). */
  baixas = 0;
  state: PostoState = 'posto';
  attack: PostoAttack = 'ATK-19';
  /** `true` só na ronda: a zona da lanterna é o perigo, não existe hurtbox de ataque. */
  dangerous = false;
  /** `true` na janela de 1.400 ms do `ATK-21`: bater agora devolve 22 de dano. */
  protocolOpen = false;
  /** `x` do posto e leash: ele **nunca** vai a oeste de `leashX` (§6.5). */
  readonly leashX: number;
  /** Quantas Sentinelas já pediu ao apito — a cena conta as vivas e o teto é 2. */
  apitos = 0;

  onChanged?: () => void;
  /** O apito: a cena invoca **1** Sentinela do piso (§5.3). */
  onApito?: () => void;
  /** A terceira baixa foi assinada: ele apaga a lanterna e senta (§5.7). */
  onRendido?: () => void;

  private sinceState = 0;
  private facing: 1 | -1 = -1;
  private hits: number[] = [];
  private lastHitAt = -10_000;
  private lantern?: Phaser.GameObjects.Ellipse;
  private zigzag?: Phaser.Tweens.Tween;
  /** Tempo do jogador dentro dos 3 tiles do posto — o gatilho do apito. */
  private nearMs = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, leashX: number) {
    super(scene, x, y, 'plantonista');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.leashX = leashX;
    this.setOrigin(0.5, 1);
    this.setDepth(18);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLANTONISTA.body.width, PLANTONISTA.body.height);
    body.setOffset((this.width - PLANTONISTA.body.width) / 2,
      this.height - PLANTONISTA.body.height);
    body.setAllowGravity(true);
    // ele **não** é imovable: o Arcade estático o faria cair pelo piso (lição de LVL-15).
    this.showLantern();
    this.enterState('posto', scene.time.now);
  }

  /** Ele nunca está morto: a luta termina em `rendido` (§5.7), não em `morte`. */
  get alive(): boolean { return this.state !== 'rendido'; }
  get rendido(): boolean { return this.state === 'rendido'; }
  /** Postura máxima da baixa atual — o `max` da barra (`UI-20`). */
  get maxPoise(): number { return poiseFor(this.baixas + 1, TIMING); }
  /** Golpes de 25 que ainda faltam para a próxima baixa (para o painel de debug/teste). */
  get hitsToNext(): number { return hitsPerBaixa(TIMING)[Math.min(this.baixas, 2)] ?? 0; }
  /** Quanto durou o atordoamento até agora — a cena mede o canal por aqui. */
  get staggerElapsed(): number { return this.scene.time.now - this.sinceState; }
  /** O `interact` do posto só **começa** dentro da folga de 1.200 ms (§5.5). */
  get channelOpen(): boolean {
    return this.state === 'atordoado' && canSign(this.staggerElapsed, TIMING);
  }

  /** Um canal já em curso pode **continuar** até o fim dos 4.500 ms. */
  get channelHoldable(): boolean {
    return this.state === 'atordoado' && canHold(this.staggerElapsed, TIMING);
  }

  private showLantern(): void {
    this.lantern = this.scene.add.ellipse(this.x, this.y - this.displayHeight + 18,
      PLANTONISTA.lanternPx, 26, 0xd9772e, 0.16).setDepth(15);
    this.lantern.setVisible(false);
  }

  private enterState(next: PostoState, now: number): void {
    this.state = next;
    this.sinceState = now;
    this.dangerous = false;
    this.protocolOpen = false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    this.scene.tweens.killTweensOf(this);

    switch (next) {
      case 'posto':
        this.clearTint();
        this.setScale(1);
        this.facing = -1;
        this.setFlipX(true);
        break;

      case 'avanco':
        this.clearTint();
        this.setScale(1);
        this.lantern?.setVisible(false);
        break;

      case 'telegraph':
        // `ATK-19` ergue a lanterna; `ATK-20` leva o apito à boca. Nada de linha no chão:
        // a informação é o corpo dele, como no `ATK-16` do par.
        this.setTint(0xd95555);
        break;

      case 'golpe':
        // ele **caminha** 3 tiles com a lanterna acesa: a zona perigosa anda com ele
        this.clearTint();
        this.lantern?.setVisible(true);
        this.dangerous = true;
        this.facing = -1;
        this.setFlipX(true);
        body.setVelocityX(-PLANTONISTA.speedPxS * this.speedFactor);
        this.zigzag = this.scene.tweens.add({
          targets: this.lantern, alpha: 0.34, duration: 220, yoyo: true, repeat: -1,
        });
        break;

      case 'protocolo':
        // `ATK-21`: levanta a lanterna na horizontal. A janela **não** é parry: quem para de
        // bater nunca toma dano, e é isso que o chefe final ensina (§5.3)
        this.clearTint();
        this.setTint(0xd9a155);
        this.lantern?.setVisible(false);
        break;

      case 'atordoado':
        // 300 ms de cambaleio: ele sai de cima do posto (§5.5). É a luta em uma linha.
        this.clearTint();
        this.lantern?.setVisible(false);
        this.zigzag?.stop();
        this.scene.tweens.add({
          targets: this,
          x: clampToLeash(this.x + PLANTONISTA.swayTiles * TILE, this.leashX),
          duration: PLANTONISTA.staggerSwayMs,
          ease: 'Quad.easeOut',
        });
        this.setAngle(this.facing * 6);
        break;

      case 'rendido':
        // §5.7: ele apaga a lanterna, senta no chão e **não é mais uma entidade**
        this.clearTint();
        this.lantern?.setVisible(false);
        this.zigzag?.stop();
        body.setEnable(false);
        this.setAngle(0);
        this.scene.tweens.add({
          targets: this, y: this.y + 26, alpha: 0.55, duration: PLANTONISTA.deathHoldMs,
        });
        break;

      case 'recuperacao':
        this.setScale(1);
        this.clearTint();
        this.lantern?.setVisible(false);
        break;
    }
    this.onChanged?.();
  }

  /** §5.5: a 2ª baixa o deixa **8% mais rápido** — ele acelera o que já fazia. */
  private get speedFactor(): number {
    return this.baixas >= 2 ? PLANTONISTA.speedBoost2 : 1;
  }

  /**
   * Um golpe do jogador: **25 de postura, zero de dano**. Três golpes em 4.000 ms disparam o
   * `Protocolo`, e bater durante ele devolve 22 ao jogador **sem tocar na postura** (§5.3).
   * Devolve `true` se o golpe entrou (para a cena mostrar feedback de acerto).
   */
  takeGolpe(now: number): boolean {
    if (this.state === 'rendido' || this.state === 'atordoado') return false;

    // `ATK-21` aberto: o golpe é **contra-atacado**. A postura fica intacta — é o preço da pressa.
    if (this.protocolOpen) {
      this.onCounter?.();
      return false;
    }

    this.hits = this.hits.filter((h) => now - h <= PLANTONISTA.protocolWindowMs);
    this.hits.push(now);
    this.lastHitAt = now;
    this.poise = Math.max(0, this.poise - PLANTONISTA.golpePoise);
    this.setTintFill(0xe6dfd2);
    this.scene.time.delayedCall(60, () => {
      if (this.state !== 'rendido') this.clearTint();
    });

    if (staggered(this.poise)) {
      this.hits = [];
      this.enterState('atordoado', now);
      return true;
    }
    if (protocolTriggered(this.hits, now, TIMING)) {
      this.hits = [];
      this.enterState('protocolo', now);
      return true;
    }
    this.onChanged?.();
    return true;
  }

  /** `ATK-21` contra-atacou: a cena aplica 22 de dano no jogador (nunca postura). */
  onCounter?: () => void;

  /**
   * O canal do posto terminou: **uma baixa assinada**. Idempotente por chamada — a cena só
   * chama quando os 3.000 ms completam dentro da janela (§5.5).
   */
  signBaixa(now: number): boolean {
    if (!this.channelHoldable) return false;
    if (!signComplete(PLANTONISTA.channelMs, TIMING)) return false;
    this.baixas += 1;
    this.poise = poiseFor(this.baixas + 1, TIMING);
    if (rendido(this.baixas)) {
      this.enterState('rendido', now);
      this.onRendido?.();
      return true;
    }
    // ele reage ao carimbo e volta a andar — pior, mas andando (§5.5)
    this.scene.tweens.add({ targets: this, scaleY: 0.92, duration: 120, yoyo: true });
    this.enterState('avanco', now);
    return true;
  }

  /** O jogador morreu: a postura reseta, **as baixas ficam** (§10.1). */
  resetPoise(now: number): void {
    if (this.rendido) return;
    this.poise = poiseFor(this.baixas + 1, TIMING);
    this.hits = [];
    this.enterState('posto', now);
  }

  /** Um passo. `playerX`/`postoX` decidem agressão, apito e o leash (§5.2, §6.5). */
  update(time: number, playerX: number, postoX: number): void {
    if (this.state === 'rendido') return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dt = this.scene.game.loop.delta;

    // a lanterna acompanha o corpo: a zona de 2 tiles anda com ele (§5.3)
    if (this.lantern) {
      this.lantern.setPosition(this.x - this.facing * 10, this.y - 60);
    }

    // §5: a postura decai 15/s depois de 2.000 ms sem golpe — não se acumula de longe
    if (this.state !== 'atordoado' && this.state !== 'protocolo'
      && time - this.lastHitAt > 2000 && this.poise < this.maxPoise) {
      this.poise = Math.min(this.maxPoise, this.poise + (15 * dt) / 1000);
    }

    const distTiles = Math.abs(playerX - postoX) / TILE;
    if (distTiles <= PLANTONISTA.apitoTiles && this.state === 'avanco') this.nearMs += dt;
    else if (distTiles > PLANTONISTA.apitoTiles) this.nearMs = 0;

    if (this.state === 'posto' || this.state === 'avanco' || this.state === 'recuperacao') {
      const dir: 1 | -1 = playerX < this.x ? -1 : 1;
      if (dir !== this.facing) {
        this.facing = dir;
        this.setFlipX(dir === 1);
      }
    }

    // leash: ele guarda o posto, não a porta (§6.5)
    if (this.x < this.leashX) { this.x = this.leashX; body.setVelocityX(0); }

    const elapsed = time - this.sinceState;

    switch (this.state) {
      case 'posto':
        body.setVelocityX(0);
        if (Math.abs(playerX - this.x) <= PLANTONISTA.aggroTiles * TILE) {
          this.enterState('avanco', time);
        }
        break;

      case 'avanco':
        body.setVelocityX(0);
        // `ATK-20`: o apito é a **única** ação reativa dele — ele chama reforço quando o
        // jogador já está perto do posto, ou seja, quando está perdendo (§5.3)
        if (this.apitos < PLANTONISTA.apitoMaxAlive
          && this.nearMs >= PLANTONISTA.apitoNearMs) {
          this.apitos += 1;
          this.nearMs = 0;
          this.attack = 'ATK-20';
          this.enterState('telegraph', time);
          break;
        }
        if (elapsed >= IDLE_MS) {
          this.attack = 'ATK-19';
          this.enterState('telegraph', time);
        }
        break;

      case 'telegraph': {
        const windup = this.attack === 'ATK-20'
          ? PLANTONISTA.apitoWindupMs
          : this.attack === 'ATK-21'
            ? PLANTONISTA.protocolWindupMs
            // a 3ª baixa anuncia o protocolo 200 ms antes; a 2ª apita 300 ms antes
            : PLANTONISTA.roundWindupMs - (this.baixas >= 3 ? PLANTONISTA.protocolEarlyMs : 0);
        if (elapsed >= windup) {
          if (this.attack === 'ATK-20') {
            this.onApito?.();
            this.enterState('recuperacao', time);
          } else if (this.attack === 'ATK-21') {
            this.enterState('protocolo', time);
          } else {
            this.enterState('golpe', time);
          }
        }
        break;
      }

      case 'golpe': {
        // ele anda 3 tiles e para — a ronda não persegue, e é por isso que ela é legível
        if (this.x <= Math.max(this.leashX, postoX - PLANTONISTA.roundTiles * TILE)
          || elapsed >= (PLANTONISTA.roundTiles * TILE * 1000) / PLANTONISTA.speedPxS) {
          this.dangerous = false;
          this.zigzag?.stop();
          this.lantern?.setVisible(false);
          this.enterState('recuperacao', time);
        }
        break;
      }

      case 'protocolo':
        body.setVelocityX(0);
        this.protocolOpen = elapsed >= PLANTONISTA.protocolWindupMs;
        if (elapsed >= PLANTONISTA.protocolWindupMs + PLANTONISTA.protocolMs) {
          this.enterState('avanco', time);
        }
        break;

      case 'atordoado': {
        // 4.500 = 300 cambaleio + 3.000 canal + 1.200 folga: passou disso, a baixa não é
        // assinada — e o jogador perde **tempo**, não vida (§5.5)
        if (elapsed >= PLANTONISTA.staggerMs) {
          this.poise = this.maxPoise;
          this.enterState('avanco', time);
        }
        break;
      }

      case 'recuperacao':
        body.setVelocityX(0);
        if (elapsed >= (this.attack === 'ATK-20'
          ? PLANTONISTA.apitoRecoverMs : PLANTONISTA.roundRecoverMs)) {
          this.enterState('avanco', time);
        }
        break;

      default:
        break;
    }
  }

  /** Dano que este corpo faz ao jogador agora — `ATK-19` só na ronda (§5.3). */
  get touchDamage(): number { return PLANTONISTA.roundDamage; }
}
