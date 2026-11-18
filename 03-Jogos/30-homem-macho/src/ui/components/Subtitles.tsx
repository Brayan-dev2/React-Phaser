/**
 * `§4.6` — **legendas** do jogo, em PT-BR.
 *
 * O que entra aqui é só o que o jogador *precisa* de saber e que, sem áudio, não teria por onde
 * saber: dano recebido, telegraph do chefe, item apanhado, checkpoint gravado, morte. Não é
 * narração de tudo o que acontece — legenda que fala demais é ruído e rouba a tela do jogo.
 *
 * Quem escreve é a `GameScene` (`game:subtitle`); quem decide se aparece é a configuração
 * (`legendas`), lida aqui para o jogo não ter de saber o que a UI mostra.
 */
import { useUi } from '../../store/uiStore';

export function Subtitles(): JSX.Element | null {
  const { state } = useUi();
  if (!state.subtitle) return null;
  const { text, kind } = state.subtitle;
  return (
    <div className={`legenda legenda--${kind}`} role="status" aria-live="polite">
      {/* o prefixo diz **de que tipo** é o aviso sem depender de cor (`§4.6`) */}
      <span className="legenda__marca" aria-hidden="true">
        {kind === 'perigo' ? '!' : kind === 'marco' ? '◆' : '·'}
      </span>
      <span className="legenda__texto">{text}</span>
    </div>
  );
}
