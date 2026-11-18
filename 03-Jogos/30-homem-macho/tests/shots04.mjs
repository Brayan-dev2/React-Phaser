/** Capturas de LVL-04 (`[PÓS]`) — `node tests/shots04.mjs`. */
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
  await page.evaluate((i) => window.__game.scene.getScene('Game').scene.restart({ area: 'LVL-04', room: i }), room);
  await page.waitForTimeout(1200);
};
const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('·', name); };

// 1. soleira: árvores mortas, cinza caindo, sumidouro e a primeira inscrição do Ato II
await goto(0);
await page.waitForTimeout(500);
await shot('L04-01-entrada');

// 2. clareira: raízes one-way e a rota alta opcional
await goto(1);
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(9.5 * 64, 3 * 64);
  s.player.body.reset(9.5 * 64, 3 * 64);
});
await page.waitForTimeout(1500);
await shot('L04-02-raizes');

// 3. a Ronda: três Sentinelas em formação
await goto(2);
await page.waitForTimeout(1200);
await shot('L04-03-ronda');

// 4. tronco oco: teto baixo, onde HAB-01 não ajuda
await goto(3);
await page.waitForTimeout(600);
await shot('L04-04-tronco');

// 5. portal natural: parede de raiz de 3 tiles + sumidouro
await goto(4);
await page.waitForTimeout(600);
await shot('L04-05-portao');

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
