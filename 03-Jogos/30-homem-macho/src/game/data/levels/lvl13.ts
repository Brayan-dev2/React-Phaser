/**
 * LVL-13 — Abismo do Eco (`docs/niveis/LVL-13.md` §4).
 *
 * Último setor do **Ato III** e o único do jogo **sem material próprio**: não há tijolo,
 * osso, bronze nem areia — há vazio e vento (§1). Três coisas deste setor não podem ser
 * "consertadas" por engano:
 *
 * 1. **Quem sobe é a corrente, não o pano** (§6.2). `HAB-07` continua sendo só um teto de
 *    queda; dentro de `CEN-096` o jogador sobe a 140 px/s **porque o vento empurra**. Se o
 *    pano ganhar um pixel de altura, os vãos de LVL-11 passam a ser subidos de baixo para
 *    cima e doze setores viram outro jogo.
 * 2. **A profundidade está na transição, não na grade** (§8): a queda de L13-02 dura 3 s,
 *    não dá dano (`DEC-011`) e salva antes e depois. É a única vez em que o **tempo**
 *    substitui o espaço num jogo de uma tela por sala.
 * 3. **O setor não tem voz própria** (§5): o eco é `AMB-13` como efeito de bus, 700 ms de
 *    atraso, e a silhueta de `CEN-095` sai em `reduce_motion`. Não há trilha nova aqui.
 *
 * **Zero plataformas e zero vãos** pelo quinto setor seguido — num abismo não há onde
 * pregar uma tábua (§1). O perigo é espacial e temporal, e o medo é **não subir**.
 */
import type { Room } from './lvl01';

export const LVL13_META = {
  id: 'LVL-13',
  name: 'Abismo do Eco',
  pal: 'PAL-13',
  bgm: 'BGM-01',
  amb: 'AMB-13',
  scope: 'post',
  /** §1 campo 6: a saída exige `HAB-07` **e** `CEN-096` — a única conjunção do jogo. */
  grants: null,
  requires: ['HAB-07'],
  bossGate: 'none',
  /** §11: `lethal_falls=false` no mapa inteiro. */
  lethalFalls: false,
} as const;

export const LVL13: Room[] = [
  {
    id: 'L13-01', name: 'Beira do Abismo',
    texts: {
      '7,6': ['ABISMO SEM FUNDO REGISTRADO.', 'NÃO MEDIR.'],
    },
    // `o` é a boca do poço: chegada do atalho (corrente A), `arrival_only` (§4.1)
    glyphs: { b: 'abyss', k: 'stake', e: 'echo', o: 'well-mouth' },
    echoes: [{ tx: 16, ty: 6 }],
    grid: [
      '####################',
      '#..................#',
      '#.b.k....k......b..#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+...o..N....E...e..+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L13-02', name: 'A Queda',
    texts: {
      '3,6': ['A CORDA TINHA 40 BRAÇAS.', 'NÃO CHEGOU.'],
    },
    glyphs: { b: 'abyss', k: 'stake', e: 'echo', V: 'long-fall' },
    echoes: [{ tx: 20, ty: 6 }],
    // §4.2: **só a queda sai daqui.** Não há porta no lado direito, há um vão.
    longFall: { to: 2, oneWay: true },
    grid: [
      '##############################',
      '#............................#',
      '#....b.k......k.....b...k..b.#',
      '#............................#',
      '+............................#',
      '+............................#',
      '+..N....E.......E...e.....V..#',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  {
    id: 'L13-03', name: 'Fundo do Poço',
    texts: {
      '8,6': ['QUEM GRITAR AQUI ESCUTA A SI MESMO.', 'ISSO CONTA COMO REGISTRO.'],
    },
    glyphs: { b: 'abyss', e: 'echo' },
    echoes: [{ tx: 22, ty: 6 }],
    grid: [
      '##############################',
      '#............................#',
      '#.....b...........b.......b..#',
      '#............................#',
      '+............................+',
      '+............................+',
      '+..P....N.....E.......e......+',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  {
    id: 'L13-04', name: 'Boca do Vento',
    texts: {
      '3,6': ['CORRENTE ASCENDENTE.', 'USAR COM AS DUAS MÃOS LIVRES.'],
    },
    glyphs: { a: 'updraft', b: 'abyss', k: 'stake', e: 'echo' },
    echoes: [{ tx: 14, ty: 6 }, { tx: 25, ty: 6 }],
    // §4.4: as duas colunas são idênticas; a diferença é o alçapão, e o cenário não a indica
    updrafts: [
      { from: 7, to: 9, topRow: 0, bottomRow: 6 },
      { from: 19, to: 21, topRow: 0, bottomRow: 6 },
    ],
    hatches: [
      // A volta para trás (atalho, `PAT-LD-08`): L13-01
      { from: 8, to: 9, state: 'open', requires: 'HAB-07', destRoom: 0 },
      // B segue para a beira alta: **a trava 13 → 14**
      { from: 20, to: 21, state: 'open', requires: 'HAB-07', destRoom: 4 },
    ],
    grid: [
      '########^^##########^^########',
      '#......aaa.........aaa.......#',
      '#..k...aaa....b....aaa....b..#',
      '#......aaa.........aaa.......#',
      '+......aaa.........aaa.......#',
      '+......aaa.........aaa.......#',
      '+..N...aaa....e....aaa...e...#',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  {
    id: 'L13-05', name: 'Beira Alta',
    texts: {
      '7,6': ['BEIRA ALTA. SEM GRADE.', 'SEM CONFERÊNCIA.'],
    },
    glyphs: { b: 'abyss', k: 'stake', e: 'echo' },
    echoes: [{ tx: 11, ty: 6 }],
    grid: [
      '####################',
      '#..................#',
      '#....b..k.....b....#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..P...N...e.......+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L13-06', name: 'Boca do Abismo',
    texts: {
      '5,6': ['A ORDEM FOI DADA.', 'NÃO CONSTA O NOME.'],
    },
    glyphs: { b: 'abyss', k: 'stake', e: 'echo' },
    echoes: [{ tx: 10, ty: 6 }],
    grid: [
      '####################',
      '#..................#',
      '#.......b...k...b..#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+....N....e..E.....+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
];

/** §4.4: as duas colunas de vento de L13-04 e os seus dois destinos. */
export const LVL13_UPDRAFTS = [
  { room: 'L13-04', coluna: 'A', from: 7, to: 9, destRoom: 0, nome: 'L13-01' },
  { room: 'L13-04', coluna: 'B', from: 19, to: 21, destRoom: 4, nome: 'L13-05' },
] as const;

/** §5: os sete marcos de eco do setor — o abismo devolve o jogador em todos. */
export const LVL13_ECHOES = 7;

/** §8: a única queda longa do jogo. */
export const LVL13_LONG_FALL = { room: 'L13-02', toRoom: 2, ms: 3000, damage: 0 } as const;
