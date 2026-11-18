/**
 * `CEN-100` o eclipse e `DEC-016` as chaves — regra pura (`LVL-14.md` §7 e §8).
 *
 * Duas coisas aqui são a mesma coisa: **o céu não pertence a ninguém** e **a chave é
 * contador, não item**.
 *
 * 1. O eclipse corre em relógio próprio e o chefe **reage** a ele (luz → `ATK-13`, sombra →
 *    `ATK-14`). Se estivesse na FSM do chefe, morreria com ele e a fortaleza ficaria com sol
 *    permanente (§7.2). A dependência é de mão única.
 * 2. `keys` é um contador incrementado por `MEC-009`. O portão exige `≥ 2`, e o jogador
 *    **sempre** chega com 2 (os dois chefes obrigatórios fecham portas). A terceira chave
 *    não abre nada — e o regulamento diz isso por escrito (§8.3).
 *
 * Sem Phaser e sem números: os tempos chegam por `EclipseTiming` (`tuning.ts`).
 */

export type Sky = 'luz' | 'sombra';

export interface EclipseTiming {
  /** O ciclo inteiro: **8 s nas duas fases**. O total não muda (§7.3). */
  readonly cycleMs: number;
  readonly lightPhase1Ms: number;
  readonly shadowPhase1Ms: number;
  readonly lightPhase2Ms: number;
  readonly shadowPhase2Ms: number;
}

export interface SkyState {
  readonly sky: Sky;
  /** Quanto já passou do estado corrente. */
  readonly intoMs: number;
  /** Quanto falta para o próximo estado. */
  readonly remainingMs: number;
  /** Quantos ciclos completos já correram (o E2E e o áudio usam para não repetir cue). */
  readonly cycle: number;
}

/** Luz e sombra da fase. A fase 2 **inverte a proporção**, não acelera nada (§7.3). */
export function skyDurations(phase: 1 | 2, t: EclipseTiming): { light: number; shadow: number } {
  return phase === 2
    ? { light: t.lightPhase2Ms, shadow: t.shadowPhase2Ms }
    : { light: t.lightPhase1Ms, shadow: t.shadowPhase1Ms };
}

/** O estado do céu em `elapsedMs` desde o começo do relógio. Sempre começa na **luz**. */
export function skyAt(elapsedMs: number, phase: 1 | 2, t: EclipseTiming): SkyState {
  const { light, shadow } = skyDurations(phase, t);
  const ciclo = light + shadow;
  if (ciclo <= 0) return { sky: 'luz', intoMs: 0, remainingMs: 0, cycle: 0 };
  const ms = Math.max(0, elapsedMs);
  const cycle = Math.floor(ms / ciclo);
  const dentro = ms - cycle * ciclo;
  if (dentro < light) {
    return { sky: 'luz', intoMs: Math.round(dentro), remainingMs: Math.round(light - dentro), cycle };
  }
  return {
    sky: 'sombra', intoMs: Math.round(dentro - light),
    remainingMs: Math.round(ciclo - dentro), cycle,
  };
}

/**
 * **O eclipse para na morte de `ENT-006`** (§7.4). Como os pilões de LVL-12: quem obedece ao
 * céu é ele. Sem ele, o céu fica como estiver — o jogador sai com o sol onde estava.
 */
export function eclipseStops(stopOnBossDeath: boolean, bossAlive: boolean): boolean {
  return stopOnBossDeath && !bossAlive;
}

/** O chefe só tem **um** ataque por estado do céu (§5.3). */
export function eclipseAttackFor(sky: Sky): 'ATK-13' | 'ATK-14' {
  return sky === 'luz' ? 'ATK-13' : 'ATK-14';
}

/** A fase 2 inverte a proporção e mantém o total: 5/3 → 3/5 (§7.3). */
export function eclipseInverted(phase: 1 | 2, t: EclipseTiming): boolean {
  const { light, shadow } = skyDurations(phase, t);
  return light + shadow === t.cycleMs && shadow > light;
}

// ---------------------------------------------------------------------------
// `DEC-016` — chave é contador, não item (§8.2)
// ---------------------------------------------------------------------------

/** Os itens que **são** chave de chefe. `ITM-011` está aqui: ele conta, e não abre nada. */
export const KEY_ITEMS = ['ITM-004', 'ITM-007', 'ITM-011'] as const;

export function addKey(keys: number): number {
  return Math.max(0, Math.floor(keys)) + 1;
}

/** O portão exige `≥ 2`; a UI mostra `x / 2` e **não** mostra um terceiro slot (§8.2). */
export function gateVerdict(keys: number, required: number): 'abre' | 'faltam' {
  return keys >= required ? 'abre' : 'faltam';
}

/** `3 / 2` — o jogador com sobra **vê** a sobra e entende sozinho (§8.3). */
export function keyLabel(keys: number, required: number): string {
  return `${Math.max(0, Math.floor(keys))} / ${Math.max(1, Math.floor(required))}`;
}

/** Quantas fechaduras o portão desenha: **duas**, lado a lado, sempre (§4.6). */
export function lockCount(required: number): number {
  return Math.max(1, Math.min(2, Math.floor(required)));
}
