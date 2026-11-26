/**
 * Guarda-corpo de LVL-16 (`[PÓS]`) — **o último setor do jogo**.
 *
 * Três invariantes deste setor valem para o jogo inteiro, e é por isso que ele tem teste
 * (`TST-018`):
 *
 * 1. **O chefe não pode morrer.** `ENT-008` não tem vida: tem postura (100/125/150, golpe de
 *    25) e a luta se vence assinando três baixas. Nenhum caminho aqui leva a `MEC-009`.
 * 2. **A grade não abre com dano.** Ela abre com a 3ª baixa (`MEC-011`) — não existe 0 HP.
 * 3. **O chão nunca fecha caminho.** O desgaste abre buracos e **nunca** três contíguos, e
 *    cair não tira um único ponto de vida (`DEC-011`, `DEC-018`).
 */
import { describe, expect, it } from 'vitest';
import {
  LVL16, LVL16_BAIXAS, LVL16_BADGE, LVL16_CHEFE, LVL16_LAST_LINE, LVL16_META, LVL16_POSTO,
  LVL16_SENTINELS,
} from './lvl16';
import { AREAS, AREA_ORDER, nextArea } from './index';
import { DESGASTE, FLAGS, PLANTONISTA, TILE, VAGA } from '../tuning';
import {
  BAIXAS, apitoAllowed, applyPoise, baixasSurviveDeath, canSign, clampToLeash, fallInHole,
  hitsPerBaixa, holeAllowed, maxHoles, poiseFor, postoKillable, processaBaixa,
  protocolTriggered, rendido, signComplete, staggered, throneLocked, totalHits,
  type PostoTiming,
} from '../../../core/posto';

const LARGURAS = [20, 30, 20, 24, 20, 20];
const conta = (room: (typeof LVL16)[number], ch: string): number =>
  [...room.grid.join('')].filter((c) => c === ch).length;

const T: PostoTiming = {
  poise: PLANTONISTA.poise as unknown as readonly [number, number, number],
  golpePoise: PLANTONISTA.golpePoise,
  staggerMs: PLANTONISTA.staggerMs,
  staggerSwayMs: PLANTONISTA.staggerSwayMs,
  channelMs: PLANTONISTA.channelMs,
  staggerSlackMs: PLANTONISTA.staggerSlackMs,
  protocolHits: PLANTONISTA.protocolHits,
  protocolWindowMs: PLANTONISTA.protocolWindowMs,
  protocolMs: PLANTONISTA.protocolMs,
  crackMs: DESGASTE.crackMs,
  holeMs: DESGASTE.holeMs,
  maxHoles: DESGASTE.maxHoles,
  maxHolesFinal: DESGASTE.maxHolesFinal,
  maxAdjacent: DESGASTE.maxAdjacent,
};

