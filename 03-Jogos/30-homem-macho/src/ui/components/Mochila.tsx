/**
 * `UI-07` — **a mochila e o baú, lado a lado** (`DEC-040`).
 *
 * O painel abre em duas metades: a mochila ocupa sempre a **metade esquerda** e o baú a **metade
 * direita**. Não é decoração — o gesto é sempre "passar de um lado para o outro", e duas metades
 * fixas dizem, sem uma linha de texto, de que lado está o que é do herói e de que lado está o que
 * fica guardado. Antes havia um painel estreito com o baú por baixo; com quarenta espaços em cada
 * lado, metade da tela para cada um é o mínimo para se ver o que se está a fazer.
 *
 * **Ferramentas (as duas metades têm as mesmas):**
 *
 * - **ordenar** por chegada, nome, tipo, quantidade, valor ou raridade — a ordem é uma vista: não
 *   mexe na mochila nem no save (`core/ordenar.ts`);
 * - **quantidade** a transferir, com `−`/`+`, limitada ao que existe;
 * - **passar os semelhantes** num clique (`TODOS`), em vez de quarenta cliques;
 * - **guardar tudo** / **retirar tudo** de uma vez;
 * - e do lado do baú, **as moedas**: guardar `n`, guardar todas, retirar `n`, retirar todas.
 *
 * O que este componente **não** faz: guardar estado das listas (a cena é a fonte de verdade;
 * prender, guardar e retirar são intenções), falar com o Phaser (`ADR-01`) ou depender do rato
 * (`§4.6`: `←/→/↑/↓` andam, `TAB` troca de lado, `ENTER` usa, `G` guarda, `+`/`-` mudam a
 * quantidade, e cada célula diz o que é no `aria-label`).
 */
import { useEffect, useRef, useState } from 'react';
import {
  closeInventory, guardarNoBau, guardarTudoNoBau, moedasDoBau, moedasParaBau, pinItem,
  tirarDoBau, tirarTudoDoBau, unpinItem, useUi,
} from '../../store/uiStore';
import { INVENTARIO, ITEMS } from '../../game/data/tuning';
import {
  ORDENS, ROTULO_ORDEM, descreverFicha, ordenar, quantidadeDe, type FichaDeItem, type Ordem,
} from '../../core/ordenar';
import { IconeMochila, IconeBau, ItemIcon } from './ItemIcon';
import type { ItemId } from '../../core/items';

const CONFIG = INVENTARIO as unknown as { slots: number; presos: number; colunas: number; bau: number };

function nome(id: ItemId): string {
  return (ITEMS[id] as { name: string }).name;
}

function resumo(id: ItemId): string {
  const linha = (ITEMS[id] as { resumo?: string }).resumo;
  return linha ?? 'Sem descrição.';
}

/**
 * A ficha de ordenação vem do dado do jogo (`tuning.ts`). `ordemar`/`core` não importa `game/`
 * (`PAT-C-00`); por isso o painel — que já pode importar os dois — é quem a monta.
 */
function ficha(id: ItemId): FichaDeItem {
  const item = ITEMS[id] as { name: string; tipo?: string; valor?: number; raridade?: number };
  return {
    nome: item.name,
    tipo: item.tipo ?? 'arma',
    valor: item.valor ?? 0,
    raridade: item.raridade ?? 0,
  };
}

type Lado = 'mochila' | 'bau';

/** `− n +` — o número que vai ser transferido. Nunca passa do que existe nem desce de 1. */
function Passo(props: {
  valor: number; max: number; rotulo: string; onMudar: (n: number) => void;
}): JSX.Element {
  const { valor, max, rotulo, onMudar } = props;
  const limitado = Math.min(Math.max(1, valor), Math.max(1, max));
  return (
    <span className="mochila__passo" role="group" aria-label={rotulo}>
      <button type="button" className="mochila__passo-btn" aria-label={`Diminuir ${rotulo}`}
        disabled={limitado <= 1} onClick={() => onMudar(limitado - 1)}>−</button>
      <output className="mochila__passo-valor" aria-live="polite">{limitado}</output>
      <button type="button" className="mochila__passo-btn" aria-label={`Aumentar ${rotulo}`}
        disabled={limitado >= max} onClick={() => onMudar(Math.min(max, limitado + 1))}>+</button>
    </span>
  );
}

