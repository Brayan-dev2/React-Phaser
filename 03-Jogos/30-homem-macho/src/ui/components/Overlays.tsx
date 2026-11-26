/** Telas React: pausa, texto de lore (`LOR-04`) e fim do recorte. */
import { useEffect } from 'react';
import { answerOffer, openHabilidades, openInventory, openMapa, useUi } from '../../store/uiStore';
import { PasswordPanel } from './PasswordPanel';
import { EndScreen } from './EndScreen';
import { Mochila } from './Mochila';
import { Habilidades } from './Habilidades';
import { Mapa } from './Mapa';

const LABEL: Record<'easy' | 'medium' | 'hard', string> = {
  easy: 'FÁCIL', medium: 'MÉDIO', hard: 'DIFÍCIL',
};

/**
 * `UI-06`/`UI-10` precisam de uma saída para o menu — e ela **não** é um `game:menu` do Phaser:
 * quem decide desmontar o canvas é o `App`. Por isso o callback vem por prop, e não pelo bus.
 */
export function Overlays({ onVoltarAoMenu }: { onVoltarAoMenu?: () => void }): JSX.Element {
  const { state, setPaused } = useUi();

  /*
   * `UI-22` — **o mapa tem de se abrir também a partir da pausa**.
   *
   * A tecla `M` é lida no `update` da `GameScene`, e uma cena pausada não corre o `update`: com a
   * pausa aberta, `M` (e `H`) não faziam absolutamente nada. O jogador que carrega em `ESC` — o
   * gesto mais comum do jogo — e depois em `M` concluía, com razão, que o mapa não carregava.
   * Aqui as duas teclas fecham a pausa e abrem o painel: o mapa é alcançável de qualquer sítio.
   */
  useEffect(() => {
    if (!state.paused) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.repeat) return;
      const alvo = e.target as HTMLElement | null;
      // um campo de texto (o nome do herói) não é um atalho
      if (alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA')) return;
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setPaused(false);
        openMapa();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setPaused(false);
        openHabilidades();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.paused, setPaused]);

  return (
    <>
      {state.text && (
        <div className="panel panel--text" role="dialog" aria-live="polite">
          <div className="panel__inner">
            {state.text.map((line, i) => (
              <p key={i} className={i === 0 ? 'panel__title' : 'panel__line'}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* com a mochila aberta o aviso vive **dentro** do painel (senão dizia-se duas vezes) */}
      {state.toast && !state.inventario && <div className="toast" role="status">{state.toast}</div>}

      {/*
        `MEC-004`/`DEC-037`: o aviso da morte. **Não é modal** — o jogo já voltou a correr quando
        ele aparece, e um painel que bloqueia o renascer seria pior do que nenhum. Sai sozinho em
        5 s. Diz o que se perdeu, porque uma perda silenciosa é indistinguível de um bug.
      */}
      {state.morte && (
        <div className="morte" role="status" aria-live="polite">
          <p className="morte__titulo">VOCÊ CAIU</p>
          {state.morte.linhas.length > 0 ? (
            <ul className="morte__lista">
              {state.morte.linhas.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          ) : (
            <p className="morte__nada">NADA FOI PERDIDO.</p>
          )}
          {/* `DEC-038`: o que se perdeu **não desapareceu** — está no chão, e o aviso diz onde */}
          {state.morte.bolsa && (
            <p className="morte__bolsa">NO CHÃO: {state.morte.bolsa}</p>
          )}
          {state.morte.bolsaDestruida && (
            <p className="morte__perdida">A BOLSA ANTERIOR FOI DESTRUÍDA.</p>
          )}
          {state.morte.presoMantido > 0 && (
            <p className="morte__preso">
              {state.morte.presoMantido === 1
                ? '1 PRESO FICOU COM VOCÊ.'
                : `${state.morte.presoMantido} PRESOS FICARAM COM VOCÊ.`}
            </p>
          )}
          <p className="morte__nota">O BAÚ DA SALA SEGURA NÃO SE PERDE NUNCA.</p>
        </div>
      )}

      {state.paused && (
        <div className="panel" role="dialog" aria-modal="true" aria-label="Pausa">
          <div className="panel__inner">
            <p className="panel__title">PAUSA</p>
            <p className="panel__line">ESC ou o botão abaixo para continuar.</p>
            <ul className="keys">
              <li><b>A / D</b> mover</li>
              <li><b>SHIFT</b> correr</li>
              <li><b>ESPAÇO</b> pular</li>
              <li><b>J</b> atacar · <b>K</b> disparar</li>
              <li><b>E</b> interagir / salvar</li>
              <li><b>I</b> mochila · <b>M</b> mapa · <b>H</b> habilidades</li>
            </ul>
            <div className="panel__row">
              <button className="panel__btn" onClick={() => setPaused(false)}>CONTINUAR</button>
              {/*
                `UI-06`: a pausa tem **Bolsa** — a lista do ecrã. O botão fecha a pausa e abre a
                mochila (`I` faz o mesmo em jogo, e o ícone do HUD também): três caminhos para o
                mesmo sítio, porque é o sítio onde o jogador pára para pensar no que leva.
              */}
              <button
                className="panel__btn panel__btn--ghost"
                onClick={() => { setPaused(false); openInventory(); }}
              >
                MOCHILA
              </button>
              {/* `UI-22`: o mapa também tem de estar aqui. A pausa já dava a Bolsa; dar o mapa
                  e não as habilidades era metade de uma regra — os três painéis do jogador ficam
                  onde ele pára para pensar. */}
              <button
                className="panel__btn panel__btn--ghost"
                onClick={() => { setPaused(false); openMapa(); }}
              >
                MAPA
              </button>
              <button
                className="panel__btn panel__btn--ghost"
                onClick={() => { setPaused(false); openHabilidades(); }}
              >
                HABILIDADES
              </button>
              {/* `UI-06`: sair para o menu é a saída do jogo — e o save já foi gravado na transição */}
              <button className="panel__btn panel__btn--ghost"
                onClick={() => { setPaused(false); onVoltarAoMenu?.(); }}>
                SAIR PARA O MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {state.offer && (
        <div className="panel" role="dialog" aria-modal="true" aria-label="Oferta de dificuldade">
          <div className="panel__inner">
            <p className="panel__title">A PORTA CONTINUA FECHADA</p>
            <p className="panel__line">
              Três quedas contra o Guardião. Quer baixar a dificuldade de{' '}
              <b>{LABEL[state.offer.from]}</b> para <b>{LABEL[state.offer.to]}</b>?
            </p>
            <p className="panel__muted">Você pode recusar: o Guardião continua como está.</p>
            <div className="panel__row">
              <button className="panel__btn" onClick={() => answerOffer(true, state.offer?.to)}>
                ACEITAR {LABEL[state.offer.to]}
              </button>
              <button className="panel__btn panel__btn--ghost" onClick={() => answerOffer(false)}>
                RECUSAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* `UI-07`: a mochila. Vem **antes** do fim de jogo e da pausa: é intenção do jogador,
          e nenhum aviso de sistema deve ficar por cima dela. */}
      <Mochila />
      <Habilidades />
      <Mapa />

      <PasswordPanel />

      {/* `MEC-012` §7.4: o fim do jogo é um crachá, e ele vem **depois** do recorte do MVP */}
      <EndScreen />

      {/*
        `DEC-047` — **o «FIM DO RECORTE» deixou de existir**. Ele era o painel do corte do MVP: ao
        atravessar o Portão do Guardião, o jogo anunciava que os setores de LVL-04 em diante
        estavam fora do build e devolvia ao menu. A campanha segue agora até ao Trono do Caos, e o
        fim do jogo é `EndScreen` (o crachá de `MEC-012`), que já vem antes deste bloco. Deixar o
        painel aqui seria um ecrã a dizer «acabou» a meio do jogo.
      */}
    </>
  );
}
