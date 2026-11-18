/** Capturas de LVL-11 (`[PÓS]`) — `node tests/shots11.mjs`. */
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

const go = async (room, estandarte = false) => {
  await page.evaluate(async ([i, g]) => {
    const s = window.__game.scene.getScene('Game');
    s.player?.releaseHook?.();
    s.player?.releaseClimb?.();
    s.player?.releaseGlide?.();
    s.busy = false;
    s.scene.restart({ area: 'LVL-11', room: i });
    await new Promise((r) => setTimeout(r, 900));
    if (g) window.__game.scene.getScene('Game').player.unlockGlide();
  }, [room, estandarte]);
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

// 1. a orla: a estátua sem rosto e a trepadeira onde deveria estar a cara (a imagem do setor)
await go(0);
await place(10 * 64, 448);
await shot('L11-01-orla');

// 2. a estufa: o estandarte no chão, o vão à vista e a trepadeira nas duas beiradas
//    (longe do item de propósito: recolhê-lo abriria o painel e escureceria a captura)
await go(1);
await place(12 * 64, 448);
await shot('L11-02-estufa-estandarte');

// 3. o vão de 11 tiles: o primeiro planeio do jogo, a meio caminho
await go(1, true);
// o painel de texto escurece o ecrã inteiro: deixa o último fechar antes de voar
await page.waitForTimeout(3000);
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(8 * 64 + 24, 6 * 64);
  s.player.body.reset(8 * 64 + 24, 6 * 64);
  s.virtuais.add('direita');
  s.virtuais.add('correr');
  s.virtuais.add('pular');
  s.player.body.setVelocity(308, -560);
});
await page.waitForTimeout(1600);
await shot('L11-03-planeio');
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.virtuais.delete('direita'); s.virtuais.delete('correr'); s.virtuais.delete('pular');
});

// 4. o corredor de cipós: 12 tiles e a Sentinela do outro lado
await go(2, true);
await place(9 * 64, 448);
await shot('L11-04-corredor-cipos');

// 5. o vão de 13 tiles: a trava — o mais largo do jogo, com a flor a estalar no meio
await go(3, true);
await place(12 * 64, 448);
await shot('L11-05-o-vao');

// 6. a chaminé: a boca do conduto e o marco que promete o fundo
await go(4, true);
await place(9 * 64, 448);
await shot('L11-06-chamine');

console.log('erros:', errors.length ? errors : 'nenhum');
await browser.close();
process.exit(errors.length ? 1 : 0);
