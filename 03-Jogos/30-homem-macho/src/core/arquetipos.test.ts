import { describe, expect, it } from 'vitest';
import {
  ARQUETIPOS, ARQUETIPO_IDS, REACAO_MINIMA_MS, VARIANTES, arquetipoDoGlifo, censoDeGrade,
  duracaoAtaque, ePerigoso, golpear, passoComum, resolverVariante, varianteValida,
  varianteValidaEm, type CorpoComum,
} from './arquetipos';

const ctx = (o: Partial<{ jogadorX: number; jogadorY: number; agora: number; minX: number; maxX: number }> = {}) => ({
  jogadorX: o.jogadorX ?? 9999, jogadorY: o.jogadorY ?? 0,
  minX: o.minX ?? -100, maxX: o.maxX ?? 100, minY: 0, maxY: 100,
  agora: o.agora ?? 0, deltaMs: 16,
});

const corpo = (o: Partial<CorpoComum> = {}): CorpoComum => ({
  x: 0, y: 0, vx: 0, vy: 0, facing: 1, estado: 'patrulha', ate: 0, hp: 20, morto: false, ...o,
});

describe('arquétipos de inimigo comum (`ENT-010`)', () => {
  it('são três, e cada um tem um `ENT` e uma letra de grade próprios', () => {
    expect(ARQUETIPO_IDS).toHaveLength(3);
    const ents = new Set(ARQUETIPO_IDS.map((i) => ARQUETIPOS[i].ent));
    const glifos = new Set(ARQUETIPO_IDS.map((i) => ARQUETIPOS[i].glifo));
    expect(ents.size).toBe(3);
    expect(glifos.size).toBe(3);
  });

  it('o telegrafo de todos fica acima do piso de reação (`P2`)', () => {
    for (const id of ARQUETIPO_IDS) {
      expect(ARQUETIPOS[id].telegraphMs).toBeGreaterThanOrEqual(REACAO_MINIMA_MS);
    }
  });

  it('quem atira não investe, e quem atira declara o que sai do corpo', () => {
    expect(ARQUETIPOS.atirador.ataque).toBe('projetil');
    expect(ARQUETIPOS.atirador.projetil?.velocidadePx).toBeGreaterThan(0);
    expect(ARQUETIPOS.sentinela.projetil).toBeUndefined();
    expect(ARQUETIPOS.voador.projetil).toBeUndefined();
  });

  it('a letra da grade encontra o arquétipo — e as letras que já têm dono não são inimigos', () => {
    expect(arquetipoDoGlifo('E')?.id).toBe('sentinela');
    expect(arquetipoDoGlifo('T')?.id).toBe('atirador');
    expect(arquetipoDoGlifo('V')?.id).toBe('voador');
    // `A` é espinho, `S` é spawn, `P` é ponto de salvamento
    expect(arquetipoDoGlifo('A')).toBeNull();
    expect(arquetipoDoGlifo('S')).toBeNull();
    expect(arquetipoDoGlifo('P')).toBeNull();
  });

  it('as variantes do piloto são válidas, e uma variante rápida de mais é recusada', () => {
    for (const nome of Object.keys(VARIANTES)) expect(varianteValida(nome)).toBeNull();
    expect(varianteValida('nao-existe')).toContain('não existe');
    /*
     * E o contrário também se prova: uma variante que avisa em 100 ms **reprova**, mesmo sendo do
     * arquétipo certo. A tabela é congelada para leitura (`Readonly`) de propósito — se um setor
     * pudesse reescrevê-la, o piso de reação deixava de ser uma regra e passava a ser um hábito.
     * Por isso se passa uma tabela local a `varianteValidaEm`, e não se mexe em `VARIANTES`.
     */
    const rapida = { 'teste-rapido': { arquetipo: 'sentinela' as const, hp: 20, dano: 10, telegraphMs: 100 } };
    expect(varianteValidaEm(rapida, 'teste-rapido')).toContain('abaixo do piso');
  });

  it('resolver uma variante aplica os números do setor e mantém os tempos do arquétipo', () => {
    const v = resolverVariante('L01-voador');
    expect(v?.id).toBe('voador');
    expect(v?.dano).toBe(10);
    expect(v?.telegraphMs).toBe(600);             // do setor
    expect(v?.recoverMs).toBe(ARQUETIPOS.voador.recoverMs); // do arquétipo
    expect(resolverVariante('nao-existe')).toBeNull();
  });
});

