/**
 * `MEC-004` / `UI-07` — o **dado** do jogo, verificado contra as decisões.
 *
 * Estes casos existem porque as percentagens da morte, as capacidades da mochila e do baú e o preço
 * das moedas vivem num ficheiro de números (`tuning.ts`) que nada impede de ser editado por engano.
 * Um `0.3` trocado por `0.03` não rebenta nada e não aparece em nenhum ecrã — só se nota quando o
 * jogador perde um item que devia ter ficado.
 */
import { describe, expect, it } from 'vitest';
import {
  CUSTO_UP, DROPS_RAROS, INVENTARIO, ITEMS, MELHORIAS, MELHORIAS_BASE, MOEDAS, NIVEIS_MAX, PERDA,
  ORDEM_HABILIDADES,
} from './tuning';
import { ITEM_IDS } from '../../core/items';
import type { Classe } from '../../core/loot';

const CLASSES: readonly Classe[] = ['acumulativo', 'simples', 'forjada', 'habilidade'];

describe('dados — itens', () => {
  it('todo o item do contrato tem nome, classe e resumo', () => {
    for (const id of ITEM_IDS) {
      const item = ITEMS[id] as { name?: string; classe?: string; resumo?: string };
      expect(item.name, id).toBeTruthy();
      expect(CLASSES, id).toContain(item.classe);
      expect(item.resumo, id).toBeTruthy();
    }
  });

  it('todo o item que ocupa espaço tem a segunda linha do aviso (`nota`)', () => {
    for (const id of ITEM_IDS) {
      const item = ITEMS[id] as { slot?: boolean; nota?: string; name: string; resumo: string };
      if (!item.slot) continue;
      expect(item.nota, `${id} ocupa espaço e não tem nota`).toBeTruthy();
      expect(item.nota).toBe(item.nota?.toUpperCase());
    }
  });

  it('as habilidades são as que nunca caem, e o resto não é `habilidade`', () => {
    const habilidades = ITEM_IDS.filter((id) => (ITEMS[id] as { classe: string }).classe === 'habilidade');
    expect(habilidades).toEqual(['ITM-003', 'ITM-005', 'ITM-006', 'ITM-008', 'ITM-009', 'ITM-010']);
  });

  it('os três drops são os que ocupam espaço', () => {
    const slots = ITEM_IDS.filter((id) => (ITEMS[id] as { slot?: boolean }).slot);
    expect(slots).toEqual(['ITM-004', 'ITM-007', 'ITM-011']);
  });
});

describe('dados — as percentagens da morte (`DEC-037`)', () => {
  it('são as do dono: 30 % · 100 % · 20 % · 0 % · 100 %', () => {
    expect(PERDA.acumulativo).toBe(0.30);
    expect(PERDA.simples).toBe(1.00);
    expect(PERDA.forjada).toBe(0.20);
    expect(PERDA.presa).toBe(0.00);
    expect(PERDA.moedas).toBe(1.00);
  });

  it('nenhuma é negativa nem maior que 1 (o que daria perdas impossíveis)', () => {
    for (const [nome, valor] of Object.entries(PERDA)) {
      expect(valor, nome).toBeGreaterThanOrEqual(0);
      expect(valor, nome).toBeLessThanOrEqual(1);
    }
  });
});

describe('dados — capacidades e moedas', () => {
  it('a mochila é 40 espaços e 20 presos, em 8 colunas', () => {
    expect(INVENTARIO.slots).toBe(40);
    expect(INVENTARIO.presos).toBe(20);
    expect(INVENTARIO.colunas).toBe(8);
    expect(INVENTARIO.linhas).toBe(5);
  });

  it('o baú tem os mesmos 40 espaços da mochila (um número só para aprender)', () => {
    expect(INVENTARIO.bau).toBe(INVENTARIO.slots);
  });

  it('o preso nunca é mais que os espaços, e o alcance do baú é jogável', () => {
    expect(INVENTARIO.presos).toBeLessThanOrEqual(INVENTARIO.slots);
    expect(INVENTARIO.alcanceBau).toBeGreaterThan(32);
    expect(INVENTARIO.alcanceBau).toBeLessThan(128);
  });

  it('as moedas vêm de mobs e de chefes, e o chefe vale mais', () => {
    expect(MOEDAS.porInimigo).toBeGreaterThan(0);
    expect(MOEDAS.porChefe).toBeGreaterThan(MOEDAS.porInimigo);
  });
});

/**
 * `DEC-042` — **as melhorias custam o que o dono decidiu**: dez níveis, preços diferentes por
 * habilidade, +40 % por nível e as três raras a cair de chefe.
 *
 * Estes casos verificam a **regra**, não a tabela: se o preço base mudar, eles continuam a passar
 * (era esse o ponto de gerar `MELHORIAS` em vez de a escrever à mão). O que eles não deixam passar é
 * um nível a mais, um acréscimo que não seja 40 % ou uma rara que fique garantida numa sala.
 */
