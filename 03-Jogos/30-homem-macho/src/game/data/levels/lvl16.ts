/**
 * LVL-16 — Trono do Caos (`docs/niveis/LVL-16.md` §4). **O último setor do jogo.**
 *
 * Depois dele não há setor 17: a última sala não tem porta leste e `MEC-012` encerra o jogo.
 * Quatro coisas aqui não podem ser "consertadas" por engano:
 *
 * 1. **O chefe não tem vida** (§5.1). `ENT-008` tem **postura** (100/125/150, golpe = 25) e a
 *    luta se vence assinando **três baixas** no posto (`MEC-011`). Nenhum caminho leva a
 *    `MEC-009`: quem der HP a ele transforma o sexto chefe no primeiro outra vez.
 * 2. **`O` e `K` são adjacentes de propósito** (§3). Ele está *em cima* do posto — enquanto
 *    estiver de pé não existe posição de onde o jogador alcance `CEN-111`. É a luta inteira
 *    numa linha de grade.
 * 3. **O Caos não tem corpo** (§5.6). `CEN-113` é **o piso da arena**, não um objeto: racha,
 *    cede, e **nunca** tira vida (`DEC-018`). Nunca três tiles contíguos, senão fecharia
 *    caminho — e o piso inteiro da luta depende disso.
 * 4. **`bgm: 'none'` no mapa** (§8.1), `BGM-02` só na arena e `BGM-04` só de L16-05 ao fim.
 *    O último andar não tem trilha porque a trilha é do posto, não do lugar.
 *
 * **Zero plataformas pelo oitavo setor seguido.** O jogo termina no chão: entre a porta de
 * LVL-15 e o trono não há um único pulo.
 */
import type { Room } from './lvl01';

export const LVL16_META = {
  id: 'LVL-16',
  name: 'Trono do Caos',
  pal: 'PAL-16',
  /** §8.1: os corredores não têm trilha. `bgm=none` é valor válido (precedente de LVL-07). */
  bgm: 'none',
  amb: 'AMB-16',        // o zumbido da vaga — e ele desliga em `MEC-012` (§8.3)
  scope: 'post',
  /** §1 campo 6: **nenhuma** habilidade. O Ato IV cobra; não dá. */
  grants: null,
  /** Entrada pelo Portão do Trono de LVL-15: o setor 15 tem de estar vencido. */
  requires: ['ENT-007'],
  bossGate: 'arena',
  ambientSfx: 'AMB-16',
  lethalFalls: false,
  /** `MEC-012` encerra o jogo: este é o único mapa com `terminal` (§11). */
  terminal: true,
} as const;

