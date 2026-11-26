/**
 * `HAB-03` Escalada e o alçapão de LVL-10 (`docs/niveis/LVL-10.md` §6 e §7).
 *
 * Este é o setor em que a **altura volta a ser trava** — e ela volta de graça: a saída
 * sobe para o teto (`DEC-015`) em vez de a sala ficar mais alta. O alçapão fica a 6 tiles
 * do piso; o salto duplo chega a 4,3; faltam **108 px**. É a única margem vertical do jogo
 * que o duplo não cobre, e por isso ela é a trava 10 → 11.
 *
 * TS puro (`ADR-01`).
 */
import { jumpApexFor } from './movement';

/** §7.1: a garra só agarra parede `climbable` — parede comum não é sinal de nada. */
export const CLIMB = {
  /**
   * Adesão: **100 ms de contato antes de agarrar**. É o piso do "coyote" ao contrário — o herói
   * não cola no instante em que roça numa parede, e é isso que impede a garra de o prender sem
   * querer ao passar por uma.
   *
   * Não confundir com o **tique de contato** (`contactRefreshMs`): o tempo que o `encostando`
   * aguenta depois de o corpo deixar de tocar. Sem ele, subir **descolava** — a subida tira o
   * corpo da parede e o contacto seguinte já não existia (o relato de L10-05, segunda metade).
   */
  gripMs: 100,
  upSpeed: 90,        // px/s — 6 tiles = 4,3 s
  downSpeed: 240,     // descida controlada, mais rápida de propósito
  /**
   * `DEC-049`: quantos ms o contacto com a parede continua a valer depois de o corpo se afastar
   * dela. Sem isto, a subida era um ciclo de agarrar/soltar: o herói sobe, deixa de tocar, o
   * `encostando` devolve `false`, o input deixa de contar e a garra larga. 160 ms é folgado
   * para um passo de física e curto para se notar.
   */
  contactRefreshMs: 160,
  wallJumpX: 420,     // px/s perpendicular
  wallJumpY: 560,     // = impulso de `DEC-014`
  isWeapon: false,
} as const;

/** `DEC-015`: alçapão no teto, 2 tiles de largura, dois sentidos. */
export const HATCH = {
  widthTiles: 2,
  /** Altura do teto a partir do topo do piso: `y=0` para piso em `y=7` = 6 tiles. */
  rowsAboveFloor: 6,
  requires: 'HAB-03',
} as const;

/** Altura do alçapão em px (6 tiles). */
export const HATCH_HEIGHT_PX = HATCH.rowsAboveFloor * 64;

/** Altura do salto duplo com a config canônica B (`DEC-014`): 276 px. */
export function doubleJumpHeight(impulse = 560, gravity = 1100): number {
  return jumpApexFor(2, { jumpImpulse: impulse, gravity });
}

/** Quanto falta para o alçapão — 108,17 px (o documento arredonda para 108). */
export function hatchShortfall(impulse = 560, gravity = 1100): number {
  return HATCH_HEIGHT_PX - doubleJumpHeight(impulse, gravity);
}

/** O alçapão exige a garra? Sim, e é a única trava vertical que funciona. */
export function hatchNeedsClimb(impulse = 560, gravity = 1100): boolean {
  return hatchShortfall(impulse, gravity) > 0;
}

/**
 * Aderência: só agarra quem tem a garra, só em parede `climbable`, só com direção
 * pressionada **para dentro** da parede, e só depois de `gripMs` encostado (§7.1).
 */
export function canGrip(
  hasClimb: boolean, climbable: boolean, pressingInto: boolean, touchingMs: number,
): boolean {
  return hasClimb && climbable && pressingInto && touchingMs >= CLIMB.gripMs;
}

