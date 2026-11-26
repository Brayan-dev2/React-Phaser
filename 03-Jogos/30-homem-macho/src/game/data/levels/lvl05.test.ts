/** Guarda-corpo de LVL-05 (`[PÓS]`) — aquisição de habilidade, dentes e a trava de espaço. */
import { describe, expect, it } from 'vitest';
import { LVL05, LVL05_META } from './lvl05';
import { AREAS, AREA_ORDER, nextArea } from './index';

const LARGURAS = [20, 30, 30, 24, 20];
const conta = (room: (typeof LVL05)[number], ch: string): number =>
  [...room.grid.join('')].filter((c) => c === ch).length;

describe('LVL-05 — Cripta das Engrenagens', () => {
  it('tem 5 salas de 11 linhas com as larguras do documento', () => {
    expect(LVL05).toHaveLength(5);
    LVL05.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length, room.id).toBe(LARGURAS[i]);
    });
    expect(LVL05_META.grants).toBe('HAB-05');
  });

  it('os 7 inimigos estão distribuídos 1 · 2 · 1 · 2 · 1', () => {
    expect(LVL05.map((r) => conta(r, 'E'))).toEqual([1, 2, 1, 2, 1]);
  });

  it('a Força (`X`) fica em L05-04, acima da plataforma (DEC-010: antes de ser exigida)', () => {
    expect(LVL05.map((r) => conta(r, 'X'))).toEqual([0, 0, 0, 1, 0]);
    const { grid } = LVL05[3];
    expect(grid[2][17]).toBe('X');
    expect(grid[3][16]).toBe('=');      // plataforma sob o item
  });

  it('o bloco de L05-02 não trava nada e é pulável (exposição 1 de PAT-LD-03)', () => {
    const { grid } = LVL05[1];
    expect(grid[6][3]).toBe('B');
    // 1 tile de altura e nada em cima: dá para passar por cima
    expect(grid[5][3]).toBe('.');
  });

  it('o bloco de L05-05 é a trava de espaço: corredor de 2 linhas de ar até a placa', () => {
    const { grid } = LVL05[4];
    expect(grid[6][13]).toBe('B');
    expect(grid[6][17]).toBe('C');
    // teto em y=4 de x=10 a 19 → o herói (2 tiles) não salta 1 px (§6)
    for (let x = 10; x <= 19; x++) expect(grid[4][x], `x=${x}`).toBe('#');
    // corredor de ar y5–y6 de x=10 a x=18 (x=19 é a parede da sala)
    expect(grid[5].slice(10, 19)).toBe('.'.repeat(9));
    expect(grid[6].slice(10, 19)).toContain('B');
  });

  it('o elevador `U` existe só no hub', () => {
    expect(LVL05.map((r) => conta(r, 'U'))).toEqual([0, 0, 1, 0, 0]);
    expect(LVL05[2].grid[6][26]).toBe('U');
  });

  it('o hub tem o único ponto de salvamento do setor', () => {
    expect(LVL05.map((r) => conta(r, 'P'))).toEqual([0, 0, 1, 0, 0]);
    expect(LVL05[2].grid[6][2]).toBe('P');
  });

  it('engrenagem-plataforma `=` é one-way e sobe 3 tiles nas salas que cobram HAB-01', () => {
    expect(conta(LVL05[1], '=')).toBeGreaterThanOrEqual(12);
    expect(LVL05[1].grid[4][4]).toBe('=');
    expect(LVL05[1].grid[3][10]).toBe('=');
    expect(LVL05[1].grid[2][16]).toBe('=');
  });

  it('os dentes de engrenagem `A` são o perigo de L05-02, e só dele', () => {
    expect(LVL05.map((r) => conta(r, 'A'))).toEqual([0, 2, 0, 0, 0]);
  });

  it('as 2 inscrições ficam em cima das escadas, não no piso', () => {
    expect(LVL05[1].grid[1][17]).toBe('N');
    expect(LVL05[2].grid[1][17]).toBe('N');
    expect(LVL05[1].texts?.['17,1']?.[0]).toContain('MÁQUINA');
    expect(LVL05[2].texts?.['17,1']?.[0]).toContain('CORDA');
  });

  it('a entrada vem de LVL-04 e a saída é o elevador (não há `D` no fim)', () => {
    expect(LVL05[0].grid.slice(4, 7).every((r) => r.startsWith('D'))).toBe(true);
    // o setor não fecha com porta dourada: quem sobe é o elevador de L05-03
    expect(LVL05.map((r) => conta(r, 'D'))).toEqual([3, 0, 0, 0, 0]);
    expect(LVL05[2].grid[6][26]).toBe('U');
  });
});

describe('LVL-05 registrado e fora da progressão (PAT-C-10)', () => {
  it('a área existe com 5 salas', () => {
    expect(AREAS['LVL-05']?.rooms).toHaveLength(5);
  });

  it('está na progressão, na posição 5 dos 16, e liga a LVL-06 (`DEC-047`)', () => {
    expect(AREAS['LVL-05']?.rooms.length).toBeGreaterThan(0);
    expect(AREA_ORDER.indexOf('LVL-05')).toBe(4);
    // o setor anterior **liga** a este: nenhum setor é uma ilha
    expect(nextArea('LVL-04')?.id).toBe('LVL-05');
    expect(nextArea('LVL-05')?.id).toBe('LVL-06');
  });
});
