/**
 * LVL-12 — Forja Distorcida (`docs/niveis/LVL-12.md` §4).
 *
 * Setor `[PÓS]` (`D-04`) e **o primeiro que não dá nada**: o kit fecha em LVL-11 (`HAB-01`
 * a `HAB-07`) e daqui em diante o jogo **para de dar e começa a pedir** (§1).
 *
 * Três coisas deste setor não podem ser "consertadas" por engano:
 *
 * 1. **`ENT-005` não tranca a porta** (`gate: 'none'`, §8). A arena de L12-05 não tem
 *    grade, não tem lock-in e não tem `P`: atravessá-la correndo custa **4,36 s**. Quem
 *    puser uma grade aqui mata a única coisa que o setor afirma sobre o Ato III.
 * 2. **Os pilões (`CEN-092`) são da fábrica, não do chefe** (§7.2): relógio próprio,
 *    defasagem de meio período e param na morte dele — porque quem bate é ele.
 * 3. **A esteira de L12-03 é a informação, não o obstáculo** (§4.3): `decor-back`, sem
 *    colisão e sem transporte. Ela monta Sentinelas incompletas, e é a origem dos
 *    Distorcidos entregue sem uma linha de diálogo.
 *
 * **Zero plataformas, zero vãos, zero alçapões** (quarto setor seguido): a forja é sólida e
 * o perigo dela é fogo e metal, não altura (desvio 4).
 */
import type { Room } from './lvl01';

export const LVL12_META = {
  id: 'LVL-12',
  name: 'Forja Distorcida',
  pal: 'PAL-12',
  bgm: 'BGM-01',        // `BGM-02` só entra se a luta começar (§5.4)
  amb: 'AMB-12',
  scope: 'post',
  /** §1 campo 6: **nenhuma** habilidade — o kit está completo desde LVL-11. */
  grants: null,
  /** §8: o chefe é opcional e não há trava de saída. */
  bossGate: 'none',
} as const;

export const LVL12: Room[] = [
  {
    id: 'L12-01', name: 'Conduto',
    texts: {
      '3,6': ['O CONDUTO VENTILA A FORJA.', 'NÃO BLOQUEAR. NÃO DESCER.'],
    },
    glyphs: { c: 'chain', h: 'furnace' },
    // §4.1: a boca da calha é **chegada** (`arrival_only`), não gatilho — e a calha
    // de L12-06 volta para cá (mão única, `PAT-LD-08`)
    grid: [
      '####################',
      '#..................#',
      '#.....c..c......h..#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..N........E....V.+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L12-02', name: 'Fundição',
    texts: {
      '3,6': ['TURNO DA NOITE: 400 PEÇAS.', 'TURNO DO DIA: 0. NINGUÉM CONFERIU.'],
    },
    glyphs: { c: 'chain', h: 'furnace' },
    grid: [
      '##############################',
      '#............................#',
      '#...c.h..c..c..........h..c..#',
      '#.............h..............#',
      '+............................+',
      '+............................+',
      '+..N......E.........E........+',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  {
    id: 'L12-03', name: 'Esteira',
    texts: {
      '4,6': ['A ESTEIRA NÃO PARA.', 'A PEÇA QUE FALTA NÃO CHEGOU.'],
    },
    glyphs: { c: 'chain', h: 'furnace', e: 'conveyor' },
    grid: [
      '##############################',
      '#............................#',
      '#...c...................c.h..#',
      '#............................#',
      '+............................+',
      '+........eeeeeeeeeeeee.......+',
      '+...N.......E.....E..........+',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  {
    id: 'L12-04', name: 'Bigorna',
    texts: {
      '7,6': ['ZONA DA BIGORNA.', 'ENTRAR SÓ COM ORDEM ESCRITA.'],
    },
    glyphs: { c: 'chain', h: 'furnace', j: 'anvil' },
    grid: [
      '####################',
      '#..................#',
      '#.........c.....h..#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..P...N.....j.....+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L12-05', name: 'Arena',
    texts: {
      '3,6': ['NÃO FALAR COM O FORJADOR.', 'ELE NÃO RESPONDE.'],
    },
    // `F` é chefe: em LVL-03 é `ENT-003` e aqui é `ENT-005` — a sala decide (`DEC-023`)
    glyphs: { c: 'chain', h: 'furnace', j: 'anvil' },
    boss: 'ENT-005',
    // §7: dois pilões, defasados em meio período, posição fixa (x = 7 e x = 17)
    hammers: [{ tx: 7, ty: 6 }, { tx: 17, ty: 6 }],
    // **sem `P`**: a arena é sala de desafio (`PAT-LD-05`) e o chefe não tranca a porta (§8)
    grid: [
      '########################',
      '#......................#',
      '#....c.........c....h..#',
      '#......................#',
      '+......................+',
      '+...........j..........+',
      '+..N...!....F....!.....+',
      '########################',
      '########################',
      '########################',
      '########################',
    ],
  },
  {
    id: 'L12-06', name: 'Poço de Forja',
    texts: {
      '14,6': ['ESCÓRIA: DESCER PELA CALHA.', 'NÃO É ESCADA.'],
    },
    glyphs: { c: 'chain', h: 'furnace', V: 'slag-chute', I: 'forge-item' },
    // §4.6 / §8: a calha devolve a L12-01 e **não salva** (atalho ≠ transição)
    sink: {
      area: 'LVL-12', room: 0, at: { tx: 1, ty: 6 }, mode: 'interact',
      text: ['A ESCÓRIA DESCE PELA CALHA.', 'SÓ DESCE.'],
    },
    // §5.6: `ITM-011` só aparece se `ENT-005` cair — a luta opcional tem preço (§8)
    bossReward: { itm: 'ITM-011', tx: 7, ty: 6 },
    grid: [
      '####################',
      '#..................#',
      '#...c...........h..#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..P...I...V..N....+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
];

/** §5.3: os três ataques, para os testes e para o E2E. */
export const LVL12_ATTACKS = ['ATK-10', 'ATK-11', 'ATK-12'] as const;

/** §4.3: a esteira de L12-03 anda de x=9 a x=21 (13 tiles), sempre para a direita. */
export const LVL12_CONVEYOR = { room: 'L12-03', row: 5, from: 9, to: 21, dir: 1 } as const;

/** §7: os dois pilões da arena e a defasagem que faz a arena ter compasso. */
export const LVL12_HAMMERS = [
  { room: 'L12-05', tx: 7, offsetMs: 0 },
  { room: 'L12-05', tx: 17, offsetMs: 3000 },
] as const;
