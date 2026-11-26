/**
 * `CEN-096` corrente de ar e `CEN-095` eco — regra pura (`LVL-13.md` §5 e §6).
 *
 * **A regra que sustenta o jogo inteiro: quem sobe é a corrente, não o pano.**
 * `HAB-07` só impede a queda (teto de 120 px/s, `core/glide.ts`); dentro de uma coluna de
 * vento o jogador sobe a 140 px/s **porque o vento empurra**. Se alguém inverter isto — dar
 * ganho de altura ao estandarte —, todos os vãos de LVL-11 passam a ser atravessáveis de
 * baixo para cima e os doze setores anteriores viram outro jogo (§6.2).
 *
 * Sem Phaser, sem números mágicos: os valores chegam por `UpdraftTiming` (`tuning.ts`).
 */

/** Retângulo declarado na ficha da sala — **não** é colisão, é região (§3). */
export interface UpdraftRect {
  /** Coluna esquerda, em px. */
  readonly left: number;
  readonly right: number;
  /** Topo (a coluna vai ao teto: `to_y = 0`, §6.4). */
  readonly top: number;
  /** Piso da coluna. */
  readonly bottom: number;
}

export interface UpdraftTiming {
  /** **140 px/s** e não 120: a 120 o jogador ficaria parado na coluna (§6.3). */
  readonly risePxS: number;
  /** Teto de queda do pano, para provar que a corrente é mais rápida do que ele. */
  readonly glideFallPxS: number;
  /** Altura do alçapão acima do piso, em px (6 tiles). */
  readonly hatchPx: number;
  /** Alcance vertical do salto duplo (`DEC-014`), para a margem da trava. */
  readonly doubleJumpPx: number;
}

/** O centro do corpo está dentro da coluna? */
export function inUpdraft(rect: UpdraftRect, centerX: number, centerY: number): boolean {
  return centerX >= rect.left && centerX <= rect.right
    && centerY >= rect.top && centerY <= rect.bottom;
}

/**
 * Velocidade vertical imposta pela corrente. **Negativa = subir.**
 *
 * Só sobe com `HAB-07` **e** com o pano aberto. Sem o pano, a coluna não segura ninguém:
 * é a diferença entre um paraquedas e um elevador (§6.2).
 */
export function updraftVelocity(
  hasGlide: boolean, gliding: boolean, inside: boolean, rise: number,
): number {
  return hasGlide && gliding && inside ? -Math.abs(rise) : 0;
}

/** A trava 13 → 14 é a **conjunção**: pano sozinho não sobe, corrente sozinha não segura. */
export function updraftVerdict(
  hasGlide: boolean, gliding: boolean, inside: boolean,
): 'sobe' | 'cai-pano' | 'cai-vento' | 'cai' {
  if (!inside) return hasGlide && gliding ? 'cai-pano' : 'cai';
  if (!hasGlide) return 'cai-vento';
  return gliding ? 'sobe' : 'cai-vento';
}

/** Tempo de subida até o alçapão: 384 px a 140 px/s = **2,74 s** (§6.3). */
export function riseTimeMs(hatchPx: number, risePxS: number): number {
  if (risePxS <= 0) return Infinity;
  return Math.round((hatchPx / risePxS) * 1000);
}

/** Margem da trava: 384 px de alçapão contra 276 px de salto duplo = **108 px** (§7). */
export function hatchShortfall(t: UpdraftTiming): number {
  return t.hatchPx - t.doubleJumpPx;
}

/** Quantos px/s a corrente supera a queda do pano — a margem de `PAT-LD-09` (§6.3). */
export function riseMargin(t: UpdraftTiming): number {
  return t.risePxS - t.glideFallPxS;
}

// ---------------------------------------------------------------------------
// `CEN-095` o eco — o setor não tem voz própria (§5)
// ---------------------------------------------------------------------------

/** `AMB-13`: o abismo devolve o som do jogador **700 ms** depois (efeito de bus). */
export function echoAt(history: readonly { x: number; y: number; t: number }[], now: number, delayMs: number)
  : { x: number; y: number } | null {
  for (let i = history.length - 1; i >= 0; i--) {
    if (now - history[i].t >= delayMs) return { x: history[i].x, y: history[i].y };
  }
  return null;
}

/**
 * A silhueta de eco **sai** em `reduce_motion` (`VIS-009`): uma cópia do jogador atrás
 * dele confunde a leitura de posição. O eco **sonoro** fica — ele é informação.
 */
export function echoGhostVisible(reducedMotion: boolean): boolean {
  return !reducedMotion;
}

/** Duração da queda longa: **3.000 ms**, e **900 ms** com movimento reduzido (§8). */
export function longFallMs(fallMs: number, reducedMs: number, reducedMotion: boolean): number {
  return reducedMotion ? reducedMs : fallMs;
}

/** A queda longa **salva antes e depois** e nunca machuca (`DEC-011`, §8). */
export const LONG_FALL_DAMAGE = 0;

/** `PAT-LD-08` (§7.1): o atalho pela corrente A volta duas salas. Não é soft lock. */
export function shortcutCost(rooms: number): number {
  return Math.max(0, Math.floor(rooms));
}
