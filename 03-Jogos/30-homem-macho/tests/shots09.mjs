/** Capturas de LVL-09 (`[PÓS]`) — `node tests/shots09.mjs`. */
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

const go = async (room, hook = false) => {
  await page.evaluate(async ([i, h]) => {
    const s = window.__game.scene.getScene('Game');
    s.player?.releaseHook?.();
    s.busy = false;
    s.scene.restart({ area: 'LVL-09', room: i });
    await new Promise((r) => setTimeout(r, 900));
    if (h) window.__game.scene.getScene('Game').player.unlockHook();
  }, [room, hook]);
  await page.waitForTimeout(700);
};
const place = async (x, y) => {
  await page.waitForFunction(() => {
    const s = window.__game?.scene.getScene('Game');
    return !!s?.player?.body && !s.busy;
  }, null, { timeout: 8000 });
  await page.evaluate(([px, py]) => {
    const s = window.__game.scene.getScene('Game');
    s.player.setPosition(px, py);
    s.player.body.reset(px, py);
  }, [x, y]);
  await page.waitForTimeout(600);
};
const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('·', name); };

// 1. a boca: tubo de tijolo, o vazamento que não sabe que o canal secou
await go(0);
await place(8 * 64, 7 * 64 - 40);
await shot('L09-01-boca');

// 2. o canal raso: a argola gasta sobre o vão de 8 tiles — exposição 1 de PAT-LD-03
await go(1);
await place(9 * 64, 7 * 64 - 40);
await shot('L09-02-canal-raso');

// 3. a galeria cega: 3 tiles úteis e água até o teto
await go(2);
await place(6 * 64, 7 * 64 - 40);
await shot('L09-03-galeria-cega');

// 4. a casa de bombas: o gancho sobre o piso seco, duas Sentinelas
await go(3);
await place(9 * 64, 7 * 64 - 40);
await shot('L09-04-casa-de-bombas');

// 5. o poço: argola de prática a oeste, argola do canal no meio do vão
await go(4, true);
await place(6 * 64, 7 * 64 - 40);
await shot('L09-05-poco');

// 6. o gancho em uso: pendurado na argola do canal
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(10 * 64 - 20, 6 * 64);
  s.player.body.reset(10 * 64 - 20, 6 * 64);
  await new Promise((r) => setTimeout(r, 300));
  s.tryGrapple();
  await new Promise((r) => setTimeout(r, 120));
});
await shot('L09-05b-gancho-puxando');
await page.waitForTimeout(700);
await shot('L09-05c-gancho-pendurado');

// 7. a escada de serviço: o corredor submerso e a grade do sumidouro
await go(5);
await place(6 * 64, 7 * 64 - 40);
await shot('L09-06-escada-de-servico');

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
