/**
 * `CEN-064` areia — a mecânica de atrito de `LVL-08` §7, em TS puro.
 *
 * A areia **não dá dano**: tira velocidade no chão (0,75×), é invisível no ar e acumula
 * só durante a luta. O relógio das âncoras corre em paralelo à FSM do chefe, porque o
 * desgaste é do pátio, não do homem (§5.2).
 */

/** Retângulo de areia em **tiles** (como vem da ficha da sala). */
export interface SandRect {
  readonly from: number;
  readonly to: number;
  readonly topRow: number;
  readonly bottomRow: number;
}

/** Relógio das âncoras: 8 s para a primeira, depois 10 s (fase 1) ou 8 s (fase 2). §7.3 */
export interface SandClockTiming {
  readonly firstAnchorMs: number;
  readonly phase1Ms: number;
  readonly phase2Ms: number;
  readonly maxAnchors: number;
}

export const SAND_CLOCK: SandClockTiming = {
  firstAnchorMs: 8_000,
  phase1Ms: 10_000,
  phase2Ms: 8_000,
  maxAnchors: 4,
};

/** Estado do relógio: quantas âncoras já acordaram e quanto falta para a próxima. */
export interface SandClockState {
  readonly anchors: number;
  readonly elapsedMs: number;
  readonly phase: 1 | 2;
}

export function startSandClock(): SandClockState {
  return { anchors: 0, elapsedMs: 0, phase: 1 };
}

/** Intervalo até a próxima âncora, conforme a fase e se é a primeira. */
export function nextAnchorDelay(state: SandClockState, t: SandClockTiming = SAND_CLOCK): number {
  if (state.anchors === 0) return t.firstAnchorMs;
  return state.phase === 2 ? t.phase2Ms : t.phase1Ms;
}

/**
 * Avança o relógio. Devolve o estado novo e **quantas âncoras acordaram** neste passo
 * (pode ser mais de uma se o passo for grande, mas nunca passa do máximo).
 */
export function stepSandClock(
  state: SandClockState, deltaMs: number, t: SandClockTiming = SAND_CLOCK,
): { state: SandClockState; activated: number } {
  if (state.anchors >= t.maxAnchors) return { state: { ...state, elapsedMs: 0 }, activated: 0 };
  if (deltaMs <= 0) return { state, activated: 0 };

  let anchors = state.anchors;
  let elapsed = state.elapsedMs + deltaMs;
  let activated = 0;
  // laço com guarda: um `delta` absurdo (aba em segundo plano) não pode acordar o piso todo
  while (anchors < t.maxAnchors && elapsed >= nextAnchorDelay({ ...state, anchors }, t)) {
    elapsed -= nextAnchorDelay({ ...state, anchors }, t);
    anchors += 1;
    activated += 1;
  }
  return { state: { anchors, elapsedMs: elapsed, phase: state.phase }, activated };
}

/** A entrada da fase 2 **reinicia** o relógio em 8 s (§7.3). */
export function enterPhase2(state: SandClockState): SandClockState {
  return { anchors: state.anchors, elapsedMs: 0, phase: 2 };
}

/** A areia **zera na morte** (§10.1) — o oposto do contrapeso de LVL-05. */
export function zeroSand(): SandClockState {
  return startSandClock();
}

/**
 * Multiplicador de velocidade no chão. Fora da areia — ou no ar — vale 1.
 * `onGround` é obrigatório: a areia é invisível no ar (§7.1).
 */
export function groundSpeedMultiplier(
  onSand: boolean, onGround: boolean, multiplier: number,
): number {
  return onSand && onGround ? multiplier : 1;
}

/** `true` quando o ponto (px) está dentro de algum retângulo de areia da sala. */
export function pointInSand(
  rects: readonly SandRect[], x: number, y: number, tile: number,
): boolean {
  return rects.some((r) => x >= r.from * tile && x <= (r.to + 1) * tile
    && y >= r.topRow * tile && y <= (r.bottomRow + 1) * tile);
}

/** Retângulo de uma âncora ativa: 3 tiles de largura, no piso. §4.4 */
export function anchorToSand(column: number, floorRow: number, widthTiles: number): SandRect {
  return { from: column - 1, to: column + widthTiles - 2, topRow: floorRow - 1, bottomRow: floorRow - 1 };
}

/** Junta a areia fixa da sala com as âncoras já ativas. */
export function activeSand(
  base: readonly SandRect[], anchors: readonly number[], activeAnchors: number,
  floorRow: number, widthTiles = 3,
): SandRect[] {
  const fromAnchors = anchors
    .slice(0, Math.max(0, Math.min(activeAnchors, anchors.length)))
    .map((c) => anchorToSand(c, floorRow, widthTiles));
  return [...base, ...fromAnchors];
}
