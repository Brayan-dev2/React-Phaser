/**
 * `MEC-004` / `UI-07` — a mochila e os itens presos. Regra pura, sem motor (`PAT-C-00`):
 * as capacidades entram por parâmetro (`Capacidade`), porque `core/` não importa `game/`.
 *
 * Três coisas que este ficheiro garante, e que os testes fixam:
 *
 * 1. **Nada desaparece em silêncio.** Um item que não cabe é recusado (`cheia`) e o jogo
 *    deixa-o no chão (`03-conteudo` §3.3: "o drop permanece no chão e o jogador recebe aviso").
 * 2. **Prender é uma lista à parte, não uma marca no item.** O mesmo `ITM-004` pode estar na
 *    mochila uma vez e preso uma vez; presos e espaços contam-se em sítios diferentes porque
 *    são limites diferentes (40 e 20).
 * 3. **Só se prende o que se tem.** Presos são um subconjunto da mochila — soltar o item da
 *    mochila (vender, largar, perder) tem de o despregar também, e é isso que `largar` faz.
 */
import type { ItemEffect, ItemId } from './items';

export interface Capacidade {
  /** Espaços da mochila (`INVENTARIO.slots`). */
  readonly slots: number;
  /** Quantos podem estar presos (`INVENTARIO.presos`). */
  readonly presos: number;
}

export interface Bolsa {
  readonly itens: readonly ItemId[];
  readonly presos: readonly ItemId[];
}

export const BOLSA_VAZIA: Bolsa = { itens: [], presos: [] };

export type Motivo = 'sem-espaco' | 'sem-item' | 'limite-presos' | 'ja-preso' | 'nao-preso' | 'nao-prende';

export interface Resultado {
  readonly bolsa: Bolsa;
  /** `true` quando a operação mexeu na bolsa. `false` vem sempre com `motivo`. */
  readonly ok: boolean;
  readonly motivo?: Motivo;
}

/** Quantos espaços e quantos presos ainda cabem. */
export function ocupacao(bolsa: Bolsa, cap: Capacidade): {
  itens: number; presos: number; livres: number; livresPresos: number; cheia: boolean;
} {
  const itens = bolsa.itens.length;
  const presos = bolsa.presos.length;
  return {
    itens, presos,
    livres: Math.max(0, cap.slots - itens),
    livresPresos: Math.max(0, cap.presos - presos),
    cheia: itens >= cap.slots,
  };
}

/** `true` quando o item tem de ocupar espaço (`ITM-004`, `ITM-007`, `ITM-011`). */
export function ocupaEspaco(effect: ItemEffect): boolean {
  return effect.slot === true;
}

/**
 * Guarda o item. Só os itens com `slot` entram na mochila: habilidades e consumíveis não
 * ocupam espaço (`03-conteudo` §3.3, suposição) — devolvem a bolsa intacta e `ok: false`
 * com `nao-prende`, que é o "não é contigo" e **não** um erro de jogo.
 */
export function guardar(bolsa: Bolsa, id: ItemId, effect: ItemEffect, cap: Capacidade): Resultado {
  if (!ocupaEspaco(effect)) return { bolsa, ok: false, motivo: 'nao-prende' };
  // mesmo item outra vez: ocupa outro espaço (são drops, não uma pilha)
  if (bolsa.itens.length >= cap.slots) return { bolsa, ok: false, motivo: 'sem-espaco' };
  return { bolsa: { ...bolsa, itens: [...bolsa.itens, id] }, ok: true };
}

/** Fixa o item para ele não cair na morte (`MEC-004`). Precisa de estar na mochila. */
export function prender(bolsa: Bolsa, id: ItemId, cap: Capacidade): Resultado {
  if (!bolsa.itens.includes(id)) return { bolsa, ok: false, motivo: 'sem-item' };
  if (bolsa.presos.includes(id)) return { bolsa, ok: false, motivo: 'ja-preso' };
  if (bolsa.presos.length >= cap.presos) return { bolsa, ok: false, motivo: 'limite-presos' };
  return { bolsa: { ...bolsa, presos: [...bolsa.presos, id] }, ok: true };
}

/** Devolve o item a "solto" — passa a ir para a bolsa da morte. Idempotente na leitura. */
export function soltar(bolsa: Bolsa, id: ItemId): Resultado {
  if (!bolsa.presos.includes(id)) return { bolsa, ok: false, motivo: 'nao-preso' };
  return { bolsa: { ...bolsa, presos: bolsa.presos.filter((p) => p !== id) }, ok: true };
}

/**
 * Tira o item da mochila (largar, consumir, perder). **Desprende-o também** — um preso que já
 * não está na mochila seria um fantasma a contar para os 20 e a reaparecer na morte.
 */
export function largar(bolsa: Bolsa, id: ItemId): Resultado {
  const i = bolsa.itens.indexOf(id);
  if (i < 0) return { bolsa, ok: false, motivo: 'sem-item' };
  return {
    bolsa: {
      itens: bolsa.itens.filter((_, k) => k !== i),
      presos: bolsa.presos.filter((p) => p !== id),
    },
    ok: true,
  };
}

/**
 * `MEC-004` (`TST-004`) — a morte separa o que fica do que cai.
 *
 * - **preso** → fica (volta com o jogador);
 * - **solto** → vai para a bolsa da morte, que é do mundo e não desta função;
 * - devolve também a mochila que o jogador tem ao reaparecer: os presos, mais nada.
 *
 * Esta função **não** aplica a destruição da bolsa anterior nem o ponto onde ela cai; isso é
 * a etapa da bolsa da morte. Ela existe agora porque é a única forma de o "prender" ter
 * significado — e porque um teste consegue fixá-la hoje, antes do objeto no mundo existir.
 */
export function aoMorrer(bolsa: Bolsa): { fica: readonly ItemId[]; cai: readonly ItemId[] } {
  return {
    fica: bolsa.itens.filter((id) => bolsa.presos.includes(id)),
    cai: bolsa.itens.filter((id) => !bolsa.presos.includes(id)),
  };
}

/** Texto curto do motivo. A UI mostra isto; nunca um código. */
export const MOTIVO_TEXTO: Record<Motivo, string> = {
  'sem-espaco': 'A MOCHILA ESTÁ CHEIA.',
  'sem-item': 'ESSE ITEM NÃO ESTÁ NA MOCHILA.',
  'limite-presos': 'VINTE JÁ ESTÃO PRESOS.',
  'ja-preso': 'JÁ ESTÁ PRESO.',
  'nao-preso': 'NÃO ESTAVA PRESO.',
  'nao-prende': 'ESSE NÃO OCUPA ESPAÇO.',
};
