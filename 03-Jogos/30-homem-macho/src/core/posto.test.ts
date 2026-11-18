import { describe, expect, it } from 'vitest';
import {
  BAIXAS, apitoAllowed, applyPoise, baixasSurviveDeath, canSign, clampToLeash, fallInHole,
  hitsPerBaixa, holeAllowed, maxHoles, pickHole, poiseFor, postoKillable, processaBaixa,
  protocolTriggered, rendido, signComplete, staggered, throneLocked, totalHits, canHold,
  type PostoTiming,
} from './posto';

/** Os números de `LVL-16.md` §5.5–§5.6 — os mesmos de `tuning.ts`. */
const T: PostoTiming = {
  poise: [100, 125, 150],
  golpePoise: 25,
  staggerMs: 4500,
  staggerSwayMs: 300,
  channelMs: 3000,
  staggerSlackMs: 1200,
  protocolHits: 3,
  protocolWindowMs: 4000,
  protocolMs: 1400,
  crackMs: 1400,
  holeMs: 2000,
  maxHoles: 8,
  maxHolesFinal: 10,
  maxAdjacent: 2,
};

describe('ENT-008 — postura, baixa e o fim', () => {
  it('**o chefe não tem vida**: nada aqui leva a `MEC-009` (§5.1)', () => {
    expect(postoKillable()).toBe(false);
  });

  it('as três baixas pedem 100, 125 e 150 de postura', () => {
    expect([1, 2, 3].map((b) => poiseFor(b, T))).toEqual([100, 125, 150]);
    expect(poiseFor(0, T)).toBe(100);
    expect(poiseFor(9, T)).toBe(150);
  });

  it('15 golpes de 25 no total, e 4/5/6 por baixa (§5.5, §6.1)', () => {
    expect(hitsPerBaixa(T)).toEqual([4, 5, 6]);
    expect(totalHits(T)).toBe(15);
    expect(totalHits(T) * T.golpePoise).toBe(375);
  });

  it('a postura desce até 0 e dispara o atordoamento, nunca abaixo de zero', () => {
    expect(applyPoise(100, 25)).toBe(75);
    expect(applyPoise(25, 25)).toBe(0);
    expect(applyPoise(10, 25)).toBe(0);
    expect(staggered(0)).toBe(true);
    expect(staggered(1)).toBe(false);
  });

  it('4.500 = 300 de cambaleio + 3.000 de canal + 1.200 de folga', () => {
    expect(T.staggerSwayMs + T.channelMs + T.staggerSlackMs).toBe(T.staggerMs);
    expect(T.staggerMs).toBe(4500);
  });

  it('o canal abre depois do cambaleio e fecha com a folga — quem atrasa perde a baixa', () => {
    expect(canSign(0, T)).toBe(false);      // ainda cambaleando
    expect(canSign(300, T)).toBe(true);     // pode começar a assinar
    expect(canSign(1499, T)).toBe(true);    // 1.499 + 3.000 = 4.499, dentro do atordoamento
    expect(canSign(1500, T)).toBe(false);   // a folga acabou: a baixa não fecha a tempo
    expect(signComplete(2999, T)).toBe(false);
    expect(signComplete(3000, T)).toBe(true);
    // começar é uma janela; continuar é outra — o canal que abre aos 300 fecha aos 3.300
    expect(canHold(3299, T)).toBe(true);
    expect(canHold(4499, T)).toBe(true);
    expect(canHold(4500, T)).toBe(false);
  });

  it('três baixas e ele se rende — sem quarta, sem morte', () => {
    expect(rendido(2)).toBe(false);
    expect(rendido(3)).toBe(true);
    expect(rendido(4)).toBe(true);
    expect(BAIXAS).toBe(3);
  });

  it('`MEC-011` processa uma vez por baixa (idempotente)', () => {
    expect(processaBaixa(0, false)).toEqual({ baixas: 1, changed: true });
    expect(processaBaixa(1, true)).toEqual({ baixas: 1, changed: false });
    expect(processaBaixa(2, false).baixas).toBe(3);
  });

  it('**as baixas sobrevivem à morte do jogador** (§10.1, o oposto de LVL-15)', () => {
    expect(baixasSurviveDeath(2)).toBe(2);
  });

  it('`ATK-21` dispara com 3 golpes em 4.000 ms e nada mais', () => {
    expect(protocolTriggered([1000, 2000], 3000, T)).toBe(false);
    expect(protocolTriggered([1000, 2000, 3000], 3500, T)).toBe(true);
    // os antigos saem da janela: quem bate devagar nunca dispara o protocolo
    expect(protocolTriggered([0, 100, 200], 5000, T)).toBe(false);
  });

  it('o apito exige 1.500 ms perto do posto e no máximo 2 Sentinelas vivas', () => {
    expect(apitoAllowed(1499, 0)).toBe(false);
    expect(apitoAllowed(1500, 0)).toBe(true);
    expect(apitoAllowed(1500, 2)).toBe(false);
    expect(apitoAllowed(9000, 1)).toBe(true);
  });

  it('o leash: ele nunca vai a oeste de `leashX` (§6.5)', () => {
    expect(clampToLeash(5, 13)).toBe(13);
    expect(clampToLeash(20, 13)).toBe(20);
  });

  it('o Trono não tem fechadura — a terceira chave não abre nada (§7.1)', () => {
    expect(throneLocked()).toBe(false);
  });

  describe('CEN-113 — o desgaste', () => {
    it('cabe 8 buracos, e 10 depois da 3ª baixa', () => {
      expect(maxHoles(1, T)).toBe(8);
      expect(maxHoles(3, T)).toBe(10);
    });

    it('**nunca 3 tiles contíguos**: o piso nunca fecha caminho (§5.6)', () => {
      const abertos = new Set([5, 6]);
      expect(holeAllowed(abertos, 7, T)).toBe(false);   // viraria 5,6,7
      expect(holeAllowed(abertos, 4, T)).toBe(false);   // viraria 4,5,6
      expect(holeAllowed(abertos, 8, T)).toBe(true);    // 6,7,8 → mas 7 não está aberto... 6 está
      expect(holeAllowed(abertos, 5, T)).toBe(false);   // já aberto
    });

    it('dois contíguos são permitidos — 128 px contra 224 px de salto', () => {
      expect(holeAllowed(new Set([5]), 6, T)).toBe(true);
      expect(holeAllowed(new Set([5, 6]), 3, T)).toBe(true);
    });

    it('escolhe o tile do jogador quando a regra permite, senão um vizinho', () => {
      expect(pickHole(new Set(), 10, T)).toBe(10);
      expect(pickHole(new Set([9, 11]), 10, T)).toBe(8);
      expect(pickHole(new Set([9, 11]), 10, T)).not.toBeNull();
    });

    it('o teto de buracos para o gerador quando o piso já está cheio', () => {
      const cheio = new Set([0, 2, 4, 6, 8, 10, 12, 14]);
      expect(pickHole(cheio, 20, T)).toBeNull();
    });

    it('cair não mata: `DEC-011` — zero de dano e o canal é cancelado', () => {
      expect(fallInHole()).toEqual({ damage: 0, cancelChannel: true });
    });
  });
});
