/** Capturas de LVL-08 (`[PÓS]`) — `node tests/shots08.mjs`. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const OUT = 'docs/capturas';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
await page.goto(process.env.SMOKE_URL ?? 'http://localhost:5173/?skip=menu', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.evaluate(() => { window.__game.loop._coolDown = 0; });
const goto = async (room) => {
  await page.evaluate((i) => window.__game.scene.getScene('Game').scene.restart({ area: 'LVL-08', room: i }), room);
  await page.waitForTimeout(1200);
};
const place = async (x, y) => {
  await page.evaluate(([px, py]) => {
    const s = window.__game.scene.getScene('Game');
    s.player.setPosition(px, py);
    s.player.body.reset(px, py);
  }, [x, y]);
  await page.waitForTimeout(700);
};
const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('·', name); };

// 1. areia: a primeira faixa do jogo e o sol vermelho encostado na muralha
await goto(0);
await place(6 * 64, 7 * 64 - 40);
await shot('L08-01-areia');

// 2. terraço: duas arquibancadas, vão de 7 tiles, Sentinelas em duas alturas
await goto(1);
await place(12 * 64, 7 * 64 - 40);
await shot('L08-02-terraco');

// 3. antessala: areia entre as plataformas, na boca da arena
await goto(2);
await place(9 * 64, 7 * 64 - 40);
await shot('L08-03-antessala');

// 4. a arena: piso plano, quatro âncoras e o Alferes de serviço
await goto(3);
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(4 * 64, 7 * 64 - 40);
  s.player.body.reset(4 * 64, 7 * 64 - 40);
  await new Promise((r) => setTimeout(r, 2600));   // deixa a entrada dramática terminar
});
await shot('L08-04-arena-alferes');

// 5. a fase 2: areia acesa no piso, grade oeste caída
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.alferes.takeHit(120);
  s.callSand();
  s.callSand();
  s.callSand();
  await new Promise((r) => setTimeout(r, 1400));
});
await shot('L08-04b-arena-fase2-areia');

// 6. respiro: recompensa do chefe e monta-carga destravado
await goto(4);
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.bossDefeated = true;
  s.scene.restart({ area: 'LVL-08', room: 4 });
  await new Promise((r) => setTimeout(r, 1300));
  const p = s.built.saves[0];
  s.player.setPosition(p.x + 120, 7 * 64 - 40);
  s.player.body.reset(p.x + 120, 7 * 64 - 40);
});
await page.waitForTimeout(600);
await shot('L08-05-respiro-recompensa');

// 7. portão: o fim do Ato II
await goto(5);
await place(9 * 64, 7 * 64 - 40);
await shot('L08-06-portao');

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
