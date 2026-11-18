/**
 * `UI-12` — o personagem (`services/character.ts`).
 *
 * Este ficheiro é o contrato entre três camadas: o menu que desenha a prévia, o `BootScene` que
 * desenha o herói em jogo e o save que guarda a escolha. Um `undefined` aqui aparece como uma
 * cor `NaN` no sprite — e um sprite invisível no meio de uma sala não dá erro nenhum.
 */
import { describe, expect, it } from 'vitest';
import {
  CABELOS, CORES_CABELO, CORPOS, EASTER_EGGS, EXPRESSOES, GRUPOS, MARCAS, PELES,
  PERSONAGEM_PADRAO, ROSTOS, aplicarEasterEgg, ciclar, descreverPersonagem, digitarNome,
  easterEggDe, formaCorpo, mesmoNome, nomeDeFabrica, normalizarNome, normalizarPersonagem,
  opcoesDe, personagemAleatorio, rotuloGrupo, rotuloValor, temPresas, tomCabelo, tomPele,
} from './character';

describe('personagem · catálogo', () => {
  it('tem todos os grupos que o ecrã promete', () => {
    expect(GRUPOS).toEqual([
      'cabelo', 'corCabelo', 'rosto', 'expressao', 'marca', 'corpo', 'pele',
    ]);
    for (const g of GRUPOS) expect(rotuloGrupo(g).length).toBeGreaterThan(0);
  });

  it('sete cabelos, quatro rostos, cinco expressões, seis marcas, cinco corpos, sete peles', () => {
    expect(CABELOS.length).toBe(7);
    expect(CORES_CABELO.length).toBe(7);
    expect(ROSTOS.length).toBe(4);
    expect(EXPRESSOES.length).toBe(5);
    expect(MARCAS.length).toBe(6);
    expect(CORPOS.length).toBe(5);
    expect(PELES.length).toBe(7);          // o `pálida` do `ALUCARD` é escolhível por todos
  });

  it('o tom `pálida` existe e é mais claro do que o `clara`', () => {
    const clara = PELES.find((t) => t.id === 'clara')!;
    const palida = PELES.find((t) => t.id === 'palida')!;
    const lum = (hex: string): number => [1, 3, 5]
      .reduce((soma, i) => soma + Number.parseInt(hex.slice(i, i + 2), 16), 0);
    expect(palida.rotulo).toBe('PÁLIDA');
    expect(lum(palida.base)).toBeGreaterThan(lum(clara.base));
  });

  it('as presas não são um grupo do ecrã: ficam fora de `GRUPOS`', () => {
    expect(GRUPOS).not.toContain('dentes');
    expect(PERSONAGEM_PADRAO.dentes).toBe('normais');
  });

  it('os cinco tipos de corpo que o pedido nomeia existem, com esses nomes', () => {
    expect(CORPOS.map((c) => c.rotulo)).toEqual([
      'MAGRO', 'ATLÉTICO', 'FORTE', 'MAROMBA', 'GORDO',
    ]);
  });

  it('todo o valor tem id, rótulo e uma linha de explicação', () => {
    for (const g of GRUPOS) {
      for (const o of opcoesDe(g)) {
        expect(o.id, g).toBeTruthy();
        expect(o.rotulo, g).toBeTruthy();
        expect(o.linha.length, `${g}/${o.id}`).toBeGreaterThan(10);
      }
    }
  });

  it('ids são únicos dentro de cada grupo', () => {
    for (const g of GRUPOS) {
      const ids = opcoesDe(g).map((o) => o.id);
      expect(new Set(ids).size, g).toBe(ids.length);
    }
  });

  it('tons de pele e de cabelo são hex de seis dígitos (servem ao `Graphics` e ao CSS)', () => {
    for (const t of [...PELES, ...CORES_CABELO]) {
      expect(t.base, t.id).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(t.sombra, t.id).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('os corpos diferem em ombro, tronco e cintura — não são só uma cor', () => {
    const ombros = CORPOS.map((c) => c.ombro);
    expect(new Set(ombros).size).toBe(CORPOS.length);
    const maromba = CORPOS.find((c) => c.id === 'maromba')!;
    const magro = CORPOS.find((c) => c.id === 'magro')!;
    expect(maromba.ombro).toBeGreaterThan(magro.ombro);
    expect(CORPOS.find((c) => c.id === 'gordo')!.cintura).toBeGreaterThan(magro.cintura);
  });
});

describe('personagem · normalização', () => {
  it('sem nada, devolve o padrão', () => {
    expect(normalizarPersonagem(null)).toEqual(PERSONAGEM_PADRAO);
    expect(normalizarPersonagem(undefined)).toEqual(PERSONAGEM_PADRAO);
    expect(normalizarPersonagem('lixo')).toEqual(PERSONAGEM_PADRAO);
  });

  it('campo inválido cai no padrão **só desse campo**', () => {
    const p = normalizarPersonagem({ cabelo: 'moicano', corpo: 'tanque', pele: 'azul-marinho' });
    expect(p.cabelo).toBe('moicano');
    expect(p.corpo).toBe(PERSONAGEM_PADRAO.corpo);
    expect(p.pele).toBe(PERSONAGEM_PADRAO.pele);
  });

  it('save antigo (sem personagem nenhum) abre com um herói válido', () => {
    const p = normalizarPersonagem({ areaId: 'LVL-01', hp: 40 });
    expect(p).toEqual(PERSONAGEM_PADRAO);
  });
});

describe('personagem · ciclar e rótulos', () => {
  it('ciclar muda um grupo e só um', () => {
    const p = ciclar(PERSONAGEM_PADRAO, 'corpo', 1);
    expect(p.corpo).not.toBe(PERSONAGEM_PADRAO.corpo);
    expect(p.cabelo).toBe(PERSONAGEM_PADRAO.cabelo);
  });

  it('ciclar dá a volta nos dois sentidos', () => {
    const primeiro = opcoesDe('pele')[0].id;
    const noPrimeiro = { ...PERSONAGEM_PADRAO, pele: primeiro as never };
    expect(ciclar(noPrimeiro, 'pele', -1).pele).toBe(opcoesDe('pele').at(-1)!.id);
    const ultimo = opcoesDe('pele').at(-1)!.id;
    expect(ciclar({ ...PERSONAGEM_PADRAO, pele: ultimo as never }, 'pele', 1).pele).toBe(primeiro);
  });

  it('os rótulos saem em maiúsculas legíveis, não em `id`', () => {
    expect(rotuloValor('corpo', PERSONAGEM_PADRAO)).toBe('ATLÉTICO');
    expect(rotuloValor('corCabelo', PERSONAGEM_PADRAO)).toBe('PRETO');
    expect(rotuloValor('marca', PERSONAGEM_PADRAO)).toBe('NENHUMA');
  });

  it('a descrição acessível cobre as sete escolhas', () => {
    const d = descreverPersonagem(PERSONAGEM_PADRAO);
    expect(d.toLowerCase()).toContain('cabelo curto preto');
    expect(d).toContain('corpo atlético');
    expect(d).toContain('pele média');
  });

  it('tomPele / tomCabelo / formaCorpo devolvem sempre um objeto válido', () => {
    const quebrado = { ...PERSONAGEM_PADRAO, pele: 'inexistente' } as never;
    expect(tomPele(quebrado).base).toMatch(/^#/);
    expect(tomCabelo(quebrado).base).toMatch(/^#/);
    expect(formaCorpo(quebrado).ombro).toBeGreaterThan(0);
  });
});

describe('personagem · sorteio', () => {
  it('sorteia sempre um personagem válido', () => {
    for (let i = 0; i < 40; i += 1) {
      const p = personagemAleatorio();
      expect(normalizarPersonagem(p)).toEqual(p);
    }
  });

  it('não repete o valor que já estava escolhido (o botão tem de parecer que funcionou)', () => {
    // sorteio a 0 → escolheria sempre o primeiro; com o mesmo valor, salta para o seguinte
    const p = personagemAleatorio(() => 0);
    const atual = { ...PERSONAGEM_PADRAO, cabelo: CABELOS[0].id, corpo: CORPOS[0].id };
    const r = personagemAleatorio(() => 0);
    expect(r.cabelo).toBe(atual.cabelo === CABELOS[0].id ? CABELOS[1].id : r.cabelo);
    expect(r).toEqual(p);
  });

  it('com sorteio fixo o resultado é determinístico (testável)', () => {
    expect(personagemAleatorio(() => 0.42)).toEqual(personagemAleatorio(() => 0.42));
  });
});

describe('personagem · nome e easter egg', () => {
  it('o nome é guardado em maiúsculas, sem espaços a mais, com teto', () => {
    expect(normalizarNome('  macho ')).toBe('MACHO');
    expect(normalizarNome('joão   da   silva')).toBe('JOÃO DA SILV');   // teto de 12
    expect(normalizarNome('')).toBe(PERSONAGEM_PADRAO.nome);
    expect(normalizarNome(42)).toBe(PERSONAGEM_PADRAO.nome);
  });

  it('o nome de fábrica é um espaço vazio com nome dentro', () => {
    expect(nomeDeFabrica('herói')).toBe(true);
    expect(nomeDeFabrica('MACHO')).toBe(false);
    // uma letra escrita **substitui** o de fábrica, não se cola ao fim
    expect(digitarNome(PERSONAGEM_PADRAO, 'M').personagem.nome).toBe('M');
  });

  it('escrever `Macho` aplica exatamente o que foi pedido', () => {
    let p = PERSONAGEM_PADRAO;
    for (const letra of 'Macho') p = digitarNome(p, letra).personagem;
    expect(p.nome).toBe('MACHO');
    expect(p.cabelo).toBe('moicano');
    expect(p.corCabelo).toBe('azul');
    expect(p.expressao).toBe('furioso');   // "rosto bravo"
    expect(p.corpo).toBe('maromba');
    expect(p.pele).toBe('clara');          // pele clara / "branca"
  });

  it('a última letra é a que dispara, e só ela avisa', () => {
    let p = PERSONAGEM_PADRAO;
    const avisos: boolean[] = [];
    for (const letra of 'Macho') {
      const r = digitarNome(p, letra);
      p = r.personagem;
      avisos.push(r.disparou);
    }
    expect(avisos).toEqual([false, false, false, false, true]);
  });

  it('ignora maiúsculas e acentos: `macho`, `MÁCHO` e ` Macho ` disparam', () => {
    for (const variante of ['macho', 'MÁCHO', 'Macho']) {
      expect(aplicarEasterEgg({ ...PERSONAGEM_PADRAO, nome: variante }).disparou, variante).toBe(true);
    }
    expect(mesmoNome('MÁCHO', 'macho')).toBe(true);
  });

  it('outro nome não mexe em nada', () => {
    const p = { ...PERSONAGEM_PADRAO, nome: 'MACHADO' };
    const r = aplicarEasterEgg(p);
    expect(r.disparou).toBe(false);
    expect(r.personagem).toBe(p);
  });

  it('o easter egg não tranca o resto: o jogador continua a mudar o que quiser depois', () => {
    const p = { ...PERSONAGEM_PADRAO, nome: 'MACHO', corpo: 'magro' as const, pele: 'escura' as const };
    // já não está a ser reavaliado — só um novo `comNome` o reaplica
    expect(p.corpo).toBe('magro');
    expect(ciclar(p, 'corpo', 1).corpo).not.toBe('maromba');
  });

  it('apagar e voltar a escrever dispara outra vez', () => {
    const macho = aplicarEasterEgg({ ...PERSONAGEM_PADRAO, nome: 'MACHO' }).personagem;
    const apagado = digitarNome(macho, '', true).personagem;
    expect(apagado.nome).toBe('MACH');
    let p = apagado;
    const r = digitarNome(p, 'O');
    p = r.personagem;
    expect(r.disparou).toBe(true);
    expect(p.cabelo).toBe('moicano');
  });

  it('o sorteio não apaga o nome escrito à mão', () => {
    const comNome_ = { ...PERSONAGEM_PADRAO, nome: 'ANA' };
    expect(personagemAleatorio(() => 0.3).nome).toBe(PERSONAGEM_PADRAO.nome);
    expect({ ...personagemAleatorio(() => 0.3), nome: comNome_.nome }.nome).toBe('ANA');
  });

  it('escrever `Alucard` aplica exatamente o que foi pedido', () => {
    let p = PERSONAGEM_PADRAO;
    for (const letra of 'Alucard') p = digitarNome(p, letra).personagem;
    expect(p.nome).toBe('ALUCARD');
    expect(p.cabelo).toBe('longo');        // cabelo grande
    expect(p.corCabelo).toBe('branco');
    expect(p.dentes).toBe('vampiro');      // dentes de vampiro
    expect(p.corpo).toBe('magro');
    expect(p.pele).toBe('palida');         // corpo branco pálido
    expect(temPresas(p)).toBe(true);
  });

  it('o `Alucard` não toca no que o pedido não nomeou', () => {
    const antes = { ...PERSONAGEM_PADRAO, rosto: 'angular' as const, marca: 'pintura' as const,
      expressao: 'grito' as const };
    const p = aplicarEasterEgg({ ...antes, nome: 'ALUCARD' }).personagem;
    expect(p.rosto).toBe('angular');
    expect(p.marca).toBe('pintura');
    expect(p.expressao).toBe('grito');
  });

  it('cada easter egg tem nome, aviso próprio e um preset válido', () => {
    expect(EASTER_EGGS.map((e) => e.nome)).toEqual(['MACHO', 'ALUCARD']);
    const avisos = new Set(EASTER_EGGS.map((e) => e.aviso));
    expect(avisos.size).toBe(EASTER_EGGS.length);          // dois eggs, dois avisos
    for (const e of EASTER_EGGS) {
      expect(easterEggDe(e.nome)?.nome, e.nome).toBe(e.nome);
      const p = aplicarEasterEgg({ ...PERSONAGEM_PADRAO, nome: e.nome }).personagem;
      expect(normalizarPersonagem(p)).toEqual(p);          // o preset não sai do catálogo
    }
  });

  it('a descrição acessível diz que o `Alucard` tem presas', () => {
    const p = aplicarEasterEgg({ ...PERSONAGEM_PADRAO, nome: 'ALUCARD' }).personagem;
    expect(descreverPersonagem(p)).toContain('presas de vampiro');
    expect(descreverPersonagem(PERSONAGEM_PADRAO)).not.toContain('presas');
  });

  it('um save antigo sem `dentes` cai em `normais`, e o sorteio nunca dá presas', () => {
    expect(normalizarPersonagem({ nome: 'X' }).dentes).toBe('normais');
    for (let i = 0; i < 20; i += 1) {
      expect(temPresas(personagemAleatorio(() => i / 20))).toBe(false);
    }
  });

  it('a descrição acessível começa pelo nome', () => {
    expect(descreverPersonagem({ ...PERSONAGEM_PADRAO, nome: 'MACHO' })).toMatch(/^MACHO/);
  });

  it('um save antigo sem nome recebe o de fábrica, sem perder o resto', () => {
    const p = normalizarPersonagem({ cabelo: 'coque', corpo: 'forte' });
    expect(p.nome).toBe(PERSONAGEM_PADRAO.nome);
    expect(p.cabelo).toBe('coque');
  });
});
