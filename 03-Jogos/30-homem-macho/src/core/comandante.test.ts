import { describe, expect, it } from 'vitest';
import {
  comandanteAttack, comandanteDrift, comandanteDuration, comandanteMatchesSky, comandanteOpen,
  comandantePhase, comandanteSkyEvent, nextComandanteState,
  type ComandanteState, type ComandanteTiming,
} from './comandante';
import { eclipseAttackFor, skyAt, type EclipseTiming } from './eclipse';

/** Os números de `LVL-14.md` §5.3–§5.5 — os mesmos de `tuning.ts`. */
const T: ComandanteTiming = {
  introMs: 400,
  lungeWindupMs: 700,
  lungeMs: 600,
  lungeRecoverMs: 1000,
  lungeRecoverPhase2Ms: 850,
  spearWindupMs: 800,
  spearFlightMs: 500,
  unarmedMs: 1200,
  transitionMs: 1000,
  deathHoldMs: 600,
};

const SKY: EclipseTiming = {
  cycleMs: 8000, lightPhase1Ms: 5000, shadowPhase1Ms: 3000, lightPhase2Ms: 3000, shadowPhase2Ms: 5000,
};

describe('ENT-006 — a FSM do Comandante', () => {
  it('a vida 320 vira fase 2 em 160, uma única vez', () => {
    expect(comandantePhase(320, 160)).toBe(1);
    expect(comandantePhase(161, 160)).toBe(1);
    expect(comandantePhase(160, 160)).toBe(2);
    expect(comandantePhase(1, 160)).toBe(2);
  });

  it('ele não muda de x — nunca', () => {
    expect(comandanteDrift()).toBe(0);
  });

  it('o ciclo de luz segue terminando na recuperação e volta para a luz', () => {
    let s: ComandanteState = 'entrada';
    s = nextComandanteState(s, 'intro-done', 1);
    expect(s).toBe('luz');
    s = nextComandanteState(s, 'attack-chosen', 1);
    expect(s).toBe('telegraph-estocada');
    s = nextComandanteState(s, 'windup-done', 1);
    expect(s).toBe('estocada');
    s = nextComandanteState(s, 'attack-done', 1);
    expect(s).toBe('recuperacao');
    s = nextComandanteState(s, 'recover-done', 1);
    expect(s).toBe('luz');
  });

  it('o ciclo de sombra desarma e volta — o desarmado é a janela', () => {
    let s: ComandanteState = 'sombra';
    s = nextComandanteState(s, 'attack-chosen', 1);
    expect(s).toBe('telegraph-lanca');
    s = nextComandanteState(s, 'windup-done', 1);
    expect(s).toBe('lanca');
    s = nextComandanteState(s, 'attack-done', 1);
    expect(s).toBe('desarmado');
    expect(comandanteOpen(s)).toBe(true);
    s = nextComandanteState(s, 'spear-returned', 1);
    expect(s).toBe('luz');
  });

  it('na luz ele só tem ATK-13; na sombra, só ATK-14', () => {
    expect(comandanteAttack('luz')).toBeNull();
    expect(comandanteAttack('sombra')).toBeNull();
    expect(comandanteAttack('estocada')).toBe('ATK-13');
    expect(comandanteAttack('lanca')).toBe('ATK-14');
    expect(eclipseAttackFor('luz')).toBe(comandanteAttack('telegraph-estocada'));
    expect(eclipseAttackFor('sombra')).toBe(comandanteAttack('telegraph-lanca'));
  });

  it('o céu só troca o estado dele na luz e na sombra, nunca no meio de um golpe', () => {
    expect(comandanteSkyEvent('luz', 'sky-dark')).toBe(true);
    expect(comandanteSkyEvent('sombra', 'sky-light')).toBe(true);
    expect(comandanteSkyEvent('estocada', 'sky-dark')).toBe(false);
    expect(comandanteSkyEvent('desarmado', 'sky-light')).toBe(false);
    expect(nextComandanteState('estocada', 'sky-dark', 1)).toBe('estocada');
    expect(nextComandanteState('luz', 'sky-dark', 1)).toBe('sombra');
  });

  it('a fase 2 inverte o ciclo e encurta a recuperação para 850 ms', () => {
    expect(comandanteDuration('recuperacao', 1, T)).toBe(1000);
    expect(comandanteDuration('recuperacao', 2, T)).toBe(850);
    expect(nextComandanteState('luz', 'phase-done', 2)).toBe('luz');
    expect(nextComandanteState('transicao-fase', 'phase-done', 2)).toBe('sombra');
    expect(comandanteDuration('transicao-fase', 2, T)).toBe(1000);
  });

  it('a morte vence qualquer estado, inclusive o golpe em curso', () => {
    for (const s of ['entrada', 'luz', 'sombra', 'estocada', 'desarmado', 'transicao-fase'] as const) {
      expect(nextComandanteState(s, 'died', 1)).toBe('morte');
    }
    expect(nextComandanteState('morte', 'attack-chosen', 2)).toBe('morte');
  });

  it('os estados sem duração são justamente os que o eclipse governa', () => {
    expect(comandanteDuration('luz', 1, T)).toBeNull();
    expect(comandanteDuration('sombra', 2, T)).toBeNull();
    expect(comandanteDuration('desarmado', 1, T)).toBe(1200);
    expect(comandanteDuration('entrada', 1, T)).toBe(400);
  });

  it('o chefe obedece ao céu: 5 s de luz com ATK-13, 3 s de sombra com ATK-14', () => {
    for (const ms of [0, 1200, 4999]) {
      const sky = skyAt(ms, 1, SKY).sky;
      expect(sky).toBe('luz');
      expect(comandanteMatchesSky('luz', sky)).toBe(true);
      expect(eclipseAttackFor(sky)).toBe('ATK-13');
    }
    for (const ms of [5000, 6400, 7999]) {
      const sky = skyAt(ms, 1, SKY).sky;
      expect(sky).toBe('sombra');
      expect(comandanteMatchesSky('sombra', sky)).toBe(true);
      expect(eclipseAttackFor(sky)).toBe('ATK-14');
    }
  });
});
