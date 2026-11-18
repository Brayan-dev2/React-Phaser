/**
 * `UI-14` — **o painel das habilidades** (`DEC-041`): o que o herói já sabe, quanto vale o próximo
 * nível e quanto custa.
 *
 * Não é uma loja: as seis habilidades só aparecem **melhoráveis depois de conquistadas a jogar**, e
 * as que faltam mostram-se trancadas com a razão (“conquista-se em LVL-09”) em vez de um preço. Uma
 * lista que esconde o que existe faria o jogador pensar que o jogo acabou.
 *
 * Três coisas que este componente **não** faz, de propósito:
 *
 * 1. **Não calcula preços nem efeitos.** Chegam prontos da cena (`game:habilidades`): o número e o
 *    texto do próximo nível vivem no `tuning`, e uma segunda cópia aqui divergia à primeira mudança.
 * 2. **Não guarda estado das compras.** `MELHORAR` é uma intenção (`ui:habilidade-command`); quem
 *    cobra, aplica o efeito e grava é a cena (`core/melhorias` decide).
 * 3. **Não depende do rato.** `↑ ↓` andam pelas habilidades, `ENTER` compra, `H`/`ESC` fecham, e cada
 *    linha diz o nível num `aria-label` (`§4.6`) — as três marcas de nível são informação, não
 *    decoração.
 */
import { useEffect, useRef, useState } from 'react';
import { closeHabilidades, melhorarHabilidade, useUi } from '../../store/uiStore';

/** Três marcas por habilidade: cheia = nível, vazia = ainda por comprar. */
function Marcas(props: { nivel: number; max: number }): JSX.Element {
  return (
    <span className="hab__marcas" aria-hidden="true">
      {Array.from({ length: props.max }, (_, i) => (
        <span key={i} className={`hab__marca${i < props.nivel ? ' hab__marca--cheia' : ''}`} />
      ))}
    </span>
  );
}

export function Habilidades(): JSX.Element | null {
  const { state } = useUi();
  const [sel, setSel] = useState(0);
  const lista = useRef<HTMLDivElement>(null);
  const aberta = state.habilidadesPainel;
  const linhas = state.habilidades.linhas;
  const moedas = state.habilidades.moedas || state.moedas;

  useEffect(() => {
    if (!aberta) return;
    // foco na primeira habilidade **conquistada**: é sobre ela que o painel trata
    const primeiro = linhas.findIndex((l) => l.conquistada);
    setSel(primeiro >= 0 ? primeiro : 0);
    lista.current?.focus();
    // só na transição de fechado → aberto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberta]);

  useEffect(() => {
    if (!aberta) return;
    const onKey = (e: KeyboardEvent): void => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setSel((n) => Math.min(linhas.length - 1, n + 1));
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setSel((n) => Math.max(0, n - 1));
          break;
        case 'Enter': {
          e.preventDefault();
          const alvo = linhas[sel];
          if (alvo) melhorarHabilidade(alvo.id);
          break;
        }
        case 'h':
        case 'H':
        case 'Escape':
          e.preventDefault();
          closeHabilidades();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aberta, linhas, sel]);

  if (!aberta) return null;

  const conquistadas = linhas.filter((l) => l.conquistada).length;

  return (
    <div className="panel panel--habilidades" role="dialog" aria-modal="true" aria-label="Habilidades">
      <div className="panel__inner hab">
        <header className="hab__topo">
          <span className="hab__marca">HABILIDADES</span>
          <span className="hab__contadores" aria-live="polite">
            CONQUISTADAS {conquistadas} / {linhas.length}
            <span className="mochila__sep" aria-hidden="true">·</span>
            MOEDAS <b className="hab__moedas">{moedas}</b>
          </span>
        </header>

        <p className="panel__muted hab__nota">
          SÓ SE MELHORA O QUE JÁ SE CONQUISTOU. CADA NÍVEL MUDA O QUE SE SENTE A JOGAR — E FICA PARA SEMPRE.
        </p>

        <div className="hab__lista" role="list" tabIndex={-1} ref={lista}>
          {linhas.map((l, i) => {
            const maximo = l.nivel >= l.max;
            const falta = l.custo !== null && moedas < l.custo;
            const podeComprar = l.conquistada && !maximo && !falta;
            return (
              <div
                key={l.id}
                role="listitem"
                className={[
                  'hab__linha',
                  l.conquistada ? '' : 'hab__linha--trancada',
                  i === sel ? 'hab__linha--sel' : '',
                  maximo && l.conquistada ? 'hab__linha--max' : '',
                ].filter(Boolean).join(' ')}
                aria-label={`${l.nome}: nível ${l.nivel} de ${l.max}${
                  l.conquistada ? '' : ' — não conquistada'}`}
                onClick={() => setSel(i)}
              >
                <div className="hab__info">
                  <p className="hab__nome">
                    {l.nome}
                    <Marcas nivel={l.nivel} max={l.max} />
                    {!l.conquistada && <span className="hab__etiqueta">NÃO CONQUISTADA</span>}
                    {maximo && l.conquistada && <span className="hab__etiqueta hab__etiqueta--max">MÁXIMO</span>}
                  </p>
                  <p className="hab__texto">
                    {l.conquistada
                      ? l.texto
                      : 'Conquista-se a jogar. O painel abre na mesma — falta o que a dá.'}
                  </p>
                </div>

                <div className="hab__acao">
                  {l.conquistada && !maximo ? (
                    <button
                      type="button"
                      className={`panel__btn${podeComprar ? '' : ' panel__btn--ghost'}`}
                      disabled={!podeComprar}
                      onClick={(ev) => { ev.stopPropagation(); melhorarHabilidade(l.id); }}
                      aria-label={`Melhorar ${l.nome} para o nível ${l.nivel + 1} por ${l.custo} moedas`}
                    >
                      {falta ? `FALTAM ${(l.custo ?? 0) - moedas}` : `${l.custo} MOEDAS`}
                    </button>
                  ) : (
                    <span className="hab__acao-vazia">
                      {maximo && l.conquistada ? 'NÍVEL MÁXIMO' : '—'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="hab__aviso" role="status">{state.toast ?? ''}</p>

        <footer className="mochila__rodape">
          <span><b>H</b> ou <b>ESC</b> fechar</span>
          <span><b>↑ ↓</b> escolher</span>
          <span><b>ENTER</b> melhorar</span>
          <span>AS MOEDAS SAEM DA CARTEIRA — GUARDE NO BAÚ ANTES DE UMA ARENA</span>
        </footer>
      </div>
    </div>
  );
}
