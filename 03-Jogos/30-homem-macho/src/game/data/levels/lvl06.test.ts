/** Guarda-corpo de LVL-06 (`[PÓS]`) — fôlego, água por ficha da sala e a trava temporal. */
import { describe, expect, it } from 'vitest';
import { LVL06, LVL06_META } from './lvl06';
import { AREAS, AREA_ORDER, nextArea } from './index';
import { canCross, maxBreath, swimTimeMs } from '../../../core/breathe';

const LARGURAS = [20, 30, 24, 30, 20];
const conta = (room: (typeof LVL06)[number], ch: string): number =>
  [...room.grid.join('')].filter((c) => c === ch).length;

describe('LVL-06 — Mina Esquecida', () => {
  it('tem 5 salas de 11 linhas com as larguras do documento', () => {
    expect(LVL06).toHaveLength(5);
    LVL06.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length, room.id).toBe(LARGURAS[i]);
    });
    expect(LVL06_META.grants).toBe('HAB-06');
    expect(LVL06_META.scope).toBe('pos');
  });

  it('a água é um retângulo por sala, e só nas duas salas alagadas (§3)', () => {
    expect(LVL06.map((r) => r.water ?? null)).toEqual([
      null, null, null,
      { from: 16, to: 28, topRow: 3, bottomRow: 6 },
      { from: 1, to: 18, topRow: 4, bottomRow: 6 },
    ]);
  });

  it('a galeria de L06-05 é a trava temporal: 18 tiles contra 6 s de fôlego base', () => {
    const { water, grid } = LVL06[4];
    const tiles = (water!.to - water!.from + 1);
    expect(tiles).toBe(18);
    // 18 × 64 px a 160 px/s = 7,2 s > 6 s de base e < 20 s de `HAB-06` (§8.2, `P-75`)
    expect(swimTimeMs(tiles * 64)).toBeGreaterThan(maxBreath(false));
    expect(canCross(tiles * 64, false)).toBe(false);
    expect(canCross(tiles * 64, true)).toBe(true);
    // o fundo da galeria é sólido em y=7 e não há bolsão de ar (desvio 4 do §12)
    for (let x = 1; x <= 18; x++) {
      expect(grid[4][x], `teto da água em x=${x}`).toBe('~');
      expect(grid[7][x], `leito em x=${x}`).toBe('#');
    }
  });

  it('`X` é Fôlego aqui, não Força: o glifo é da sala (DEC-023)', () => {
    expect(LVL06.map((r) => conta(r, 'X'))).toEqual([0, 0, 0, 1, 0]);
    expect(LVL06[3].glyphs).toEqual({ V: 'crystal', X: 'breath-item' });
    // as outras salas não reinterpretam glifo nenhum além do cristal
    for (const room of [LVL06[0], LVL06[1], LVL06[2], LVL06[4]]) {
      expect(room.glyphs).toEqual({ V: 'crystal' });
    }
  });

  it('o item de Fôlego fica submerso em L06-04 (DEC-010: alcançável a nado, 6 s bastam)', () => {
    const { grid, water } = LVL06[3];
    const linha = grid.findIndex((row) => row.includes('X'));
    const coluna = grid[linha].indexOf('X');
    expect({ linha, coluna }).toEqual({ linha: 6, coluna: 20 });
    // dentro do retângulo da água e a poucos tiles da borda oeste (a natação é universal)
    expect(coluna).toBeGreaterThanOrEqual(water!.from);
    expect(coluna).toBeLessThanOrEqual(water!.to);
    expect(linha).toBeGreaterThanOrEqual(water!.topRow);
    expect(coluna - water!.from).toBeLessThanOrEqual(6);
  });

  it('os cristais `V` são a única luz e existem nas 5 salas', () => {
    expect(LVL06.map((r) => conta(r, 'V'))).toEqual([1, 2, 4, 2, 2]);
  });

  it('as estacas `A` são cíclicas em L06-02 e L06-03 e ausentes no resto', () => {
    expect(LVL06.map((r) => conta(r, 'A'))).toEqual([0, 2, 2, 0, 0]);
  });

  it('as Sentinelas aparecem 1 · 2 · 1 · 1 · 0 (a galeria não tem guarda)', () => {
    expect(LVL06.map((r) => conta(r, 'E'))).toEqual([1, 2, 1, 1, 0]);
  });

  it('está na progressão, na posição 6 dos 16, e liga a LVL-07 (`DEC-047`)', () => {
    expect(AREAS['LVL-06']?.rooms.length).toBeGreaterThan(0);
    expect(AREA_ORDER.indexOf('LVL-06')).toBe(5);
    // o setor anterior **liga** a este: nenhum setor é uma ilha
    expect(nextArea('LVL-05')?.id).toBe('LVL-06');
    expect(nextArea('LVL-06')?.id).toBe('LVL-07');
  });
});
