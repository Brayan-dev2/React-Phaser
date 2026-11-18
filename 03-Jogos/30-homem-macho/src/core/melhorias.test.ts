/**
 * `UI-14` — as melhorias das habilidades (`DEC-041`).
 *
 * O caso que mais importa não é "o nível sobe": é **o dinheiro e o nível andarem juntos**. Uma
 * compra que cobra e não entrega (ou entrega e não cobra) é o único bug desta função que o jogador
 * sente como injustiça, e é o que estes testes prendem.
 */
import { describe, expect, it } from 'vitest';
import {
  MOTIVO_MELHORIA_TEXTO, fatorDe, maxNivel, melhorar, nivelDe, niveisIniciais, normalizarNiveis,
  proximoCusto, proximoTexto, type Niveis, type TabelaDeMelhorias,
} from './melhorias';
import type { Habilidade } from './permanentes';

/** Tabela de teste: três níveis, preços e fatores previsíveis. */
const TABELA: TabelaDeMelhorias = {
  'double-jump': [
    { custo: 0, fator: 1, texto: 'base' },
    { custo: 40, fator: 1.2, texto: 'meio' },
    { custo: 120, fator: 1.4, texto: 'topo' },
  ],
  strength: [{ custo: 0, fator: 1, texto: 'base' }],
  breath: [
    { custo: 0, fator: 1, texto: 'base' },
    { custo: 40, fator: 1.4, texto: 'meio' },
    { custo: 120, fator: 1.8, texto: 'topo' },
  ],
  hook: [{ custo: 0, fator: 1, texto: 'base' }],
  climb: [{ custo: 0, fator: 1, texto: 'base' }],
  glide: [{ custo: 0, fator: 1, texto: 'base' }],
};

const zero: Niveis = {
  'double-jump': 0, strength: 0, breath: 0, hook: 0, climb: 0, glide: 0,
};
const comSalto: Niveis = { ...zero, 'double-jump': 1 };

describe('melhorias — níveis de partida', () => {
  it('quem não conquistou nada começa a zero em tudo', () => {
    expect(niveisIniciais([], TABELA)).toEqual(zero);
  });

  it('conquistar dá nível 1 — não o máximo', () => {
    expect(niveisIniciais(['double-jump'] as Habilidade[], TABELA)['double-jump']).toBe(1);
  });

  it('o máximo vem da tabela, não de um número mágico', () => {
    expect(maxNivel(TABELA, 'double-jump')).toBe(3);
    expect(maxNivel(TABELA, 'strength')).toBe(1);
  });
});

describe('melhorias — comprar', () => {
  it('paga o custo do próximo nível e sobe um', () => {
    const r = melhorar({ niveis: comSalto, moedas: 100 }, 'double-jump', TABELA);
    expect(r.ok).toBe(true);
    expect(r.nivel).toBe(2);
    expect(r.niveis['double-jump']).toBe(2);
    expect(r.moedas).toBe(60);
  });

  it('duas compras seguidas chegam ao topo e cobram os dois preços', () => {
    let e = { niveis: comSalto, moedas: 200 };
    e = { niveis: melhorar(e, 'double-jump', TABELA).niveis, moedas: melhorar(e, 'double-jump', TABELA).moedas };
    const r = melhorar(e, 'double-jump', TABELA);
    expect(r.ok).toBe(true);
    expect(r.niveis['double-jump']).toBe(3);
    expect(r.moedas).toBe(40); // 200 − 40 − 120
  });

  it('sem moedas não compra — e não toca no dinheiro nem no nível', () => {
    const r = melhorar({ niveis: comSalto, moedas: 39 }, 'double-jump', TABELA);
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe('sem-moedas');
    expect(r.moedas).toBe(39);
    expect(r.niveis['double-jump']).toBe(1);
  });

  it('no máximo recusa, e não cobra nada', () => {
    const r = melhorar({ niveis: { ...zero, 'double-jump': 3 }, moedas: 999 }, 'double-jump', TABELA);
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe('maximo');
    expect(r.moedas).toBe(999);
  });

  it('habilidade não conquistada não se compra com dinheiro nenhum', () => {
    const r = melhorar({ niveis: zero, moedas: 9999 }, 'double-jump', TABELA);
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe('nao-conquistada');
    expect(r.moedas).toBe(9999);
  });

  it('uma habilidade inventada é recusada sem mexer em nada', () => {
    const r = melhorar({ niveis: comSalto, moedas: 100 }, 'teleporte' as Habilidade, TABELA);
    expect(r.motivo).toBe('desconhecida');
  });

  it('moedas tortas (`NaN`) contam como zero, não passam na compra', () => {
    const r = melhorar({ niveis: comSalto, moedas: Number.NaN }, 'double-jump', TABELA);
    expect(r.ok).toBe(false);
    expect(r.moedas).toBe(0);
  });

  it('o custo do próximo nível é `null` no máximo e sem requisito quando não conquistada', () => {
    expect(proximoCusto(comSalto, 'double-jump', TABELA)).toBe(40);
    expect(proximoCusto({ ...zero, 'double-jump': 3 }, 'double-jump', TABELA)).toBeNull();
    expect(proximoCusto(zero, 'double-jump', TABELA)).toBeNull();
  });

  it('o texto do próximo nível é o que o jogador vai comprar', () => {
    expect(proximoTexto(comSalto, 'double-jump', TABELA)).toBe('meio');
    expect(proximoTexto({ ...zero, 'double-jump': 3 }, 'double-jump', TABELA)).toBeNull();
  });
});

