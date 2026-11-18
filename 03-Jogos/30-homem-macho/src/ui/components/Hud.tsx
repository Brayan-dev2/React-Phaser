/** HUD — `UI-01`/`UI-02`. Só snapshot: teto de 10 Hz vem do `GameScene` (GDD 7.5). */
import { openHabilidades, openInventory, openMapa, useUi } from '../../store/uiStore';
import { BossBar } from './BossBar';
import { BreathBar } from './BreathBar';
import { PostoBar } from './PostoBar';
import { IconeHabilidades, IconeMapa, IconeMochila } from './ItemIcon';

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }): JSX.Element {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="bar" role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
      <span className="bar__label">{label}</span>
      <span className="bar__track"><span className="bar__fill" style={{ width: `${pct}%`, background: color }} /></span>
      <span className="bar__value">{Math.round(value)}</span>
    </div>
  );
}

export function Hud(): JSX.Element {
  const { state, setPaused } = useUi();
  return (
    <div className="hud">
      <BossBar />
      <PostoBar />
      <BreathBar />
      <div className="hud__left">
        <Bar label="VIDA" value={state.hp} max={100} color="#D95555" />
        <Bar label="ESCUDO" value={state.shield} max={50} color="#F2C66D" />
        <Bar label="PODER" value={state.power} max={100} color="#7FD3C0" />
      </div>
      <div className="hud__right">
        <span className="hud__room">{state.room.id} · {state.room.name}</span>
        <span className="hud__counter">{state.room.index + 1}/{state.room.total}</span>
        {/* `MEC-004` (`DEC-038`): onde está a bolsa da morte. Dourado quando é nesta sala —
            é o sinal para o jogador não atravessar a porta sem ela */}
        {state.bolsaMorte.existe && state.bolsaMorte.rotulo && (
          <span
            className={`hud__counter hud__counter--bolsa${state.bolsaMorte.naSala ? ' hud__counter--aqui' : ''}`}
            aria-label={state.bolsaMorte.naSala ? `${state.bolsaMorte.rotulo} — nesta sala` : state.bolsaMorte.rotulo ?? 'Bolsa da morte'}
          >
            {state.bolsaMorte.naSala ? '▸ ' : ''}{state.bolsaMorte.rotulo}
          </span>
        )}
        {/*
          `UI-07`: a mochila é o **ícone** (`I` é o atalho). O contador `n / 40` só aparece quando
          há algo dentro — um `0 / 40` permanente ao lado da vida seria ruído em toda a sala.
        */}
        <button
          className={`hud__btn hud__btn--mochila${state.items > 0 ? ' hud__btn--cheia' : ''}`}
          onClick={() => openInventory()}
          aria-label={`Abrir a mochila (tecla I) — ${state.items} de 40 espaços`}
          title="MOCHILA · I"
        >
          <IconeMochila />
          {/* `MEC-004`: moedas de mobs e chefes — e a morte leva-as todas, por isso o número é
            informação, não decoração: é o que está em risco na próxima sala */}
        {state.moedas > 0 && (
          <span className="hud__counter hud__counter--moedas" aria-label={`Moedas: ${state.moedas}`}>
            MOEDAS {state.moedas}
          </span>
        )}
        {state.items > 0 && <span className="hud__badge">{state.items}</span>}
        </button>
        {/* `LVL-15` §5.3: dois selos suspendem — o jogador precisa ver o segundo chegando */}
        {state.seals && (
          <span className="hud__counter" aria-live="polite"
            aria-label={`Selos: ${state.seals.label}${state.seals.suspended ? ' — suspenso' : ''}`}>
            SELOS {state.seals.label}{state.seals.suspended ? ' · SUSPENSO' : ''}
          </span>
        )}
        {/* `UI-22`: o mapa. Fica ao lado das habilidades — é o outro painel de "onde eu estou",
            e a tecla é própria (`M`), como o jogador pediu */}
        <button
          className="hud__btn hud__btn--mapa"
          onClick={() => openMapa()}
          aria-label="Abrir o mapa (tecla M)"
          title="MAPA · M"
        >
          <IconeMapa />
        </button>
        {/* `UI-14`: as habilidades. Fica ao lado da mochila, e mostra quantos níveis há por comprar
            quando há algum — um número que não existe não aparece (como o `0 / 40`) */}
        <button
          className={`hud__btn hud__btn--habilidades${state.habilidades.linhas.some((l) =>
            l.conquistada && l.custo !== null) ? ' hud__btn--cheia' : ''}`}
          onClick={() => openHabilidades()}
          aria-label="Abrir as habilidades (tecla H)"
          title="HABILIDADES · H"
        >
          <IconeHabilidades />
        </button>
        {/* `DEC-016`: contador, não mochila — `3 / 2` é a sobra e é de propósito (§8.3) */}
        {state.keys && (
          <span className="hud__counter" aria-label={`Chaves de chefe: ${state.keys.keys} de ${state.keys.required}`}>
            CHAVES {state.keys.keys} / {state.keys.required}
          </span>
        )}
        <button className="hud__btn" onClick={() => setPaused(true)} aria-label="Pausar">II</button>
      </div>
    </div>
  );
}
