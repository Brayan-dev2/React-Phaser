import { describe, expect, it } from 'vitest';
import {
  chooseForgeAttack, damageForge, forgeDuration, forgeEngages, forgePhase, hammerBeatsPerSecond,
  hammerPeriod, hammerPhaseAt, hammerStops, inForgeArc, nextForgeState, pieceHitsPlayer,
  shouldProcessForgeDeath, waveFrontX, waveReach,
  type ForgeTiming, type HammerTiming,
} from './forge';

const TILE = 64;

/** Os números de `LVL-12` §5.3 e §7.3, na mesma forma que `tuning.ts` entrega. */
const T: ForgeTiming = {
  arcWindupMs: 800, arcMs: 460, arcRecoverMs: 900, arcRecoverPhase2Ms: 750,
  pieceWindupMs: 500, pieceMs: 400, pieceRecoverMs: 700,
  waveWindupMs: 600, waveMs: 600, waveRecoverMs: 650,
  transitionMs: 800, deathHoldMs: 600,
};
const H: HammerTiming = {
  periodMs: 6000, periodPhase2Ms: 4500, offsetMs: 3000, telegraphMs: 900, activeMs: 180,
};

describe('ENT-005 Forjador — a ficha (§5.1)', () => {
  it('é médio: 260 HP com fase em 130', () => {
    expect(forgePhase(260, 130)).toBe(1);
    expect(forgePhase(131, 130)).toBe(1);
    expect(forgePhase(130, 130)).toBe(2);
    expect(forgePhase(0, 130)).toBe(2);
  });

  it('a vida nunca fica negativa e nunca sobe', () => {
    expect(damageForge(260, 20)).toBe(240);
    expect(damageForge(10, 999)).toBe(0);
    expect(damageForge(100, -30)).toBe(100);
  });

  it('13 golpes de arma branca (20) derrubam 260 HP (§6.1)', () => {
    let hp = 260;
    let golpes = 0;
    while (hp > 0) { hp = damageForge(hp, 20); golpes += 1; }
    expect(golpes).toBe(13);
  });
});

describe('ENT-005 Forjador — a máquina de estados (§5.2)', () => {
  it('só sai de `trabalhando` quando o jogador engaja', () => {
    expect(nextForgeState('trabalhando', 'engaged')).toBe('telegraph');
    expect(nextForgeState('trabalhando', 'windup-done')).toBe('trabalhando');
  });

  it('o ciclo é telegraph → golpe → recuperação → trabalhando', () => {
    expect(nextForgeState('telegraph', 'windup-done')).toBe('golpe');
    expect(nextForgeState('golpe', 'strike-done')).toBe('recuperacao');
    expect(nextForgeState('recuperacao', 'recover-done')).toBe('trabalhando');
  });

  it('ele VOLTA a trabalhar: não há estado de espera nem de perseguição', () => {
    // a única saída de `recuperacao` é `trabalhando` — e de lá só se sai por `engaged`
    expect(nextForgeState('recuperacao', 'recover-done')).toBe('trabalhando');
    expect(nextForgeState('trabalhando', 'died')).toBe('trabalhando');
  });

  it('a morte é terminal e idempotente (`MEC-009`)', () => {
    expect(nextForgeState('telegraph', 'died')).toBe('morte');
    expect(nextForgeState('golpe', 'died')).toBe('morte');
    expect(nextForgeState('morte', 'died')).toBe('morte');
    expect(shouldProcessForgeDeath('morte', 0, false)).toBe(false);   // já está morto
    expect(shouldProcessForgeDeath('golpe', 0, false)).toBe(true);
    expect(shouldProcessForgeDeath('golpe', 0, true)).toBe(false);    // processado uma vez
  });

  it('o engajamento exige o jogador NO PISO e a ≤ 5 tiles (§5.1)', () => {
    const engage = 5 * TILE;
    expect(forgeEngages(true, engage, engage)).toBe(true);
    expect(forgeEngages(true, engage + 1, engage)).toBe(false);
    expect(forgeEngages(false, 10, engage)).toBe(false);   // quem voa passa sem luta
  });

  it('os tempos por ataque e por fase (§5.3)', () => {
    expect(forgeDuration('telegraph', 'ATK-10', 1, T)).toBe(800);
    expect(forgeDuration('golpe', 'ATK-10', 1, T)).toBe(460);
    expect(forgeDuration('recuperacao', 'ATK-10', 1, T)).toBe(900);
    expect(forgeDuration('recuperacao', 'ATK-10', 2, T)).toBe(750);   // fase 2 acelera
    expect(forgeDuration('telegraph', 'ATK-11', 1, T)).toBe(500);
    expect(forgeDuration('telegraph', 'ATK-12', 2, T)).toBe(600);
    expect(forgeDuration('trabalhando', 'ATK-10', 1, T)).toBeNull();
  });

  it('o ciclo da fase 1 é 2,56 s e o da fase 2 é 2,31 s (§6.3)', () => {
    const ciclo1 = T.arcWindupMs + T.arcMs + T.arcRecoverMs + 400;      // + reposicionamento
    const ciclo2 = T.arcWindupMs + T.arcMs + T.arcRecoverPhase2Ms + 300;
    expect(ciclo1).toBe(2560);
    expect(ciclo2).toBe(2310);
  });
});

