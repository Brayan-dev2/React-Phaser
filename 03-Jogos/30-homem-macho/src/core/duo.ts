/**
 * `ENT-007` O Guardião Duplo — **um chefe, dois corpos** (`LVL-15.md` §5).
 *
 * Sem Phaser e sem números: os valores chegam por `DuoTiming` (`data/tuning.ts`).
 *
 * Este é o único chefe do jogo com um estado **entre cair e morrer**: um corpo a 0 HP fica
 * em `queda`, visível, e o sobrevivente **recua** para canalizar a revivificação por 4 s. Três
 * coisas que a luta afirma e que nenhuma outra afirma:
 *
 * 1. **`MEC-009` exige os dois.** Um corpo caído não é morte; são precisos os dois a 0 HP
 *    dentro da mesma janela. Matar um de cada vez é o erro que a luta pune (§5.6).
 * 2. **A revivificação é infinita.** Punição limitada ensina a **esperar**; ilimitada ensina
 *    a **não matar um de cada vez**. E como a punição é só tempo, o erro custa 4 s (§5.5).
 * 3. **A suspensão tem teto.** Dois selos no jogador o imobilizam por 800 ms — a única perda
 *    de controle do jogo, sempre menor que o windup + arco de `ATK-16` (§5.3).
 */

export type DuoBodyState =
  | 'entrada'
  | 'ativo'
  | 'telegraph'
  | 'golpe'
  | 'recuperacao'
  | 'queda'
  | 'canalizando'
  | 'morte';

export type DuoAttack = 'ATK-16' | 'ATK-17';

export interface DuoTiming {
  readonly introMs: number;
  /** `ATK-16` lanterna: 700 ms de windup, arco de 4 tiles, 1.000 ms de recuperação. */
  readonly lanternWindupMs: number;
  readonly lanternMs: number;
  readonly lanternRecoverMs: number;
  /** `ATK-17` selo: 600 ms de windup, projétil lento de 6 tiles a 400 px/s. */
  readonly sealWindupMs: number;
  readonly sealFlightMs: number;
  readonly sealRecoverMs: number;
  /** A janela de revivificação: 4.000 ms. */
  readonly reviveMs: number;
  /** Interrupção: 30 de dano em quem canaliza (§5.5). */
  readonly interruptDamage: number;
  /** Teto de perda de controle (`P-70`). */
  readonly suspendMaxMs: number;
}

export interface DuoEvent {
  readonly type: 'attack-chosen' | 'windup-done' | 'attack-done' | 'recover-done'
    | 'body-down' | 'revive-done' | 'revive-interrupted' | 'both-down' | 'died';
}

/** Um corpo caiu e o outro está de pé: é isto que separa `queda` de `morte` (§5.2). */
export function duoFelled(hp: number): boolean {
  return hp <= 0;
}

/**
 * `MEC-009` (§5.6): **os dois a 0 HP dentro da mesma janela.** Com um corpo vivo devolve
 * `false` — e é essa linha que impede a luta de terminar com um carimbo só.
 */
export function duoDefeated(hpA: number, hpB: number): boolean {
  return duoFelled(hpA) && duoFelled(hpB);
}

/** O corpo revivido volta com **50%** (`revive_pct`), arredondado para baixo. */
export function reviveHp(maxHp: number, pct: number): number {
  return Math.max(1, Math.floor((maxHp * pct) / 100));
}

/** A janela de 4 s corre desde a queda: `elapsed >= reviveMs` fecha a canalização. */
export function reviveWindowOpen(elapsedMs: number, timing: DuoTiming): boolean {
  return elapsedMs >= 0 && elapsedMs < timing.reviveMs;
}

/**
 * Interromper exige **30 de dano acumulado** em quem canaliza (§5.5) — não 30 de um golpe:
 * dois golpes de 20 também servem, e é assim que a janela de 4 s fica folgada.
 */
export function reviveInterrupted(danoAcumulado: number, timing: DuoTiming): boolean {
  return danoAcumulado >= timing.interruptDamage;
}

/**
 * A suspensão (`ATK-17`) só acontece com **dois** selos — um selo não faz nada além de
 * aparecer no HUD. Dois selos seguram por 800 ms, e **nunca mais** que o teto (`P-70`).
 */
