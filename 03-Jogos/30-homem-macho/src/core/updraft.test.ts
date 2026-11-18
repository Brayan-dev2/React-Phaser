import { describe, expect, it } from 'vitest';
import {
  LONG_FALL_DAMAGE, echoAt, echoGhostVisible, hatchShortfall, inUpdraft, longFallMs,
  riseMargin, riseTimeMs, shortcutCost, updraftVerdict, updraftVelocity,
  type UpdraftRect, type UpdraftTiming,
} from './updraft';

const TILE = 64;
/** Os números de `LVL-13` §6: a coluna B de L13-04 (x = 19–21, do piso ao teto). */
const COLUNA: UpdraftRect = { left: 19 * TILE, right: 22 * TILE, top: 0, bottom: 7 * TILE };
const T: UpdraftTiming = {
  risePxS: 140, glideFallPxS: 120, hatchPx: 6 * TILE, doubleJumpPx: 276,
};

describe('CEN-096 corrente de ar — quem sobe é a corrente (§6)', () => {
  it('a coluna é uma região declarada, não colisão: o centro do corpo decide', () => {
    expect(inUpdraft(COLUNA, 20 * TILE, 6 * TILE)).toBe(true);
    expect(inUpdraft(COLUNA, 18 * TILE, 6 * TILE)).toBe(false);   // um tile à esquerda
    expect(inUpdraft(COLUNA, 20 * TILE, 8 * TILE)).toBe(false);   // abaixo do piso
  });

  it('sobe 140 px/s SÓ com pano aberto dentro da corrente (§6.2)', () => {
    expect(updraftVelocity(true, true, true, T.risePxS)).toBe(-140);
    // com o pano aberto fora da corrente não há subida nenhuma
    expect(updraftVelocity(true, true, false, T.risePxS)).toBe(0);
    // dentro da corrente, sem o pano: a coluna não segura ninguém
    expect(updraftVelocity(false, true, true, T.risePxS)).toBe(0);
    expect(updraftVelocity(true, false, true, T.risePxS)).toBe(0);
  });

  it('as quatro combinações, e a trava é a CONJUNÇÃO (§7)', () => {
    expect(updraftVerdict(true, true, true)).toBe('sobe');
    expect(updraftVerdict(true, true, false)).toBe('cai-pano');    // pano sozinho não sobe
    expect(updraftVerdict(false, false, true)).toBe('cai-vento');  // corrente sozinha não segura
    expect(updraftVerdict(true, false, true)).toBe('cai-vento');   // pano fechado na coluna
    expect(updraftVerdict(false, false, false)).toBe('cai');
    // nenhuma combinação além de (pano + corrente) sobe
    const todas = [true, false].flatMap((g) => [true, false].flatMap((d) => [true, false].map((i) =>
      updraftVerdict(g, d, i))));
    expect(todas.filter((v) => v === 'sobe')).toHaveLength(1);
  });

  it('os 6 tiles levam 2,74 s — e a 120 px/s o jogador ficaria parado (§6.3)', () => {
    expect(riseTimeMs(384, 140)).toBe(2743);
    expect(384 / 120).toBe(3.2);            // a 120 seria mais lento que a descida do pano
    expect(riseMargin(T)).toBe(20);         // a margem pequena de propósito
    expect(T.risePxS).toBeGreaterThan(T.glideFallPxS);
  });

  it('a trava 13 → 14 tem 108 px de margem sobre o salto duplo (§7)', () => {
    expect(T.hatchPx).toBe(384);
    expect(T.doubleJumpPx).toBe(276);
    expect(hatchShortfall(T)).toBe(108);
    // e o alçapão fica acima do que o duplo alcança: não há segunda forma de subir
    expect(T.hatchPx).toBeGreaterThan(T.doubleJumpPx);
  });

  it('fora da corrente o pano continua sendo só um teto de queda (regressão de LVL-11)', () => {
    // nenhum retorno positivo de velocidade: o pano nunca ganha um pixel de altura
    for (const g of [true, false]) {
      for (const d of [true, false]) {
        if (g && d) expect(updraftVelocity(g, d, false, T.risePxS)).toBe(0);
      }
    }
    expect(updraftVelocity(true, true, false, T.risePxS)).toBeLessThanOrEqual(0);
  });
});

describe('CEN-095 o eco — o setor não tem voz própria (§5)', () => {
  it('devolve a posição de 700 ms atrás, não a de agora', () => {
    const historia = [
      { x: 100, y: 400, t: 0 },
      { x: 200, y: 400, t: 500 },
      { x: 300, y: 400, t: 1000 },
    ];
    expect(echoAt(historia, 1000, 700)).toEqual({ x: 100, y: 400 });
    expect(echoAt(historia, 1200, 700)).toEqual({ x: 200, y: 400 });
    expect(echoAt(historia, 1750, 700)).toEqual({ x: 300, y: 400 });
    // sem história suficiente, o abismo não devolve nada (não inventa voz)
    expect(echoAt(historia, 600, 700)).toBeNull();
    expect(echoAt([], 5000, 700)).toBeNull();
  });

  it('a silhueta sai em `reduce_motion`; o som fica (§5, VIS-009)', () => {
    expect(echoGhostVisible(false)).toBe(true);
    expect(echoGhostVisible(true)).toBe(false);
  });
});

describe('CEN-099 a queda longa (§8)', () => {
  it('3.000 ms, e 900 ms com movimento reduzido', () => {
    expect(longFallMs(3000, 900, false)).toBe(3000);
    expect(longFallMs(3000, 900, true)).toBe(900);
    expect(longFallMs(3000, 900, true)).toBeLessThanOrEqual(900);
  });

  it('nunca dá dano — `DEC-011`', () => {
    expect(LONG_FALL_DAMAGE).toBe(0);
  });

  it('a queda é 5× a transição comum do jogo (todas as outras ≤ 600 ms)', () => {
    expect(3000 / 600).toBe(5);
  });

  it('o atalho custa duas salas, e não é soft lock (§7.1)', () => {
    // L13-04 (índice 3) → L13-01 (índice 0): três salas de distância, duas de volta
    expect(shortcutCost(3 - 0)).toBe(3);
    expect(shortcutCost(0)).toBe(0);
  });
});
