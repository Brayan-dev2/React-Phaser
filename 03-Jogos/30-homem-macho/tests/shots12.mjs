/** Capturas de LVL-12 (`[PÓS]`) — `node tests/shots12.mjs`. */
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
    s.player?.releaseGlide?.();
    s.busy = false;
    s.scene.restart({ area: 'LVL-12', room: i });
    await new Promise((r) => setTimeout(r, 900));
  }, room);
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

// 1. o conduto: o primeiro calor do setor, o forno e a boca da calha em (17,6)
await go(0);
await place(12 * 64, 448);
await shot('L12-01-conduto');

// 2. a fundição: três fornos acesos e nenhum operário
await go(1);
await place(13 * 64, 448);
await shot('L12-02-fundicao');

// 3. a esteira: a revelação — as Sentinelas saem de cima dela (§4.3)
await go(2);
await place(12 * 64, 448);
await shot('L12-03-esteira');

// 4. a bigorna: o último lugar calmo, com save e sem inimigo
await go(3);
await place(10 * 64, 448);
await shot('L12-04-bigorna');

// 5. a arena: o Forjador trabalhando, os dois pilões e nenhuma grade (§8)
await go(4);
await page.waitForTimeout(2600);          // deixa o hold de `VIS-007` fechar
await place(11 * 64, 448);
await shot('L12-05-arena-forjador');

// 6. a arena em fase 2: corrente nas duas mãos, pilões em 4,5 s (§5.5)
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  const f = s.forjador;
  f.hp = 140;
  f.takeHit(20);                          // 140 → 120: cruza o limiar de 130
});
await page.waitForTimeout(700);
await place(11 * 64, 448);
await shot('L12-05-arena-fase-2');

// 7. a peça em brasa no ar (`ATK-11`) — a resposta é lateral, não salto
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.forjador.attack = 'ATK-11';
  s.forjador.enterState('golpe', s.time.now);
});
await page.waitForTimeout(180);
await shot('L12-06-peca-em-brasa');

// 8. o poço: save, recompensa condicional, calha e o marco da escória
await go(5);
await place(10 * 64, 448);
await shot('L12-07-poco-de-forja');

console.log('erros:', errors.length ? errors : 'nenhum');
await browser.close();
process.exit(errors.length ? 1 : 0);
