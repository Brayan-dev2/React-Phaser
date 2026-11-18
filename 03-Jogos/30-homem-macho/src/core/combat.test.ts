import { describe, expect, it } from 'vitest';
import { applyDamage } from './combat';
import type { Resources } from './types';

const res = (hp: number, shield: number): Resources => ({ hp, shield, power: 100 });

describe('dano (MEC-003 / MEC-008)', () => {
  it('o escudo absorve antes da vida', () => {
    const r = applyDamage(res(100, 10), 20, 'medium');
    expect(r.shield).toBe(0);
    expect(r.hp).toBe(90);
    expect(r.absorbed).toBe(10);
    expect(r.lost).toBe(10);
  });

  it('dificuldade multiplica antes do escudo (P-23)', () => {
    const easy = applyDamage(res(100, 0), 20, 'easy');   // 15
    const hard = applyDamage(res(100, 0), 20, 'hard');   // 25
    expect(easy.lost).toBe(15);
    expect(hard.lost).toBe(25);
  });

  it('marca morte só quando a vida chega a 0', () => {
    expect(applyDamage(res(20, 0), 20, 'medium').died).toBe(true);
    expect(applyDamage(res(20, 0), 15, 'medium').died).toBe(false);
  });

  it('não deixa vida negativa', () => {
    const r = applyDamage(res(5, 0), 40, 'hard');
    expect(r.hp).toBe(0);
    expect(r.lost).toBe(5);
  });
});
