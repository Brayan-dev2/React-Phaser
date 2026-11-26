import { describe, expect, it } from 'vitest';
import {
  addSeal, duoAttackFor, duoBodies, duoCycleMs, duoDefeated, duoDuration, duoFelled,
  effectiveCycleMs, nextDuoState, reviveHp, reviveInterrupted, reviveWindowOpen, sealExpired,
  sealLabel, suspensionMs, type DuoTiming,
} from './duo';

/** Os números de `LVL-15.md` §5.3–§5.6 — os mesmos de `tuning.ts`. */
const T: DuoTiming = {
  introMs: 400,
  lanternWindupMs: 700,
  lanternMs: 300,
  lanternRecoverMs: 1000,
  sealWindupMs: 600,
  sealFlightMs: 960,
  sealRecoverMs: 800,
  reviveMs: 4000,
  interruptDamage: 30,
  suspendMaxMs: 800,
};

describe('ENT-007 — um chefe, dois corpos', () => {
  it('os dois corpos nascem iguais e simétricos: 180 HP cada', () => {
    expect(duoBodies(180)).toEqual([180, 180]);
  });

  it('`MEC-009` **não** dispara com um corpo vivo (§5.6)', () => {
    expect(duoDefeated(0, 180)).toBe(false);
    expect(duoDefeated(180, 0)).toBe(false);
    expect(duoDefeated(0, 0)).toBe(true);
    expect(duoFelled(0)).toBe(true);
    expect(duoFelled(1)).toBe(false);
  });

  it('a queda não é morte: o corpo caído fica visível e o outro o revive', () => {
    expect(nextDuoState('ativo', 'body-down')).toBe('queda');
    expect(nextDuoState('queda', 'revive-done')).toBe('ativo');
    expect(nextDuoState('queda', 'both-down')).toBe('morte');
    // com um corpo só em queda, nada de `morte`
    expect(nextDuoState('queda', 'attack-chosen')).toBe('queda');
  });

  it('a revivificação devolve 50% e a janela é de 4 s', () => {
    expect(reviveHp(180, 50)).toBe(90);
    expect(reviveWindowOpen(0, T)).toBe(true);
    expect(reviveWindowOpen(3999, T)).toBe(true);
    expect(reviveWindowOpen(4000, T)).toBe(false);
    expect(duoDuration('canalizando', 'ATK-16', T)).toBe(4000);
  });

  it('interromper exige 30 de dano acumulado — dois golpes de 20 servem', () => {
    expect(reviveInterrupted(25, T)).toBe(false);
    expect(reviveInterrupted(30, T)).toBe(true);
    expect(reviveInterrupted(40, T)).toBe(true);
  });

  it('o sobrevivente **recua**, não enfurece: `ATK-18` é `canalizando`, não um ataque novo', () => {
    expect(duoDuration('canalizando', 'ATK-16', T)).toBe(T.reviveMs);
    expect(duoDuration('queda', 'ATK-16', T)).toBeNull();
    // nenhum estado de "fúria" existe na tabela
    expect(nextDuoState('canalizando', 'revive-interrupted')).toBe('ativo');
  });

  it('o ciclo de um corpo é 2,0 s, e com os dois de pé cai para 1,0 s efetivo', () => {
    expect(duoCycleMs(T)).toBe(2000);
    expect(effectiveCycleMs(2, T)).toBe(1000);
    expect(effectiveCycleMs(1, T)).toBe(2000);
  });

  it('a suspensão precisa de **dois** selos e nunca passa de 800 ms', () => {
    expect(suspensionMs(0, T)).toBe(0);
    expect(suspensionMs(1, T)).toBe(0);
    expect(suspensionMs(2, T)).toBe(800);
    expect(suspensionMs(5, T)).toBe(800);
    expect(sealLabel(0)).toBe('0 / 2');
    expect(sealLabel(1)).toBe('1 / 2');
    expect(sealLabel(2)).toBe('2 / 2');
    expect(sealLabel(4)).toBe('2 / 2');
  });

  it('um selo por corpo: o teto da mecânica é dois', () => {
    expect(addSeal(0)).toBe(1);
    expect(addSeal(1)).toBe(2);
    expect(addSeal(2)).toBe(2);
  });

  it('o selo expira sozinho, senão o jogador carrega o segundo para sempre', () => {
    expect(sealExpired(999, 1000)).toBe(false);
    expect(sealExpired(1000, 1000)).toBe(true);
  });

  it('os dois corpos alternam entre lanterna e selo, e o segundo começa pelo oposto', () => {
    expect(duoAttackFor(0, null)).toBe('ATK-16');
    expect(duoAttackFor(1, null)).toBe('ATK-17');
    expect(duoAttackFor(0, 'ATK-16')).toBe('ATK-17');
    expect(duoAttackFor(0, 'ATK-17')).toBe('ATK-16');
  });

  it('a queda é o único estado sem duração: quem conta o tempo é o parceiro', () => {
    expect(duoDuration('queda', 'ATK-16', T)).toBeNull();
    expect(duoDuration('ativo', 'ATK-16', T)).toBeNull();
    expect(duoDuration('telegraph', 'ATK-16', T)).toBe(700);
    expect(duoDuration('telegraph', 'ATK-17', T)).toBe(600);
  });
});
