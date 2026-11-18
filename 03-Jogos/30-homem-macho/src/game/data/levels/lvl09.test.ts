/** Guarda-corpo de LVL-09 (`[PÓS]`) — o setor sem plataformas e a trava por vão. */
import { describe, expect, it } from 'vitest';
import { LVL09, LVL09_META } from './lvl09';
import { AREAS, AREA_ORDER, nextArea } from './index';
import { HOOK, ITEMS, TILE } from '../tuning';
import {
  DOUBLE_JUMP_REACH_PX, crossesFromHang, isInReach, pickRing,
} from '../../../core/hook';

const LARGURAS = [20, 30, 20, 20, 30, 20];
const conta = (room: (typeof LVL09)[number], ch: string): number =>
  [...room.grid.join('')].filter((c) => c === ch).length;

describe('LVL-09 — Canais Sombrios', () => {
  it('tem 6 salas de 11 linhas e 140 tiles no total (§1 campo 7)', () => {
    expect(LVL09).toHaveLength(6);
    LVL09.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length, room.id).toBe(LARGURAS[i]);
    });
    expect(LVL09.reduce((n, r) => n + r.grid[0].length, 0)).toBe(140);
  });

  it('HAB-04 já não está num pedestal: cai de chefe (`DEC-042`)', () => {
    expect(LVL09_META.grants).toBe('HAB-04');
    // o pedestal de L09-04 ficou vazio: o gancho é drop raro (8 %, garantia ao 12.º chefe)
    expect(LVL09.map((r) => conta(r, 'X'))).toEqual([0, 0, 0, 0, 0, 0]);
    expect(LVL09[3].glyphs?.X).toBeUndefined();
  });

  it('não tem uma única plataforma nem uma única armadilha (§5)', () => {
    expect(LVL09.map((r) => conta(r, '='))).toEqual([0, 0, 0, 0, 0, 0]);
    expect(LVL09.map((r) => conta(r, 'A'))).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('o teto desce até 3 tiles úteis na galeria cega (§5, técnica 1)', () => {
    // L09-03: y0–y2 sólidos → 3 tiles de ar, o mínimo que DEC-007 permite
    expect(LVL09[2].grid[0]).toBe('#'.repeat(20));
    expect(LVL09[2].grid[1]).toBe('#'.repeat(20));
    expect(LVL09[2].grid[2]).toBe('#'.repeat(20));
    expect(LVL09[2].grid[3][1]).toBe('.');
  });

  it('a galeria está inundada em 16 dos 18 tiles de largura útil (§4.3)', () => {
    expect(LVL09[2].water).toEqual({ from: 1, to: 16, topRow: 4, bottomRow: 6 });
    expect(LVL09[2].grid[6].slice(1, 17)).toBe('~'.repeat(16));
    // o rato e o marco ficam no canto seco: água não esconde nada (§10)
    expect(LVL09[2].grid[6].slice(17, 19)).toBe('wN');
  });

  it('o poço de L09-02 e o canal de L09-05 têm 8 tiles de vão seco (§4.2, §4.5)', () => {
    for (const [sala, y] of [[1, 7], [4, 7]] as const) {
      const linha = LVL09[sala].grid[y];
      const aberto = [...linha].map((c, i) => (c === '.' ? i : -1)).filter((i) => i >= 0);
      const run = aberto.filter((i) => i >= aberto[0]);
      expect(run.length).toBeGreaterThanOrEqual(8);
    }
    // 8 tiles = 512 px, e o duplo alcança 378: 134 px de margem (mínimo do PAT-LD-09)
    expect(8 * TILE - DOUBLE_JUMP_REACH_PX).toBe(134);
  });

  it('as 5 argolas estão dentro do alcance de 6 tiles de onde se parte (§6.3)', () => {
    expect(LVL09.map((r) => conta(r, 'o'))).toEqual([0, 1, 0, 0, 2, 2]);
    // L09-05: da borda oeste do canal (x=9) até a argola do meio (x=14) são 5 tiles
    const argola = { x: 14 * TILE + TILE / 2, y: 3 * TILE + TILE / 2 };
    // a borda do canal é x=10: o herói parte de x≈9,7 tiles com o corpo em y=6
    const corpo = { x: 10 * TILE - 20, y: 6 * TILE };
    expect(isInReach(argola, corpo.x, corpo.y, HOOK.reachTiles * TILE)).toBe(true);
    expect(pickRing([argola], corpo.x, corpo.y, 1, HOOK.reachTiles * TILE)).toEqual(argola);
  });

  it('a argola de prática de L09-05 fica sobre piso firme: errar não custa nada (§6.4)', () => {
    const { grid } = LVL09[4];
    expect(grid[2][5]).toBe('o');
    expect(grid[7].slice(0, 10)).toBe('#'.repeat(10));   // piso contínuo sob a prática
  });

  it('o vão exige o gancho, e o gancho cobre o canal na segunda metade (§6.3)', () => {
    // do pendurado (x=14) até o piso do outro lado (x=18): 4 tiles
    expect(crossesFromHang(4 * TILE, 334)).toBe(true);
    // 10 tiles (640 px) ficam fora até do salto do gancho — é o teto da mecânica
    expect(crossesFromHang(10 * TILE, 334)).toBe(false);
  });

  it('as 4 Sentinelas ficam fora da água e nunca na galeria cega (§1 campo 10)', () => {
    expect(LVL09.map((r) => conta(r, 'E'))).toEqual([0, 1, 0, 2, 1, 0]);
  });

  it('os dois pontos de salvamento ficam em transição, não no meio do desafio (§2)', () => {
    expect(LVL09[1].grid[6][4]).toBe('P');
    expect(LVL09[5].grid[6][2]).toBe('P');
  });

  it('o sumidouro de L09-06 devolve ao início por `interact` e não salva (§8.1)', () => {
    expect(LVL09[5].sink).toMatchObject({ area: 'LVL-09', room: 0, mode: 'interact' });
    expect(LVL09[0].glyphs?.V).toBe('sink-arrival');   // chegada, não gatilho
  });

  it('os 5 marcos de lore estão na grade, um por sala com texto (§1 campo 5)', () => {
    expect(LVL09.filter((r) => r.texts).length).toBe(5);
    expect(conta(LVL09[0], 'N')).toBe(1);
    expect(conta(LVL09[2], 'N')).toBe(1);
  });

  it('a água é declarada por ficha em quatro salas (§3, regra da água)', () => {
    expect(LVL09[0].water).toEqual({ from: 11, to: 13, topRow: 6, bottomRow: 6 });
    expect(LVL09[1].water).toEqual({ from: 10, to: 11, topRow: 6, bottomRow: 6 });
    expect(LVL09[3].water).toBeUndefined();            // a casa de bombas é o único lugar seco
    expect(LVL09[5].water).toEqual({ from: 4, to: 14, topRow: 4, bottomRow: 6 });
  });

  it('`HAB-04` é permanente e sobrevive à morte (§6.2, TST-005)', () => {
    expect(ITEMS['ITM-008']).toMatchObject({ permanent: true, kind: 'hook' });
  });

  it('está na progressão, na posição 9 dos 16, e liga a LVL-10 (`DEC-047`)', () => {
    expect(AREAS['LVL-09']?.rooms.length).toBeGreaterThan(0);
    expect(AREA_ORDER.indexOf('LVL-09')).toBe(8);
    // o setor anterior **liga** a este: nenhum setor é uma ilha
    expect(nextArea('LVL-08')?.id).toBe('LVL-09');
    expect(nextArea('LVL-09')?.id).toBe('LVL-10');
  });
});
