/**
 * Verificação de LVL-08 (`[PÓS]`) no navegador — `node tests/lvl08.mjs`.
 *
 * O setor é o único do jogo em que a passagem depende de **ganhar uma luta**. O que só o
 * runtime prova: a areia reduz a velocidade no chão (sem dano), o relógio das âncoras
 * acorda o piso, a grade oeste fecha atrás do jogador, a leste só cede no 0 HP
 * (`TST-009` — uma única vez) e a areia **zera na morte** (§10.1, o oposto de LVL-05).
 */
import { chromium } from 'playwright';
// `DEC-027`: a entrada do jogo é por **ação** (`scene.virtuais`), não por tecla (`scene.keys`).
// Os testes seguram a ação como o controlo de toque a seguraria — o caminho é o mesmo do jogador.

const URL = process.env.SMOKE_URL ?? 'http://localhost:5173/?skip=menu';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.evaluate(() => { window.__game.loop._coolDown = 0; });

const gotoRoom = async (index) => {
  await page.evaluate((i) => {
    window.__game.scene.getScene('Game').scene.restart({ area: 'LVL-08', room: i });
  }, index);
  await page.waitForTimeout(900);
};

const state = () => page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    area: s.area.id, room: s.roomIndex,
    x: Math.round(s.player.x), y: Math.round(s.player.y),
    hp: s.player.resources.hp, shield: s.player.resources.shield,
    velocidadePiso: s.player.speedMultiplier,
    areia: s.built.sand.length,
    ancoras: s.built.anchors.length,
    ancorasAtivas: s.sandClock.anchors,
    grades: s.built.grates.map((g) => g.side),
    montaCarga: s.built.hoists.length,
    sentinelas: s.built.sentinels.length,
    chefe: s.alferes ? { hp: s.alferes.hp, fase: s.alferes.phase, estado: s.alferes.state } : null,
    venceuChefe: s.bossDefeated,
    leste: s.built.eastOpen,
  };
});

const report = {};

// ---------- 1. a chegada: areia no piso, sol vermelho, monta-carga lacrado ----------
await gotoRoom(0);
report.entrada = await state();

// ---------- 2. a areia reduz a velocidade no chão a 0,75× e NÃO dá dano (§7.1) ----------
const areia = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const r = s.built.sand[0];
  const hpAntes = s.player.resources.hp + s.player.resources.shield;
  s.player.setPosition(r.x + 20, 7 * 64 - 40);
  s.player.body.reset(r.x + 20, 7 * 64 - 40);
  await new Promise((res) => setTimeout(res, 400));
  const naAreia = s.player.speedMultiplier;
  s.player.setPosition(r.x - 200, 7 * 64 - 40);
  s.player.body.reset(r.x - 200, 7 * 64 - 40);
  await new Promise((res) => setTimeout(res, 400));
  const fora = s.player.speedMultiplier;
  // no ar o atrito desaparece: pular cancela o efeito
  s.player.setPosition(r.x + 20, 7 * 64 - 40);
  s.player.body.reset(r.x + 20, 7 * 64 - 40);
  s.player.body.setVelocityY(-400);
  await new Promise((res) => setTimeout(res, 200));
  const noAr = s.player.speedMultiplier;
  await new Promise((res) => setTimeout(res, 900));
  return {
    naAreia, fora, noAr,
    hpAntes, hpDepois: s.player.resources.hp + s.player.resources.shield,
  };
});
report.areia = { ...areia, esperado: '0,75 no chão sobre areia; 1 fora e no ar; hp intacto' };

// ---------- 3. o monta-carga está lacrado antes do chefe (§4.1) ----------
const lacrado = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const h = s.built.hoists[0];
  s.player.setPosition(h.x, h.y - 20);
  s.player.body.reset(h.x, h.y - 20);
  await new Promise((r) => setTimeout(r, 300));
  s.tryHoist();
  await new Promise((r) => setTimeout(r, 500));
  return {
    sala: s.roomIndex,
    texto: document.querySelector('.panel--text')?.textContent ?? '',
  };
});
report.montaCargaLacrado = { ...lacrado, esperado: 'não muda de sala: "O CABO ESTÁ SEM CARGA."' };

