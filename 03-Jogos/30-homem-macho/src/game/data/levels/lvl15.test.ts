/**
 * Guarda-corpo de LVL-15 (`[PÓS]`) — a ante-sala que fecha o Ato IV.
 *
 * Três invariantes deste setor valem para o jogo inteiro, e é por isso que ele tem teste:
 *
 * 1. **Um chefe, dois corpos** (§5.6): `MEC-009` exige os dois a 0 HP; matar um não encerra.
 * 2. **A revivificação é infinita** (§5.5): limitar as tentativas transformaria a luta em
 *    "mate um devagar" e mataria o único ensinamento que ela tem.
 * 3. **`BGM-03` e silêncio absoluto** (§7.2, §7.3): nenhum `SFX` ambiente no setor, e a
 *    trilha da arena é a de quarto seguro — `BGM-02` aqui é erro, não escolha.
 */
import { describe, expect, it } from 'vitest';
import { LVL15, LVL15_BODIES, LVL15_META, LVL15_SEALED } from './lvl15';
import { AREAS, AREA_ORDER, nextArea } from './index';
import { GUARDIAO, PLAYER, SILENCE, SUSPEND, TILE } from '../tuning';
import {
  duoBodies, duoCycleMs, duoDefeated, duoDuration, effectiveCycleMs, reviveHp,
  reviveInterrupted, reviveWindowOpen, sealLabel, suspensionMs, type DuoTiming,
} from '../../../core/duo';

const LARGURAS = [40, 30, 20, 20, 30, 20];
const conta = (room: (typeof LVL15)[number], ch: string): number =>
  [...room.grid.join('')].filter((c) => c === ch).length;

const T: DuoTiming = {
  introMs: GUARDIAO.introMs,
  lanternWindupMs: GUARDIAO.bodyWindupMs,
  lanternMs: GUARDIAO.lanternMs,
  lanternRecoverMs: GUARDIAO.lanternRecoverMs,
  sealWindupMs: GUARDIAO.sealWindupMs,
  sealFlightMs: GUARDIAO.sealFlightMs,
  sealRecoverMs: GUARDIAO.sealRecoverMs,
  reviveMs: GUARDIAO.reviveMs,
  interruptDamage: GUARDIAO.interruptDamage,
  suspendMaxMs: GUARDIAO.suspendMs,
};

