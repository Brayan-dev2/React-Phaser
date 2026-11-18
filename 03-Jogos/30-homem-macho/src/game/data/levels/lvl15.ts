/**
 * LVL-15 — Ante-sala do Fim (`docs/niveis/LVL-15.md` §4).
 *
 * O último setor antes do Trono, e ele existe para **responder LVL-13**: o abismo devolvia ao
 * jogador o som dele mesmo com 700 ms de atraso; a ante-sala **não devolve nada**. Três coisas
 * aqui não podem ser "consertadas" por engano:
 *
 * 1. **É um chefe, dois corpos** (§5.1, §5.6). `MEC-009` só conta com os **dois** a 0 HP na
 *    mesma janela de 4 s, e a revivificação é **infinita**. Matar um de cada vez é o erro que
 *    a luta pune — e o único ensinamento que ela tem.
 * 2. **`BGM-03`, nunca `BGM-02`** (§7.2). A trilha de quarto seguro também toca na arena: os
 *    guardiões são um **expediente**, não um clímax.
 * 3. **Nenhum objeto do setor tem som ambiente** (§7.3). A cinza é muda, a porta lacrada é
 *    muda, e a batida de coração que `06-audio` sugere está descartada: um coração é um som
 *    que o jogador não faz, e aqui só existe o que ele faz.
 *
 * **Zero plataformas pelo sétimo setor seguido**: um corredor é plano, e o jogo não pede mais
 * travessia desde LVL-13 — pede combate, e este pede aritmética.
 */
import type { Room } from './lvl01';

export const LVL15_META = {
  id: 'LVL-15',
  name: 'Ante-sala do Fim',
  pal: 'PAL-15',
  bgm: 'BGM-03',       // a trilha do quarto seguro — e da arena (§7.2)
  amb: 'AMB-15',       // silêncio absoluto (§7.1)
  scope: 'post',
  /** §1 campo 6: **nenhuma** habilidade. A entrada é o portão de LVL-14 (`keys >= 2`). */
  grants: null,
  requires: ['CEN-103'],
  bossGate: 'arena',
  /** §11: `ambient_sfx=none` no mapa inteiro — nenhum objeto tem `SFX` (§7.3). */
  ambientSfx: 'none',
  lethalFalls: false,
} as const;

export const LVL15: Room[] = [
  {
    id: 'L15-01', name: 'Corredor de Portas',
    texts: {
      '5,6': ['CORREDOR DE PORTAS. TODAS LEVAM AO MESMO LUGAR.', 'NÃO ABRIR.'],
    },
    // `T` é **porta lacrada** (`CEN-107`): 3 tiles de altura, sem colisão, muda (§3)
    glyphs: { T: 'sealed-door', w: 'bone-wall' },
    grid: [
      '########################################',
      '#......................................#',
      '#...w..............................w...#',
      '#......................................#',
      '+.......T.........T...........T........+',
      '+.......T.........T...........T........+',
      '+....N..T....E....T.......E...T........+',
      '########################################',
      '########################################',
      '########################################',
      '########################################',
    ],
  },
  {
    id: 'L15-02', name: 'Corredor Cego',
    texts: {
      '4,6': ['LACRADAS POR FIM DE TURNO.', 'NÃO HÁ TURNO SEGUINTE.'],
    },
    glyphs: { T: 'sealed-door', w: 'bone-wall' },
    grid: [
      '##############################',
      '#............................#',
      '#...........w..............w.#',
      '#............................#',
      '+......T........T......T.....+',
      '+......T........T......T.....+',
      '+...N..T...E....T...E..T.....+',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  {
    id: 'L15-03', name: 'Quarto de Turno',
    texts: {
      // `LOR-04`: o quadro mais importante do jogo — 5 linhas, ~30 palavras (§4.3)
      '7,6': [
        'TURNO DA NOITE: POSTO VAGO.',
        'TURNO DO DIA: POSTO VAGO.',
        'SUBSTITUTO: NINGUÉM DESIGNADO.',
        'O POSTO PERMANECE ABERTO ATÉ PREENCHIMENTO.',
        'ASSINATURA: —',
      ],
      '11,6': ['AQUI DORME QUEM ESPERA O POSTO.'],
    },
    glyphs: { w: 'bone-wall' },
    /** §4.3: o último quarto seguro do jogo (`BGM-01` → `BGM-03` na porta). */
    safeRoom: true,
    grid: [
      '####################',
      '#..................#',
      '#....w.........w...#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..P...Q...N.......+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L15-04', name: 'Cartório',
    texts: {
      '7,6': ['CARTÓRIO. PROTOCOLO DE ENTREGA: DOIS CARIMBOS.', 'NENHUM A MENOS.'],
    },
    // `c` é **cinza caindo** (`CEN-109`): `decor-front`, sem colisão e **muda** (§7.3)
    glyphs: { w: 'bone-wall', c: 'ash-fall' },
    grid: [
      '####################',
      '#..................#',
      '#.........w.....c..#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..P...N.....E.....+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L15-05', name: 'Sala dos Dois',
    texts: {},
    // `O` são **dois corpos, um chefe** (§5.1): 10 tiles entre eles e nunca trocam de lado
    glyphs: { G: 'grate', w: 'bone-wall', c: 'ash-fall' },
    boss: 'ENT-007',
    // **sem `P`**: arena de chefe é sala de desafio (`PAT-LD-05`)
    grid: [
      '##############################',
      '#............................#',
      '#....w.........c.........w...#',
      '#............................#',
      '+............................G',
      '+............................G',
      '+.........O.........O........G',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  {
    id: 'L15-06', name: 'Portão do Trono',
    texts: {
      '12,6': ['PORTÃO DO TRONO. A CHAVE É O POSTO.'],
    },
    // `S` é a **porta de serviço** (`CEN-106`): `interact`, dois sentidos → L15-01 (§4.6).
    // É a única porta que abre num corredor de seis lacradas — e ela dá para trás.
    glyphs: { w: 'bone-wall', S: 'service-door' },
    sink: { area: 'LVL-15', room: 0, at: { tx: 1, ty: 6 }, mode: 'interact' },
    grid: [
      '####################',
      '#..................#',
      '#.....w.........w..#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..P....S...N......+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
];

/** §8: **seis** portas lacradas, três por corredor — e nenhuma abre. */
export const LVL15_SEALED = [
  { room: 0, tx: [8, 18, 30] },
  { room: 1, tx: [7, 16, 23] },
] as const;

/** §5.1: os dois corpos nascem em (10,6) e (20,6) e **nunca trocam de lado**. */
export const LVL15_BODIES = [{ tx: 10, ty: 6 }, { tx: 20, ty: 6 }] as const;
