import { describe, expect, it } from 'vitest';
import {
  airTimeMs, crossesFromHang, gapBlocksDoubleJump, hangPosition, hookJumpReach,
  trailingDifferenceMs,
  isInReach, pickRing, pullMs, DOUBLE_JUMP_REACH_PX, HOOK_IS_WEAPON, HOOK_REACH_PX,
} from './hook';

const TILE = 64;

describe('HAB-04 gancho — alcance (§6.2)', () => {
  it('aceita argola acima dentro dos 6 tiles', () => {
    expect(isInReach({ x: 0, y: -3 * TILE }, 0, 0)).toBe(true);
    expect(isInReach({ x: 3 * TILE, y: -3 * TILE }, 0, 0)).toBe(true);   // 4,24 tiles
  });

  it('recusa argola abaixo: pendurar exige hemisfério superior', () => {
    expect(isInReach({ x: 0, y: 64 }, 0, 0)).toBe(false);
  });

  it('recusa além de 6 tiles', () => {
    expect(isInReach({ x: 7 * TILE, y: 0 }, 0, 0)).toBe(false);
    expect(HOOK_REACH_PX).toBe(6 * TILE);
  });

  it('escolhe a argola mais próxima e prefere a da mão que olha', () => {
    const esquerda = { x: -3 * TILE, y: -2 * TILE };
    const direita = { x: 3 * TILE, y: -2 * TILE };
    expect(pickRing([esquerda, direita], 0, 0, 1)).toBe(direita);
    expect(pickRing([esquerda, direita], 0, 0, -1)).toBe(esquerda);
    expect(pickRing([{ x: 9 * TILE, y: -2 * TILE }], 0, 0, 1)).toBeNull();
  });
});

describe('HAB-04 gancho — puxada e pendurado', () => {
  it('5 tiles a 900 px/s levam ~356 ms', () => {
    expect(Math.round(pullMs(5 * TILE))).toBe(356);
  });

  it('pendura o corpo abaixo da argola, e o y devolvido é o pé (origem 0.5,1)', () => {
    expect(hangPosition({ x: 100, y: 200 }, 80)).toEqual({ x: 100, y: 280 });
    expect(hangPosition({ x: 100, y: 200 }, 80, 8)).toEqual({ x: 100, y: 288 });
  });

  it('o gancho não é arma', () => {
    expect(HOOK_IS_WEAPON).toBe(false);
  });
});

describe('HAB-04 gancho — o salto do gancho (§6.3)', () => {
  it('1,43 s no ar caindo 334 px e 545 px de alcance (o §6.3 diz 1,29 s / 490 px)', () => {
    // a queda é `dropPx + ápice`, não `dropPx`: o §6.3 esqueceu os 142 px do impulso
    expect(Math.round(airTimeMs(334))).toBe(1433);
    expect(Math.round(hookJumpReach(334))).toBe(545);
    expect(trailingDifferenceMs(334)).toBeGreaterThan(140);   // ~145 ms de 12%
  });

  it('cobre os 4 tiles do canal a partir da argola, com 3,6 tiles de folga', () => {
    expect(crossesFromHang(4 * TILE, 334)).toBe(true);
    expect((hookJumpReach(334) - 4 * TILE) / TILE).toBeGreaterThan(3.5);
  });

  it('o canal de 8 tiles está fora do salto duplo — é a trava 09 → 10', () => {
    expect(8 * TILE).toBeGreaterThan(DOUBLE_JUMP_REACH_PX);
    expect(gapBlocksDoubleJump(8 * TILE)).toBe(true);
    // 6 tiles (384 px) fica 6 px fora do alcance: tecnicamente fora, e proibido mesmo assim
    // por `PAT-LD-09` — margem de 6 px é a ambiguidade que a regra existe para evitar
    expect(6 * TILE - DOUBLE_JUMP_REACH_PX).toBe(6);
  });

  it('a argola fica no meio do canal, e dela até o piso são 4 tiles', () => {
    expect(crossesFromHang(4 * TILE, 334)).toBe(true);
    // o salto de gancho vai além dos 8 tiles, mas partir da borda não resolve o vão:
    // perder a argola no meio custa a folga que a sala foi desenhada para ter (§6.3)
    expect(hookJumpReach(334)).toBeGreaterThan(8 * TILE);
  });
});
