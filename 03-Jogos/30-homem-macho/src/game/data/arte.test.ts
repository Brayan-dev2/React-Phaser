/**
 * As medidas da arte (`docs/14`, `src/game/data/arte.json`).
 *
 * O que se testa aqui é o **encaixe**, não o gosto: que o frame cabe no viewport, que a área útil
 * contém a hurtbox que o `tuning.ts` já usa, que nenhuma folha passa o atlas de 2048² e que a arte
 * não obriga a mexer no código do jogo. Se um destes falhar, o sprite entra torto — e ninguém
 * reporta um sprite esticado como bug.
 */
import { describe, expect, it } from 'vitest';
import { PLAYER, SENTINEL, TILE, VIEW } from './tuning';
import {
  ARTE, ATLAS_MAX, CATALOGO, HEROI, PECAS, SENTINELA, cabeNoAtlas, celulaDaFolha, chaveDaAcao,
  peca, problemas, tamanhoDaFolha, totalDeFrames,
} from './arte';
import {
  CABELOS, CORES_CABELO, CORPOS, DENTES, EXPRESSOES, MARCAS, PELES, ROSTOS,
} from '../../services/character';

describe('arte · medidas', () => {
  it('a grelha do mundo: tile 64 e viewport de 11 linhas', () => {
    expect(TILE).toBe(ARTE.base.tile);
    expect(VIEW.height).toBe(TILE * ARTE.base.salas.linhas);   // 11 × 64 = 704
    expect(VIEW.width).toBe(TILE * ARTE.base.salas.largurasTiles[0]); // 20 × 64 = 1280
  });

  it('toda a peça encaixa: útil dentro do frame, hurtbox dentro do útil, folha dentro do atlas', () => {
    const erros = PECAS.flatMap(problemas);
    expect(erros).toEqual([]);
  });

  it('nenhuma folha passa 2048² (o alvo mobile do §5.3)', () => {
    for (const p of PECAS) {
      const { w, h } = tamanhoDaFolha(p);
      expect(cabeNoAtlas(p), `${p.chave}: ${w}×${h}`).toBe(true);
    }
  });

  it('o herói: 96×128 de célula, desenho de 112 de altura, hurtbox 36×110 do `tuning`', () => {
    expect(HEROI.frame).toEqual({ w: 96, h: 128 });
    expect(HEROI.util.h).toBeGreaterThanOrEqual(PLAYER.body.height);   // 112 ≥ 110
    expect(HEROI.util.w).toBeGreaterThanOrEqual(PLAYER.body.width);    // 96 ≥ 36
    expect(HEROI.hurtboxJogo).toEqual(PLAYER.body);
    // o desenho cabe em duas linhas de tile: é isso que faz o herói ler-se do tamanho do mundo
    expect(HEROI.frame.h).toBeLessThanOrEqual(TILE * 2);
  });

  it('a sentinela: célula 96×128 mas desenho de 48×80 — folga para a antecipação', () => {
    expect(SENTINELA.frame).toEqual({ w: 96, h: 128 });
    expect(SENTINELA.util).toEqual({ w: 48, h: 80 });
    expect(SENTINELA.hurtboxJogo).toEqual(SENTINEL.body);
    expect(SENTINELA.util.h).toBeGreaterThanOrEqual(SENTINEL.body.height);
  });

  it('cada ação do herói existe para um estado do jogo', () => {
    const acoes = peca('player').acoes.map((a) => a.nome);
    for (const estado of ['parado', 'corrida', 'salto', 'queda', 'ataque', 'disparo', 'dano', 'morte']) {
      expect(acoes, estado).toContain(estado);
    }
  });

  it('as folhas são grelhas: a célula n cai sempre dentro do frame', () => {
    for (const p of PECAS) {
      const total = totalDeFrames(p);
      const ultima = celulaDaFolha(p, total - 1);
      expect(ultima.x + ultima.w, p.chave).toBeLessThanOrEqual(tamanhoDaFolha(p).w);
      expect(ultima.y + ultima.h, p.chave).toBeLessThanOrEqual(tamanhoDaFolha(p).h);
    }
  });

  it('as chaves das animações são únicas e legíveis', () => {
    const chaves = PECAS.flatMap((p) => p.acoes.map((a) => chaveDaAcao(p, a)));
    expect(new Set(chaves).size).toBe(chaves.length);
    for (const c of chaves) expect(c).toMatch(/^[a-z0-9_]+:[a-z0-9_]+$/);
  });

  it('identificadores e ficheiros não se repetem', () => {
    const ids = PECAS.map((p) => p.id);
    const ficheiros = PECAS.map((p) => p.ficheiro);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ficheiros).size).toBe(ficheiros.length);
  });

  it('a animação fica na janela 8–12 fps do documento', () => {
    expect(ARTE.base.fpsMin).toBe(8);
    expect(ARTE.base.fpsMax).toBe(12);
    for (const p of PECAS) {
      // folhas de variantes não animam: os frames são alternativas, não uma sequência no tempo
      if (p.tipo === 'customizacao' || p.tipo === 'paleta') continue;
      for (const a of p.acoes.filter((x) => x.frames > 1)) {
        expect(a.fps, `${p.chave}:${a.nome}`).toBeGreaterThanOrEqual(ARTE.base.fpsMin);
        expect(a.fps, `${p.chave}:${a.nome}`).toBeLessThanOrEqual(ARTE.base.fpsMax);
      }
    }
  });

  it('os chefes têm célula maior do que o herói e a hurtbox sempre menor que o desenho', () => {
    const chefes = PECAS.filter((p) => p.id.startsWith('AST-003'));
    expect(chefes.length).toBe(6);
    for (const c of chefes) {
      expect(c.frame.w, c.chave).toBeGreaterThanOrEqual(128);
      if (c.hurtbox) expect(c.hurtbox.w, c.chave).toBeLessThan(c.frame.w);
    }
  });

  it('a introdução tem uma arte por quadro, e nenhuma passa o atlas', () => {
    const intro = PECAS.filter((p) => p.chave.startsWith('bg_intro_'));
    expect(intro).toHaveLength(5);
    for (const p of intro) expect(cabeNoAtlas(p)).toBe(true);
  });

  it('o atlas alvo é o que o documento diz: 2048', () => {
    expect(ATLAS_MAX).toBe(2048);
  });
});

