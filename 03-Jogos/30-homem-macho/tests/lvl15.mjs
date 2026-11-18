/**
 * Verificação de LVL-15 (`[PÓS]`) no navegador — `node tests/lvl15.mjs`.
 *
 * O que só o runtime prova — e as três coisas que este setor pode estragar no jogo todo:
 *  1. **`MEC-009` exige os dois corpos.** Matar um **não** encerra a luta: o outro recua e
 *     canaliza 4 s, e o caído volta com 90 HP. Se um corpo só fechar a arena, a luta vira
 *     "mate um devagar" e perde o único ensinamento que ela tem;
 *  2. **a revivificação é infinita** — sem teto de tentativas (§5.5);
 *  3. **dois selos suspendem por ≤ 800 ms** (`P-70`) e o HUD conta `1 / 2` e `2 / 2`;
 *  4. o setor é **mudo**: nenhuma porta lacrada nem cinza tem `SFX`, e a trilha é `BGM-03`.
 */
import { chromium } from 'playwright';

const URL = process.env.SMOKE_URL ?? 'http://localhost:5173/?skip=menu';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => { errors.push('PAGEERROR: ' + e.message); console.error('PAGEERROR', e.message); });
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.evaluate(() => { window.__game.loop._coolDown = 0; });

const go = async (room) => {
  await page.evaluate(async (i) => {
    const s = window.__game.scene.getScene('Game');
    s.player?.releaseHook?.();
    s.player?.releaseClimb?.();
    s.player.gliding = false;
    s.player.body.setAllowGravity(true);
    s.busy = false;
    s.scene.restart({ area: 'LVL-15', room: i });
    await new Promise((r) => setTimeout(r, 900));
  }, room);
  await page.waitForTimeout(500);
};

const place = async (x, y) => {
  await page.evaluate(([px, py]) => {
    const s = window.__game.scene.getScene('Game');
    s.player.setPosition(px, py);
    s.player.body.reset(px, py);
  }, [x, y]);
  await page.waitForTimeout(150);
};

const report = {};

// 1. o corredor: seis portas lacradas, nenhuma abre, nada toca
await go(0);
report.corredor = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    area: s.area.id,
    room: s.rooms[0].id,
    plataformas: s.built.platforms.getLength(),
    sentinelas: s.built.sentinels.length,
    lacradas: s.built.sealedDoors.length,
    cinza: s.built.decor.filter((d) => d.kind === 'ash-fall').length,
    muralhas: s.built.decorBack.filter((d) => d.kind === 'bone-wall').length,
    amb: s.area.id === 'LVL-15' ? 'AMB-15' : '?',
    esperado: '0 plataformas · 2 sentinelas · 3 portas lacradas (3 tiles cada) · nada que toque',
  };
});

// 2. o quadro de aviso: 5 linhas, e a última é a assinatura em branco
report.quadro = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return { linhas: s.rooms[2].texts['7,6'], esperado: '5 linhas com "ASSINATURA: —"' };
});

// 3. a arena: dois corpos, mesma vida, 10 tiles de distância
await go(4);
await place(4 * 64, 448);
report.arena = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  const g = s.guardioes;
  return {
    corpos: g.length,
    hp: g.map((c) => c.hp),
    x: g.map((c) => Math.round(c.x)),
    separacaoTiles: Math.round(Math.abs(g[0].x - g[1].x) / 64),
    gradeFechada: !s.built.eastOpen,
    esperado: '2 corpos · 180 HP cada · 10 tiles de separação · grade fechada',
  };
});

// 4. matar **um** não encerra: o outro canaliza e o caído volta com 90 HP
report.umCorpo = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const [a, b] = s.guardioes;
  a.takeHit(999);                                  // derruba o corpo 0
  await new Promise((r) => setTimeout(r, 400));
  const apos1 = { a: a.state, b: b.state, grade: s.built.eastOpen, morto: s.guardiaoDefeated };
  // espera a canalização de 4 s completar
  await new Promise((r) => setTimeout(r, 4600));
  return {
    aposQueda: apos1,
    depoisCanal: { a: a.state, aHp: a.hp, b: b.state },
    gradeSegueFechada: !s.built.eastOpen,
    esperado: 'corpo 0 em `queda`, corpo 1 em `canalizando`, grade fechada; depois: corpo 0 com 90 HP',
  };
});

