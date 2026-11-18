/** Captura de telas do recorte para documentação: `node tests/shots.mjs` (dev server no ar). */
import { chromium } from 'playwright';

const OUT = process.env.SMOKE_OUT ?? '/tmp';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(process.env.SMOKE_URL ?? 'http://localhost:5173/?skip=menu', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.evaluate(() => { window.__game.loop._coolDown = 0; });
await page.waitForTimeout(1200);

const goRoom = async (i, label) => {
  await page.evaluate(async (idx) => {
    const s = window.__game.scene.getScene('Game');
    s.changeRoom(idx, 'east');
    await new Promise((r) => setTimeout(r, 900));
  }, i);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/hm-${label}.png` });
};

await page.screenshot({ path: `${OUT}/hm-a-l01-01.png` });
await goRoom(2, 'b-l01-03');
await goRoom(3, 'd-l01-04');
await goRoom(4, 'e-l01-05');
// L01-02 inteira: para a câmera no meio da sala para ver a escada de plataformas
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.changeRoom(1, 'east');
  await new Promise((r) => setTimeout(r, 900));
  const cam = s.cameras.main; cam.stopFollow(); cam.scrollX = 640;
});
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/hm-c-l01-02.png` });
console.log('ok');
await browser.close();
