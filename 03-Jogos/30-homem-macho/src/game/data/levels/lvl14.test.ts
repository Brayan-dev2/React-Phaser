/**
 * Guarda-corpo de LVL-14 (`[PÓS]`) — a fortaleza que abre o Ato IV.
 *
 * Três invariantes deste setor valem para o jogo inteiro, e é por isso que ele tem teste:
 *
 * 1. **Ele não se desloca** (§6.5): se o Comandante andar, a arena deixa de mudar de tamanho
 *    e o eclipse perde a função.
 * 2. **O eclipse não é do chefe** (§7.2): relógio próprio, 8 s, e **para** na morte dele.
 * 3. **`keys ≥ 2` e nada de três chaves** (`DEC-016`, §8): o portão abre com 2 e com 3, e não
 *    abre com 1 — senão a luta de LVL-12 deixa de ser opcional.
 */
import { describe, expect, it } from 'vitest';
import { LVL14, LVL14_META } from './lvl14';
import { AREAS, AREA_ORDER, nextArea } from './index';
import { COMANDANTE, ECLIPSE, FLAGS, KEYS, PLAYER, TILE } from '../tuning';
import {
  KEY_ITEMS, eclipseAttackFor, eclipseStops, gateVerdict, keyLabel, skyAt,
  type EclipseTiming,
} from '../../../core/eclipse';
import { comandanteDrift, comandanteOpen, comandantePhase } from '../../../core/comandante';

const LARGURAS = [30, 30, 20, 20, 24, 20];
const conta = (room: (typeof LVL14)[number], ch: string): number =>
  [...room.grid.join('')].filter((c) => c === ch).length;

const T: EclipseTiming = {
  cycleMs: ECLIPSE.cycleMs,
  lightPhase1Ms: ECLIPSE.lightPhase1Ms,
  shadowPhase1Ms: ECLIPSE.shadowPhase1Ms,
  lightPhase2Ms: ECLIPSE.lightPhase2Ms,
  shadowPhase2Ms: ECLIPSE.shadowPhase2Ms,
};

