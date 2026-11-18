/**
 * `UI-13` — a **introdução** (`docs/04` §4.2.2.2), entre a criação do personagem e a primeira
 * sala. O texto não está aqui: está em `services/historia.ts`, e as regras de navegação também.
 *
 * Este ficheiro trata só do que existe apenas no navegador: ouvir o teclado, focar o botão certo e
 * não reagir duas vezes ao mesmo gesto. O mesmo contrato do `MainMenu`, de propósito — um jogador
 * que aprendeu `Enter` no menu não aprende outra coisa aqui.
 *
 * **A arte não existe.** Cada quadro tem uma área reservada (`ARTE · RESERVADA · INTRODUÇÃO`), do
 * mesmo tamanho em todos os quadros, para a arte entrar por trás do texto sem mexer no texto.
 */
import { useCallback, useEffect, useRef } from 'react';
import {
  HISTORIA_INICIAL, TOTAL_QUADROS, avancar, descreverQuadro, quadroAtual, saltar, teclaHistoria,
  voltar, type HistoriaState,
} from '../../services/historia';

interface Props {
  estado: HistoriaState;
  /** Chamado a cada mudança de quadro. Quando `fim` fica `true`, o `App` entra no jogo. */
  onMudar: (estado: HistoriaState) => void;
}

export function Historia({ estado, onMudar }: Props): JSX.Element {
  const quadro = quadroAtual(estado);
  const seguir = useRef<HTMLButtonElement | null>(null);

  const aplicar = useCallback((proximo: HistoriaState): void => {
    if (proximo === estado) return;
    onMudar(proximo);
  }, [estado, onMudar]);

  /**
   * **Um só ouvinte**, como no menu: dois (um para o teclado, outro para os botões) faziam o mesmo
   * `Enter` avançar dois quadros de uma vez.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const proximo = teclaHistoria(estado, e.key);
      if (proximo === estado) return;
      e.preventDefault();
      aplicar(proximo);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [estado, aplicar]);

  // o foco tem de estar num sítio visível (`§4.6`): o `Enter` seguinte não pode ir para o vazio
  useEffect(() => { seguir.current?.focus(); }, [estado.indice]);

  const ultimo = estado.indice >= TOTAL_QUADROS - 1;

  return (
    <section className="historia" aria-label="Introdução" data-quadro={quadro.id}>
      {/* --- área da arte: reservada e vazia de propósito, igual em todos os quadros --- */}
      <div className="historia__arte" aria-hidden="true">
        <span className="historia__arte-etiqueta">ARTE · RESERVADA · INTRODUÇÃO</span>
      </div>

      <div className="historia__corpo">
        <p className="historia__migalha">{`INTRODUÇÃO · ${estado.indice + 1} / ${TOTAL_QUADROS}`}</p>

        {/* uma `<div>` com `aria-live`: o leitor de ecrã ouve o quadro inteiro quando ele muda */}
        <div className="historia__texto" role="status" aria-live="polite"
          aria-label={descreverQuadro(quadro, estado.indice)}>
          <h1 className="historia__titulo">{quadro.titulo}</h1>
          {quadro.linhas.map((linha) => (
            <p key={linha} className="historia__linha">{linha}</p>
          ))}
        </div>

        <div className="historia__acoes">
          <button type="button" className="historia__botao historia__botao--principal"
            ref={seguir} onClick={() => aplicar(avancar(estado))}>
            {ultimo ? 'COMEÇAR (ENTER)' : 'SEGUIR (ENTER)'}
          </button>
          <button type="button" className="historia__botao" disabled={estado.indice === 0}
            onClick={() => aplicar(voltar(estado))}>
            ANTERIOR (←)
          </button>
          <button type="button" className="historia__botao"
            onClick={() => aplicar(saltar(estado))}>
            SALTAR (S)
          </button>
        </div>

        <p className="historia__dica">
          ENTER segue · ← volta · S salta a introdução
        </p>
      </div>
    </section>
  );
}

/** Reexportado para o `App` não precisar de conhecer o módulo de conteúdo. */
export { HISTORIA_INICIAL };
