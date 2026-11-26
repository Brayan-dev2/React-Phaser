/** `ENT-004` O Alferes da Ronda (`LVL-08` §5): FSM, eco da fase 2 e morte idempotente. */
import { describe, expect, it } from 'vitest';
import {
  alferesDuration, alferesPhase, chooseAlferesAttack, clampArena, damageAlferes, echoReach,
  inEcho, nextAlferesState, shouldProcessAlferesDeath, shouldSpawnEcho,
  type AlferesTiming,
} from './alferes';

const T: AlferesTiming = {
  introMs: 400,
  windupMs: 700,
  lungeMs: 400,
  recoverMs: 1_100,
  recoverPhase2Ms: 900,
  echoDelayMs: 600,
  echoMs: 500,
  transitionMs: 800,
  deathHoldMs: 600,
};

describe('Alferes da Ronda (ENT-004)', () => {
  it('a fase 2 começa em 120 de 240 HP (§5.5)', () => {
    expect(alferesPhase(240, 120)).toBe(1);
    expect(alferesPhase(121, 120)).toBe(1);
    expect(alferesPhase(120, 120)).toBe(2);
    expect(alferesPhase(0, 120)).toBe(2);
  });

  it('o ciclo da fase 1 é 2,60 s e o da fase 2 é 2,30 s (§6.3)', () => {
    const fase1 = T.windupMs + T.lungeMs + T.recoverMs + 400;   // + reposicionamento
    const fase2 = T.windupMs + T.lungeMs + T.recoverPhase2Ms + 300;
    expect(fase1).toBe(2_600);
    expect(fase2).toBe(2_300);
  });

  it('percorre entrada → idle → telegraph → estocada → recuperação → idle', () => {
    let s = nextAlferesState('entrada', 'intro-done', 1);
    expect(s).toBe('idle');
    s = nextAlferesState(s, 'attack-chosen', 1);
    expect(s).toBe('telegraph');
    s = nextAlferesState(s, 'windup-done', 1);
    expect(s).toBe('estocada');
    s = nextAlferesState(s, 'lunge-done', 1);
    expect(s).toBe('recuperacao');
    s = nextAlferesState(s, 'recover-done', 1);
    expect(s).toBe('idle');
  });

  it('o eco entra no meio da estocada e só em fase 2 (§5.2/§5.3)', () => {
    expect(shouldSpawnEcho(1, 'estocada', 600, false, T)).toBe(false);   // fase 1: nunca
    expect(shouldSpawnEcho(2, 'estocada', 599, false, T)).toBe(false);
    expect(shouldSpawnEcho(2, 'estocada', 600, false, T)).toBe(true);
    expect(shouldSpawnEcho(2, 'estocada', 900, true, T)).toBe(false);    // uma vez por estocada
    expect(shouldSpawnEcho(2, 'telegraph', 900, false, T)).toBe(false);  // só na estocada

    let s = nextAlferesState('estocada', 'echo-done', 2, 'ATK-06');
    expect(s).toBe('eco');
    s = nextAlferesState(s, 'echo-done', 2, 'ATK-06');
    expect(s).toBe('recuperacao');
  });

  it('a recuperação encurta de 1100 para 900 ms na fase 2 (§5.5)', () => {
    expect(alferesDuration('recuperacao', 1, T)).toBe(1_100);
    expect(alferesDuration('recuperacao', 2, T)).toBe(900);
    expect(alferesDuration('idle', 1, T)).toBeNull();      // espera evento
    expect(alferesDuration('estocada', 2, T)).toBe(400);   // o alcance não muda
  });

  it('em fase 1 só existe ATK-04; em fase 2 alterna com o eco', () => {
    expect(chooseAlferesAttack(1, true)).toBe('ATK-04');
    expect(chooseAlferesAttack(2, false)).toBe('ATK-04');
    expect(chooseAlferesAttack(2, true)).toBe('ATK-06');
  });

  it('o eco nasce onde ele estava, não onde ele está — e alcança os mesmos 4 tiles', () => {
    expect(echoReach(1_000, 1, 256)).toEqual({ from: 1_000, to: 1_256 });
    expect(echoReach(1_000, -1, 256)).toEqual({ from: 744, to: 1_000 });
    const origem = 1_000;
    expect(inEcho(origem, 1, 256, 1_050)).toBe(true);    // correndo atrás dele: erro
    expect(inEcho(origem, 1, 256, 1_256)).toBe(true);    // ainda na borda da faixa
    expect(inEcho(origem, 1, 256, 1_260)).toBe(false);   // passar por ele: certo
    expect(inEcho(origem, 1, 256, 900)).toBe(false);     // recuar também escapa
  });

  it('0 HP é processado uma única vez (TST-009)', () => {
    expect(shouldProcessAlferesDeath('estocada', 0, false)).toBe(true);
    expect(shouldProcessAlferesDeath('estocada', 0, true)).toBe(false);
    expect(shouldProcessAlferesDeath('estocada', 20, false)).toBe(false);
    expect(damageAlferes(20, 20)).toBe(0);
    expect(damageAlferes(10, 20)).toBe(0);     // nunca negativo
  });

  it('é imune a knockback e não sai da arena (§5.1)', () => {
    expect(clampArena(50, 192, 1_344)).toBe(192);
    expect(clampArena(2_000, 192, 1_344)).toBe(1_344);
    expect(clampArena(800, 192, 1_344)).toBe(800);
  });
});
