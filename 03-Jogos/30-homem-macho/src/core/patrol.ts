/**
 * Patrulha sincronizada — `LVL-04.md` §5.2 (`patrol_sync`).
 *
 * O problema que isto resolve: três Sentinelas com `patrolTiles` iguais mas viradas
 * independentes ficam dessincronizadas em 10 s e a cena vira "três bichos andando".
 * Aqui a **direção é derivada do relógio**, não da posição: todas as que compartilham
 * o mesmo trecho viram no mesmo quadro, para sempre, mesmo com uma delas morta.
 *
 * TS puro (`ADR-01`): o relógio entra por parâmetro; nada aqui importa Phaser.
 */

/**
 * Direção (`1` = direita, `-1` = esquerda) da patrulha sincronizada no instante `t`.
 *
 * A posição percorre `tiles` × `tilePx` e volta (triângulo de período `2 · trecho`).
 * `speed` é px/s; `t` em ms.
 */
export function patrolDirection(
  t: number, tiles: number, speed: number, tilePx: number,
): 1 | -1 {
  const span = Math.max(1, tiles) * tilePx;
  const cycle = 2 * span;
  const travelled = (speed * Math.max(0, t)) / 1000;
  const phase = ((travelled % cycle) + cycle) % cycle;
  return phase <= span ? 1 : -1;
}

/** Distância percorrida desde o início do trecho, útil para posicionar o sprite. */
export function patrolOffset(t: number, speed: number): number {
  return (speed * Math.max(0, t)) / 1000;
}

/**
 * `true` quando todas as patrulhas com o mesmo trecho apontam para o mesmo lado.
 * É a asserção de `patrol_sync`: a formação se mantém em qualquer instante.
 */
export function isInFormation(
  t: number, count: number, tiles: number, speed: number, tilePx: number,
): boolean {
  if (count < 2) return true;
  const first = patrolDirection(t, tiles, speed, tilePx);
  return Array.from({ length: count - 1 }, (_, i) =>
    patrolDirection(t + i * 1, tiles, speed, tilePx)).every((d) => d === first);
}
