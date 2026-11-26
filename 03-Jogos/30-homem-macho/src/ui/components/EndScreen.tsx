/**
 * `MEC-012` / `LOR-05` — **o crachá** (`LVL-16` §7.4).
 *
 * A tela final não é um quadro de aviso: o jogo não tinha mais o que afixar, tinha o que
 * preencher. Três linhas, e o nome é o de quem lê — porque o herói nunca teve nome em 16
 * setores. Os créditos têm **pausa** e velocidade 1×/2× (§7.2), e `reduce_motion` desliga o
 * fade de vinho.
 */
import { useEffect, useRef, useState } from 'react';
import { useUi } from '../../store/uiStore';
import { SessionReport } from './SessionReport';

const CREDITOS = [
  'HOMEM MACHO',
  'DAVID CREATOR',
  '16 SETORES · 90 SALAS · 6 CHEFES',
  'O POSTO PERMANECE ABERTO ATÉ PREENCHIMENTO',
];

export function EndScreen(): JSX.Element | null {
  const { state } = useUi();
  const [pausado, setPausado] = useState(false);
  const [velocidade, setVelocidade] = useState<1 | 2>(1);
  const [creditos, setCreditos] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!state.end) return;
    const ms = state.end.badgeMs ?? 3000;
    timer.current = window.setTimeout(() => setCreditos(true), ms);
    return () => window.clearTimeout(timer.current);
  }, [state.end]);

  if (!state.end) return null;
  const badge = state.end.badge;

  return (
    <div className="panel" role="dialog" aria-modal="true" aria-label="Fim do jogo">
      <div className="panel__inner panel__inner--end">
        {/* o título é do **lugar**; a mensagem é do crachá, e ela aparece uma vez só */}
        <p className="panel__title">TRONO DO CAOS</p>
        {/* as 3 linhas do crachá — `Nº: 041` é o quadragésimo primeiro prego */}
        <ul className="badge" aria-label="crachá">
          {badge.map((l, i) => <li key={i} className="badge__line">{l}</li>)}
        </ul>
        {state.end.lastLine && <p className="panel__line">“{state.end.lastLine}”</p>}
        {creditos && (
          <div className="creditos">
            {CREDITOS.map((c, i) => (
              <p key={i} className="panel__muted">{c}</p>
            ))}
            <div className="panel__row">
              <button className="panel__btn panel__btn--ghost" onClick={() => setPausado((p) => !p)}>
                {pausado ? 'CONTINUAR' : 'PAUSAR'}
              </button>
              <button className="panel__btn panel__btn--ghost"
                onClick={() => setVelocidade((v) => (v === 1 ? 2 : 1))}>
                VELOCIDADE {velocidade}×
              </button>
            </div>
            {pausado && <p className="panel__muted">Créditos pausados.</p>}
          </div>
        )}
        {/*
         * `DEC-022` / `P-29` — **o relatório de sessão mudou de sítio, não morreu.** Ele vivia no
         * painel «FIM DO RECORTE», que `DEC-047` apagou; aqui ele é o que sempre foi: o retrato de
         * uma sessão que acabou. Fica **depois dos créditos** e só quando há números — o painel é
         * de quem quer exportar, não uma parede de tabelas para quem só quer ler o crachá.
         */}
        {state.metrics && <SessionReport metrics={state.metrics} />}
      </div>
    </div>
  );
}
