/**
 * `MEC-004` — **o que se conquista não regride.** Regra pura, sem motor.
 *
 * As barras de status (vida, escudo, poder) e o fôlego ganham teto máximo, e as habilidades
 * conquistadas ficam para sempre. A morte devolve as barras **cheias** e não toca em nenhum teto:
 * perder progressão permanente ao cair tornaria cada tentativa de arena um recomeço, e o jogo já
 * é difícil sem isso (é o mesmo princípio do `TST-005`, agora escrito para as barras).
 *
 * O ficheiro existe por duas razões concretas:
 *
 * 1. **Há um sítio só onde os tetos são lidos.** Hoje as capacidades vinham de `PLAYER.hp` em cada
 *    chamada de `applyItem`; assim, o dia em que um item aumentar a vida máxima é uma linha aqui e
 *    não uma caça ao `PLAYER.hp` pelo motor todo.
 * 2. **A morte deixa de ser "recriar o jogador".** É uma função com nome e teste: `aoMorrer`.
 */
export type Habilidade = 'double-jump' | 'strength' | 'breath' | 'hook' | 'climb' | 'glide';

export interface Teto {
  readonly hp: number;
  readonly shield: number;
  readonly power: number;
}

export interface Permanentes extends Teto {
  /** Habilidades conquistadas. Lista, não booleano por habilidade: um teste pode contá-las. */
  readonly habilidades: readonly Habilidade[];
}

export const HABILIDADES: readonly Habilidade[] = [
  'double-jump', 'strength', 'breath', 'hook', 'climb', 'glide',
];

/** Estado inicial: os tetos do `tuning.ts` e nenhuma habilidade. */
export function permanentesIniciais(teto: Teto): Permanentes {
  // `Number.isFinite` antes do `Math.floor`: `Math.floor(NaN)` é `NaN`, e um teto `NaN` atravessaria
  // a `applyItem` até a barra do HUD escrever `NaN`
  const teto_ = (v: number, min: number): number =>
    (Number.isFinite(v) ? Math.max(min, Math.floor(v)) : min);
  return {
    hp: teto_(teto.hp, 1),
    shield: teto_(teto.shield, 0),
    power: teto_(teto.power, 0),
    habilidades: [],
  };
}

/**
 * Sobe um teto. **Nunca desce** — um ganho negativo é ignorado em vez de ser aplicado ao contrário,
 * porque "perder vida máxima" não é uma coisa que o jogo tenha.
 */
export function melhorarTeto(p: Permanentes, ganho: Partial<Teto>): Permanentes {
  const subir = (atual: number, delta: number | undefined): number =>
    (typeof delta === 'number' && Number.isFinite(delta) ? Math.max(atual, atual + delta) : atual);
  return {
    ...p,
    hp: subir(p.hp, ganho.hp),
    shield: subir(p.shield, ganho.shield),
    power: subir(p.power, ganho.power),
  };
}

/** Conquista uma habilidade. Repetida não duplica; a ordem de chegada é preservada. */
export function conquistar(p: Permanentes, h: Habilidade): Permanentes {
  if (p.habilidades.includes(h)) return p;
  return { ...p, habilidades: [...p.habilidades, h] };
}

export function tem(p: Permanentes, h: Habilidade): boolean {
  return p.habilidades.includes(h);
}

/**
 * **A morte.** Não tira tetos nem habilidades — é uma função identidade de propósito, para o
 * teste poder dizer "nada regrediu" sobre a função que a cena chama, e não sobre uma suposição.
 */
export function aoMorrer(p: Permanentes): Permanentes {
  return p;
}

/** Ao reaparecer, as barras voltam **cheias** — no teto conquistado, não num teto fixo. */
export function aoReaparecer(p: Permanentes): { hp: number; shield: number; power: number } {
  return { hp: p.hp, shield: p.shield, power: p.power };
}

/** Os tetos, no formato que `applyItem` (`core/items.ts`) espera. */
export function limites(p: Permanentes): { hp: number; shield: number } {
  return { hp: p.hp, shield: p.shield };
}
