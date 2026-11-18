/**
 * `UI-07` — o baú das salas seguras: um só, compartilhado por todas elas.
 *
 * O teste central é o que justifica a funcionalidade: **guardar não é perder**. Um item que está
 * no baú sobrevive à morte, à troca de sala e ao save — e o mesmo baú responde em qualquer sala
 * segura porque é a mesma lista.
 */
import { describe, expect, it } from 'vitest';
import { ITEM_IDS, ehItemId, type ItemId } from './items';
import { BOLSA_VAZIA, prender, type Bolsa } from './inventory';
import {
  MOTIVO_BAU_TEXTO,
  espacosDoBau,
  estaNoBau,
  guardarMoedas,
  guardarNoBau,
  guardarNoBauEm,
  guardarTudoNoBau,
  moedasValidas,
  normalizarBau,
  retirarDoBau,
  retirarDoBauEm,
  retirarMoedas,
  retirarTudoDoBau,
} from './storage';

const CAP = { slots: 40, presos: 20 };

function bolsaCom(...ids: ItemId[]): Bolsa {
  return { itens: ids, presos: [] };
}

function encher(n: number, id: ItemId = 'ITM-004'): ItemId[] {
  return Array.from({ length: n }, () => id);
}

describe('baú — guardar', () => {
  it('guardar tira da mochila e põe no baú (não duplica)', () => {
    const r = guardarNoBau(bolsaCom('ITM-004'), [], 'ITM-004', CAP, CAP);
    expect(r.ok).toBe(true);
    expect(r.bolsa.itens).toEqual([]);
    expect(r.bau).toEqual(['ITM-004']);
  });

  it('guardar um item que não está na mochila é recusado e não mexe em nada', () => {
    const r = guardarNoBau(bolsaCom(), [], 'ITM-007', CAP, CAP);
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe('sem-item');
    expect(r.bau).toEqual([]);
  });

  it('o baú cheio recusa, e o item fica na mochila', () => {
    const cheio = encher(40, 'ITM-007');
    const r = guardarNoBau(bolsaCom('ITM-004'), cheio, 'ITM-004', CAP, CAP);
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe('bau-cheio');
    expect(r.bolsa.itens).toEqual(['ITM-004']);
    expect(r.bau).toHaveLength(40);
  });

  it('guardar um preso solta-o: no baú não há o que prender', () => {
    const preso = prender(bolsaCom('ITM-004'), 'ITM-004', CAP).bolsa;
    expect(preso.presos).toEqual(['ITM-004']);
    const r = guardarNoBau(preso, [], 'ITM-004', CAP, CAP);
    expect(r.ok).toBe(true);
    expect(r.bolsa.presos).toEqual([]);
    expect(r.bau).toEqual(['ITM-004']);
  });

  it('guardar e retirar devolve o item — o baú não é um sumidouro', () => {
    const guardado = guardarNoBau(bolsaCom('ITM-011'), [], 'ITM-011', CAP, CAP);
    const voltou = retirarDoBau(guardado.bolsa, guardado.bau, 'ITM-011', CAP);
    expect(voltou.ok).toBe(true);
    expect(voltou.bolsa.itens).toEqual(['ITM-011']);
    expect(voltou.bau).toEqual([]);
  });
});

