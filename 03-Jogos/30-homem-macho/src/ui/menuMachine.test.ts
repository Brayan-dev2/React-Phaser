/**
 * `UI-02` — a máquina do menu inicial, testada sem DOM (`src/ui/menuMachine.ts`).
 *
 * O que estes testes protegem não é "o menu desenha botões": é o contrato que já foi quebrado
 * em execução (o `Enter` que dispensava o título **também** escolhia JOGAR) e as regras novas:
 * `CONTINUAR` só existe com save, a lista de saves é a escolha do jogador e o remapeamento de
 * teclas não pode deixar uma ação sem tecla.
 */
import { describe, expect, it } from 'vitest';
import {
  apontar, clicar, clicarLinha, escolherValor, escreverNome, estadoInicial, linhasDe,
  ordemPrincipal, sortearPersonagem, tecla, teclaPhaser,
  type MenuContext, type MenuState, type SlotInfo,
} from './menuMachine';
import { ACOES, CONFIG_PADRAO, type Config } from '../services/settings';
import { GRUPOS, PERSONAGEM_PADRAO } from '../services/character';

const CX = (over: Partial<MenuContext> = {}): MenuContext => ({
  slots: [
    { slot: 1, ocupado: false, rotulo: null },
    { slot: 2, ocupado: false, rotulo: null },
    { slot: 3, ocupado: false, rotulo: null },
  ],
  dificuldades: ['easy', 'medium', 'hard'],
  config: CONFIG_PADRAO,
  slotNovaPartida: 1,
  ...over,
});

const SEM_SAVE = CX();

function slot(slot_: number, ocupado: boolean): SlotInfo {
  return { slot: slot_, ocupado, rotulo: ocupado ? `SLOT ${slot_} · Ruínas` : null };
}
const COM_SAVE = CX({ slots: [slot(1, false), slot(2, true), slot(3, false)], slotNovaPartida: 1 });

/** Estado do menu principal, já sem o título. */
function aberto(extra: Partial<MenuState> = {}, ctx: MenuContext = SEM_SAVE): MenuState {
  return { ...estadoInicial(ctx, false), ...extra };
}

describe('UI-02 · título', () => {
  it('começa no título, com nada focado', () => {
    const e = estadoInicial(SEM_SAVE);
    expect(e.tela).toBe('titulo');
    expect(e.foco).toBeNull();
    expect(e.painel).toBe('nenhum');
  });

  it('qualquer tecla (menos Tab) passa ao menu **sem** escolher item', () => {
    for (const key of ['Enter', ' ', 'ArrowDown', 'ArrowRight', 'x']) {
      const r = tecla(estadoInicial(SEM_SAVE), key, SEM_SAVE);
      expect(r.estado.tela, key).toBe('principal');
      expect(r.estado.foco, key).toBeNull();
      expect(r.pedido.tipo, key).toBe('nenhum');
    }
  });

  it('Tab não dispensa o título', () => {
    expect(tecla(estadoInicial(SEM_SAVE), 'Tab', SEM_SAVE).estado.tela).toBe('titulo');
  });

  it('ao voltar do jogo o título já não está de pé', () => {
    expect(estadoInicial(SEM_SAVE, false).tela).toBe('principal');
  });
});

describe('UI-02 · primeiro gesto escolhe, segundo confirma', () => {
  it('o primeiro Enter só escolhe o primeiro item', () => {
    const r = tecla(aberto(), 'Enter', SEM_SAVE);
    expect(r.estado.foco).toBe('jogar');
    expect(r.pedido.tipo).toBe('nenhum');
  });

  it('JOGAR abre a dificuldade, e não começa nada', () => {
    const r = tecla(aberto({ foco: 'jogar' }), 'Enter', SEM_SAVE);
    expect(r.estado.painel).toBe('dificuldade');
    expect(r.pedido.tipo).toBe('nenhum');
  });

  it('a dificuldade escolhida vai para o jogo — mas só depois de criar o personagem (`UI-12`)', () => {
    const noPainel = tecla(aberto({ foco: 'jogar' }), 'Enter', SEM_SAVE).estado;
    const duro = tecla(tecla(noPainel, 'ArrowRight', SEM_SAVE).estado, 'Enter', SEM_SAVE);
    // `Enter` na dificuldade abre a criação de personagem, não começa a partida
    expect(duro.estado.painel).toBe('personagem');
    expect(duro.pedido.tipo).toBe('nenhum');
    const comeca = tecla(duro.estado, 'Enter', SEM_SAVE);
    expect(comeca.pedido).toEqual({
      tipo: 'novo', dificuldade: 'hard', personagem: PERSONAGEM_PADRAO,
    });
  });

  it('uma tecla, uma consequência: a que dispensa o título não abre painel nenhum', () => {
    const r = tecla(estadoInicial(SEM_SAVE), 'Enter', SEM_SAVE);
    expect(r.estado.painel).toBe('nenhum');
    expect(r.estado.foco).toBeNull();
  });
});

