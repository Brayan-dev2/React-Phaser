/** Capturas de LVL-13 (`[PÓS]`) — `node tests/shots13.mjs`. */
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

const go = async (room, pano = true) => {
  await page.evaluate(async ([i, g]) => {
    const s = window.__game.scene.getScene('Game');
    s.player?.releaseHook?.();
    s.player?.releaseClimb?.();
    s.player.gliding = false;
    s.player.body.setAllowGravity(true);
    s.busy = false;
    s.scene.restart({ area: 'LVL-13', room: i });
    await new Promise((r) => setTimeout(r, 900));
    if (g) window.__game.scene.getScene('Game').player.unlockGlide();
  }, [room, pano]);
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
  await page.waitForTimeout(500);
};
const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('·', name); };

// 1. a beira: o abismo sem fundo, as estacas e a boca do poço que o jogador ainda não entende
await go(0);
await place(9 * 64, 448);
await shot('L13-01-beira-do-abismo');

// 2. a queda: a beirada que acaba, a corda que não chegou e o vão como saída
await go(1);
await place(22 * 64, 448);
await shot('L13-02-a-queda');

// 3. o fundo do poço: e o fundo **ainda tem fundo**
await go(2);
await place(12 * 64, 448);
await shot('L13-03-fundo-do-poco');

// 4. as duas correntes: idênticas, 12 tiles de distância, dois alçapões
await go(3);
await page.waitForTimeout(2000);
await place(14 * 64, 448);
await shot('L13-04-boca-do-vento');

// 5. a subida: dentro da coluna, pano aberto, 140 px/s
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const u = s.built.updrafts[1];
  const x = u.x + u.width / 2;
  s.player.setPosition(x, 6 * 64 - 6);
  s.player.body.reset(x, 6 * 64 - 6);
  await new Promise((r) => setTimeout(r, 200));
  s.virtuais.add('pular');
  s.player.body.setVelocityY(-560);
});
await page.waitForTimeout(1100);
await shot('L13-05-subindo-na-corrente');
await page.evaluate(() => { window.__game.scene.getScene('Game').virtuais.delete('pular'); });

// 6. a beira alta: o respiro sem grade e sem conferência
await go(4);
await place(10 * 64, 448);
await shot('L13-06-beira-alta');

// 7. a boca do abismo: o fecho do Ato III
await go(5);
await place(8 * 64, 448);
await shot('L13-07-boca-do-abismo');

// 8. o eco: a silhueta de 700 ms atrás, com 30% de opacidade
await go(0);
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(10 * 64, 448);
  s.player.body.reset(10 * 64, 448);
  await new Promise((r) => setTimeout(r, 900));
  s.player.setPosition(13 * 64, 448);
  s.player.body.reset(13 * 64, 448);
});
await page.waitForTimeout(250);
await shot('L13-08-o-eco');

console.log('erros:', errors.length ? errors : 'nenhum');
await browser.close();
process.exit(errors.length ? 1 : 0);