/** A barra de ordens — igual nos dois lados, porque as duas listas se ordenam da mesma forma. */
function Ordens(props: { ordem: Ordem; onOrdem: (o: Ordem) => void; lado: string }): JSX.Element {
  return (
    <div className="mochila__ordens" role="group" aria-label={`Ordenar ${props.lado} por`}>
      <span className="mochila__ordens-rotulo" aria-hidden="true">ORDENAR</span>
      {ORDENS.map((o) => (
        <button
          key={o}
          type="button"
          className={`mochila__ordem${props.ordem === o ? ' mochila__ordem--ativa' : ''}`}
          aria-pressed={props.ordem === o}
          onClick={() => props.onOrdem(o)}
        >
          {ROTULO_ORDEM[o]}
        </button>
      ))}
    </div>
  );
}

export function Mochila(): JSX.Element | null {
  const { state } = useUi();
  const [sel, setSel] = useState(0);
  const [selBau, setSelBau] = useState(0);
  const [lado, setLado] = useState<Lado>('mochila');
  const [ordem, setOrdem] = useState<Ordem>('chegada');
  const [ordemBau, setOrdemBau] = useState<Ordem>('chegada');
  const [qtdM, setQtdM] = useState(1);
  const [qtdB, setQtdB] = useState(1);
  const [qtdMoedas, setQtdMoedas] = useState(1);
  const grade = useRef<HTMLDivElement>(null);
  const aberta = state.inventario;
  const { itens, presos } = state.bolsa;
  const bau = state.bau;

  // a ordem é uma vista: a lista guardada continua na ordem de chegada (`core/ordenar`)
  const vistaM = ordenar(itens, ordem, ficha);
  const vistaB = ordenar(bau.itens, ordemBau, ficha);

  // ao abrir: foco no painel e seleção na primeira célula ocupada
  useEffect(() => {
    if (!aberta) return;
    setSel(vistaM.length ? 0 : -1);
    setSelBau(vistaB.length ? 0 : -1);
    setLado('mochila');
    setQtdM(1);
    setQtdB(1);
    grade.current?.focus();
    // só na transição de fechado → aberto: o conteúdo muda a cada movimento e não deve
    // reposicionar a seleção
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberta]);

  const selEfetivo = Math.min(Math.max(sel, 0), CONFIG.slots - 1);
  const selBauEfetivo = vistaB.length ? Math.min(Math.max(selBau, 0), vistaB.length - 1) : 0;
  const selecionado: ItemId | undefined = vistaM[selEfetivo];
  const noBau: ItemId | undefined = vistaB[selBauEfetivo];
  const estaPreso = selecionado ? presos.includes(selecionado) : false;
  const copiasM = selecionado ? quantidadeDe(itens, selecionado) : 0;
  const copiasB = noBau ? quantidadeDe(bau.itens, noBau) : 0;

  useEffect(() => {
    if (!aberta) return;
    const onKey = (e: KeyboardEvent) => {
      const passo = CONFIG.colunas;
      const noLadoMochila = lado === 'mochila';
      const max = noLadoMochila ? CONFIG.slots : CONFIG.bau;
      const atual = noLadoMochila ? sel : selBau;
      const setAtual = (n: number): void => { if (noLadoMochila) setSel(n); else setSelBau(n); };
      const mover = (d: number): void => {
        e.preventDefault();
        setAtual(Math.min(max - 1, Math.max(0, atual + d)));
      };
      const ajustarQtd = (d: number): void => {
        e.preventDefault();
        const alvo = noLadoMochila ? copiasM : copiasB;
        if (alvo < 1) return;
        if (noLadoMochila) setQtdM((n) => Math.min(alvo, Math.max(1, n + d)));
        else setQtdB((n) => Math.min(alvo, Math.max(1, n + d)));
      };
      switch (e.key) {
        case 'ArrowRight': mover(1); break;
        case 'ArrowLeft': mover(-1); break;
        case 'ArrowDown': mover(passo); break;
        case 'ArrowUp': mover(-passo); break;
        case '+':
        case '=': ajustarQtd(1); break;
        case '-':
        case '_': ajustarQtd(-1); break;
        case 'Tab': {
          // `TAB` troca de metade — só faz sentido com um baú ao alcance
          if (!bau.disponivel) return;
          e.preventDefault();
          setLado(noLadoMochila ? 'bau' : 'mochila');
          break;
        }
        case 'Enter':
        case 'p':
        case 'P': {
          e.preventDefault();
          if (noLadoMochila) {
            if (!selecionado) return;
            if (estaPreso) unpinItem(selecionado); else pinItem(selecionado);
          } else if (noBau) {
            tirarDoBau(noBau, qtdB);
          }
          break;
        }
        case 'g':
        case 'G': {
          if (!noLadoMochila || !bau.disponivel || !selecionado) return;
          e.preventDefault();
          guardarNoBau(selecionado, qtdM);
          break;
        }
        case 't':
        case 'T': {
          if (!bau.disponivel) return;
          e.preventDefault();
          if (noLadoMochila) guardarTudoNoBau(); else tirarTudoDoBau();
          break;
        }
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    aberta, itens, presos, bau, sel, selBau, lado, selecionado, noBau, estaPreso, copiasM, copiasB,
    qtdB, qtdM,
  ]);

  if (!aberta) return null;

  return (
    <div className="panel panel--mochila" role="dialog" aria-modal="true" aria-label="Mochila">
      <div className="mochila__metades">
        {/* =================== METADE ESQUERDA: a mochila =================== */}
        <section className="mochila__lado mochila__lado--mochila" aria-label="Mochila do herói">
          <header className="mochila__topo">
            <span className="mochila__marca"><IconeMochila /> MOCHILA</span>
            <span className="mochila__contadores" aria-live="polite">
              ESPAÇOS {itens.length} / {CONFIG.slots}
              <span className="mochila__sep" aria-hidden="true">·</span>
              PRESOS {presos.length} / {CONFIG.presos}
            </span>
          </header>

          <Ordens ordem={ordem} onOrdem={(o) => { setOrdem(o); setSel(0); }} lado="a mochila" />

          <div
            className="mochila__grade"
            role="grid"
            aria-label={`${CONFIG.slots} espaços, ${itens.length} ocupados`}
            tabIndex={-1}
            ref={grade}
            style={{ gridTemplateColumns: `repeat(${CONFIG.colunas}, 1fr)` }}
          >
            {Array.from({ length: CONFIG.slots }, (_, i) => {
              const id = vistaM[i];
              const preso = id ? presos.includes(id) : false;
              const gêmeos = id ? quantidadeDe(itens, id) : 0;
              const rotulo = id
                ? `Espaço ${i + 1}: ${nome(id)}${preso ? ' — preso' : ''}`
                  + `${gêmeos > 1 ? ` — ${gêmeos} iguais na mochila` : ''}`
                : `Espaço ${i + 1}: vazio`;
              return (
                <button
                  key={i}
                  type="button"
                  role="gridcell"
                  className={[
                    'mochila__celula',
                    id ? 'mochila__celula--cheia' : 'mochila__celula--vazia',
                    i === selEfetivo && lado === 'mochila' ? 'mochila__celula--sel' : '',
                    preso ? 'mochila__celula--presa' : '',
                  ].filter(Boolean).join(' ')}
                  aria-label={rotulo}
                  aria-selected={i === selEfetivo}
                  tabIndex={i === selEfetivo ? 0 : -1}
                  onClick={() => { setSel(i); setLado('mochila'); }}
                >
                  {id ? <ItemIcon id={id} /> : <span className="mochila__ponto" aria-hidden="true" />}
                  {preso && <span className="mochila__alfinete" aria-hidden="true">▮</span>}
                </button>
              );
            })}
          </div>

          <section className="mochila__detalhe" aria-live="polite">
            {selecionado ? (
              <>
                <p className="mochila__nome">
                  {nome(selecionado)}
                  <span className={`mochila__etiqueta ${estaPreso ? 'mochila__etiqueta--presa' : ''}`}>
                    {estaPreso ? 'PRESO' : 'SOLTO'}
                  </span>
                  {copiasM > 1 && (
                    <span className="mochila__etiqueta mochila__etiqueta--conta">×{copiasM}</span>
                  )}
                </p>
                <p className="panel__line">{resumo(selecionado)}</p>
                <p className="mochila__ficha">{descreverFicha(ficha(selecionado))}</p>
                <p className="panel__muted">
                  PRESO NÃO CAI NA MORTE. SOLTO CAI NUMA BOLSA RECUPERÁVEL.
                </p>
                <div className="panel__row">
                  <button
                    className={`panel__btn ${estaPreso ? 'panel__btn--ghost' : ''}`}
                    onClick={() => (estaPreso ? unpinItem(selecionado) : pinItem(selecionado))}
                  >
                    {estaPreso ? 'SOLTAR' : 'PRENDER'}
                  </button>
                  {bau.disponivel && (
                    <button
                      className="panel__btn panel__btn--ghost"
                      onClick={() => guardarNoBau(selecionado, qtdM)}
                    >
                      GUARDAR NO BAÚ
                    </button>
                  )}
                </div>
                {bau.disponivel && (
                  <div className="mochila__transferir">
                    <Passo valor={qtdM} max={copiasM} rotulo="a quantidade a guardar"
                      onMudar={setQtdM} />
                    <button className="panel__btn panel__btn--ghost"
                      onClick={() => guardarNoBau(selecionado, qtdM)}>
                      {`GUARDAR ${Math.min(Math.max(1, qtdM), copiasM)}`}
                    </button>
                    {copiasM > 1 && (
                      <button className="panel__btn panel__btn--ghost"
                        onClick={() => guardarNoBau(selecionado)}>
                        {`TODOS OS IGUAIS (${copiasM})`}
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="panel__muted">
                A MOCHILA ESTÁ VAZIA. EQUIPAMENTOS APANHADOS EM JOGO OCUPAM UM ESPAÇO CADA.
              </p>
            )}
          </section>

          <footer className="mochila__rodape">
            <span><b>I</b> ou <b>ESC</b> fechar</span>
            <span><b>← → ↑ ↓</b> escolher</span>
            <span><b>ENTER</b> prender / soltar</span>
            {bau.disponivel && <span><b>G</b> guardar · <b>+ −</b> quantidade · <b>TAB</b> baú</span>}
          </footer>
        </section>

        {/* =================== METADE DIREITA: o baú =================== */}
        <section
          className={`mochila__lado mochila__lado--bau${bau.disponivel ? '' : ' mochila__lado--fechado'}`}
          aria-label="Baú da sala segura"
        >
          {bau.disponivel ? (
            <section className="bau">
              <header className="bau__topo">
                <span className="bau__marca"><IconeBau /> BAÚ · SALA SEGURA</span>
                <span className="bau__contadores">
                  ESPAÇOS {bau.itens.length} / {bau.capacidade}
                  <span className="mochila__sep" aria-hidden="true">·</span>
                  MOEDAS {bau.moedas}
                </span>
              </header>

              <Ordens ordem={ordemBau} onOrdem={(o) => { setOrdemBau(o); setSelBau(0); }}
                lado="o baú" />

              <div className="bau__linha" role="grid"
                aria-label={`Baú: ${bau.itens.length} de ${bau.capacidade}`}>
                {/* os 40 espaços, como na mochila: o vazio no fim é a informação de quanto
                    ainda cabe antes de uma peça ficar na mochila */}
                {Array.from({ length: CONFIG.bau }, (_, i) => {
                  const id = vistaB[i];
                  const gêmeos = id ? quantidadeDe(bau.itens, id) : 0;
                  const rotulo = id
                    ? `Baú ${i + 1}: ${nome(id)}${gêmeos > 1 ? ` — ${gêmeos} iguais` : ''}`
                    : 'Baú vazio';
                  return (
                    <button
                      key={i}
                      type="button"
                      role="gridcell"
                      className={[
                        'mochila__celula', 'mochila__celula--cheia',
                        i === selBauEfetivo && lado === 'bau' ? 'mochila__celula--sel' : '',
                        id ? '' : 'mochila__celula--vazia',
                      ].filter(Boolean).join(' ')}
                      aria-label={rotulo}
                      aria-selected={i === selBauEfetivo}
                      tabIndex={i === selBauEfetivo ? 0 : -1}
                      onClick={() => { setSelBau(i); setLado('bau'); }}
                    >
                      {id ? <ItemIcon id={id} /> : <span className="mochila__ponto" aria-hidden="true" />}
                    </button>
                  );
                })}
                {bau.itens.length === 0 && (
                  <span className="bau__vazio">VAZIO. GUARDE AQUI O QUE NÃO QUER ARRISCAR.</span>
                )}
              </div>

              <section className="bau__detalhe" aria-live="polite">
                {noBau ? (
                  <>
                    <p className="mochila__nome">
                      {nome(noBau)}
                      {copiasB > 1 && (
                        <span className="mochila__etiqueta mochila__etiqueta--conta">×{copiasB}</span>
                      )}
                    </p>
                    <p className="mochila__ficha">{descreverFicha(ficha(noBau))}</p>
                    <p className="panel__muted">
                      O QUE ESTÁ NO BAÚ NÃO CAI NA MORTE. AS SALAS SEGURAS PARTILHAM ESTE BAÚ.
                    </p>
                    <div className="bau__acoes">
                      <button className="panel__btn" onClick={() => tirarDoBau(noBau, qtdB)}>
                        TIRAR PARA A MOCHILA
                      </button>
                      {copiasB > 1 && (
                        <button className="panel__btn panel__btn--ghost"
                          onClick={() => tirarDoBau(noBau)}>
                          {`TODOS OS IGUAIS (${copiasB})`}
                        </button>
                      )}
                    </div>
                    <div className="mochila__transferir">
                      <Passo valor={qtdB} max={copiasB} rotulo="a quantidade a tirar"
                        onMudar={setQtdB} />
                      <span className="panel__muted">QUANTOS VOLTAM PARA A MOCHILA</span>
                    </div>
                  </>
                ) : (
                  <p className="panel__muted">
                    O BAÚ ESTÁ VAZIO. GUARDE AQUI O QUE NÃO QUER ARRISCAR NA PRÓXIMA ARENA.
                  </p>
                )}
              </section>

              {/* --- o pé da metade direita: moedas e os dois "tudo", na mesma linha do rodapé da
                     esquerda, para as duas metades acabarem no mesmo pixel --- */}
              <div className="bau__pe">
                <section className="bau__moedas" aria-label="Moedas no baú">
                  <p className="bau__moedas-conta">
                    <span>NO BAÚ <b>{bau.moedas}</b></span>
                    <span className="mochila__sep" aria-hidden="true">·</span>
                    <span>NA CARTEIRA <b>{state.moedas}</b></span>
                    <span className="bau__moedas-nota">MOEDAS NO BAÚ NÃO CAEM NA MORTE</span>
                  </p>
                  <div className="mochila__transferir">
                    <Passo valor={qtdMoedas} max={Math.max(1, state.moedas + bau.moedas)}
                      rotulo="as moedas" onMudar={setQtdMoedas} />
                    <button className="panel__btn" disabled={state.moedas < 1}
                      onClick={() => moedasParaBau(Math.min(qtdMoedas, state.moedas))}>
                      {state.moedas < 1 ? 'GUARDAR' : `GUARDAR ${Math.min(qtdMoedas, state.moedas)}`}
                    </button>
                    <button className="panel__btn panel__btn--ghost" disabled={state.moedas < 1}
                      onClick={() => moedasParaBau()}>
                      GUARDAR TODAS
                    </button>
                    <button className="panel__btn" disabled={bau.moedas < 1}
                      onClick={() => moedasDoBau(Math.min(qtdMoedas, bau.moedas))}>
                      {bau.moedas < 1 ? 'RETIRAR' : `RETIRAR ${Math.min(qtdMoedas, bau.moedas)}`}
                    </button>
                    <button className="panel__btn panel__btn--ghost" disabled={bau.moedas < 1}
                      onClick={() => moedasDoBau()}>
                      RETIRAR TODAS
                    </button>
                  </div>
                </section>

                <div className="bau__tudo">
                  <button className="panel__btn" disabled={itens.length === 0 && state.moedas === 0}
                    onClick={() => guardarTudoNoBau()}>
                    GUARDAR TUDO (ITENS E MOEDAS)
                  </button>
                  <button className="panel__btn" disabled={bau.itens.length === 0 && bau.moedas === 0}
                    onClick={() => tirarTudoDoBau()}>
                    RETIRAR TUDO DO BAÚ
                  </button>
                </div>
              </div>
            </section>
          ) : (
            /* sem baú ao alcance, a metade direita continua a ser a metade direita: é lá que ele
               vai aparecer, e o painel não muda de forma quando o herói se aproxima */
            <div className="mochila__lado-vazio">
              <p className="mochila__nota">
                O BAÚ SÓ ABRE JUNTO DE UM PONTO DE SALVAMENTO. AS SALAS SEGURAS PARTILHAM O MESMO BAÚ.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* o aviso do jogo (`PRESO`, `GUARDADO NO BAÚ · 3`, `O BAÚ ESTÁ CHEIO.`) aparece **dentro** do
          painel: o toast global fica por baixo dele, e um aviso escondido não é aviso */}
      <p className="mochila__aviso" role="status">{state.toast ?? ''}</p>
    </div>
  );
}

/** Fecha a mochila de fora (o `ESC` global da UI já o faz por `closeInventory`). */
export const fecharMochila = closeInventory;
