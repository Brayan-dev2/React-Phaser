/**
 * `ENT-004` O Alferes da Ronda — máquina de estados pura (`LVL-08.md` §5.2–5.5).
 *
 * Sem Phaser e sem números: os tempos chegam por `AlferesTiming` (de `data/tuning.ts`).
 * A diferença para `core/boss.ts` (`ENT-003`) é o **eco** de fase 2: ele nasce onde o
 * corpo estava quando a estocada começou, ou seja, no lugar para onde o jogador corre.
 */

export type AlferesState =
  | 'entrada'
  | 'idle'
  | 'telegraph'
  | 'estocada'
  | 'recuperacao'
  | 'eco'
  | 'transicao-fase'
  | 'morte';

export type AlferesAttack = 'ATK-04' | 'ATK-06';

export interface AlferesTiming {
  readonly introMs: number;
  readonly windupMs: number;
  /** `ATK-04`: 4 tiles a 640 px/s = 400 ms (§5.3). */
  readonly lungeMs: number;
  readonly recoverMs: number;
  /** Fase 2 encurta a recuperação de 1100 → 900 ms. */
  readonly recoverPhase2Ms: number;
  /** `ATK-06` nasce 600 ms depois do início da estocada (§5.3). */
  readonly echoDelayMs: number;
  readonly echoMs: number;
  readonly transitionMs: number;
  readonly deathHoldMs: number;
}

export type AlferesEvent =
  | 'intro-done'
  | 'attack-chosen'
  | 'windup-done'
  | 'lunge-done'
  | 'echo-done'
  | 'recover-done'
  | 'phase-done'
  | 'died';

/** Fase 2 quando a vida cai a 120 de 240 (§5.5). */
export function alferesPhase(hp: number, phase2At: number): 1 | 2 {
  return hp <= phase2At ? 2 : 1;
}

/** Duração do estado. `null` = o estado espera evento (o `idle` escolhe depois de um respiro). */
export function alferesDuration(
  state: AlferesState, phase: 1 | 2, t: AlferesTiming,
): number | null {
  switch (state) {
    case 'entrada': return t.introMs;
    case 'idle': return null;
    case 'telegraph': return t.windupMs;
    case 'estocada': return t.lungeMs;
    case 'recuperacao': return phase === 2 ? t.recoverPhase2Ms : t.recoverMs;
    case 'eco': return t.echoMs;
    case 'transicao-fase': return t.transitionMs;
    case 'morte': return t.deathHoldMs;
  }
}

/** Próximo estado; evento que não se aplica devolve o mesmo estado. */
export function nextAlferesState(
  state: AlferesState, event: AlferesEvent, phase: 1 | 2, attack: AlferesAttack = 'ATK-04',
): AlferesState {
  switch (state) {
    case 'entrada':
      return event === 'intro-done' ? 'idle' : state;
    case 'idle':
      if (event === 'attack-chosen') return 'telegraph';
      if (event === 'died') return 'morte';
      return state;
    case 'telegraph':
      return event === 'windup-done' ? 'estocada' : state;
    case 'estocada':
      // o eco entra no meio da estocada, não depois dela (§5.2)
      if (event === 'echo-done') return attack === 'ATK-06' ? 'eco' : state;
      if (event === 'lunge-done') return 'recuperacao';
      return state;
    case 'eco':
      return event === 'echo-done' ? 'recuperacao' : state;
    case 'recuperacao':
      return event === 'recover-done' ? 'idle' : state;
    case 'transicao-fase':
      return event === 'phase-done' ? 'idle' : state;
    case 'morte':
      return state;   // terminal: `MEC-009` processa uma vez só
  }
}

/**
 * O eco só existe em **fase 2** e nasce `echoDelayMs` depois do início da estocada.
 * Devolve `true` uma única vez por estocada.
 */
export function shouldSpawnEcho(
  phase: 1 | 2, state: AlferesState, sinceLungeMs: number, echoSpawned: boolean,
  t: AlferesTiming,
): boolean {
  return phase === 2 && state === 'estocada' && !echoSpawned && sinceLungeMs >= t.echoDelayMs;
}

/** Escolha do ataque: em fase 2 alterna `ATK-04`/`ATK-06`; em fase 1 só `ATK-04`. */
export function chooseAlferesAttack(phase: 1 | 2, useEcho: boolean): AlferesAttack {
  return phase === 2 && useEcho ? 'ATK-06' : 'ATK-04';
}

/**
 * `ATK-06` é uma **repetição da estocada no ponto de partida dela** (§5.3): o alcance é o
 * mesmo de `ATK-04`, mas a origem é `originX` — onde o corpo estava, não onde ele está.
 */
export function echoReach(originX: number, direction: 1 | -1, lungePx: number): { from: number; to: number } {
  const end = originX + direction * lungePx;
  return { from: Math.min(originX, end), to: Math.max(originX, end) };
}

/** `true` quando o jogador está na faixa do eco — a resposta certa é **não estar ali**. */
export function inEcho(originX: number, direction: 1 | -1, lungePx: number, playerX: number): boolean {
  const { from, to } = echoReach(originX, direction, lungePx);
  return playerX >= from && playerX <= to;
}

/** Vida do chefe nunca fica negativa e nunca sobe. */
export function damageAlferes(hp: number, damage: number): number {
  return Math.max(0, hp - Math.max(0, damage));
}

/** `TST-009`: o 0 HP é processado **uma única vez**, inclusive no mesmo frame da morte. */
export function shouldProcessAlferesDeath(
  state: AlferesState, hp: number, alreadyProcessed: boolean,
): boolean {
  return !alreadyProcessed && hp <= 0 && state !== 'morte';
}

/**
 * O Alferes é imune a knockback e não sai da arena: o clamp da FSM é o mesmo da cena.
 */
export function clampArena(x: number, minX: number, maxX: number): number {
  return Math.min(Math.max(x, minX), maxX);
}