describe('melhorias — o efeito', () => {
  it('o nível 1 é a habilidade como foi conquistada (fator 1)', () => {
    for (const hab of Object.keys(TABELA) as Habilidade[]) {
      expect(fatorDe({ ...zero, [hab]: 1 }, hab, TABELA)).toBe(1);
    }
  });

  it('cada nível aplica o seu fator, e o nível 3 é o maior de todos', () => {
    expect(fatorDe({ ...zero, breath: 2 }, 'breath', TABELA)).toBe(1.4);
    expect(fatorDe({ ...zero, breath: 3 }, 'breath', TABELA)).toBe(1.8);
  });

  it('não conquistada devolve 1 (nunca 0: um fator 0 apagava a habilidade)', () => {
    expect(fatorDe(zero, 'breath', TABELA)).toBe(1);
  });

  it('um fator inválido na tabela cai para 1 em vez de atravessar para o motor', () => {
    const quebrada = {
      ...TABELA,
      breath: [
        { custo: 0, fator: 1, texto: 'base' },
        { custo: 40, fator: Number.NaN, texto: 'torto' },
      ],
    } as TabelaDeMelhorias;
    expect(fatorDe({ ...zero, breath: 2 }, 'breath', quebrada)).toBe(1);
  });
});

describe('melhorias — a fronteira do save', () => {
  it('save antigo (sem melhorias) abre com as conquistadas a nível 1', () => {
    expect(normalizarNiveis(undefined, ['breath'], TABELA).breath).toBe(1);
  });

  it('níveis válidos são respeitados', () => {
    expect(normalizarNiveis({ 'double-jump': 2 }, ['double-jump'], TABELA)['double-jump']).toBe(2);
  });

  it('um save torto não passa do máximo nem desce abaixo do conquistado', () => {
    expect(normalizarNiveis({ 'double-jump': 99 }, ['double-jump'], TABELA)['double-jump']).toBe(3);
    expect(normalizarNiveis({ 'double-jump': 0 }, ['double-jump'], TABELA)['double-jump']).toBe(1);
    expect(normalizarNiveis({ 'double-jump': -4 }, ['double-jump'], TABELA)['double-jump']).toBe(1);
  });

  it('uma habilidade que o save diz ter mas o jogador nunca conquistou não entra', () => {
    expect(normalizarNiveis({ glide: 3 }, [], TABELA).glide).toBe(0);
  });

  it('uma chave inventada é ignorada em silêncio', () => {
    expect(() => normalizarNiveis({ teleporte: 3 }, [], TABELA)).not.toThrow();
  });
});

describe('melhorias — textos', () => {
  it('cada motivo tem frase em PT-BR, maiúscula e com ponto', () => {
    for (const texto of Object.values(MOTIVO_MELHORIA_TEXTO)) {
      expect(texto).toBe(texto.toUpperCase());
      expect(texto.endsWith('.')).toBe(true);
    }
  });
});
