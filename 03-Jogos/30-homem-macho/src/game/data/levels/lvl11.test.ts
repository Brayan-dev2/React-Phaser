/** Guarda-corpo de LVL-11 (`[PÓS]`) — o jardim que não mata, os três vãos e o câmbio. */
import { describe, expect, it } from 'vitest';
import { LVL11, LVL11_GAPS, LVL11_META } from './lvl11';
import { AREAS, AREA_ORDER, nextArea } from './index';
import { GLIDE, TILE } from '../tuning';
import { GLIDE as GLIDE_RL, HORIZONTAL_RULER, gapVerdict, glideRange } from '../../../core/glide';

const LARGURAS = [20, 30, 30, 40, 20];
const conta = (room: (typeof LVL11)[number], ch: string): number =>
  [...room.grid.join('')].filter((c) => c === ch).length;

/** Colunas sem piso na linha 7 (o vão): o índice da linha 7 é o piso da sala. */
function vao(room: (typeof LVL11)[number]): { from: number; to: number; tiles: number } | null {
  const piso = room.grid[7];
  const cols: number[] = [];
  [...piso].forEach((c, x) => { if (c !== '#') cols.push(x); });
  if (!cols.length) return null;
  return { from: cols[0], to: cols[cols.length - 1], tiles: cols.length };
}

