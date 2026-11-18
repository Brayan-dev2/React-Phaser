/**
 * Itens de campo (`ITM-001`, `ITM-002`, `ITM-003`) — regra pura, sem motor (PAT-C-00).
 * Os números vêm de `game/data/tuning.ts` e são passados como `ItemEffect`: `core/`
 * não importa `game/`, então o teste roda sem Phaser.
 */

export type ItemId = 'ITM-001' | 'ITM-002' | 'ITM-003' | 'ITM-004' | 'ITM-005' | 'ITM-006'
  /** `P-47`: recompensa do chefe médio de LVL-08 — efeito ainda por canonizar. */
  | 'ITM-007'
  /** `P-51`: `HAB-04` gancho — entrega permanente de LVL-09. */
  | 'ITM-008'
  /** `P-53`: `HAB-03` garra — permanente, é a única forma de usar o alçapão de LVL-10. */
  | 'ITM-009'
  /** `P-56`: `HAB-07` planar (estandarte rasgado) — permanente, atravessa os vãos de LVL-11. */
  | 'ITM-010'
  /** `P-61`: recompensa **condicional** do Forjador — só existe se `ENT-005` cair. */
  | 'ITM-011';

/**
 * Todos os ids, numa lista, para quem precisa de **validar** um id vindo de fora (o save, por
 * exemplo) sem importar `game/data/tuning` — `core/` não importa `game/`. A ordem é a do GDD.
 */
export const ITEM_IDS: readonly ItemId[] = [
  'ITM-001', 'ITM-002', 'ITM-003', 'ITM-004', 'ITM-005', 'ITM-006',
  'ITM-007', 'ITM-008', 'ITM-009', 'ITM-010', 'ITM-011',
];

/** `true` quando a string é um item que este build conhece. Fronteira de save, não regra de jogo. */
export function ehItemId(valor: unknown): valor is ItemId {
  return typeof valor === 'string' && (ITEM_IDS as readonly string[]).includes(valor);
}

/** Efeito já resolvido a partir do dado do GDD. */
export interface ItemEffect {
  readonly id: ItemId;
  readonly hp?: number;
  readonly shield?: number;
  /** `ITM-003` (salto duplo) não mexe em recurso: desbloqueia habilidade permanente. */
  readonly permanent?: boolean;
  /** `ITM-004` fica na bolsa ocupando slot (03-conteudo §3.3). */
  readonly slot?: boolean;
  /** Habilidade que o item entrega. Comparar por identidade, nunca por nome de tela. */
  readonly kind?: 'double-jump' | 'strength' | 'breath' | 'hook' | 'climb' | 'glide';
}

export interface ItemCaps {
  readonly hp: number;
  readonly shield: number;
}

export interface Resources {
  hp: number;
  shield: number;
}

export interface ItemOutcome<R extends Resources> {
  readonly resources: R;
  readonly unlockedDoubleJump: boolean;
  /** `ITM-005` (`HAB-05` Força) — também permanente, não cai na morte (§5.3). */
  readonly unlockedStrength: boolean;
  /** `ITM-006` (`HAB-06` Fôlego) — permanente; sem ela a galeria de L06-05 é intransponível. */
  readonly unlockedBreath: boolean;
  /** `ITM-008` (`HAB-04` Gancho) — permanente; é a trava do canal de L09-05. */
  readonly unlockedHook: boolean;
  /** `ITM-009` (`HAB-03` Garra) — permanente; a parede de ganchos e o alçapão. */
  readonly unlockedClimb: boolean;
  /** `ITM-010` (`HAB-07` Planar) — permanente; converte altura em distância (`P-56`). */
  readonly unlockedGlide: boolean;
  /** `true` quando o item passa a ocupar slot na bolsa (`ITM-004`). */
  readonly occupiesSlot: boolean;
  /** Quanto o item realmente entregou (0 quando já estava no teto). */
  readonly gained: number;
}

/**
 * Aplica o item. Nunca reduz recurso, nunca passa do teto, nunca mata.
 * `ITM-003` devolve os mesmos recursos e sinaliza a habilidade.
 */
export function applyItem<R extends Resources>(resources: R, effect: ItemEffect, caps: ItemCaps): ItemOutcome<R> {
  const wantHp = Math.min(caps.hp, resources.hp + Math.max(0, effect.hp ?? 0));
  const wantShield = Math.min(caps.shield, resources.shield + Math.max(0, effect.shield ?? 0));
  const hp = Math.max(resources.hp, wantHp);
  const shield = Math.max(resources.shield, wantShield);

  return {
    resources: { ...resources, hp, shield },
    unlockedDoubleJump: effect.kind === 'double-jump',
    unlockedStrength: effect.kind === 'strength',
    unlockedBreath: effect.kind === 'breath',
    unlockedHook: effect.kind === 'hook',
    unlockedClimb: effect.kind === 'climb',
    unlockedGlide: effect.kind === 'glide',
    occupiesSlot: effect.slot === true,
    gained: (hp - resources.hp) + (shield - resources.shield),
  };
}

/** `true` quando o item não tem mais nada a entregar (já no teto). */
export function isWasted(resources: Resources, effect: ItemEffect, caps: ItemCaps): boolean {
  if (effect.permanent || effect.slot) return false;
  const outcome = applyItem(resources, effect, caps);
  return outcome.gained === 0;
}