describe('LVL-14 — Fortaleza do Eclipse', () => {
  it('tem 6 salas de 11 linhas e 144 tiles (§1 campo 7)', () => {
    expect(LVL14).toHaveLength(6);
    LVL14.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length, room.id).toBe(LARGURAS[i]);
    });
    expect(LARGURAS.reduce((a, b) => a + b, 0)).toBe(144);
    expect(LVL14.reduce((n, r) => n + r.grid[0].length, 0)).toBe(144);
  });

  it('está na progressão, na posição 14 dos 16, e liga a LVL-15 (`DEC-047`)', () => {
    expect(AREAS['LVL-14']?.rooms.length).toBeGreaterThan(0);
    expect(AREA_ORDER.indexOf('LVL-14')).toBe(13);
    // o setor anterior **liga** a este: nenhum setor é uma ilha
    expect(nextArea('LVL-13')?.id).toBe('LVL-14');
    expect(nextArea('LVL-14')?.id).toBe('LVL-15');
  });

  it('**não ensina nada**: nenhuma habilidade, nenhum item permanente (§1 campo 8)', () => {
    expect(LVL14_META.grants).toBeNull();
    expect(LVL14.map((r) => conta(r, 'X'))).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('é o sexto setor seguido sem plataforma, sem vão e sem armadilha (§13 desvio 6)', () => {
    for (const ch of ['=', 'A', '_', '^']) {
      expect(LVL14.map((r) => conta(r, ch)), `glifo ${ch}`).toEqual([0, 0, 0, 0, 0, 0]);
    }
    for (const room of LVL14) {
      expect(room.grid[7], room.id).toBe('#'.repeat(room.grid[0].length));
      expect(room.grid[8], room.id).toBe('#'.repeat(room.grid[0].length));
    }
  });

  it('os dois sentinelas por sala somam 5 no setor, e nenhuma sala tem mais de 2 (§1, PAT-LD-10)', () => {
    const porSala = LVL14.map((r) => conta(r, 'E'));
    expect(porSala).toEqual([2, 2, 1, 0, 0, 0]);
    expect(porSala.reduce((a, b) => a + b, 0)).toBe(5);
    for (const n of porSala) expect(n).toBeLessThanOrEqual(2);
  });

  it('`PAT-LD-04`: a sala antes (L14-04) e a depois (L14-06) do chefe não têm inimigo', () => {
    expect(conta(LVL14[3], 'E')).toBe(0);
    expect(conta(LVL14[5], 'E')).toBe(0);
  });

  it('`PAT-LD-05`: a arena não tem `P`, e o respiro antes e depois tem', () => {
    expect(LVL14.map((r) => conta(r, 'P'))).toEqual([0, 1, 0, 1, 0, 1]);
    expect(conta(LVL14[4], 'P')).toBe(0);
  });

  describe('ENT-006 — o chefe alto', () => {
    it('fica na arena, em (12,6), e em nenhum outro lugar do setor', () => {
      expect(LVL14.map((r) => conta(r, 'C'))).toEqual([0, 0, 0, 0, 1, 0]);
      const linha = LVL14[4].grid[6];
      expect(linha[12]).toBe('C');
      expect(LVL14[4].boss).toBe('ENT-006');
    });

    it('**não se desloca** (`mobile: false`, §6.5) — o drift é zero por contrato', () => {
      expect(COMANDANTE.mobile).toBe(false);
      expect(COMANDANTE.gate).toBe('arena');
      expect(COMANDANTE.optional).toBe(false);
      expect(comandanteDrift()).toBe(0);
    });

    it('320 HP e fase 2 em 160, o mais alto do jogo até aqui', () => {
      expect(COMANDANTE.hp).toBe(320);
      expect(COMANDANTE.phase2At).toBe(160);
      expect(comandantePhase(320, 160)).toBe(1);
      expect(comandantePhase(160, 160)).toBe(2);
      // 16 golpes de arma branca (§6.1), contra 13 de `ENT-005`
      expect(Math.ceil(COMANDANTE.hp / PLAYER.attack.damage)).toBe(16);
    });

    it('a estocada alcança 6 tiles e a lança 7 — a arena muda de tamanho a cada 8 s', () => {
      expect(COMANDANTE.lunge.tiles).toBe(6);
      expect(COMANDANTE.lunge.px).toBe(COMANDANTE.lunge.tiles * TILE);
      expect(COMANDANTE.spear.tiles).toBe(7);
      expect(COMANDANTE.spear.px).toBe(COMANDANTE.spear.tiles * TILE);
      // 6 tiles a 640 px/s = 600 ms; 7 tiles a 500 px/s = 900 ms de voo (§5.3)
      expect(Math.round((COMANDANTE.lunge.px / COMANDANTE.lunge.speed) * 1000)).toBe(600);
      // 448 px a 500 px/s = 896 ms de voo: a §5.3 arredonda para 900 e o tuning guarda o
      // número que o jogador sente (`spearFlightMs`), não a divisão exata
      expect(Math.round((COMANDANTE.spear.px / COMANDANTE.spear.speed) * 1000)).toBe(896);
      expect(COMANDANTE.spearFlightMs).toBe(900);
    });

    it('a margem encolhe: 150 de vida efetiva / 26 de estocada = 5 erros (contra 6 de ENT-004/005)', () => {
      const efetiva = PLAYER.hp + PLAYER.shield;
      expect(efetiva).toBe(150);
      expect(Math.floor(efetiva / COMANDANTE.lunge.damage)).toBe(5);
      expect(Math.floor(efetiva / COMANDANTE.spear.damage)).toBe(6);
    });

    it('a janela é o `desarmado` de 1.200 ms, e ela abre só na sombra (§5.3)', () => {
      expect(COMANDANTE.unarmedMs).toBe(1200);
      expect(comandanteOpen('desarmado')).toBe(true);
      expect(comandanteOpen('estocada')).toBe(false);
      // ~2 golpes de arma branca cabem na janela
      expect(Math.floor(COMANDANTE.unarmedMs / 600)).toBe(2);
    });

    it('ele **não dá chave**: o portão conta os dois chefes obrigatórios (§8.3, desvio 8)', () => {
      expect(COMANDANTE.grantsKey).toBe(false);
      expect(KEYS.grants).toHaveLength(3);
      expect(KEY_ITEMS).toContain('ITM-004');
      expect(KEY_ITEMS).toContain('ITM-007');
      expect(KEY_ITEMS).toContain('ITM-011');
    });

    it('as três falas existem — a primeira ordem do jogo é a de entrada (§5.4)', () => {
      expect(COMANDANTE.lines.intro).toContain('ASSUMA O POSTO');
      expect(COMANDANTE.lines.phase2).toContain('NINGUÉM PEDE');
      expect(COMANDANTE.lines.death).toBe('É SEU.');
    });
  });

  describe('CEN-100 — o eclipse', () => {
    it('corre no setor inteiro, não só na arena (§7.5 tempo 1)', () => {
      expect(LVL14.map((r) => r.eclipse === true)).toEqual([true, true, true, true, true, true]);
    });

    it('8 s por ciclo, 5 de luz e 3 de sombra na fase 1; 3/5 na fase 2 (§7.3)', () => {
      expect(T.lightPhase1Ms + T.shadowPhase1Ms).toBe(ECLIPSE.cycleMs);
      expect(T.lightPhase2Ms + T.shadowPhase2Ms).toBe(ECLIPSE.cycleMs);
      expect(skyAt(0, 1, T).sky).toBe('luz');
      expect(skyAt(5000, 1, T).sky).toBe('sombra');
      expect(skyAt(3000, 2, T).sky).toBe('sombra');
    });

    it('decide o ataque do chefe: luz → ATK-13, sombra → ATK-14 (§5.2)', () => {
      expect(eclipseAttackFor(skyAt(1000, 1, T).sky)).toBe('ATK-13');
      expect(eclipseAttackFor(skyAt(6000, 1, T).sky)).toBe('ATK-14');
    });

    it('**não é do chefe**: para quando ele morre e o céu fica onde está (§7.4)', () => {
      expect(ECLIPSE.stopsOnBossDeath).toBe(true);
      expect(eclipseStops(true, true)).toBe(false);
      expect(eclipseStops(true, false)).toBe(true);
    });

    it('a sombra escurece o **céu** e não a arena — o piso tem alpha próprio (§5.3, TST-014)', () => {
      expect(ECLIPSE.skyAlpha).toBeGreaterThan(0.3);
      expect(ECLIPSE.floorAlpha).toBeLessThan(0.2);
      expect(ECLIPSE.floorAlpha).toBeLessThan(ECLIPSE.skyAlpha);
    });
  });

  describe('DEC-016 — as duas fechaduras', () => {
    it('o portão tem **duas** fechaduras em (15,6) e (16,6) (§4.6)', () => {
      const portao = LVL14[5];
      expect(portao.locks?.required).toBe(2);
      expect(portao.locks?.tiles.map((t) => t.tx)).toEqual([15, 16]);
      expect(conta(portao, 'K')).toBe(2);
      expect(portao.locks?.barrierTx).toBe(15);
    });

    it('abre com 2 e com 3, e **não** abre com 1 nem 0 (`TST-015`)', () => {
      expect(gateVerdict(0, KEYS.required)).toBe('faltam');
      expect(gateVerdict(1, KEYS.required)).toBe('faltam');
      expect(gateVerdict(2, KEYS.required)).toBe('abre');
      expect(gateVerdict(3, KEYS.required)).toBe('abre');
    });

    it('a UI mostra x / 2 sem terceiro slot — a sobra aparece (§8.3)', () => {
      expect(keyLabel(2, KEYS.required)).toBe('2 / 2');
      expect(keyLabel(3, KEYS.required)).toBe('3 / 2');
      expect(KEYS.required).toBe(2);
    });

    it('a placa diz "DUAS CHAVES. UMA SOBRA." — e é isso que o portão faz', () => {
      expect(LVL14[5].texts?.['11,6']?.join(' ')).toContain('UMA SOBRA');
      expect(KEYS.label).toContain('UMA SOBRA');
    });
  });

  it('o monta-carga tem 2 paradas e mora nas duas pontas (L14-01 ↔ L14-06, PAT-LD-08)', () => {
    expect(LVL14[0].hoist).toEqual({ area: 'LVL-14', room: 5, at: { tx: 7, ty: 6 }, lockedUntil: 'boss-defeated' });
    expect(LVL14[5].hoist).toEqual({ area: 'LVL-14', room: 0, at: { tx: 3, ty: 6 } });
    expect(conta(LVL14[0], 'M')).toBe(1);
    expect(conta(LVL14[5], 'M')).toBe(1);
  });

  it('o estandarte de L14-03 é o maior do jogo: 2 tiles (`ff`, §4.3)', () => {
    expect(conta(LVL14[2], 'f')).toBe(2);
    expect(LVL14[2].grid[2].slice(9, 11)).toBe('ff');
  });

  it('as placas têm 4 a 7 palavras — a fortaleza fala em contagem, não em conceito (§4.2)', () => {
    const contarPalavras = (room: (typeof LVL14)[number]): number =>
      Object.values(room.texts ?? {}).join(' ').split(/\s+/).filter(Boolean).length;
    // "MURALHA NORTE. SENTIDO ÚNICO. NÃO HÁ VOLTA REGISTRADA." — 7 palavras de propósito
    expect(contarPalavras(LVL14[0])).toBe(7);
    // "PRAÇA DE ARMAS. CAPACIDADE: 600." / "PRESENTES: 0." — seis tokens, e a contagem é a placa
    expect(contarPalavras(LVL14[1])).toBe(6);
    // "ANTESSALA DO COMANDO." / "ESPERAR ORDEM." — a placa mais curta do setor
    expect(contarPalavras(LVL14[3])).toBe(4);
    // "PORTÃO FORTIFICADO. DUAS CHAVES." / "UMA SOBRA."
    expect(contarPalavras(LVL14[5])).toBe(5);
    for (const room of LVL14) expect(contarPalavras(room)).toBeLessThanOrEqual(8);
  });
});
