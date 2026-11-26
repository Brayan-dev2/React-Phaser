/**
 * Guarda-corpo de LVL-12 (`[PÓS]`) — a forja que não trava a porta, o chefe opcional e o
 * metrônomo da fábrica. É o setor onde o jogo **para de dar** e começa a pedir.
 */
import { describe, expect, it } from 'vitest';
import { LVL12, LVL12_CONVEYOR, LVL12_HAMMERS, LVL12_META } from './lvl12';
import { AREAS, AREA_ORDER, nextArea } from './index';
import { FORJADOR, HAMMER, MOVE, TILE } from '../tuning';
import {
  chooseForgeAttack, forgeEngages, inForgeArc, pieceHitsPlayer,
  type ForgeTiming, type HammerTiming,
} from '../../../core/forge';

const LARGURAS = [20, 30, 30, 20, 24, 20];
const conta = (room: (typeof LVL12)[number], ch: string): number =>
  [...room.grid.join('')].filter((c) => c === ch).length;

const TIMING: ForgeTiming = {
  arcWindupMs: FORJADOR.arcWindupMs, arcMs: FORJADOR.arcMs,
  arcRecoverMs: FORJADOR.arcRecoverMs, arcRecoverPhase2Ms: FORJADOR.arcRecoverPhase2Ms,
  pieceWindupMs: FORJADOR.pieceWindupMs, pieceMs: FORJADOR.pieceMs,
  pieceRecoverMs: FORJADOR.pieceRecoverMs, waveWindupMs: FORJADOR.waveWindupMs,
  waveMs: FORJADOR.waveMs, waveRecoverMs: FORJADOR.waveRecoverMs,
  transitionMs: FORJADOR.transitionMs, deathHoldMs: FORJADOR.deathHoldMs,
};
const HT: HammerTiming = {
  periodMs: HAMMER.periodMs, periodPhase2Ms: HAMMER.periodPhase2Ms,
  offsetMs: HAMMER.offsetMs, telegraphMs: HAMMER.telegraphMs, activeMs: HAMMER.activeMs,
};

