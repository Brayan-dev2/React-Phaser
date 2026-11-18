/** PAT-C-02 — máquina de estados finita (pura, testável). */
import type { PlayerState } from './types';

export interface Transitions<S extends string> {
  readonly [from: string]: readonly S[];
}

export const PLAYER_TRANSITIONS: Transitions<PlayerState> = {
  idle:   ['run', 'air', 'attack', 'shoot', 'hurt'],
  run:    ['idle', 'air', 'attack', 'shoot', 'hurt'],
  air:    ['idle', 'run', 'attack', 'shoot', 'hurt'],
  attack: ['idle', 'air', 'hurt'],
  shoot:  ['idle', 'air', 'hurt'],
  hurt:   ['idle', 'air', 'dead'],
  dead:   ['idle'], // apenas via respawn explícito
};

export function canTransition<S extends string>(map: Transitions<S>, from: S, to: S): boolean {
  return map[from]?.includes(to) ?? false;
}
