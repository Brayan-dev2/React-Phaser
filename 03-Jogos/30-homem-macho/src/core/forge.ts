/**
 * `ENT-005` O Forjador e `CEN-092` o pilão — regra pura (`docs/niveis/LVL-12.md` §5 e §7).
 *
 * Duas coisas neste setor são fáceis de estragar, e as duas estão aqui:
 *
 * 1. **O chefe tem um estado `trabalhando`.** É o único do jogo com um. Ele martela a
 *    bigorna e ignora o jogador; se o jogador sai de alcance, ele **volta a trabalhar**.
 *    A luta só existe enquanto alguém estiver perto (§5.2).
 * 2. **O pilão não é ataque dele.** Relógio próprio, posição fixa, defasado em meio
 *    período — e **para quando ele morre**, porque quem bate é ele (§7).
 *
 * TS puro (`ADR-01`): nenhum tempo aqui, tudo chega por `ForgeTiming`.
 */

/** O estado que só este chefe tem: ele trabalha, não espera (§5.2). */
export type ForgeState =
  | 'trabalhando'
  | 'telegraph'
  | 'golpe'
  | 'recuperacao'
  | 'transicao-fase'
  | 'morte';

export type ForgeAttack =
  /** Corrente: arco de 5 tiles a 700 px/s. Resposta: pular ou sair do arco. */
  | 'ATK-10'
  /** Peça em brasa: projétil que quica 1 vez. Resposta: **lateral** — pular não resolve. */
  | 'ATK-11'
  /** Onda de bigorna: percorre o piso. Só em fase 2. Resposta: sair do chão. */
  | 'ATK-12';

export interface ForgeTiming {
  readonly arcWindupMs: number;
  readonly arcMs: number;
  readonly arcRecoverMs: number;
  readonly arcRecoverPhase2Ms: number;
  readonly pieceWindupMs: number;
  readonly pieceMs: number;
  readonly pieceRecoverMs: number;
  readonly waveWindupMs: number;
  readonly waveMs: number;
  readonly waveRecoverMs: number;
  readonly transitionMs: number;
  readonly deathHoldMs: number;
}

export type ForgeEvent =
  | 'engaged'
  | 'windup-done'
  | 'strike-done'
  | 'recover-done'
  | 'phase-done'
  | 'died';

/** Fase 2 quando a vida cai a 130 de 260 (§5.5). */
export function forgePhase(hp: number, phase2At: number): 1 | 2 {
  return hp <= phase2At ? 2 : 1;
}

/** Duração do estado para o ataque corrente. `null` = espera evento. */
export function forgeDuration(
  state: ForgeState, attack: ForgeAttack, phase: 1 | 2, t: ForgeTiming,
): number | null {
  switch (state) {
    case 'trabalhando': return null;
    case 'telegraph':
      if (attack === 'ATK-11') return t.pieceWindupMs;
      if (attack === 'ATK-12') return t.waveWindupMs;
      return t.arcWindupMs;
    case 'golpe':
      if (attack === 'ATK-11') return t.pieceMs;
      if (attack === 'ATK-12') return t.waveMs;
      return t.arcMs;
    case 'recuperacao':
      if (attack === 'ATK-11') return t.pieceRecoverMs;
      if (attack === 'ATK-12') return t.waveRecoverMs;
      return phase === 2 ? t.arcRecoverPhase2Ms : t.arcRecoverMs;
    case 'transicao-fase': return t.transitionMs;
    case 'morte': return t.deathHoldMs;
  }
}

/** Próximo estado; evento que não se aplica devolve o mesmo estado. */
export function nextForgeState(state: ForgeState, event: ForgeEvent): ForgeState {
  switch (state) {
    case 'trabalhando':
      // `engaged` é o único caminho para fora do trabalho — e ele **volta** para cá
      return event === 'engaged' ? 'telegraph' : state;
    case 'telegraph':
      if (event === 'died') return 'morte';
      return event === 'windup-done' ? 'golpe' : state;
    case 'golpe':
      if (event === 'died') return 'morte';
      return event === 'strike-done' ? 'recuperacao' : state;
    case 'recuperacao':
      // sair de alcance devolve ao trabalho: ele não persegue (§5.2)
      if (event === 'recover-done') return 'trabalhando';
      return state;
    case 'transicao-fase':
      return event === 'phase-done' ? 'trabalhando' : state;
    case 'morte':
      return state;   // terminal: `MEC-009` processa uma vez só
  }
}

/**
 * Escolha do ataque. Fase 1 alterna corrente e peça (as duas respostas são diferentes:
 * pular × sair de lado). Fase 2 acrescenta a onda no ciclo, e é a única combinação em que
 * **as três** ameaças de piso convivem (§5.3, `VIS-009`).
 */
