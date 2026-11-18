/**
 * `MEC-004` — a bolsa da morte.
 *
 * O que estes casos impedem:
 *
 * 1. **Duas bolsas no mundo.** Só há uma; a morte seguinte destrói a anterior, com itens e moedas.
 * 2. **O item que some por falta de espaço.** Recolher com a mochila cheia deixa o resto na bolsa.
 * 3. **A bolsa vazia no chão** (um objeto que não faz nada) e a bolsa meio inválida vinda do save.
 */
import { describe, expect, it } from 'vitest';
import { ehItemId, type ItemId } from './items';
import {
  criarBolsa, naSala, normalizarBolsaDaMorte, recolher, rotuloDaBolsa, substituir,
  type BolsaDaMorte, type Local,
} from './deathbag';

const LOCAL: Local = { areaId: 'LVL-01', roomIndex: 3, sala: 'L01-04', x: 320, y: 380 };
const OUTRO: Local = { areaId: 'LVL-01', roomIndex: 4, sala: 'L01-05', x: 160, y: 380 };
const ids = (...xs: ItemId[]): ItemId[] => xs;

function bolsa(itens: ItemId[], moedas = 0, local = LOCAL): BolsaDaMorte {
  const b = criarBolsa(itens, moedas, local);
  if (!b) throw new Error('esperava uma bolsa');
  return b;
}

describe('bolsa — criar', () => {
  it('guarda tudo o que se perdeu, itens e moedas', () => {
    const b = bolsa(ids('ITM-004', 'ITM-001'), 10);
    expect(b.itens).toEqual(['ITM-004', 'ITM-001']);
    expect(b.moedas).toBe(10);
    expect(b.local.sala).toBe('L01-04');
  });

  it('sem perdas não há bolsa (um objeto vazio no chão não é informação)', () => {
    expect(criarBolsa([], 0, LOCAL)).toBeNull();
  });

  it('só moedas também é bolsa', () => {
    expect(criarBolsa([], 25, LOCAL)?.moedas).toBe(25);
  });

  it('moedas negativas não existem', () => {
    expect(criarBolsa(['ITM-004'], -5, LOCAL)?.moedas).toBe(0);
  });
});

describe('bolsa — uma só no mundo (`TST-004`)', () => {
  it('a morte seguinte destrói a anterior e devolve as duas coisas', () => {
    const anterior = bolsa(['ITM-007'], 30);
    const nova = bolsa(['ITM-004'], 5, OUTRO);
    const r = substituir(anterior, nova);
    expect(r.destruida).toBe(anterior);
    expect(r.atual).toBe(nova);
  });

  it('morrer sem perder nada ainda destrói a bolsa anterior (a regra não é sobre a nova perda)', () => {
    const anterior = bolsa(['ITM-007'], 30);
    const r = substituir(anterior, null);
    expect(r.destruida).toBe(anterior);
    expect(r.atual).toBeNull();
  });

  it('sem bolsa anterior, a nova entra limpa', () => {
    const nova = bolsa(['ITM-004']);
    expect(substituir(null, nova)).toEqual({ destruida: null, atual: nova });
  });
});

describe('bolsa — recolher', () => {
  it('devolve itens e moedas e a bolsa deixa de existir', () => {
    const r = recolher(bolsa(['ITM-004', 'ITM-001'], 40), 40);
    expect(r.itens).toEqual(['ITM-004', 'ITM-001']);
    expect(r.moedas).toBe(40);
    expect(r.sobra).toBeNull();
    expect(r.mochilaCheia).toBe(false);
  });

  it('com a mochila cheia, as moedas entram e o resto fica na bolsa', () => {
    const r = recolher(bolsa(['ITM-004', 'ITM-001', 'ITM-007'], 15), 1);
    expect(r.itens).toEqual(['ITM-004']);
    expect(r.moedas).toBe(15);
    expect(r.sobra?.itens).toEqual(['ITM-001', 'ITM-007']);
    expect(r.mochilaCheia).toBe(true);
  });

  it('a bolsa que sobra guarda o mesmo local (não salta de sala)', () => {
    const b = bolsa(['ITM-004', 'ITM-001'], 0, OUTRO);
    expect(recolher(b, 0).sobra?.local).toEqual(OUTRO);
  });

  it('com espaço zero e só moedas, recolhe as moedas e a bolsa desaparece', () => {
    const r = recolher(bolsa([], 12), 0);
    expect(r.moedas).toBe(12);
    expect(r.sobra).toBeNull();
  });
});

describe('bolsa — onde está', () => {
  it('é na mesma sala só se área e índice coincidirem', () => {
    const b = bolsa(['ITM-004']);
    expect(naSala(b, 'LVL-01', 3)).toBe(true);
    expect(naSala(b, 'LVL-01', 4)).toBe(false);
    expect(naSala(b, 'LVL-02', 3)).toBe(false);
    expect(naSala(null, 'LVL-01', 3)).toBe(false);
  });
});

describe('bolsa — a fronteira do save', () => {
  it('uma bolsa válida passa', () => {
    const b = bolsa(['ITM-004'], 10);
    const volta = normalizarBolsaDaMorte(JSON.parse(JSON.stringify(b)), ehItemId, 40);
    expect(volta).toEqual(b);
  });

  it('ids inventados e lixo caem; números inválidos viram um local seguro', () => {
    const bruto = {
      itens: ['ITM-004', 'ITM-999', 7, null],
      moedas: 'muitas',
      local: { areaId: 5, roomIndex: 'três', sala: null, x: Number.NaN, y: Infinity },
    };
    const b = normalizarBolsaDaMorte(bruto, ehItemId, 40);
    expect(b?.itens).toEqual(['ITM-004']);
    expect(b?.moedas).toBe(0);
    expect(b?.local).toEqual({ areaId: 'LVL-01', roomIndex: 0, sala: 'L01-01', x: 96, y: 380 });
  });

  it('sem itens nem moedas não há bolsa; sem local também não', () => {
    expect(normalizarBolsaDaMorte({ itens: [], moedas: 0, local: LOCAL }, ehItemId, 40)).toBeNull();
    expect(normalizarBolsaDaMorte({ itens: ['ITM-004'] }, ehItemId, 40)).toBeNull();
    for (const lixo of [null, undefined, 'bolsa', 3]) {
      expect(normalizarBolsaDaMorte(lixo, ehItemId, 40)).toBeNull();
    }
  });

  it('a lista é cortada no limite da mochila', () => {
    const muitas: string[] = Array.from({ length: 200 }, () => 'ITM-004');
    expect(normalizarBolsaDaMorte({ itens: muitas, moedas: 0, local: LOCAL }, ehItemId, 40)?.itens)
      .toHaveLength(40);
  });
});

describe('bolsa — o rótulo do HUD', () => {
  it('diz a sala, os itens e as moedas', () => {
    expect(rotuloDaBolsa(bolsa(['ITM-004', 'ITM-001'], 10))).toBe('BOLSA · L01-04 · 2 ITENS · 10 MOEDAS');
  });

  it('não escreve o que não existe (singular incluído)', () => {
    expect(rotuloDaBolsa(bolsa(['ITM-001']))).toBe('BOLSA · L01-04 · 1 ITEM');
    expect(rotuloDaBolsa(bolsa([], 1))).toBe('BOLSA · L01-04 · 1 MOEDA');
  });
});
