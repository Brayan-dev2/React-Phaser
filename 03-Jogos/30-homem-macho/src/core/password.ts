/**
 * `MEC-006` — senha da porta de LVL-02 (Galeria Partida).
 * Regra pura: a ordem canônica vive aqui, as pistas também. A UI só desenha.
 * Fonte: `docs/niveis/LVL-02.md` §5.7.
 */

export const PASSWORD_SYMBOLS = ['hand', 'gear', 'strokes', 'eye'] as const;

export type PasswordSymbol = (typeof PASSWORD_SYMBOLS)[number];

/** Nome acessível de cada glifo — a pista nunca depende só de imagem (§5.7 acessibilidade). */
export const PASSWORD_LABEL: Record<PasswordSymbol, string> = {
  hand: 'mão aberta',
  gear: 'engrenagem partida',
  strokes: 'três traços',
  eye: 'olho vazado',
};

export interface Clue {
  /** posições 1-based na senha */
  readonly positions: readonly number[];
  readonly symbols: readonly PasswordSymbol[];
}

/** Pista 1 — inscrição de L02-04. */
export const CLUE_1: Clue = { positions: [1, 3], symbols: ['hand', 'strokes'] };
/** Pista 2 — inscrição de L02-06. */
export const CLUE_2: Clue = { positions: [2, 4], symbols: ['gear', 'eye'] };

/** A senha completa, na ordem de entrada. */
export const PASSWORD: readonly PasswordSymbol[] = PASSWORD_SYMBOLS;

export type PasswordVerdict =
  | { readonly kind: 'incomplete' }
  | { readonly kind: 'wrong'; readonly firstWrongIndex: number }
  | { readonly kind: 'open' };

/** Compara a entrada com a senha. Não há limite de tentativas (`max_attempts = 0`). */
export function checkPassword(input: readonly PasswordSymbol[]): PasswordVerdict {
  const len = Math.min(input.length, PASSWORD.length);
  for (let i = 0; i < len; i++) {
    if (input[i] !== PASSWORD[i]) return { kind: 'wrong', firstWrongIndex: i };
  }
  if (input.length < PASSWORD.length) return { kind: 'incomplete' };
  return { kind: 'open' };
}

/** Texto das pistas, para o quadro de aviso e para o `aria-label` do painel. */
export function clueLines(clue: Clue): string[] {
  return clue.symbols.map((s, i) => `${clue.positions[i] ?? '?'} — ${PASSWORD_LABEL[s]}`);
}
