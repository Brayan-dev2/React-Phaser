/** `MEC-006` — painel da porta de senha (LVL-02 §5.7). 4 glifos, sem limite de tentativas. */
import { useEffect, useState } from 'react';
import { useUi, submitPassword, closePassword } from '../../store/uiStore';
import { PASSWORD_LABEL, type PasswordSymbol } from '../../core/password';

const ORDER: PasswordSymbol[] = ['hand', 'gear', 'strokes', 'eye'];

function Glyph({ symbol }: { symbol: PasswordSymbol }): JSX.Element {
  const stroke = 'currentColor';
  switch (symbol) {
    case 'hand':
      return (
        <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
          <rect x="12" y="20" width="17" height="11" rx="2" fill={stroke} opacity=".85" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={13 + i * 4.5} y={9} width="3" height="12" rx="1.5" fill={stroke} opacity=".85" />
          ))}
        </svg>
      );
    case 'gear':
      return (
        <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
          <circle cx="20" cy="20" r="9" fill="none" stroke={stroke} strokeWidth="3" />
          <circle cx="20" cy="20" r="3" fill={stroke} />
          <rect x="18.5" y="5" width="3" height="6" fill={stroke} />
          <rect x="18.5" y="29" width="3" height="6" fill={stroke} />
          <rect x="5" y="18.5" width="6" height="3" fill={stroke} />
          <rect x="29" y="18.5" width="6" height="3" fill={stroke} />
        </svg>
      );
    case 'strokes':
      return (
        <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <rect key={i} x="8" y={12 + i * 7} width="24" height="3.5" rx="1.5" fill={stroke} opacity=".85" />
          ))}
        </svg>
      );
    case 'eye':
      return (
        <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
          <circle cx="20" cy="20" r="10" fill="none" stroke={stroke} strokeWidth="3" />
          <circle cx="20" cy="20" r="3" fill={stroke} />
        </svg>
      );
  }
}

export function PasswordPanel(): JSX.Element | null {
  const { state } = useUi();
  const [seq, setSeq] = useState<PasswordSymbol[]>([]);

  useEffect(() => {
    if (state.password) setSeq([]);
  }, [state.password]);

  useEffect(() => {
    if (!state.passwordHint) return;
    if (state.passwordHint.kind === 'wrong') setSeq([]); // erro limpa a entrada, não pune
  }, [state.passwordHint]);

  if (!state.password) return null;

  const pick = (s: PasswordSymbol) => {
    const next = [...seq, s];
    setSeq(next);
    if (next.length === 4) submitPassword(next);
  };

  const shake = state.passwordHint?.kind === 'wrong';

  return (
    <div className="panel" role="dialog" aria-modal="true" aria-label="Porta de senha">
      <div className={`panel__inner panel__inner--wide ${shake ? 'shake' : ''}`}>
        <p className="panel__title">PORTA DE SENHA</p>
        <p className="panel__line">Quatro glifos, na ordem gravada nas inscrições.</p>

        <div className="glyph-row" role="group" aria-label="Glifos disponíveis">
          {ORDER.map((s) => (
            <button
              key={s}
              className="glyph"
              onClick={() => pick(s)}
              aria-label={PASSWORD_LABEL[s]}
              title={PASSWORD_LABEL[s]}
            >
              <Glyph symbol={s} />
            </button>
          ))}
        </div>

        <div className="glyph-row glyph-row--slots" aria-label="Sequência escolhida" role="status">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`glyph glyph--slot ${seq[i] ? 'glyph--filled' : ''}`}>
              {seq[i] ? <Glyph symbol={seq[i]} /> : <em>{i + 1}</em>}
            </span>
          ))}
        </div>

        <p className="panel__muted" aria-live="polite">
          {state.passwordHint?.kind === 'wrong'
            ? `Ordem errada na posição ${(state.passwordHint.index ?? 0) + 1}. A porta continua fechada.`
            : state.passwordHint?.kind === 'incomplete'
              ? 'Faltam glifos.'
              : 'Sem limite de tentativas.'}
        </p>

        <div className="panel__actions">
          <button className="panel__btn" onClick={() => setSeq([])}>LIMPAR</button>
          <button className="panel__btn" onClick={closePassword}>SAIR</button>
        </div>
      </div>
    </div>
  );
}
