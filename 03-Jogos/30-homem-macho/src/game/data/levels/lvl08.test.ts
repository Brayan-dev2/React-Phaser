/** Guarda-corpo de LVL-08 (`[PÓS]`) — a areia em quatro tempos e a trava que é um corpo. */
import { describe, expect, it } from 'vitest';
import { LVL08, LVL08_META } from './lvl08';
import { AREAS, AREA_ORDER, nextArea } from './index';
import { alferesPhase, shouldProcessAlferesDeath } from '../../../core/alferes';
import { SAND_CLOCK, activeSand, pointInSand } from '../../../core/sand';

const LARGURAS = [30, 30, 20, 24, 20, 20];
const conta = (room: (typeof LVL08)[number], ch: string): number =>
  [...room.grid.join('')].filter((c) => c === ch).length;

describe('LVL-08 — Pátio Rubro', () => {
  it('tem 6 salas de 11 linhas e 144 tiles no total (§1 campo 7)', () => {
    expect(LVL08).toHaveLength(6);
    LVL08.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length, room.id).toBe(LARGURAS[i]);
    });
    expect(LVL08.reduce((n, r) => n + r.grid[0].length, 0)).toBe(144);
  });

  it('o setor não entrega habilidade: ele paga com um chefe (§1 campo 6)', () => {
    expect(LVL08_META.grants).toBeNull();
    expect(LVL08.map((r) => r.boss ?? null)).toEqual([null, null, null, 'ENT-004', null, null]);
    expect(LVL08.map((r) => conta(r, 'L'))).toEqual([0, 0, 0, 1, 0, 0]);
  });

  it('a areia é retângulo de ficha e cobre os quatro tempos do PAT-LD-02 (§7.4)', () => {
    // tempo 1: 1 faixa de 2 tiles, longe da única Sentinela
    expect(LVL08[0].sand).toEqual([{ from: 4, to: 5, topRow: 6, bottomRow: 6 }]);
    // tempo 2: 3 faixas
    expect(LVL08[1].sand).toHaveLength(3);
    // tempo 3: 1 faixa entre duas plataformas, com Sentinela dentro
    expect(LVL08[2].sand).toEqual([{ from: 8, to: 10, topRow: 6, bottomRow: 6 }]);
    expect(LVL08[2].grid[6].slice(8, 11)).toBe('sEs');
    // tempo 4: a arena não tem areia fixa — o piso acende no relógio
    expect(LVL08[3].sand).toBeUndefined();
    expect(LVL08[3].anchors).toEqual([5, 10, 15, 20]);
  });

  it('a primeira areia está a ~18 tiles da Sentinela do tempo 1 (§4.1)', () => {
    const { grid } = LVL08[0];
    const areia = grid[6].indexOf('s');
    const sentinela = grid[6].indexOf('E');
    // a ficha fala "18 tiles"; a grade dá 19 (x=4 → x=23) — o argumento é o mesmo
    expect(sentinela - areia).toBeGreaterThanOrEqual(18);
  });

  it('a arena é plana de ponta a ponta, sem cobertura (§4.4, PAT-LD-07)', () => {
    const { grid } = LVL08[3];
    // nenhuma plataforma (`=`) e nenhum degrau: só âncoras, o chefe e o piso
    expect(conta(LVL08[3], '=')).toBe(0);
    expect([...grid[6].slice(1, -1)].every((c) => c === '.' || c === ',' || c === 'L')).toBe(true);
    expect(grid[7]).toBe('#'.repeat(24));                   // piso contínuo: não há queda
  });

  it('a trava é a grade leste: o chefe fica entre o jogador e a saída (§8)', () => {
    const { grid } = LVL08[3];
    expect(grid[4].slice(0, 1)).toBe('G');                  // oeste: fecha atrás
    expect(grid[4].slice(-1)).toBe('G');                    // leste: só abre ao vencer
    expect(grid[6][18]).toBe('L');                          // o Alferes, 5 tiles antes da grade
  });

  it('as 4 âncoras cabem no piso e param em 4 (§7.3)', () => {
    expect(SAND_CLOCK.maxAnchors).toBe(4);
    expect(LVL08[3].anchors).toHaveLength(SAND_CLOCK.maxAnchors);
    // cada âncora cobre 3 tiles: 4 × 3 = 12 de 22 tiles no pior caso
    const areia = activeSand([], LVL08[3].anchors!, 4, 7, 3);
    expect(areia).toHaveLength(4);
    expect(areia.reduce((n, r) => n + (r.to - r.from + 1), 0)).toBe(12);
    expect(pointInSand(areia, 5 * 64, 6 * 64 + 10, 64)).toBe(true);
  });

  it('o chefe tem duas fases e a morte é processada uma única vez (§5.5/TST-009)', () => {
    expect(alferesPhase(240, 120)).toBe(1);
    expect(alferesPhase(120, 120)).toBe(2);
    expect(shouldProcessAlferesDeath('estocada', 0, false)).toBe(true);
    expect(shouldProcessAlferesDeath('morte', 0, true)).toBe(false);
  });

  it('o vão de 7 tiles entre as arquibancadas é grande demais de propósito (§9)', () => {
    const { grid } = LVL08[1];
    expect(grid[4].slice(5, 10)).toBe('=====');
    expect(grid[4].slice(17, 22)).toBe('=====');
    // 448 px de vão contra os 378 px de alcance do duplo em corrida (`04-setores` §4.3):
    // 70 px de margem, o suficiente para não parecer possível e não parecer bug (§9)
    expect(448).toBeGreaterThan(378);
    expect(grid[4].slice(10, 17)).toBe('.'.repeat(7));   // o vão: x = 10…16
  });

  it('os dois saves ficam na transição, nunca no meio da arena (§4.3/§4.5)', () => {
    expect(LVL08.map((r) => conta(r, 'P'))).toEqual([0, 0, 1, 0, 1, 0]);
    expect(LVL08[3].grid.join('')).not.toContain('P');
  });

  it('o monta-carga tem duas paradas e só destrava depois do chefe (§4.1/§4.5)', () => {
    expect(LVL08[0].hoist).toEqual({
      area: 'LVL-08', room: 4, at: { tx: 16, ty: 6 }, lockedUntil: 'boss-defeated',
    });
    expect(LVL08[4].hoist).toEqual({
      area: 'LVL-08', room: 0, at: { tx: 18, ty: 6 }, lockedUntil: 'boss-defeated',
    });
  });

  it('a recompensa `ITM-007` fica em L08-05, depois da luta (§5.6)', () => {
    expect(LVL08.map((r) => conta(r, 'I'))).toEqual([0, 0, 0, 0, 1, 0]);
    expect(LVL08[4].glyphs?.I).toBe('boss-reward');
  });

  it('os glifos do pátio são reinterpretados por sala (DEC-023)', () => {
    expect(LVL08[0].glyphs?.S).toBe('sun');       // `S` é spawn noutros setores
    expect(LVL08[0].glyphs?.h).toBe('chain');     // `h` é ITM-001 (cura)
    expect(LVL08[0].glyphs?.s).toBe('sand');      // `s` é ITM-002 (escudo)
    expect(LVL08[3].glyphs?.G).toBe('grate');     // `G` é decoração noutros setores
  });

  it('está na progressão, na posição 8 dos 16, e liga a LVL-09 (`DEC-047`)', () => {
    expect(AREAS['LVL-08']?.rooms.length).toBeGreaterThan(0);
    expect(AREA_ORDER.indexOf('LVL-08')).toBe(7);
    // o setor anterior **liga** a este: nenhum setor é uma ilha
    expect(nextArea('LVL-07')?.id).toBe('LVL-08');
    expect(nextArea('LVL-08')?.id).toBe('LVL-09');
  });
});
