/** Capturas de LVL-06 (`[PÓS]`) — `node tests/shots06.mjs`. */
import { chromium } from 'playwright';
// `DEC-027`: a entrada do jogo é por **ação** (`scene.virtuais`), não por tecla (`scene.keys`).
// Os testes seguram a ação como o controlo de toque a seguraria — o caminho é o mesmo do jogador.
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
  await page.evaluate((i) => window.__game.scene.getScene('Game').scene.restart({ area: 'LVL-06', room: i }), room);
  await page.waitForTimeout(1200);
};
const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('·', name); };

// 1. boca da mina: a vigília que não voltou, os primeiros cristais
await goto(0);
await page.waitForTimeout(400);
await shot('L06-01-boca-da-mina');

// 2. escoramento: o teto que já caiu, com estacas cíclicas
await goto(1);
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(6 * 64, 7 * 64 - 40);
  s.player.body.reset(6 * 64, 7 * 64 - 40);
});
await page.waitForTimeout(900);
await shot('L06-02-escoramento');

// 3. poço dos cristais: a única luz da mina
await goto(2);
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(10 * 64, 7 * 64 - 40);
  s.player.body.reset(10 * 64, 7 * 64 - 40);
});
await page.waitForTimeout(600);
await shot('L06-03-poco-dos-cristais');

// 4. veio afogado: submerso, barra de fôlego na tela, item de Fôlego ao fundo
await goto(3);
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const item = s.built.items.find((i) => i.id === 'ITM-006');
  s.player.setPosition(item.x - 220, item.y - 30);
  s.player.body.reset(item.x - 220, item.y - 30);
  await new Promise((r) => setTimeout(r, 1400));
});
await page.waitForTimeout(300);
await shot('L06-04-veio-afogado');

// 5. galeria afogada: 19 tiles sem ar — só passa com HAB-06
await goto(4);
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.abilities.breath = true;
  s.breathMs = 20000;
  const x = s.built.water.x + 60;
  s.player.setPosition(x, 7 * 64 - 40);
  s.player.body.reset(x, 7 * 64 - 40);
  s.virtuais.add('direita');
  await new Promise((r) => setTimeout(r, 2200));
  s.virtuais.delete('direita');
});
await page.waitForTimeout(400);
await shot('L06-05-galeria-afogada');

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
