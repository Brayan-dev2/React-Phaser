import { describe, expect, it } from 'vitest';
import {
  GLIDE, HORIZONTAL_RULER, canGlide, doubleJumpHeight, gapVerdict, glideIsJustAConversion,
  glideRange, glideWithDoubleJump,
} from './glide';

const TILE = 64;

describe('HAB-07 planar — a ficha (§7.1)', () => {
  it('desce a 120 px/s e mantém os 308 px/s de corrida', () => {
    expect(GLIDE.fallSpeed).toBe(120);
    expect(GLIDE.airSpeed).toBe(308);
    expect(GLIDE.isWeapon).toBe(false);
  });

  it('só liga no ar, e só caindo', () => {
    expect(canGlide(true, false, true)).toBe(true);
    expect(canGlide(true, true, true)).toBe(false);    // no chão não é andar lento
    expect(canGlide(true, false, false)).toBe(false);  // subindo não abre o pano
    expect(canGlide(false, false, true)).toBe(false);  // sem o estandarte
  });
});

describe('HAB-07 planar — o câmbio (§7.2)', () => {
  it('sem altura o pano não vale nada: 0 px', () => {
    expect(glideRange(0)).toBe(0);
    expect(glideIsJustAConversion()).toBe(true);
    expect(GLIDE.canGainHeight).toBe(false);
  });

  it('com a altura do duplo (276 px), 1.022 px de alcance — o §7.2 publica 1.042', () => {
    expect(Math.round(doubleJumpHeight())).toBe(276);
    // 2 subidas (1,018 s) + descida planejada (2,30 s) = 3,32 s × 308 px/s
    expect(Math.round(glideWithDoubleJump())).toBe(1022);
    expect(glideWithDoubleJump() / TILE).toBeCloseTo(16.0, 1);
    expect(HORIZONTAL_RULER.glide - 1042).toBe(-20);   // os 20 px do solver do GDD
  });

  it('planar num salto simples (138 px) dá 354 px — menos que o salto duplo correndo', () => {
    const simples = glideRange(138);
    expect(Math.round(simples)).toBe(354);
    expect(simples).toBeLessThan(HORIZONTAL_RULER.doubleRun);
  });
});

describe('HAB-07 planar — a régua horizontal (§7.3)', () => {
  it('as quatro entradas da régua estão na ordem certa', () => {
    expect(HORIZONTAL_RULER.singleRun).toBeLessThan(HORIZONTAL_RULER.doubleRun);
    // `P-59`: o gancho (512) é **mais curto** que o duplo correndo (534) — 22 px
    expect(HORIZONTAL_RULER.hook).toBeLessThan(HORIZONTAL_RULER.doubleRun);
    expect(HORIZONTAL_RULER.doubleRun - HORIZONTAL_RULER.hook).toBe(22);
    expect(HORIZONTAL_RULER.glide).toBe(1022);
  });

  it('os três vãos do setor exigem o estandarte e três degraus (§8)', () => {
    for (const [tiles, falta] of [[11, 170], [12, 234], [13, 298]] as const) {
      expect(gapVerdict(tiles * TILE)).toBe('exige-glide');
      expect(tiles * TILE - HORIZONTAL_RULER.doubleRun).toBe(falta);
    }
    expect(gapVerdict(8 * TILE)).toBe('livre');                 // 512: o erro de LVL-09
    expect(gapVerdict(17 * TILE)).toBe('impossivel');           // 1.088 > 1.022
  });

  it('o vão de 13 tiles deixa 190 px de margem com o estandarte (§8 publica 210)', () => {
    expect(HORIZONTAL_RULER.glide - 13 * TILE).toBe(190);
    expect(HORIZONTAL_RULER.glide / TILE).toBeGreaterThan(13);   // continua atravessável
  });
});
