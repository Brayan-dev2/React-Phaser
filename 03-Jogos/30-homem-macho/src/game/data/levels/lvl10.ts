/**
 * LVL-10 — Torre da Vigília (`docs/niveis/LVL-10.md` §4).
 *
 * Setor `[PÓS]` (`D-04`), **o hub do mundo** e o único do Ato III com quarto seguro.
 * Entrega `HAB-03` Garra e é o setor que devolveu à altura o direito de ser trava:
 * a saída sobe para o teto (`DEC-015`) em vez de a sala ficar mais alta (§6).
 *
 * Zero plataformas no setor inteiro — e isso **não** é estilo: uma plataforma sob o
 * alçapão poria o duplo ao alcance dele e destruiria a trava (§6.3, regra 1).
 *
 * Três conexões: LVL-09 (de onde vem), LVL-03 pelo **poço** (atalho de longa distância,
 * §5) e LVL-11 pelo **alçapão**.
 */
import type { Room } from './lvl01';

export const LVL10_META = {
  id: 'LVL-10',
  name: 'Torre da Vigília',
  pal: 'PAL-10',
  bgm: 'BGM-01',
  amb: 'AMB-10',
  scope: 'pos',
  grants: 'HAB-03',
} as const;

export const LVL10: Room[] = [
  {
    id: 'L10-01', name: 'Base',
    texts: { '6,6': ['A TORRE ESTÁ DE PÉ. A VIGÍLIA NÃO.'] },
    glyphs: { t: 'torch', v: 'window', W: 'well', r: 'rope', H: 'climb-wall' },
    // exposição 1 de `PAT-LD-03`: alçapão **lacrado** a 6 tiles do chão (§7.2)
    hatch: { from: 9, to: 10, state: 'sealed' },
    // §5: o poço desce para LVL-03 — o primeiro atalho entre setores do jogo
    sink: {
      area: 'LVL-03', room: 0, at: { tx: 4, ty: 5 }, mode: 'interact', requires: 'HAB-03',
      text: ['O POÇO NÃO TEM FUNDO CONHECIDO.', 'ELE SÓ DESCE.'],
    },
    grid: [
      '#########^^#########',
      '#..................#',
      '#..v............v..#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+.t...N.....E.W..r.+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L10-02', name: 'Arsenal',
    texts: { '3,6': ['ARMÁRIO DO TERCEIRO TURNO. NINGUÉM ASSINOU A DEVOLUÇÃO.'] },
    glyphs: { t: 'torch', v: 'window' },
    // `DEC-042`: a garra deixou de estar no arsenal — cai de chefe (8 %, garantia ao 12.º)
    grid: [
      '####################',
      '#..................#',
      '#....t...v.........#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..N.......E...E...+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L10-03', name: 'Sala do Sino',
    texts: { '17,6': ['O SINO NÃO TEM BADALO. A RONDA ANDA ASSIM MESMO.'] },
    glyphs: { B: 'bell', r: 'rope', t: 'torch', v: 'window' },
    // `CEN-078`: a corda desce para o pé da torre — atalho interno, mão única (§4.3)
    sink: {
      area: 'LVL-10', room: 0, at: { tx: 17, ty: 6 }, mode: 'interact',
      text: ['A CORDA DESCE ATÉ O PÉ DA TORRE.', 'NINGUÉM A PUXOU EM ANOS.'],
    },
    grid: [
      '##############################',
      '#.............BBB............#',
      '#.............BBB..........v.#',
      '#.............BBB............#',
      'D.............r..............+',
      'D.............r..............+',
      'D..P...t......r..N....E..t...+',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  {
    id: 'L10-04', name: 'Quarto Seguro',
    texts: {
      '7,6': ['AVISO DA VIGÍLIA', 'O TURNO NÃO TERMINA. O DESCANSO SIM.', 'DURMA QUINZE MINUTOS.'],
      '11,6': ['DORMIR É UM TURNO TAMBÉM.'],
    },
    glyphs: { t: 'torch', v: 'window' },
    grid: [
      '####################',
      '#..................#',
      '#.....v............#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..P...Q...N..t....+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L10-05', name: 'Escada em Caracol',
    texts: { '2,6': ['SUBIR É SÓ NÃO PARAR.'] },
    glyphs: { H: 'climb-wall', G: 'spiral', t: 'torch' },
    // exposição 2: o **mesmo** alçapão, agora aberto, com a parede de ganchos embaixo (§7.2)
    hatch: { from: 13, to: 14, state: 'open', requires: 'HAB-03' },
    climbable: [{ from: 13, to: 14, topRow: 1, bottomRow: 6 }],
    grid: [
      '#############^^#####',
      '#............HH....#',
      '#............HH...G#',
      '#............HH...G#',
      '+............HH...G#',
      '+............HH...G#',
      '+.N...t......HH..EG#',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
];