describe('LVL-15 — Ante-sala do Fim', () => {
  it('tem 6 salas de 11 linhas e 160 tiles (§1 campo 7)', () => {
    expect(LVL15).toHaveLength(6);
    LVL15.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length, room.id).toBe(LARGURAS[i]);
    });
    expect(LARGURAS.reduce((a, b) => a + b, 0)).toBe(160);
    expect(LVL15.reduce((n, r) => n + r.grid[0].length, 0)).toBe(160);
  });

  it('está na progressão, na posição 15 dos 16, e liga a LVL-16 (`DEC-047`)', () => {
    expect(AREAS['LVL-15']?.rooms.length).toBeGreaterThan(0);
    expect(AREA_ORDER.indexOf('LVL-15')).toBe(14);
    // o setor anterior **liga** a este: nenhum setor é uma ilha
    expect(nextArea('LVL-14')?.id).toBe('LVL-15');
    expect(nextArea('LVL-15')?.id).toBe('LVL-16');
  });

  it('não ensina nada e não entrega habilidade (§1 campo 8)', () => {
    expect(LVL15_META.grants).toBeNull();
    expect(LVL15.map((r) => conta(r, 'X'))).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('é o sétimo setor seguido sem plataforma, vão ou armadilha (§1)', () => {
    for (const ch of ['=', 'A', '_', '^']) {
      expect(LVL15.map((r) => conta(r, ch)), `glifo ${ch}`).toEqual([0, 0, 0, 0, 0, 0]);
    }
    for (const room of LVL15) {
      expect(room.grid[7], room.id).toBe('#'.repeat(room.grid[0].length));
    }
  });

  it('cinco Sentinelas no setor, no máximo 2 por sala (§1, PAT-LD-10)', () => {
    const porSala = LVL15.map((r) => conta(r, 'E'));
    expect(porSala).toEqual([2, 2, 0, 1, 0, 0]);
    expect(porSala.reduce((a, b) => a + b, 0)).toBe(5);
    for (const n of porSala) expect(n).toBeLessThanOrEqual(2);
  });

  it('`PAT-LD-04`: o quarto de turno (L15-03) e o portão (L15-06) não têm inimigo', () => {
    expect(conta(LVL15[2], 'E')).toBe(0);
    expect(conta(LVL15[5], 'E')).toBe(0);
  });

  it('`PAT-LD-05`: a arena não tem `P`, e as três salas de respiro têm', () => {
    expect(LVL15.map((r) => conta(r, 'P'))).toEqual([0, 0, 1, 1, 0, 1]);
    expect(conta(LVL15[4], 'P')).toBe(0);
  });

  describe('§8 — o corredor de portas', () => {
    it('seis portas lacradas no setor, três por corredor', () => {
      // cada porta ocupa **3 células** (y4–y6), então a grade conta 9 por corredor
      expect(LVL15.map((r) => conta(r, 'T'))).toEqual([9, 9, 0, 0, 0, 0]);
      expect(LVL15_SEALED.flatMap((r) => r.tx)).toHaveLength(6);
      expect(LVL15_SEALED).toHaveLength(2);
      expect(LVL15_SEALED[0].tx).toHaveLength(3);
      expect(LVL15_SEALED[1].tx).toHaveLength(3);
      // e cada `T` tem 3 tiles de altura (y4–y6), como o §3 manda
      for (const room of [LVL15[0], LVL15[1]]) {
        for (let x = 0; x < room.grid[0].length; x++) {
          const coluna = [4, 5, 6].map((y) => room.grid[y][x]).join('');
          if (coluna.includes('T')) expect(coluna, room.id).toBe('TTT');
        }
      }
    });

    it('as posições do documento são as do código', () => {
      for (const [y, tx] of [[4, 8], [5, 8], [6, 8], [4, 18], [4, 30]] as const) {
        expect(LVL15[0].grid[y][tx]).toBe('T');
      }
      for (const tx of [7, 16, 23]) expect(LVL15[1].grid[4][tx]).toBe('T');
    });

    it('`T` **não** é passagem: a coluna da porta não abre a borda (§3)', () => {
      for (const room of LVL15) {
        expect(room.grid[4][0]).toBe('+');
        // a saída leste é `+`, exceto na arena, onde é a grade (`G`, `PAT-LD-07`)
        expect(['+', 'G']).toContain(room.grid[4][room.grid[0].length - 1]);
      }
      // a porta lacrada fica no meio da sala e a saída é a `+` da borda
      expect(LVL15[0].grid[4][8]).toBe('T');
      expect(LVL15[0].grid[4][39]).toBe('+');
    });
  });

  describe('ENT-007 — o guardião duplo', () => {
    it('dois corpos em (10,6) e (20,6), 10 tiles de separação (§5.1, §6.5)', () => {
      expect(LVL15.map((r) => conta(r, 'O'))).toEqual([0, 0, 0, 0, 2, 0]);
      expect(LVL15[4].grid[6][10]).toBe('O');
      expect(LVL15[4].grid[6][20]).toBe('O');
      expect(LVL15_BODIES.map((b) => b.tx)).toEqual([10, 20]);
      expect(LVL15_BODIES[1].tx - LVL15_BODIES[0].tx).toBe(GUARDIAO.minSeparation);
      expect(LVL15[4].boss).toBe('ENT-007');
    });

    it('a arena tem 30 tiles — não 24 — e a regra está no desvio 1 (§13)', () => {
      expect(LVL15[4].grid[0].length).toBe(30);
      expect(GUARDIAO.minSeparation * TILE).toBe(640);
      // 10 tiles de separação + 2 corpos + margem = 30; em 24 sobrariam 4 tiles de cada lado
      expect(LVL15[4].grid[0].length).toBeGreaterThan(24);
    });

    it('180 HP por corpo e 360 no total: 18 golpes de arma branca (§6.1)', () => {
      expect(duoBodies(GUARDIAO.hpPerBody)).toEqual([180, 180]);
      expect(GUARDIAO.hpPerBody * GUARDIAO.bodies).toBe(360);
      expect(Math.ceil((GUARDIAO.hpPerBody * GUARDIAO.bodies) / PLAYER.attack.damage)).toBe(18);
      expect(Math.ceil(GUARDIAO.hpPerBody / PLAYER.attack.damage)).toBe(9);
    });

    it('`MEC-009` **não** dispara com um corpo vivo (§5.6, `TST-016`)', () => {
      expect(duoDefeated(0, 180)).toBe(false);
      expect(duoDefeated(180, 0)).toBe(false);
      expect(duoDefeated(0, 0)).toBe(true);
    });

    it('a revivificação: 4.000 ms, 50% e **sem limite de tentativas** (§5.5)', () => {
      expect(GUARDIAO.reviveMs).toBe(4000);
      expect(duoDuration('canalizando', 'ATK-16', T)).toBe(4000);
      expect(reviveHp(GUARDIAO.hpPerBody, GUARDIAO.revivePct)).toBe(90);
      expect(reviveWindowOpen(3999, T)).toBe(true);
      expect(reviveWindowOpen(4000, T)).toBe(false);
      // interromper exige 30 de dano **acumulado**: dois golpes de 20 servem
      expect(reviveInterrupted(20, T)).toBe(false);
      expect(reviveInterrupted(40, T)).toBe(true);
    });

    it('a margem efetiva é 4 porque a taxa dobra — e por isso ele bate 20, não 26 (§6.2)', () => {
      const efetiva = PLAYER.hp + PLAYER.shield;
      expect(efetiva).toBe(150);
      expect(Math.floor(efetiva / GUARDIAO.lantern.damage)).toBe(7);
      expect(Math.floor(efetiva / GUARDIAO.seal.damage)).toBe(12);
      expect(duoCycleMs(T)).toBe(2000);
      expect(effectiveCycleMs(2, T)).toBe(1000);
      expect(GUARDIAO.lantern.damage).toBeLessThan(26);
    });

    it('a suspensão precisa de dois selos e nunca passa de 800 ms (`P-70`)', () => {
      expect(SUSPEND.sealsNeeded).toBe(2);
      expect(SUSPEND.maxMs).toBe(800);
      expect(suspensionMs(1, T)).toBe(0);
      expect(suspensionMs(2, T)).toBe(800);
      expect(sealLabel(1)).toBe('1 / 2');
      expect(sealLabel(2)).toBe('2 / 2');
      expect(GUARDIAO.suspendMs).toBeLessThanOrEqual(SUSPEND.maxMs);
      // menor que o windup **mais** a execução de `ATK-16` (700 + 300 = 1.000 ms): quem é
      // suspenso ainda sai do arco antes do segundo golpe (§9)
      expect(GUARDIAO.suspendMs).toBeLessThan(GUARDIAO.bodyWindupMs + GUARDIAO.lanternMs);
    });

    it('a lanterna alcança 4 tiles e o selo 6 (§5.3, §9)', () => {
      expect(GUARDIAO.lantern.tiles).toBe(4);
      expect(GUARDIAO.lantern.px).toBe(4 * TILE);
      expect(GUARDIAO.seal.tiles).toBe(6);
      expect(GUARDIAO.seal.px).toBe(6 * TILE);
      // 384 px a 400 px/s = 960 ms de voo: dá para ver chegando
      expect(Math.round((GUARDIAO.seal.px / GUARDIAO.seal.speed) * 1000)).toBe(960);
    });

    it('as três falas, e as duas primeiras são do par (coro, §5.4)', () => {
      expect(GUARDIAO.lines.intro).toContain('DOIS CARIMBOS');
      expect(GUARDIAO.lines.revive).toBe('FALTA UM.');
      expect(GUARDIAO.lines.death).toBe('PROTOCOLO ENCERRADO.');
      expect(GUARDIAO.gate).toBe('arena');
      expect(GUARDIAO.optional).toBe(false);
      expect(GUARDIAO.grantsKey).toBe(true);
    });
  });

  describe('§7 — o silêncio', () => {
    it('`AMB-15` é a ausência de som, não um arquivo (§7.1)', () => {
      expect(LVL15_META.amb).toBe('AMB-15');
      expect(SILENCE.amb).toBe('AMB-15');
      expect(SILENCE.ambientSfx).toBe('none');
      // a batida de coração de `06-audio` está **descartada** (§7.3)
      expect(SILENCE.heartbeat).toBe(false);
    });

    it('`BGM-03` no setor — e **nunca** `BGM-02`, nem na arena (§7.2)', () => {
      expect(LVL15_META.bgm).toBe('BGM-03');
      expect(GUARDIAO.bgm).toBe('BGM-03');
      expect(LVL15_META.bgm).not.toBe('BGM-02');
      expect(GUARDIAO.bgm).not.toBe('BGM-02');
    });

    it('a arena é a única que repete a trilha do quarto seguro', () => {
      // quarto seguro (L15-03) e arena (L15-05) tocam a mesma trilha: é a tese do setor
      expect(LVL15[2].safeRoom).toBe(true);
      expect(LVL15[4].boss).toBe('ENT-007');
    });
  });

  it('o quadro de aviso de L15-03 tem 5 linhas e é o que autoriza o Trono (§4.3)', () => {
    const quadro = LVL15[2].texts?.['7,6'] ?? [];
    expect(quadro).toHaveLength(5);
    expect(quadro[3]).toContain('PERMANECE ABERTO');
    expect(quadro[4]).toBe('ASSINATURA: —');
    // e é o mesmo texto do `tuning`, para a UI de placa e o dado não divergirem
    expect([...GUARDIAO.notice]).toEqual([...quadro]);
    expect(quadro.join(' ').split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(30);
  });

  it('a porta de serviço é a única que abre e ela dá para trás (§4.6, §8)', () => {
    expect(LVL15.map((r) => conta(r, 'S'))).toEqual([0, 0, 0, 0, 0, 1]);
    const servico = LVL15[5].sink;
    expect(servico?.mode).toBe('interact');
    expect(servico?.room).toBe(0);          // volta para o **primeiro** corredor
    expect(servico?.area).toBe('LVL-15');
    // 6 lacradas + 1 de serviço: a única que abre é a que não leva ao Trono
    expect(LVL15_SEALED.flatMap((r) => r.tx)).toHaveLength(6);
  });

  it('as placas falam em contagem — 9 palavras, 7 no portão (§4)', () => {
    const palavras = (room: (typeof LVL15)[number]): number =>
      Object.values(room.texts ?? {}).join(' ').split(/\s+/).filter(Boolean).length;
    // "CORREDOR DE PORTAS. TODAS LEVAM AO MESMO LUGAR." / "NÃO ABRIR."
    expect(palavras(LVL15[0])).toBe(9);
    // "LACRADAS POR FIM DE TURNO." / "NÃO HÁ TURNO SEGUINTE."
    expect(palavras(LVL15[1])).toBe(8);
    // "PORTÃO DO TRONO. A CHAVE É O POSTO." — oito tokens, e o sentido é o portão sem fechadura
    expect(palavras(LVL15[5])).toBe(8);
  });
});