/**
 * **Que gesto sobe uma parede** — e a razão de existir desta função.
 *
 * O dono relatou: «a escada em caracol de L10-05, o personagem não sobe, acabou virando uma
 * parede». Estava exato: a subida estava ligada ao **pulo** (`W`/`ESPAÇO`/`↑`), e na parede
 * essas teclas são o **salto de parede** — empurram para longe e soltam a aderência. O herói
 * agarrava, saltava, voltava a agarrar, e subia aos saltos de 16 px: uma parede que se agarra e
 * não se escala.
 *
 * A regra passa a ser a que não colide com nada: **`W`/`↑` sobe, `S`/`↓` desce, e o salto só
 * existe como salto de parede quando a direção é pressionada no mesmo instante** — o gesto de
 * sempre para saltar de uma parede para a outra. Segurar só a subida sobe; segurar só a descida
 * desce; soltar tudo fica pendurado (a garra agarra, não escorrega).
 *
 * Isto **não muda o que `MEC-001` promete**: `W` continua a ser pulo no chão. O que muda é o que
 * ele faz **pendurado numa parede**, que é outro estado e não tem de partilhar o gesto.
 */
export type GestoNaParede = 'subir' | 'descer' | 'parado' | 'salto-de-parede';

export function gestoNaParede(
  input: { up: boolean; down: boolean; jumpPressed: boolean; left: boolean; right: boolean },
): GestoNaParede {
  /*
   * **O salto de parede é só o pulo.** Exigir a direção contrária parecia natural — e era
   * impossível: carregar na direção contrária **solta a garra** (`updateClimbCandidate` larga a
   * aderência quando o jogador deixa de empurrar para dentro da parede), portanto o salto nunca
   * chegava a acontecer. Quem quer saltar da parede carrega no pulo; o corpo sabe de que lado
   * está a parede e salta para o lado oposto (`wallJumpVelocity`).
   */
  if (input.jumpPressed) return 'salto-de-parede';
  /*
   * A ordem importa: **descer ganha a subir** quando as duas estão premidas. Quem está agarrado
   * a uma parede e carrega nas duas quer sair de lá (é o reflexo de quem se sente preso), e um
   * herói que sobe quando o jogador pede para descer é a mesma queixa outra vez, ao contrário.
   */
  if (input.down) return 'descer';
  if (input.up) return 'subir';
  return 'parado';
}

/** Tempo de subida de uma parede, em ms (`t = h / v`). */
export function climbTimeMs(alturaPx: number, speed = CLIMB.upSpeed): number {
  if (speed <= 0) return Number.POSITIVE_INFINITY;
  return (Math.max(0, alturaPx) / speed) * 1000;
}

/**
 * Pulo de parede: perpendicular **para longe** da parede e impulso vertical completo.
 * O sinal vem de onde a parede está, não da direção em que o herói olha.
 */
export function wallJumpVelocity(wallSide: -1 | 1): { vx: number; vy: number } {
  // parede à esquerda (`-1`) empurra para a direita
  return { vx: -wallSide * CLIMB.wallJumpX, vy: -CLIMB.wallJumpY };
}

/**
 * A parede tem de ir do piso ao teto (§6.3, regra 2): se parar no meio, o jogador sobe,
 * não tem onde se segurar e cai — a ambiguidade que `PAT-LD-09` proíbe.
 */
export function wallIsContinuous(
  rows: readonly { topRow: number; bottomRow: number }[], floorRow = 7, ceilingRow = 0,
): boolean {
  if (rows.length === 0) return false;
  const top = Math.min(...rows.map((r) => r.topRow));
  const bottom = Math.max(...rows.map((r) => r.bottomRow));
  return top <= ceilingRow + 1 && bottom >= floorRow - 1;
}

/** Nenhuma plataforma sob o alçapão (§6.3, regra 1): o chão é o único lugar de onde se tenta. */
export function noPlatformsUnderHatch(
  hatchFrom: number, hatchTo: number,
  platforms: readonly { from: number; to: number; topRow: number }[],
): boolean {
  return !platforms.some((p) => p.from <= hatchTo && p.to >= hatchFrom && p.topRow >= 1);
}
