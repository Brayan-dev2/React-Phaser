/** `patrol_sync` de `LVL-04.md` §5.2 — a formação só existe se a fase for travada. */
import { describe, expect, it } from 'vitest';
import { isInFormation, patrolDirection } from './patrol';

const TILE = 64;
const TILES = 8;
const SPEED = 70;                    // SENTINEL.speed
const SPAN_MS = (TILES * TILE / SPEED) * 1000;   // tempo para cruzar o trecho

describe('patrulha sincronizada (`LVL-04` §5.2)', () => {
  it('começa indo para a direita', () => {
    expect(patrolDirection(0, TILES, SPEED, TILE)).toBe(1);
  });

  it('vira exatamente ao completar o trecho', () => {
    expect(patrolDirection(SPAN_MS - 1, TILES, SPEED, TILE)).toBe(1);
    expect(patrolDirection(SPAN_MS + 1, TILES, SPEED, TILE)).toBe(-1);
  });

  it('volta ao início no fim do ciclo completo', () => {
    expect(patrolDirection(2 * SPAN_MS - 1, TILES, SPEED, TILE)).toBe(-1);
    expect(patrolDirection(2 * SPAN_MS + 1, TILES, SPEED, TILE)).toBe(1);
  });

  it('as três marcham na mesma direção em qualquer instante (formação)', () => {
    for (let t = 0; t < 4 * SPAN_MS; t += 137) {
      expect(isInFormation(t, 3, TILES, SPEED, TILE)).toBe(true);
    }
  });

  it('morte de uma não quebra a fase das outras: a direção não depende do número', () => {
    const t = SPAN_MS * 1.5;
    const antes = patrolDirection(t, TILES, SPEED, TILE);
    expect(isInFormation(t, 2, TILES, SPEED, TILE)).toBe(true);
    expect(patrolDirection(t, TILES, SPEED, TILE)).toBe(antes);
  });

  it('trechos diferentes produzem fases diferentes — é o que separa Ronda de patrulha solta', () => {
    const t = SPAN_MS * 0.8;
    expect(patrolDirection(t, 4, SPEED, TILE)).not.toBe(patrolDirection(t, 8, SPEED, TILE));
  });

  it('aguenta tempo negativo e trecho degenerado sem explodir', () => {
    expect([1, -1]).toContain(patrolDirection(-500, TILES, SPEED, TILE));
    expect([1, -1]).toContain(patrolDirection(10, 0, SPEED, TILE));
  });
});
