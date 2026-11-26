/**
 * LVL-09 — Canais Sombrios (`docs/niveis/LVL-09.md` §4).
 *
 * Setor `[PÓS]` (`D-04`) que **entrega `HAB-04` Gancho** e é o negativo fotográfico de
 * LVL-07: onde a catedral ensinava escala, o canal ensina **aperto** — e o aperto aqui é
 * *encher*, não *reduzir*, porque o piso é sempre `y=7` (`DEC-007`).
 *
 * Nenhuma sala usa `=` (§5): **zero plataformas no setor inteiro**, e é por isso que a
 * tabela de alcance vertical fica vazia. A trava 09 → 10 é um **vão horizontal de 8 tiles**
 * em L09-05 (§6.1), não uma subida.
 *
 * A água é retângulo declarado por sala (`water`), como em LVL-06 §3 — o glifo `~` só deixa
 * a grade legível.
 */
import type { Room } from './lvl01';

export const LVL09_META = {
  id: 'LVL-09',
  name: 'Canais Sombrios',
  pal: 'PAL-09',
  bgm: 'BGM-01',
  amb: 'AMB-09',
  scope: 'pos',
  grants: 'HAB-04',
} as const;

export const LVL09: Room[] = [
  {
    id: 'L09-01', name: 'Boca',
    texts: { '6,6': ['O CANAL ESTÁ SECO. A ÁGUA NÃO SABE DISSO.'] },
    glyphs: { v: 'brick-arch', V: 'sink-arrival', l: 'lamp', w: 'rat' },
    // §4.1: vazamento de 1 tile de profundidade, sem afogamento
    water: { from: 11, to: 13, topRow: 6, bottomRow: 6 },
    grid: [
      '####################',
      '####################',
      '#....v...V...v.....#',
      '#..................#',
      'D..................+',
      'D..................+',
      'D..l..N....~~~.w...+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L09-02', name: 'Canal Raso',
    texts: { '24,6': ['A VIGÍLIA SUBIA POR AQUI. A ESCADA APODRECEU.'] },
    glyphs: { v: 'brick-arch', o: 'ring', l: 'lamp' },
    // §4.2: poço seco de 8 tiles (x = 13–20). Queda = respawn na entrada, sem dano.
    water: { from: 10, to: 11, topRow: 6, bottomRow: 6 },
    grid: [
      '##############################',
      '##############################',
      '#...........v.............v..#',
      '#...............o............#',
      '+............................+',
      '+............................+',
      '+.l.P...E.~~............N....+',
      '#############........#########',
      '#############........#########',
      '#############........#########',
      '#############........#########',
    ],
  },
  {
    id: 'L09-03', name: 'Galeria Cega',
    texts: { '18,6': ['QUEM CAVOU ISSO NÃO QUERIA QUE ALGUÉM ACHASSE.'] },
    glyphs: { l: 'lamp', w: 'rat' },
    // §4.3: 90% do volume é água; 16 tiles = 8,5 s contra 20 s de fôlego
    water: { from: 1, to: 16, topRow: 4, bottomRow: 6 },
    grid: [
      '####################',
      '####################',
      '####################',
      '#...l.........l....#',
      '+~~~~~~~~~~~~~~~~..+',
      '+~~~~~~~~~~~~~~~~..+',
      '+~~~~~~~~~~~~~~~~wN+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L09-04', name: 'Casa de Bombas',
    texts: { '13,6': ['TRÊS TURNOS POR DIA. NINGUÉM TROCOU O TURNO.'] },
    glyphs: { v: 'brick-arch', g: 'sluice' },
    /*
     * `DEC-042`: o gancho **não está mais aqui**. As três habilidades raras (gancho, garra,
     * estandarte) passaram a cair de chefe com 8 % — um pedestal garantido tornava o drop uma
     * formalidade. O pedestal ficou vazio: a sala continua a ser a casa de bombas.
     */
    grid: [
      '####################',
      '####################',
      '#........v.........#',
      '#..................#',
      '+..................+',
      '+..................+',
      '+..g.......E.N..E..+',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
  {
    id: 'L09-05', name: 'Poço',
    texts: { '3,6': ['O FUNDO É FUNDO. NÃO OLHE.'] },
    glyphs: { v: 'brick-arch', o: 'ring', l: 'lamp' },
    // §4.5: canal de 8 tiles (x = 10–17) — a trava 09 → 10. A argola fica no meio dele.
    grid: [
      '##############################',
      '##############################',
      '#....o....................v..#',
      '#.............o..............#',
      '+............................+',
      '+............................+',
      '+..N...l.............E..l....+',
      '##########........############',
      '##########........############',
      '##########........############',
      '##########........############',
    ],
  },
  {
    id: 'L09-06', name: 'Escada de Serviço',
    glyphs: { V: 'sink', o: 'ring', l: 'lamp' },
    water: { from: 4, to: 14, topRow: 4, bottomRow: 6 },
    // §4.6: `interact` separa passagem de armadilha — atalho de mão única para L09-01
    sink: {
      area: 'LVL-09', room: 0, at: { tx: 9, ty: 2 }, mode: 'interact',
      text: ['A GRADE CEDE.', 'O CANAL DEVOLVE AO COMEÇO.'],
    },
    grid: [
      '####################',
      '####################',
      '#......o....o...l..#',
      '#..................#',
      '+...~~~~~~~~~~~....D',
      '+...~~~~~~~~~~~....D',
      '+.P.~~~~~~~~~~~.V..D',
      '####################',
      '####################',
      '####################',
      '####################',
    ],
  },
];
