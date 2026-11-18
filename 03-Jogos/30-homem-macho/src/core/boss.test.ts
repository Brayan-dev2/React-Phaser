import { describe, expect, it } from 'vitest';
import {
  bossPhase, chooseAttack, damageBoss, nextBossState, shouldProcessDeath, stateDuration,
  type BossEvent, type BossState, type BossTiming,
} from './boss';

const T: BossTiming = {
  introMs: 400, telegraphMs: 800, telegraphPhase2Ms: 600, chargeMs: 620,
  recoverMs: 1000, recoverPhase2Ms: 800, stunMs: 1200, areaTelegraphMs: 1000,
  areaRecoverMs: 900, transitionMs: 600, deathHoldMs: 600,
};

describe('boss ENT-003 — FSM (§5.2)', () => {
  it('fase 2 quando a vida cai a 100 ou menos', () => {
    expect(bossPhase(200, 100)).toBe(1);
    expect(bossPhase(101, 100)).toBe(1);
    expect(bossPhase(100, 100)).toBe(2);
    expect(bossPhase(0, 100)).toBe(2);
  });

  it('a entrada dura 400 ms e só sai com o hold concluído', () => {
    expect(stateDuration('entrada', 1, T)).toBe(400);
    expect(nextBossState('entrada', 'attack-chosen', 1)).toBe('entrada');
    expect(nextBossState('entrada', 'intro-done', 1)).toBe('idle');
  });

  it('telegraph investida vira investida e respeita o windup de cada fase', () => {
    expect(nextBossState('telegraph', 'windup-done', 1, 'ATK-01')).toBe('investida');
    expect(stateDuration('telegraph', 1, T)).toBe(800);
    expect(stateDuration('telegraph', 2, T)).toBe(600);
  });

  it('ATK-02 só existe na fase 2 — na fase 1 o windup leva à investida', () => {
    expect(nextBossState('telegraph', 'windup-done', 1, 'ATK-02')).toBe('investida');
    expect(nextBossState('telegraph', 'windup-done', 2, 'ATK-02')).toBe('golpe-area');
    expect(chooseAttack(1, true)).toBe('ATK-01');
    expect(chooseAttack(2, true)).toBe('ATK-02');
  });

  it('bater no pilar atordoa por 1200 ms e volta ao idle', () => {
    expect(nextBossState('investida', 'hit-pillar', 1)).toBe('atordoado');
    expect(stateDuration('atordoado', 1, T)).toBe(1200);
    expect(nextBossState('atordoado', 'stun-done', 1)).toBe('idle');
  });

  it('investida sem pilar entra em recuperação (a janela de punição)', () => {
    expect(nextBossState('investida', 'charge-done', 1)).toBe('recuperacao');
    expect(stateDuration('recuperacao', 1, T)).toBe(1000);
    expect(stateDuration('recuperacao', 2, T)).toBe(800);
    expect(nextBossState('recuperacao', 'recover-done', 1)).toBe('idle');
  });

  it('golpe de área volta para recuperação', () => {
    expect(nextBossState('golpe-area', 'area-done', 2)).toBe('recuperacao');
    expect(nextBossState('golpe-area', 'charge-done', 2)).toBe('golpe-area');
  });

  it('a morte é terminal: nenhum evento tira o chefe de lá', () => {
    const eventos: BossEvent[] = ['intro-done', 'attack-chosen', 'windup-done', 'charge-done', 'hit-pillar', 'stun-done', 'recover-done'];
    for (const e of eventos) expect(nextBossState('morte', e, 2)).toBe('morte');
  });

  it('MEC-009 é idempotente: o processamento acontece uma vez', () => {
    expect(shouldProcessDeath('idle', 0, false)).toBe(true);
    expect(shouldProcessDeath('idle', 0, true)).toBe(false);
    expect(shouldProcessDeath('morte', 0, false)).toBe(false); // já morreu
    expect(shouldProcessDeath('idle', 20, false)).toBe(false);
  });

  it('vida nunca fica negativa', () => {
    expect(damageBoss(200, 20)).toBe(180);
    expect(damageBoss(10, 20)).toBe(0);
    expect(damageBoss(0, 20)).toBe(0);
  });

  it('os estados que esperam evento não têm duração', () => {
    const semDuracao: BossState[] = ['idle'];
    for (const s of semDuracao) expect(stateDuration(s, 1, T)).toBeNull();
  });
});
