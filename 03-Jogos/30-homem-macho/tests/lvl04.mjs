/**
 * Verificação de LVL-04 (`[PÓS]`) no navegador — `node tests/lvl04.mjs`.
 *
 * Cobre o que só o runtime prova: raiz one-way (`=`), formação da Ronda (`patrol_sync`,
 * §5.2), sumidouro de cinza de mão única (`CEN-034`, §6) e o setor **fora da progressão**
 * (`PAT-C-10`: `FLAGS.lvl04` off ⇒ LVL-03 fecha o build).
 */
import { chromium } from 'playwright';

const URL = process.env.SMOKE_URL ?? 'http://localhost:5173/?skip=menu';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.evaluate(() => { window.__game.loop._coolDown = 0; });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const gotoRoom = async (index) => {
  await page.evaluate((i) => {
    window.__events = [];
    window.__game.scene.getScene('Game').scene.restart({ area: 'LVL-04', room: i });
  }, index);
  await page.waitForTimeout(800);
};

const state = () => page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    area: s.area.id,
    room: s.roomIndex,
    x: Math.round(s.player.x),
    y: Math.round(s.player.y),
    hp: s.player.resources.hp,
    oneWays: s.built.platforms.getChildren().length,
    sinks: s.built.sinks.length,
    trees: s.built.decorBack.filter((d) => d.kind === 'tree').length,
    ash: s.built.decorBack.filter((d) => d.kind === 'ash').length,
    texts: s.built.texts.length,
    sentinels: s.sentinels.getChildren().map((e) => ({ x: Math.round(e.x), dir: e.facing, state: e.state })),
  };
});

const report = {};

// ---------- 1. glifos novos viram objeto de jogo ----------
await gotoRoom(0);
report.entrada = await state();

// ---------- 2. raiz `=` é atravessável de baixo para cima (one-way) ----------
await gotoRoom(1);
const raiz = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  // sobe por dentro da raiz A (x 8–11, topo em y=4) e cai em cima dela
  s.player.setPosition(9.5 * 64, 3 * 64);
  s.player.body.reset(9.5 * 64, 3 * 64);
  await new Promise((r) => setTimeout(r, 1400));
  return {
    y: Math.round(s.player.y), topoDaRaiz: 4 * 64, noChao: s.player.body.blocked.down,
    raizes: s.built.platforms.getChildren().length,
  };
});
report.raizOneWay = { ...raiz, esperado: 'pousa em cima da raiz (y≈272 = topo da zona), nunca no piso (448)' };

// ---------- 3. a Ronda: três Sentinelas na mesma direção (patrol_sync) ----------
await gotoRoom(2);
const formacao = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const amostras = [];
  for (let i = 0; i < 14; i++) {
    await new Promise((r) => setTimeout(r, 260));
    amostras.push(s.sentinels.getChildren().map((e) => e.facing));
  }
  const iguais = amostras.every((a) => a.every((d) => d === a[0]));
  const sentinelas = s.sentinels.getChildren().map((e) => ({ x: Math.round(e.x), dir: e.facing }));
  return { quantas: sentinelas.length, iguaisEm14Amostras: iguais, sentinelas };
});
report.ronda = { ...formacao, esperado: '3 Sentinelas, todas com a mesma direção em todo instante' };

// ---------- 4. sumidouro: `E` na grade volta para L04-01 (2,3) e não salva ----------
await gotoRoom(4);
const sumidouro = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const grade = s.built.sinks[0];
  s.player.setPosition(grade.x, grade.y - 10);
  s.player.body.reset(grade.x, grade.y - 10);
  await new Promise((r) => setTimeout(r, 400));
  s.trySink();
  await new Promise((r) => setTimeout(r, 1400));
  return {
    area: s.area.id, sala: s.roomIndex,
    x: Math.round(s.player.x), y: Math.round(s.player.y),
    chegadaY: 3 * 64 - 8,
    checkpoint: s.checkpointRoom,
    hp: s.player.resources.hp,
  };
});
report.sumidouro = {
  ...sumidouro,
  esperado: 'sala 0 em x≈160; cai 3 tiles (parte de y=184) e pousa na soleira (448); sem dano, sem save',
};

// ---------- 5. chegada em (2,3) é arrival_only: não teleporta de volta ----------
const chegada = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  await new Promise((r) => setTimeout(r, 900));
  return { sala: s.roomIndex, x: Math.round(s.player.x), y: Math.round(s.player.y) };
});
report.chegadaNaoTeleporta = chegada;

// ---------- 6. `PAT-C-10`: LVL-04 fora da progressão com a flag desligada ----------
const progressao = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return { areaAtual: s.area.id, totalSalas: s.rooms.length };
});
await page.evaluate(() => window.__game.scene.getScene('Game').scene.restart({ area: 'LVL-03', room: 3 }));
await page.waitForTimeout(800);
const fimDoMvp = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(s.built.worldWidth - 20, 6 * 64);
  await new Promise((r) => setTimeout(r, 900));
  return {
    area: s.area.id,
    completou: (window.__events ?? []).filter((e) => e.type === 'game:completed').length,
  };
});
report.foraDaProgressao = { ...progressao, ...fimDoMvp, esperado: 'LVL-03 sala 3 → game:completed (não entra em LVL-04)' };

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
