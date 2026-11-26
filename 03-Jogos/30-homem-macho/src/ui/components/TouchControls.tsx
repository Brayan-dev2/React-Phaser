/**
 * `UI-02` · tipo de controle **TOQUE** (`04-interface` §4.4, §4.6).
 *
 * Só aparece quando o jogador escolhe `toque` nas configurações. Os botões são HTML — com
 * `aria-label`, área ≥ 44 × 44 px e foco visível — e emitem `ui:input`, que a `GameScene` trata
 * como se fosse a tecla da ação. O motor não sabe que houve um botão: se soubesse, haveria duas
 * maneiras de andar para manter em sincronia.
 *
 * `pointerdown`/`pointerup` (e não `click`): andar é **segurar**, não clicar. `pointercancel` e
 * `pointerleave` soltam o botão, senão o jogador fica a andar para sempre quando arrasta o dedo
 * fora da tela.
 */
import { EventBus } from '../../game/EventBus';
import type { AcaoJogo } from '../../services/settings';

interface Botao { acao: AcaoJogo; rotulo: string; classe: string }

const ESQUERDA: Botao[] = [
  { acao: 'esquerda', rotulo: '◀', classe: 'toque__btn--dir' },
  { acao: 'direita', rotulo: '▶', classe: 'toque__btn--dir' },
];

const DIREITA: Botao[] = [
  { acao: 'correr', rotulo: 'CORRER', classe: 'toque__btn--pequeno' },
  { acao: 'pular', rotulo: 'PULAR', classe: 'toque__btn--pular' },
  { acao: 'atacar', rotulo: 'ATACAR', classe: 'toque__btn--acao' },
  { acao: 'disparar', rotulo: 'DISPARAR', classe: 'toque__btn--pequeno' },
  { acao: 'gancho', rotulo: 'GANCHO', classe: 'toque__btn--pequeno' },
  { acao: 'interagir', rotulo: 'E', classe: 'toque__btn--pequeno' },
];

function BotaoToque({ acao, rotulo, classe }: Botao): JSX.Element {
  const soltar = (): void => { EventBus.emit('ui:input', { acao, pressed: false }); };
  return (
    <button type="button"
      className={`toque__btn ${classe}`}
      aria-label={rotulo}
      onPointerDown={(e) => {
        e.preventDefault();
        // capturar o ponteiro evita "soltar" quando o dedo sai do botão; se o browser recusar
        // (evento sintético, `pointerId` inválido), o `pointerup`/`pointerleave` continuam a valer
        try { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); } catch { /* sem captura */ }
        EventBus.emit('ui:input', { acao, pressed: true });
      }}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      onPointerLeave={soltar}
      onContextMenu={(e) => e.preventDefault()}>
      {rotulo}
    </button>
  );
}

export function TouchControls(): JSX.Element {
  return (
    <div className="toque" aria-label="Controles de toque">
      <div className="toque__lado">
        {ESQUERDA.map((b) => <BotaoToque key={b.acao} {...b} />)}
      </div>
      <div className="toque__lado">
        {DIREITA.map((b) => <BotaoToque key={b.acao} {...b} />)}
      </div>
    </div>
  );
}
