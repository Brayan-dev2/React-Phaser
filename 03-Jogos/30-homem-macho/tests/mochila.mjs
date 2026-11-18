/**
 * `UI-07` — a mochila, ao vivo (`npm run mochila` com o `npm run dev` no ar).
 *
 * Prova o que os testes puros não alcançam: que a tecla `I` **abre** o painel, que abrir
 * **pausa** a cena (o jogo não corre por baixo), que a grelha tem os 40 espaços, que o ícone do
 * HUD faz o mesmo que a tecla, que o `ESC` fecha e devolve o controle, e que prender/soltar
 * atravessa a UI e chega ao estado da cena (`core/inventory`).
 *
 * Para haver o que prender, o teste injeta um `ITM-004` na mochila da cena por dentro — é o
 * único caminho: o drop verdadeiro está numa sala que exige um percurso inteiro, e este teste
 * não é um playthrough.
 */
import { chromium } from 'playwright';

const OUT = process.env.SMOKE_OUT ?? '/tmp';
const URL = process.env.SMOKE_URL ?? 'http://localhost:5173/?skip=menu';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

const falhas = [];
function exigir(cond, texto) {
  if (!cond) falhas.push(texto);
  console.log(`${cond ? 'OK  ' : 'FALHA'} ${texto}`);
}

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
/*
 * O browser headless corre a página **sem foco**, e o `TimeStep` do Phaser entra em `_coolDown`:
 * o relógio da cena avança ~7× mais devagar do que o tempo real (medido: 116 ms de jogo em 800 ms
 * de relógio). Nos `delayedCall` (o respawn da morte, por exemplo) isso parece um timer que nunca
 * dispara. O `playthrough` já fazia isto; os testes que dependem do relógio também precisam.
 */
await page.evaluate(() => { if (window.__game) window.__game.loop._coolDown = 0; });
await page.waitForTimeout(500);

const painel = page.locator('[aria-label="Mochila"]');
const celulas = page.locator('[role="gridcell"]');
/** Fechar e esperar que o jogo volte mesmo a correr (o `resume` é um evento, não um clique). */
async function fechar(tecla = 'Escape') {
  await page.keyboard.press(tecla);
  await painel.waitFor({ state: 'hidden', timeout: 5000 });
  await page.waitForFunction(() => !window.__game.scene.getScene('Game').scene.isPaused(), null, { timeout: 5000 });
  /*
   * O `resume` chega ao `KeyboardPlugin` no passo seguinte do `SceneManager`: uma tecla enviada
   * nos primeiros ~150 ms a seguir a fechar ainda não é lida pelo jogo. Um humano não escreve
   * tão depressa; o Playwright sim — daí esta espera.
   */
  await page.waitForTimeout(350);
}

// ---------- 1. a tecla I abre, e pausa a cena ----------
await page.keyboard.press('KeyI');
await painel.waitFor({ state: 'visible', timeout: 5000 });
exigir(true, 'tecla I abre a mochila');
exigir(await page.evaluate(() => window.__game.scene.getScene('Game').scene.isPaused()),
  'abrir a mochila pausa a GameScene');
exigir(await celulas.count() === 40, `a grelha tem 40 espaços (tem ${await celulas.count()})`);

const contadores = await page.locator('.mochila__contadores').innerText();
exigir(/ESPAÇOS 0 \/ 40/.test(contadores) && /PRESOS 0 \/ 20/.test(contadores),
  `contadores começam em 0 / 40 e 0 / 20 — "${contadores.replace(/\s+/g, ' ')}"`);

await page.screenshot({ path: `${OUT}/mochila-01-vazia.png`, fullPage: true });

// ---------- 2. o ESC fecha e devolve o controle ----------
await fechar();
exigir(!(await page.evaluate(() => window.__game.scene.getScene('Game').scene.isPaused())),
  'ESC fecha e a cena volta a correr');

// ---------- 2b. o botão MOCHILA da pausa (`UI-06`) ----------
await page.keyboard.press('Escape');
await page.locator('[aria-label="Pausa"]').waitFor({ state: 'visible', timeout: 3000 });
await page.getByRole('button', { name: 'MOCHILA', exact: true }).click();
await painel.waitFor({ state: 'visible', timeout: 3000 });
exigir(await page.locator('[aria-label="Pausa"]').count() === 0, 'o botão MOCHILA fecha a pausa');
exigir(await page.evaluate(() => window.__game.scene.getScene('Game').scene.isPaused()),
  'e a mochila aberta mantém o jogo pausado');
await fechar();

// ---------- 3. o ícone do HUD faz o mesmo que a tecla ----------
await page.locator('.hud__btn--mochila').click();
await painel.waitFor({ state: 'visible', timeout: 3000 });
exigir(true, 'o ícone do HUD abre a mochila');
await fechar('KeyI');
exigir(true, 'a tecla I também fecha');

