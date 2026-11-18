/** `LVL-08` §7 — areia: atrito de piso sem dano, relógio de âncoras e o reset na morte. */
import { describe, expect, it } from 'vitest';
import {
  SAND_CLOCK, activeSand, anchorToSand, enterPhase2, groundSpeedMultiplier, nextAnchorDelay,
  pointInSand, startSandClock, stepSandClock, zeroSand,
} from './sand';

const TILE = 64;

describe('areia (CEN-064)', () => {
  it('reduz a velocidade no chão a 0,75× e é invisível no ar (§7.1)', () => {
    expect(groundSpeedMultiplier(true, true, 0.75)).toBe(0.75);
    expect(groundSpeedMultiplier(true, false, 0.75)).toBe(1);   // pulando: sem atrito
    expect(groundSpeedMultiplier(false, true, 0.75)).toBe(1);   // fora da areia
  });

  it('o salto de corrida cai de 313 px para 235 px com o multiplicador (§7.5)', () => {
    const corrida = 313;
    expect(Math.round(corrida * 0.75)).toBe(235);
  });

  it('reconhece o ponto dentro do retângulo da ficha, não do glifo', () => {
    const areia = [{ from: 4, to: 5, topRow: 6, bottomRow: 6 }];
    expect(pointInSand(areia, 4 * TILE + 1, 6 * TILE + 30, TILE)).toBe(true);
    expect(pointInSand(areia, 5 * TILE + 63, 6 * TILE + 30, TILE)).toBe(true);
    expect(pointInSand(areia, 3 * TILE + 63, 6 * TILE + 30, TILE)).toBe(false);
    expect(pointInSand(areia, 4 * TILE + 1, 5 * TILE + 30, TILE)).toBe(false);
  });

  it('o relógio acorda a primeira âncora em 8 s e as seguintes a cada 10 s na fase 1', () => {
    let estado = startSandClock();
    expect(nextAnchorDelay(estado)).toBe(8_000);

    let passo = stepSandClock(estado, 7_999);
    expect(passo.activated).toBe(0);
    estado = passo.state;

    passo = stepSandClock(estado, 1);
    expect(passo.activated).toBe(1);
    estado = passo.state;
    expect(estado.anchors).toBe(1);
    expect(nextAnchorDelay(estado)).toBe(10_000);

    passo = stepSandClock(estado, 9_999);
    expect(passo.activated).toBe(0);
    passo = stepSandClock(passo.state, 1);
    expect(passo.state.anchors).toBe(2);
  });

  it('na fase 2 o relógio reinicia em 8 s e corre a cada 8 s (§7.3)', () => {
    const fase2 = enterPhase2({ anchors: 2, elapsedMs: 4_000, phase: 1 });
    expect(fase2).toEqual({ anchors: 2, elapsedMs: 0, phase: 2 });
    expect(nextAnchorDelay(fase2)).toBe(8_000);
    const passo = stepSandClock(fase2, 8_000);
    expect(passo.state.anchors).toBe(3);
  });

  it('para em 4 âncoras: o piso não degrada mais (§7.3)', () => {
    let estado = startSandClock();
    for (let i = 0; i < 20; i++) estado = stepSandClock(estado, 12_000).state;
    expect(estado.anchors).toBe(SAND_CLOCK.maxAnchors);
    expect(stepSandClock(estado, 60_000).activated).toBe(0);
  });

  it('um passo absurdo não acorda o piso todo de uma vez', () => {
    const passo = stepSandClock(startSandClock(), 100_000);
    expect(passo.state.anchors).toBe(SAND_CLOCK.maxAnchors);
    expect(passo.activated).toBe(SAND_CLOCK.maxAnchors);
    // segunda passada: já no teto, nada acorda
    expect(stepSandClock(passo.state, 100_000).activated).toBe(0);
  });

  it('zera na morte (§10.1) — o oposto do contrapeso de LVL-05', () => {
    expect(zeroSand()).toEqual({ anchors: 0, elapsedMs: 0, phase: 1 });
  });

  it('a âncora cobre 3 tiles e entra na areia ativa na ordem das colunas', () => {
    expect(anchorToSand(5, 7, 3)).toEqual({ from: 4, to: 6, topRow: 6, bottomRow: 6 });
    const areia = activeSand([], [5, 10, 15, 20], 2, 7);
    expect(areia).toHaveLength(2);
    expect(areia.map((r) => r.from)).toEqual([4, 9]);
    expect(activeSand([], [5, 10, 15, 20], 9, 7)).toHaveLength(4);   // nunca passa de 4
  });
});