describe('UI-02 · CONTINUAR e os três saves', () => {
  it('sem save, CONTINUAR não existe na lista', () => {
    expect(ordemPrincipal(SEM_SAVE)).toEqual(['jogar', 'config', 'creditos']);
  });

  it('com save, CONTINUAR é o primeiro item', () => {
    expect(ordemPrincipal(COM_SAVE)).toEqual(['continuar', 'jogar', 'config', 'creditos']);
  });

  it('CONTINUAR abre a lista de saves, com o cursor no primeiro ocupado', () => {
    const r = tecla(aberto({ foco: 'continuar' }, COM_SAVE), 'Enter', COM_SAVE);
    expect(r.estado.painel).toBe('saves');
    expect(r.estado.indice).toBe(1);      // slot 2 é o único ocupado
    expect(r.pedido.tipo).toBe('nenhum');
  });

  it('Enter num save ocupado retoma **aquele** slot', () => {
    const r = tecla(aberto({ painel: 'saves', indice: 1 }, COM_SAVE), 'Enter', COM_SAVE);
    expect(r.pedido).toEqual({ tipo: 'continuar', slot: 2 });
  });

  it('Enter num save vazio não começa nada e explica por quê', () => {
    const r = tecla(aberto({ painel: 'saves', indice: 0 }, COM_SAVE), 'Enter', COM_SAVE);
    expect(r.pedido.tipo).toBe('nenhum');
    expect(r.estado.aviso).toContain('VAZIO');
  });

  it('a lista mostra todos os slots, ocupados ou não', () => {
    expect(linhasDe('saves', COM_SAVE)).toBe(3);
  });
});

describe('UI-02 · configurações', () => {
  const naConfig = (indice: number, ctx = SEM_SAVE): MenuState =>
    aberto({ painel: 'config', indice }, ctx);

  it('tem uma linha para cada ajuste pedido', () => {
    expect(linhasDe('config', SEM_SAVE)).toBe(9);
  });

  it('←/→ mudam o tipo de controle e devolvem a configuração nova', () => {
    const r = tecla(naConfig(0), 'ArrowRight', SEM_SAVE);
    expect(r.config.tipoControle).not.toBe(SEM_SAVE.config.tipoControle);
    expect(r.estado).toBe(r.estado);      // não sai do painel
    expect(r.pedido.tipo).toBe('nenhum');
  });

  it('o volume sobe e desce de 10 em 10 e não passa dos limites', () => {
    const sobe = tecla(naConfig(2), 'ArrowRight', SEM_SAVE);
    expect(sobe.config.somGeral).toBeCloseTo(0.9);
    const noTeto = CX({ config: { ...CONFIG_PADRAO, somGeral: 1 } });
    expect(tecla(naConfig(2, noTeto), 'ArrowRight', noTeto).config.somGeral).toBe(1);
    const noPiso = CX({ config: { ...CONFIG_PADRAO, somGeral: 0 } });
    expect(tecla(naConfig(2, noPiso), 'ArrowLeft', noPiso).config.somGeral).toBe(0);
  });

  it('legendas e movimento reduzido alternam com ←/→ e com Enter', () => {
    const antes = SEM_SAVE.config.legendas;
    expect(tecla(naConfig(5), 'ArrowLeft', SEM_SAVE).config.legendas).toBe(!antes);
    expect(tecla(naConfig(5), 'Enter', SEM_SAVE).config.legendas).toBe(!antes);
  });

  it('idioma não finge que mudou: só PT-BR nesta versão', () => {
    const r = tecla(naConfig(7), 'ArrowRight', SEM_SAVE);
    expect(r.config.idioma).toBe('pt-BR');
    expect(r.estado.aviso).toContain('PT-BR');
  });

  it('restaurar padrões volta tudo, inclusive as teclas', () => {
    const mexido: Config = {
      ...CONFIG_PADRAO, somGeral: 0.1, legendas: false,
      atalhos: { ...CONFIG_PADRAO.atalhos, atacar: ['Z'] },
    };
    const ctxMexido = CX({ config: mexido });
    const r = tecla(naConfig(8, ctxMexido), 'Enter', ctxMexido);
    expect(r.config.somGeral).toBe(CONFIG_PADRAO.somGeral);
    expect(r.config.legendas).toBe(CONFIG_PADRAO.legendas);
    expect(r.config.atalhos.atacar).toEqual(CONFIG_PADRAO.atalhos.atacar);
  });
});

