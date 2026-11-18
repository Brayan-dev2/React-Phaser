/** `HAB-06` Fôlego (`LVL-06` §5): barra que só existe embaixo d'água. */
import { useUi } from '../../store/uiStore';

export function BreathBar(): JSX.Element | null {
  const { state } = useUi();
  const breath = state.breath;
  if (!breath || !breath.submerged) return null;
  const pct = Math.max(0, Math.min(100, (breath.max > 0 ? breath.ms / breath.max : 0) * 100));
  const segundos = Math.ceil(breath.ms / 1000);

  return (
    <div
      className={`breath${pct < 34 ? ' breath--low' : ''}`}
      role="progressbar"
      aria-label={`Fôlego: ${segundos} s`}
      aria-valuenow={Math.round(breath.ms / 100) / 10}
      aria-valuemin={0}
      aria-valuemax={Math.round(breath.max / 100) / 10}
    >
      <span className="breath__label">FÔLEGO</span>
      <span className="breath__track"><span className="breath__fill" style={{ width: `${pct}%` }} /></span>
      <span className="breath__value">{segundos}s</span>
    </div>
  );
}
