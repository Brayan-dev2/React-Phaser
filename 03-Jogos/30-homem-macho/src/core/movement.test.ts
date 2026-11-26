import { describe, expect, it } from 'vitest';
import { jumpApex, jumpApexFor } from './movement';

/** DEC-014 — a config B é a canônica; estes são os números medidos a 60 Hz. */
const B = { jumpImpulse: 560, gravity: 1100, hz: 60 };
const A = { jumpImpulse: 480, gravity: 1200, hz: 60 };

describe('régua vertical (DEC-014)', () => {
  it('config B: um salto ≈ 138 px (2,2 tiles)', () => {
    const { apexPx } = jumpApex(B);
    expect(apexPx).toBeGreaterThan(134);
    expect(apexPx).toBeLessThan(142);
  });

  it('config B: dois saltos ≈ 276 px (4,3 tiles)', () => {
    const total = jumpApexFor(2, B);
    expect(total).toBeGreaterThan(268);
    expect(total).toBeLessThan(284);
  });

  it('config A fica abaixo do gate de 3 tiles (192 px) — foi por isso que foi descartada', () => {
    const total = jumpApexFor(2, A);
    expect(total).toBeLessThan(192);
  });

  it('B não depende da taxa de quadros: ≤ 5 px de variação e nunca abaixo de 130 px', () => {
    const a60 = jumpApex({ ...B, hz: 60 }).apexPx;
    const a120 = jumpApex({ ...B, hz: 120 }).apexPx;
    const a30 = jumpApex({ ...B, hz: 30 }).apexPx;
    expect(Math.abs(a60 - a120)).toBeLessThan(5);
    expect(Math.abs(a60 - a30)).toBeLessThan(5);
    expect(Math.min(a60, a120, a30)).toBeGreaterThan(130);
    // e o gate de 3 tiles continua vencido em qualquer taxa
    expect(jumpApexFor(2, { ...B, hz: 30 })).toBeGreaterThan(192);
  });
});
