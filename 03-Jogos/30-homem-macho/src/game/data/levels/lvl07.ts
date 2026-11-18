/**
 * LVL-07 — Catedral Oca (`docs/niveis/LVL-07.md` §4).
 *
 * Setor `[PÓS]` (`D-04`) e **o único sem trava, sem habilidade e sem chefe**: cinco
 * Sentinelas em 134 tiles, nenhuma armadilha obrigatória. A força dele é a ausência.
 *
 * Glifos reinterpretados por sala (`DEC-023`): `R` é arco de costela aqui (é `ITM-006`
 * no alfabeto de itens), `v` é vitral (é cinza em LVL-04) e `T` é a boca do trifório
 * (é árvore morta em LVL-04/06). A sala decide o significado.
 */
import type { Room } from './lvl01';

export const LVL07_META = {
  id: 'LVL-07',
  name: 'Catedral Oca',
  pal: 'PAL-07',
  bgm: 'none',          // §6/§12-5: o setor tem `AMB-07`, não trilha
  scope: 'pos',
  grants: null,         // o setor não entrega habilidade (§1 campo 6)
} as const;

export const LVL07: Room[] = [
  {
    id: 'L07-01', name: 'Nave',
    texts: { '6,6': ['AQUI CABIA TODO MUNDO.'] },
    glyphs: { R: 'arc', v: 'stained', T: 'sink-arrival' },
    grid: [
      '########################################',
      '#...R...R...R...R...R...R...R...R.....v#',
      '#...R...R...R...R...R...R...R...R.R...v#',
      '#...R...R...R...R...R...R...R...R.....v#',
      'D..T..................................v+',
      'D.....................................v+',
      'D.....N...b.........c.....b...E........+',
      '########################################',
      '########################################',
      '########################################',
      '########################################',
    ],
  },
  {
    id: 'L07-02', name: 'Deambulatório',
    texts: { '7,3': ['NÃO HÁ NINGUÉM PARA RECEBER.'] },
    glyphs: { R: 'arc' },
    grid: [
      '##############################',
      '#............................#',
      '#......R.......R......R......#',
      '#......N.......R......b......#',
      '+...=======........=======...+',
      '+............................+',
      '+..c.........c.AA.......E..c.+',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  {
    id: 'L07-03', name: 'Coro',
    texts: { '17,1': ['O CORO CANTAVA PARA UMA NAVE VAZIA.'] },
    glyphs: { R: 'arc' },
    grid: [
      '########################',
      '#.R..............N...R.#',
      '#.R..R.......R.====..R.#',
      '#.R......====........R.#',
      '+..====................+',
      '+......................+',
      '+.P.....E...........c..+',
      '########################',
      '########################',
      '########################',
      '########################',
    ],
  },
  {
    id: 'L07-04', name: 'Sacristia',
    texts: { '4,6': ['GUARDARAM O QUE SOBROU. NÃO SOBROU NADA.'] },
    glyphs: { R: 'arc', v: 'stained' },
    grid: [
      '####################',
      '#..................#',
      '#.....v...R........#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+...N...c....b..E..+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L07-05', name: 'Rosácea',
    texts: { '8,6': ['O VIDRO ESTÁ INTEIRO. ISSO É O PIOR.'] },
    glyphs: { R: 'arc', v: 'stained', T: 'sink' },
    // `CEN-070` trifório (`LVL-07` §5.1): mão única, entra por salto, sai em L07-01 (3,4)
    sink: {
      area: 'LVL-07', room: 0, at: { tx: 3, ty: 4 }, mode: 'touch',
      text: ['A GALERIA SÓ VAI PARA TRÁS.'],
    },
    grid: [
      '####################',
      '#.....R...R.T.vv...#',
      '#.....R...R...vv...#',
      '#.....R...R...vv...#',
      '+.....=======.vv...D',
      '+.............vv...D',
      '+..c....N........E.D',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
];