describe('baú — retirar', () => {
  it('retirar com a mochila cheia é recusado e o item fica no baú', () => {
    const r = retirarDoBau(bolsaCom(...encher(40)), ['ITM-004'], 'ITM-004', CAP);
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe('mochila-cheia');
    expect(r.bau).toEqual(['ITM-004']);
  });

  it('retirar um item que não está no baú é recusado', () => {
    const r = retirarDoBau(bolsaCom(), ['ITM-004'], 'ITM-007', CAP);
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe('sem-item');
  });

  it('o item sai do baú solto — quem quiser, prende-o depois', () => {
    const r = retirarDoBau(bolsaCom(), ['ITM-004'], 'ITM-004', CAP);
    expect(r.ok).toBe(true);
    expect(r.bolsa.presos).toEqual([]);
    expect(prender(r.bolsa, 'ITM-004', CAP).ok).toBe(true);
  });

  it('dois itens iguais: retira um de cada vez', () => {
    let bolsa = bolsaCom('ITM-004', 'ITM-004');
    let bau: ItemId[] = [];
    for (let i = 0; i < 2; i++) {
      const g = guardarNoBau(bolsa, bau, 'ITM-004', CAP, CAP);
      bolsa = g.bolsa; bau = [...g.bau];
    }
    expect(bau).toEqual(['ITM-004', 'ITM-004']);
    const r = retirarDoBau(bolsa, bau, 'ITM-004', CAP);
    expect(r.bau).toEqual(['ITM-004']);
    expect(r.bolsa.itens).toEqual(['ITM-004']);
  });
});

describe('baú — compartilhado entre salas seguras', () => {
  it('é a mesma lista: o que se guarda numa sala está na outra (a lista não tem sala)', () => {
    const g = guardarNoBau(bolsaCom('ITM-004'), [], 'ITM-004', CAP, CAP);
    // "outra sala segura" = chamar a API outra vez com a lista que veio do save
    expect(estaNoBau(g.bau, 'ITM-004')).toBe(true);
    const volta = retirarDoBau(bolsaCom(), g.bau, 'ITM-004', CAP);
    expect(volta.ok).toBe(true);
  });

  it('espacosDoBau conta o que falta', () => {
    expect(espacosDoBau([], CAP)).toEqual({ usados: 0, livres: 40, cheio: false });
    expect(espacosDoBau(encher(40, 'ITM-007'), CAP)).toEqual({ usados: 40, livres: 0, cheio: true });
  });
});

describe('baú — a fronteira do save', () => {
  it('lista válida passa; ids inventados e lixo caem', () => {
    expect(normalizarBau(['ITM-004', 'ITM-999', 42, null, 'ITM-007'], CAP, ehItemId))
      .toEqual(['ITM-004', 'ITM-007']);
  });

  it('o que não é lista devolve baú vazio (save antigo, JSON torto)', () => {
    for (const lixo of [null, undefined, 'ITM-004', 7, {}]) {
      expect(normalizarBau(lixo, CAP, ehItemId)).toEqual([]);
    }
  });

  it('uma lista maior que o baú é cortada — o save não abre um baú de 500', () => {
    const enorme = encher(500, 'ITM-004');
    expect(normalizarBau(enorme, CAP, ehItemId)).toHaveLength(40);
  });

  it('todos os ids do jogo passam pela validação (a lista de `items.ts` não fica para trás)', () => {
    expect(ITEM_IDS).toHaveLength(11);
    for (const id of ITEM_IDS) expect(ehItemId(id)).toBe(true);
  });
});

describe('baú — textos', () => {
  it('cada motivo tem frase em PT-BR, maiúsculas e ponto final', () => {
    for (const texto of Object.values(MOTIVO_BAU_TEXTO)) {
      expect(texto).toBe(texto.toUpperCase());
      expect(texto.endsWith('.')).toBe(true);
    }
  });

  it('o aviso de mochila cheia diz o que fazer', () => {
    expect(MOTIVO_BAU_TEXTO['mochila-cheia']).toContain('BAÚ');
  });
});

/*
 * ---------- `DEC-040`: transferir em quantidade e moedas no baú ----------
 *
 * O painel da mochila passou a ter número (guardar 3 de 5, retirar tudo, guardar as moedas). Estes
 * casos fixam o que **nunca** pode acontecer: uma moeda criada do nada, um item perdido por falta
 * de espaço, ou uma lista que fica "meio movida" e não diz em que estado está.
 *
 * Os ids reais são dezenove caracteres cada e escondem o caso que se está a testar: aqui os itens
 * chamam-se `A`, `B`, `C`. O molde `i()`/`bi()` é o único sítio onde se mente ao compilador.
 */
