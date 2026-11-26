/**
 * Relatório da sessão de playtest (`P-01`, `P-27`, `P-29`).
 * Só lê o resumo que veio pelo `EventBus` — nada de acessar o jogo.
 */
import { useState } from 'react';
import { formatMs, type Summary } from '../../core/metrics';

interface Props {
  readonly metrics: Summary;
  readonly onClose?: () => void;
}

export function SessionReport({ metrics }: Props): JSX.Element {
  const [copiado, setCopiado] = useState(false);
  const json = JSON.stringify(metrics, null, 2);

  const copiar = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(json);
      setCopiado(true);
    } catch {
      // fallback: sem permissão de clipboard (iframe/headless) — seleciona o texto
      const el = document.createElement('textarea');
      el.value = json;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand('copy'); setCopiado(true); } catch { /* sem clipboard */ }
      el.remove();
    }
  };

  const ttk = metrics.boss.ttkMs;
  const dentroDoAlvo = ttk !== null && ttk >= 22_000 && ttk <= 35_000;

  return (
    <div className="report" role="region" aria-label="Relatório da sessão">
      <table className="report__table">
        <caption className="report__caption">RELATÓRIO DA SESSÃO</caption>
        <tbody>
          <tr><th scope="row">tempo total</th><td>{formatMs(metrics.totalMs)}</td></tr>
          {metrics.perArea.map((a) => (
            <tr key={a.area}>
              <th scope="row">{a.area}</th>
              <td>{formatMs(a.ms)} · {a.deaths} morte(s)</td>
            </tr>
          ))}
          <tr><th scope="row">mortes</th><td>{metrics.deaths}</td></tr>
          <tr>
            <th scope="row">senha</th>
            <td>{metrics.passwordAttempts} tentativa(s) · {metrics.passwordFailures} erro(s)</td>
          </tr>
          <tr>
            <th scope="row">chefe (TTK)</th>
            <td>
              {metrics.boss.attempts} tentativa(s) · {metrics.boss.wins} vitória(s) ·{' '}
              <b>{formatMs(ttk)}</b>
              {ttk !== null && ` (${dentroDoAlvo ? 'dentro' : 'fora'} do alvo 22–35 s)`}
            </td>
          </tr>
          <tr><th scope="row">itens</th><td>{metrics.items.join(' · ') || '—'}</td></tr>
          <tr><th scope="row">mudanças de dificuldade</th><td>{metrics.difficultyChanges}</td></tr>
        </tbody>
      </table>

      <div className="report__actions">
        <button className="panel__btn" onClick={() => void copiar()}>
          {copiado ? 'COPIADO' : 'COPIAR JSON'}
        </button>
      </div>
      <p className="panel__muted">
        Cole o JSON no formulário do roteiro (`docs/playtest/ROTEIRO-MVP.md`) — o TTK acima é o
        número que responde `P-29`.
      </p>
    </div>
  );
}
