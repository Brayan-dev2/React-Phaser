/** Capturas de LVL-03 (`npm run dev` no ar → `node tests/shots03.mjs`). */
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
  await page.evaluate((i) => window.__game.scene.getScene('Game').scene.restart({ area: 'LVL-03', room: i }), room);
  await page.waitForTimeout(1200);
};
const shot = async (name) => {
  const t = await page.evaluate(() => document.querySelector('.toast')?.textContent ?? null);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('·', name, t ? `(toast: ${t})` : '');
};

// 1. entrada da arena: hold + nome do chefe + barra de vida (VIS-007)
await goto(1);
await page.waitForTimeout(400);
await shot('L03-02-entrada');
await page.waitForTimeout(1800);
await shot('L03-02-arena');

// 2. pilar destruído → aturdimento (ATK-03)
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.boss.setPosition(13 * 64, 7 * 64);
  s.boss.state = 'investida';
  s.bossHitsPillar(s.boss, s.built.pillars[0].zones[0]);
});
await page.waitForTimeout(300);
await shot('L03-02-pilar');

// 3. fase 2
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.boss.takeHit(110);
});
await page.waitForTimeout(320);
await shot('L03-02-fase2');

// 4. ITM-004 na sala seguinte
await goto(2);
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  const item = s.built.items.find((i) => i.id === 'ITM-004');
  s.player.setPosition(item.x, item.y - 40);
});
await page.waitForTimeout(700);
await shot('L03-03-item');

// 5. relatório de sessão no painel de fim (playtest, P-29) — com uma luta registrada
await goto(1);
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  await new Promise((r) => setTimeout(r, 800));     // deixa a luta rodar um pouco
  s.boss.takeHit(999);
});
await page.waitForTimeout(2600);                    // morte do chefe + saída destrancada
// atravessa L03-02 → L03-03 → L03-04 sem reiniciar a cena (mantém a sessão viva)
for (const sala of [1, 2]) {
  await page.evaluate((i) => {
    const s = window.__game.scene.getScene('Game');
    s.player.setPosition(s.built.worldWidth - 20, 6 * 64);
    void i;
  }, sala);
  await page.waitForTimeout(1400);
}
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(s.built.worldWidth - 20, 6 * 64);
});
await page.waitForTimeout(1600);
await shot('L03-05-relatorio');

// 6. conclusão do recorte (`UI-10`)
await goto(3);
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(s.built.worldWidth - 20, 6 * 64);
});
await page.waitForTimeout(1400);
await shot('L03-04-conclusao');

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
