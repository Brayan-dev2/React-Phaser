/**
 * LVL-11 — Jardim Profanado (`docs/niveis/LVL-11.md` §4).
 *
 * Setor `[PÓS]` (`D-04`), **o único que não mata**: cai no vão, respawn na entrada da sala,
 * zero de dano (`DEC-011`). A moeda aqui é tempo, não vida.
 *
 * Entrega `HAB-07` Planar (`ITM-010`, `P-56`) e **a habilidade é um câmbio**: ela converte
 * altura em distância e nada mais (`core/glide.ts`). Por isso o setor tem três vãos de
 * 11/12/13 tiles e nenhum deles é atravessável sem o estandarte:
 *   L11-02 → x 9–19  (11 t / 704 px) — ensino
 *   L11-03 → x 9–20  (12 t / 768 px) — prática
 *   L11-04 → x 14–26 (13 t / 832 px) — a trava de 11 → 12
 *
 * **Zero plataformas e zero argolas no setor inteiro**, e nos dois casos é regra, não
 * estilo: uma plataforma sobre um vão o encurta até virar salto duplo (§8.3), e o gancho
 * alcança 8 tiles contra vãos de 11+ (§8.2).
 *
 * A trepadeira `c` **não é decoração**: ela marca as duas beiradas de todo vão e nenhuma
 * beirada sólida tem — é o `PAT-LD-09` de um obstáculo que não se mede de baixo para cima.
 */
import type { Room } from './lvl01';

export const LVL11_META = {
  id: 'LVL-11',
  name: 'Jardim Profanado',
  pal: 'PAL-11',
  bgm: 'BGM-01',
  amb: 'AMB-11',
  scope: 'pos',
  grants: 'HAB-07',
  /** §9: `lethal_falls = false` — o único setor em que `TST-014` é alcançável de primeira. */
  lethalFalls: false,
} as const;

export const LVL11: Room[] = [
  {
    id: 'L11-01', name: 'Orla do Jardim',
    texts: {
      '3,6': ['JARDIM FECHADO POR MOTIVO DE FLORA.', 'RETIRAR AS FLORES ANTES DE ENTRAR.'],
    },
    glyphs: { f: 'flora', s: 'statue', c: 'vine', o: 'flower' },
    grid: [
      '####################',
      '#..................#',
      '#.f..............f.#',
      '#..................#',
      '+..................+',
      '+.............s....+',
      '+..N.c...E.o..s....+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L11-02', name: 'Estufa',
    texts: {
      '21,6': ['AS SEMENTES FORAM SEMEADAS NO TURNO DA NOITE.', 'NÃO HÁ REGISTRO DE QUEM.'],
    },
    // exposição 1 de `PAT-LD-02`: a habilidade e o obstáculo na mesma tela, zero inimigos
    // `DEC-042`: o estandarte deixou de estar na estufa — cai de chefe (8 %, garantia ao 12.º)
    glyphs: { f: 'flora', w: 'glass', o: 'flower', c: 'vine' },
    grid: [
      '##############################',
      '#..w...........w.............#',
      '#.f.....................f....#',
      '#............o...............#',
      '+............................+',
      '+............................+',
      '+.P.....c...........cN.......+',
      '#########...........##########',
      '#########...........##########',
      '#########...........##########',
      '#########...........##########',
    ],
  },
  {
    id: 'L11-03', name: 'Corredor de Cipós',
    texts: {
      '27,6': ['PODAR SÓ ATÉ A ALTURA DO PEITO.', 'ACIMA DISSO É TERRENO DA VIGÍLIA.'],
    },
    glyphs: { f: 'flora', c: 'vine', o: 'flower' },
    grid: [
      '##############################',
      '#............................#',
      '#..f......................f..#',
      '#..............o.............#',
      '+............................+',
      '+............................+',
      '+.......c............c...E.N.+',
      '#########............#########',
      '#########............#########',
      '#########............#########',
      '#########............#########',
    ],
  },
  {
    id: 'L11-04', name: 'O Vão',
    texts: {
      '30,6': ['O VÃO NÃO TEM NOME.', 'NUNCA TEVE GUARDA. NUNCA TEVE PORTA.'],
    },
    glyphs: { f: 'flora', c: 'vine', o: 'flower' },
    grid: [
      '########################################',
      '#......................................#',
      '#.......f...........................f..#',
      '#...................o..................#',
      '+......................................+',
      '+......................................+',
      '+..P..E......c.............c..N..E.....+',
      '##############.............#############',
      '##############.............#############',
      '##############.............#############',
      '##############.............#############',
    ],
  },
  {
    id: 'L11-05', name: 'Chaminé',
    texts: {
      '6,6': ['O CONDUTO VAI ATÉ EMBAIXO.', 'NINGUÉM VOLTOU PARA DIZER ATÉ ONDE.'],
    },
    // §4.5 desvio 5: o conduto fica **no caminho da saída** — sem `interact` viraria
    // queda acidental, que é o erro que `P-37` corrigiu em LVL-04
    glyphs: { f: 'flora', V: 'duct', c: 'vine', o: 'flower' },
    sink: {
      area: 'LVL-11', room: 0, at: { tx: 1, ty: 6 }, mode: 'interact',
      text: ['O CONDUTO DESCE ATÉ A ORLA.', 'SÓ DESCE.'],
    },
    grid: [
      '####################',
      '#..................#',
      '#...........f......#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..P..N...V...c.o..+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
];

/** Os três vãos do setor, em tiles — a régua de `§8` em dado, para os testes. */
export const LVL11_GAPS = [
  { room: 'L11-02', from: 9, to: 19, tiles: 11, role: 'ensino' },
  { room: 'L11-03', from: 9, to: 20, tiles: 12, role: 'pratica' },
  { room: 'L11-04', from: 14, to: 26, tiles: 13, role: 'trava' },
] as const;
