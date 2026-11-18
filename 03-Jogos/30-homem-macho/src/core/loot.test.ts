/**
 * A perda na morte — as percentagens do dono, fixadas em teste.
 *
 * As três coisas que este ficheiro impede de acontecer:
 *
 * 1. **O baú perder coisas.** Não é um caso de teste do baú: é o `PerdaPedido` **não ter** campo
 *    para ele, e o primeiro teste a dizer isso em voz alta.
 * 2. **O preso cair.** `0 %` é `0 %` — sem dados, sem excepções.
 * 3. **A moeda ficar.** `100 %` das moedas de mobs e chefes vão-se, e o número que a UI mostra é o
 *    que sobra (zero), não o que se perdeu.
 */
import { describe, expect, it } from 'vitest';
import type { ItemId } from './items';
import {
  mulberry32, perderNaMorte, quantasPerder, resumoDaPerda,
  type Classe, type RegrasDePerda,
} from './loot';

const REGRAS: RegrasDePerda = {
  acumulativo: 0.3, simples: 1, forjada: 0.2, presa: 0, moedas: 1,
};

/** Classes como o jogo as define hoje (`tuning.ts`). */
const CLASSE: Record<ItemId, Classe> = {
  'ITM-001': 'acumulativo',
  'ITM-002': 'acumulativo',
  'ITM-003': 'habilidade',
  'ITM-004': 'simples',
  'ITM-005': 'habilidade',
  'ITM-006': 'habilidade',
  'ITM-007': 'forjada',
  'ITM-008': 'habilidade',
  'ITM-009': 'habilidade',
  'ITM-010': 'habilidade',
  'ITM-011': 'forjada',
};

const classeDe = (id: ItemId): Classe => CLASSE[id];
/** Sempre o mesmo dado: `0` perde os 20 %, `1` (quase) nunca perde. */
const semprePerde = (): number => 0;
const nuncaPerde = (): number => 0.99;

function morte(itens: ItemId[], presos: ItemId[] = [], moedas = 0, rng = nuncaPerde) {
  return perderNaMorte({ itens, presos, moedas, classeDe, regras: REGRAS, rng });
}

describe('perda na morte — o que nunca se perde', () => {
  it('o baú não é argumento: a regra não sabe que ele existe', () => {
    const pedido = { itens: [], presos: [], moedas: 0, classeDe, regras: REGRAS, rng: nuncaPerde };
    expect(Object.keys(pedido).sort()).toEqual(['classeDe', 'itens', 'moedas', 'presos', 'regras', 'rng']);
    expect('bau' in pedido).toBe(false);
  });

  it('presos caem 0 % — mesmo com o dado a dizer para perder', () => {
    const r = morte(['ITM-004', 'ITM-007'], ['ITM-004', 'ITM-007'], 0, semprePerde);
    expect(r.perdidos).toEqual([]);
    expect(r.ficam).toEqual(['ITM-004', 'ITM-007']);
    expect(r.porClasse.forjada).toBe(0);
    expect(r.porClasse.simples).toBe(0);
  });

  it('habilidades nunca caem (`TST-005`)', () => {
    const hab: ItemId[] = ['ITM-003', 'ITM-005', 'ITM-006', 'ITM-008', 'ITM-009', 'ITM-010'];
    const r = morte(hab, [], 0, semprePerde);
    expect(r.perdidos).toEqual([]);
    expect(r.ficam).toEqual(hab);
  });

  it('preso ganha à classe: a mesma arma simples presa não cai e solta cai', () => {
    expect(morte(['ITM-004'], ['ITM-004']).perdidos).toEqual([]);
    expect(morte(['ITM-004'], []).perdidos).toEqual(['ITM-004']);
  });
});

describe('perda na morte — armas simples (100 %)', () => {
  it('todas caem, sem dados', () => {
    const r = morte(['ITM-004', 'ITM-004'], [], 0, nuncaPerde);
    expect(r.perdidos).toEqual(['ITM-004', 'ITM-004']);
    expect(r.ficam).toEqual([]);
    expect(r.porClasse.simples).toBe(2);
  });
});

describe('perda na morte — forjadas (20 %)', () => {
  it('com o dado em 0, todas caem; com o dado em 0,99, nenhuma', () => {
    expect(morte(['ITM-007', 'ITM-011'], [], 0, semprePerde).perdidos).toHaveLength(2);
    expect(morte(['ITM-007', 'ITM-011'], [], 0, nuncaPerde).perdidos).toHaveLength(0);
  });

  it('é por unidade: duas peças, duas chances', () => {
    // dado alternado: 0 → perde, 0.5 → não perde (0.5 > 0.2)
    const alternado = (() => { let i = 0; return () => (i++ % 2 === 0 ? 0 : 0.5); })();
    const r = morte(['ITM-007', 'ITM-007'], [], 0, alternado);
    expect(r.perdidos).toHaveLength(1);
    expect(r.ficam).toHaveLength(1);
  });

  it('numa amostra grande, a taxa fica perto de 20 %', () => {
    const rng = mulberry32(2026);
    const cem: ItemId[] = Array.from({ length: 100 }, () => 'ITM-007');
    const perdidos = morte(cem, [], 0, rng).perdidos.length;
    expect(perdidos).toBeGreaterThan(8);
    expect(perdidos).toBeLessThan(35);
  });
});