describe('arte · personalização', () => {
  it('o catálogo do manifesto é o mesmo do jogo (ids e ordem)', () => {
    expect(CATALOGO.cabelos).toEqual(CABELOS.map((o) => o.id));
    expect(CATALOGO.rostos).toEqual(ROSTOS.map((o) => o.id));
    expect(CATALOGO.expressoes).toEqual(EXPRESSOES.map((o) => o.id));
    expect(CATALOGO.marcas).toEqual(MARCAS.map((o) => o.id));
    expect(CATALOGO.marcasCorpo).toEqual(
      MARCAS.map((o) => o.id).filter((id) => id === 'nenhuma' || id.startsWith('tatuagem-')),
    );
    expect(CATALOGO.dentes).toEqual(DENTES.map((o) => o.id));
    expect(CATALOGO.corpos.map((c) => c.id)).toEqual(CORPOS.map((c) => c.id));
  });

  it('as proporções dos corpos são as do `character.ts`, ao milímetro', () => {
    for (const c of CORPOS) {
      const noManifesto = CATALOGO.corpos.find((x) => x.id === c.id);
      expect(noManifesto, c.id).toBeDefined();
      expect(noManifesto!.ombro, c.id).toBe(c.ombro);
      expect(noManifesto!.tronco, c.id).toBe(c.tronco);
      expect(noManifesto!.cintura, c.id).toBe(c.cintura);
      expect(noManifesto!.altura, c.id).toBe(c.altura);
    }
  });

  it('as cores das paletas são as dos tons do jogo', () => {
    expect(CATALOGO.peles).toEqual(PELES.map((t) => ({ id: t.id, cor: t.base, sombra: t.sombra })));
    expect(CATALOGO.coresCabelo)
      .toEqual(CORES_CABELO.map((t) => ({ id: t.id, cor: t.base, sombra: t.sombra })));
  });

  it('há uma folha por grupo de personalização, com o número certo de frames', () => {
    const esperado = {
      spr_pers_corpos: CATALOGO.corpos.length,
      spr_pers_cabelos: CATALOGO.cabelos.length,
      spr_pers_rostos: CATALOGO.rostos.length,
      spr_pers_expressoes: CATALOGO.expressoes.length,
      spr_pers_marcas: CATALOGO.marcas.length,
      spr_pers_dentes: CATALOGO.dentes.length,
      spr_pers_peles: CATALOGO.peles.length,
      spr_pers_cores_cabelo: CATALOGO.coresCabelo.length,
    };
    for (const [chave, n] of Object.entries(esperado)) {
      expect(totalDeFrames(peca(chave)), chave).toBe(n);
    }
  });

  it('as folhas de personalização usam a célula do herói (96 × 128), menos as paletas', () => {
    const folhas = PECAS.filter((p) => p.tipo === 'customizacao');
    expect(folhas.length).toBeGreaterThanOrEqual(7);
    for (const f of folhas) expect(f.frame, f.chave).toEqual({ w: 96, h: 128 });
    for (const p of PECAS.filter((x) => x.tipo === 'paleta')) {
      expect(p.frame, p.chave).toEqual({ w: 32, h: 32 });
    }
  });

  it('cada parte do corpo tem as mesmas 5 variantes, no mesmo índice de CORPO', () => {
    const partes = [
      'spr_pers_corpos', 'spr_pers_torsos', 'spr_pers_bracos',
      'spr_pers_maos', 'spr_pers_pernas', 'spr_pers_pes',
    ];
    for (const chave of partes) {
      const p = peca(chave);
      expect(totalDeFrames(p), chave).toBe(CORPOS.length);
      expect(p.colunas, chave).toBe(CORPOS.length);   // índice 3 = maromba em todas
      expect(p.acoes[0].nome, chave).toBe('variantes');
      expect(p.hurtbox, chave).toBeNull();            // nunca criar física por parte do desenho
    }
  });

  it('as marcas abaixo do pescoço têm folha própria, sem duplicar as marcas do rosto', () => {
    const p = peca('spr_pers_marcas_corpo');
    expect(totalDeFrames(p)).toBe(CATALOGO.marcasCorpo.length);
    expect(CATALOGO.marcasCorpo).toEqual(['nenhuma', 'tatuagem-braco', 'tatuagem-peito']);
    for (const id of CATALOGO.marcasCorpo) expect(CATALOGO.marcas).toContain(id);
  });

  it('os exemplos cabem nas 3 células e o herói completo tem a altura útil dele', () => {
    const ex = peca('spr_pers_exemplos');
    expect(totalDeFrames(ex)).toBe(3);          // padrão · MACHO · ALUCARD
    expect(ex.frame).toEqual(HEROI.frame);       // mesma célula do herói
  });
});
