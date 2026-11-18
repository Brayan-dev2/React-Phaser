/**
 * LVL-14 — Fortaleza do Eclipse (`docs/niveis/LVL-14.md` §4).
 *
 * Primeiro setor do **Ato IV** e o primeiro que **não ensina nada**: o kit fechou em LVL-11 e
 * o setor cobra a leitura treinada em treze. Três coisas aqui não podem ser "consertadas":
 *
 * 1. **O Comandante não se desloca** (`mobile: false`, §6.5). Ele pivota as oito direções no
 *    lugar porque é a distância que decide a luta — e quem controla a distância é o eclipse.
 *    Se ele andar, o céu deixa de importar e o setor perde a razão de existir.
 * 2. **O eclipse não é do chefe e não escurece a arena** (§7.2, `TST-014`). O relógio de 8 s
 *    corre em todas as salas do setor (é o tempo 1 do `PAT-LD-02`: o setor **inteiro**) e
 *    **para** na morte dele (§7.4) — quem obedece ao céu é ele.
 * 3. **Duas fechaduras, três chefes, uma sobra** (`DEC-016`, §8). O portão exige `keys ≥ 2`,
 *    os dois chefes obrigatórios dão exatamente duas, e a chave de LVL-12 não abre nada. O
 *    jogador que lutou chega com `3 / 2` e passa; quem correu chega com `2 / 2` e passa igual.
 *
 * **Zero plataformas pelo sexto setor seguido** (desvio 6): uma praça de armas é plana, e o
 * que muda aqui não é o terreno — é a luz.
 */
import type { Room } from './lvl01';

export const LVL14_META = {
  id: 'LVL-14',
  name: 'Fortaleza do Eclipse',
  pal: 'PAL-14',
  bgm: 'BGM-01',        // `BGM-02` só na luta (§5.4)
  amb: 'AMB-14',
  scope: 'post',
  /** §1 campo 6: **nenhuma** habilidade nova — o Ato IV não dá, cobra. */
  grants: null,
  /** `PAT-LD-07`: a arena só abre com 0 HP processado (`gate: 'arena'`). */
  bossGate: 'arena',
  /** `DEC-011`: nada neste setor mata por queda. */
  lethalFalls: false,
} as const;

export const LVL14: Room[] = [
  {
    id: 'L14-01', name: 'Muralha',
    texts: {
      '7,6': ['MURALHA NORTE. SENTIDO ÚNICO.', 'NÃO HÁ VOLTA REGISTRADA.'],
    },
    // `w` aqui é **ameia** (`CEN-104`), não rato: `f` é o estandarte negro, `M` o monta-carga
    glyphs: { w: 'merlon', f: 'black-banner', M: 'lift' },
    hoist: { area: 'LVL-14', room: 5, at: { tx: 7, ty: 6 }, lockedUntil: 'boss-defeated' },
    // §7.5 tempo 1: o céu já está eclipsado — o jogador atravessa o setor **inteiro** sob ele
    eclipse: true,
    grid: [
      '##############################',
      '#............................#',
      '#....w........w...f......w...#',
      '#............................#',
      '+............................+',
      '+............................+',
      '+..M...N....E.........E......+',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  {
    id: 'L14-02', name: 'Praça de Armas',
    texts: {
      '7,6': ['PRAÇA DE ARMAS. CAPACIDADE: 600.', 'PRESENTES: 0.'],
    },
    glyphs: { w: 'merlon', f: 'black-banner' },
    eclipse: true,
    grid: [
      '##############################',
      '#............................#',
      '#.......f.....w.....f.....w..#',
      '#............................#',
      '+............................+',
      '+............................+',
      '+..P...N...E.........E.......+',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  {
    id: 'L14-03', name: 'Sala do Estandarte',
    texts: {
      '5,6': ['ESTANDARTE NEGRO: LUTO OFICIAL', 'PERMANENTE. NÃO SUBSTITUIR.'],
    },
    // `ff`: 2 tiles, **o maior estandarte do jogo** (`CEN-102`, §4.3)
    glyphs: { w: 'merlon', f: 'black-banner' },
    eclipse: true,
    grid: [
      '####################',
      '#..................#',
      '#........ff.....w..#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+....N.......E.....+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L14-04', name: 'Antessala do Comando',
    texts: {
      '7,6': ['ANTESSALA DO COMANDO.', 'ESPERAR ORDEM.'],
    },
    glyphs: { w: 'merlon', f: 'black-banner' },
    eclipse: true,
    grid: [
      '####################',
      '#..................#',
      '#....w.......f.....#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..P...N...........+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L14-05', name: 'Arena do Eclipse',
    texts: {},
    // `C` aqui **não é placa de pressão**: é `ENT-006`, declarado em `boss` (§4.5)
    glyphs: { G: 'grate', f: 'black-banner', y: 'eclipse' },
    boss: 'ENT-006',
    // §7.5 tempos 3 e 4: aqui o eclipse passa a significar alguma coisa
    eclipse: true,
    // **sem `P`**: arena de chefe é sala de desafio (`PAT-LD-05`) — e o §10 manda morrer
    // e voltar para o save de L14-04
    grid: [
      '########################',
      '#..........y...........#',
      '#...f..............f...#',
      '#......................#',
      '+......................G',
      '+......................G',
      '+...........C..........G',
      '########################',
      '########################',
      '########################',
      '########################',
    ],
  },
  {
    id: 'L14-06', name: 'Portão Fortificado',
    texts: {
      '11,6': ['PORTÃO FORTIFICADO. DUAS CHAVES.', 'UMA SOBRA.'],
    },
    // §4.6: `K` em (15,6) e (16,6) — **duas** fechaduras lado a lado (`CEN-103`)
    glyphs: { w: 'merlon', f: 'black-banner', M: 'lift' },
    locks: { required: 2, tiles: [{ tx: 15, ty: 6 }, { tx: 16, ty: 6 }], barrierTx: 15 },
    // `M` daqui volta para a muralha: é a segunda parada do mesmo monta-carga (`PAT-LD-08`)
    hoist: { area: 'LVL-14', room: 0, at: { tx: 3, ty: 6 } },
    eclipse: true,
    grid: [
      '####################',
      '#..................#',
      '#.......w.......f..#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..P...M...N...KK..+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
];