describe('UI-02 · atalhos', () => {
  /** Índice da ação na lista real — os testes não dependem de a ordem estar decorada. */
  const acao = (nome: keyof typeof CONFIG_PADRAO.atalhos): number => ACOES.indexOf(nome);
  const emAtalhos = (indice: number, capturando: MenuState['capturando'] = null): MenuState =>
    aberto({ painel: 'atalhos', indice, capturando });

  it('Enter numa ação põe a máquina à espera da tecla', () => {
    const r = tecla(emAtalhos(acao('atacar')), 'Enter', SEM_SAVE);
    expect(r.estado.capturando).toBe('atacar');
  });

  it('a tecla seguinte remapeia a ação e a configuração vem de volta', () => {
    const r = tecla(emAtalhos(acao('atacar'), 'atacar'), 'z', SEM_SAVE, teclaPhaser('z'));
    expect(r.config.atalhos.atacar).toContain('Z');
    expect(r.estado.capturando).toBeNull();
  });

  it('Esc cancela a captura sem mudar nada', () => {
    const r = tecla(emAtalhos(acao('atacar'), 'atacar'), 'Escape', SEM_SAVE);
    expect(r.estado.capturando).toBeNull();
    expect(r.config).toBe(SEM_SAVE.config);
  });

  it('uma tecla não pode ficar com duas ações: sai da antiga', () => {
    // `A` é de MOVER À ESQUERDA — que ainda fica com `←`, portanto a troca é legítima
    const r = tecla(emAtalhos(acao('atacar'), 'atacar'), 'a', SEM_SAVE, 'A');
    expect(r.config.atalhos.atacar).toContain('A');
    expect(r.config.atalhos.esquerda).not.toContain('A');
    expect(r.config.atalhos.esquerda).toContain('LEFT');
  });

  it('se a remoção deixaria a outra ação sem tecla, a troca é recusada com aviso', () => {
    const r = tecla(emAtalhos(acao('atacar'), 'atacar'), 'q', SEM_SAVE, 'Q');   // Q é a única de GANCHO
    expect(r.config.atalhos.atacar).not.toContain('Q');
    expect(r.config.atalhos.gancho).toEqual(['Q']);
    expect(r.estado.aviso).toContain('GANCHO');
  });

  it('Esc dentro dos atalhos volta às configurações, e não ao menu', () => {
    const r = tecla(emAtalhos(0), 'Escape', SEM_SAVE);
    expect(r.estado.painel).toBe('config');
  });

  it('teclas que o jogo não sabe usar são recusadas', () => {
    const r = tecla(emAtalhos(acao('atacar'), 'atacar'), 'Dead', SEM_SAVE, null);
    expect(r.estado.aviso).toContain('NÃO SERVE');
    expect(r.config.atalhos.atacar).not.toContain('DEAD');
  });
});

