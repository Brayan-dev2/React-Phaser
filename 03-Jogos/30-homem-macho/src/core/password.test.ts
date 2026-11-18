import { describe, expect, it } from 'vitest';
import { checkPassword, clueLines, PASSWORD, PASSWORD_LABEL, CLUE_1, CLUE_2 } from './password';

describe('password — MEC-006', () => {
  it('a senha canônica é mão → engrenagem → traços → olho', () => {
    expect(PASSWORD).toEqual(['hand', 'gear', 'strokes', 'eye']);
  });

  it('senha completa e correta abre', () => {
    expect(checkPassword(['hand', 'gear', 'strokes', 'eye'])).toEqual({ kind: 'open' });
  });

  it('entrada parcial não é erro, é incompleta', () => {
    expect(checkPassword([])).toEqual({ kind: 'incomplete' });
    expect(checkPassword(['hand', 'gear'])).toEqual({ kind: 'incomplete' });
  });

  it('erro aponta a primeira posição divergente', () => {
    expect(checkPassword(['hand', 'gear', 'eye'])).toEqual({ kind: 'wrong', firstWrongIndex: 2 });
    expect(checkPassword(['gear'])).toEqual({ kind: 'wrong', firstWrongIndex: 0 });
  });

  it('ordem trocada não abre', () => {
    expect(checkPassword(['gear', 'hand', 'strokes', 'eye']).kind).toBe('wrong');
  });

  it('as duas pistas cobrem as 4 posições sem repetir', () => {
    const positions = [...CLUE_1.positions, ...CLUE_2.positions].sort();
    expect(positions).toEqual([1, 2, 3, 4]);
    const symbols = [...CLUE_1.symbols, ...CLUE_2.symbols];
    expect(new Set(symbols).size).toBe(4);
  });

  it('as pistas têm texto acessível (nunca só imagem)', () => {
    expect(clueLines(CLUE_1)).toEqual(['1 — mão aberta', '3 — três traços']);
    expect(clueLines(CLUE_2)).toEqual(['2 — engrenagem partida', '4 — olho vazado']);
    expect(Object.keys(PASSWORD_LABEL)).toHaveLength(4);
  });
});