describe('LVL-12 — Forja Distorcida', () => {
  it('tem 6 salas de 11 linhas e 144 tiles (§1 campo 7)', () => {
    expect(LVL12).toHaveLength(6);
    LVL12.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length, room.id).toBe(LARGURAS[i]);
    });
    expect(LVL12.reduce((n, r) => n + r.grid[0].length, 0)).toBe(144);
    expect(LARGURAS.reduce((a, b) => a + b, 0)).toBe(144);
  });

  it('está na progressão, na posição 12 dos 16, e liga a LVL-13 (`DEC-047`)', () => {
    expect(AREAS['LVL-12']?.rooms.length).toBeGreaterThan(0);
    expect(AREA_ORDER.indexOf('LVL-12')).toBe(11);
    // o setor anterior **liga** a este: nenhum setor é uma ilha
    expect(nextArea('LVL-11')?.id).toBe('LVL-12');
    expect(nextArea('LVL-12')?.id).toBe('LVL-13');
  });

  it('NÃO entrega habilidade: o kit fechou em LVL-11 (§1 campo 6)', () => {
    expect(LVL12_META.grants).toBeNull();
    // nenhum item de habilidade em sala nenhuma
    for (const room of LVL12) {
      expect(room.glyphs?.X).toBeUndefined();
      // `j` é bigorna nas três salas que o têm (`glyphs.j = 'anvil'`), nunca fragmento
      if (room.glyphs?.j) expect(room.glyphs.j).toBe('anvil');
    }
    expect(LVL12.filter((r) => r.glyphs?.j === 'anvil').map((r) => r.id))
      .toEqual(['L12-04', 'L12-05']);
    expect(LVL12.map((r) => conta(r, 'X'))).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('é sólido: zero vão, zero plataforma, zero alçapão, zero armadilha (DEC-011 §1)', () => {
    for (const ch of ['=', 'A', '^', 'v', '_']) {
      expect(LVL12.map((r) => conta(r, ch)), `glifo ${ch}`).toEqual([0, 0, 0, 0, 0, 0]);
    }
    // a linha 7 é piso maciço em todas as salas: nenhum vão, em nenhuma coluna
    for (const room of LVL12) {
      expect(room.grid[7], room.id).toBe('#'.repeat(room.grid[0].length));
    }
  });

  it('a arena não tem save nem grade: o chefe não tranca a porta (§8)', () => {
    const arena = LVL12[4];
    expect(arena.id).toBe('L12-05');
    expect(arena.boss).toBe('ENT-005');
    expect(conta(arena, 'P')).toBe(0);            // sala de desafio não salva
    expect(LVL12_META.bossGate).toBe('none');
    expect(FORJADOR.gate).toBe('none');
    expect(FORJADOR.optional).toBe(true);
    // `G` é grade da arena em LVL-03/LVL-08 — aqui não existe nenhuma
    expect(conta(arena, 'G')).toBe(0);
    expect(arena.glyphs?.G).toBeUndefined();
  });

  it('a saída da arena existe SEM matar o chefe: 21 tiles = 1.344 px em 4,36 s (§4.5)', () => {
    const arena = LVL12[4];
    // (1,6) → (22,6) é o percurso do aceite
    const px = 21 * TILE;
    expect(px).toBe(1344);
    const correndo = MOVE.moveSpeed * MOVE.runMultiplier;   // 220 × 1,4 = 308
    expect(correndo).toBe(308);
    expect(px / correndo).toBeCloseTo(4.36, 2);
    // e o caminho é um corredor limpo: nenhum obstáculo entre as duas portas
    expect(arena.grid[6].slice(1, 23)).not.toMatch(/[#=]/);
    // as portas das duas pontas estão abertas
    expect(arena.grid[4][0]).toBe('+');
    expect(arena.grid[4][23]).toBe('+');
  });

  it('o chefe é médio: 260 HP, fase em 130 e fase 2 na metade da vida (§5.1/§5.5)', () => {
    expect(FORJADOR.hp).toBe(260);
    expect(FORJADOR.phase2At).toBe(130);
    expect(FORJADOR.phase2At * 2).toBe(FORJADOR.hp);
    expect(FORJADOR.body.width).toBeLessThan(FORJADOR.sprite.width);   // anti-hitbox
    expect(FORJADOR.knockbackResistant).toBe(true);
  });

  it('o engajamento exige o jogador no piso: quem voa atravessa sem luta (§5.1)', () => {
    const alcance = FORJADOR.engageTiles * TILE;
    expect(alcance).toBe(320);
    expect(forgeEngages(true, alcance, alcance)).toBe(true);
    expect(forgeEngages(false, 0, alcance)).toBe(false);
  });

  it('`ATK-11` não é esquivável por salto — a resposta é lateral (§5.3)', () => {
    const piso = 7 * TILE;
    const altura = 110;
    const peito = piso - 60;
    // no chão, na mesma coluna: leva
    expect(pieceHitsPlayer(1000, peito, 1000, piso, altura)).toBe(true);
    // saltinho de 40 px no mesmo lugar: a peça continua na altura do peito e leva
    expect(pieceHitsPlayer(1000, peito, 1000, piso - 40, altura)).toBe(true);
    // e o salto só resolve se ele passar por cima da peça — a resposta confiável é lateral
    expect(pieceHitsPlayer(1000, peito, 1000, piso - 220, altura)).toBe(false);
    // saiu de lado: não leva
    expect(pieceHitsPlayer(1000, peito, 1000 + TILE, piso, altura)).toBe(false);
    expect(FORJADOR.piece.damage).toBe(18);
    expect(FORJADOR.piece.bounces).toBe(1);
  });

  it('`ATK-10` cobre 5 tiles e `ATK-12` só existe na fase 2 (§5.3)', () => {
    expect(inForgeArc(1000, -1, FORJADOR.arc.px, 1000 - 5 * TILE)).toBe(true);
    expect(inForgeArc(1000, -1, FORJADOR.arc.px, 1000 - 5 * TILE - 1)).toBe(false);
    const fase1 = [0, 1, 2, 3, 4].map((i) => chooseForgeAttack(1, i));
    expect(fase1).not.toContain('ATK-12');
    const fase2 = [0, 1, 2].map((i) => chooseForgeAttack(2, i));
    expect(fase2).toContain('ATK-12');
    // os números de `tuning.ts` são os do documento
    expect(TIMING.arcWindupMs).toBe(800);
    expect(TIMING.arcRecoverPhase2Ms).toBeLessThan(TIMING.arcRecoverMs);
  });

  it('os dois pilões estão em (7,6) e (17,6), defasados em meio período (§7)', () => {
    expect(LVL12_HAMMERS).toHaveLength(2);
    expect(LVL12_HAMMERS.map((h) => h.tx)).toEqual([7, 17]);
    expect(LVL12_HAMMERS.map((h) => h.room)).toEqual(['L12-05', 'L12-05']);
    const placa = LVL12[4].hammers ?? [];
    expect(placa.map((h) => [h.tx, h.ty])).toEqual([[7, 6], [17, 6]]);
    expect(conta(LVL12[4], '!')).toBe(2);          // o glifo é a legibilidade da ficha
    expect(LVL12_HAMMERS[1].offsetMs).toBe(HAMMER.offsetMs);
    expect(HAMMER.offsetMs * 2).toBe(HAMMER.periodMs);
    expect(HAMMER.damage).toBe(25);
    expect(HT.periodPhase2Ms / HT.periodMs).toBe(0.75);
    // e os pilões só existem na arena: nenhum outro `!` no setor
    expect(LVL12.map((r) => conta(r, '!'))).toEqual([0, 0, 0, 0, 2, 0]);
  });

  it('a esteira é `decor` (não move o jogador) e cobre x=9–21 na linha 5 (§4.3)', () => {
    const sala = LVL12[2];
    expect(sala.id).toBe(LVL12_CONVEYOR.room);
    expect(sala.glyphs?.e).toBe('conveyor');
    expect(LVL12_CONVEYOR).toMatchObject({ row: 5, from: 9, to: 21 });
    expect(sala.grid[5].slice(9, 22)).toBe('e'.repeat(13));
    // é uma peça por grupo, e o grupo tem 13 tiles de largura
    expect(conta(sala, 'e')).toBe(13);
    // nenhuma sala declara esteira como sólido: `e` não está em `grid` de piso
    expect(sala.grid[7].includes('e')).toBe(false);
  });

  it('`ITM-011` só existe se `ENT-005` cair, e a sala da recompensa é L12-06 (§5.6)', () => {
    const poco = LVL12[5];
    expect(poco.id).toBe('L12-06');
    expect(poco.bossReward).toEqual({ itm: 'ITM-011', tx: 7, ty: 6 });
    expect(poco.glyphs?.I).toBe('forge-item');
    // o chefe vivo está a **duas salas** dela: não há como pegar sem atravessar a arena
    expect(LVL12.findIndex((r) => r.boss === 'ENT-005')).toBe(4);
    expect(LVL12.findIndex((r) => r.bossReward !== undefined)).toBe(5);
    // é recompensa, não habilidade: `ITM-011` não dá kit (o kit fechou em LVL-11)
    expect(LVL12_META.grants).toBeNull();
  });

  it('a calha volta a L12-01 e é de mão única, sem save (PAT-LD-08, §4.6)', () => {
    const poco = LVL12[5];
    expect(poco.sink).toMatchObject({ area: 'LVL-12', room: 0, mode: 'interact' });
    expect(poco.sink?.at).toEqual({ tx: 1, ty: 6 });
    // `Sink` não tem campo de save: atalho é atalho, e não muda o checkpoint (`PAT-LD-08`)
    expect(Object.keys(poco.sink ?? {})).not.toContain('save');
    // a chegada em L12-01 é a boca da calha: `V` ali é arrival, não sink
    expect(LVL12[0].sink).toBeUndefined();
    expect(conta(LVL12[0], 'V')).toBe(1);
    expect(conta(LVL12[5], 'V')).toBe(1);
  });

  it('5 Sentinelas no setor, nenhuma nas duas salas de respiro (§4)', () => {
    expect(LVL12.map((r) => conta(r, 'E'))).toEqual([1, 2, 2, 0, 0, 0]);
    expect(LVL12.reduce((n, r) => n + conta(r, 'E'), 0)).toBe(5);
    // L12-04 e L12-06 são `PAT-LD-04`: respiro antes e depois do desafio
    expect(conta(LVL12[3], 'N')).toBe(1);
    expect(conta(LVL12[5], 'P')).toBe(1);
  });

  it('os dois saves do setor estão em L12-04 e L12-06 (§4.4/§4.6)', () => {
    expect(LVL12.map((r) => conta(r, 'P'))).toEqual([0, 0, 0, 1, 0, 1]);
  });

  it('os marcos do setor têm o texto publicado, e nenhum fala do jogador (§4)', () => {
    const marcos = LVL12.flatMap((r) => Object.values(r.texts ?? {}));
    expect(marcos).toHaveLength(6);
    for (const linhas of marcos) {
      expect(linhas).toHaveLength(2);
      for (const l of linhas) expect(l).toBe(l.toUpperCase());
    }
    expect(marcos[1]).toEqual([
      'TURNO DA NOITE: 400 PEÇAS.', 'TURNO DO DIA: 0. NINGUÉM CONFERIU.',
    ]);
    expect(marcos[3][0]).toBe('ZONA DA BIGORNA.');
  });

  it('a peça é do maior dano único do jogo e o pilão é o teto (§7.1)', () => {
    expect(FORJADOR.piece.damage).toBe(18);
    expect(FORJADOR.arc.damage).toBe(22);
    expect(FORJADOR.wave.damage).toBe(20);
    expect(HAMMER.damage).toBeGreaterThan(FORJADOR.arc.damage);
  });
});
