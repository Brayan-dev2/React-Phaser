/** Regras puras de dano — MEC-003 (escudo antes da vida) e MEC-008 (dificuldade). */
import type { DamageResult, Difficulty, Resources } from './types';

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 0.75,   // 02-gameplay §2.9
  medium: 1,
  hard: 1.25,
};

/**
 * Ordem canônica: multiplicador de dificuldade → escudo → vida.
 * (`P-23` registra que o multiplicador incide sobre o dano total, antes do escudo.)
 */
export function applyDamage(res: Resources, rawDamage: number, difficulty: Difficulty): DamageResult {
  const incoming = Math.round(rawDamage * DIFFICULTY_MULTIPLIER[difficulty]);
  const absorbed = Math.min(res.shield, incoming);
  const lost = Math.min(res.hp, incoming - absorbed);
  const hp = res.hp - lost;
  return {
    hp,
    shield: res.shield - absorbed,
    power: res.power,
    absorbed,
    lost,
    died: hp <= 0,
  };
}

export function isDead(res: Resources): boolean {
  return res.hp <= 0;
}
