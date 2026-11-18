/** LVL-06 §5 e §8.2: fôlego, natação e a trava temporal. */
import { describe, expect, it } from 'vitest';
import {
  BREATH_BASE_MS, BREATH_HABILIDADE_MS, canCross, consume, isDrowning,
  maxBreath, refill, shouldShowDrownHint, swimTimeMs,
} from './breathe';

describe('fôlego (`HAB-06`)', () => {
  it('6 s base e 20 s com a habilidade (§5.1)', () => {
    expect(maxBreath(false)).toBe(BREATH_BASE_MS);
    expect(maxBreath(true)).toBe(BREATH_HABILIDADE_MS);
    expect(BREATH_HABILIDADE_MS / BREATH_BASE_MS).toBeGreaterThan(3.3);
  });

  it('consumir nunca deixa o fôlego negativo e aguenta delta grande', () => {
    expect(consume(500, 200)).toBe(300);
    expect(consume(100, 5_000)).toBe(0);
    expect(consume(100, -50)).toBe(100);
  });

  it('emergir reenche imediatamente (não há barra enchendo)', () => {
    expect(refill(true)).toBe(BREATH_HABILIDADE_MS);
    expect(refill(false)).toBe(BREATH_BASE_MS);
  });

  it('afogamento é fôlego exatamente zero, nunca "quase"', () => {
    expect(isDrowning(0)).toBe(true);
    expect(isDrowning(1)).toBe(false);
  });
});

describe('a trava de saída é temporal (§8.2)', () => {
  const galeria = 19 * 64;              // 1.216 px
  const mergulhoAteX = 6 * 64;          // 3 tiles + 3 de descida

  it('a galeria leva ~7,6 s de natação', () => {
    expect(Math.round(swimTimeMs(galeria))).toBe(7_600);
  });

  it('sem HAB-06 a galeria é inatacável; com ela sobra folga', () => {
    expect(canCross(galeria, false)).toBe(false);
    expect(canCross(galeria, true)).toBe(true);
  });

  it('o mergulho até o item passa até sem a habilidade — é o ensino (DEC-010)', () => {
    expect(canCross(mergulhoAteX, false)).toBe(true);
  });

  it('distância zero e velocidade inválida não explodem', () => {
    expect(canCross(0, false)).toBe(true);
    expect(swimTimeMs(100, 0)).toBe(Number.POSITIVE_INFINITY);
  });

  it('a dica de UI aparece só no segundo afogamento da mesma sala', () => {
    expect(shouldShowDrownHint(1).show).toBe(false);
    expect(shouldShowDrownHint(2)).toEqual({ show: true, line: 'A ÁGUA É FUNDA DEMAIS. FALTA FÔLEGO.' });
  });
});