export function chooseForgeAttack(phase: 1 | 2, index: number): ForgeAttack {
  const i = Math.max(0, Math.floor(index));
  if (phase === 1) return i % 2 === 0 ? 'ATK-10' : 'ATK-11';
  const ciclo: ForgeAttack[] = ['ATK-10', 'ATK-11', 'ATK-12'];
  return ciclo[i % ciclo.length];
}

/**
 * Engajamento: ele só larga o martelo se o jogador estiver **no piso** e a ≤ 5 tiles.
 * Quem entra voando (planeio, gancho, duplo) atravessa sem que ele levante a cabeça.
 */
export function forgeEngages(
  playerOnFloor: boolean, distancePx: number, engagePx: number,
): boolean {
  return playerOnFloor && distancePx <= engagePx;
}

/** O arco da corrente cobre `reachPx` à frente dele, na altura do peito. */
export function inForgeArc(
  bossX: number, facing: 1 | -1, reachPx: number, playerX: number,
): boolean {
  const end = bossX + facing * reachPx;
  return playerX >= Math.min(bossX, end) && playerX <= Math.max(bossX, end);
}

/** A onda percorre o piso a partir dele, para o lado em que ele está virado (§5.3). */
export function waveReach(
  bossX: number, facing: 1 | -1, reachPx: number,
): { from: number; to: number } {
  const end = bossX + facing * reachPx;
  return { from: Math.min(bossX, end), to: Math.max(bossX, end) };
}

/** Onde a onda está no instante `elapsedMs` (ela atravessa o piso em `waveMs`). */
export function waveFrontX(
  bossX: number, facing: 1 | -1, reachPx: number, elapsedMs: number, waveMs: number,
): number {
  const p = waveMs <= 0 ? 1 : Math.min(1, Math.max(0, elapsedMs / waveMs));
  return bossX + facing * reachPx * p;
}

/** A peça em brasa viaja na altura do peito: **pular não resolve**, sair de lado resolve. */
export function pieceHitsPlayer(
  pieceX: number, pieceY: number, playerX: number, playerFeetY: number, bodyHeightPx: number,
): boolean {
  const perto = Math.abs(pieceX - playerX) <= 42;
  // da cintura para cima: quem está no chão leva, quem passou por cima não
  const naAltura = pieceY >= playerFeetY - bodyHeightPx && pieceY <= playerFeetY;
  return perto && naAltura;
}

/** `TST-009`: o 0 HP é processado **uma única vez**, inclusive no frame da morte. */
export function shouldProcessForgeDeath(
  state: ForgeState, hp: number, alreadyProcessed: boolean,
): boolean {
  return !alreadyProcessed && hp <= 0 && state !== 'morte';
}

/** Vida nunca fica negativa e nunca sobe. */
export function damageForge(hp: number, damage: number): number {
  return Math.max(0, hp - Math.max(0, damage));
}

// ---------------------------------------------------------------------------
// `CEN-092` o pilão — o metrônomo (§7)
// ---------------------------------------------------------------------------

export type HammerPhase = 'quieto' | 'telegraph' | 'golpe';

export interface HammerTiming {
  readonly periodMs: number;
  readonly periodPhase2Ms: number;
  /** Meio período: com os dois em fase haveria um instante duplamente perigoso (§7.3). */
  readonly offsetMs: number;
  readonly telegraphMs: number;
  readonly activeMs: number;
}

/**
 * Fase do pilão em `elapsedMs`. O ciclo começa na **batida** (`t = 0` é o golpe), o
 * telegraph vem antes dele e o resto do período é chão limpo.
 */
export function hammerPhaseAt(
  elapsedMs: number, periodMs: number, offsetMs: number, t: Pick<HammerTiming, 'telegraphMs' | 'activeMs'>,
): HammerPhase {
  if (periodMs <= 0) return 'quieto';
  const t0 = ((elapsedMs + offsetMs) % periodMs + periodMs) % periodMs;
  if (t0 < t.activeMs) return 'golpe';
  if (t0 >= periodMs - t.telegraphMs) return 'telegraph';
  return 'quieto';
}

/** Período do pilão: 6,0 s na fase 1, **4,5 s** na fase 2 (§7.3). */
export function hammerPeriod(phase: 1 | 2, t: HammerTiming): number {
  return phase === 2 ? t.periodPhase2Ms : t.periodMs;
}

/**
 * Os pilões param na morte de `ENT-005` (§7.5) — não por compaixão: **quem bate é ele**.
 * Sem o chefe no build, o pilão é da fábrica e não para nunca.
 */
export function hammerStops(stopOnBossDeath: boolean, bossAlive: boolean): boolean {
  return stopOnBossDeath && !bossAlive;
}

/** Batidas por segundo no piso, com dois pilões defasados (§7.3). */
export function hammerBeatsPerSecond(periodMs: number, hammers: number): number {
  if (periodMs <= 0) return 0;
  return (hammers * 1000) / periodMs;
}