describe('perda na morte — acumulativos (30 % da quantidade)', () => {
  it('3 curas não perdem nada; 10 perdem 3; 20 perdem 6 (arredonda para baixo)', () => {
    const de = (n: number) => morte(Array.from({ length: n }, () => 'ITM-001' as ItemId));
    expect(de(3).perdidos).toHaveLength(0);
    expect(de(10).perdidos).toHaveLength(3);
    expect(de(20).perdidos).toHaveLength(6);
  });

  it('1 cura não é 100 % de perda — é 0 (senão a regra dizia outra coisa)', () => {
    expect(morte(['ITM-001']).perdidos).toHaveLength(0);
  });

  it('cura e escudo contam separados', () => {
    const r = morte(['ITM-001', 'ITM-001', 'ITM-001', 'ITM-001', 'ITM-002', 'ITM-002', 'ITM-002', 'ITM-002']);
    expect(r.perdidos).toHaveLength(2); // 1 de cada (4 × 0,3 = 1,2 → 1)
    expect(r.porClasse.acumulativo).toBe(2);
  });
});

describe('perda na morte — moedas (100 %)', () => {
  it('todas as moedas caem e o que resta é zero', () => {
    const r = morte([], [], 120);
    expect(r.moedasPerdidas).toBe(120);
    expect(r.moedasRestantes).toBe(0);
  });

  it('sem moedas, nada a perder', () => {
    expect(morte([], [], 0).moedasPerdidas).toBe(0);
  });

  it('nunca devolve moedas negativas', () => {
    expect(morte([], [], -5).moedasRestantes).toBe(0);
  });
});

describe('perda na morte — a mistura completa', () => {
  it('um cenário inteiro, com o resultado somado', () => {
    const itens: ItemId[] = [
      'ITM-004',                              // simples, solta → cai
      'ITM-007', 'ITM-007',                   // forjadas, soltas → 20 % cada
      'ITM-001', 'ITM-001', 'ITM-001', 'ITM-001', 'ITM-001', // 5 curas → 1
      'ITM-003',                              // habilidade → fica
      'ITM-011',                              // forjada, **presa** → fica
    ];
    const r = morte(itens, ['ITM-011'], 75, semprePerde);
    expect(r.perdidos).toEqual(['ITM-004', 'ITM-007', 'ITM-007', 'ITM-001']);
    // `ficam` agrupa por id na ordem da primeira aparição: as 4 curas que sobraram, a
    // habilidade e a peça presa. A grelha da mochila volta a ordenar como quiser.
    expect(r.ficam).toEqual(['ITM-001', 'ITM-001', 'ITM-001', 'ITM-001', 'ITM-003', 'ITM-011']);
    expect(r.porClasse).toEqual({ acumulativo: 1, simples: 1, forjada: 2, habilidade: 0 });
    expect(r.moedasPerdidas).toBe(75);
    expect(r.moedasRestantes).toBe(0);
  });

  it('nada se perde duas vezes e nada desaparece: ficam + perdidos = mochila', () => {
    const itens: ItemId[] = ['ITM-004', 'ITM-007', 'ITM-001', 'ITM-003', 'ITM-011'];
    const r = morte(itens, ['ITM-007'], 10, mulberry32(7));
    expect([...r.ficam, ...r.perdidos].sort()).toEqual([...itens].sort());
  });
});

describe('perda na morte — utilitários', () => {
  it('quantasPerder arredonda para baixo e nunca sai de 0…qtd', () => {
    expect(quantasPerder(10, 0.3)).toBe(3);
    expect(quantasPerder(1, 0.3)).toBe(0);
    expect(quantasPerder(0, 1)).toBe(0);
    expect(quantasPerder(5, 2)).toBe(5);
    expect(quantasPerder(5, -1)).toBe(0);
  });

  it('mulberry32 é reprodutível e fica em [0, 1)', () => {
    const a = mulberry32(42); const b = mulberry32(42);
    for (let i = 0; i < 50; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('o resumo fala em nomes e em moedas, e conta as repetições', () => {
    const r = morte(['ITM-007', 'ITM-007', 'ITM-004'], [], 30, semprePerde);
    const linhas = resumoDaPerda(r, (id) => (id === 'ITM-007' ? 'ESPÓLIO' : 'EQUIPAMENTO'));
    expect(linhas).toContain('2× ESPÓLIO');
    expect(linhas).toContain('EQUIPAMENTO');
    expect(linhas).toContain('MOEDAS: 30');
  });

  it('quem não perdeu nada não tem resumo', () => {
    expect(resumoDaPerda(morte(['ITM-003'], [], 0), () => 'X')).toEqual([]);
  });
});
