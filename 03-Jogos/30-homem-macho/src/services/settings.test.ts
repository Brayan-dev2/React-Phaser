/**
 * `UI-02` · Configurações — o serviço (`services/settings.ts`).
 *
 * A configuração vem de um `localStorage` que qualquer pessoa pode editar e de um save que pode
 * ser de outra versão. O que estes testes fixam é simples e não negociável: **depois de
 * `normalizar`, o jogo nunca recebe `undefined`, `NaN` nem uma tecla que não existe.**
 */
import { describe, expect, it } from 'vitest';
import {
  ACOES, ATALHOS_PADRAO, CONFIG_PADRAO, ROTULO_ACAO, ajustarVolume, definirAtalho, donaDaTecla,
  normalizar, rotuloAtalho, rotuloTecla,
} from './settings';

describe('configuração · normalização', () => {
  it('sem nada guardado, devolve o padrão', () => {
    expect(normalizar(null)).toEqual(CONFIG_PADRAO);
    expect(normalizar(undefined)).toEqual(CONFIG_PADRAO);
    expect(normalizar('lixo')).toEqual(CONFIG_PADRAO);
  });

  it('volumes fora dos limites são cortados, e NaN cai no padrão', () => {
    const c = normalizar({ somGeral: 4, musica: -2, efeitos: Number.NaN });
    expect(c.somGeral).toBe(1);
    expect(c.musica).toBe(0);
    expect(c.efeitos).toBe(CONFIG_PADRAO.efeitos);
  });

  it('um tipo de controle inventado volta ao padrão', () => {
    expect(normalizar({ tipoControle: 'volante' }).tipoControle).toBe(CONFIG_PADRAO.tipoControle);
  });

  it('atalhos: chaves e valores inválidos caem no padrão da ação', () => {
    const c = normalizar({ atalhos: { atacar: ['z', 'ESPAÇO'], gancho: 'Q', pausar: [] } });
    expect(c.atalhos.atacar).toEqual(['Z']);
    expect(c.atalhos.gancho).toEqual(ATALHOS_PADRAO.gancho);
    expect(c.atalhos.pausar).toEqual(ATALHOS_PADRAO.pausar);
  });

  it('todas as ações existem sempre, mesmo as que o save antigo não tinha', () => {
    const c = normalizar({ atalhos: { atacar: ['Z'] } });
    for (const acao of ACOES) expect(c.atalhos[acao].length).toBeGreaterThan(0);
  });

  it('idioma fora da lista cai em PT-BR', () => {
    expect(normalizar({ idioma: 'fr-FR' }).idioma).toBe('pt-BR');
  });
});

describe('configuração · a mochila (`UI-07`)', () => {
  it('a ação existe, tem rótulo e nasce na tecla I', () => {
    expect(ACOES).toContain('inventario');
    expect(ATALHOS_PADRAO.inventario).toEqual(['I']);
    expect(ROTULO_ACAO.inventario).toBe('ABRIR A MOCHILA');
  });

  it('I não pertence a mais nenhuma ação', () => {
    const donas = ACOES.filter((a) => ATALHOS_PADRAO[a].includes('I'));
    expect(donas).toEqual(['inventario']);
  });

  it('é remapeável como as outras — e a troca é recusada se deixar a ação sem tecla', () => {
    expect(definirAtalho(CONFIG_PADRAO, 'inventario', 'B').config.atalhos.inventario).toEqual(['B']);
    expect(definirAtalho(CONFIG_PADRAO, 'inventario', 'J').ok).toBe(false);
  });

  it('save antigo, sem a ação, ganha o padrão em vez de ficar sem mochila', () => {
    const velho = { ...CONFIG_PADRAO, atalhos: { ...CONFIG_PADRAO.atalhos } as Record<string, string[]> };
    delete velho.atalhos.inventario;
    expect(normalizar(velho).atalhos.inventario).toEqual(['I']);
  });
});

describe('configuração · remapeamento', () => {
  it('dá para trocar a tecla de uma ação', () => {
    const r = definirAtalho(CONFIG_PADRAO, 'atacar', 'Z');
    expect(r.ok).toBe(true);
    expect(r.config.atalhos.atacar).toContain('Z');
    // não muta a configuração original
    expect(CONFIG_PADRAO.atalhos.atacar).toEqual(['J']);
  });

  it('a tecla sai da ação antiga quando esta ainda tem outra', () => {
    const r = definirAtalho(CONFIG_PADRAO, 'atacar', 'A');
    expect(r.ok).toBe(true);
    expect(r.config.atalhos.esquerda).toEqual(['LEFT']);
  });

  it('é recusado quando deixaria outra ação sem tecla — e nada muda', () => {
    const r = definirAtalho(CONFIG_PADRAO, 'atacar', 'Q');
    expect(r.ok).toBe(false);
    expect(r.config).toBe(CONFIG_PADRAO);
    expect(r.aviso).toContain('GANCHO');
  });

  it('uma tecla inválida é recusada', () => {
    expect(definirAtalho(CONFIG_PADRAO, 'atacar', 'tecla estranha').ok).toBe(false);
    expect(definirAtalho(CONFIG_PADRAO, 'atacar', '').ok).toBe(false);
  });

  it('a mesma tecla na mesma ação não mexe em nada', () => {
    const r = definirAtalho(CONFIG_PADRAO, 'atacar', 'J');
    expect(r.ok).toBe(true);
    expect(r.config.atalhos.atacar).toEqual(['J']);
  });

  it('`donaDaTecla` diz de quem é a tecla — o menu usa isso para explicar a troca', () => {
    expect(donaDaTecla(CONFIG_PADRAO, 'Q', 'atacar')).toBe('gancho');
    expect(donaDaTecla(CONFIG_PADRAO, 'Q', 'gancho')).toBeNull();
  });

  it('remapear **substitui**: a ação fica só com a tecla nova', () => {
    let c = definirAtalho(CONFIG_PADRAO, 'atacar', 'Z').config;
    c = definirAtalho(c, 'atacar', 'X').config;
    expect(c.atalhos.atacar).toEqual(['X']);
  });

  it('PULAR nasce com duas teclas, mas remapear assume a escolha do jogador', () => {
    const c = definirAtalho(CONFIG_PADRAO, 'pular', 'X').config;
    expect(c.atalhos.pular).toEqual(['X']);
  });
});

describe('configuração · rótulos e passos', () => {
  it('o jogador vê ESPAÇO, não SPACE', () => {
    expect(rotuloTecla('SPACE')).toBe('ESPAÇO');
    expect(rotuloTecla('LEFT')).toBe('←');
    expect(rotuloTecla('Z')).toBe('Z');
  });

  it('o atalho de PULAR mostra as duas teclas', () => {
    expect(rotuloAtalho(CONFIG_PADRAO, 'pular')).toBe('ESPAÇO / W');
  });

  it('o passo de volume respeita 0 e 1', () => {
    expect(ajustarVolume(0.5, 0.1)).toBeCloseTo(0.6);
    expect(ajustarVolume(0.95, 0.1)).toBe(1);
    expect(ajustarVolume(0.05, -0.1)).toBe(0);
  });
});