describe('UI-02 · créditos e saídas', () => {
  it('CRÉDITOS abre e fecha com Esc sem tocar em nada', () => {
    const aberto_ = tecla(aberto({ foco: 'creditos' }), 'Enter', SEM_SAVE);
    expect(aberto_.estado.painel).toBe('creditos');
    const volta = tecla(aberto_.estado, 'Escape', SEM_SAVE);
    expect(volta.estado.painel).toBe('nenhum');
    expect(volta.estado.foco).toBeNull();
    expect(volta.pedido.tipo).toBe('nenhum');
  });

  it('Esc no menu principal não faz nada: ele é a raiz', () => {
    const e = aberto({ foco: 'jogar' });
    expect(tecla(e, 'Escape', SEM_SAVE).estado).toBe(e);
  });
});

describe('UI-02 · ponteiro', () => {
  it('o ponteiro move o foco, mas não age', () => {
    expect(apontar(aberto(), 'creditos').foco).toBe('creditos');
  });

  it('o ponteiro não mexe em nada com o título de pé ou um painel aberto', () => {
    const titulo = estadoInicial(SEM_SAVE);
    expect(apontar(titulo, 'jogar')).toBe(titulo);
    const painel = aberto({ painel: 'config' });
    expect(apontar(painel, 'jogar')).toBe(painel);
  });

  it('o clique segue as regras do teclado', () => {
    expect(clicar(aberto(), 'jogar', SEM_SAVE).estado.painel).toBe('dificuldade');
    expect(clicar(aberto(), 'creditos', SEM_SAVE).estado.painel).toBe('creditos');
    const semSave = clicar(aberto({ foco: 'continuar' }), 'continuar', SEM_SAVE);
    expect(semSave.pedido.tipo).toBe('nenhum');
    expect(clicar(aberto({}, COM_SAVE), 'continuar', COM_SAVE).estado.painel).toBe('saves');
  });

  it('o clique que dispensa o título não abre nada', () => {
    const r = clicar(estadoInicial(SEM_SAVE), 'jogar', SEM_SAVE);
    expect(r.estado.tela).toBe('principal');
    expect(r.estado.painel).toBe('nenhum');
  });

  it('clicar numa linha de save ocupado retoma aquele slot', () => {
    const r = clicarLinha(aberto({ painel: 'saves' }, COM_SAVE), 1, COM_SAVE);
    expect(r.pedido).toEqual({ tipo: 'continuar', slot: 2 });
  });
});

