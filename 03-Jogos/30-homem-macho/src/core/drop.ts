/**
 * `DEC-042` — **o drop raro de chefe**: as habilidades mais raras não estão em pedestais, caem.
 *
 * A regra é uma só e tem três peças: uma **chance** por chefe derrotado, um **contador de tentativas**
 * e uma **garantia**. As três juntas resolvem a única coisa que uma probabilidade sozinha não resolve:
 * um jogo que pode ficar **impossível de terminar**.
 *
 * Porque é que a garantia existe (e não é uma suavização cosmética): `HAB-03` (garra) é exigida pelo
 * poço de LVL-10 e `HAB-07` (estandarte) é exigida **dentro** de `CEN-096` em LVL-13. Com 8 % puro,
 * um jogador azarado chega a LVL-13 sem estandarte e não tem para onde ir — o save dele acabou. A
 * garantia ao **12.º chefe** mantém o drop raro (a esperança é de ~8 % por kill, e a maioria dos
 * jogadores apanha-o muito antes) sem nunca deixar o jogo sem saída.
 *
 * O que este ficheiro **não** decide: a chance, a garantia e quais são os itens. Isso é dado do jogo
 * (`DROPS_RAROS` em `game/data/tuning.ts`), porque é o que o proprietário vai balancear.
 */
import type { ItemId } from './items';

export interface RegraDeDrop {
  /** `0..1` por chefe derrotado. */
  readonly chance: number;
  /** Ao fim de quantos chefes **sem** drop o próximo entrega garantido. */
  readonly garantia: number;
}

export interface PedidoDeDrop {
  /** Os itens raros que o jogador **ainda não tem** — é entre eles que se sorteia. */
  readonly faltam: readonly ItemId[];
  /** Chefes derrotados desde o último drop (vem do save). */
  readonly tentativas: number;
  readonly regra: RegraDeDrop;
  /** `[0, 1)`. Injetado: a cena usa um gerador semeado, o teste usa um fixo. */
  readonly rng: () => number;
  /** `[0, 1)` para escolher **qual** dos que faltam. O mesmo `rng` serviria; separado é testável. */
  readonly rng2?: () => number;
}

export type MotivoDrop = 'sorte' | 'garantia' | 'nenhum';

export interface ResultadoDrop {
  /** O item que caiu, ou `null`. */
  readonly item: ItemId | null;
  readonly motivo: MotivoDrop;
  /** Tentativas **depois** desta morte: `0` quando caiu, `n + 1` quando não. */
  readonly tentativas: number;
}

/** Um número finito em `[0, 1)`. Um `rng` que devolva lixo não pode dar drop garantido por engano. */
function sorte(rng: () => number): number {
  const n = rng();
  if (!Number.isFinite(n)) return 1; // 1 nunca é < chance: falha em vez de dar
  return Math.min(0.999999, Math.max(0, n));
}

/** `true` quando o contador de tentativas já obriga ao drop. */
export function deveGarantir(tentativas: number, regra: RegraDeDrop): boolean {
  const n = Number.isFinite(tentativas) ? Math.max(0, Math.floor(tentativas)) : 0;
  const g = Number.isFinite(regra.garantia) ? Math.max(1, Math.floor(regra.garantia)) : 1;
  return n + 1 >= g;
}

/**
 * Sorteia o drop de **um** chefe derrotado.
 *
 * - sem nada a faltar → `nenhum`, e o contador sobe na mesma (não há razão para o guardar);
 * - contador chegou à garantia → cai **um** dos que faltam, à sorte;
 * - senão → `chance` de cair; se cair, também é sorteado qual.
 *
 * O contador **nunca** sobe acima da garantia: um número que só cresce é um número que estoura.
 */
export function sortearDrop(pedido: PedidoDeDrop): ResultadoDrop {
  const tentativas = Number.isFinite(pedido.tentativas) ? Math.max(0, Math.floor(pedido.tentativas)) : 0;
  const faltam = pedido.faltam;
  if (faltam.length === 0) {
    return { item: null, motivo: 'nenhum', tentativas: Math.min(tentativas, pedido.regra.garantia) };
  }
  const escolher = (): ItemId => {
    const r = sorte(pedido.rng2 ?? pedido.rng);
    const i = Math.min(faltam.length - 1, Math.floor(r * faltam.length));
    return faltam[i];
  };
  if (deveGarantir(tentativas, pedido.regra)) {
    return { item: escolher(), motivo: 'garantia', tentativas: 0 };
  }
  const chance = Number.isFinite(pedido.regra.chance) ? pedido.regra.chance : 0;
  if (sorte(pedido.rng) < chance) {
    return { item: escolher(), motivo: 'sorte', tentativas: 0 };
  }
  return { item: null, motivo: 'nenhum', tentativas: tentativas + 1 };
}

/**
 * Probabilidade de já ter caído ao fim de `n` chefes, com a garantia pelo meio. Serve ao documento e
 * ao teste — não é usada em jogo. Ex.: 8 % e 12 tentativas → 63 % ao 8.º, 100 % ao 12.º.
 */
export function chanceAcumulada(n: number, regra: RegraDeDrop): number {
  const chance = Number.isFinite(regra.chance) ? Math.min(1, Math.max(0, regra.chance)) : 0;
  const garantia = Number.isFinite(regra.garantia) ? Math.max(1, Math.floor(regra.garantia)) : 1;
  const k = Math.max(0, Math.min(garantia, Math.floor(n)));
  if (k >= garantia) return 1;
  return 1 - Math.pow(1 - chance, k);
}
