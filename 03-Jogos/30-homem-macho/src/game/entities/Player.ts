/** `ENT-001` Homem Macho — FSM em `core/fsm.ts`, números em `data/tuning.ts`. */
import Phaser from 'phaser';
import {
  CLIMB as CLIMB_T, GLIDE as GLIDE_T, HOOK, MOVE, PLAYER, FLAGS, SUSPEND, UPDRAFT,
} from '../data/tuning';
import { InputBuffer, Coyote } from '../systems/InputBuffer';
import { canTransition, PLAYER_TRANSITIONS } from '../../core/fsm';
import { applyDamage } from '../../core/combat';
import { hangPosition, pullMs, type Ring } from '../../core/hook';
import { canGrip, gestoNaParede } from '../../core/climb';
import { canGlide } from '../../core/glide';
import type { Difficulty, PlayerState, Resources } from '../../core/types';

export interface InputState {
  left: boolean;
  right: boolean;
  /** Vertical de natação (`LVL-06` §5.1): fora da água é ignorado. */
  up: boolean;
  down: boolean;
  run: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
  attackPressed: boolean;
  shootPressed: boolean;
  /**
   * `HAB-03` (`DEC-049`): **o eixo vertical da escalada**, separado do pulo.
   *
   * Enquanto o herói está agarrado a uma parede, `W`/`↑` sobe e `S`/`↓` desce; `ESPAÇO` continua
   * a ser o salto de parede. Antes disto `up` era o pulo (`DEC-***`: "uma ação, não uma tecla"),
   * e o resultado era o herói a saltar em vez de escalar — o relato de L10-05.
   */
  climbUp: boolean;
  climbDown: boolean;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  resources: Resources = { hp: PLAYER.hp, shield: PLAYER.shield, power: PLAYER.power };
  state: PlayerState = 'idle';
  facing: 1 | -1 = 1;
  /** `HAB-01` nasce em LVL-02; aqui é ligado por `ITM-003` ou pela flag de build. */
  abilities: {
    doubleJump: boolean; strength: boolean; breath: boolean; hook: boolean; climb: boolean;
    glide: boolean;
  } = {
    doubleJump: FLAGS.doubleJump,
    strength: false,          // `HAB-05` só nasce em LVL-05 (`DEC-010`)
    breath: false,            // `HAB-06` só nasce em LVL-06
    hook: false,              // `HAB-04` só nasce em LVL-09
    climb: false,             // `HAB-03` só nasce em LVL-10
    glide: false,             // `HAB-07` só nasce em LVL-11
  };
  /**
   * `UI-14` (`DEC-041`) — **os níveis comprados**, como multiplicadores.
   *
   * Cada habilidade é lida aqui e multiplicada à constante do `tuning` — nunca reescrita. O `1` é o
   * valor de quem só tem a habilidade; a cena sobe-os quando o jogador compra um nível no painel
   * `HABILIDADES`. Ficam no jogador (e não na cena) porque é o `Player` que lê as constantes: um
   * bónus na cena obrigaria a passar o número por três chamadas até chegar ao impulso do salto.
   */
  bonus = { airJump: 1, glideFall: 1, climbUp: 1, reach: 1 };
  /**
   * `HAB-03` é **estado**, como o gancho (`LVL-10` §7.1): `none → cling → none`.
   * A parede só vale se for `climbable` — parede comum não agarra, e isso é o sinal.
   */
  climb: 'none' | 'cling' = 'none';
  climbWallSide: -1 | 1 | 0 = 0;
  private wallSince = 0;
  /**
   * `HAB-07` é **estado**, como o gancho e a garra (`LVL-11` §7.1):
   * `falling → gliding → falling`, cancelável ao soltar, **sem cooldown**.
   *
   * Duas coisas que não podem regredir: (1) só liga **no ar** e só **caindo** — no chão
   * ele não é um andar lento; (2) **nunca dá altura**, ou todo vão do jogo passa a ser
   * atravessável de baixo para cima (`core/glide.ts`, `P-59`).
   */
  gliding = false;
  /**
   * `CEN-096` (`LVL-13` §6): a cena diz se o corpo está **dentro** da coluna de vento.
   * A decisão de subir continua sendo da corrente, não do pano — e é por isso que este
   * campo é uma região e não uma habilidade.
   */
  updraftZone = false;
  /** O corpo está a subir pela corrente neste instante (para o E2E e o áudio). */
  updraft = false;
  /**
   * `HAB-04` é **estado**, não projétil (`LVL-09` §6.2): `none → pull → hang → none`.
   * Cancelável em qualquer ponto — o jogador nunca fica preso.
   */
  hook: 'none' | 'pull' | 'hang' = 'none';
  hookTarget: Ring | null = null;
  /** Submerso: a gravidade sai e o movimento vira natação (`LVL-06` §5.1). */
  swimming = false;
  /**
   * `LVL-08` §7.1: atrito de piso. A cena calcula o valor (0,75 na areia, 1 fora dela);
   * o jogador só aplica à velocidade horizontal. Não mexe em salto.
   */
  speedMultiplier = 1;
  /** Saltos usados desde o último toque no chão (0 no chão). */
  jumpsUsed = 0;

