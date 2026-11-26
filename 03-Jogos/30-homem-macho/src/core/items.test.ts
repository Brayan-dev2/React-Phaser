import { describe, expect, it } from 'vitest';
import { applyItem, isWasted, type ItemEffect } from './items';

const CAPS = { hp: 100, shield: 50 };
const ITM_HEAL: ItemEffect = { id: 'ITM-001', hp: 20 };
const ITM_SHIELD: ItemEffect = { id: 'ITM-002', shield: 10 };
const ITM_JUMP: ItemEffect = { id: 'ITM-003', permanent: true, kind: 'double-jump' };

describe('items — ITM-001/002/003/005', () => {
  it('ITM-005 entrega FORÇA e não mexe em recurso (LVL-05 §5)', () => {
    const out = applyItem({ hp: 50, shield: 0 }, { id: 'ITM-005', permanent: true, kind: 'strength' }, CAPS);
    expect(out.unlockedStrength).toBe(true);
    expect(out.unlockedDoubleJump).toBe(false);
    expect(out.resources).toEqual({ hp: 50, shield: 0 });
  });

  it('ITM-001 cura 20 sem passar do teto', () => {
    expect(applyItem({ hp: 60, shield: 10 }, ITM_HEAL, CAPS).resources.hp).toBe(80);
    expect(applyItem({ hp: 95, shield: 0 }, ITM_HEAL, CAPS).resources.hp).toBe(100);
  });

  it('ITM-002 dá 10 de escudo sem passar do teto', () => {
    expect(applyItem({ hp: 50, shield: 20 }, ITM_SHIELD, CAPS).resources.shield).toBe(30);
    expect(applyItem({ hp: 50, shield: 48 }, ITM_SHIELD, CAPS).resources.shield).toBe(50);
  });

  it('item nunca reduz recurso nem cruza os dois (cura não vira escudo)', () => {
    const out = applyItem({ hp: 100, shield: 50 }, ITM_HEAL, CAPS);
    expect(out.resources).toEqual({ hp: 100, shield: 50 });
    expect(out.gained).toBe(0);
    expect(isWasted({ hp: 100, shield: 50 }, ITM_HEAL, CAPS)).toBe(true);
  });

  it('ITM-003 não altera recurso e desbloqueia salto duplo', () => {
    const out = applyItem({ hp: 70, shield: 10 }, ITM_JUMP, CAPS);
    expect(out.resources).toEqual({ hp: 70, shield: 10 });
    expect(out.unlockedDoubleJump).toBe(true);
    expect(isWasted({ hp: 100, shield: 50 }, ITM_JUMP, CAPS)).toBe(false);
  });

  it('preserva campos extras do objeto de recursos (power)', () => {
    const out = applyItem({ hp: 60, shield: 0, power: 42 }, ITM_HEAL, CAPS);
    expect((out.resources as { power?: number }).power).toBe(42);
  });
});
