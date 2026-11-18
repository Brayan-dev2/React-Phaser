/** Capturas de LVL-16 (`[PÓS]`) — `node tests/shots16.mjs`. O último setor do jogo. */
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
    s.scene.restart({ area: 'LVL-16', room: i });
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
/**
 * Nas capturas da arena o desgaste fica **desligado**: com ele ligado o jogador parado cai no
 * buraco em 2 s e volta para a entrada — e a foto sairia do outro lado da sala. `verify`
 * (`tests/lvl16.mjs`) é quem prova que o chão cede, não a captura.
 */
const limparPiso = async () => {
  await page.evaluate(() => {
    const s = window.__game.scene.getScene('Game');
    s.built.desgaste = false;
    s.stillMs = 0;
    s.canalMs = 0;
    s.holeTiles = new Set();
    s.holeSprites.forEach((h) => h.destroy());
    s.holeSprites = [];
    s.crackSprite?.destroy();
    s.crackSprite = undefined;
  });
  await page.waitForTimeout(150);
};

// 1. o patamar: a primeira placa que fala do futuro do jogador
await go(0);
await place(7 * 64, 448);
await shot('L16-01-patamar');

// 2. a fila: seis cadeiras, a senha `000` e quem ainda está esperando
await go(1);
await place(9 * 64, 448);
await shot('L16-02-a-fila');

// 3. a antecâmara: o formulário que ensina a não matar
await go(2);
await place(8 * 64, 448);
await shot('L16-03-antecamara');

// 4. a arena: o homem **em cima do posto**, a grade fechada e a luz de vinho
await go(3);
await place(17 * 64, 448);
await page.waitForTimeout(1800);   // o aviso do desgaste sai antes da foto
await limparPiso();
await shot('L16-04-o-posto');

// 5. o atordoamento: ele cambaleia para leste e o posto fica alcançável (`MEC-011`)
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const c = s.plantonista;
  c.poise = 25;
  c.takeGolpe(s.time.now);
  await new Promise((r) => setTimeout(r, 500));
});
await place(18 * 64, 448);
await page.waitForTimeout(1800);
await limparPiso();
await shot('L16-05-atordoado');

// 6. a parede dos crachás: quarenta nomes e o prego vazio
await go(4);
await place(8 * 64, 448);
await shot('L16-06-parede-dos-crachas');

// 7. o assento: o trono partido, a varanda — e o fim
await go(5);
await place(12 * 64, 448);
await page.waitForTimeout(1600);
await shot('L16-07-o-assento');

// 8. o fim: `MEC-012` — o crachá de 3 linhas e a última fala do jogo
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(s.built.throne.x - 30, 448);
  s.player.body.reset(s.built.throne.x - 30, 448);
  await new Promise((r) => setTimeout(r, 300));
  s.tryThrone();
  await new Promise((r) => setTimeout(r, 900));
});
await shot('L16-08-o-cracha');

console.log('erros:', errors.length ? errors : 'nenhum');
await browser.close();
process.exit(errors.length ? 1 : 0);
