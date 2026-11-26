/**
 * `UI-02` — o **menu inicial** (`docs/04-interface-e-experiencia.md` §4.1, §4.2, §4.4, §4.6).
 *
 * **Sem marca, sem logo, sem textura.** A arte de abertura (parallax) é do proprietário: aqui há
 * só a **área reservada**, em ecrã inteiro, com a mensagem "PRESSIONE QUALQUER BOTÃO" por cima.
 * Quando a arte chegar, entra dentro de `.menu__cena` e nenhum item do menu se move.
 *
 * O fluxo que este componente desenha:
 *
 * ```
 * título ─(qualquer botão)→ JOGAR · CONTINUAR · CONFIGURAÇÕES · CRÉDITOS
 *                             │        │            │            └ créditos
 *                             │        │            └ configurações ─▶ atalhos
 *                             │        └ saves (escolher qual retomar)
 *                             └ dificuldade ─▶ começar
 * ```
 *
 * Quem decide é `menuMachine.ts` (puro, testado); este ficheiro só trata do que existe apenas no
 * navegador: ouvir o teclado, focar botões e não agir duas vezes pelo mesmo gesto.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MENU } from '../../game/data/tuning';
import type { Difficulty } from '../../core/types';
import type { AcaoJogo, Config } from '../../services/settings';
import { ACOES, TIPOS_CONTROLE } from '../../services/settings';
import {
  apontar, clicar, clicarLinha, escolherValor, escreverNome, estadoInicial, ordemPrincipal,
  sortearPersonagem, tecla, teclaPhaser,
  type MenuContext, type MenuState, type Painel, type Resultado, type SlotInfo,
} from '../menuMachine';
import type { Personagem } from '../../services/character';
import { CharacterScreen } from './CharacterScreen';
import type { SlotVista } from '../useMenuSaves';
import { MenuConfig } from './MenuConfig';

const ROTULO_ACAO_MENU: Record<string, string> = {
  continuar: 'CONTINUAR',
  jogar: 'JOGAR',
  config: 'CONFIGURAÇÕES',
  creditos: 'CRÉDITOS',
};

interface Props {
  /** `false` quando o jogador **volta** ao menu: ele já dispensou o título uma vez. */
  mostrarTitulo?: boolean;
  vistas: SlotVista[];
  slots: SlotInfo[];
  /** Slot que uma partida nova vai ocupar — dito ao jogador antes de ele confirmar. */
  slotNovaPartida: number;
  config: Config;
  dificuldades: readonly Difficulty[];
  /** `UI-12`: o personagem com que a partida deve começar por omissão (o último criado). */
  personagemInicial?: Personagem;
  /** `Falha ao carregar` (`UI-11`): o menu abre mesmo sem save, mas avisa. */
  erro?: string | null;
  onNovo: (dificuldade: Difficulty, personagem: Personagem) => void;
  onContinuar: (slot: number) => void;
  onConfig: (config: Config) => void;
}

const DESCRICAO_DIFICULDADE: Record<Difficulty, string> = {
  easy: '18 de dano viram 13. A leitura é a mesma.',
  medium: 'O jogo como ele foi medido nos 16 setores.',
  hard: '25% mais dano. Nada de novo aparece.',
};

