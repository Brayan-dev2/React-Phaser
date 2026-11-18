/** Tipos puros — nenhum import de phaser/react/dom (PAT-C-00, ADR-01). */

export type Difficulty = 'easy' | 'medium' | 'hard';

export type PlayerState = 'idle' | 'run' | 'air' | 'attack' | 'shoot' | 'hurt' | 'dead';

export interface Resources {
  hp: number;
  shield: number;
  power: number;
}

export interface Vec2 { x: number; y: number }

/** Resultado de dano já resolvido (escudo antes da vida) — MEC-003. */
export interface DamageResult extends Resources {
  absorbed: number;
  lost: number;
  died: boolean;
}
