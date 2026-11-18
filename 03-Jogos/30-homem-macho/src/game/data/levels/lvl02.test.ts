/**
 * Guarda-corpo da grade de LVL-02 — os mesmos invariantes do validador da documentação,
 * mais as asserções que o documento de setor promete (gate, vãos, beco, porta de senha).
 */
import { describe, expect, it } from 'vitest';
import { LVL02 } from './lvl02';

const WIDTHS = [20, 30, 30, 20, 30, 30, 20, 20];
const rows = (i: number): readonly string[] => LVL02[i].grid;
const glyphs = LVL02.flatMap((r) => r.grid).join('');

describe('LVL-02 (docs/niveis/LVL-02.md §5)', () => {
  it('tem 8 salas de 11 linhas com as larguras do documento', () => {
    expect(LVL02).toHaveLength(8);
    LVL02.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length).toBe(WIDTHS[i]);
    });
  });

  it('o gate de L02-02 é uma plataforma de 4 tiles em y=4, abaixo da fenda do teto', () => {
    const y4 = rows(1)[4];
    expect(y4.slice(22, 26)).toBe('====');
    expect(rows(1)[0].slice(24, 26)).toBe('++'); // fenda em y=0, x=24–25
    // 3 tiles de subida do piso (y=7) até a plataforma (y=4)
    expect(7 - 4).toBe(3);
  });

  it('a fenda de L02-02 sobe para L02-06, e não para a sala seguinte (DEC-043)', () => {
    // a regra geral de `DEC-015` mandava o jogador para L02-03 — a sala que ele acabou de
    // atravessar por baixo. A ficha da sala é que decide o destino, e é isso que aqui se prende.
    const hatches = LVL02[1].hatches ?? [];
    expect(hatches).toHaveLength(1);
    expect(hatches[0]).toMatchObject({ from: 24, to: 25, state: 'open', destRoom: 5 });
    expect(LVL02[5].id).toBe('L02-06');
    // e a rota baixa continua a existir: a porta de leste de L02-02 é L02-03
    expect(LVL02[2].id).toBe('L02-03');
  });

  it('L02-06 tem 3 vãos de 4 tiles no piso e furo de entrada em x=2–3', () => {
    const y7 = rows(5)[7];
    const buracos = [...y7.matchAll(/\.{4,}/g)].map((m) => [m.index, m[0].length]);
    expect(buracos).toEqual([[8, 4], [16, 4], [24, 4]]);
    expect(rows(5)[7].slice(2, 4)).toBe('..');
  });

  it('L02-05 é beco sem saída a leste (o fragmento está no fim)', () => {
    for (const y of [4, 5, 6]) expect(rows(4)[y].endsWith('#')).toBe(true);
    expect(rows(4)[6][27]).toBe('F');
  });

  it('existe 1 fragmento ITM-003, 1 porta de senha e 2 Sentinelas', () => {
    expect(glyphs.split('F').length - 1).toBe(1);
    expect(glyphs.split('Y').length - 1).toBe(3); // a porta ocupa y=4,5,6 em L02-07
    expect(glyphs.split('E').length - 1).toBe(2);
  });

  it('pistas de senha: uma inscrição em L02-04 e outra em L02-06', () => {
    expect(rows(3)[6][5]).toBe('N');
    expect(rows(5)[6][14]).toBe('N');
  });

  it('toda sala tem saída leste, exceto o beco e a porta de senha', () => {
    LVL02.forEach((room, i) => {
      const east = room.grid.slice(4, 7).some((row) => row.endsWith('+') || row.endsWith('D') || row.endsWith('Y'));
      if (i === 4) expect(east).toBe(false);
      else expect(east, `sala ${room.id}`).toBe(true);
    });
  });

  it('todas têm abertura oeste, menos L02-06: ela só é alcançada pela fenda do teto', () => {
    LVL02.forEach((room, i) => {
      const west = room.grid.slice(4, 7).every((row) => row.startsWith('+'));
      if (i === 5) expect(west, 'L02-06 entra por cima').toBe(false);
      else expect(west, `sala ${room.id}`).toBe(true);
    });
  });
});
