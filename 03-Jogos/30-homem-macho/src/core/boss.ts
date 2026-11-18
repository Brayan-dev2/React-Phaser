/**
 * `ENT-003` Guardião da Passagem — máquina de estados pura (`LVL-03.md` §5.2).
 * Sem Phaser e sem números: os tempos chegam por `BossTiming` (vindos de `data/tuning.ts`).
 * `MEC-009` precisa ser idempotente, então a morte é um estado terminal que só processa 1×.
 */

export type BossState =
  | 'entrada'
  | 'idle'
  | 'telegraph'
  | 'investida'
  | 'golpe-area'
  | 'atordoado'
  | 'recuperacao'
  | 'transicao-fase'
  | 'morte';

export type BossAttack = 'ATK-01' | 'ATK-02';

export interface BossTiming {
  readonly introMs: number;
  readonly telegraphMs: number;
  readonly telegraphPhase2Ms: number;
  readonly chargeMs: number;
  readonly recoverMs: number;
  readonly recoverPhase2Ms: number;
  readonly stunMs: number;
  readonly areaTelegraphMs: number;
  readonly areaRecoverMs: number;
  readonly transitionMs: number;
  readonly deathHoldMs: number;
}

export type BossEvent =
  | 'intro-done'
  | 'attack-chosen'
  | 'windup-done'
  | 'charge-done'
  | 'hit-pillar'
  | 'area-done'
  | 'stun-done'
  | 'recover-done'
  | 'phase-done'
  | 'died';

/** Fase 2 começa quando a vida cai a `phase2At` ou menos (`§5.5`). */
export function bossPhase(hp: number, phase2At: number): 1 | 2 {
  return hp <= phase2At ? 2 : 1;
}

/** Duração do estado atual, conforme a fase. `null` = estado espera evento. */
export function stateDuration(state: BossState, phase: 1 | 2, t: BossTiming): number | null {
  switch (state) {
    case 'entrada': return t.introMs;
    case 'idle': return null;
    case 'telegraph': return phase === 2 ? t.telegraphPhase2Ms : t.telegraphMs;
    case 'investida': return t.chargeMs;
    case 'atordoado': return t.stunMs;
    case 'recuperacao': return phase === 2 ? t.recoverPhase2Ms : t.recoverMs;
    case 'golpe-area': return t.areaRecoverMs;
    case 'transicao-fase': return t.transitionMs;
    case 'morte': return t.deathHoldMs;
  }
}

/**
 * Próximo estado. Devolve o mesmo estado quando o evento não se aplica
 * (transição inválida é ignorada, como na FSM do jogador).
 */
export function nextBossState(
  state: BossState,
  event: BossEvent,
  phase: 1 | 2,
  attack: BossAttack = 'ATK-01',
): BossState {
  switch (state) {
    case 'entrada':
      return event === 'intro-done' ? 'idle' : state;

    case 'idle':
      if (event === 'attack-chosen') return 'telegraph';
      if (event === 'died') return 'morte';
      return state;

    case 'telegraph':
      if (event !== 'windup-done') return state;
      return attack === 'ATK-02' && phase === 2 ? 'golpe-area' : 'investida';

    case 'investida':
      if (event === 'hit-pillar') return 'atordoado';
      if (event === 'charge-done') return 'recuperacao';
      return state;

    case 'golpe-area':
      return event === 'area-done' ? 'recuperacao' : state;

    case 'atordoado':
      return event === 'stun-done' ? 'idle' : state;

    case 'recuperacao':
      return event === 'recover-done' ? 'idle' : state;

    case 'transicao-fase':
      return event === 'phase-done' ? 'idle' : state;

    case 'morte':
      return state; // terminal: `MEC-009` processa uma vez só
  }
}

/** Escolha do ataque: em fase 1 só existe `ATK-01`; em fase 2 alterna com `ATK-02`. (§5.3) */
export function chooseAttack(phase: 1 | 2, useArea: boolean): BossAttack {
  return phase === 2 && useArea ? 'ATK-02' : 'ATK-01';
}

/** Vida do chefe nunca fica negativa e nunca sobe. */
export function damageBoss(hp: number, damage: number): number {
  return Math.max(0, hp - Math.max(0, damage));
}

/** `true` uma única vez: é o guarda da idempotência de `MEC-009`. */
export function shouldProcessDeath(state: BossState, hp: number, alreadyProcessed: boolean): boolean {
  return !alreadyProcessed && hp <= 0 && state !== 'morte';
}
