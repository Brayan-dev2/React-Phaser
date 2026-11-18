import { describe, expect, it } from 'vitest';
import {
  CLIMB, HATCH_HEIGHT_PX, canGrip, climbTimeMs, doubleJumpHeight, hatchNeedsClimb, hatchShortfall, noPlatformsUnderHatch, wallIsContinuous, wallJumpVelocity, gestoNaParede,
} from './climb';

describe('HAB-03 escalada — a ficha (§7.1)', () => {
  it('sobe 6 tiles a 90 px/s em 4,3 s', () => {
    expect(Math.round(climbTimeMs(HATCH_HEIGHT_PX))).toBe(4267);
    expect(CLIMB.upSpeed).toBe(90);
    expect(CLIMB.downSpeed).toBeGreaterThan(CLIMB.upSpeed);   // descer é mais rápido, de propósito
  });

  it('o pulo de parede empurra para longe dela, não para onde o herói olha', () => {
    expect(wallJumpVelocity(-1)).toEqual({ vx: 420, vy: -560 });   // parede à esquerda
    expect(wallJumpVelocity(1)).toEqual({ vx: -420, vy: -560 });   // parede à direita
  });

  it('não é arma', () => {
    expect(CLIMB.isWeapon).toBe(false);
  });
});

describe('HAB-03 escalada — aderência (§7.1)', () => {
  it('exige as quatro condições, e a aderência é de 100 ms', () => {
    expect(canGrip(true, true, true, 100)).toBe(true);
    expect(canGrip(true, true, true, 99)).toBe(false);      // ainda não aderiu
    expect(canGrip(false, true, true, 500)).toBe(false);    // sem a garra
    expect(canGrip(true, false, true, 500)).toBe(false);    // parede comum não agarra
    expect(canGrip(true, true, false, 500)).toBe(false);    // sem direção pressionada
  });
});

describe('HAB-03 escalada — o alçapão (DEC-015, §6.2)', () => {
  it('o alçapão fica a 6 tiles e o duplo chega a 4,3: faltam 108 px', () => {
    expect(HATCH_HEIGHT_PX).toBe(384);
    expect(Math.round(doubleJumpHeight())).toBe(276);
    expect(Math.floor(hatchShortfall())).toBe(108);   // 108,17 — o §6.2 arredonda
    expect(hatchNeedsClimb()).toBe(true);
  });

  it('a parede de ganchos tem de ir do piso ao teto (§6.3 regra 2)', () => {
    expect(wallIsContinuous([{ topRow: 1, bottomRow: 6 }])).toBe(true);
    expect(wallIsContinuous([{ topRow: 1, bottomRow: 4 }])).toBe(false);   // para no meio
    expect(wallIsContinuous([{ topRow: 4, bottomRow: 6 }])).toBe(false);   // começa no meio
  });

  it('não pode haver plataforma sob o alçapão (§6.3 regra 1)', () => {
    expect(noPlatformsUnderHatch(13, 14, [])).toBe(true);
    expect(noPlatformsUnderHatch(13, 14, [{ from: 12, to: 15, topRow: 4 }])).toBe(false);
    // plataforma longe da vertical do alçapão não interfere
    expect(noPlatformsUnderHatch(13, 14, [{ from: 2, to: 4, topRow: 4 }])).toBe(true);
  });
});

/**
 * `DEC-049` — **o gesto de subir parede**, e o relato que o obrigou a existir: «L10-05 Escada em
 * Caracol, o personagem não sobe, acabou virando uma parede». A escalada estava ligada ao pulo,
 * e o pulo agarrado é o salto de parede: o herói soltava-se a cada toque.
 */
describe('o gesto na parede (`DEC-049`)', () => {
  const gesto = (o: Partial<{ up: boolean; down: boolean; jumpPressed: boolean; left: boolean; right: boolean }>) =>
    gestoNaParede({ up: false, down: false, jumpPressed: false, left: false, right: false, ...o });

  it('segurar a subida **sobe** — e não salta', () => {
    expect(gesto({ up: true })).toBe('subir');
  });

  it('segurar a descida desce', () => {
    expect(gesto({ down: true })).toBe('descer');
  });

  it('não segurar nada fica pendurado — a garra agarra, não escorrega', () => {
    expect(gesto({})).toBe('parado');
  });

  it('o salto de parede é o pulo — e a direção fica de fora de propósito', () => {
    /*
     * A primeira versão pedia a direção contrária e era **inalcançável**: empurrar para longe da
     * parede solta a garra antes de o salto poder ser lido. Por isso o gesto é só o pulo, e o
     * lado de saída vem de `climbWallSide` (o corpo sabe onde está a parede; o jogador não tem
     * de decorar).
     */
    expect(gesto({ jumpPressed: true })).toBe('salto-de-parede');
    expect(gesto({ jumpPressed: true, left: true })).toBe('salto-de-parede');
    expect(gesto({ jumpPressed: true, right: true })).toBe('salto-de-parede');
  });

  it('o salto ganha à subida: pendurado, o pulo é sempre o pulo', () => {
    expect(gesto({ up: true, jumpPressed: true })).toBe('salto-de-parede');
  });

  it('subir e descer ao mesmo tempo: **desce** (a saída de emergência manda)', () => {
    // ordem deliberada: quem está preso numa parede precisa de sair depressa, e `S` é o reflexo
    expect(gesto({ up: true, down: true })).toBe('descer');
  });

  it('o salto de parede ganha à descida — saltar é a saída mais rápida', () => {
    expect(gesto({ down: true, jumpPressed: true })).toBe('salto-de-parede');
  });
});
