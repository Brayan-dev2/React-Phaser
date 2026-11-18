/**
 * `DEC-042` — **as três raras não estão em pedestal nenhum**, em nenhum dos 16 setores.
 *
 * Este teste existe porque a mudança é invisível: o `X` de L09-04, L10-02 e L11-02 era um glifo numa
 * grelha de caracteres, e volvê-lo a pôr é uma edição de um carácter que não quebra nada — dava um
 * item garantido, e o drop de chefe passava a ser decoração. Os três testes de nível (um por setor)
 * prendem a sala; este prende o **jogo inteiro**, incluindo setores que ninguém espera.
 *
 * O que se afirma:
 *
 * 1. nenhuma sala declara um `glyph.X` de gancho, garra ou estandarte;
 * 2. nenhuma grade tem `X` numa sala que o `LevelBuilder` traduziria para `ITM-008/009/010`;
 * 3. as três raras caem **só** de `DROPS_RAROS` — a lista de quem cai de chefe é a lista de raras;
 * 4. as três garantidas (`ITM-003/005/006`) continuam no chão, porque sem elas não há tutorial.
 */
import { describe, expect, it } from 'vitest';
import { AREAS } from './index';
import { DROPS_RAROS } from '../tuning';
import type { Room } from './lvl01';

const TODAS: readonly Room[] = Object.values(AREAS).flatMap((a) => a.rooms);

/** Os `glyphs.X` que davam uma habilidade rara. */
const RAROS = new Set(['hook-item', 'climb-item', 'glide-item']);

describe('DEC-042 — as raras caem de chefe, não de pedestal', () => {
  it('há salas para verificar (o registo não está vazio)', () => {
    expect(TODAS.length).toBeGreaterThan(50);
  });

  it('nenhuma sala entrega gancho, garra ou estandarte num pedestal', () => {
    const culpadas = TODAS.filter((r) => r.glyphs?.X !== undefined && RAROS.has(r.glyphs.X));
    expect(culpadas.map((r) => r.id)).toEqual([]);
  });

  it('nenhum `X` de nenhuma grade resolve para uma rara', () => {
    // a mesma resolução do `LevelBuilder`: sem `glyph.X`, o `X` é a Força (ITM-005)
    const resolve = (room: Room): string => room.glyphs?.X ?? 'item';
    for (const room of TODAS) {
      if (!room.grid.some((linha) => linha.includes('X'))) continue;
      expect(RAROS.has(resolve(room)), `${room.id} → ${resolve(room)}`).toBe(false);
    }
  });

  it('a lista de quem cai de chefe é exactamente as três raras', () => {
    expect(Object.values(DROPS_RAROS.itens).sort()).toEqual(['climb', 'glide', 'hook']);
    expect(Object.keys(DROPS_RAROS.itens).sort()).toEqual(['ITM-008', 'ITM-009', 'ITM-010']);
  });

  it('as garantidas continuam no chão: Força e Fôlego ainda têm pedestal', () => {
    const resolves = TODAS.filter((r) => r.grid.some((l) => l.includes('X')))
      .map((r) => r.glyphs?.X ?? 'item');
    // Força (LVL-05, `X` sem glyph) e Fôlego (LVL-06, `breath-item`) — as duas que o `X` ainda serve
    expect(resolves).toContain('item');
    expect(resolves).toContain('breath-item');
    expect(new Set(resolves)).toEqual(new Set(['item', 'breath-item']));
  });
});