const i = (curto: string): ItemId => curto as ItemId;
const bi = (...curtos: string[]): ItemId[] => curtos as ItemId[];

describe('baú — mover várias cópias do mesmo item', () => {
  const cap = { slots: 40, presos: 20 };
  const mochila = (itens: ItemId[]): Bolsa => ({ itens, presos: [] });

  it('guarda exatamente a quantidade pedida', () => {
    const r = guardarNoBauEm(mochila(bi('A', 'A', 'A')), [], i('A'), 2, cap, cap);
    expect(r.ok).toBe(true);
    expect(r.movidos).toBe(2);
    expect(r.bolsa.itens).toEqual(bi('A'));
    expect(r.bau).toEqual(bi('A', 'A'));
  });

  it('`tudo` move todas as cópias — é o "passar os semelhantes"', () => {
    const r = guardarNoBauEm(mochila(bi('A', 'B', 'A', 'A')), [], i('A'), 'tudo', cap, cap);
    expect(r.movidos).toBe(3);
    expect(r.bolsa.itens).toEqual(bi('B'));
    expect(r.bau).toEqual(bi('A', 'A', 'A'));
  });

  it('corta a quantidade no espaço do baú e diz quantos foram', () => {
    const r = guardarNoBauEm(
      mochila(bi('A', 'A', 'A')), bi('B'), i('A'), 3, cap, { slots: 2, presos: 20 },
    );
    expect(r.movidos).toBe(1);
    expect(r.bolsa.itens).toHaveLength(2);
  });

  it('baú cheio não move nada e explica porquê', () => {
    const r = guardarNoBauEm(mochila(bi('A')), bi('B'), i('A'), 1, cap, { slots: 1, presos: 20 });
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe('bau-cheio');
    expect(r.movidos).toBe(0);
    expect(r.bolsa.itens).toEqual(bi('A'));
  });

  it('pedir mais do que se tem não inventa itens', () => {
    const r = guardarNoBauEm(mochila(bi('A')), [], i('A'), 99, cap, cap);
    expect(r.movidos).toBe(1);
    expect(r.bau).toEqual(bi('A'));
  });

  it('quantidade negativa ou `NaN` não move nada', () => {
    expect(guardarNoBauEm(mochila(bi('A')), [], i('A'), -3, cap, cap).movidos).toBe(0);
    expect(guardarNoBauEm(mochila(bi('A')), [], i('A'), Number.NaN, cap, cap).movidos).toBe(0);
    expect(guardarNoBauEm(mochila(bi('A')), [], i('Z'), 1, cap, cap).motivo).toBe('sem-item');
  });

  it('mover para o baú solta o alfinete (um preso no baú não existe)', () => {
    const r = guardarNoBauEm(
      { itens: bi('A', 'A'), presos: bi('A') }, [], i('A'), 'tudo', cap, cap,
    );
    expect(r.bolsa.presos).toEqual([]);
  });

  it('retirar por quantidade respeita o espaço da mochila', () => {
    const r = retirarDoBauEm(
      mochila(bi('X')), bi('A', 'A', 'A'), i('A'), 2, { slots: 2, presos: 20 },
    );
    expect(r.movidos).toBe(1);
    expect(r.bau).toEqual(bi('A', 'A'));
  });

  it('os itens que ficam mantêm a ordem de chegada', () => {
    const r = guardarNoBauEm(mochila(bi('A', 'B', 'A', 'C')), [], i('A'), 1, cap, cap);
    expect(r.bolsa.itens).toEqual(bi('B', 'A', 'C'));
  });
});

