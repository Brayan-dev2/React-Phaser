import { describe, expect, it } from 'vitest';
import {
  KEY_ITEMS, addKey, eclipseAttackFor, eclipseInverted, eclipseStops, gateVerdict, keyLabel,
  lockCount, skyAt, skyDurations, type EclipseTiming,
} from './eclipse';

/** Os números de `LVL-14.md` §7.3 — os mesmos de `tuning.ts`. */
const T: EclipseTiming = {
  cycleMs: 8000, lightPhase1Ms: 5000, shadowPhase1Ms: 3000, lightPhase2Ms: 3000, shadowPhase2Ms: 5000,
};

describe('CEN-100 — o relógio do céu', () => {
  it('começa na luz e a fase 1 é 5 s de luz / 3 s de sombra', () => {
    expect(skyAt(0, 1, T).sky).toBe('luz');
    expect(skyAt(4999, 1, T).sky).toBe('luz');
    expect(skyAt(5000, 1, T).sky).toBe('sombra');
    expect(skyAt(7999, 1, T).sky).toBe('sombra');
    expect(skyAt(8000, 1, T).sky).toBe('luz');
  });

  it('a fase 2 inverte: 3 s de luz e 5 s de sombra, mesmo total', () => {
    expect(skyAt(2999, 2, T).sky).toBe('luz');
    expect(skyAt(3000, 2, T).sky).toBe('sombra');
    expect(skyAt(7999, 2, T).sky).toBe('sombra');
    expect(skyAt(8000, 2, T).sky).toBe('luz');
    const f1 = skyDurations(1, T);
    const f2 = skyDurations(2, T);
    expect(f1.light + f1.shadow).toBe(T.cycleMs);
    expect(f2.light + f2.shadow).toBe(T.cycleMs);
  });

  it('a fase 2 não acelera nada — só muda a proporção (§7.3)', () => {
    expect(eclipseInverted(1, T)).toBe(false);
    expect(eclipseInverted(2, T)).toBe(true);
  });

  it('devolve o tempo que falta para o próximo estado', () => {
    expect(skyAt(0, 1, T).remainingMs).toBe(5000);
    expect(skyAt(4000, 1, T).remainingMs).toBe(1000);
    expect(skyAt(5000, 1, T).remainingMs).toBe(3000);
    expect(skyAt(7000, 1, T).remainingMs).toBe(1000);
  });

  it('conta ciclos e sobrevive a tempos negativos ou zero', () => {
    expect(skyAt(8000, 1, T).cycle).toBe(1);
    expect(skyAt(16500, 1, T).cycle).toBe(2);
    expect(skyAt(-500, 1, T).sky).toBe('luz');
    expect(skyAt(0, 1, { ...T, cycleMs: 0, lightPhase1Ms: 0, shadowPhase1Ms: 0 }).sky).toBe('luz');
  });

  it('o chefe só tem um ataque por estado: luz → ATK-13, sombra → ATK-14', () => {
    expect(eclipseAttackFor('luz')).toBe('ATK-13');
    expect(eclipseAttackFor('sombra')).toBe('ATK-14');
  });

  it('para na morte do chefe e fica onde estava', () => {
    expect(eclipseStops(true, true)).toBe(false);
    expect(eclipseStops(true, false)).toBe(true);
    expect(eclipseStops(false, false)).toBe(false);
  });
});

describe('DEC-016 — chave é contador, não item', () => {
  it('incrementa um por chefe derrotado', () => {
    expect(addKey(0)).toBe(1);
    expect(addKey(2)).toBe(3);
    expect(addKey(-4)).toBe(1);
  });

  it('o portão abre com 2 e com 3, e não abre com 1 nem 0', () => {
    expect(gateVerdict(0, 2)).toBe('faltam');
    expect(gateVerdict(1, 2)).toBe('faltam');
    expect(gateVerdict(2, 2)).toBe('abre');
    expect(gateVerdict(3, 2)).toBe('abre');
  });

  it('a UI mostra x / 2 e a sobra fica visível', () => {
    expect(keyLabel(2, 2)).toBe('2 / 2');
    expect(keyLabel(3, 2)).toBe('3 / 2');
    expect(keyLabel(0, 2)).toBe('0 / 2');
  });

  it('desenha duas fechaduras, nunca três', () => {
    expect(lockCount(2)).toBe(2);
    expect(lockCount(3)).toBe(2);
    expect(lockCount(0)).toBe(1);
  });

  it('a terceira chave é a de LVL-12 — e é a única sobra possível', () => {
    expect(KEY_ITEMS).toHaveLength(3);
    expect(KEY_ITEMS[2]).toBe('ITM-011');
  });
});