export function suspensionMs(seals: number, timing: DuoTiming): number {
  return seals >= 2 ? timing.suspendMaxMs : 0;
}

/** O HUD conta os selos: `1 / 2` e `2 / 2`, e nunca mais que isso (§5.3). */
export function sealLabel(seals: number): string {
  return `${Math.min(2, Math.max(0, Math.floor(seals)))} / 2`;
}

/** Cada corpo aplica **um** selo; dois corpos, dois selos, e é o teto da mecânica. */
export function addSeal(seals: number): number {
  return Math.min(2, Math.max(0, Math.floor(seals)) + 1);
}

/** O selo expira sozinho: um selo solto não fica no jogador para sempre. */
export function sealExpired(ageMs: number, lifeMs: number): boolean {
  return ageMs >= lifeMs;
}

/** Ciclo do corpo enquanto os dois estão de pé: 700 + 300 + 1.000 = 2.000 ms (§6.3). */
export function duoCycleMs(t: DuoTiming): number {
  return t.lanternWindupMs + t.lanternMs + t.lanternRecoverMs;
}

/**
 * Taxa efetiva de ataques com os dois de pé é o **dobro** — e é por isso que cada corpo bate
 * 20 e não 26 (§6.2). A margem não está na tabela de dano: está na taxa.
 */
export function effectiveCycleMs(bodiesAlive: number, t: DuoTiming): number {
  const vivo = Math.max(1, Math.min(2, bodiesAlive));
  return duoCycleMs(t) / vivo;
}

/** Duração de um estado; `null` = espera evento (o `ativo` escolhe o ataque). */
export function duoDuration(
  state: DuoBodyState, attack: DuoAttack, t: DuoTiming,
): number | null {
  switch (state) {
    case 'entrada': return t.introMs;
    case 'ativo': return null;
    case 'telegraph': return attack === 'ATK-16' ? t.lanternWindupMs : t.sealWindupMs;
    case 'golpe': return attack === 'ATK-16' ? t.lanternMs : t.sealFlightMs;
    case 'recuperacao': return attack === 'ATK-16' ? t.lanternRecoverMs : t.sealRecoverMs;
    case 'queda': return null;          // a janela de 4 s é do **outro** corpo
    case 'canalizando': return t.reviveMs;
    case 'morte': return 600;
  }
}

/** Próximo estado; evento que não se aplica devolve o mesmo estado. */
export function nextDuoState(
  state: DuoBodyState, event: DuoEvent['type'], attack: DuoAttack = 'ATK-16',
): DuoBodyState {
  switch (state) {
    case 'entrada':
      return event === 'windup-done' || event === 'attack-chosen' ? 'ativo' : state;
    case 'ativo':
      if (event === 'attack-chosen') return 'telegraph';
      if (event === 'body-down') return 'queda';
      if (event === 'both-down' || event === 'died') return 'morte';
      return state;
    case 'telegraph':
      return event === 'windup-done' ? 'golpe' : state;
    case 'golpe':
      return event === 'attack-done' ? 'recuperacao' : state;
    case 'recuperacao':
      return event === 'recover-done' ? 'ativo' : state;
    case 'queda':
      if (event === 'both-down') return 'morte';
      if (event === 'revive-done') return 'ativo';
      return state;
    case 'canalizando':
      if (event === 'revive-done') return 'ativo';
      if (event === 'revive-interrupted') return 'ativo';
      if (event === 'both-down') return 'morte';
      return state;
    case 'morte':
      return state;
  }
}

/** Os dois corpos são **equivalentes**: nenhum tem fase, agressividade ou vida diferente. */
export function duoBodies(maxHp: number): readonly number[] {
  return [maxHp, maxHp];
}

/** `ATK-16`/`ATK-17`: o corpo alterna, e o segundo corpo escolhe o ataque oposto. */
export function duoAttackFor(index: number, previous: DuoAttack | null): DuoAttack {
  if (previous === null) return index === 0 ? 'ATK-16' : 'ATK-17';
  return previous === 'ATK-16' ? 'ATK-17' : 'ATK-16';
}
