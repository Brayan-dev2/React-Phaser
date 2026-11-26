/** Capturas de LVL-05 (`[PÓS]`) — `node tests/shots05.mjs`. */
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
  await page.evaluate((i) => window.__game.scene.getScene('Game').scene.restart({ area: 'LVL-05', room: i }), room);
  await page.waitForTimeout(1200);
};
const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('·', name); };

// 1. poço de entrada: bronze, óleo, engrenagens
await goto(0);
await page.waitForTimeout(400);
await shot('L05-01-entrada');

// 2. sala das engrenagens: três níveis e o bloco que não cede
await goto(1);
await page.waitForTimeout(400);
await shot('L05-02-engrenagens');

// 3. o hub e o elevador travado
await goto(2);
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const u = s.built.elevators[0];
  s.player.setPosition(u.x - 300, 7 * 64 - 40);
  s.player.body.reset(u.x - 300, 7 * 64 - 40);
});
await page.waitForTimeout(600);
await shot('L05-03-hub-elevador');

// 4. a oficina onde a Força está guardada
await goto(3);
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  const item = s.built.items.find((i) => i.id === 'ITM-005');
  s.player.setPosition(item.x - 120, 7 * 64 - 40);
  s.player.body.reset(item.x - 120, 7 * 64 - 40);
});
await page.waitForTimeout(600);
await shot('L05-04-forca');

// 5. o corredor do contrapeso: bloco empurrado até a placa
await goto(4);
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.abilities.strength = true;
  const bloco = s.blockSprites[0];
  for (let i = 0; i < 4; i++) {
    s.player.setPosition(bloco.sprite.x - 50, 7 * 64 - 40);
    s.player.body.reset(bloco.sprite.x - 50, 7 * 64 - 40);
    await new Promise((r) => setTimeout(r, 120));
    s.virtuais.add('direita');
    await new Promise((r) => setTimeout(r, 900));
    s.virtuais.delete('direita');
    await new Promise((r) => setTimeout(r, 450));
  }
});
await page.waitForTimeout(600);
await shot('L05-05-contrapeso');

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
