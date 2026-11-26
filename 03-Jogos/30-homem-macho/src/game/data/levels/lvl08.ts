/**
 * LVL-08 — Pátio Rubro (`docs/niveis/LVL-08.md` §4).
 *
 * Setor `[PÓS]` (`D-04`) e **o pico do Ato II**: o único setor do jogo em que a passagem
 * depende de ganhar uma luta. A trava é um corpo (grade leste da arena, `CEN-065`), não
 * uma porta; a mecânica nova é a **areia** (`CEN-064`), atrito de piso sem dano.
 *
 * A areia é um **retângulo declarado por sala** (`sand`), como a água de LVL-06 §3: o
 * glifo `s` só deixa a grade legível. As âncoras `,` da arena são o estado dormente que
 * vira areia no relógio do chefe (§7.3).
 */
import type { Room } from './lvl01';

export const LVL08_META = {
  id: 'LVL-08',
  name: 'Pátio Rubro',
  pal: 'PAL-08',
  bgm: 'BGM-02',
  scope: 'pos',
  grants: null,
} as const;

export const LVL08: Room[] = [
  {
    id: 'L08-01', name: 'Areia',
    texts: { '13,6': ['A RONDA PASSA AQUI TODO DIA. NÃO PASSA NINGUÉM.'] },
    glyphs: { S: 'sun', f: 'banner', h: 'chain', m: 'hoist', s: 'sand' },
    sand: [{ from: 4, to: 5, topRow: 6, bottomRow: 6 }],
    // `CEN-066` monta-carga: 2 paradas, travado até o chefe cair (§4.1)
    hoist: { area: 'LVL-08', room: 4, at: { tx: 16, ty: 6 }, lockedUntil: 'boss-defeated' },
    grid: [
      '##############################',
      '#......................SSS...#',
      '#.......f......f.......SSS...#',
      '#......................SSS...#',
      'D............................+',
      'D............................+',
      'D...ss.......N....m....E...h.+',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  {
    id: 'L08-02', name: 'Terraço',
    texts: { '7,3': ['O SOL NÃO SE MOVE. ISSO NÃO É O SOL.'] },
    glyphs: { f: 'banner', h: 'chain', s: 'sand' },
    sand: [{ from: 2, to: 3, topRow: 6, bottomRow: 6 }, { from: 13, to: 14, topRow: 6, bottomRow: 6 }, { from: 25, to: 26, topRow: 6, bottomRow: 6 }],
    grid: [
      '##############################',
      '#............................#',
      '#...........f..........h.....#',
      '#......N...........E.........#',
      '+....=====.......=====.......+',
      '+............................+',
      '+.ss.......E.ss..........ss..+',
      '##############################',
      '##############################',
      '##############################',
      '##############################',
    ],
  },
  {
    id: 'L08-03', name: 'Antessala',
    texts: { '12,3': ['ESTANDARTE DA RONDA. DOZE HOMENS. DOZE NOMES. NENHUM ROSTO.'] },
    glyphs: { h: 'chain', s: 'sand' },
    sand: [{ from: 8, to: 10, topRow: 6, bottomRow: 6 }],
    grid: [
      '####################',
      '#..................#',
      '#.h................#',
      '#...........N......#',
      '+...====...====....+',
      '+..................+',
      '+.......sEs......P.+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L08-04', name: 'Arena',
    glyphs: { G: 'grate', S: 'sun', f: 'banner' },
    // `ENT-004` O Alferes da Ronda: chefe médio (§5.1)
    boss: 'ENT-004',
    // 4 âncoras dormentes, 3 tiles cada (§7.3)
    anchors: [5, 10, 15, 20],
    grid: [
      '########################',
      '#...f......SS.....f....#',
      '#..........SS..........#',
      '#......................#',
      'G......................G',
      'G......................G',
      'G....,....,....,..L.,..G',
      '########################',
      '########################',
      '########################',
      '########################',
    ],
  },
  {
    id: 'L08-05', name: 'Respiro',
    texts: { '11,6': ['ELE NÃO ESTAVA ME ESPERANDO. ELE ESTAVA DE SERVIÇO.'] },
    glyphs: { I: 'boss-reward', f: 'banner', h: 'chain', m: 'hoist' },
    hoist: { area: 'LVL-08', room: 0, at: { tx: 18, ty: 6 }, lockedUntil: 'boss-defeated' },
    grid: [
      '####################',
      '#..................#',
      '#......f....h......#',
      '#..................#',
      '+..................D',
      '+..................D',
      '+..P....I..N....m..D',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L08-06', name: 'Portão',
    texts: { '8,6': ['O TURNO ACABOU. O SERVIÇO NÃO.'] },
    glyphs: { f: 'banner', h: 'chain' },
    grid: [
      '####################',
      '#..................#',
      '#....f....h...f....#',
      '#..................#',
      '+..................D',
      '+..................D',
      '+.......N..........D',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
];