describe('baú — guardar tudo e retirar tudo', () => {
  const cap = { slots: 40, presos: 20 };

  it('`GUARDAR TUDO` esvazia a mochila quando o baú tem espaço', () => {
    const r = guardarTudoNoBau({ itens: bi('A', 'B'), presos: bi('A') }, [], cap, cap);
    expect(r.ok).toBe(true);
    expect(r.movidos).toBe(2);
    expect(r.bolsa.itens).toEqual([]);
    expect(r.bolsa.presos).toEqual([]);
    expect(r.bau).toEqual(bi('A', 'B'));
  });

  it('`GUARDAR TUDO` com o baú quase cheio guarda o que cabe e deixa o resto na mochila', () => {
    const r = guardarTudoNoBau(
      { itens: bi('A', 'B', 'C'), presos: [] }, bi('X'), cap, { slots: 3, presos: 20 },
    );
    expect(r.movidos).toBe(2);
    expect(r.bolsa.itens).toEqual(bi('C'));
    expect(r.bau).toEqual(bi('X', 'A', 'B'));
  });

  it('`RETIRAR TUDO` devolve o baú até a mochila encher', () => {
    const r = retirarTudoDoBau(
      { itens: bi('A'), presos: [] }, bi('B', 'C'), { slots: 2, presos: 20 },
    );
    expect(r.movidos).toBe(1);
    expect(r.bolsa.itens).toEqual(bi('A', 'B'));
    expect(r.bau).toEqual(bi('C'));
  });

  it('nada para mover é `ok: false` com motivo, não uma operação silenciosa', () => {
    expect(guardarTudoNoBau({ itens: [], presos: [] }, [], cap, cap).motivo).toBe('sem-item');
    expect(retirarTudoDoBau({ itens: [], presos: [] }, [], cap).motivo).toBe('sem-item');
    expect(retirarTudoDoBau({ itens: [], presos: [] }, bi('A'), { slots: 0, presos: 20 }).motivo)
      .toBe('mochila-cheia');
  });
});

describe('baú — moedas', () => {
  it('guarda a quantidade pedida e tira-a da carteira', () => {
    const r = guardarMoedas(40, 0, 15);
    expect(r).toMatchObject({ moedas: 25, noBau: 15, movidas: 15, ok: true });
  });

  it('`tudo` guarda a carteira inteira', () => {
    expect(guardarMoedas(40, 5, 'tudo')).toMatchObject({ moedas: 0, noBau: 45, movidas: 40 });
  });

  it('retirar por quantidade e retirar tudo', () => {
    expect(retirarMoedas(0, 45, 20)).toMatchObject({ moedas: 20, noBau: 25 });
    expect(retirarMoedas(0, 45, 'tudo')).toMatchObject({ moedas: 45, noBau: 0 });
  });

  it('o par nunca cria nem destrói moeda', () => {
    const guardado = guardarMoedas(37, 3, 12);
    expect(guardado.moedas + guardado.noBau).toBe(40);
    const retirado = retirarMoedas(guardado.moedas, guardado.noBau, 5);
    expect(retirado.moedas + retirado.noBau).toBe(40);
  });

  it('pedir mais do que há corta no que existe', () => {
    expect(guardarMoedas(4, 0, 99)).toMatchObject({ moedas: 0, noBau: 4 });
    expect(retirarMoedas(0, 4, 99)).toMatchObject({ moedas: 4, noBau: 0 });
  });

  it('sem moedas do lado pedido, não mexe e diz que não', () => {
    expect(guardarMoedas(0, 10, 5).ok).toBe(false);
    expect(retirarMoedas(10, 0, 'tudo').ok).toBe(false);
  });

  it('moeda torta (`NaN`, negativa, fração) é saneada antes de entrar', () => {
    expect(moedasValidas(Number.NaN)).toBe(0);
    expect(moedasValidas(-7)).toBe(0);
    expect(moedasValidas(12.9)).toBe(12);
    expect(moedasValidas('40')).toBe(0);
    expect(moedasValidas(undefined)).toBe(0);
  });
});
