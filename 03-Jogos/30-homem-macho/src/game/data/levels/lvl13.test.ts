/**
 * Guarda-corpo de LVL-13 (`[PÓS]`) — o abismo que fecha o Ato III.
 *
 * Duas invariantes deste setor valem para o jogo inteiro, e é por isso que ele tem teste:
 * **quem sobe é a corrente, não o pano** (§6.2) e **a queda longa não mata** (§8).
 */
import { describe, expect, it } from 'vitest';
import { LVL13, LVL13_ECHOES, LVL13_META, LVL13_UPDRAFTS } from './lvl13';
import { AREAS, AREA_ORDER, nextArea } from './index';
import { ECHO, FLAGS, GLIDE, LONG_FALL, TILE, UPDRAFT } from '../tuning';
import {
  LONG_FALL_DAMAGE, hatchShortfall, inUpdraft, longFallMs, riseMargin, riseTimeMs,
  updraftVerdict, updraftVelocity, type UpdraftRect, type UpdraftTiming,
} from '../../../core/updraft';
import { GLIDE as GLIDE_RL } from '../../../core/glide';

const LARGURAS = [20, 30, 30, 30, 20, 20];
const conta = (room: (typeof LVL13)[number], ch: string): number =>
  [...room.grid.join('')].filter((c) => c === ch).length;

const T: UpdraftTiming = {
  risePxS: UPDRAFT.risePxS,
  glideFallPxS: GLIDE.fallSpeed,
  hatchPx: UPDRAFT.hatchPx,
  doubleJumpPx: 276,
};
/** A coluna B de L13-04, do teto ao piso. */
const COLUNA_B: UpdraftRect = { left: 19 * TILE, right: 22 * TILE, top: 0, bottom: 7 * TILE };

