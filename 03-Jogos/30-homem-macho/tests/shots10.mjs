/** Capturas de LVL-10 (`[PÓS]`) — `node tests/shots10.mjs`. */
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

const go = async (room, garra = false) => {
  await page.evaluate(async ([i, g]) => {
    const s = window.__game.scene.getScene('Game');
    s.player?.releaseHook?.();
    s.player?.releaseClimb?.();
    s.busy = false;
    s.scene.restart({ area: 'LVL-10', room: i });
    await new Promise((r) => setTimeout(r, 900));
    if (g) window.__game.scene.getScene('Game').player.unlockClimb();
  }, [room, garra]);
  await page.waitForTimeout(600);
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
  await page.waitForTimeout(500);
};
const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('·', name); };

// 1. a base: alçapão lacrado no teto, poço no chão, a torre acesa (a tocha é a pista)
await go(0);
await place(9 * 64, 7 * 64 - 40);
await shot('L10-01-base');

// 2. o arsenal: a garra guardada, dois Sentinelas e a estante que pegou fogo
await go(1);
await place(9 * 64, 7 * 64 - 40);
await shot('L10-02-arsenal');

// 3. a sala do sino: o sino sem badalo e a corda que ninguém puxa
await go(2);
await place(13 * 64, 7 * 64 - 40);
await shot('L10-03-sala-do-sino');

// 4. o quarto seguro: o único lugar do Ato III em que a morte não é o assunto
await go(3);
await place(8 * 64, 7 * 64 - 40);
await shot('L10-04-quarto-seguro');

// 5. a escada em caracol: alçapão aberto em cima da parede de ganchos
await go(4, true);
await place(11 * 64, 7 * 64 - 40);
await shot('L10-05-escada-em-caracol');

// 6. a escalada em uso: 6 tiles de parede até o alçapão
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const p = s.built.climbables[0];
  s.player.setPosition(p.x - 30, 6 * 64);
  s.player.body.reset(p.x - 30, 6 * 64);
  await new Promise((r) => setTimeout(r, 300));
  s.virtuais.add('direita');
  await new Promise((r) => setTimeout(r, 200));
  s.virtuais.add('pular');
  await new Promise((r) => setTimeout(r, 1700));
  s.virtuais.delete('pular');
  s.virtuais.delete('direita');
});
await shot('L10-05b-escalando');

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
