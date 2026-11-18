/**
 * Métricas de sessão para playtest (`P-01`, `P-27`, `P-29`).
 *
 * TS puro: sem Phaser, sem React, sem `window` (`ADR-01`). O tempo entra sempre
 * como parâmetro — nada aqui lê relógio por conta própria, então o teste é exato.
 */

export interface RoomVisit {
  readonly area: string;
  readonly room: string;
  readonly ms: number;
  readonly deaths: number;
}

export interface BossFight {
  /** Tempo entre a entrada na arena e a morte do chefe (ou do jogador). */
  readonly ms: number;
  readonly won: boolean;
  /** Vida do chefe no momento em que a luta terminou. */
  readonly bossHpLeft: number;
  readonly deaths: number;
}

export interface Session {
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly visits: RoomVisit[];
  readonly deaths: number;
  readonly passwordAttempts: number;
  readonly passwordFailures: number;
  readonly fights: BossFight[];
  readonly items: string[];
  readonly difficultyChanges: number;
  /** Sala atual e o instante em que ela começou (fecha na troca). */
  readonly current: { area: string; room: string; since: number } | null;
  /** Luta em andamento: a arena conta do instante em que o jogador entra. */
  readonly fight: { since: number; deaths: number } | null;
}

export interface Summary {
  readonly totalMs: number;
  readonly perArea: ReadonlyArray<{ area: string; ms: number; deaths: number }>;
  readonly deaths: number;
  readonly passwordAttempts: number;
  readonly passwordFailures: number;
  readonly items: string[];
  readonly difficultyChanges: number;
  readonly boss: { attempts: number; wins: number; ttkMs: number | null; bestMs: number | null } ;
}

const NADA = '—';

export function createSession(now: number): Session {
  return {
    startedAt: now, endedAt: null, visits: [], deaths: 0,
    passwordAttempts: 0, passwordFailures: 0, fights: [], items: [],
    difficultyChanges: 0, current: null, fight: null,
  };
}

/** Fecha a sala anterior e abre a nova. Reentrar na mesma sala só reinicia o relógio. */
export function enterRoom(s: Session, area: string, room: string, now: number): Session {
  const visits = s.current && s.current.room !== room
    ? [...s.visits, { area: s.current.area, room: s.current.room, ms: now - s.current.since, deaths: 0 }]
    : s.visits;
  return { ...s, visits, current: { area, room, since: now } };
}

/** A morte soma na sala atual e, se houver luta em andamento, na tentativa. */
export function addDeath(s: Session, now: number): Session {
  const visits = s.current
    ? [...s.visits, { area: s.current.area, room: s.current.room, ms: now - s.current.since, deaths: 1 }]
    : s.visits;
  return {
    ...s,
    visits,
    current: s.current ? { ...s.current, since: now } : null,
    deaths: s.deaths + 1,
    fight: s.fight ? { ...s.fight, deaths: s.fight.deaths + 1 } : null,
  };
}

export function startFight(s: Session, now: number): Session {
  if (s.fight) return s;
  return { ...s, fight: { since: now, deaths: 0 } };
}

/** `won: false` fecha a tentativa como derrota e o próximo `startFight` abre outra. */
export function endFight(
  s: Session, now: number, won: boolean, bossHpLeft: number,
): Session {
  if (!s.fight) return s;
  const fight: BossFight = {
    ms: now - s.fight.since, won, bossHpLeft, deaths: s.fight.deaths,
  };
  return { ...s, fights: [...s.fights, fight], fight: null };
}

export function addPasswordAttempt(s: Session, ok: boolean): Session {
  return {
    ...s,
    passwordAttempts: s.passwordAttempts + 1,
    passwordFailures: s.passwordFailures + (ok ? 0 : 1),
  };
}

export function addItem(s: Session, id: string): Session {
  if (s.items.includes(id)) return s;
  return { ...s, items: [...s.items, id] };
}

export function addDifficultyChange(s: Session): Session {
  return { ...s, difficultyChanges: s.difficultyChanges + 1 };
}

export function endSession(s: Session, now: number): Session {
  const fechada = s.current
    ? { ...s, visits: [...s.visits, { area: s.current.area, room: s.current.room, ms: now - s.current.since, deaths: 0 }] }
    : s;
  return { ...fechada, endedAt: now, current: null };
}

/**
 * Resumo pronto para o relatório. `ttkMs` é a média das vitórias — é o número
 * que responde `P-29` (alvo: 22–35 s); `bestMs` é a melhor tentativa vitoriosa.
 */
export function summarize(s: Session): Summary {
  const until = s.endedAt ?? (s.current ? s.current.since : s.startedAt);
  const perArea = new Map<string, { ms: number; deaths: number }>();
  for (const v of s.visits) {
    const cur = perArea.get(v.area) ?? { ms: 0, deaths: 0 };
    perArea.set(v.area, { ms: cur.ms + v.ms, deaths: cur.deaths + v.deaths });
  }
  const wins = s.fights.filter((f) => f.won);
  const ttk = wins.length ? Math.round(wins.reduce((a, f) => a + f.ms, 0) / wins.length) : null;
  return {
    totalMs: Math.max(0, until - s.startedAt),
    perArea: [...perArea.entries()].map(([area, v]) => ({ area, ms: v.ms, deaths: v.deaths })),
    deaths: s.deaths,
    passwordAttempts: s.passwordAttempts,
    passwordFailures: s.passwordFailures,
    items: s.items,
    difficultyChanges: s.difficultyChanges,
    boss: {
      attempts: s.fights.length,
      wins: wins.length,
      ttkMs: ttk,
      bestMs: wins.length ? Math.min(...wins.map((f) => f.ms)) : null,
    },
  };
}

/** `mm:ss` para o relatório; `nadaMs` evita "NaN" no painel. */
export function formatMs(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return NADA;
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
