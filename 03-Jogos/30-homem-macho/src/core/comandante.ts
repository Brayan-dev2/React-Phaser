/**
 * `ENT-006` O Comandante — máquina de estados pura (`LVL-14.md` §5.2–§5.6).
 *
 * Sem Phaser e sem números: os tempos chegam por `ComandanteTiming` (`data/tuning.ts`).
 *
 * As três coisas que separam este chefe dos outros três:
 *
 * 1. **Ele não se desloca.** As oito direções são de **pivô**, não de marcha (§5.1, §6.5).
 *    Se ele andasse, o jogador resolveria tudo correndo e a distância nunca seria decisão.
 * 2. **O céu manda nele.** Na luz ele só tem `ATK-13`; na sombra, só `ATK-14` (§5.2). A FSM
 *    lê o eclipse, não o contrário — `core/eclipse.ts` é quem tem o relógio.
 * 3. **A fase 2 não acelera: inverte.** O ciclo continua 8 s (5/3 → 3/5) e o único número
 *    que muda é a recuperação de `ATK-13`: 1.000 → 850 ms (§5.5).
 */

export type ComandanteState =
  | 'entrada'
  | 'luz'
  | 'sombra'
  | 'telegraph-estocada'
  | 'estocada'
  | 'recuperacao'
  | 'telegraph-lanca'
  | 'lanca'
  | 'desarmado'
  | 'transicao-fase'
  | 'morte';

export type ComandanteAttack = 'ATK-13' | 'ATK-14';

export interface ComandanteTiming {
  /** Hold da entrada dramática, congelado (§5.4). */
  readonly introMs: number;
  /** `ATK-13` — 700 ms de telegraph, 6 tiles a 640 px/s = 600 ms (§5.3). */
  readonly lungeWindupMs: number;
  readonly lungeMs: number;
  /** Fase 1: 1.000 ms. Fase 2: 850 ms (§5.5). */
  readonly lungeRecoverMs: number;
  readonly lungeRecoverPhase2Ms: number;
  /** `ATK-14` — 800 ms de telegraph, projétil de 7 tiles a 500 px/s = 900 ms de voo. */
  readonly spearWindupMs: number;
  readonly spearFlightMs: number;
  /** A janela: 1.200 ms sem ataque, enquanto a lança volta (§5.3). */
  readonly unarmedMs: number;
  /** Hold da transição de fase: 1.000 ms, o mais longo do jogo (§5.5). */
  readonly transitionMs: number;
  readonly deathHoldMs: number;
}

export type ComandanteEvent =
  | 'intro-done'
  | 'attack-chosen'
  | 'windup-done'
  | 'attack-done'
  | 'recover-done'
  | 'spear-returned'
  | 'sky-dark'
  | 'sky-light'
  | 'phase-done'
  | 'died';

/** Fase 2 quando a vida cai a 160 de 320, **uma única vez** (§5.5). */
export function comandantePhase(hp: number, phase2At: number): 1 | 2 {
  return hp <= phase2At ? 2 : 1;
}

/**
 * Ele **nunca** muda de `x` (§6.5). Existe como função para o teste de `AGT-07` ter o que
 * reprovar: qualquer valor diferente de zero é um chefe móvel, e a arena muda de tamanho.
 */
export function comandanteDrift(): 0 {
  return 0;
}

/** Ataque disponível no estado. `null` = estado sem ataque (`desarmado` é a janela). */
export function comandanteAttack(state: ComandanteState): ComandanteAttack | null {
  switch (state) {
    case 'telegraph-estocada':
    case 'estocada':
      return 'ATK-13';
    case 'telegraph-lanca':
    case 'lanca':
      return 'ATK-14';
    default:
      return null;
  }
}

/** Duração do estado. `null` = o estado espera evento (a luz e a sombra têm relógio próprio). */
export function comandanteDuration(
  state: ComandanteState, phase: 1 | 2, t: ComandanteTiming,
): number | null {
  switch (state) {
    case 'entrada': return t.introMs;
    case 'luz':
    case 'sombra': return null;
    case 'telegraph-estocada': return t.lungeWindupMs;
    case 'estocada': return t.lungeMs;
    case 'recuperacao': return phase === 2 ? t.lungeRecoverPhase2Ms : t.lungeRecoverMs;
    case 'telegraph-lanca': return t.spearWindupMs;
    case 'lanca': return t.spearFlightMs;
    case 'desarmado': return t.unarmedMs;
    case 'transicao-fase': return t.transitionMs;
    case 'morte': return t.deathHoldMs;
  }
}

/** Ele está vulnerável? A janela é o `desarmado` — 1.200 ms, ~3 golpes (§5.3, §9). */
export function comandanteOpen(state: ComandanteState): boolean {
  return state === 'desarmado' || state === 'recuperacao';
}

/** Próximo estado; evento que não se aplica devolve o mesmo estado. */
export function nextComandanteState(
  state: ComandanteState, event: ComandanteEvent, phase: 1 | 2,
): ComandanteState {
  if (event === 'died') return 'morte';
  switch (state) {
    case 'entrada':
      return event === 'intro-done' ? 'luz' : state;
    case 'luz':
      if (event === 'attack-chosen') return 'telegraph-estocada';
      if (event === 'sky-dark') return 'sombra';
      return state;
    case 'sombra':
      if (event === 'attack-chosen') return 'telegraph-lanca';
      if (event === 'sky-light') return 'luz';
      return state;
    case 'telegraph-estocada':
      return event === 'windup-done' ? 'estocada' : state;
    case 'estocada':
      return event === 'attack-done' ? 'recuperacao' : state;
    case 'recuperacao':
      return event === 'recover-done' ? 'luz' : state;
    case 'telegraph-lanca':
      return event === 'windup-done' ? 'lanca' : state;
    case 'lanca':
      return event === 'attack-done' ? 'desarmado' : state;
    case 'desarmado':
      return event === 'spear-returned' ? 'luz' : state;
    case 'transicao-fase':
      return event === 'phase-done' ? 'sombra' : state;
    case 'morte':
      return state;
  }
}

/**
 * A luz e a sombra só devolvem para a **outra** quando o eclipse manda — nunca por evento de
 * ataque. A transição de fase só pode começar de luz ou sombra (§5.2), nunca no meio de uma
 * estocada: matar a vida dele durante o golpe não cancela o golpe.
 */
export function comandanteSkyEvent(state: ComandanteState, event: ComandanteEvent): boolean {
  return (state === 'luz' || state === 'sombra') && (event === 'sky-dark' || event === 'sky-light');
}

/** O estado do céu corresponde ao estado do chefe? Serve de asserção ao E2E. */
export function comandanteMatchesSky(state: ComandanteState, sky: 'luz' | 'sombra'): boolean {
  if (sky === 'luz') return state !== 'sombra';
  return state !== 'luz';
}