describe('LVL-11 — Jardim Profanado', () => {
  it('tem 5 salas de 11 linhas e 140 tiles no total (§1 campo 7)', () => {
    expect(LVL11).toHaveLength(5);
    LVL11.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length, room.id).toBe(LARGURAS[i]);
    });
    expect(LVL11.reduce((n, r) => n + r.grid[0].length, 0)).toBe(140);
  });

  it('está na progressão, na posição 11 dos 16, e liga a LVL-12 (`DEC-047`)', () => {
    expect(AREAS['LVL-11']?.rooms.length).toBeGreaterThan(0);
    expect(AREA_ORDER.indexOf('LVL-11')).toBe(10);
    // o setor anterior **liga** a este: nenhum setor é uma ilha
    expect(nextArea('LVL-10')?.id).toBe('LVL-11');
    expect(nextArea('LVL-11')?.id).toBe('LVL-12');
  });

  it('HAB-07 já não está na estufa: cai de chefe, e o vão continua a ser visível (`DEC-042`)', () => {
    expect(LVL11_META.grants).toBe('HAB-07');
    expect(LVL11.map((r) => conta(r, 'X'))).toEqual([0, 0, 0, 0, 0]);
    expect(LVL11[1].glyphs?.X).toBeUndefined();
    // a geometria não mudou: o vão de L11-02 continua a começar em x=9
    expect(vao(LVL11[1])?.from).toBe(9);
  });

  it('o setor não mata: zero armadilha, zero plataforma, zero argola (§5, §8.2, §8.3)', () => {
    for (const ch of ['A', '=']) expect(LVL11.map((r) => conta(r, ch))).toEqual([0, 0, 0, 0, 0]);
    // `o` é flor neste setor, não argola: nenhuma sala declara `o: 'ring'`
    for (const room of LVL11) expect(room.glyphs?.o).toBe('flower');
  });

  it('os três vãos medem 11, 12 e 13 tiles e nenhum é atravessável sem a habilidade (§8)', () => {
    const medidos = LVL11.map(vao);
    expect(medidos.map((v) => v?.tiles ?? 0)).toEqual([0, 11, 12, 13, 0]);
    expect(medidos[1]).toEqual({ from: 9, to: 19, tiles: 11 });
    expect(medidos[2]).toEqual({ from: 9, to: 20, tiles: 12 });
    expect(medidos[3]).toEqual({ from: 14, to: 26, tiles: 13 });
    for (const g of LVL11_GAPS) {
      const px = g.tiles * TILE;
      expect(gapVerdict(px)).toBe('exige-glide');
      // a falta em relação ao duplo correndo cresce degrau a degrau: 170/234/298
      expect(px - HORIZONTAL_RULER.doubleRun).toBe(170 + (g.tiles - 11) * 64);
    }
    // e todos cabem no planeio, com a margem mínima de 190 px no vão de 13
    for (const g of LVL11_GAPS) expect(g.tiles * TILE).toBeLessThan(HORIZONTAL_RULER.glide);
    expect(HORIZONTAL_RULER.glide - 13 * TILE).toBe(190);
  });

  it('a régua de `tuning.ts` é a mesma de `core/glide.ts` (PAT-C-04)', () => {
    expect(GLIDE.fallSpeed).toBe(GLIDE_RL.fallSpeed);
    expect(GLIDE.airSpeed).toBe(GLIDE_RL.airSpeed);
    expect(GLIDE.rangePx).toBe(HORIZONTAL_RULER.glide);
    expect(GLIDE.rangeTiles).toBeCloseTo(HORIZONTAL_RULER.glide / TILE, 1);
  });

  it('o planeio não dá altura: a 0 px de queda o alcance é 0 (§7.2)', () => {
    expect(glideRange(0)).toBe(0);
    expect(GLIDE_RL.canGainHeight).toBe(false);
    // planar num salto simples (529 px) é PIOR que o duplo correndo (534)
    expect(glideRange(206)).toBeLessThan(HORIZONTAL_RULER.doubleRun);
  });

  it('todo vão tem trepadeira nas DUAS beiradas (`PAT-LD-09` §3)', () => {
    for (const g of LVL11_GAPS) {
      const room = LVL11.find((r) => r.id === g.room)!;
      // a trepadeira fica na linha 6, uma coluna dentro de cada beirada (x-1 e x+1)
      expect(room.grid[6][g.from - 1], `${g.room} oeste`).toBe('c');
      expect(room.grid[6][g.to + 1], `${g.room} leste`).toBe('c');
      expect(room.glyphs?.c).toBe('vine');
    }
    // e nenhuma sala sem vão tem trepadeira onde não deveria: L11-01 tem uma só, decorativa
    expect(conta(LVL11[0], 'c')).toBe(1);
    expect(conta(LVL11[4], 'c')).toBe(1);
  });

  it('cada sala tem um marco de lore e um `P` só onde a ficha pede (§2)', () => {
    expect(LVL11.map((r) => conta(r, 'N'))).toEqual([1, 1, 1, 1, 1]);
    expect(LVL11.map((r) => conta(r, 'P'))).toEqual([0, 1, 0, 1, 1]);
    expect(LVL11.map((r) => r.texts ? Object.keys(r.texts).length : 0)).toEqual([1, 1, 1, 1, 1]);
    // todo `P` está do lado de cá do vão (desvio 4): x menor que o início do vão
    for (const g of LVL11_GAPS) {
      const room = LVL11.find((r) => r.id === g.room)!;
      const p = room.grid[6].indexOf('P');
      if (p >= 0) expect(p).toBeLessThan(g.from);
    }
  });

  it('4 Sentinelas nas grades, nenhuma obrigatória (`PAT-LD-10`)', () => {
    // §1 campo 10 publica **5**; as grades de §4 têm **4** (desvio 8 em `LVL-11.md` §12)
    expect(LVL11.map((r) => conta(r, 'E'))).toEqual([1, 0, 1, 2, 0]);
    expect(LVL11.reduce((n, r) => n + conta(r, 'E'), 0)).toBe(4);
    // a de L11-03 fica **depois** do vão: combate na chegada, nunca no salto
    const sala3 = LVL11[2];
    const v = vao(sala3)!;
    expect(sala3.grid[6].indexOf('E')).toBeGreaterThan(v.to);
  });

  it('o conduto de L11-05 é `interact`, mão única, e NÃO salva (§4.5, §9)', () => {
    const sala5 = LVL11[4];
    expect(sala5.glyphs?.V).toBe('duct');
    expect(sala5.sink).toEqual({
      area: 'LVL-11', room: 0, at: { tx: 1, ty: 6 }, mode: 'interact',
      text: ['O CONDUTO DESCE ATÉ A ORLA.', 'SÓ DESCE.'],
    });
    expect(sala5.sink?.mode).toBe('interact');    // nunca `touch`: o glifo está no caminho da saída
  });

  it('nenhum alçapão no setor: o jardim não tem teto (§3)', () => {
    for (const room of LVL11) {
      expect(room.hatch).toBeUndefined();
      expect(room.grid[0]).not.toContain('^');
    }
  });
});
