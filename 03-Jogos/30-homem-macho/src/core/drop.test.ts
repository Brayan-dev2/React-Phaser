/**
 * `DEC-042` — o **drop raro de chefe** (`core/drop.ts`).
 *
 * O que estes casos prendem, por ordem de importância:
 *
 * 1. **a garantia entrega mesmo** — ao 12.º chefe sem drop, o item cai, com qualquer `rng`;
 * 2. **o contador não estoura** — nunca passa da garantia, e volta a zero quando cai;
 * 3. **um `rng` partido não dá drop** — um número inválido não pode transformar-se em prémio;
 * 4. **só cai o que falta** — um item já conquistado não volta a cair (não há duplicados raros).
 *
 * A chance (8 %) e a garantia (12) não se testam aqui: são dado do jogo, verificadas em
 * `game/data/tuning.test.ts`. Aqui testa-se a **regra**.
 */
import { describe, expect, it } from 'vitest';
import { chanceAcumulada, deveGarantir, sortearDrop, type RegraDeDrop } from './drop';
import type { ItemId } from './items';

const REGRA: RegraDeDrop = { chance: 0.08, garantia: 12 };
const FALTAM: readonly ItemId[] = ['ITM-008', 'ITM-009', 'ITM-010'];

/** Sempre 0 → o primeiro número é sempre `sortudo` o suficiente. */
const zero = (): number => 0;
/** Sempre 0.99 → nunca cai por sorte. */
const azar = (): number => 0.99;

describe('drop — a sorte', () => {
  it('com sorte, cai um dos que faltam e o contador volta a zero', () => {
    const r = sortearDrop({ faltam: FALTAM, tentativas: 5, regra: REGRA, rng: zero });
    expect(r.motivo).toBe('sorte');
    expect(FALTAM).toContain(r.item);
    expect(r.tentativas).toBe(0);
  });

  it('sem sorte, não cai nada e o contador sobe um', () => {
    const r = sortearDrop({ faltam: FALTAM, tentativas: 5, regra: REGRA, rng: azar });
    expect(r.item).toBeNull();
    expect(r.motivo).toBe('nenhum');
    expect(r.tentativas).toBe(6);
  });

  it('o número seguinte decide qual dos que faltam cai — e o último é alcançável', () => {
    const escolhe = (n: number): ItemId | null =>
      sortearDrop({ faltam: FALTAM, tentativas: 0, regra: REGRA, rng: zero, rng2: () => n }).item;
    expect(escolhe(0)).toBe('ITM-008');
    expect(escolhe(0.34)).toBe('ITM-009');
    // 0,9999 não pode dar `undefined`: o índice é preso ao último item
    expect(escolhe(0.9999)).toBe('ITM-010');
  });

  it('a fronteira da chance é estrita: 0,08 exacto não cai (o `<` é de propósito)', () => {
    expect(sortearDrop({ faltam: FALTAM, tentativas: 0, regra: REGRA, rng: () => 0.08 }).item).toBeNull();
    expect(sortearDrop({ faltam: FALTAM, tentativas: 0, regra: REGRA, rng: () => 0.0799 }).item).not.toBeNull();
  });
});