describe('o ciclo de vida do inimigo comum', () => {
  it('em patrulha anda e vira no limite, sem nunca sair da faixa', () => {
    let c = corpo({ x: 90, facing: 1 });
    for (let i = 0; i < 40; i++) c = passoComum(c, ARQUETIPOS.sentinela, ctx({ agora: i * 16, maxX: 100 }));
    expect(c.x).toBeLessThanOrEqual(100);
    expect(c.facing).toBe(-1);       // bateu no limite e voltou
  });

  it('não ataca quem está longe: o alcance é uma decisão, não um acidente', () => {
    const c = passoComum(corpo(), ARQUETIPOS.sentinela, ctx({ jogadorX: 900 }));
    expect(c.estado).toBe('patrulha');
  });

  it('avisa antes de atacar, e o aviso é medível', () => {
    const viu = passoComum(corpo(), ARQUETIPOS.sentinela, ctx({ jogadorX: 60 }));
    expect(viu.estado).toBe('telegrafo');
    expect(viu.ate).toBe(ARQUETIPOS.sentinela.telegraphMs);
    // durante o aviso o corpo não se mexe
    const noAviso = passoComum({ ...viu, x: 10 }, ARQUETIPOS.sentinela, ctx({ jogadorX: 60, agora: 100 }));
    expect(noAviso.vx).toBe(0);
    expect(noAviso.x).toBe(10);
  });

  it('só é perigoso durante o ataque — a picada e o aviso não magoam', () => {
    const aviso = corpo({ estado: 'telegrafo', ate: 800 });
    const ataque = corpo({ estado: 'ataque', ate: 1000 });
    const rec = corpo({ estado: 'recupera', ate: 2000 });
    expect(ePerigoso(aviso)).toBe(false);
    expect(ePerigoso(ataque)).toBe(true);
    expect(ePerigoso(rec)).toBe(false);
  });

  it('depois do ataque há sempre uma janela indefesa, e depois dela volta a patrulhar', () => {
    const ataque = corpo({ estado: 'ataque', ate: 100, facing: 1 });
    const rec = passoComum(ataque, ARQUETIPOS.sentinela, ctx({ agora: 150 }));
    expect(rec.estado).toBe('recupera');
    expect(rec.ate).toBe(150 + ARQUETIPOS.sentinela.recoverMs);
    const volta = passoComum(rec, ARQUETIPOS.sentinela, ctx({ agora: 9999 }));
    expect(volta.estado).toBe('patrulha');
  });

  it('a investida corre para a frente; quem atira fica no sítio', () => {
    const investe = passoComum(corpo({ estado: 'ataque', ate: 999, facing: 1 }), ARQUETIPOS.sentinela, ctx());
    expect(investe.vx).toBeGreaterThan(0);
    const atira = passoComum(corpo({ estado: 'ataque', ate: 999, facing: 1 }), ARQUETIPOS.atirador, ctx());
    expect(atira.vx).toBe(0);
  });

  it('a picada desce — o voador ataca em profundidade, não em linha reta', () => {
    const pica = passoComum(corpo({ estado: 'ataque', ate: 999 }), ARQUETIPOS.voador, ctx());
    expect(pica.vy).toBeGreaterThan(0);
  });

  it('o voador procura o jogador em duas dimensões; a sentinela só na horizontal', () => {
    // jogador 120 px acima e 60 à frente: o voador vê, a sentinela não
    const alto = ctx({ jogadorX: 60, jogadorY: -120 });
    expect(passoComum(corpo(), ARQUETIPOS.voador, alto).estado).toBe('telegrafo');
    expect(passoComum(corpo(), ARQUETIPOS.sentinela, alto).estado).toBe('patrulha');
  });

  it('um golpe pode não matar; o golpe que mata devolve `matou` e o corpo morto não ataca', () => {
    const c = corpo({ hp: 10 });
    const primeiro = golpear(c, 4);
    expect(primeiro.matou).toBe(false);
    expect(primeiro.corpo.hp).toBe(6);
    const segundo = golpear(primeiro.corpo, 6);
    expect(segundo.matou).toBe(true);
    expect(segundo.corpo.estado).toBe('morto');
    // um morto não é atingido duas vezes (não dá duas moedas)
    expect(golpear(segundo.corpo, 99).matou).toBe(false);
    expect(passoComum(segundo.corpo, ARQUETIPOS.sentinela, ctx({ jogadorX: 0 }))).toEqual(segundo.corpo);
  });

  it('a duração do ataque é do arquétipo, não do setor', () => {
    expect(duracaoAtaque(ARQUETIPOS.sentinela)).toBe(200);
    expect(duracaoAtaque(ARQUETIPOS.voador)).toBe(450);
    expect(duracaoAtaque(ARQUETIPOS.atirador)).toBe(120);
  });
});

describe('censo de uma sala', () => {
  it('conta os três arquétipos e ignora armadilhas, spawn e salvamento', () => {
    const c = censoDeGrade([
      '####################',
      '#.....E.......T....#',
      '#..........V....A..#',
      '#S........P........#',
      '####################',
    ]);
    expect(c.total).toBe(3);
    expect(c.porArquetipo).toEqual({ sentinela: 1, atirador: 1, voador: 1 });
  });

  it('uma sala sem inimigos conta zero', () => {
    expect(censoDeGrade(['####', '#..#', '####']).total).toBe(0);
  });
});
