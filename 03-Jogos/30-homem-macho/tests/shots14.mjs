/** Capturas de LVL-14 (`[PÓS]`) — `node tests/shots14.mjs`. */
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

const go = async (room, chaves = 2) => {
  await page.evaluate(async ([i, n]) => {
    const s = window.__game.scene.getScene('Game');
    s.player?.releaseHook?.();
    s.player?.releaseClimb?.();
    s.player.gliding = false;
    s.player.body.setAllowGravity(true);
    s.busy = false;
    s.collected = ['ITM-004', 'ITM-007', 'ITM-011'].slice(0, n);
    s.scene.restart({ area: 'LVL-14', room: i });
    await new Promise((r) => setTimeout(r, 900));
  }, [room, chaves]);
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

// 1. a muralha: o lado de fora da fortaleza, sob o eclipse que já corre
await go(0);
await place(8 * 64, 448);
await shot('L14-01-muralha-norte');

// 2. a praça: capacidade 600, presentes 0
await go(1);
await place(10 * 64, 448);
await shot('L14-02-praca-de-armas');

// 3. o estandarte: 2 tiles, o maior do jogo, e a Sentinela de frente para ele
await go(2);
await place(11 * 64, 448);
await shot('L14-03-o-estandarte-negro');

// 4. a antessala: a sala de espera, e a placa mais curta do setor
await go(3);
await place(8 * 64, 448);
await shot('L14-04-antessala-do-comando');

// 5. a arena na luz: ele no posto, a grade fechada
await go(4);
await place(4 * 64, 448);
await page.waitForTimeout(1200);
await shot('L14-05-arena-na-luz');

// 6. a sombra: o céu cobre e ele passa a ter outra arma
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.skyStart = performance.now() - 5600;
});
await page.waitForTimeout(700);
await shot('L14-06-arena-na-sombra');

// 7. a lança no ar: 900 ms de voo, dá para ver chegando
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const c = s.comandante;
  s.ComandanteSalvo = c;
  for (let i = 0; i < 60 && !c.spear; i++) await new Promise((r) => setTimeout(r, 50));
});
await shot('L14-07-a-lanca-no-ar');

// 8. o portão: duas fechaduras lado a lado e o contador 2 / 2
await go(5);
await place(13 * 64, 448);
await shot('L14-08-portao-duas-chaves');

// 9. a sobra: 3 / 2 é o que o jogador que lutou em LVL-12 carrega
await go(5, 3);
await place(13 * 64, 448);
await page.waitForTimeout(300);
await shot('L14-09-a-sobra-3-2');

console.log('erros:', errors.length ? errors : 'nenhum');
await browser.close();
process.exit(errors.length ? 1 : 0);