describe('drop — a garantia', () => {
  it('ao 12.º chefe sem drop, o item cai mesmo com a pior sorte', () => {
    // 11 chefes antes deste, todos sem drop
    const r = sortearDrop({ faltam: FALTAM, tentativas: 11, regra: REGRA, rng: azar });
    expect(r.motivo).toBe('garantia');
    expect(FALTAM).toContain(r.item);
    expect(r.tentativas).toBe(0);
  });

  it('antes do 12.º, o contador ainda deixa o azar continuar', () => {
    expect(sortearDrop({ faltam: FALTAM, tentativas: 10, regra: REGRA, rng: azar }).motivo).toBe('nenhum');
    expect(deveGarantir(10, REGRA)).toBe(false);
    expect(deveGarantir(11, REGRA)).toBe(true);
  });

  it('doze chefes seguidos com 8 % nunca deixam o jogador sem o item', () => {
    let tentativas = 0;
    let caiu: ItemId | null = null;
    for (let chefe = 1; chefe <= 12 && caiu === null; chefe += 1) {
      const r = sortearDrop({ faltam: FALTAM, tentativas, regra: REGRA, rng: azar });
      tentativas = r.tentativas;
      caiu = r.item;
    }
    expect(caiu).not.toBeNull();
    expect(tentativas).toBe(0);
  });

  it('o contador nunca passa da garantia, por muito torto que venha do save', () => {
    const r = sortearDrop({ faltam: FALTAM, tentativas: 99, regra: REGRA, rng: azar });
    expect(r.motivo).toBe('garantia'); // um contador absurdo obriga, não bloqueia
    expect(r.tentativas).toBe(0);
    expect(sortearDrop({ faltam: FALTAM, tentativas: Number.NaN, regra: REGRA, rng: azar }).tentativas).toBe(1);
    expect(sortearDrop({ faltam: FALTAM, tentativas: -3, regra: REGRA, rng: azar }).tentativas).toBe(1);
  });

  it('uma garantia torta na tabela vale 1: cai logo, em vez de nunca cair', () => {
    const quebrada: RegraDeDrop = { chance: 0.08, garantia: Number.NaN };
    expect(sortearDrop({ faltam: FALTAM, tentativas: 0, regra: quebrada, rng: azar }).motivo).toBe('garantia');
  });
});

describe('drop — não há drop para quem já tem tudo', () => {
  it('sem nada a faltar, o resultado é `nenhum` — e o contador não inventa prémio', () => {
    const r = sortearDrop({ faltam: [], tentativas: 4, regra: REGRA, rng: zero });
    expect(r.item).toBeNull();
    expect(r.motivo).toBe('nenhum');
    expect(r.tentativas).toBe(4);
  });

  it('um item já conquistado não volta a cair: só se sorteia entre os que faltam', () => {
    for (const n of [0, 0.5, 0.9999]) {
      const r = sortearDrop({ faltam: ['ITM-010'], tentativas: 0, regra: REGRA, rng: zero, rng2: () => n });
      expect(r.item).toBe('ITM-010');
    }
  });
});

describe('drop — um `rng` partido não dá prémio', () => {
  it('`NaN` e `Infinity` falham na sorte e no sorteio do item', () => {
    for (const mau of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const r = sortearDrop({ faltam: FALTAM, tentativas: 0, regra: REGRA, rng: () => mau });
      expect(r.item, String(mau)).toBeNull();
      const g = sortearDrop({ faltam: FALTAM, tentativas: 11, regra: REGRA, rng: azar, rng2: () => mau });
      expect(FALTAM, String(mau)).toContain(g.item); // na garantia, um número torto cai no último
    }
  });

  it('números fora de `[0, 1)` são presos, não propagados', () => {
    expect(sortearDrop({ faltam: FALTAM, tentativas: 0, regra: REGRA, rng: () => -5 }).item).not.toBeNull();
    expect(sortearDrop({ faltam: FALTAM, tentativas: 0, regra: REGRA, rng: () => 7 }).item).toBeNull();
  });

  it('uma chance torta na tabela vale 0 — o defeito nunca dá drop de graça', () => {
    const r = sortearDrop({ faltam: FALTAM, tentativas: 0, regra: { chance: Number.NaN, garantia: 12 }, rng: zero });
    expect(r.item).toBeNull();
  });
});

describe('drop — a probabilidade que se documenta', () => {
  it('8 % ao 8.º chefe, 100 % ao 12.º', () => {
    expect(chanceAcumulada(0, REGRA)).toBe(0);
    expect(chanceAcumulada(8, REGRA)).toBeCloseTo(1 - Math.pow(0.92, 8), 10);
    expect(chanceAcumulada(8, REGRA)).toBeGreaterThan(0.48);
    expect(chanceAcumulada(8, REGRA)).toBeLessThan(0.50);
    expect(chanceAcumulada(12, REGRA)).toBe(1);
    expect(chanceAcumulada(40, REGRA)).toBe(1); // não cresce para lá de 1
  });

  it('a média de chefes até cair é bem menor que a garantia', () => {
    // E[chefes] com 8 % e tecto em 12: ~7 — a garantia é rede, não o caminho normal
    let esperado = 0;
    for (let n = 1; n <= 12; n += 1) {
      esperado += n * (chanceAcumulada(n, REGRA) - chanceAcumulada(n - 1, REGRA));
    }
    expect(esperado).toBeLessThan(9);
  });
});
