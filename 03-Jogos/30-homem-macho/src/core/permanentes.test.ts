/**
 * `MEC-004` — o que se conquista fica. Tetos de vida/escudo/poder e habilidades **nunca regridem**,
 * e a morte devolve as barras cheias no teto conquistado.
 */
import { describe, expect, it } from 'vitest';
import {
  HABILIDADES, aoMorrer, aoReaparecer, conquistar, limites, melhorarTeto, permanentesIniciais, tem,
} from './permanentes';

const TETO = { hp: 100, shield: 50, power: 100 };

describe('permanentes — tetos', () => {
  it('nascem nos tetos do jogo e sem habilidades', () => {
    const p = permanentesIniciais(TETO);
    expect(p).toEqual({ hp: 100, shield: 50, power: 100, habilidades: [] });
  });

  it('um ganho sobe o teto', () => {
    const p = melhorarTeto(permanentesIniciais(TETO), { hp: 20 });
    expect(p.hp).toBe(120);
    expect(p.shield).toBe(50);
  });

  it('um ganho negativo ou inválido não desce nada', () => {
    const p = permanentesIniciais(TETO);
    expect(melhorarTeto(p, { hp: -30 }).hp).toBe(100);
    expect(melhorarTeto(p, { shield: Number.NaN }).shield).toBe(50);
    expect(melhorarTeto(p, {}).hp).toBe(100);
  });

  it('ganhos somam-se', () => {
    let p = permanentesIniciais(TETO);
    for (let i = 0; i < 3; i++) p = melhorarTeto(p, { hp: 10 });
    expect(p.hp).toBe(130);
  });

  it('um teto inicial inválido cai para o mínimo útil', () => {
    expect(permanentesIniciais({ hp: 0, shield: -5, power: Number.NaN }))
      .toEqual({ hp: 1, shield: 0, power: 0, habilidades: [] });
  });
});

describe('permanentes — habilidades', () => {
  it('conquista e não duplica', () => {
    let p = permanentesIniciais(TETO);
    p = conquistar(p, 'double-jump');
    p = conquistar(p, 'double-jump');
    expect(p.habilidades).toEqual(['double-jump']);
    expect(tem(p, 'double-jump')).toBe(true);
  });

  it('as seis habilidades cabem todas e a ordem é a de chegada', () => {
    let p = permanentesIniciais(TETO);
    for (const h of HABILIDADES) p = conquistar(p, h);
    expect(p.habilidades).toEqual(['double-jump', 'strength', 'breath', 'hook', 'climb', 'glide']);
  });
});

describe('permanentes — a morte não regride nada', () => {
  it('tetos e habilidades ficam iguais (a função é identidade, e o teste diz isso)', () => {
    let p = melhorarTeto(permanentesIniciais(TETO), { hp: 40, shield: 25 });
    p = conquistar(p, 'hook');
    const depois = aoMorrer(p);
    expect(depois).toEqual(p);
    expect(depois).toBe(p);
  });

  it('as barras voltam cheias, no teto conquistado (não no teto de fábrica)', () => {
    const p = melhorarTeto(permanentesIniciais(TETO), { hp: 40 });
    expect(aoReaparecer(p)).toEqual({ hp: 140, shield: 50, power: 100 });
  });

  it('o teto de fábrica também reaparece cheio', () => {
    expect(aoReaparecer(permanentesIniciais(TETO))).toEqual(TETO);
  });

  it('10 mortes seguidas não tiram um único ponto', () => {
    let p = melhorarTeto(conquistar(permanentesIniciais(TETO), 'glide'), { hp: 60, shield: 20, power: 30 });
    const retrato = JSON.parse(JSON.stringify(p));
    for (let i = 0; i < 10; i++) p = aoMorrer(p);
    expect(p).toEqual(retrato);
  });
});

describe('permanentes — os limites para os itens', () => {
  it('`limites` entrega o que `applyItem` espera, nos tetos conquistados', () => {
    const p = melhorarTeto(permanentesIniciais(TETO), { hp: 10, shield: 5 });
    expect(limites(p)).toEqual({ hp: 110, shield: 55 });
  });
});