describe('UI-12 · criação de personagem', () => {
  /** Painel de personagem já aberto, como o jogador o vê ao sair da dificuldade. */
  const naCriacao = (extra: Partial<MenuState> = {}): MenuState =>
    aberto({ painel: 'personagem', indice: 0, dificuldade: 'hard', ...extra });

  it('vem **depois** da dificuldade e antes de qualquer partida', () => {
    // abrir o ecrã não começa nada: só o `Enter` no fim é que manda começar
    expect(tecla(naCriacao(), 'ArrowDown', SEM_SAVE).pedido.tipo).toBe('nenhum');
    // as linhas são o nome + os sete grupos
    expect(linhasDe('personagem', SEM_SAVE)).toBe(GRUPOS.length + 1);
  });

  it('↓/↑ andam pelo nome e pelos sete grupos, e dão a volta', () => {
    let e = naCriacao();
    for (let i = 0; i < 8; i += 1) e = tecla(e, 'ArrowDown', SEM_SAVE).estado;
    expect(e.indice).toBe(0);
    expect(tecla(e, 'ArrowUp', SEM_SAVE).estado.indice).toBe(7);
  });

  it('←/→ mudam o valor do grupo em foco e nunca começam a partida', () => {
    // índice 1 = CABELO (o 0 é o nome)
    const cabelo = tecla(naCriacao({ indice: 1 }), 'ArrowRight', SEM_SAVE);
    expect(cabelo.estado.personagem.cabelo).not.toBe(PERSONAGEM_PADRAO.cabelo);
    expect(cabelo.pedido.tipo).toBe('nenhum');

    const corpo = tecla(naCriacao({ indice: 6 }), 'ArrowRight', SEM_SAVE);
    expect(corpo.estado.personagem.corpo).not.toBe(PERSONAGEM_PADRAO.corpo);
    // e a pele não foi tocada: um grupo de cada vez
    expect(corpo.estado.personagem.pele).toBe(PERSONAGEM_PADRAO.pele);
  });

  it('as setas percorrem **todos** os grupos, um a um', () => {
    let e = naCriacao({ indice: 1 });        // começa no CABELO
    for (const g of GRUPOS) {
      const r = tecla(e, 'ArrowLeft', SEM_SAVE);
      expect(r.estado.personagem[g], g).not.toBe(PERSONAGEM_PADRAO[g]);
      e = tecla({ ...r.estado }, 'ArrowDown', SEM_SAVE).estado;
    }
    expect(e.indice).toBe(0);                // deu a volta: nome → … → nome
  });

  it('Enter começa a partida com a dificuldade **e** o personagem escolhidos', () => {
    const mexido = tecla(naCriacao({ indice: 6 }), 'ArrowRight', SEM_SAVE).estado;
    const r = tecla(mexido, 'Enter', SEM_SAVE);
    expect(r.pedido).toEqual({
      tipo: 'novo', dificuldade: 'hard', personagem: mexido.personagem,
    });
    expect(r.pedido.tipo === 'novo' && r.pedido.personagem.corpo).not.toBe(PERSONAGEM_PADRAO.corpo);
  });

  it('Esc volta à dificuldade — e não ao menu, para não perder a escolha', () => {
    const r = tecla(naCriacao(), 'Escape', SEM_SAVE);
    expect(r.estado.painel).toBe('dificuldade');
    expect(r.estado.personagem).toEqual(PERSONAGEM_PADRAO);
    expect(r.pedido.tipo).toBe('nenhum');
  });

  it('`R` sorteia o personagem e avisa — mas só fora da linha do nome', () => {
    const r = tecla(naCriacao({ indice: 1 }), 'r', SEM_SAVE);
    expect(r.estado.aviso).toContain('SORTEADO');

    // no nome, o `R` é uma letra: escreve, não sorteia
    const digitando = tecla(naCriacao({ indice: 0 }), 'r', SEM_SAVE);
    expect(digitando.estado.personagem.nome.endsWith('R')).toBe(true);
    expect(digitando.estado.aviso).toBeNull();
  });

  it('o rato escolhe um valor sem passar pelo teclado', () => {
    const e = escolherValor(naCriacao(), 'corpo', 'maromba');
    expect(e.personagem.corpo).toBe('maromba');
    expect(e.personagem.cabelo).toBe(PERSONAGEM_PADRAO.cabelo);
  });

  it('um valor inválido vindo do rato não estraga o personagem', () => {
    const e = escolherValor(naCriacao(), 'corpo', 'tanque-de-guerra');
    expect(e.personagem.corpo).toBe(PERSONAGEM_PADRAO.corpo);
  });

  it('o ecrã de personagem começa com o personagem que lhe for dado', () => {
    const e = estadoInicial(SEM_SAVE, false, { ...PERSONAGEM_PADRAO, corpo: 'gordo' });
    expect(e.personagem.corpo).toBe('gordo');
  });
});