describe('LVL-13 — Abismo do Eco', () => {
  it('tem 6 salas de 11 linhas e 150 tiles (§1 campo 7)', () => {
    expect(LVL13).toHaveLength(6);
    LVL13.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length, room.id).toBe(LARGURAS[i]);
    });
    expect(LARGURAS.reduce((a, b) => a + b, 0)).toBe(150);
    expect(LVL13.reduce((n, r) => n + r.grid[0].length, 0)).toBe(150);
  });

  it('está na progressão, na posição 13 dos 16, e liga a LVL-14 (`DEC-047`)', () => {
    expect(AREAS['LVL-13']?.rooms.length).toBeGreaterThan(0);
    expect(AREA_ORDER.indexOf('LVL-13')).toBe(12);
    // o setor anterior **liga** a este: nenhum setor é uma ilha
    expect(nextArea('LVL-12')?.id).toBe('LVL-13');
    expect(nextArea('LVL-13')?.id).toBe('LVL-14');
  });

  it('não entrega habilidade: a entrada é `HAB-07` e a saída é `HAB-07` + `CEN-096`', () => {
    expect(LVL13_META.grants).toBeNull();
    expect(LVL13_META.requires).toEqual(['HAB-07']);
    expect(LVL13.map((r) => conta(r, 'X'))).toEqual([0, 0, 0, 0, 0, 0]);
    expect(UPDRAFT.requires).toBe('HAB-07');
  });

  it('é o quinto setor seguido sem plataforma, sem vão e sem armadilha (§1, §10)', () => {
    for (const ch of ['=', 'A', '_']) {
      expect(LVL13.map((r) => conta(r, ch)), `glifo ${ch}`).toEqual([0, 0, 0, 0, 0, 0]);
    }
    for (const room of LVL13) {
      expect(room.grid[7], room.id).toBe('#'.repeat(room.grid[0].length));
    }
    expect(LVL13_META.lethalFalls).toBe(false);
  });

  it('as duas colunas de vento estão em L13-04, idênticas, a 12 tiles uma da outra (§4.4)', () => {
    const vento = LVL13[3];
    expect(vento.id).toBe('L13-04');
    expect(vento.updrafts).toHaveLength(2);
    const [a, b] = vento.updrafts ?? [];
    // mesmas dimensões, mesma altura: o cenário não indica qual sobe para onde
    expect([a.from, a.to, a.topRow, a.bottomRow]).toEqual([7, 9, 0, 6]);
    expect([b.from, b.to, b.topRow, b.bottomRow]).toEqual([19, 21, 0, 6]);
    expect(a.to - a.from).toBe(b.to - b.from);
    expect(b.from - a.from).toBe(12);                 // 12 tiles de distância
    // a coluna declarada vai ao TETO: se parasse em y=1, o corpo não chegaria ao alçapão
    expect(a.topRow).toBe(0);
    // e a grade desenha 3 colunas de `a` em 6 linhas por corrente
    expect(conta(vento, 'a')).toBe(36);
    expect(LVL13_UPDRAFTS.map((u) => [u.from, u.to])).toEqual([[7, 9], [19, 21]]);
  });

  it('a trava 13 → 14 é a CONJUNÇÃO: pano sozinho não sobe, corrente sozinha não segura (§7)', () => {
    expect(updraftVerdict(true, true, true)).toBe('sobe');
    expect(updraftVerdict(true, true, false)).toBe('cai-pano');
    expect(updraftVerdict(false, false, true)).toBe('cai-vento');
    expect(updraftVerdict(true, false, true)).toBe('cai-vento');
    // e o alçapão está 108 px acima do alcance do duplo: não há segunda forma de subir
    expect(hatchShortfall(T)).toBe(108);
    expect(UPDRAFT.hatchPx).toBe(6 * TILE);
  });

  it('a subida é 140 px/s: 2,74 s para os 6 tiles, com 20 px/s de margem (§6.3)', () => {
    expect(UPDRAFT.risePxS).toBe(140);
    expect(riseTimeMs(UPDRAFT.hatchPx, UPDRAFT.risePxS)).toBe(2743);
    expect(riseMargin(T)).toBe(20);                    // contra os 120 do pano
    // a 120 o jogador ficaria parado na coluna — `PAT-LD-09` proíbe a ambiguidade
    expect(UPDRAFT.risePxS).toBeGreaterThan(GLIDE.fallSpeed);
    expect(updraftVelocity(true, true, true, UPDRAFT.risePxS)).toBe(-140);
  });

  it('o pano continua SEM ganho de altura fora da corrente (regressão de LVL-11)', () => {
    // a ficha de `HAB-07` não mudou: a corrente é que muda
    expect(GLIDE.fallSpeed).toBe(120);
    expect(GLIDE_RL.canGainHeight).toBe(false);
    expect(updraftVelocity(true, true, false, UPDRAFT.risePxS)).toBe(0);
    // e nenhuma sala fora de L13-04 declara corrente
    expect(LVL13.map((r) => (r.updrafts?.length ?? 0))).toEqual([0, 0, 0, 2, 0, 0]);
  });

  it('os dois alçapões de L13-04 têm destinos diferentes: A volta, B segue (§4.4)', () => {
    const hatches = LVL13[3].hatches ?? [];
    expect(hatches).toHaveLength(2);
    expect(hatches.map((h) => [h.from, h.to])).toEqual([[8, 9], [20, 21]]);
    expect(hatches[0].destRoom).toBe(0);      // L13-01 — o atalho
    expect(hatches[1].destRoom).toBe(4);      // L13-05 — a beira alta
    expect(LVL13[0].id).toBe('L13-01');
    expect(LVL13[4].id).toBe('L13-05');
    // os dois estão em y=0 e exigem o pano
    for (const h of hatches) {
      expect(h.state).toBe('open');
      expect(h.requires).toBe('HAB-07');
    }
    expect(LVL13[3].grid[0].split('').filter((c) => c === '^')).toHaveLength(4);
  });

  it('a queda de L13-02 é a única do jogo: 3 s, sem dano, um sentido (§8)', () => {
    const queda = LVL13[1];
    expect(queda.id).toBe('L13-02');
    expect(queda.longFall).toEqual({ to: 2, oneWay: true });
    expect(LVL13[2].id).toBe('L13-03');
    expect(LONG_FALL.fallMs).toBe(3000);
    expect(longFallMs(LONG_FALL.fallMs, LONG_FALL.reducedMotionMs, false)).toBe(3000);
    expect(longFallMs(LONG_FALL.fallMs, LONG_FALL.reducedMotionMs, true)).toBe(900);
    expect(LONG_FALL_DAMAGE).toBe(0);
    // e a sala não tem porta no lado direito: a saída é o vão
    expect(queda.grid[4][29]).toBe('#');
    expect(LVL13.map((r) => (r.longFall ? 1 : 0))).toEqual([0, 1, 0, 0, 0, 0]);
  });

  it('o eco é de 700 ms, some em `reduce_motion` e existe em 7 marcas (§5)', () => {
    expect(ECHO.delayMs).toBe(700);
    expect(ECHO.ghostAlpha).toBe(0.3);
    expect(LVL13_ECHOES).toBe(7);
    expect(LVL13.reduce((n, r) => n + conta(r, 'e'), 0)).toBe(7);
    expect(LVL13.map((r) => conta(r, 'e'))).toEqual([1, 1, 1, 2, 1, 1]);
  });

  it('5 Sentinelas, e as duas salas de teste sem nenhuma (§1 campo 10, PAT-LD-10)', () => {
    expect(LVL13.map((r) => conta(r, 'E'))).toEqual([1, 2, 1, 0, 0, 1]);
    expect(LVL13.reduce((n, r) => n + conta(r, 'E'), 0)).toBe(5);
    expect(conta(LVL13[3], 'E')).toBe(0);   // a subida não tem plateia
    expect(conta(LVL13[4], 'E')).toBe(0);   // beira alta é respiro
  });

  it('os dois saves estão onde o documento manda: o fundo e a beira alta (§2)', () => {
    expect(LVL13.map((r) => conta(r, 'P'))).toEqual([0, 0, 1, 0, 1, 0]);
    expect(LVL13[2].grid[6][3]).toBe('P');    // (3,6) no fundo do poço
    expect(LVL13[4].grid[6][3]).toBe('P');    // (3,6) na beira alta
    // a subida (L13-04) **não** salva: `PAT-LD-05`
    expect(conta(LVL13[3], 'P')).toBe(0);
  });

  it('o setor não tem material próprio: `b` e `k` são fundo do abismo e estaca (§1)', () => {
    for (const room of LVL13) {
      if (conta(room, 'b')) expect(room.glyphs?.b).toBe('abyss');
      if (conta(room, 'k')) expect(room.glyphs?.k).toBe('stake');
    }
    // zero tileset construído: nenhum glifo de tijolo, osso, cristal ou bronze
    for (const ch of ['g', 'W', 'Y', 'Z']) {
      expect(LVL13.map((r) => conta(r, ch))).toEqual([0, 0, 0, 0, 0, 0]);
    }
  });

  it('os marcos contam a história do ato sem falar do jogador (§4)', () => {
    const marcos = LVL13.flatMap((r) => Object.values(r.texts ?? {}));
    expect(marcos).toHaveLength(6);
    for (const linhas of marcos) for (const l of linhas) expect(l).toBe(l.toUpperCase());
    // o fecho do Ato III
    expect(marcos[5]).toEqual(['A ORDEM FOI DADA.', 'NÃO CONSTA O NOME.']);
    expect(marcos[1][0]).toBe('A CORDA TINHA 40 BRAÇAS.');
    expect(marcos[2][0]).toBe('QUEM GRITAR AQUI ESCUTA A SI MESMO.');
  });

  it('a coluna A leva à boca do poço de L13-01, e a boca é chegada (§4.1)', () => {
    expect(LVL13[0].glyphs?.o).toBe('well-mouth');
    expect(conta(LVL13[0], 'o')).toBe(1);
    // o spawn de teto é (4,5 · 6) e a boca está em (4,6): quem sobe pela A cai nela
    expect(LVL13[0].grid[6].indexOf('o')).toBe(4);
  });

  it('a coluna é retângulo declarado, não glifo contado (§3)', () => {
    const vento = LVL13[3];
    const [a] = vento.updrafts ?? [];
    expect(inUpdraft({ left: a.from * TILE, right: (a.to + 1) * TILE, top: 0, bottom: 7 * TILE },
      8 * TILE, 6 * TILE)).toBe(true);
    expect(inUpdraft(COLUNA_B, 20 * TILE, 6 * TILE)).toBe(true);
    expect(inUpdraft(COLUNA_B, 14 * TILE, 6 * TILE)).toBe(false);   // entre as duas colunas
  });
});
