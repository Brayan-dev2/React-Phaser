/**
 * `UI-07` — o **baú da sala segura**, ao vivo (`npm run bau`, com `npm run dev` no ar).
 *
 * Prova o que os testes puros não alcançam:
 *
 * 1. O baú **existe na sala** (é um objeto ao lado do pilar, não um menu).
 * 2. Só abre com o herói ao lado — longe, o painel diz que não há baú.
 * 3. `E` no baú abre a mochila; `E` no pilar **salva** (o `E` antigo não mudou de sentido).
 * 4. Guardar tira da mochila e põe no baú, e **grava o save** — o item aparece em
 *    `homem-macho/save/v1/slot-N` no `localStorage`.
 * 5. Tirar devolve o item à mochila.
 * 6. O baú é **um só**: o que se guarda em L01-05 está lá na segunda sala segura visitada.
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

const cena = () => window.__game.scene.getScene('Game');
const painel = page.locator('[aria-label="Mochila"]');
const bauSecao = page.locator('.bau');

// ---------- 1. o baú não existe longe de uma sala segura (L01-01) ----------
const salaInicial = await page.evaluate(() => window.__game.scene.getScene('Game').current.id);
exigir(salaInicial === 'L01-01', `a partida começa em L01-01 (${salaInicial})`);
exigir(await page.evaluate(() => window.__game.scene.getScene('Game').bauSprites.length) === 0,
  'L01-01 não tem baú (não é sala segura)');

// ---------- 2. ir para a sala segura (L01-05) ----------
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.mountRoom(4, 'start');
});
await page.waitForTimeout(400);
const sala = await page.evaluate(() => window.__game.scene.getScene('Game').current.id);
exigir(sala === 'L01-05', `a sala segura monta (${sala})`);
exigir(await page.evaluate(() => window.__game.scene.getScene('Game').bauSprites.length) === 1,
  'a sala segura tem 1 baú desenhado');
await page.screenshot({ path: `${OUT}/bau-01-na-sala.png`, fullPage: true });

// ---------- 3. longe do baú, o painel diz que não há ----------
await page.keyboard.press('KeyI');
await painel.waitFor({ state: 'visible', timeout: 3000 });
exigir(await bauSecao.count() === 0, 'longe do baú, o painel não mostra a secção do baú');
exigir(/BAÚ SÓ ABRE JUNTO/.test(await page.locator('.mochila__nota').innerText()),
  'o painel diz que o baú só abre junto de um ponto de salvamento');
await page.keyboard.press('Escape');
await painel.waitFor({ state: 'hidden', timeout: 3000 });

// ---------- 4. `E` no pilar salva; `E` no baú abre ----------
const irPara = (dx) => page.evaluate((d) => {
  const s = window.__game.scene.getScene('Game');
  const b = s.bauSprites[0];
  const alvo = s.built.saves[0];
  s.player.setPosition((d === 0 ? b.x : alvo.x), alvo.y - 60);
  s.player.body.reset((d === 0 ? b.x : alvo.x), alvo.y - 60);
  return { noBau: s.bauSprites.length };
}, dx);

await irPara(0);
await page.waitForTimeout(250);
exigir(await page.evaluate(() => window.__game.scene.getScene('Game').bauDisponivel),
  'ao lado do baú, a cena diz que ele está disponível');

await page.keyboard.press('KeyE');
await painel.waitFor({ state: 'visible', timeout: 3000 });
exigir(await bauSecao.count() === 1, 'E no baú abre a mochila com a secção do baú');
exigir(/BAÚ · SALA SEGURA/.test(await page.locator('.bau__marca').innerText()), 'a secção diz que é o baú da sala segura');

// ---------- 5. guardar: item sai da mochila, entra no baú e vai para o save ----------
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.bag = ['ITM-004'];
  s.presos = ['ITM-004'];
  s.pushInventory();
});
await page.waitForTimeout(150);
exigir(/EQUIPAMENTO DE TESTE/.test(await page.locator('.mochila__nome').first().innerText()),
  'o item está na mochila antes de guardar');
exigir(/PRESO/.test(await page.locator('.mochila__etiqueta').first().innerText()), 'e está PRESO');

await page.getByRole('button', { name: 'GUARDAR NO BAÚ', exact: true }).click();
await page.waitForFunction(() => window.__game.scene.getScene('Game').bau.length === 1, null, { timeout: 3000 });
const depoisDeGuardar = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return { bau: [...s.bau], bag: [...s.bag], presos: [...s.presos] };
});
exigir(depoisDeGuardar.bau.length === 1 && depoisDeGuardar.bag.length === 0,
  'guardar tira da mochila e põe no baú');
exigir(depoisDeGuardar.presos.length === 0, 'ao entrar no baú, o item deixa de estar preso');
await page.screenshot({ path: `${OUT}/bau-02-guardado.png`, fullPage: true });

const noSave = await page.evaluate(() => {
  for (let i = 1; i <= 3; i++) {
    const raw = localStorage.getItem(`homem-macho/save/v1/slot-${i}`);
    if (!raw) continue;
    const env = JSON.parse(raw);
    if (env?.progress?.bau?.length) return { slot: i, bau: env.progress.bau };
  }
  return null;
});
exigir(!!noSave && noSave.bau.includes('ITM-004'),
  `o baú foi gravado no save (${noSave ? `slot ${noSave.slot}: ${noSave.bau.join(',')}` : 'nada gravado'})`);

// ---------- 6. tirar: volta para a mochila ----------
await page.locator('.bau__linha [role="gridcell"]').first().click();
await page.getByRole('button', { name: 'TIRAR PARA A MOCHILA', exact: true }).click();
await page.waitForFunction(() => window.__game.scene.getScene('Game').bau.length === 0, null, { timeout: 3000 });
exigir(await page.evaluate(() => window.__game.scene.getScene('Game').bag.length) === 1,
  'tirar do baú devolve o item à mochila');

// ---------- 7. um só baú: o conteúdo é o mesmo na sala seguinte ----------
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.bau = ['ITM-007'];
  s.pushBau();
});
await page.keyboard.press('Escape');
await painel.waitFor({ state: 'hidden', timeout: 3000 });
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.mountRoom(3, 'start'); // L01-04, não segura
});
await page.waitForTimeout(200);
exigir(await page.evaluate(() => window.__game.scene.getScene('Game').bauSprites.length) === 0,
  'L01-04 não é sala segura: não tem baú');
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.mountRoom(4, 'start'); // de volta a L01-05
});
await page.waitForTimeout(200);
const baúDepois = await page.evaluate(() => [...window.__game.scene.getScene('Game').bau]);
exigir(baúDepois.includes('ITM-007'), 'o baú sobrevive à troca de sala (é a mesma lista)');

// ---------- 8. `E` no pilar continua a salvar ----------
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  const alvo = s.built.saves[0];
  // do lado oposto ao baú: o pilar
  s.player.setPosition(alvo.x - 100, alvo.y - 60);
  s.player.body.reset(alvo.x - 100, alvo.y - 60);
});
await page.waitForTimeout(250);
exigir(!(await page.evaluate(() => window.__game.scene.getScene('Game').bauDisponivel)),
  'a 100 px do baú ele deixa de estar disponível');
const antesDoSave = await page.evaluate(() => {
  const raw = localStorage.getItem('homem-macho/save/v1/slot-1');
  return raw ? JSON.parse(raw).revision : 0;
});
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  const alvo = s.built.saves[0];
  s.player.setPosition(alvo.x, alvo.y - 60);
  s.player.body.reset(alvo.x, alvo.y - 60);
});
await page.waitForTimeout(200);
await page.keyboard.press('KeyE');
await page.waitForTimeout(600);
const depoisDoSave = await page.evaluate(() => {
  const raw = localStorage.getItem('homem-macho/save/v1/slot-1');
  return raw ? JSON.parse(raw).revision : 0;
});
exigir(depoisDoSave > antesDoSave, `E no pilar grava (revisão ${antesDoSave} → ${depoisDoSave})`);
exigir(await painel.count() === 0 || !(await painel.isVisible()), 'E no pilar não abre a mochila');

exigir(errors.length === 0, errors.length ? `sem erros de consola — ${errors.join(' | ')}` : 'sem erros de consola');

await browser.close();
console.log(falhas.length ? `\n${falhas.length} FALHA(S):\n- ${falhas.join('\n- ')}` : '\nBAÚ OK');
process.exit(falhas.length ? 1 : 0);