// ---------- 4. a arena: oeste fecha atrás, chefe entra em cena ----------
await gotoRoom(3);
report.arenaEntrada = await state();
const gradeOeste = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const antes = s.westClosed;
  s.player.setPosition(4 * 64, 7 * 64 - 40);
  s.player.body.reset(4 * 64, 7 * 64 - 40);
  await new Promise((r) => setTimeout(r, 700));
  // a grade fechada tem de barrar de verdade: andar para oeste não sai da arena
  s.player.setPosition(2 * 64, 7 * 64 - 40);
  s.player.body.reset(2 * 64, 7 * 64 - 40);
  await new Promise((r) => setTimeout(r, 300));
  s.virtuais.add('esquerda');
  await new Promise((r) => setTimeout(r, 1400));
  s.virtuais.delete('esquerda');
  await new Promise((r) => setTimeout(r, 200));
  return {
    antes, depois: s.westClosed, sala: s.roomIndex, x: Math.round(s.player.x),
    atravessou: s.player.x < 32,   // saiu da arena pela grade fechada: falha
  };
});
report.gradeOeste = { ...gradeOeste, esperado: 'westClosed true depois de cruzar x ≥ 3 tiles' };

// ---------- 5. o relógio acorda âncoras (§7.3) e a areia acumula ----------
const relogio = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.sandClock = { anchors: 0, elapsedMs: 0, phase: 1 };
  // acelera 9 s de relógio de uma vez: a primeira âncora acorda em 8 s
  s.callSand();
  await new Promise((r) => setTimeout(r, 400));
  const depoisDeUm = s.sandClock.anchors;
  s.callSand();
  await new Promise((r) => setTimeout(r, 300));
  return { depoisDeUm, depoisDeDois: s.sandClock.anchors, spritesDeAreia: s.sandSprites.length };
});
report.relogioDaAreia = { ...relogio, esperado: '1 âncora por chamado, até 4' };

// ---------- 6. fase 2 em 120 HP, uma única vez (§5.5) ----------
const fases = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const l = s.alferes;
  const antes = { hp: l.hp, fase: l.phase, estado: l.state };
  l.takeHit(120);
  await new Promise((r) => setTimeout(r, 300));
  const meio = { hp: l.hp, fase: l.phase, estado: l.state };
  return { antes, meio };
});
report.fases = { ...fases, esperado: '240 → 120 (fase 2, estado transicao-fase)' };

// ---------- 7. TST-009: o 0 HP processa uma única vez e a grade leste cede ----------
const morte = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const l = s.alferes;
  let vezes = 0;
  const original = l.onDefeated;
  l.onDefeated = () => { vezes += 1; original?.(); };
  l.takeHit(999);              // 0 HP na primeira vez: processa
  await new Promise((r) => setTimeout(r, 400));
  l.takeHit(999);              // 0 HP de novo: não pode processar
  await new Promise((r) => setTimeout(r, 900));
  return {
    vezes, venceu: s.bossDefeated, leste: s.built.eastOpen,
    estadoChefe: l.state, areiaZerada: s.sandClock.anchors,
  };
});
report.morteDoChefe = { ...morte, esperado: '1 processamento, grade leste aberta, areia zerada' };

// ---------- 8. a areia zera na morte do jogador (§10.1) ----------
const zerouNaMorte = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.sandClock = { anchors: 3, elapsedMs: 500, phase: 2 };
  s.player.resources.shield = 0;
  s.player.takeDamage(999, s.difficulty, s.player.x + 10);
  await new Promise((r) => setTimeout(r, 1600));
  return { ancoras: s.sandClock.anchors, sala: s.roomIndex, hp: s.player.resources.hp };
});
report.areiaZeraNaMorte = { ...zerouNaMorte, esperado: 'ancoras 3 → 0 depois da morte' };

// ---------- 9. `ITM-007` só existe depois da luta (§5.6) ----------
await gotoRoom(4);
const recompensa = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return { bossDefeated: s.bossDefeated, itens: s.built.items.map((i) => i.id) };
});
report.recompensa = { ...recompensa, esperado: 'ITM-007 existe na ficha, mas só aparece com o chefe vencido' };

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
