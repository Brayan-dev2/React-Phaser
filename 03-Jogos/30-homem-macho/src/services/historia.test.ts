/**
 * `UI-13` — a introdução (`services/historia.ts`).
 *
 * O que se testa aqui não é prosa bonita: é que **a história diz o que o jogo é** (o véu, a
 * escravização, os Homens Machos como esperança) e que ninguém fica preso nela — há sempre uma
 * tecla que avança e uma que salta.
 */
import { describe, expect, it } from 'vitest';
import {
  HISTORIA, HISTORIA_INICIAL, TOTAL_QUADROS, avancar, descreverQuadro, quadroAtual, saltar,
  teclaHistoria, voltar, type HistoriaState,
} from './historia';

/** Percorre a introdução com uma tecla, até ao fim. Devolve o estado final. */
function comTecla(key: string): HistoriaState {
  let e = HISTORIA_INICIAL;
  for (let i = 0; i < TOTAL_QUADROS + 2 && !e.fim; i += 1) e = teclaHistoria(e, key);
  return e;
}

describe('UI-13 · introdução', () => {
  it('tem quadros suficientes para contar a história e poucos para não aborrecer', () => {
    expect(TOTAL_QUADROS).toBeGreaterThanOrEqual(4);
    expect(TOTAL_QUADROS).toBeLessThanOrEqual(6);
  });

  it('cada quadro tem título próprio e duas ou três frases legíveis', () => {
    const titulos = HISTORIA.map((q) => q.titulo);
    expect(new Set(titulos).size).toBe(titulos.length);
    for (const q of HISTORIA) {
      expect(q.titulo, q.id).toMatch(/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ ]+$/);
      expect(q.linhas.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.linhas.length, q.id).toBeLessThanOrEqual(3);
      for (const l of q.linhas) {
        expect(l.length, `${q.id}: ${l}`).toBeGreaterThan(20);
        expect(l.length, `${q.id}: ${l}`).toBeLessThan(180);   // uma frase, não um parágrafo
      }
    }
  });

  it('conta o que o jogo é: o véu, a queda, as trevas e os Homens Machos como esperança', () => {
    const texto = HISTORIA.flatMap((q) => q.linhas).join(' ').toLowerCase();
    for (const palavra of ['véu', 'gerações', 'monstros', 'demónios', 'escravizada', 'exterminada',
      'trevas', 'homens machos', 'esperança', 'soldados', 'heróis']) {
      expect(texto, palavra).toContain(palavra);
    }
  });

  it('começa no primeiro quadro e `Enter` avança um de cada vez', () => {
    expect(HISTORIA_INICIAL).toEqual({ indice: 0, fim: false });
    expect(teclaHistoria(HISTORIA_INICIAL, 'Enter').indice).toBe(1);
    expect(teclaHistoria(HISTORIA_INICIAL, ' ').indice).toBe(1);
    expect(teclaHistoria(HISTORIA_INICIAL, 'ArrowRight').indice).toBe(1);
  });

  it('no último quadro `Enter` acaba a introdução — e o fim é o sinal para o jogo começar', () => {
    let e = HISTORIA_INICIAL;
    for (let i = 0; i < TOTAL_QUADROS - 1; i += 1) e = avancar(e);
    expect(e.indice).toBe(TOTAL_QUADROS - 1);
    expect(e.fim).toBe(false);
    expect(avancar(e).fim).toBe(true);
    // já no fim, continuar a carregar não faz nada (e não volta ao princípio)
    expect(avancar({ indice: TOTAL_QUADROS - 1, fim: true }).fim).toBe(true);
  });

  it('`←` volta um quadro e pára no primeiro', () => {
    const segundo = { indice: 1, fim: false };
    expect(voltar(segundo).indice).toBe(0);
    expect(voltar({ indice: 0, fim: false })).toEqual({ indice: 0, fim: false });
    // uma introdução já terminada não volta a existir: `voltar` não a ressuscita
    expect(voltar({ indice: 0, fim: true })).toEqual({ indice: 0, fim: true });
  });

  it('`S` salta de qualquer quadro, e `S` numa tecla que não existe não mexe em nada', () => {
    expect(saltar({ indice: 2, fim: false })).toEqual({ indice: 2, fim: true });
    const parado = teclaHistoria({ indice: 1, fim: false }, 'k');
    expect(parado).toEqual({ indice: 1, fim: false });
  });

  it('nunca se fica preso: uma só tecla chega ao fim', () => {
    expect(comTecla('Enter').fim).toBe(true);
    expect(comTecla(' ').indice).toBe(TOTAL_QUADROS - 1);
    expect(comTecla('s').fim).toBe(true);
  });

  it('a descrição acessível diz o título, o texto e onde se está', () => {
    const d = descreverQuadro(quadroAtual({ indice: 1, fim: false }), 1);
    expect(d).toContain(HISTORIA[1].titulo);
    expect(d).toContain(HISTORIA[1].linhas[0]);
    expect(d).toContain(`2 de ${TOTAL_QUADROS}`);
  });

  it('um índice fora dos limites devolve sempre um quadro válido', () => {
    expect(quadroAtual({ indice: -3, fim: false })).toBe(HISTORIA[0]);
    expect(quadroAtual({ indice: 99, fim: false })).toBe(HISTORIA[TOTAL_QUADROS - 1]);
  });
});
