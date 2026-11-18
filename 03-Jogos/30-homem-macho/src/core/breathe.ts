/**
 * `HAB-06` Fôlego e a água de LVL-06 (`docs/niveis/LVL-06.md` §5).
 *
 * A unidade deste setor é **segundo**, não tile: ficar parado embaixo d'água mata o
 * relógio, não a vida. Por isso tudo aqui é ms e o afogamento nunca encosta em `MEC-004`.
 *
 * TS puro (`ADR-01`).
 */

/** §5.1: 6 s sem a habilidade, 20 s com ela (×3,3). */
export const BREATH_BASE_MS = 6_000;
export const BREATH_HABILIDADE_MS = 20_000;

/** §5.1: nadar é universal; as velocidades não mudam com a habilidade. */
export const SWIM_SPEED_X = 160;
export const SWIM_SPEED_Y = 120;

/**
 * `UI-14` (`DEC-041`): o **nível** do fôlego multiplica o tempo. Sem a habilidade o fator é
 * ignorado — não há nível para quem não tem a habilidade, e um `1` explícito é o que a cena passa.
 */
export function maxBreath(hasFolego: boolean, fator = 1): number {
  const base = hasFolego ? BREATH_HABILIDADE_MS : BREATH_BASE_MS;
  if (!hasFolego) return base;
  const f = Number.isFinite(fator) && fator > 0 ? fator : 1;
  return Math.round(base * f);
}

/** Consome fôlego enquanto submerso. Nunca passa de zero para baixo. */
export function consume(breathMs: number, deltaMs: number): number {
  return Math.max(0, breathMs - Math.max(0, deltaMs));
}

/** Ao emergir a recuperação é **imediata** (§5.1) — não há barra enchendo. */
export function refill(hasFolego: boolean, fator = 1): number {
  return maxBreath(hasFolego, fator);
}

export function isDrowning(breathMs: number): boolean {
  return breathMs <= 0;
}

/** Tempo submerso de uma travessia, em ms (`t = distância / velocidade`). */
export function swimTimeMs(distancePx: number, speedPx = SWIM_SPEED_X): number {
  if (speedPx <= 0) return Number.POSITIVE_INFINITY;
  return (Math.max(0, distancePx) / speedPx) * 1000;
}

/**
 * A trava de saída de LVL-06 é **temporal** (§8.2): 19 tiles de galeria levam ~7,6 s,
 * o que não cabe em 6 s e cabe com folga em 20 s.
 */
export function canCross(distancePx: number, hasFolego: boolean, speedPx = SWIM_SPEED_X): boolean {
  return swimTimeMs(distancePx, speedPx) <= maxBreath(hasFolego);
}

/** §5.3: dois afogamentos na mesma sala disparam a dica de `UI`. */
export function shouldShowDrownHint(drownsInRoom: number): { show: boolean; line: string } {
  return drownsInRoom >= 2
    ? { show: true, line: 'A ÁGUA É FUNDA DEMAIS. FALTA FÔLEGO.' }
    : { show: false, line: '' };
}