export function MainMenu({
  mostrarTitulo = true, vistas, slots, slotNovaPartida, config, dificuldades,
  personagemInicial, erro, onNovo, onContinuar, onConfig,
}: Props): JSX.Element {
  const ctx: MenuContext = useMemo(() => ({
    slots, dificuldades, config, slotNovaPartida,
  }), [slots, dificuldades, config, slotNovaPartida]);

  const [estado, setEstado] = useState<MenuState>(
    () => estadoInicial(ctx, mostrarTitulo, personagemInicial),
  );
  const botoes = useRef(new Map<string, HTMLButtonElement | null>());

  /** Aplica um resultado da máquina: estado, configuração (se mudou) e o pedido ao `App`. */
  const aplicar = useCallback((r: Resultado): void => {
    setEstado(r.estado);
    if (r.config !== ctx.config) onConfig(r.config);
    switch (r.pedido.tipo) {
      case 'novo': onNovo(r.pedido.dificuldade, r.pedido.personagem); break;
      case 'continuar': onContinuar(r.pedido.slot); break;
      default: break;
    }
  }, [ctx.config, onConfig, onNovo, onContinuar]);

  /**
   * **Um só ouvinte de teclado.** Já houve dois (um em captura para fechar o título, outro em
   * bolha para o menu): o React re-renderizava entre eles e o **mesmo** `Enter` fechava o título
   * e escolhia JOGAR. Um gesto que só devia dispensar o "PRESSIONE" começava uma partida.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      // com um botão realmente focado, o clique nativo é que age: nada de ação dupla
      const noBotao = document.activeElement instanceof HTMLElement
        && !!document.activeElement.closest('button');
      if ((e.key === 'Enter' || e.key === ' ') && noBotao && !estado.capturando) return;
      const r = tecla(estado, e.key, ctx, e.key.length === 1 ? teclaPhaser(e.key) : undefined);
      // `R` no ecrã de personagem: a máquina sorteia; não há pedido nem configuração a mudar
      if (r.estado === estado && r.config === ctx.config && r.pedido.tipo === 'nenhum') return;
      e.preventDefault();
      aplicar(r);
      /*
       * Sair da linha do NOME tem de **tirar o foco do campo de texto**: sem isto, as setas e o
       * `R` continuavam a ir para o `input` (e o nome ganhava letras em vez de o menu reagir).
       */
      if (r.estado.painel === 'personagem' && r.estado.indice !== 0
        && document.activeElement instanceof HTMLInputElement) {
        document.activeElement.blur();
      }
      const alvo = r.estado.foco ?? (r.estado.painel === 'nenhum' ? null : `linha-${r.estado.indice}`);
      if (alvo) botoes.current.get(String(alvo))?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [estado, ctx, aplicar]);

  const apontarPara = (alvo: Parameters<typeof apontar>[1]): void => {
    setEstado((s) => apontar(s, alvo));
  };

  /** O primeiro clique/gesto só dispensa o título — e com ele de pé os itens nem existem no DOM. */
  const dispensaTitulo = (): void => {
    if (estado.tela === 'titulo') setEstado((s) => ({ ...s, tela: 'principal', foco: null }));
  };

  const abrir = (indice: number): void => setEstado({ ...estado, indice });
  const confirmarLinha = (indice: number): void => aplicar(clicarLinha({ ...estado, indice }, indice, ctx));
  const voltar = (): void => {
    const destino: Painel = estado.painel === 'atalhos' ? 'config' : 'nenhum';
    setEstado({ ...estado, painel: destino, indice: 0, foco: null, aviso: null, capturando: null });
  };
  /** Clicar numa ação de atalho põe a máquina à espera da tecla, no índice certo. */
  const capturar = (acao: AcaoJogo): void => {
    const i = Math.max(0, ACOES.indexOf(acao));
    aplicar(clicarLinha({ ...estado, indice: i }, i, ctx));
  };

  const item = (alvo: 'continuar' | 'jogar' | 'config' | 'creditos') => ({
    'data-foco': estado.foco === alvo,
    'aria-current': estado.foco === alvo ? ('true' as const) : undefined,
    onFocus: () => apontarPara(alvo),
    onPointerMove: () => apontarPara(alvo),
    onClick: () => aplicar(clicar(estado, alvo, ctx)),
  });

  const ref = (chave: string) => (el: HTMLButtonElement | null): void => { botoes.current.set(chave, el); };
  const titulo = estado.tela === 'titulo';

  return (
    <div className="menu" role="dialog" aria-modal="true"
      aria-label={titulo ? 'Tela de abertura' : 'Menu inicial'}
      onPointerDown={dispensaTitulo}>

      {/* --- a área da arte de abertura: **reservada**, em ecrã inteiro, e vazia de propósito --- */}
      <div className={titulo ? 'menu__cena' : 'menu__cena menu__cena--fundo'}
        aria-label="Área reservada para a arte de abertura em parallax">
        <span className="menu__cena-etiqueta" aria-hidden="true">
          ARTE DE ABERTURA · RESERVADA (PARALLAX)
        </span>
        {titulo && <p className="menu__press">PRESSIONE QUALQUER BOTÃO</p>}
      </div>

      {!titulo && (
        <div className="menu__corpo">
          <p className="menu__migalha" aria-hidden="true">MENU</p>
          {erro && <p className="menu__erro" role="alert">{erro}</p>}

          {estado.painel === 'nenhum' && (
            <ul className="menu__acoes" role="menu" aria-label="Ações do menu">
              {ordemPrincipal(ctx).map((acao) => (
                <li key={acao}>
                  <button type="button" role="menuitem" className="menu__acao"
                    {...item(acao as 'continuar' | 'jogar' | 'config' | 'creditos')} ref={ref(acao)}>
                    <span className="menu__acao-rotulo">{ROTULO_ACAO_MENU[acao]}</span>
                    <span className="menu__acao-detalhe">{detalheDe(acao, ctx)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {estado.painel === 'dificuldade' && (
            <div className="menu__painel" role="dialog" aria-modal="true" aria-label="Dificuldade">
              <p className="menu__painel-titulo">DIFICULDADE</p>
              <p className="menu__acao-detalhe">
                A escolha vale para a partida inteira e fica gravada no save.
              </p>
              <ul className="menu__lista" role="radiogroup" aria-label="Dificuldade">
                {dificuldades.map((d, i) => (
                  <li key={d}>
                    <button type="button" role="radio" aria-checked={i === estado.indice}
                      className={i === estado.indice ? 'menu__linha menu__linha--on' : 'menu__linha'}
                      data-foco={i === estado.indice}
                      ref={ref(`linha-${i}`)}
                      onPointerMove={() => abrir(i)}
                      onClick={() => abrir(i)}>
                      <span className="menu__linha-rotulo">{MENU.rotuloDificuldade[d]}</span>
                      <span className="menu__linha-valor">{i === estado.indice ? '◀ ▶' : ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="menu__dica" aria-live="polite">
                {DESCRICAO_DIFICULDADE[dificuldades[estado.indice] ?? 'medium']}
              </p>
              <p className="menu__acao-detalhe">
                Vai ocupar o <b>SLOT {slotNovaPartida}</b>.
              </p>
              <button type="button" className="menu__comecar"
                onClick={() => aplicar(clicarLinha({ ...estado, painel: 'dificuldade' }, estado.indice, ctx))}>
                COMEÇAR (ENTER)
              </button>
              <button type="button" className="menu__voltar" onClick={voltar}>VOLTAR (ESC)</button>
            </div>
          )}

          {estado.painel === 'personagem' && (
            <CharacterScreen
              personagem={estado.personagem}
              indice={estado.indice}
              onGrupo={(i) => setEstado({ ...estado, indice: i })}
              onValor={(grupo, id) => setEstado(escolherValor(estado, grupo, id))}
              onNome={(nome) => setEstado(escreverNome(estado, nome))}
              onAleatorio={() => setEstado(sortearPersonagem(estado))}
              onConfirmar={() => aplicar({
                estado, config: ctx.config,
                pedido: { tipo: 'novo', dificuldade: estado.dificuldade, personagem: estado.personagem },
              })}
              onVoltar={() => setEstado({ ...estado, painel: 'dificuldade', indice: 0, aviso: null })}
            />
          )}

          {estado.painel === 'saves' && (
            <div className="menu__painel" role="dialog" aria-modal="true" aria-label="Escolher save">
              <p className="menu__painel-titulo">CONTINUAR · ESCOLHA O SAVE</p>
              <ul className="menu__lista" role="listbox" aria-label="Saves">
                {vistas.map((v, i) => (
                  <li key={v.slot}>
                    <button type="button" role="option" aria-selected={i === estado.indice}
                      aria-disabled={!v.ocupado}
                      className={[
                        'menu__linha', 'menu__linha--save',
                        i === estado.indice ? 'menu__linha--on' : '',
                        v.ocupado ? '' : 'menu__linha--vazia',
                      ].join(' ').trim()}
                      data-foco={i === estado.indice}
                      ref={ref(`linha-${i}`)}
                      onPointerMove={() => abrir(i)}
                      onClick={() => (v.ocupado ? confirmarLinha(i) : abrir(i))}>
                      <span className="menu__linha-rotulo">{v.titulo}</span>
                      {v.linhas.map((l) => (
                        <span key={l} className="menu__acao-detalhe">{l}</span>
                      ))}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="menu__dica" aria-live="polite">
                {vistas[estado.indice]?.ocupado
                  ? 'Enter retoma esta partida na sala e com a vida do save.'
                  : 'Slot vazio: use JOGAR para começar uma partida nova.'}
              </p>
              <button type="button" className="menu__voltar" onClick={voltar}>VOLTAR (ESC)</button>
            </div>
          )}

          {/* `config` e `atalhos` são o mesmo painel: `atalhos` é a lista de teclas lá dentro */}
          {(estado.painel === 'config' || estado.painel === 'atalhos') && (
            <MenuConfig
              estado={estado}
              config={config}
              onLinha={abrir}
              onLinhaConfirmada={confirmarLinha}
              onAcao={capturar}
              onVoltar={voltar}
            />
          )}

          {estado.painel === 'creditos' && (
            <div className="menu__painel" role="dialog" aria-modal="true" aria-label="Créditos">
              <p className="menu__painel-titulo">CRÉDITOS</p>
              <p className="menu__credito-nome">{MENU.creditos.nome}</p>
              <p className="menu__credito-funcao">{MENU.creditos.funcao}</p>
              <ul className="menu__credito-linhas">
                {MENU.creditos.linhas.map((l) => <li key={l}>{l}</li>)}
              </ul>
              <button type="button" className="menu__voltar" onClick={voltar}>VOLTAR (ESC)</button>
            </div>
          )}

          {estado.aviso && <p className="menu__aviso" role="status">{estado.aviso}</p>}

          <p className="menu__rodape">
            <span>↑↓ escolher · ←→ ajustar · ENTER confirmar · ESC voltar</span>
            <span>{TIPOS_CONTROLE.find((t) => t.id === config.tipoControle)?.rotulo}</span>
          </p>
        </div>
      )}
    </div>
  );
}

/** A segunda linha de cada item do menu principal: o que aquele botão faz, em uma frase. */
function detalheDe(acao: string, ctx: MenuContext): string {
  switch (acao) {
    case 'continuar': {
      const cheios = ctx.slots.filter((s) => s.ocupado).length;
      return `${cheios} ${cheios === 1 ? 'save' : 'saves'} · escolha qual retomar`;
    }
    case 'jogar':
      return ctx.slots.some((s) => s.ocupado)
        ? `Partida nova no slot ${ctx.slotNovaPartida}.`
        : 'Primeira partida — escolha a dificuldade.';
    case 'config':
      return 'Controles, atalhos, som, legendas e idioma';
    case 'creditos':
      return `Desenvolvimento · ${MENU.creditos.nome}`;
    default:
      return '';
  }
}
