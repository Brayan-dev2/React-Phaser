/**
 * `UI-20` — a barra do **ocupante** (`LVL-16` §5.5).
 *
 * Não é vida reciclada: é **postura**, e `BAIXAS n/3` é o único progresso da luta. Quem lê
 * `100 / 100` e acha que está "cheio" entendeu errado de propósito — a barra **enche** depois
 * de cada atordoamento, porque o homem se recompõe. O que não volta é a assinatura.
 */
import { useEffect, useState } from 'react';
import { useUi } from '../../store/uiStore';

export function PostoBar(): JSX.Element | null {
  const { state } = useUi();
  const posto = state.posto;
  const [anuncio, setAnuncio] = useState('');

  useEffect(() => {
    if (!posto) return;
    if (posto.rendido) setAnuncio('O ocupante se rendeu. A grade sobe.');
    else if (posto.staggered) setAnuncio('O ocupante cambaleou. Assine no posto.');
    else if (posto.baixas > 0) setAnuncio(`Baixa ${posto.baixas} de ${posto.baixasMax} assinada.`);
  }, [posto?.rendido, posto?.staggered, posto?.baixas, posto]);

  if (!posto || posto.rendido) return null;
  const pct = Math.max(0, Math.min(100, (posto.poise / posto.poiseMax) * 100));

  return (
    <div className={posto.staggered ? 'postobar postobar--stagger' : 'postobar'}>
      <span className="postobar__name">O PLANTONISTA</span>
      {/* `BAIXAS n/3` — três assinaturas e o jogo abre a porta. Nunca `vida`. */}
      <span className="postobar__baixas" aria-live="polite">
        BAIXAS {posto.baixas}/{posto.baixasMax}
      </span>
      <span className="postobar__track" role="progressbar" aria-label="postura do ocupante"
        aria-valuenow={posto.poise} aria-valuemin={0} aria-valuemax={posto.poiseMax}>
        <span className="postobar__fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="postobar__hint">
        {posto.staggered ? 'ATORDOADO · SEGURE E NO POSTO' : 'POSTURA'}
      </span>
      <span className="sr-only" role="status" aria-live="polite">{anuncio}</span>
    </div>
  );
}