describe('LVL-16 — Trono do Caos', () => {
  it('tem 6 salas de 11 linhas e 134 tiles (§1 campo 7)', () => {
    expect(LVL16).toHaveLength(6);
    LVL16.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length, room.id).toBe(LARGURAS[i]);
    });
    expect(LARGURAS.reduce((a, b) => a + b, 0)).toBe(134);
    expect(LVL16.reduce((n, r) => n + r.grid[0].length, 0)).toBe(134);
  });

  it('é **o último** setor da progressão e não existe setor 17 (`DEC-047`)', () => {
    expect(AREAS['LVL-16']?.name).toBe('Trono do Caos');
    expect(AREA_ORDER).toHaveLength(16);
    expect(AREA_ORDER.indexOf('LVL-16')).toBe(15);
    expect(nextArea('LVL-15')?.id).toBe('LVL-16');
    // o fim da campanha é o fim da campanha: depois do 16 não há setor 17
    expect(nextArea('LVL-16')).toBeNull();
    expect(AREAS['LVL-17']).toBeUndefined();
  });

  it('não entrega habilidade: o Ato IV cobra, não dá (§1 campo 6)', () => {
    expect(LVL16_META.grants).toBeNull();
    for (const ch of ['X', 'j', 'F', 'I', 'R', 'o', 'a']) {
      expect(LVL16.map((r) => conta(r, ch)), `glifo ${ch}`).toEqual([0, 0, 0, 0, 0, 0]);
    }
  });

  it('é o oitavo setor seguido sem plataforma, vão ou armadilha', () => {
    for (const ch of ['=', 'A', '_', '^', '~']) {
      expect(LVL16.map((r) => conta(r, ch)), `glifo ${ch}`).toEqual([0, 0, 0, 0, 0, 0]);
    }
    for (const room of LVL16) {
      expect(room.grid[7], room.id).toBe('#'.repeat(room.grid[0].length));
    }
  });

  it('três Sentinelas no setor, 1 · 2 · 0 · 0 · 0 · 0 (§1 campo 10)', () => {
    const porSala = LVL16.map((r) => conta(r, 'E'));
    expect(porSala).toEqual([1, 2, 0, 0, 0, 0]);
    expect(porSala.reduce((a, b) => a + b, 0)).toBe(3);
    expect(LVL16_SENTINELS).toHaveLength(3);
  });

  it('`PAT-LD-04`: a antecâmara e a parede dos crachás não têm inimigo', () => {
    expect(conta(LVL16[2], 'E')).toBe(0);
    expect(conta(LVL16[4], 'E')).toBe(0);
  });

  it('`PAT-LD-05`: a arena não tem `P`; há save em L16-03 e L16-05', () => {
    expect(conta(LVL16[3], 'P')).toBe(0);
    expect(conta(LVL16[2], 'P')).toBe(1);
    expect(conta(LVL16[4], 'P')).toBe(1);
    expect(LVL16[3].safeRoom).not.toBe(true);
  });

  it('**`O` e `K` são adjacentes**: em pé, o chefe cobre o posto (§3)', () => {
    expect(conta(LVL16[3], 'O')).toBe(1);
    expect(conta(LVL16[3], 'K')).toBe(1);
    expect(LVL16_POSTO.tx - LVL16_CHEFE.tx).toBe(1);
    expect(LVL16_POSTO.ty).toBe(LVL16_CHEFE.ty);
    // o hurtbox de 96 px (1,5 tile) cobre o posto enquanto ele estiver de pé
    expect(PLANTONISTA.body.width).toBeGreaterThanOrEqual(TILE);
  });

  it('a arena tem 24×11 — a medida exata de `PAT-LD-07` (§4.4)', () => {
    expect(LVL16[3].grid[0].length).toBe(24);
    expect(LVL16[3].boss).toBe('ENT-008');
    expect(LVL16[3].desgaste).toBe(true);
    expect(LVL16[3].posto).toEqual({ tx: 21, ty: 6 });
  });

  it('L16-06 **não tem porta leste**: é o único ponto final do mapa (§4.6)', () => {
    const fim = LVL16[5];
    for (const y of [4, 5, 6]) expect(fim.grid[y].at(-1), `linha ${y}`).toBe('#');
    expect(fim.throne).toEqual({ tx: 11, ty: 6, once: true });
    expect(fim.varanda).toEqual({ tx: 16, ty: 6, area: 'LVL-01' });
    expect(conta(fim, 'T')).toBe(1);
    expect(conta(fim, 'V')).toBe(1);
  });

  it('os textos do setor são os publicados (§4)', () => {
    expect(LVL16[0].texts?.['3,6']).toEqual(['PATAMAR. ACIMA SÓ SOBE QUEM VAI FICAR.']);
    expect(LVL16[1].texts?.['3,6'])
      .toEqual(['FILA DO POSTO. UMA CADEIRA POR VAGA. NENHUMA OCUPADA.']);
    expect(LVL16[1].texts?.['8,6']).toEqual(['SENHA ATUAL: 000']);
    expect(LVL16[2].texts?.['8,6']).toHaveLength(5);
    expect(LVL16[2].texts?.['8,6']?.at(-1)).toBe('NÃO É NECESSÁRIO MATAR.');
    expect(LVL16[4].texts?.['12,6'])
      .toEqual(['QUARENTA CRACHÁS. QUARENTA E UM PREGOS. O ÚLTIMO ESTÁ VAZIO.']);
    expect(LVL16[5].texts?.['3,6']).toEqual(['O POSTO É VITALÍCIO.']);
  });

  it('o quadro de crachás tem 40 crachás em 41 pregos (§4.5)', () => {
    expect(LVL16[4].badgeWall).toEqual({ tx: 7, ty: 6, badges: 40, hooks: 41 });
    expect(LVL16[4].badgeWall!.hooks - LVL16[4].badgeWall!.badges).toBe(1);
  });

  it('a fila tem seis cadeiras desenhadas e nenhuma ocupada (§4.2)', () => {
    expect(conta(LVL16[1], 'c')).toBe(6);
    expect(LVL16[1].glyphs?.c).toBe('empty-chair');
  });

  it('áudio: `bgm=none` no mapa, `BGM-02` na arena, `BGM-04` só de L16-05 (§8)', () => {
    expect(LVL16_META.bgm).toBe('none');
    expect(PLANTONISTA.bgm).toBe('BGM-02');
    expect(VAGA.bgmFinal).toBe('BGM-04');
    expect(VAGA.bgmFinalFromRoom).toBe(4);      // L16-05 é o índice 4
    expect(VAGA.bgmFinalLoop).toBe(false);      // 75 s, sem loop
    expect(VAGA.amb).toBe('AMB-16');
    expect(VAGA.stopsOnSeat).toBe(true);        // para de uma vez em `MEC-012`

    // e a trilha de LVL-15 não aparece aqui: o clímax que restou é este
    expect(LVL16_META.bgm).not.toBe('BGM-03');
  });
});

