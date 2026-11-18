/**
 * Smoke test manual do recorte jogável (LVL-01, L01-01 → L01-02).
 *
 *   1) num terminal:  npm run dev
 *   2) noutro:        node tests/smoke.mjs
 *
 * Checa: boot sem erro de console, `MEC-001` (220 px/s), pulo, ataque/tiro,
 * pausa/retomada em `ESC` (`EVT-005`), save em `E` (`MEC-007`), itens
 * (`ITM-001`/`ITM-002`), salto duplo (`ITM-003`) e troca de sala.
 * Prints em /tmp/hm-*.png.
 *
 * Nota: renderização headless usa SwiftShader (~9 FPS), então o `TimeStep` do Phaser
 * entra em cool-down e o delta fica preso em 16,67 ms por alguns segundos.
 * Zeramos `loop._coolDown` para medir velocidade sem esperar o warm-up.
 */
import { chromium } from 'playwright';

const URL = process.env.SMOKE_URL ?? 'http://localhost:5173/?skip=menu';
const OUT = process.env.SMOKE_OUT ?? '/tmp';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.evaluate(() => { window.__game.loop._coolDown = 0; });
await page.waitForTimeout(500);

const probe = () => page.evaluate(() => {
  const g = window.__game;
  const s = g.scene.getScene('Game');
  return {
    fps: Math.round(g.loop.actualFps),
    delta: +g.loop.delta.toFixed(1),
    x: Math.round(s.player.x),
    y: Math.round(s.player.y),
    state: s.player.state,
    hp: s.player.resources.hp,
    room: s.roomIndex,
    paused: s.scene.isPaused(),
  };
});

const report = {};
report.boot = await probe();
report.hud = await page.locator('.hud__room').innerText();
await page.screenshot({ path: `${OUT}/hm-01-l01-01.png` });

// --- MEC-001: deslocamento em 1 s de caminhada
const walkA = await probe();
await page.keyboard.down('KeyD');
await page.waitForTimeout(1000);
const walkB = await probe();
await page.keyboard.up('KeyD');
report.walkPxPerSecond = walkB.x - walkA.x;

// --- pulo: ápice amostrado por frame, sem depender do relógio do Node
report.jumpApexPx = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const startY = s.player.y;
  let apex = startY;
  const stop = () => { s.events.off('update', tick); };
  const tick = () => { apex = Math.min(apex, s.player.y); };
  s.events.on('update', tick);
  s.player.body.velocity.y = -560; // MOVE.jumpImpulse
  await new Promise((r) => setTimeout(r, 1500));
  stop();
  return Math.round(startY - apex);
});

// --- ataque (J) e tiro (K) sem erro
await page.keyboard.press('KeyJ');
await page.waitForTimeout(200);
await page.keyboard.press('KeyK');
await page.waitForTimeout(300);
report.afterAttack = await probe();
await page.screenshot({ path: `${OUT}/hm-02-combate.png` });

// --- save em E (MEC-007): L01-01 não tem ponto de save, então visita L01-05
report.save = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.changeRoom(4, 'east'); // L01-05 é a sala com `P` no grid
  await new Promise((r) => setTimeout(r, 900));
  const zone = s.built.saves[0];
  if (!zone) return { skipped: 'sala sem ponto de save' };
  s.player.setPosition(zone.x, zone.y - 40);
  await new Promise((r) => setTimeout(r, 400));
  const near = s.nearSavePoint();
  const before = localStorage.getItem('homem-macho/save/v1');
  return { near, hasZone: true, before };
});
await page.keyboard.press('KeyE');
await page.waitForTimeout(600);
report.save.after = await page.evaluate(() => {
  const raw = localStorage.getItem('homem-macho/save/v1');
  return raw ? { bytes: raw.length, revision: JSON.parse(raw).revision } : null;
});
report.save.roomAfter = await page.locator('.hud__room').innerText();
await page.screenshot({ path: `${OUT}/hm-03-save.png` });
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.changeRoom(0, 'west');
  await new Promise((r) => setTimeout(r, 900));
});
await page.waitForTimeout(400);

// --- pausa em ESC (EVT-005)
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
report.pausedPanel = await page.locator('.panel').count();
await page.screenshot({ path: `${OUT}/hm-04-pausa.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
report.resumed = !(await probe()).paused;

// --- ITM-001 e ITM-002 no grid: reduz o recurso, coleta e confere o teto
report.items = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const s = window.__game.scene.getScene('Game');
  const out = [];
  for (const [roomIndex, hp, shield] of [[3, 55, 20], [4, 55, 20]]) {
    s.mountRoom(roomIndex, 'start');
    await sleep(700);
    const item = s.built.items[0];
    if (!item) { out.push({ room: roomIndex, skipped: true }); continue; }
    s.player.resources.hp = hp;
    s.player.resources.shield = shield;
    s.player.setPosition(item.x, item.y - 40);
    await sleep(700);
    out.push({
      room: roomIndex, id: item.id,
      hp: s.player.resources.hp, shield: s.player.resources.shield,
      restouNoGrid: s.built.items.length,
    });
  }
  return out;
});

// --- ITM-003: a mesma sequência de teclas sobe mais alto com o salto duplo ligado
const apexWith = async (doubleJump) => {
  await page.evaluate((d) => {
    const s = window.__game.scene.getScene('Game');
    s.mountRoom(0, 'start');
    s.player.abilities.doubleJump = d;
  }, doubleJump);
  await page.waitForTimeout(900);
  const y0 = (await probe()).y;
  let apex = y0;
  const sample = async () => { apex = Math.min(apex, (await probe()).y); };
  await page.keyboard.down('Space');
  for (let i = 0; i < 3; i++) { await page.waitForTimeout(60); await sample(); }
  await page.keyboard.up('Space');
  await page.waitForTimeout(120);
  await page.keyboard.down('Space');
  for (let i = 0; i < 12; i++) { await page.waitForTimeout(60); await sample(); }
  await page.keyboard.up('Space');
  return Math.round(y0 - apex);
};
report.jumpHeightSemITM003 = await apexWith(false);
report.jumpHeightComITM003 = await apexWith(true);

// --- transição L01-01 → L01-02 andando até a borda leste
await page.keyboard.down('KeyD');
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(250);
  const r = await probe();
  if (r.room !== 0) break;
}
await page.keyboard.up('KeyD');
await page.waitForTimeout(600);
report.afterTransition = await probe();
report.hudAfter = await page.locator('.hud__room').innerText();
await page.screenshot({ path: `${OUT}/hm-05-l01-02.png` });

report.errors = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
