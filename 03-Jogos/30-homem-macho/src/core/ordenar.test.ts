/**
 * `UI-07` — a **ordem** da mochila e do baú (`DEC-040`).
 *
 * O que estes casos protegem não é o `sort`: é a promessa de que **ordenar não muda o que o
 * jogador tem**. Por isso todos os casos verificam duas coisas — a ordem nova e a lista original
 * intacta (mesmos elementos, mesma ordem guardada).
 */
import { describe, expect, it } from 'vitest';
import {
  ORDENS, ROTULO_ORDEM, contar, descreverFicha, ordenar, quantidadeDe, type Ficha,
} from './ordenar';
import type { ItemId } from './items';

const FICHAS: Record<string, { nome: string; tipo: string; valor: number; raridade: number }> = {
  'A': { nome: 'CURA', tipo: 'consumivel', valor: 5, raridade: 0 },
  'B': { nome: 'ESPÓLIO DO ALFERES', tipo: 'arma', valor: 40, raridade: 1 },
  'C': { nome: 'EQUIPAMENTO DE TESTE', tipo: 'arma', valor: 12, raridade: 0 },
  'D': { nome: 'PEÇA DO FORJADOR', tipo: 'arma', valor: 60, raridade: 2 },
  'E': { nome: 'SALTO DUPLO', tipo: 'habilidade', valor: 0, raridade: 2 },
};

/**
 * Ids de teste: a ordenação não sabe o que é um item (recebe a ficha), por isso os casos usam
 * nomes curtos. O `ItemId` é um tipo fechado — o molde `id()` é o único sítio onde se mente ao
 * compilador, e é o que torna estes casos legíveis.
 */
const id = (curto: string): ItemId => curto as ItemId;

const ficha: Ficha = (i) => FICHAS[i];

const lista: readonly ItemId[] = ['A', 'C', 'B', 'E', 'D'].map(id);

describe('ordem — a lista de ordens', () => {
  it('são as seis do pedido, e a de fábrica é a de chegada', () => {
    expect([...ORDENS]).toEqual(['chegada', 'nome', 'tipo', 'quantidade', 'valor', 'raridade']);
  });

  it('todas têm rótulo curto em maiúsculas', () => {
    for (const o of ORDENS) {
      expect(ROTULO_ORDEM[o]).toBe(ROTULO_ORDEM[o].toUpperCase());
      expect(ROTULO_ORDEM[o].length).toBeLessThanOrEqual(8);
    }
  });
});

describe('ordem — cada critério', () => {
  it('`chegada` devolve a mesma ordem do save', () => {
    expect(ordenar(lista, 'chegada', ficha)).toEqual([...lista]);
  });

  it('`nome` é alfabética', () => {
    expect(ordenar(lista, 'nome', ficha)).toEqual(['A', 'C', 'B', 'D', 'E'].map(id));
  });

  it('`tipo` põe armas, depois consumíveis, depois habilidades (e o nome desempata)', () => {
    expect(ordenar(lista, 'tipo', ficha)).toEqual(['C', 'B', 'D', 'A', 'E'].map(id));
  });

  it('`quantidade` põe os que têm mais cópias à frente e junta os iguais', () => {
    const itens: readonly ItemId[] = ['B', 'A', 'A', 'B', 'A'].map(id);
    expect(ordenar(itens, 'quantidade', ficha)).toEqual(['A', 'A', 'A', 'B', 'B'].map(id));
  });

  it('`valor` desce do mais caro para o mais barato', () => {
    expect(ordenar(lista, 'valor', ficha)).toEqual(['D', 'B', 'C', 'A', 'E'].map(id));
  });

  it('`raridade` põe as lendárias à frente e as comuns no fim', () => {
    const ordem = ordenar(lista, 'raridade', ficha);
    expect(ordem.slice(-2)).toEqual(['A', 'C'].map(id));
    expect(ordem.slice(0, 2)).toEqual(['D', 'E'].map(id));
  });

  it('uma ordem já aplicada é estável — desenhar duas vezes não muda nada', () => {
    for (const o of ORDENS) {
      const uma = ordenar(lista, o, ficha);
      expect(ordenar(uma, o, ficha)).toEqual(uma);
    }
  });
});

describe('ordem — invariantes', () => {
  it('nunca muda a lista original nem perde elementos', () => {
    const original: readonly ItemId[] = ['A', 'C', 'B', 'E', 'D'].map(id);
    const copia = [...original];
    for (const o of ORDENS) {
      const saida = ordenar(original, o, ficha);
      expect(saida).toHaveLength(original.length);
      expect([...saida].sort()).toEqual([...original].sort());
    }
    expect(original).toEqual(copia);
  });

  it('uma lista vazia ordena para uma lista vazia, em qualquer ordem', () => {
    for (const o of ORDENS) expect(ordenar([], o, ficha)).toEqual([]);
  });

  it('um id desconhecido (save antigo) vai para o fim em vez de rebentar o painel', () => {
    const comLixo: readonly ItemId[] = ['A', 'ITM-999'].map(id);
    const quebrada: Ficha = (i) => {
      if (i === id('ITM-999')) throw new Error('id desconhecido');
      return ficha(i);
    };
    expect(() => ordenar(comLixo, 'nome', quebrada)).not.toThrow();
    expect(ordenar(comLixo, 'nome', quebrada).at(-1)).toBe(id('ITM-999'));
  });
});

describe('contagem e descrição', () => {
  it('conta quantas cópias de cada id existem', () => {
    const m = contar(['A', 'B', 'A', 'A'].map(id));
    expect(m.get(id('A'))).toBe(3);
    expect(m.get(id('B'))).toBe(1);
    expect(m.get(id('C'))).toBeUndefined();
  });

  it('`quantidadeDe` é o número que o painel mostra em `×N`', () => {
    expect(quantidadeDe(['A', 'B', 'A'].map(id), id('A'))).toBe(2);
    expect(quantidadeDe(['A', 'B', 'A'].map(id), id('B'))).toBe(1);
    expect(quantidadeDe([], id('A'))).toBe(0);
  });

  it('a ficha é uma linha: tipo, valor e raridade', () => {
    expect(descreverFicha(FICHAS['C'])).toBe('ARMA · 12 MOEDAS · COMUM');
    expect(descreverFicha(FICHAS['D'])).toBe('ARMA · 60 MOEDAS · LENDÁRIA');
    expect(descreverFicha(FICHAS['E'])).toBe('HABILIDADE · NÃO SE VENDE · LENDÁRIA');
  });
});
