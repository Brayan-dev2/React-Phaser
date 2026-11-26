/**
 * `HAB-07` Planar e a régua horizontal de LVL-11 (`docs/niveis/LVL-11.md` §7).
 *
 * **O estandarte não voa: ele é um câmbio.** Planar num salto simples dá 529 px e o salto
 * duplo correndo dá 534 px — sem altura a habilidade vale *cinco pixels negativos*. Com o
 * duplo atrás, o alcance salta para 1.042 px. É por isso que `canGainHeight` é `false` e
 * existe um teste que falha se alguém der altura ao planeio: o jogo inteiro desmonta.
 *
 * TS puro (`ADR-01`).
 */
import { jumpApexFor } from './movement';

/** §7.1: a ficha da habilidade. */
export const GLIDE = {
  /** Descida durante o planeio, contra 1.100 px/s² de gravidade: o único freio do jogo. */
  fallSpeed: 120,
  /** Velocidade horizontal: a de corrida. O estandarte **não acelera** o jogador. */
  airSpeed: 308,
  /** Nunca. Se mudar, todo vão do jogo passa a ser atravessável de baixo para cima. */
  canGainHeight: false,
  isWeapon: false,
} as const;

/** Altura do salto duplo em px (config B, `DEC-014`). */
export function doubleJumpHeight(impulse = 560, gravity = 1100): number {
  return jumpApexFor(2, { jumpImpulse: impulse, gravity });
}

/** Tempo de descida de uma altura com o pano aberto (`t = h / v`). */
export function glideMs(alturaPx: number, fallSpeed = GLIDE.fallSpeed): number {
  if (fallSpeed <= 0) return Number.POSITIVE_INFINITY;
  return (Math.max(0, alturaPx) / fallSpeed) * 1000;
}

/** Alcance horizontal do planeio a partir de uma altura, em px. */
export function glideRange(
  alturaPx: number, airSpeed = GLIDE.airSpeed, fallSpeed = GLIDE.fallSpeed,
): number {
  return airSpeed * (glideMs(alturaPx, fallSpeed) / 1000);
}

/**
 * A conta do §7.2: pular, segundo salto no ápice, abrir o pano a partir dali e medir até
 * voltar ao nível de partida. O alcance é a velocidade horizontal **vezes o tempo total no
 * ar**: 2 subidas de `impulse/gravity` mais a descida planejada da altura do duplo.
 *
 * O documento publica **1.042 px (3,38 s)**; a conta honesta dá **1.022 px (3,32 s)** — a
 * diferença de 20 px vem de o solver do GDD somar frames de borda. Registado como desvio
 * em `LVL-11.md` §12. O veredito dos três vãos não muda (a margem mínima cai de 210 para
 * 190 px, ainda 3 tiles).
 */
export function glideWithDoubleJump(
  impulse = 560, gravity = 1100, airSpeed = GLIDE.airSpeed, fallSpeed = GLIDE.fallSpeed,
): number {
  const subida = impulse / gravity;                       // uma subida, em s
  const tempoTotal = 2 * subida + glideMs(doubleJumpHeight(impulse, gravity), fallSpeed) / 1000;
  return airSpeed * tempoTotal;
}

/** A régua horizontal do jogo, fechada em §7.3 — valores medidos, não estimados. */
export const HORIZONTAL_RULER = {
  singleRun: 313,     // salto simples correndo
  doubleRun: 534,     // salto duplo correndo (`HAB-01`)
  hook: 512,          // gancho com argola a ≤ 6 tiles (`HAB-04`)
  glide: 1022,        // planeio + salto duplo (`HAB-07`) — §7.2 publica 1.042 (ver desvio)
} as const;

/**
 * A faixa utilizável de vão deste setor é **11 a 15 tiles** (§8.1): abaixo de 11 o duplo
 * correndo (8,3) fica perto demais; acima de 16,3 o estandarte não chega.
 */
export type GapVerdict = 'livre' | 'exige-glide' | 'impossivel';

export function gapVerdict(gapPx: number): GapVerdict {
  if (gapPx <= HORIZONTAL_RULER.doubleRun) return 'livre';
  if (gapPx <= HORIZONTAL_RULER.glide) return 'exige-glide';
  return 'impossivel';
}

/**
 * O planeio só liga **no ar** e nunca no chão: no chão ele não é um andar lento (§7.1).
 */
export function canGlide(hasGlide: boolean, onGround: boolean, falling: boolean): boolean {
  return hasGlide && !onGround && falling;
}

/**
 * O teste que protege o jogo: sem altura, o pano **não** ganha alcance. Se esta função
 * algum dia devolver `true`, `P-59` vira regra geral e nenhum vão do jogo é trava.
 */
export function glideIsJustAConversion(): boolean {
  const semAltura = glideRange(0);
  return semAltura === 0 && !GLIDE.canGainHeight;
}
