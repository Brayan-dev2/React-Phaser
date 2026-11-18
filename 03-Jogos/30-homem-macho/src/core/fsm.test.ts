import { describe, expect, it } from 'vitest';
import { canTransition, PLAYER_TRANSITIONS } from './fsm';

describe('FSM do jogador (PAT-C-02)', () => {
  it('permite o caminho normal de solo', () => {
    expect(canTransition(PLAYER_TRANSITIONS, 'idle', 'run')).toBe(true);
    expect(canTransition(PLAYER_TRANSITIONS, 'run', 'air')).toBe(true);
    expect(canTransition(PLAYER_TRANSITIONS, 'air', 'idle')).toBe(true);
  });

  it('permite atacar no ar e pousar correndo', () => {
    expect(canTransition(PLAYER_TRANSITIONS, 'air', 'attack')).toBe(true);
    expect(canTransition(PLAYER_TRANSITIONS, 'air', 'run')).toBe(true);
  });

  it('proíbe ações a partir de dead — só o respawn explícito', () => {
    expect(canTransition(PLAYER_TRANSITIONS, 'dead', 'attack')).toBe(false);
    expect(canTransition(PLAYER_TRANSITIONS, 'dead', 'run')).toBe(false);
    expect(canTransition(PLAYER_TRANSITIONS, 'dead', 'idle')).toBe(true);
  });

  it('proíbe sair de hurt para ataque', () => {
    expect(canTransition(PLAYER_TRANSITIONS, 'hurt', 'attack')).toBe(false);
    expect(canTransition(PLAYER_TRANSITIONS, 'hurt', 'dead')).toBe(true);
  });

  it('toda transição declarada aponta para um estado existente', () => {
    const states = Object.keys(PLAYER_TRANSITIONS);
    for (const from of states) {
      for (const to of PLAYER_TRANSITIONS[from]) expect(states).toContain(to);
    }
  });
});