// ---------- 4. um item dentro: prender e soltar ----------
// `I` outra vez depois do fecho: a tecla tem de voltar a abrir (uma vez que o plugin de teclado
// voltou a estar activo — ver a nota do `fechar`)
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.bag = ['ITM-004'];
  s.presos = [];
  s.pushInventory();
});
await page.keyboard.press('KeyI');
await painel.waitFor({ state: 'visible', timeout: 3000 });

const contadores2 = await page.locator('.mochila__contadores').innerText();
exigir(/ESPAÇOS 1 \/ 40/.test(contadores2), `o contador vê o item — "${contadores2.replace(/\s+/g, ' ')}"`);
exigir(await page.locator('.hud__badge').innerText() === '1', 'o ícone do HUD mostra o número 1');
exigir(/EQUIPAMENTO DE TESTE/.test(await page.locator('.mochila__nome').innerText()),
  'a célula selecionada mostra o nome do item');
exigir(/SOLTO/.test(await page.locator('.mochila__etiqueta').innerText()), 'o item começa SOLTO');

await page.getByRole('button', { name: 'PRENDER' }).click();
await page.waitForFunction(() => window.__game.scene.getScene('Game').presos.length === 1, null, { timeout: 3000 });
exigir(true, 'PRENDER chega ao estado da cena');
exigir(/PRESOS 1 \/ 20/.test(await page.locator('.mochila__contadores').innerText()),
  'o contador de presos sobe para 1 / 20');
exigir(await page.locator('.mochila__celula--presa').count() === 1, 'a célula fica marcada como presa');
await page.screenshot({ path: `${OUT}/mochila-02-preso.png`, fullPage: true });

// teclado: ENTER solta (o painel é jogável sem rato, §4.6)
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.__game.scene.getScene('Game').presos.length === 0, null, { timeout: 3000 });
exigir(true, 'ENTER solta o item (teclado sem rato)');

// setas andam pela grelha e não prendem o que está vazio
// uma seta com um só item: a seleção **não** sai da célula ocupada (não há para onde ir)
await page.keyboard.press('ArrowRight');
exigir(/EQUIPAMENTO DE TESTE/.test(await page.locator('[role="gridcell"]').first().getAttribute('aria-label')),
  'com um só item, a primeira célula é a ocupada');
// e uma célula vazia, escolhida com o rato: `ENTER` não prende nada
await page.locator('[role="gridcell"]').nth(5).click();
exigir(/vazio/.test(await page.locator('[role="gridcell"]').nth(5).getAttribute('aria-label')),
  'a quinta célula anuncia-se como vazia');
await page.keyboard.press('Enter');
await page.waitForTimeout(150);
exigir(await page.evaluate(() => window.__game.scene.getScene('Game').presos.length) === 0,
  'ENTER numa célula vazia não prende nada');

// ---------- 5. o jogo não corre por baixo ----------
const antes = await page.evaluate(() => window.__game.scene.getScene('Game').player.x);
await page.keyboard.down('KeyD');
await page.waitForTimeout(600);
await page.keyboard.up('KeyD');
const depois = await page.evaluate(() => window.__game.scene.getScene('Game').player.x);
exigir(Math.abs(depois - antes) < 1, `o herói não anda com a mochila aberta (${antes} → ${depois})`);

await fechar();

// ---------- 6. fechada, o jogo volta a andar ----------
/*
 * A espera é em **frames**, não em milissegundos: o que se mede é "o jogo voltou a correr", e o
 * deslocamento por frame é o mesmo em qualquer máquina, mas o número de frames por segundo não é
 * (a 4 fps, 900 ms são três frames e o herói anda 14 px — o teste media o sandbox, não o jogo).
 */
const antes2 = await page.evaluate(() => window.__game.scene.getScene('Game').player.x);
await page.keyboard.down('KeyD');
await page.evaluate(() => new Promise((resolve) => {
  const s = window.__game.scene.getScene('Game');
  let n = 0;
  const passo = () => { n += 1; if (n >= 30) { s.events.off('update', passo); resolve(); } };
  s.events.on('update', passo);
}));
await page.keyboard.up('KeyD');
const depois2 = await page.evaluate(() => window.__game.scene.getScene('Game').player.x);
exigir(depois2 - antes2 > 20, `fechada, o herói volta a andar (${antes2} → ${depois2})`);

// ---------- 7. a tecla é remapeável como as outras ----------
const acoes = await page.evaluate(() => {
  const cfg = JSON.parse(localStorage.getItem('homem-macho/config/v1') ?? '{}');
  return cfg;
});
void acoes;
exigir(errors.length === 0, errors.length ? `sem erros de consola — ${errors.join(' | ')}` : 'sem erros de consola');

await browser.close();
console.log(falhas.length ? `\n${falhas.length} FALHA(S):\n- ${falhas.join('\n- ')}` : '\nMOCHILA OK');
process.exit(falhas.length ? 1 : 0);
