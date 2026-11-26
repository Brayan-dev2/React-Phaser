/**
 * `ENT-008` O Plantonista e o fim do jogo (`LVL-16.md` §5.5, §5.6 e §7.2).
 *
 * Sem Phaser e sem números: os valores chegam por `PostoTiming` (`data/tuning.ts`).
 *
 * Este é o único chefe do jogo **sem vida**. Três coisas que a luta afirma:
 *
 * 1. **Postura, não dano.** O golpe não tira HP: tira 25 de postura. Ao chegar a 0 ele fica
 *    `atordoado` — e é a única janela do jogo que o jogador **abre sozinho** (§5.2).
 * 2. **A luta se vence assinando três baixas.** `4.500 = 300 + 3.000 + 1.200`: cambaleio,
 *    canal no posto e folga. Quem chegar 2 s atrasado perde a baixa — e perde **tempo**, não
 *    vida (§5.5).
 * 3. **O Caos não tem corpo.** `CEN-113` é o chão: ele racha e cede, e **nunca tira vida**
 *    (`DEC-018`). Tira **opção** — e nunca três tiles contíguos, senão fecharia caminho (§5.6).
 */

export type PostoState =
  | 'posto'
  | 'avanco'
  | 'telegraph'
  | 'golpe'
  | 'recuperacao'
  | 'protocolo'
  | 'atordoado'
  | 'rendido';

/** As três baixas: cada uma pede mais postura que a anterior (§5.5). */
export interface PostoTiming {
  readonly poise: readonly [number, number, number];
  readonly golpePoise: number;
  /** `4.500 = 300` de cambaleio `+ 3.000` de canal `+ 1.200` de folga. */
  readonly staggerMs: number;
  readonly staggerSwayMs: number;
  readonly channelMs: number;
  /** Quanto o jogador pode demorar para **começar** a assinar depois do cambaleio. */
  readonly staggerSlackMs: number;
  /** `ATK-21`: três golpes nesta janela disparam o protocolo. */
  readonly protocolHits: number;
  readonly protocolWindowMs: number;
  readonly protocolMs: number;
  /** `CEN-113`: rachadura em 1.400 ms, buraco em 2.000 ms. */
  readonly crackMs: number;
  readonly holeMs: number;
  readonly maxHoles: number;
  readonly maxHolesFinal: number;
  /** Regra de segurança: **nunca** 3 contíguos. */
  readonly maxAdjacent: number;
}

export const BAIXAS = 3;

/** Postura da baixa `n` (1..3). Fora do intervalo, a última. */
export function poiseFor(baixa: number, t: PostoTiming): number {
  const i = Math.min(t.poise.length, Math.max(1, Math.floor(baixa))) - 1;
  return t.poise[i];
}

/** Golpes de 25 necessários para cada baixa: 4, 5 e 6 (§5.5). */
export function hitsPerBaixa(t: PostoTiming): readonly number[] {
  return t.poise.map((p) => Math.ceil(p / t.golpePoise));
}

/** Total de golpes da luta — **15**, a única medida de progresso (§6.1). */
export function totalHits(t: PostoTiming): number {
  return hitsPerBaixa(t).reduce((a, b) => a + b, 0);
}

/**
 * **O chefe não tem vida.** `damageable=false` é a fiação inteira do setor: nenhum caminho
 * deste arquivo leva a `MEC-009` (§5.1, `TST-018`).
 */
export function postoKillable(): false {
  return false;
}

/** A postura só desce. `damage` aqui é postura, nunca HP. */
export function applyPoise(poise: number, damage: number): number {
  return Math.max(0, poise - Math.max(0, damage));
}

/** Postura a 0 → `atordoado`. É a janela que o jogador abre (§5.2). */
export function staggered(poise: number): boolean {
  return poise <= 0;
}

/**
 * O canal abre depois do cambaleio (`300`) e **fecha** com a folga: começar depois de
 * `4.500 − 3.000 = 1.500` ms não termina dentro do atordoamento, e a baixa não é assinada.
 *
 * `4.500 = 300 + 3.000 + 1.200`: o cambaleio tira o homem de cima do posto, o canal é o tempo
 * de assinar e a folga é quanto o jogador pode demorar para **começar** (§5.5). Quem chega
 * 2 s depois perde a baixa — e perde **tempo**, não vida.
 */