describe('dados — melhorias (DEC-042)', () => {
  it('cada habilidade tem dez níveis — nível 1 = conquista, nível 10 = topo', () => {
    expect(NIVEIS_MAX).toBe(10);
    for (const hab of ORDEM_HABILIDADES) {
      expect(MELHORIAS[hab], hab).toHaveLength(10);
    }
  });

  it('o nível 1 é de graça: conquistar a habilidade não se compra', () => {
    for (const hab of ORDEM_HABILIDADES) expect(MELHORIAS[hab][0].custo, hab).toBe(0);
  });

  it('o preço começa no base da habilidade e sobe 40 % por nível', () => {
    expect(CUSTO_UP).toBe(1.4);
    for (const hab of ORDEM_HABILIDADES) {
      const niveis = MELHORIAS[hab];
      for (let n = 2; n <= 10; n += 1) {
        const esperado = Math.round(MELHORIAS_BASE[hab].custo * Math.pow(CUSTO_UP, n - 2));
        expect(niveis[n - 1].custo, `${hab} nível ${n}`).toBe(esperado);
      }
      // o passo é ~40 %: nenhum nível custa menos que o anterior, nem salta mais que o dobro
      for (let n = 3; n <= 10; n += 1) {
        const razao = niveis[n - 1].custo / niveis[n - 2].custo;
        expect(razao, `${hab} nível ${n}`).toBeGreaterThan(1.35);
        expect(razao, `${hab} nível ${n}`).toBeLessThan(1.45);
      }
    }
  });

  it('as habilidades mais simples são as baratas, e as raras as caras', () => {
    // a ordem do painel é a ordem de complexidade: o salto duplo é o mais barato, o estandarte o último
    const bases = ORDEM_HABILIDADES.map((h) => MELHORIAS_BASE[h].custo);
    expect(bases[0]).toBe(100); // "a partir de 100 moedas as mais simples"
    for (let i = 1; i < bases.length; i += 1) expect(bases[i], ORDEM_HABILIDADES[i]).toBeGreaterThan(bases[i - 1]);
  });

  it('o total até ao topo é o que o documento diz (4.915 e 18.679 moedas)', () => {
    const total = (hab: keyof typeof MELHORIAS): number =>
      MELHORIAS[hab].reduce((n, nivel) => n + nivel.custo, 0);
    expect(total('double-jump')).toBe(4915);
    expect(total('glide')).toBe(18679);
    // a mais cara custa quase quatro vezes a mais barata: o jogador não chega ao topo das seis
    expect(total('glide') / total('double-jump')).toBeGreaterThan(3.5);
  });

  it('o efeito cresce com o nível e nunca regride (nem no planeio, onde o factor desce)', () => {
    for (const hab of ORDEM_HABILIDADES) {
      const fatores = MELHORIAS[hab].map((n) => n.fator);
      const distancias = fatores.map((f) => Math.abs(f - 1));
      for (let i = 1; i < distancias.length; i += 1) {
        expect(distancias[i], `${hab} nível ${i + 1}`).toBeGreaterThan(distancias[i - 1]);
      }
    }
  });

  it('todos os níveis têm texto, e nenhum repete o anterior', () => {
    for (const hab of ORDEM_HABILIDADES) {
      const textos = MELHORIAS[hab].map((n) => n.texto);
      expect(new Set(textos).size, hab).toBe(10); // dez níveis, dez frases
      for (const t of textos) expect(t.length, hab).toBeGreaterThan(10);
    }
  });
});

describe('dados — o drop raro (DEC-042)', () => {
  it('as três raras caem de chefe com 8 % e garantia ao 12.º', () => {
    expect(DROPS_RAROS.chance).toBe(0.08);
    expect(DROPS_RAROS.garantia).toBe(12);
    expect(DROPS_RAROS.itens).toEqual({ 'ITM-008': 'hook', 'ITM-009': 'climb', 'ITM-010': 'glide' });
  });

  it('as raras estão fora da tabela de garantidos: nenhum destes itens está num pedestal', () => {
    // as três primeiras continuam garantidas no item — sem elas não há tutorial nenhum
    for (const id of ['ITM-003', 'ITM-005', 'ITM-006'] as const) {
      expect((DROPS_RAROS.itens as Record<string, string>)[id], id).toBeUndefined();
    }
  });

  it('cada rara corresponde a uma habilidade que existe no painel', () => {
    for (const hab of Object.values(DROPS_RAROS.itens)) {
      expect(ORDEM_HABILIDADES as readonly string[]).toContain(hab);
    }
  });

  it('a economia paga o plano: um chefe vale dez mobs, e o topo custa muitos chefes', () => {
    expect(MOEDAS).toEqual({ porInimigo: 20, porChefe: 200 });
    const topo = MELHORIAS['double-jump'].reduce((n, nivel) => n + nivel.custo, 0);
    expect(topo / MOEDAS.porChefe).toBeGreaterThan(20); // > 20 chefes só para o salto duplo ao topo
  });
});