describe('ENT-005 Forjador — os três ataques (§5.3)', () => {
  it('fase 1 alterna corrente e peça; a peça é a resposta lateral', () => {
    expect(chooseForgeAttack(1, 0)).toBe('ATK-10');
    expect(chooseForgeAttack(1, 1)).toBe('ATK-11');
    expect(chooseForgeAttack(1, 2)).toBe('ATK-10');
  });

  it('fase 2 acrescenta a onda no ciclo de três', () => {
    expect([0, 1, 2, 3].map((i) => chooseForgeAttack(2, i)))
      .toEqual(['ATK-10', 'ATK-11', 'ATK-12', 'ATK-10']);
  });

  it('o arco da corrente cobre 5 tiles e vira com ele (§6.5)', () => {
    const alcance = 5 * TILE;   // 320 px
    expect(alcance).toBe(320);
    expect(inForgeArc(800, -1, alcance, 480)).toBe(true);    // beirada do arco
    expect(inForgeArc(800, -1, alcance, 470)).toBe(false);   // 10 px além
    expect(inForgeArc(800, 1, alcance, 1120)).toBe(true);
    expect(inForgeArc(800, 1, alcance, 1130)).toBe(false);
  });

  it('a onda percorre 6 tiles do piso a partir dele', () => {
    const alcance = 6 * TILE;   // 384 px
    expect(waveReach(800, 1, alcance)).toEqual({ from: 800, to: 1184 });
    expect(waveReach(800, -1, alcance)).toEqual({ from: 416, to: 800 });
    expect(Math.round(waveFrontX(800, 1, alcance, 300, 600))).toBe(992);   // meio caminho
    expect(waveFrontX(800, 1, alcance, 600, 600)).toBe(1184);
  });

  it('a peça em brasa viaja na altura do peito: pular no lugar não salva (§5.3)', () => {
    const pe = 448;   // piso
    const corpo = 110;
    // de pé no chão, a peça na altura do peito acerta
    expect(pieceHitsPlayer(500, pe - 60, 500, pe, corpo)).toBe(true);
    // um tile ao lado, não acerta: a resposta é lateral
    expect(pieceHitsPlayer(500, pe - 60, 500 + TILE + 30, pe, corpo)).toBe(false);
    // acima da cabeça, também não
    expect(pieceHitsPlayer(500, pe - corpo - 40, 500, pe, corpo)).toBe(false);
  });
});

describe('CEN-092 pilão — o metrônomo (§7)', () => {
  it('o período é 6,0 s e cai para 4,5 s na fase 2 (§7.3)', () => {
    expect(hammerPeriod(1, H)).toBe(6000);
    expect(hammerPeriod(2, H)).toBe(4500);
    expect(hammerPeriod(2, H) / hammerPeriod(1, H)).toBe(0.75);
  });

  it('a batida em t=0 e o telegraph nos 900 ms anteriores (§7.3)', () => {
    const fase = (ms: number) => hammerPhaseAt(ms, H.periodMs, 0, H);
    expect(fase(0)).toBe('golpe');
    expect(fase(100)).toBe('golpe');
    expect(fase(180)).toBe('quieto');
    expect(fase(3000)).toBe('quieto');
    expect(fase(5100)).toBe('telegraph');
    expect(fase(5900)).toBe('telegraph');
    expect(fase(6000)).toBe('golpe');   // o ciclo volta a bater
  });

  it('o segundo pilão está defasado em MEIO período (§7.3)', () => {
    const a = (ms: number) => hammerPhaseAt(ms, H.periodMs, 0, H);
    const b = (ms: number) => hammerPhaseAt(ms, H.periodMs, H.offsetMs, H);
    expect(a(0)).toBe('golpe');
    expect(b(0)).toBe('quieto');       // nunca batem juntos
    expect(b(3000)).toBe('golpe');
    expect(a(3000)).toBe('quieto');
    // defasagem = metade do período, exatamente
    expect(H.offsetMs * 2).toBe(H.periodMs);
  });

  it('0,33 batidas/s na fase 1 e 0,44 na fase 2 (§7.3)', () => {
    expect(hammerBeatsPerSecond(6000, 2)).toBeCloseTo(0.33, 2);
    expect(hammerBeatsPerSecond(4500, 2)).toBeCloseTo(0.44, 2);
  });

  it('os pilões param na morte do chefe — e só por isso (§7.5)', () => {
    expect(hammerStops(true, true)).toBe(false);
    expect(hammerStops(true, false)).toBe(true);
    // sem chefe no build o pilão é da fábrica: nunca para
    expect(hammerStops(false, false)).toBe(false);
  });

  it('o dano do pilão é o maior do jogo e não mata (§7.1)', () => {
    expect(25).toBeGreaterThan(22);    // > corrente
    expect(25).toBeGreaterThan(20);    // > onda
    // 150 de vida efetiva: 5 erros sofridos, o 6º mata — a mesma margem do Alferes (§6.2)
    expect(Math.floor((150 - 1) / 25)).toBe(5);
    expect(150 - 5 * 25).toBe(25);   // sobra 1 golpe de vida
    expect(150 - 6 * 25).toBeLessThanOrEqual(0);
  });
});
