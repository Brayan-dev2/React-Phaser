/** LVL-05 §5 e §8: Força, bloco, contrapeso e elevador. */
import { describe, expect, it } from 'vitest';
import {
  ELEVATOR_LINE, applyCounterweight, elevatorVerdict, engagesCounterweight, pushBlock,
} from './machines';

describe('bloco pesado (`HAB-05`)', () => {
  const base = { blockColumn: 13, dir: 1 as const, blockedColumns: [], minColumn: 3, maxColumn: 17 };

  it('sem Força o bloco não cede — é a exposição 1 de PAT-LD-03', () => {
    expect(pushBlock({ ...base, hasStrength: false })).toEqual({
      moved: false, column: 13, blockedBy: 'sem-forca',
    });
  });

  it('com Força anda exatamente 1 tile por empurrão', () => {
    expect(pushBlock({ ...base, hasStrength: true })).toEqual({
      moved: true, column: 14, blockedBy: null,
    });
  });

  it('empurra 4 vezes de x=13 até a placa em x=17', () => {
    let col = 13;
    for (let i = 0; i < 4; i++) {
      const r = pushBlock({ ...base, hasStrength: true, blockColumn: col });
      expect(r.moved).toBe(true);
      col = r.column;
    }
    expect(col).toBe(17);
    expect(engagesCounterweight(col, 17)).toBe(true);
  });

  it('não atravessa parede nem desnível', () => {
    expect(pushBlock({ ...base, hasStrength: true, blockedColumns: [14] }).blockedBy).toBe('parede');
  });

  it('não sai do corredor plano', () => {
    expect(pushBlock({ ...base, hasStrength: true, blockColumn: 17 }).blockedBy).toBe('limite');
    expect(pushBlock({ ...base, hasStrength: true, dir: -1, blockColumn: 3 }).blockedBy).toBe('limite');
  });
});

describe('contrapeso (`CEN-043`) é estado de mapa, não de sessão', () => {
  it('engata só na coluna da placa', () => {
    expect(engagesCounterweight(16, 17)).toBe(false);
    expect(engagesCounterweight(17, 17)).toBe(true);
  });

  it('uma vez engatado, morrer não desengata (LVL-05 §8)', () => {
    expect(applyCounterweight(true, false)).toBe(true);
    expect(applyCounterweight(false, true)).toBe(true);
    expect(applyCounterweight(false, false)).toBe(false);
  });
});

describe('elevador de L05-03', () => {
  it('sem Força: informação, não punição', () => {
    expect(elevatorVerdict(false, true)).toBe('sem-forca');
    expect(ELEVATOR_LINE['sem-forca']).toContain('FORÇA');
  });

  it('com Força e sem contrapeso, ainda não sobe', () => {
    expect(elevatorVerdict(true, false)).toBe('sem-contrapeso');
  });

  it('Força + contrapeso = pronto', () => {
    expect(elevatorVerdict(true, true)).toBe('pronto');
  });
});