export function canSign(elapsedMs: number, t: PostoTiming): boolean {
  return elapsedMs >= t.staggerSwayMs && elapsedMs < t.staggerMs - t.channelMs;
}

/**
 * `canSign` governa **começar**; este governa **continuar**. Um canal que começou aos 300 ms
 * tem de poder completar aos 3.300 — a folga é para quem chega tarde, não um corte no meio de
 * um canal já em curso.
 */
export function canHold(elapsedMs: number, t: PostoTiming): boolean {
  return elapsedMs < t.staggerMs;
}

/** A baixa é assinada quando o `interact` é **segurado** por 3.000 ms dentro da janela. */
export function signComplete(heldMs: number, t: PostoTiming): boolean {
  return heldMs >= t.channelMs;
}

/** Três baixas e ele se rende — e o jogo não desacelera o fim (§5.7). */
export function rendido(baixas: number): boolean {
  return baixas >= BAIXAS;
}

/**
 * `ATK-21`: **três golpes em 4.000 ms** disparam o protocolo, e o protocolo devolve 22 de
 * dano **sem tocar na postura**. Quem para de bater nunca toma dano (§5.3).
 */
export function protocolTriggered(recentHits: readonly number[], now: number, t: PostoTiming): boolean {
  const dentro = recentHits.filter((h) => now - h <= t.protocolWindowMs);
  return dentro.length >= t.protocolHits;
}

/**
 * `ATK-20`: o apito só acontece com o jogador a **≤ 3 tiles do posto por 1.500 ms**, e nunca
 * passa de **2 Sentinelas vivas** — o último chefe chama o primeiro capanga (§5.3).
 */
export function apitoAllowed(nearMs: number, aliveSentinels: number, maxAlive = 2): boolean {
  return nearMs >= 1500 && aliveSentinels < maxAlive;
}

/** O leash: ele **nunca** vai a oeste de `leashX`. Guarda o posto, não a porta (§6.5). */
export function clampToLeash(x: number, leashX: number): number {
  return Math.max(x, leashX);
}

// ---------------------------------------------------------------------------
// `CEN-113` — o desgaste (o Caos sem corpo)
// ---------------------------------------------------------------------------

/** Quantos buracos cabem na fase: 8, ou 10 depois da 3ª baixa (§5.6). */
export function maxHoles(baixa: number, t: PostoTiming): number {
  return baixa >= BAIXAS ? t.maxHolesFinal : t.maxHoles;
}

/**
 * A regra de segurança: **nunca 3 tile contíguos**. Com o teto de 2 (128 px), um salto
 * andando (224 px) sempre atravessa — o buraco nunca fecha caminho (§5.6, §9).
 */
export function holeAllowed(tiles: ReadonlySet<number>, candidate: number, t: PostoTiming): boolean {
  if (tiles.has(candidate)) return false;
  let run = 1;
  for (let d = -1; d <= 1; d += 2) {
    let i = candidate + d;
    while (tiles.has(i)) { run += 1; i += d; }
  }
  return run <= t.maxAdjacent;
}

/** Escolhe um tile para rachar: o do jogador, se a regra permitir. `null` = nada cede. */
export function pickHole(
  tiles: ReadonlySet<number>, preferido: number, t: PostoTiming,
): number | null {
  if (tiles.size >= t.maxHoles) return null;
  if (holeAllowed(tiles, preferido, t)) return preferido;
  // sem o tile do jogador, tenta os vizinhos — o chão cobra **o lugar**, não a pessoa
  for (const d of [-1, 1, -2, 2]) {
    if (holeAllowed(tiles, preferido + d, t)) return preferido + d;
  }
  return null;
}

/** Cay no buraco: `DEC-011` — **sem dano**, volta à entrada e **cancela o canal** (§5.6). */
export function fallInHole(): { damage: 0; cancelChannel: true } {
  return { damage: 0, cancelChannel: true };
}

/** `MEC-011` registra **uma vez só**, idempotente (`PAT-C-07`). */
export function processaBaixa(baixas: number, jaProcessado: boolean): { baixas: number; changed: boolean } {
  if (jaProcessado) return { baixas, changed: false };
  return { baixas: baixas + 1, changed: true };
}

/** §10.1: a morte custa o caminho de volta, não o trabalho — as baixas ficam. */
export function baixasSurviveDeath(baixas: number): number {
  return baixas;
}

/** §7.1: a terceira chave **não abre nada**. O Trono não tem fechadura. */
export function throneLocked(): false {
  return false;
}
