/** Guarda-corpo de LVL-07 (`[PÓS]`) — o setor sem trava, sem habilidade e sem chefe. */
import { describe, expect, it } from 'vitest';
import { LVL07, LVL07_META } from './lvl07';
import { AREAS, AREA_ORDER, nextArea } from './index';

const LARGURAS = [40, 30, 24, 20, 20];
const conta = (room: (typeof LVL07)[number], ch: string): number =>
  [...room.grid.join('')].filter((c) => c === ch).length;

describe('LVL-07 — Catedral Oca', () => {
  it('tem 5 salas de 11 linhas e 134 tiles no total (§1 campo 7)', () => {
    expect(LVL07).toHaveLength(5);
    LVL07.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length, room.id).toBe(LARGURAS[i]);
    });
    expect(LVL07.reduce((n, r) => n + r.grid[0].length, 0)).toBe(134);
  });

  it('o setor não entrega habilidade, não tem chefe e não tem água (§1, §7)', () => {
    expect(LVL07_META.grants).toBeNull();
    expect(LVL07_META.bgm).toBe('none');            // §6: o setor tem `AMB-07`, não trilha
    expect(LVL07.map((r) => conta(r, 'B'))).toEqual([0, 0, 0, 0, 0]);
    expect(LVL07.every((r) => r.water === undefined)).toBe(true);
  });

  it('a densidade é a menor do jogo: 5 Sentinelas, uma por sala (PAT-LD-10)', () => {
    expect(LVL07.map((r) => conta(r, 'E'))).toEqual([1, 1, 1, 1, 1]);
  });

  it('a Nave de 40 tiles não tem uma única plataforma (§5, técnica 6)', () => {
    expect(conta(LVL07[0], '=')).toBe(0);
    expect(conta(LVL07[0], 'A')).toBe(0);
  });

  it('o vitral de L07-01 é o mesmo de L07-05: x=38 na entrada, x=14–15 na rosácea', () => {
    expect(LVL07[0].grid[1][38]).toBe('v');        // visto da porta, 2.368 px à frente
    expect(LVL07[4].grid[1].slice(14, 16)).toBe('vv');
    expect(LVL07[4].glyphs?.v).toBe('stained');
  });

  it('os arcos `R` nascem em y1 e são cortados pelo teto (overflow_top)', () => {
    // 8 arcos a cada 4 tiles em L07-01 (§5, técnica 1)
    const colunas = [...LVL07[0].grid[1]].map((c, i) => (c === 'R' ? i : -1)).filter((i) => i >= 0);
    expect(colunas).toEqual([4, 8, 12, 16, 20, 24, 28, 32]);
    expect(LVL07[0].grid[0][4]).toBe('#');         // o arco termina no teto, não no ar
    expect(LVL07[0].glyphs?.R).toBe('arc');
  });

  it('o vão entre as arquitraves de L07-02 é de 8 tiles, grande demais de propósito', () => {
    const { grid } = LVL07[1];
    const esquerda = grid[4].slice(4, 11);         // x = 4–10
    const direita = grid[4].slice(19, 26);         // x = 19–25
    expect(esquerda).toBe('=======');
    expect(direita).toBe('=======');
    expect(19 - 10 - 1).toBe(8);
  });

  it('o Coro é a única escalada: três níveis, cada um 1 tile acima do anterior', () => {
    const { grid } = LVL07[2];
    expect(grid[4][3]).toBe('=');                  // A, topo y=4
    expect(grid[3][10]).toBe('=');                 // B, topo y=3
    expect(grid[2][16]).toBe('=');                 // C, topo y=2
    expect(grid[1][17]).toBe('N');                 // o marco fica no alto
  });

  it('o trifório é de mão única e só existe no fim: boca em L07-05, chegada em L07-01', () => {
    expect(LVL07[4].sink).toEqual({
      area: 'LVL-07', room: 0, at: { tx: 3, ty: 4 }, mode: 'touch',
      text: ['A GALERIA SÓ VAI PARA TRÁS.'],
    });
    expect(LVL07[4].glyphs?.T).toBe('sink');
    expect(LVL07[0].glyphs?.T).toBe('sink-arrival');   // não é gatilho (`arrival_only`)
    expect(LVL07.slice(1, 4).every((r) => conta(r, 'T') === 0)).toBe(true);
  });

  it('a rota reta no piso atravessa as cinco salas: nenhuma trava (§7/§8)', () => {
    for (const room of LVL07) {
      // y=6 é a linha de caminhada e não tem nada sólido além das pontas
      expect(room.grid[6].slice(1, -1), room.id).not.toContain('#');
      expect(room.grid[6].slice(1, -1)).not.toContain('Y');   // nenhuma porta de senha
    }
    // as únicas lascas do setor estão em L07-02 e são cíclicas, não obrigatórias
    expect(LVL07.map((r) => conta(r, 'A'))).toEqual([0, 2, 0, 0, 0]);
  });

  it('o setor tem um único ponto de salvamento, no Coro (§2)', () => {
    expect(LVL07.map((r) => conta(r, 'P'))).toEqual([0, 0, 1, 0, 0]);
  });

  it('está na progressão, na posição 7 dos 16, e liga a LVL-08 (`DEC-047`)', () => {
    expect(AREAS['LVL-07']?.rooms.length).toBeGreaterThan(0);
    expect(AREA_ORDER.indexOf('LVL-07')).toBe(6);
    // o setor anterior **liga** a este: nenhum setor é uma ilha
    expect(nextArea('LVL-06')?.id).toBe('LVL-07');
    expect(nextArea('LVL-07')?.id).toBe('LVL-08');
  });
});
