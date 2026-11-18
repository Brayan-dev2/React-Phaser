/** Guarda-corpo das métricas de playtest — se estes números erram, `P-29` erra junto. */
import { describe, expect, it } from 'vitest';
import {
  addDeath, addItem, addPasswordAttempt, createSession, endFight, endSession,
  enterRoom, formatMs, startFight, summarize,
} from './metrics';

describe('métricas de sessão', () => {
  it('soma o tempo por sala ao trocar de sala', () => {
    let s = createSession(0);
    s = enterRoom(s, 'LVL-01', 'L01-01', 0);
    s = enterRoom(s, 'LVL-01', 'L01-02', 10_000);
    s = endSession(s, 25_000);
    const m = summarize(s);
    const lvl1 = m.perArea.find((a) => a.area === 'LVL-01');
    expect(lvl1?.ms).toBe(25_000);       // 10 s na L01-01 + 15 s na L01-02
    expect(m.totalMs).toBe(25_000);
  });

  it('conta a morte na sala atual e no total', () => {
    let s = createSession(0);
    s = enterRoom(s, 'LVL-03', 'L03-02', 0);
    s = addDeath(s, 5_000);
    s = endSession(s, 8_000);
    expect(summarize(s).deaths).toBe(1);
    expect(s.visits.reduce((a, v) => a + v.deaths, 0)).toBe(1);
  });

  it('a morte dentro da luta fecha a tentativa como derrota', () => {
    let s = createSession(0);
    s = enterRoom(s, 'LVL-03', 'L03-02', 0);
    s = startFight(s, 1_000);
    s = addDeath(s, 4_000);
    s = endFight(s, 4_000, false, 160);
    const m = summarize(s);
    expect(m.boss.attempts).toBe(1);
    expect(m.boss.wins).toBe(0);
    expect(m.boss.ttkMs).toBeNull();
    expect(s.fights[0]).toEqual({ ms: 3_000, won: false, bossHpLeft: 160, deaths: 1 });
  });

  it('TTK é a média só das vitórias (P-29)', () => {
    let s = createSession(0);
    s = startFight(s, 0);
    s = endFight(s, 50_000, false, 80);
    s = startFight(s, 60_000);
    s = endFight(s, 88_000, true, 0);
    s = startFight(s, 100_000);
    s = endFight(s, 124_000, true, 0);
    const m = summarize(s);
    expect(m.boss.attempts).toBe(3);
    expect(m.boss.wins).toBe(2);
    expect(m.boss.ttkMs).toBe(26_000);    // (28 s + 24 s) / 2 — dentro do alvo 22–35 s
    expect(m.boss.bestMs).toBe(24_000);
  });

  it('não abre duas lutas ao mesmo tempo', () => {
    let s = createSession(0);
    s = startFight(s, 1_000);
    s = startFight(s, 2_000);
    expect(s.fight?.since).toBe(1_000);
  });

  it('conta tentativas e falhas de senha (P-27 e MEC-006)', () => {
    let s = createSession(0);
    s = addPasswordAttempt(s, false);
    s = addPasswordAttempt(s, false);
    s = addPasswordAttempt(s, true);
    const m = summarize(s);
    expect(m.passwordAttempts).toBe(3);
    expect(m.passwordFailures).toBe(2);
  });

  it('item repetido não duplica no relatório', () => {
    let s = createSession(0);
    s = addItem(s, 'ITM-003');
    s = addItem(s, 'ITM-003');
    expect(summarize(s).items).toEqual(['ITM-003']);
  });

  it('formata tempo e aguenta ausência de valor', () => {
    expect(formatMs(0)).toBe('0:00');
    expect(formatMs(88_000)).toBe('1:28');
    expect(formatMs(null)).toBe('—');
    expect(formatMs(Number.NaN)).toBe('—');
  });
});