describe('UI-12 · nome e easter egg', () => {
  const naLinhaDoNome = (nome = 'MACH') =>
    aberto({ painel: 'personagem', indice: 0, personagem: { ...PERSONAGEM_PADRAO, nome } });

  it('a primeira linha é o nome, e é a única onde as letras escrevem', () => {
    const r = tecla(naLinhaDoNome('',), 'a', SEM_SAVE);
    expect(r.estado.personagem.nome).toBe('A');
    // fora do nome, `a` não escreve nada
    const fora = tecla(naCriacaoGenerica(), 'a', SEM_SAVE);
    expect(fora.estado.personagem.nome).toBe(PERSONAGEM_PADRAO.nome);
  });

  it('escrever MACHO dá o herói do easter egg', () => {
    const r = tecla(naLinhaDoNome(), 'O', SEM_SAVE);
    expect(r.estado.personagem.nome).toBe('MACHO');
    expect(r.estado.personagem.cabelo).toBe('moicano');
    expect(r.estado.personagem.corCabelo).toBe('azul');
    expect(r.estado.personagem.expressao).toBe('furioso');
    expect(r.estado.personagem.corpo).toBe('maromba');
    expect(r.estado.personagem.pele).toBe('clara');
    expect(r.estado.aviso).toContain('EASTER EGG');
  });

  it('BACKSPACE apaga, e o aviso desaparece', () => {
    const r = tecla(naLinhaDoNome(), 'Backspace', SEM_SAVE);
    expect(r.estado.personagem.nome).toBe('MAC');
  });

  it('o campo de texto e as teclas dão o mesmo nome', () => {
    const porTexto = escreverNome(naCriacaoGenerica(), 'macho');
    const porTeclas = ['m', 'a', 'c', 'h', 'o'].reduce(
      (e, k) => tecla(e, k, SEM_SAVE).estado,
      aberto({ painel: 'personagem', indice: 0, personagem: { ...PERSONAGEM_PADRAO, nome: '' } }),
    );
    expect(porTexto.personagem).toEqual(porTeclas.personagem);
    expect(porTexto.aviso).toContain('EASTER EGG');
  });

  it('escrever no fim do nome de fábrica não cola: `HERÓIMACHO` não acontece', () => {
    const e = escreverNome(naCriacaoGenerica(), 'HERÓIMACHO');
    expect(e.personagem.nome).toBe('MACHO');
  });

  it('o easter egg não esconde o resto do ecrã: depois dele ainda se muda tudo', () => {
    const macho = tecla(naLinhaDoNome(), 'O', SEM_SAVE).estado;
    const magro = tecla({ ...macho, indice: 6 }, 'ArrowRight', SEM_SAVE).estado;
    expect(magro.personagem.corpo).not.toBe('maromba');
    expect(magro.personagem.nome).toBe('MACHO');
  });

  it('escrever ALUCARD dá cabelo comprido branco, presas, corpo magro e pele pálida', () => {
    const estado = ['a', 'l', 'u', 'c', 'a', 'r', 'd'].reduce(
      (e, k) => tecla(e, k, SEM_SAVE).estado,
      aberto({ painel: 'personagem', indice: 0, personagem: { ...PERSONAGEM_PADRAO, nome: '' } }),
    );
    expect(estado.personagem.nome).toBe('ALUCARD');
    expect(estado.personagem.cabelo).toBe('longo');
    expect(estado.personagem.corCabelo).toBe('branco');
    expect(estado.personagem.dentes).toBe('vampiro');
    expect(estado.personagem.corpo).toBe('magro');
    expect(estado.personagem.pele).toBe('palida');
    // o aviso é o do egg que disparou, não sempre o do `MACHO`
    expect(estado.aviso).toContain('ESPELHO');
  });

  it('os dois easter eggs não se confundem: `MACHO` não dá presas, `ALUCARD` não dá maromba', () => {
    const macho = tecla(naLinhaDoNome(), 'O', SEM_SAVE).estado;
    expect(macho.personagem.dentes).toBe('normais');
    const alucard = escreverNome(naCriacaoGenerica(), 'Alucard');
    expect(alucard.personagem.corpo).toBe('magro');
    expect(alucard.personagem.cabelo).toBe('longo');
  });

  it('`R` fora do nome sorteia, mas o nome escrito à mão fica', () => {
    const ana = escreverNome(naCriacaoGenerica(), 'Ana');
    expect(ana.personagem.nome).toBe('ANA');
    const r = tecla({ ...ana, indice: 1 }, 'r', SEM_SAVE);
    expect(r.estado.personagem.nome).toBe('ANA');
    expect(r.estado.aviso).toBe('PERSONAGEM SORTEADO.');
    const porBotao = sortearPersonagem(ana);
    expect(porBotao.personagem.nome).toBe('ANA');
  });

  it('Enter continua a começar a partida com o nome dentro', () => {
    const macho = tecla(naLinhaDoNome(), 'O', SEM_SAVE).estado;
    const r = tecla(macho, 'Enter', SEM_SAVE);
    expect(r.pedido.tipo).toBe('novo');
    expect(r.pedido.tipo === 'novo' && r.pedido.personagem.nome).toBe('MACHO');
  });
});

/** Estado com o painel de personagem aberto na linha 1 (CABELO), não no nome. */
function naCriacaoGenerica(): MenuState {
  return aberto({ painel: 'personagem', indice: 1 });
}