  private coyote = new Coyote(MOVE.coyoteMs);
  private jumpBuffer = new InputBuffer(MOVE.jumpBufferMs);
  private jumping = false;
  private jumpCutDone = false;
  private attackUntil = 0;
  private attackReadyAt = 0;
  private shootReadyAt = 0;
  private invulnUntil = 0;
  /** `LVL-15` §5.3: até quando o jogador está **suspenso** (teto de `SUSPEND.maxMs`). */
  private suspendedUntil = 0;

  onAttack?: (rect: Phaser.Geom.Rectangle) => void;
  onShoot?: (x: number, y: number, dir: 1 | -1) => void;
  onDamaged?: () => void;
  onDied?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER.body.width, PLAYER.body.height);
    body.setOffset((this.width - PLAYER.body.width) / 2, this.height - PLAYER.body.height);
    body.setCollideWorldBounds(false);
    body.setMaxVelocityY(MOVE.maxFallSpeed);
    this.setDepth(20);
  }

  get grounded(): boolean {
    const b = this.body as Phaser.Physics.Arcade.Body;
    return b.blocked.down || b.touching.down;
  }

  get invulnerable(): boolean { return this.scene.time.now < this.invulnUntil; }
  get alive(): boolean { return this.state !== 'dead'; }

  private setPlayerState(next: PlayerState): void {
    if (next === this.state) return;
    if (!canTransition(PLAYER_TRANSITIONS, this.state, next)) return; // transição inválida: ignora
    this.state = next;
  }

  /**
   * `LVL-15` §5.3: **a única perda de controle do jogo.** Dois selos de `ENT-007` suspendem o
   * jogador por até 800 ms (`P-70`). Não é dano e não é knockback: ele fica parado, sem
   * entrada, e a física continua. O teto é do `tuning`, não de quem chama.
   */
  get suspended(): boolean {
    return typeof this.suspendedUntil === 'number' && this.scene.time.now < this.suspendedUntil;
  }

  suspend(ms: number): void {
    const teto = Math.min(ms, SUSPEND.maxMs);
    this.suspendedUntil = this.scene.time.now + teto;
    this.setVelocityX(0);
    this.setTint(0xb9b2a8);
    this.scene.time.delayedCall(teto, () => { if (!this.suspended) this.clearTint(); });
  }

  update(time: number, input: InputState): void {
    if (!this.alive) { this.setVelocityX(0); return; }
    const body = this.body as Phaser.Physics.Arcade.Body;

    // `LVL-15` §5.3: suspenso = sem entrada, sem ataque, sem salto. Só a gravidade age.
    if (this.suspended) {
      body.setVelocityX(0);
      this.setPlayerState(this.grounded ? 'idle' : 'air');
      return;
    }

    // --- `HAB-04` gancho: puxada e pendurado suspendem a física normal (`LVL-09` §6.2) ---
    if (this.hook !== 'none') {
      this.updateHook(time, input, body);
      return;
    }

    // --- `HAB-03` escalada: aderência de 100 ms e só em `climbable` (`LVL-10` §7.1) ---
    if (this.climb === 'cling') {
      this.updateClimb(input, body);
      return;
    }

    // --- natação (`LVL-06` §5.1): 160 px/s horizontal, 120 px/s vertical, sem salto ---
    if (this.swimming) {
      const vx = (input.right ? 1 : input.left ? -1 : 0) * 160;
      const vy = (input.down ? 1 : 0) * 120 - (input.up ? 1 : 0) * 120;
      body.setVelocity(vx, vy);
      if (vx !== 0) { this.facing = vx > 0 ? 1 : -1; this.setFlipX(vx < 0); }
      this.jumpBuffer.clear();
      if (this.state !== 'hurt') this.setPlayerState('air');   // submerso não é `run` nem `idle`
      return;
    }

    if (this.grounded) {
      this.coyote.onGround(time);
      this.jumping = false;
      this.jumpsUsed = 0;
    }
    if (input.jumpPressed) this.jumpBuffer.press(time);

    // --- horizontal ---
    const speed = MOVE.moveSpeed * (input.run && FLAGS.run ? MOVE.runMultiplier : 1)
      * this.speedMultiplier;
    if (input.left) { this.setVelocityX(-speed); this.facing = -1; this.setFlipX(true); }
    else if (input.right) { this.setVelocityX(speed); this.facing = 1; this.setFlipX(false); }
    else this.setVelocityX(0);

    // --- pulo: buffer + coyote + altura variável (PAT-C-05) + ITM-003 ---
    const maxJumps = this.abilities.doubleJump ? 2 : 1;
    if (this.jumpBuffer.has(time)) {
      const onGroundJump = this.grounded || this.coyote.allows(time);
      const airJump = !onGroundJump && this.abilities.doubleJump && this.jumpsUsed < maxJumps;
      if (onGroundJump || airJump) {
        this.jumpBuffer.clear();
        if (onGroundJump) this.coyote.consume();
        // o salto aéreo é um pouco mais baixo: sinaliza que é o segundo (P2 — legível)
        // `UI-14`: o nível do salto duplo só mexe no **segundo** salto — o primeiro é o do chão
        const impulse = onGroundJump
          ? MOVE.jumpImpulse
          : MOVE.jumpImpulse * MOVE.airJumpMultiplier * this.bonus.airJump;
        body.setVelocityY(-impulse);
        this.jumping = true;
        this.jumpCutDone = false;
        this.jumpsUsed = onGroundJump ? 1 : this.jumpsUsed + 1;
        // feedback do salto aéreo (`P2` — o jogador precisa ver que gastou o segundo)
        if (!onGroundJump) {
          this.scene.tweens.add({ targets: this, scaleY: 1.08, duration: 90, yoyo: true });
          this.setTintFill(0xf2c66d);
          this.scene.time.delayedCall(90, () => this.clearTint());
        }
      }
    }
    if (this.jumping && !input.jumpHeld && !this.jumpCutDone && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * MOVE.variableJumpCut);
      this.jumpCutDone = true;
    }

    // --- `HAB-07` planeio (`LVL-11` §7.1): segurar o salto no ar trava a queda em 120 px/s ---
    this.updateGlide(input, body);
    // `LVL-13` §6.2: a corrente vem DEPOIS do pano — ela é quem empurra
    this.updateUpdraft(body);

    // --- ataque / disparo ---
    if (input.attackPressed && time >= this.attackReadyAt && canTransition(PLAYER_TRANSITIONS, this.state, 'attack')) {
      this.attackReadyAt = time + PLAYER.attack.cooldownMs;
      this.attackUntil = time + PLAYER.attack.activeMs;
      this.setPlayerState('attack');
      this.scene.tweens.add({ targets: this, scaleX: 1.12, scaleY: 0.92, duration: 70, yoyo: true });
      this.onAttack?.(this.attackRect());
    }
    if (input.shootPressed && time >= this.shootReadyAt && canTransition(PLAYER_TRANSITIONS, this.state, 'shoot')) {
      this.shootReadyAt = time + PLAYER.shot.cooldownMs;
      this.onShoot?.(this.x + this.facing * 24, this.y - PLAYER.body.height * 0.55, this.facing);
      this.setPlayerState('shoot');
      this.scene.time.delayedCall(130, () => { if (this.state === 'shoot') this.setPlayerState(this.grounded ? 'idle' : 'air'); });
    }

    // --- estado base (a FSM decide o que é permitido; transição inválida é ignorada) ---
    if (this.state === 'attack') {
      if (time > this.attackUntil) this.setPlayerState(this.grounded ? 'idle' : 'air');
    } else if (this.state === 'hurt') {
      if (time > this.invulnUntil - PLAYER.iframesMs + 220) this.setPlayerState(this.grounded ? 'idle' : 'air');
    } else if (this.state !== 'shoot') {
      if (!this.grounded) this.setPlayerState('air');
      else this.setPlayerState(Math.abs(body.velocity.x) > 1 ? 'run' : 'idle');
    }
  }

  attackRect(): Phaser.Geom.Rectangle {
    // `UI-14`: o nível da força estende o golpe (o dano não muda — `TST-002` fica de pé)
    const w = PLAYER.attack.reachPx * this.bonus.reach;
    const h = PLAYER.attack.heightPx;
    const x = this.facing === 1 ? this.x : this.x - w;
    return new Phaser.Geom.Rectangle(x, this.y - PLAYER.body.height, w, h);
  }

  takeDamage(rawDamage: number, difficulty: Difficulty, fromX: number): void {
    if (!this.alive || this.invulnerable) return;
    const result = applyDamage(this.resources, rawDamage, difficulty);
    this.resources = { hp: result.hp, shield: result.shield, power: result.power };
    this.invulnUntil = this.scene.time.now + PLAYER.iframesMs;
    this.setPlayerState('hurt');
    this.setTintFill(0xd95555);
    this.scene.time.delayedCall(120, () => this.clearTint());
    const knock = this.x < fromX ? -1 : 1;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(knock * 180, -220);
    this.onDamaged?.();
    if (result.died) { this.setPlayerState('dead'); this.onDied?.(); }
  }

  /** Chamado quando `ITM-003` é coletado. */
  /** `HAB-05` Força (`LVL-05` §5): permanente, não cai na morte (`TST-005`). */
  unlockStrength(): void {
    this.abilities.strength = true;
  }

  /** `HAB-06` Fôlego (`LVL-06` §5.4): multiplica o tempo submerso de 6 s para 20 s. */
  unlockBreath(): void {
    this.abilities.breath = true;
  }

  /**
   * Entra/sai da água. Nadar é universal (§5.1); a habilidade só muda o fôlego.
   * A gravidade sai e a velocidade vertical fica limitada à natação.
   */
  setSwimming(on: boolean): void {
    if (this.swimming === on) return;
    this.swimming = on;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(!on);
    body.setMaxVelocityY(on ? 160 : 900);
    if (on) { body.setVelocityY(0); this.jumpsUsed = 0; }
  }

  unlockDoubleJump(): void {
    this.abilities.doubleJump = true;
  }

  /** `HAB-03` Garra (`LVL-10` §7.1): permanente, sobrevive à morte (`TST-005`). */
  unlockClimb(): void {
    this.abilities.climb = true;
  }

  /** `HAB-07` Estandarte (`LVL-11` §7.1): permanente, sobrevive à morte (`TST-005`). */
  unlockGlide(): void {
    this.abilities.glide = true;
  }

  /**
   * Um passo do planeio. É **só um teto de velocidade de queda**: não dá impulso, não muda
   * a horizontal, não mexe em `jumpsUsed`. Ao soltar, a gravidade volta a mandar na mesma
   * hora — sem penalidade e sem cooldown (`LVL-11` §7.1).
   *
   * O teto é `setMaxVelocity` do corpo, não `setVelocity` por frame: a física integra a
   * gravidade em cada passo e o pano tem de valer dentro do passo, ou a queda escapa para
   * ~143 px/s e o alcance medido no GDD desaparece.
   */
  private updateGlide(input: InputState, body: Phaser.Physics.Arcade.Body): void {
    // dentro da corrente a subida é `vy < 0`: sem esta linha o pano fecharia sozinho no
    // primeiro frame de subida e o jogador cairia de dentro do vento (`LVL-13` §6.2)
    const caindo = body.velocity.y > 0 || this.updraftZone;
    const quer = this.abilities.glide
      && canGlide(this.abilities.glide, this.grounded, caindo)
      && input.jumpHeld;
    if (!quer) {
      if (this.gliding) this.releaseGlide();
      return;
    }
    // `UI-14`: o nível do estandarte baixa a queda (`bonus.glideFall` < 1 = mais longe)
    const queda = GLIDE_T.fallSpeed * this.bonus.glideFall;
    if (!this.gliding) {
      this.gliding = true;
      body.setMaxVelocityY(queda);
      // feedback: o pano abre uma vez, e o jogador vê que a queda mudou de ritmo
      this.scene.tweens.add({ targets: this, scaleX: 1.14, duration: 120, yoyo: true });
    }
    if (body.velocity.y > queda) body.setVelocityY(queda);
  }

  /**
   * `CEN-096` (§6.2): dentro da coluna, **com o pano aberto**, quem empurra é a corrente —
   * `HAB-07` só impede a queda. Sem o pano, a coluna não segura ninguém e a gravidade
   * manda como em qualquer outro lugar do jogo.
   *
   * A gravidade é desligada enquanto a corrente sopra: um `setVelocity` por frame seria
   * comido pelo passo da física e a subida sairia a ~120 px/s em vez de 140.
   */
  updateUpdraft(body: Phaser.Physics.Arcade.Body): void {
    const sobe = UPDRAFT.needsGlide
      ? this.updraftZone && this.abilities.glide && this.gliding
      : this.updraftZone;
    if (sobe === this.updraft) {
      if (sobe) body.setVelocityY(-UPDRAFT.risePxS);
      return;
    }
    this.updraft = sobe;
    body.setAllowGravity(!sobe);
    // sair da coluna devolve o corpo ao peso dele: não guarda o impulso do vento
    body.setVelocityY(sobe ? -UPDRAFT.risePxS : 0);
  }

  /** Fecha o pano e devolve o teto de queda normal. Sem cooldown (`LVL-11` §7.1). */
  releaseGlide(): void {
    if (!this.gliding) return;
    this.gliding = false;
    (this.body as Phaser.Physics.Arcade.Body).setMaxVelocityY(MOVE.maxFallSpeed);
  }

  /**
   * A cena diz em que lado há parede **agarrável** e se o input empurra para dentro
   * dela. A aderência (`gripMs`) é contada aqui: soltar a direção zera o relógio.
   */
  updateClimbCandidate(side: -1 | 1 | 0, pressingInto: boolean, time: number): void {
    if (this.climb === 'cling') {
      /*
       * `DEC-049` — **pendurado, o contacto não é reavaliado.** A versão anterior largava a garra
       * quando o corpo deixava de tocar na parede, e subir implica deixar de tocar: o herói
       * subia 4 px e caía, em ciclo. Agora, agarrado, só se sai por: soltar a direção, o salto de
       * parede, o alçapão, uma troca de sala ou a morte — todos explícitos.
       */
      if (!pressingInto && side === this.climbWallSide) this.releaseClimb();
      return;
    }
    if (side === 0 || !pressingInto) { this.wallSince = 0; return; }
    if (this.wallSince === 0) this.wallSince = time;
    if (canGrip(this.abilities.climb, true, pressingInto, time - this.wallSince)) {
      this.climb = 'cling';
      this.climbWallSide = side;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setVelocity(0, 0);
      this.jumpsUsed = 0;
      this.setPlayerState('air');
    }
  }

  /** Solta a parede: queda livre volta a valer (`LVL-10` §7.1). */
  releaseClimb(): void {
    if (this.climb === 'none') return;
    this.climb = 'none';
    this.climbWallSide = 0;
    this.wallSince = 0;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(!this.swimming);
  }

  /** Um passo do modo escalada: sobe a 90, desce a 240, salta a 420+560. */
  private updateClimb(input: InputState, body: Phaser.Physics.Arcade.Body): void {
    /*
     * `DEC-049` — a decisão é do `core` (puro, testável) e não deste `if`: o gesto é
     * `subir`/`descer`/`parado`/`salto-de-parede`, e **só o último** empurra para longe.
     * Antes, qualquer toque em `W` era salto — e por isso a parede não se subia.
     */
    const gesto = gestoNaParede({
      up: input.climbUp || input.up,
      down: input.climbDown || input.down,
      jumpPressed: input.jumpPressed,
      left: input.left,
      right: input.right,
    });
    if (gesto === 'salto-de-parede') {
      const { vx, vy } = {
        vx: -this.climbWallSide * CLIMB_T.wallJumpX,
        vy: -CLIMB_T.wallJumpY,
      };
      this.releaseClimb();
      body.setVelocity(vx, vy);
      this.jumping = true;
      this.jumpCutDone = false;
      this.jumpsUsed = 1;
      this.facing = vx > 0 ? 1 : -1;
      this.setFlipX(vx < 0);
      return;
    }
    // `UI-14`: o nível da garra acelera a subida (a descida fica igual — descer depressa é útil)
    const subindo = gesto === 'subir' ? -CLIMB_T.upSpeed * this.bonus.climbUp : 0;
    const descendo = gesto === 'descer' ? CLIMB_T.downSpeed : 0;
    body.setVelocity(0, subindo + descendo);
  }

  /** `HAB-04` Gancho (`LVL-09` §6.2): permanente, sobrevive à morte (`TST-005`). */
  unlockHook(): void {
    this.abilities.hook = true;
  }

  /** Começa a puxada até a argola. Cancelável a qualquer momento. */
  grapple(ring: Ring): void {
    if (!this.abilities.hook || this.hook !== 'none') return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.hook = 'pull';
    this.hookTarget = { x: ring.x, y: ring.y };
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    this.setPlayerState('air');
  }

  /** Solta sem pular: **queda vertical pura**, sem impulso horizontal (§6.2). */
  releaseHook(): void {
    if (this.hook === 'none') return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.hook = 'none';
    this.hookTarget = null;
    body.setAllowGravity(!this.swimming);
    body.setVelocity(0, 0);
    this.jumpsUsed = 1;   // sair do gancho não devolve o salto de chão
  }

  /**
   * Um passo do estado do gancho. A puxada é `900 px/s` em linha reta; o pendurado é
   * estático e o **salto do gancho** soma horizontal (`380`) e impulso (`560`) — sem o
   * vertical a travessia do canal cai de 7,6 tiles para 3,5 (§6.3).
   */
  private updateHook(time: number, input: InputState, body: Phaser.Physics.Arcade.Body): void {
    const alvo = this.hookTarget;
    if (!alvo) { this.releaseHook(); return; }

    if (this.hook === 'pull') {
      const dx = alvo.x - this.x;
      const dy = alvo.y - this.y;
      const dist = Math.hypot(dx, dy);
      const passo = (HOOK.pullSpeed * this.scene.game.loop.delta) / 1000;
      if (dist <= passo + 4) {
        const pend = hangPosition(alvo, PLAYER.body.height + HOOK.hangGapPx);
        this.setPosition(pend.x, pend.y);
        body.reset(pend.x, pend.y);
        this.hook = 'hang';
        body.setAllowGravity(false);
        body.setVelocity(0, 0);
        return;
      }
      const vx = (dx / dist) * HOOK.pullSpeed;
      const vy = (dy / dist) * HOOK.pullSpeed;
      body.setVelocity(vx, vy);
      if (Math.abs(dx) > 2) { this.facing = dx > 0 ? 1 : -1; this.setFlipX(dx < 0); }
      return;
    }

    // --- pendurado ---
    body.setVelocity(0, 0);
    if (input.jumpPressed) {
      const dir = (input.right ? 1 : input.left ? -1 : this.facing) === 1 ? 1 : -1;
      this.hook = 'none';
      this.hookTarget = null;
      body.setAllowGravity(true);
      body.setVelocity(dir * HOOK.jumpSpeed, -MOVE.jumpImpulse);
      this.jumping = true;
      this.jumpCutDone = false;
      this.jumpsUsed = 1;
      if (dir !== this.facing) { this.facing = dir; this.setFlipX(dir < 0); }
      this.setPlayerState('air');
      return;
    }
    if (input.down) { this.releaseHook(); }
    void time;
  }

  /** Quanto falta da puxada, em ms — só para o VFX do cabo (`VIS-013`). */
  hookPullMs(): number {
    if (this.hook !== 'pull' || !this.hookTarget) return 0;
    return pullMs(Math.hypot(this.hookTarget.x - this.x, this.hookTarget.y - this.y));
  }

  heal(): void {
    this.resources = { hp: PLAYER.hp, shield: PLAYER.shield, power: PLAYER.power };
    this.setPlayerState('idle');
  }
}