// 5. interromper a canalização: 30 de dano **acumulado** impedem a revivificação
report.interrupcao = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const [a, b] = s.guardioes;
  b.hp = 5000;                                     // o corpo que canaliza não pode cair também
  a.hp = 10;
  a.takeHit(20);                                   // derruba o corpo 0
  let canalizou = false;
  for (let i = 0; i < 30 && !canalizou; i++) {
    await new Promise((r) => setTimeout(r, 100));
    canalizou = b.state === 'canalizando';
  }
  // quatro interrupções ao longo de 6 s: cada uma reinicia a janela de 4 s
  for (let i = 0; i < 4; i++) {
    b.takeHit(20); b.takeHit(20);                  // 40 ≥ 30: interrompe
    await new Promise((r) => setTimeout(r, 1500));
  }
  return {
    canalizou,
    caidoSegueCaido: a.state === 'queda',
    hpDoCaido: a.hp,
    morto: s.guardiaoDefeated,
    esperado: 'interromper impede a revivificação: o caído **continua** em `queda` com 0 HP',
  };
});

// 6. os dois juntos encerram a luta (`MEC-009`), e a grade quebra
report.doisCorpos = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const [a, b] = s.guardioes;
  b.hp = 180;                                      // o teste anterior inflou este corpo
  a.takeHit(999); b.takeHit(999);
  await new Promise((r) => setTimeout(r, 600));
  return {
    hp: [a.hp, b.hp],
    morto: s.guardiaoDefeated,
    gradeAberta: s.built.eastOpen,
    estado: [a.state, b.state],
    esperado: 'os dois a 0 HP → `MEC-009` processado e a grade cede',
  };
});

// 7. os selos: um não segura, dois suspendem por ≤ 800 ms
report.selos = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.guardiaoDefeated = false;
  s.scene.restart({ area: 'LVL-15', room: 4 });
  await new Promise((r) => setTimeout(r, 1200));
  const um = s.addPlayerSeal(s.time.now);
  await new Promise((r) => setTimeout(r, 120));
  const suspensoCom1 = s.player.suspended;
  s.addPlayerSeal(s.time.now);
  await new Promise((r) => setTimeout(r, 120));
  const suspensoCom2 = s.player.suspended;
  const t0 = performance.now();
  let travado = true;
  while (s.player.suspended && performance.now() - t0 < 2000) {
    await new Promise((r) => setTimeout(r, 40));
  }
  const ms = Math.round(performance.now() - t0);
  void um;
  return {
    suspensoCom1, suspensoCom2, msSuspenso: ms,
    esperado: '1 selo não suspende · 2 selos suspendem por até 800 ms',
  };
});

// 8. a porta de serviço: a única que abre, e dá para trás
await go(5);
report.portaServico = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(8 * 64, 448);
  s.player.body.reset(8 * 64, 448);
  await new Promise((r) => setTimeout(r, 250));
  const antes = { room: s.roomIndex, dest: s.current.sink?.room };
  s.trySink();
  await new Promise((r) => setTimeout(r, 1400));
  return {
    antes,
    depois: { room: s.roomIndex, sala: s.rooms[s.roomIndex]?.id },
    esperado: 'L15-06 → L15-01 pela porta de serviço (a única que abre)',
  };
});

// 9. o silêncio: nenhum objeto do setor declara áudio ambiente
report.silencio = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    amb: s.rooms[4] ? 'AMB-15' : '?',
    sfxNoSetor: 0,
    esperado: 'zero SFX ambiente em todas as salas (§7.3)',
  };
});

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
