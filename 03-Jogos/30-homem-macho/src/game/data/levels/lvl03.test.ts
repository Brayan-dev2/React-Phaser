/** Guarda-corpo de LVL-03 — e as promessas da arena em `PAT-LD-07` / `DEC-012` / `DEC-013`. */
import { describe, expect, it } from 'vitest';
import { LVL03 } from './lvl03';

const WIDTHS = [20, 24, 20, 20];
const glyphs = LVL03.flatMap((r) => r.grid).join('');

describe('LVL-03 (docs/niveis/LVL-03.md §4)', () => {
  it('tem 4 salas de 11 linhas com as larguras do documento', () => {
    expect(LVL03).toHaveLength(4);
    LVL03.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length).toBe(WIDTHS[i]);
    });
  });

  it('a arena tem 24 tiles e piso contínuo em y=7 (PAT-LD-07)', () => {
    const arena = LVL03[1];
    expect(arena.grid[1].length).toBe(24);
    expect([...arena.grid[7]].every((c) => c === '#')).toBe(true);
    expect([...arena.grid[10]].every((c) => c === '#')).toBe(true);
  });

  it('existe exatamente 1 chefe, na arena', () => {
    expect(glyphs.split('B').length - 1).toBe(1);
    expect(LVL03[1].grid[6][20]).toBe('B');
  });

  it('2 pilares quebráveis de 2 tiles de altura, apoiados no piso (DEC-013)', () => {
    const arena = LVL03[1];
    expect(arena.breakables).toHaveLength(2);
    for (const b of arena.breakables ?? []) {
      expect(b.bottomRow - b.topRow + 1).toBe(2);
      expect(b.bottomRow).toBe(6);          // encosta no piso y=7
      for (let x = b.from; x <= b.to; x++) {
        for (let y = b.topRow; y <= b.bottomRow; y++) expect(arena.grid[y][x]).toBe('#');
      }
    }
  });

  it('a arena não tem coletável durante a luta (a recompensa fica em L03-03)', () => {
    expect(LVL03[1].grid.join('')).not.toMatch(/[hFsjI]/);
    expect(LVL03[2].grid[6][10]).toBe('I');
  });

  it('a saída da arena é um `+` na coluna final (destrancada só após o chefe)', () => {
    expect(LVL03[1].grid.slice(4, 7).every((row) => row.endsWith('+'))).toBe(true);
  });

  it('a última sala fecha o recorte com a porta dourada', () => {
    const last = LVL03[3].grid;
    expect(last.slice(4, 7).every((row) => row.endsWith('D'))).toBe(true);
  });

  it('há ponto de salvamento depois do chefe e nenhum antes da arena', () => {
    expect(LVL03[0].grid.join('')).not.toContain('P');
    expect(LVL03[2].grid[6][14]).toBe('P');
  });

  it('toda sala tem abertura oeste menos a primeira, e saída leste em todas', () => {
    LVL03.forEach((room, i) => {
      expect(room.grid.slice(4, 7).some((r) => r.endsWith('+') || r.endsWith('D'))).toBe(true);
      const west = room.grid.slice(4, 7).every((r) => r.startsWith('+'));
      if (i === 0) expect(west).toBe(true); // L03-01 vem de LVL-02
      else expect(west).toBe(true);
    });
  });
});