export const LVL16: Room[] = [
  {
    id: 'L16-01', name: 'Patamar',
    texts: {
      // `PATAMAR. ACIMA SÓ SOBE QUEM VAI FICAR.` (8 palavras)
      '3,6': ['PATAMAR. ACIMA SÓ SOBE QUEM VAI FICAR.'],
    },
    // `w` pedra nua (`CEN-108` reskin), `v` luz de vinho (`PAL-16`, decor-front, sem som)
    glyphs: { w: 'bare-stone', v: 'wine-light' },
    ronda: { tiles: 5 },
    grid: [
      '####################',
      '#..................#',
      '#....w....v...w....#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..N......E........+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L16-02', name: 'A Fila',
    texts: {
      // `FILA DO POSTO. UMA CADEIRA POR VAGA. NENHUMA OCUPADA.` (9 palavras)
      '3,6': ['FILA DO POSTO. UMA CADEIRA POR VAGA. NENHUMA OCUPADA.'],
      // `CEN-112`: o display que responde tudo (§4.2)
      '8,6': ['SENHA ATUAL: 000'],
    },
    glyphs: {
      w: 'bare-stone', c: 'empty-chair', v: 'wine-light',
      S: 'ticket-dispenser',
    },
    /** `CEN-112` distribuidor de senha — `interact`, display `000` (§4.2). */
    dispenser: { tx: 8, ty: 6, display: '000' },
    grid: [
      '##############################',
      '#............................#',
      '#...c.c.c.c.c.c...v......w...#',
      '#............................#',
      '+............................+',
      '+............................+',
      '+..N....S....E.......E.......+',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  {
    id: 'L16-03', name: 'Antecâmara',
    texts: {
      /**
       * `LOR-06` — **o único tutorial do jogo que ensina a não fazer o que o jogo ensinou
       * por 15 setores** (§4.3). 5 linhas, ~19 palavras. A última linha é a mais importante.
       */
      '8,6': [
        'BAIXA DE POSTO',
        '1. DESEQUILIBRE O OCUPANTE.',
        '2. ASSINE.',
        '3. SÃO NECESSÁRIAS TRÊS ASSINATURAS.',
        'NÃO É NECESSÁRIO MATAR.',
      ],
    },
    glyphs: { w: 'bare-stone', v: 'wine-light' },
    /** `PAT-LD-05`: **a última sala segura do jogo** (`P` + `BGM-03`… aqui, silêncio). */
    safeRoom: true,
    grid: [
      '####################',
      '#..................#',
      '#....w....v...w....#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..P....N..........+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L16-04', name: 'O Posto',
    texts: {},
    /**
     * `O` é **`ENT-008`** (um corpo), `K` é o **posto** (`CEN-111`). O campo `boss` é a
     * autoridade do chefe, `posto` é a do alvo de `MEC-011` — e os dois ficam adjacentes.
     */
    glyphs: { w: 'bare-stone', v: 'wine-light', G: 'grate', K: 'guard-post' },
    boss: 'ENT-008',
    /** `CEN-111`: o alvo do `interact` segurado por 3.000 ms. */
    posto: { tx: 21, ty: 6 },
    /** `CEN-113` — o desgaste. **É o piso**, não um objeto da grade (§5.6). */
    desgaste: true,
    // **sem `P`**: arena de chefe é sala de desafio (`PAT-LD-05`)
    grid: [
      '########################',
      '#......................#',
      '#....w.....v.....w.....#',
      '#......................#',
      '+......................G',
      '+......................G',
      '+...................OK.G',
      '########################',
      '########################',
      '########################',
      '########################',
    ],
  },
  {
    id: 'L16-05', name: 'Parede dos Crachás',
    texts: {
      // `QUARENTA CRACHÁS. QUARENTA E UM PREGOS. O ÚLTIMO ESTÁ VAZIO.` (11 palavras)
      '12,6': ['QUARENTA CRACHÁS. QUARENTA E UM PREGOS. O ÚLTIMO ESTÁ VAZIO.'],
    },
    /** `C` é o **quadro de crachás** (`CEN-116`): 40 crachás em 41 pregos (§4.5). */
    glyphs: { w: 'bare-stone', v: 'wine-light', C: 'badge-wall' },
    badgeWall: { tx: 7, ty: 6, badges: 40, hooks: 41 },
    grid: [
      '####################',
      '#..................#',
      '#....w....v....w...#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..P...C....N......+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L16-06', name: 'O Assento',
    texts: {
      // `O POSTO É VITALÍCIO.` (4 palavras) — a última placa do jogo
      '3,6': ['O POSTO É VITALÍCIO.'],
    },
    /**
     * `T` é o **trono partido** (`CEN-114`, `MEC-012`), `V` é a **varanda** (`CEN-115`) —
     * `decor-back`, sem colisão: mostra LVL-01 lá embaixo e **não se pode descer**.
     */
    glyphs: { w: 'bare-stone', v: 'wine-light', T: 'throne-broken', V: 'varanda' },
    /** `MEC-012`: uma tecla, **sem estado de falha**, idempotente (`PAT-C-07`). */
    throne: { tx: 11, ty: 6, once: true },
    varanda: { tx: 16, ty: 6, area: 'LVL-01' },
    // **sem porta leste**: a parede de `y=4–6` é sólida — o único ponto final do mapa (§4.6)
    grid: [
      '####################',
      '#..................#',
      '#.....w..v...w...v.#',
      '#..................#',
      '+..................#',
      '+..................#',
      '+..N.......T....V..#',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
];

/** §4: **as três Sentinelas do setor** — 1 · 2 · 0 · 0 · 0 · 0, e nenhuma na arena. */
export const LVL16_SENTINELS = [
  { room: 0, tx: 10, ty: 6, patrol: 5 },
  { room: 1, tx: 13, ty: 6, patrol: 4 },
  { room: 1, tx: 21, ty: 6, patrol: 5 },
] as const;

/** §3: `K` e `O` ficam adjacentes — enquanto ele está de pé, o posto não é alcançável. */
export const LVL16_POSTO = { tx: 21, ty: 6 } as const;
export const LVL16_CHEFE = { tx: 20, ty: 6 } as const;

/** §5.7: o contador do HUD. `BAIXAS n/3` — nunca uma barra de vida. */
export const LVL16_BAIXAS = 3;

/** §7.4: a tela final não é um quadro, é um crachá — e o nome é o de quem lê. */
export const LVL16_BADGE = ['POSTO: PREENCHIDO', 'Nº: 041', 'ASSINATURA: VOCÊ'] as const;

/** §7.2: a última fala do jogo, dita pelo jogador (`MEC-012`). */
export const LVL16_LAST_LINE = 'O assento é duro.';
