/**
 * `MEC-004` / `UI-07` — a mochila: 40 espaços, 20 presos, e o que a morte leva.
 * Regra pura; as capacidades entram como número (`INVENTARIO`), nunca do `game/`.
 */
import { describe, expect, it } from 'vitest';
import {
  BOLSA_VAZIA, MOTIVO_TEXTO, aoMorrer, guardar, largar, ocupacao, ocupaEspaco, prender, soltar,
} from './inventory';
import type { ItemEffect, ItemId } from './items';

const CAP = { slots: 40, presos: 20 };
const DROP: ItemEffect = { id: 'ITM-004', slot: true };
const ESPOLIO: ItemEffect = { id: 'ITM-007', slot: true };
const PECA: ItemEffect = { id: 'ITM-011', slot: true };
const CURA: ItemEffect = { id: 'ITM-001', hp: 20 };
const SALTO: ItemEffect = { id: 'ITM-003', permanent: true, kind: 'double-jump' };

function encher(n: number, id: ItemId = 'ITM-004'): ItemId[] {
  return Array.from({ length: n }, () => id);
}

describe('mochila — espaços', () => {
  it('nasce vazia e vazia não está cheia', () => {
    const o = ocupacao(BOLSA_VAZIA, CAP);
    expect(o.itens).toBe(0);
    expect(o.presos).toBe(0);
    expect(o.livres).toBe(40);
    expect(o.cheia).toBe(false);
  });

  it('guarda o item que ocupa espaço', () => {
    const r = guardar(BOLSA_VAZIA, 'ITM-004', DROP, CAP);
    expect(r.ok).toBe(true);
    expect(r.bolsa.itens).toEqual(['ITM-004']);
  });

  it('habilidade e consumível não ocupam espaço e não entram na mochila', () => {
    for (const efeito of [CURA, SALTO]) {
      const r = guardar(BOLSA_VAZIA, efeito.id, efeito, CAP);
      expect(r.ok).toBe(false);
      expect(r.motivo).toBe('nao-prende');
      expect(r.bolsa.itens).toEqual([]);
    }
    expect(ocupaEspaco(CURA)).toBe(false);
    expect(ocupaEspaco(DROP)).toBe(true);
  });

  it('o 40.º lugar é o último: o 41.º é recusado e o item fica no chão', () => {
    const bolsa = { itens: encher(40), presos: [] };
    const r = guardar(bolsa, 'ITM-007', ESPOLIO, CAP);
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe('sem-espaco');
    expect(r.bolsa.itens).toHaveLength(40);
    expect(ocupacao(bolsa, CAP).cheia).toBe(true);
  });

  it('o mesmo item outra vez ocupa outro espaço (é drop, não pilha)', () => {
    const a = guardar(BOLSA_VAZIA, 'ITM-004', DROP, CAP);
    const b = guardar(a.bolsa, 'ITM-004', DROP, CAP);
    expect(b.bolsa.itens).toEqual(['ITM-004', 'ITM-004']);
    expect(ocupacao(b.bolsa, CAP).livres).toBe(38);
  });

  it('os três drops do jogo cabem todos', () => {
    let bolsa = BOLSA_VAZIA;
    for (const e of [DROP, ESPOLIO, PECA]) {
      const r = guardar(bolsa, e.id, e, CAP);
      expect(r.ok).toBe(true);
      bolsa = r.bolsa;
    }
    expect(bolsa.itens).toEqual(['ITM-004', 'ITM-007', 'ITM-011']);
    expect(ocupacao(bolsa, CAP).livres).toBe(37);
  });
});

describe('mochila — prender e soltar', () => {
  const comDrop = guardar(BOLSA_VAZIA, 'ITM-004', DROP, CAP).bolsa;

  it('prende o que está na mochila', () => {
    const r = prender(comDrop, 'ITM-004', CAP);
    expect(r.ok).toBe(true);
    expect(r.bolsa.presos).toEqual(['ITM-004']);
    expect(ocupacao(r.bolsa, CAP).livresPresos).toBe(19);
  });

  it('não prende o que não está na mochila', () => {
    const r = prender(comDrop, 'ITM-011', CAP);
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe('sem-item');
    expect(r.bolsa.presos).toEqual([]);
  });

  it('não prende duas vezes o mesmo item', () => {
    const a = prender(comDrop, 'ITM-004', CAP);
    const b = prender(a.bolsa, 'ITM-004', CAP);
    expect(b.ok).toBe(false);
    expect(b.motivo).toBe('ja-preso');
    expect(b.bolsa.presos).toHaveLength(1);
  });

  it('o 20.º preso é o último: o 21.º é recusado', () => {
    // 20 já presos (de outro item) e um `ITM-004` solto na mochila: é ele que não cabe
    const cheio = {
      itens: ['ITM-004', ...encher(20, 'ITM-007')] as ItemId[],
      presos: encher(20, 'ITM-007'),
    };
    expect(prender(cheio, 'ITM-004', CAP).motivo).toBe('limite-presos');
    const vinte = { itens: encher(20), presos: encher(20) };
    expect(ocupacao(vinte, CAP).livresPresos).toBe(0);
  });

  it('soltar devolve o item a solto, e soltar duas vezes não faz nada', () => {
    const preso = prender(comDrop, 'ITM-004', CAP).bolsa;
    const solto = soltar(preso, 'ITM-004');
    expect(solto.ok).toBe(true);
    expect(solto.bolsa.presos).toEqual([]);
    expect(soltar(solto.bolsa, 'ITM-004').ok).toBe(false);
    expect(soltar(solto.bolsa, 'ITM-004').motivo).toBe('nao-preso');
  });

  it('largar um preso desprende-o (senão contava para os 20 sem existir)', () => {
    const preso = prender(comDrop, 'ITM-004', CAP).bolsa;
    const r = largar(preso, 'ITM-004');
    expect(r.ok).toBe(true);
    expect(r.bolsa.itens).toEqual([]);
    expect(r.bolsa.presos).toEqual([]);
  });

  it('largar um item que não existe não mexe em nada', () => {
    const r = largar(comDrop, 'ITM-011');
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe('sem-item');
    expect(r.bolsa).toEqual(comDrop);
  });
});

describe('mochila — a morte (`MEC-004`, TST-004)', () => {
  it('preso fica, solto cai', () => {
    const bolsa = { itens: ['ITM-004', 'ITM-007'], presos: ['ITM-004'] } as const;
    const r = aoMorrer({ itens: [...bolsa.itens], presos: [...bolsa.presos] });
    expect(r.fica).toEqual(['ITM-004']);
    expect(r.cai).toEqual(['ITM-007']);
  });

  it('sem nada preso, cai tudo — e a mochila ao reaparecer fica vazia', () => {
    const bolsa = { itens: encher(3), presos: [] };
    const r = aoMorrer(bolsa);
    expect(r.fica).toEqual([]);
    expect(r.cai).toHaveLength(3);
  });

  it('presos sem mochila não é estado possível: só se prende o que se tem', () => {
    const r = aoMorrer(BOLSA_VAZIA);
    expect(r.fica).toEqual([]);
    expect(r.cai).toEqual([]);
  });
});

describe('mochila — textos', () => {
  it('cada motivo tem frase, e todas são PT-BR com maiúsculas', () => {
    for (const texto of Object.values(MOTIVO_TEXTO)) {
      expect(texto.length).toBeGreaterThan(6);
      expect(texto).toBe(texto.toUpperCase());
      expect(texto.endsWith('.')).toBe(true);
    }
  });
});
