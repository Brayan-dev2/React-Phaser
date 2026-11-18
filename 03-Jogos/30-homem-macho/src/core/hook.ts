/**
 * `HAB-04` Gancho e a travessia de canal de LVL-09 (`docs/niveis/LVL-09.md` §6).
 *
 * O gancho **não é arma e não é projétil**: é um estado do jogador (`aim → pull → hang →
 * release`), e o alvo é só argola (`CEN-072`). A regra mora aqui, em TS puro (`ADR-01`),
 * porque o erro fácil deste setor é de conta, não de desenho: sem o impulso vertical do
 * salto do gancho a travessia cai de 7,6 tiles para 3,5 e a sala fica impossível (§6.3).
 */

/** §6.2: alcance de 6 tiles (384 px), hemisfério superior. */
export const HOOK_REACH_PX = 384;
/** §6.2: 900 px/s — 6 tiles em 0,43 s. */
export const HOOK_PULL_SPEED = 900;
/** §6.2: o salto do gancho é **horizontal + impulso**, nunca só horizontal. */
export const HOOK_JUMP_SPEED = 380;
/** §6.2: o gancho não dá dano, não puxa inimigo, não quebra cenário. */
export const HOOK_IS_WEAPON = false;
/** `LVL-09` §6.1 / `LVL-11` §7.3: alcance horizontal do salto duplo em corrida. */
export const DOUBLE_JUMP_REACH_PX = 378;

export interface Ring {
  readonly x: number;
  readonly y: number;
}

/**
 * A argola está no alcance? Só conta o **hemisfério superior**: pendurar exige que a
 * argola esteja acima do corpo, e o resto do círculo é teto, não alvo (§6.2).
 */
export function isInReach(ring: Ring, x: number, y: number, reach = HOOK_REACH_PX): boolean {
  const dx = ring.x - x;
  const dy = ring.y - y;            // negativo = argola acima
  if (dy > 0) return false;
  return Math.hypot(dx, dy) <= reach;
}

/**
 * Escolhe a argola: primeiro as que estão no alcance, depois a mais próxima; empate
 * resolvido pela direção em que o herói olha (`facing`), para o alvo não "pular" sozinho.
 */
export function pickRing(
  rings: readonly Ring[], x: number, y: number, facing: number, reach = HOOK_REACH_PX,
): Ring | null {
  const alcancaveis = rings.filter((r) => isInReach(r, x, y, reach));
  if (alcancaveis.length === 0) return null;
  const score = (r: Ring): number => {
    const d = Math.hypot(r.x - x, r.y - y);
    const contraMao = Math.sign(r.x - x) === -facing && Math.sign(r.x - x) !== 0 ? 24 : 0;
    return d + contraMao;
  };
  return alcancaveis.reduce((best, r) => (score(r) < score(best) ? r : best));
}

/** Tempo de puxada até a argola: `t = d / v` (§6.2). */
export function pullMs(distancePx: number, speed = HOOK_PULL_SPEED): number {
  if (speed <= 0) return Number.POSITIVE_INFINITY;
  return (Math.max(0, distancePx) / speed) * 1000;
}

/**
 * Onde o **pé** do corpo fica pendurado: logo abaixo da argola, com o topo do corpo
 * tocando-a (§6.2: ocupa as 2 linhas sob a argola). `y` é o pé porque o `Player` tem
 * origem `(0.5, 1)` — devolver o centro já custou uma travessia perdida.
 */
export function hangPosition(ring: Ring, bodyHeight: number, gapPx = 0): { x: number; y: number } {
  return { x: ring.x, y: ring.y + bodyHeight + gapPx };
}

/**
 * Tempo no ar de um salto do gancho que termina `dropPx` **abaixo** do ponto de partida.
 * Integração de Euler a 60 Hz, a mesma de `core/movement.ts`: forma fechada mente na
 * borda e é justamente a borda que decide se o canal é atravessável (§6.3).
 */
export function airTimeMs(
  dropPx: number, impulse = 560, gravity = 1100, hz = 60,
): number {
  const dt = 1 / hz;
  let v = impulse;
  let y = 0;
  let steps = 0;
  while (y > -Math.max(0, dropPx) && steps < 600) {
    v -= gravity * dt;
    y += v * dt;
    steps++;
  }
  return steps * dt * 1000;
}

/** Alcance horizontal do salto do gancho, em px, caindo `dropPx` (§6.3: 1,29 s → 490 px). */
export function hookJumpReach(
  dropPx: number, speedX = HOOK_JUMP_SPEED, impulse = 560, gravity = 1100,
): number {
  return speedX * (airTimeMs(dropPx, impulse, gravity) / 1000);
}

/**
 * O vão está fora do salto duplo? É a definição de trava de vão deste projeto
 * (`DEC-009`/`PAT-LD-09`): ≥ 8 tiles, porque 6 tiles deixariam 6 px de margem.
 */
export function gapBlocksDoubleJump(gapPx: number): boolean {
  return gapPx > DOUBLE_JUMP_REACH_PX;
}

/**
 * **A queda do §6.3 não é `dropPx`.** O documento calcula 1,29 s somando 0,509 s de subida
 * com a queda de 334 px *a partir do ápice* — mas o corpo desce 334 px **abaixo do ponto de
 * partida**, então a queda é `334 + 142` (o ápice do impulso de 560) e o tempo é 1,43 s.
 * O alcance real é **545 px**, não 490: o erro é de 12%, e ele aumenta a folga da travessia
 * em vez de reduzi-la. Registrado como desvio em `LVL-09.md` §11.
 */
export function trailingDifferenceMs(dropPx: number): number {
  const docMs = 509 + Math.sqrt((2 * Math.max(0, dropPx)) / 1100) * 1000;   // conta do §6.3
  return airTimeMs(dropPx) - docMs;
}

/** O canal de L09-05 é atravessável **com** gancho: pendurado em x=14, piso em x=18. */
export function crossesFromHang(gapAfterRingPx: number, dropPx: number): boolean {
  return hookJumpReach(dropPx) >= gapAfterRingPx;
}
