/** Guarda-corpo de LVL-04 (`[PÓS]`) — grade, glifos novos e a formação da Ronda. */
import { describe, expect, it } from 'vitest';
import { LVL04, LVL04_META } from './lvl04';
import { AREAS, AREA_ORDER, nextArea } from './index';

const LARGURAS = [30, 40, 40, 20, 24];
const todas = LVL04.map((r) => r.grid.join(''));

describe('LVL-04 — Bosque das Cinzas', () => {
  it('tem 5 salas de 11 linhas com as larguras do documento', () => {
    expect(LVL04).toHaveLength(5);
    LVL04.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length, room.id).toBe(LARGURAS[i]);
    });
    expect(LVL04_META.scope).toBe('pos');
  });

  it('piso em y=7 contínuo, exceto o vão de 3 tiles de L04-02 (DEC-007/DEC-011)', () => {
    for (const room of LVL04) {
      const piso = room.grid[7];
      const buracos = [...piso].filter((c) => c === '.').length;
      expect(room.id === 'L04-02' ? buracos : 0).toBe(room.id === 'L04-02' ? 3 : 0);
    }
  });

  it('L04-01 não tem inimigo: é a respiração depois do chefe', () => {
    expect(LVL04[0].grid.join('')).not.toContain('E');
  });

  it('os 6 inimigos estão distribuídos 0 · 1 · 3 · 1 · 1', () => {
    const porSala = LVL04.map((r) => [...r.grid.join('')].filter((c) => c === 'E').length);
    expect(porSala).toEqual([0, 1, 3, 1, 1]);
    expect(porSala.reduce((a, b) => a + b, 0)).toBe(6);
  });

  it('as raízes `=` existem e ficam acima do piso (HAB-01 em uso livre)', () => {
    const raizes = LVL04.flatMap((room) =>
      room.grid.flatMap((row, y) => [...row].map((c, x) => (c === '=' ? { x, y } : null)))
        .filter((v): v is { x: number; y: number } => v !== null));
    expect(raizes.length).toBeGreaterThanOrEqual(8);      // 4 + 4 em L04-02
    for (const r of raizes) expect(r.y).toBeLessThan(7);
  });

  it('a Ronda é a única sala com formação sincronizada', () => {
    const comRonda = LVL04.filter((r) => r.ronda);
    expect(comRonda.map((r) => r.id)).toEqual(['L04-03']);
    expect(comRonda[0].ronda?.tiles).toBe(8);             // §5.2
  });

  it('sumidouro em L04-05 (16,6) e chegada em L04-01 (2,3), ambos marcados como `V`', () => {
    expect(LVL04[4].grid[6][16]).toBe('V');
    expect(LVL04[0].grid[3][2]).toBe('V');
    // mesma letra, dois papéis: entrada interativa no fim, chegada muda no começo (§6.1)
    expect(LVL04[4].glyphs?.V).toBe('sink');
    expect(LVL04[0].glyphs?.V).toBe('sink-arrival');
    expect(LVL04[2].glyphs?.V).toBeUndefined();   // LVL-03 usa `V` como estandarte
  });

  it('as 4 inscrições do Ato II estão no caminho, não escondidas em sala vazia', () => {
    const comTexto = LVL04.filter((r) => r.texts && Object.keys(r.texts).length > 0);
    expect(comTexto.map((r) => r.id)).toEqual(['L04-01', 'L04-02', 'L04-03', 'L04-05']);
    for (const r of comTexto) {
      for (const [pos, linhas] of Object.entries(r.texts ?? {})) {
        const [x, y] = pos.split(',').map(Number);
        expect(['N', 'Q'], `${r.id} ${pos}`).toContain(r.grid[y][x]);
        expect(linhas.length).toBeGreaterThan(0);
      }
    }
  });

  it('o portão natural de 3 tiles só passa com salto duplo (L04-05)', () => {
    const parede = [4, 5, 6].map((y) => LVL04[4].grid[y][15]);
    expect(parede).toEqual(['#', '#', '#']);
  });

  it('a porta dourada fecha o setor em L04-05 e volta em L04-01', () => {
    expect(LVL04[4].grid.slice(4, 7).every((r) => r.endsWith('D'))).toBe(true);
    expect(LVL04[0].grid.slice(4, 7).every((r) => r.startsWith('D'))).toBe(true);
  });
});

describe('LVL-04 está registrado mas fora da progressão (PAT-C-10)', () => {
  it('a área existe no registro', () => {
    expect(AREAS['LVL-04']).toBeDefined();
    expect(AREAS['LVL-04']?.rooms).toHaveLength(5);
  });

  it('está na progressão, na posição 4 dos 16, e liga a LVL-05 (`DEC-047`)', () => {
    expect(AREAS['LVL-04']?.rooms.length).toBeGreaterThan(0);
    expect(AREA_ORDER.indexOf('LVL-04')).toBe(3);
    // o setor anterior **liga** a este: nenhum setor é uma ilha
    expect(nextArea('LVL-03')?.id).toBe('LVL-04');
    expect(nextArea('LVL-04')?.id).toBe('LVL-05');
  });
});