describe('ENT-008 O Plantonista — a luta sem vida (`MEC-011`)', () => {
  it('**o chefe não pode morrer**: nenhum caminho leva a `MEC-009` (`TST-018`)', () => {
    expect(postoKillable()).toBe(false);
    expect(PLANTONISTA.damageable).toBe(false);
    expect(PLANTONISTA.kills).toBe(false);
    expect('hp' in PLANTONISTA).toBe(false);
  });

  it('postura 100 · 125 · 150 com golpe de 25: 4, 5 e 6 golpes, 15 na luta (§5.5)', () => {
    expect(poiseFor(1, T)).toBe(100);
    expect(poiseFor(2, T)).toBe(125);
    expect(poiseFor(3, T)).toBe(150);
    expect(hitsPerBaixa(T)).toEqual([4, 5, 6]);
    expect(totalHits(T)).toBe(15);
    expect(LVL16_BAIXAS).toBe(BAIXAS);
    expect(PLANTONISTA.baixas).toBe(3);
  });

  it('4.500 = 300 de cambaleio + 3.000 de canal + 1.200 de folga (§5.5)', () => {
    expect(PLANTONISTA.staggerSwayMs + PLANTONISTA.channelMs + PLANTONISTA.staggerSlackMs)
      .toBe(PLANTONISTA.staggerMs);
    expect(PLANTONISTA.staggerMs).toBe(4500);
    expect(canSign(300, T)).toBe(true);
    expect(canSign(1500, T)).toBe(false);   // começou tarde: não termina dentro dos 4.500 ms
    expect(signComplete(3000, T)).toBe(true);
  });

  it('três baixas e ele se rende — não há quarta, e não há morte (§5.7)', () => {
    expect(rendido(2)).toBe(false);
    expect(rendido(3)).toBe(true);
    expect(PLANTONISTA.grantsKey).toBe(false);   // o Ato IV cobra; não dá
  });

  it('`ATK-21`: 3 golpes em 4.000 ms, janela de 1.400 ms, 22 de dano e **postura intacta**', () => {
    expect(protocolTriggered([0, 500, 1000], 1200, T)).toBe(true);
    expect(protocolTriggered([0, 500], 1200, T)).toBe(false);
    expect(PLANTONISTA.protocolMs).toBe(1400);
    expect(PLANTONISTA.protocolDamage).toBe(22);
    // a postura só cai por golpe fora da janela: quem para de bater nunca toma dano
    expect(applyPoise(100, 25)).toBe(75);
  });

  it('`ATK-20`: apito com 1.500 ms perto do posto e no máximo 2 Sentinelas vivas', () => {
    expect(apitoAllowed(1500, 0)).toBe(true);
    expect(apitoAllowed(1500, 2)).toBe(false);
    expect(PLANTONISTA.apitoMaxAlive).toBe(2);
    expect(PLANTONISTA.apitoDamage).toBe(0);
  });

  it('o leash de 8 tiles (512 px) e ele **nunca** a oeste de `x=13` (§6.5)', () => {
    expect(PLANTONISTA.leashTiles).toBe(8);
    expect(PLANTONISTA.leashTiles * TILE).toBe(512);   // o alcance do gancho (HAB-04)
    expect(clampToLeash(100, PLANTONISTA.leashX * TILE)).toBe(PLANTONISTA.leashX * TILE);
  });

  it('**as baixas sobrevivem à morte** do jogador; a postura não (§10.1)', () => {
    expect(baixasSurviveDeath(2)).toBe(2);
    expect(processaBaixa(1, false).baixas).toBe(2);
    expect(processaBaixa(1, true).changed).toBe(false);   // idempotente (`PAT-C-07`)
  });

  it('a 2ª baixa o deixa 8% mais rápido e a 3ª anuncia o protocolo 200 ms antes', () => {
    expect(PLANTONISTA.speedBoost2).toBeCloseTo(1.08, 5);
    expect(Math.round(PLANTONISTA.speedPxS * PLANTONISTA.speedBoost2)).toBe(119);
    expect(PLANTONISTA.protocolEarlyMs).toBe(200);
  });

  it('o HUD conta `BAIXAS n/3` — e a tela final é o crachá de 3 linhas (§7.4)', () => {
    expect(LVL16_BADGE).toEqual(['POSTO: PREENCHIDO', 'Nº: 041', 'ASSINATURA: VOCÊ']);
    expect(LVL16_BADGE).toHaveLength(3);
    expect(LVL16_LAST_LINE).toBe('O assento é duro.');
  });

  it('o Trono **não tem fechadura**: a terceira chave não abre nada (§7.1, `P-65`)', () => {
    expect(throneLocked()).toBe(false);
    for (const room of LVL16) expect(room.locks).toBeUndefined();
  });
});

