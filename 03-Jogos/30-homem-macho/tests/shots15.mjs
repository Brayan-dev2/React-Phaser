/** Capturas de LVL-15 (`[PÓS]`) — `node tests/shots15.mjs`. */
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

const go = async (room) => {
  await page.evaluate(async (i) => {
    const s = window.__game.scene.getScene('Game');
    s.player?.releaseHook?.();
    s.player?.releaseClimb?.();
    s.player.gliding = false;
    s.player.body.setAllowGravity(true);
    s.busy = false;
    s.guardiaoDefeated = false;
    s.scene.restart({ area: 'LVL-15', room: i });
    await new Promise((r) => setTimeout(r, 900));
  }, room);
  await page.waitForTimeout(500);
};
const place = async (x, y) => {
  await page.evaluate(([px, py]) => {
    const s = window.__game.scene.getScene('Game');
    s.player.setPosition(px, py);
    s.player.body.reset(px, py);
  }, [x, y]);
  await page.waitForTimeout(450);
};
const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('·', name); };

// 1. o corredor de portas: três lacres e ninguém
await go(0);
await place(12 * 64, 448);
await shot('L15-01-corredor-de-portas');

// 2. o corredor cego: o padrão aperta
await go(1);
await place(12 * 64, 448);
await shot('L15-02-corredor-cego');

// 3. o quarto de turno: o quadro mais importante do jogo
await go(2);
await place(8 * 64, 448);
await shot('L15-03-quarto-de-turno');

// 4. o cartório: dois carimbos, nenhum a menos
await go(3);
await place(9 * 64, 448);
await shot('L15-04-cartorio');

// 5. a arena: dois corpos, 10 tiles entre eles, a mesma frase
await go(4);
await place(4 * 64, 448);
await page.waitForTimeout(1400);
await shot('L15-05-sala-dos-dois');

// 6. um corpo em `queda` e o outro canalizando: `FALTA UM.`
await place(15 * 64, 448);
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.guardioes[0].takeHit(999);
  await new Promise((r) => setTimeout(r, 1300));
});
await shot('L15-06-falta-um');

// 7. o portão do trono e a porta de serviço: a única que abre
await go(5);
await place(10 * 64, 448);
await shot('L15-07-portao-do-trono');

console.log('erros:', errors.length ? errors : 'nenhum');
await browser.close();
process.exit(errors.length ? 1 : 0);
