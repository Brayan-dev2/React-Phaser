/** Guarda-corpo de LVL-10 (`[PÓS]`) — o hub, o alçapão e a parede de ganchos. */
import { describe, expect, it } from 'vitest';
import { LVL10, LVL10_META } from './lvl10';
import { AREAS, AREA_ORDER, nextArea } from './index';
import { HATCH, ITEMS, TILE } from '../tuning';
import {
  HATCH_HEIGHT_PX, hatchNeedsClimb, hatchShortfall, noPlatformsUnderHatch, wallIsContinuous,
} from '../../../core/climb';

const LARGURAS = [20, 20, 30, 20, 20];
const conta = (room: (typeof LVL10)[number], ch: string): number =>
  [...room.grid.join('')].filter((c) => c === ch).length;
/** Plataformas `=` de uma grade, no formato que `noPlatformsUnderHatch` entende. */
const plataformas = (grid: readonly string[]): Array<{ from: number; to: number; topRow: number }> => {
  const out: Array<{ from: number; to: number; topRow: number }> = [];
  grid.forEach((linha, y) => {
    [...linha].forEach((c, x) => { if (c === '=') out.push({ from: x, to: x, topRow: y }); });
  });
  return out;
};

describe('LVL-10 — Torre da Vigília', () => {
  it('tem 5 salas de 11 linhas e 110 tiles no total (§1 campo 7)', () => {
    expect(LVL10).toHaveLength(5);
    LVL10.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length, room.id).toBe(LARGURAS[i]);
    });
    expect(LVL10.reduce((n, r) => n + r.grid[0].length, 0)).toBe(110);
  });

  it('HAB-03 já não está no arsenal: cai de chefe (`DEC-042`)', () => {
    expect(LVL10_META.grants).toBe('HAB-03');
    expect(LVL10.map((r) => conta(r, 'X'))).toEqual([0, 0, 0, 0, 0]);
    expect(LVL10[1].glyphs?.X).toBeUndefined();
  });

  it('não tem plataforma nenhuma — e isso é a trava, não o estilo (§6.3)', () => {
    expect(LVL10.map((r) => conta(r, '='))).toEqual([0, 0, 0, 0, 0]);
    expect(LVL10.map((r) => conta(r, 'A'))).toEqual([0, 0, 0, 0, 0]);
  });

  it('o alçapão lacrado de L10-01 fica a 6 tiles do piso: o duplo não chega (§6.2)', () => {
    expect(LVL10[0].hatch).toEqual({ from: 9, to: 10, state: 'sealed' });
    expect(LVL10[0].grid[0].slice(9, 11)).toBe('^^');
    expect(HATCH_HEIGHT_PX).toBe(6 * TILE);
    expect(hatchShortfall()).toBeGreaterThan(100);          // 108 px de falta
    expect(hatchNeedsClimb()).toBe(true);
  });

  it('o alçapão aberto de L10-05 é a trava 10 → 11 e exige HAB-03 (§6.3)', () => {
    expect(LVL10[4].hatch).toEqual({ from: 13, to: 14, state: 'open', requires: 'HAB-03' });
    expect(HATCH.widthTiles).toBe(2);
    expect(LVL10[4].grid[0].slice(13, 15)).toBe('^^');
  });

  it('nenhuma plataforma sob alçapão, em sala alguma (§6.3 regra 1)', () => {
    for (const room of LVL10) {
      const h = room.hatch;
      if (!h) continue;
      expect(noPlatformsUnderHatch(h.from, h.to, plataformas(room.grid)), room.id).toBe(true);
    }
  });

  it('a parede de ganchos vai do piso ao teto, sem interrupção (§6.3 regra 2)', () => {
    expect(LVL10[4].climbable).toEqual([{ from: 13, to: 14, topRow: 1, bottomRow: 6 }]);
    expect(wallIsContinuous(LVL10[4].climbable!)).toBe(true);
    // 6 tiles de altura: 384 px a 90 px/s = 4,3 s
    expect(6 * TILE).toBe(384);
  });

  it('a parede `H` está alinhada com o alçapão: sobe-se reto para dentro dele (§4.5)', () => {
    const { grid } = LVL10[4];
    for (let y = 1; y <= 6; y++) expect(grid[y].slice(13, 15), `y=${y}`).toBe('HH');
    expect(grid[0].slice(13, 15)).toBe('^^');
  });

  it('as 5 Sentinelas: 1 · 2 · 1 · 0 · 1, e o quarto seguro é o zero (§1 campo 10)', () => {
    expect(LVL10.map((r) => conta(r, 'E'))).toEqual([1, 2, 1, 0, 1]);
    // o quarto seguro é seguro por três motivos ao mesmo tempo (§4.4)
    expect(conta(LVL10[3], 'E')).toBe(0);
    expect(conta(LVL10[3], 'A')).toBe(0);
    expect(conta(LVL10[3], '=')).toBe(0);
    expect(LVL10[3].grid[6][7]).toBe('Q');                  // quadro de aviso (`LOR-04`)
  });

  it('o sino é 3×3 e a corda desce até o piso (§4.3)', () => {
    const { grid } = LVL10[2];
    for (let y = 1; y <= 3; y++) expect(grid[y].slice(14, 17), `y=${y}`).toBe('BBB');
    for (let y = 4; y <= 6; y++) expect(grid[y][14], `y=${y}`).toBe('r');
  });

  it('o poço exige a garra e desce para LVL-03; a corda é atalho e não salva (§5, §9)', () => {
    expect(LVL10[0].sink).toMatchObject({
      area: 'LVL-03', mode: 'interact', requires: 'HAB-03',
    });
    expect(LVL10[2].sink).toMatchObject({ area: 'LVL-10', room: 0, mode: 'interact' });
    expect(LVL10[2].sink?.requires).toBeUndefined();
  });

  it('os dois pontos de salvamento e os 5 marcos de lore estão na grade (§2)', () => {
    expect(LVL10[2].grid[6][3]).toBe('P');
    expect(LVL10[3].grid[6][3]).toBe('P');
    expect(LVL10.filter((r) => r.texts).length).toBe(5);
  });

  it('`HAB-03` é permanente e sobrevive à morte (§7.1, TST-005)', () => {
    expect(ITEMS['ITM-009']).toMatchObject({ permanent: true, kind: 'climb' });
  });

  it('está na progressão, na posição 10 dos 16, e liga a LVL-11 (`DEC-047`)', () => {
    expect(AREAS['LVL-10']?.rooms.length).toBeGreaterThan(0);
    expect(AREA_ORDER.indexOf('LVL-10')).toBe(9);
    // o setor anterior **liga** a este: nenhum setor é uma ilha
    expect(nextArea('LVL-09')?.id).toBe('LVL-10');
    expect(nextArea('LVL-10')?.id).toBe('LVL-11');
  });
});
