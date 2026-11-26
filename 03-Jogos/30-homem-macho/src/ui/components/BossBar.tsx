/** `VIS-007` — barra de vida do chefe (`ENT-003`), acessível e só visível na luta. */
import { useEffect, useState } from 'react';
import { useUi } from '../../store/uiStore';

export function BossBar(): JSX.Element | null {
  const { state } = useUi();
  const boss = state.boss;
  // anúncio único ao entrar na fase 2 (`aria-live`), para leitor de tela
  const [anuncio, setAnuncio] = useState('');
  const phase = boss?.phase ?? 1;
  useEffect(() => {
    if (phase === 2) setAnuncio('O Guardião entrou na fase 2.');
  }, [phase]);
  if (!boss || boss.defeated) return null;
  const pct = Math.max(0, Math.min(100, (boss.hp / boss.max) * 100));

  return (
    <div className="bossbar" role="progressbar"
      aria-label={`${boss.name} — ${Math.round(pct)}% de vida`}
      aria-valuenow={boss.hp} aria-valuemin={0} aria-valuemax={boss.max}>
      <span className="bossbar__name">{boss.name} · FASE {boss.phase}</span>
      <span className="bossbar__track"><span className="bossbar__fill" style={{ width: `${pct}%` }} /></span>
      <span className="sr-only" role="status" aria-live="polite">{anuncio}</span>
      {/* `LVL-15` §5.3: o par não acelera — quem cai faz o outro **recuar**, não correr */}
      {boss.phase === 2 && <span className="bossbar__phase">FASE 2 · MAIS RÁPIDO</span>}
    </div>
  );
}