describe('CEN-113 — o desgaste (`LOR-03c` sem corpo)', () => {
  it('dano **0** sempre, em qualquer dificuldade (`DEC-018`)', () => {
    expect(DESGASTE.damage).toBe(0);
    expect(fallInHole()).toEqual({ damage: 0, cancelChannel: true });
  });

  it('racha em 1.400 ms e cede em 2.000 ms (§5.6)', () => {
    expect(DESGASTE.crackMs).toBe(1400);
    expect(DESGASTE.holeMs).toBe(2000);
    expect(DESGASTE.holeMs).toBeGreaterThan(DESGASTE.crackMs);
  });

  it('**nunca três buracos contíguos**: 2 tiles = 128 px cabem num salto de 224 px (§9)', () => {
    expect(DESGASTE.maxAdjacent).toBe(2);
    expect(DESGASTE.maxAdjacent * TILE).toBeLessThan(224);
    expect(holeAllowed(new Set([4, 5]), 6, T)).toBe(false);
    expect(holeAllowed(new Set([4, 5]), 7, T)).toBe(true);
  });

  it('teto de 8 buracos, e 10 depois da 3ª baixa', () => {
    expect(maxHoles(1, T)).toBe(8);
    expect(maxHoles(3, T)).toBe(10);
    expect(DESGASTE.maxHolesFinal).toBeGreaterThan(DESGASTE.maxHoles);
  });

  it('a queda devolve à entrada e **cancela o canal** — sem dano (`DEC-011`)', () => {
    expect(DESGASTE.fallReturnMs).toBe(300);
    expect(fallInHole().cancelChannel).toBe(true);
  });
});
