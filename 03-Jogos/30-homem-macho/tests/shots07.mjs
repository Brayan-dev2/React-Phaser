/** Capturas de LVL-07 (`[PÓS]`) — `node tests/shots07.mjs`. */
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
  await page.evaluate((i) => window.__game.scene.getScene('Game').scene.restart({ area: 'LVL-07', room: i }), room);
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

// 1. a nave: 8 arcos cortados pelo teto e o vitral no fim do quadro
await goto(0);
await shot('L07-01-nave');

// 2. deambulatório: duas arquitraves idênticas e um vão de 8 tiles entre elas
await goto(1);
await place(14 * 64, 7 * 64 - 40);
await shot('L07-02-deambulatorio');

// 3. coro: a única escalada do setor, três níveis
await goto(2);
await place(10 * 64, 3 * 64 + 16);
await shot('L07-03-coro');

// 4. sacristia: o contraste de câmara depois de 40 tiles de nave
await goto(3);
await place(9 * 64, 7 * 64 - 40);
await shot('L07-04-sacristia');

// 5. rosácea: o mesmo vitral, agora do lado de dentro — e a boca do trifório
await goto(4);
await place(9 * 64, 7 * 64 - 40);
await shot('L07-05-rosacea');

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
