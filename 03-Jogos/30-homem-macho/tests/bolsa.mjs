/**
 * `MEC-004` / `DEC-038` — a **bolsa da morte** ao vivo (`npm run bolsa`, com `npm run dev` no ar).
 *
 * O que se prova aqui, e que a regra pura não alcança:
 *
 * 1. Morrer deixa uma bolsa **no sítio da morte**, com o que se perdeu e as moedas.
 * 2. O HUD diz onde ela está, e diz quando é **nesta sala**.
 * 3. `E` em cima dela **recupera**: os itens voltam à mochila e as moedas ao HUD.
 * 4. Morrer outra vez **sem** a recuperar destrói a anterior (itens e moedas perdidos) e deixa
 *    uma nova.
 * 5. Os **tetos** (vida, escudo, poder) não regridem com a morte.
 * 6. A bolsa **fica no save** — recuperável depois de fechar o jogo.
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

const cena = (fn, arg) => page.evaluate(fn, arg);
const estado = () => cena(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    bag: [...s.bag], presos: [...s.presos], moedas: s.moedas,
    bolsa: s.bolsaMorte ? JSON.parse(JSON.stringify(s.bolsaMorte)) : null,
    naSala: s.bolsaNaSala, sala: s.current.id,
    tetos: { hp: s.permanentes.hp, shield: s.permanentes.shield, power: s.permanentes.power },
    habilidades: [...s.permanentes.habilidades],
  };
});

// ---------- 0. ponto de partida: HUD sem bolsa ----------
exigir(await page.locator('.hud__counter--bolsa').count() === 0, 'sem bolsa, o HUD não mostra marcador');

// ---------- 1. primeira morte: deixa bolsa ----------
await cena(() => {
  const s = window.__game.scene.getScene('Game');
  s.bag = ['ITM-004', ...Array.from({ length: 10 }, () => 'ITM-001')]; // 1 simples + 10 curas
  s.presos = [];
  s.moedas = 40;
  s.pushInventory();
  s.permanentes = { ...s.permanentes, hp: 140 };   // teto conquistado, para provar que não regride
});
await page.waitForTimeout(150);

await cena(() => window.__game.scene.getScene('Game').onPlayerDeath());
// esperar o respawn (o `delayedCall` de 760 ms) em vez de dormir: o relógio do jogo é o juiz
await page.waitForFunction(() => window.__game.scene.getScene('Game').busy === false, null, { timeout: 8000 });

const a = await estado();
exigir(!!a.bolsa, 'a morte deixou uma bolsa');
exigir(a.bolsa.itens.includes('ITM-004'), 'a arma simples perdida está na bolsa');
exigir(a.bolsa.itens.filter((i) => i === 'ITM-001').length === 3, `3 curas caíram para a bolsa (${a.bolsa.itens.filter((i) => i === 'ITM-001').length})`);
exigir(a.bolsa.moedas === 40, `as 40 moedas estão na bolsa (${a.bolsa.moedas})`);
exigir(a.moedas === 0, 'a carteira ficou a zero');
exigir(a.bolsa.local.sala === a.sala, `a bolsa ficou na sala onde morreu (${a.bolsa.local.sala})`);
exigir(a.naSala, 'a cena reconhece que a bolsa está nesta sala');
exigir(a.tetos.hp === 140, `o teto de vida conquistado não regrediu (${a.tetos.hp})`);

const marcador = await page.locator('.hud__counter--bolsa').innerText();
exigir(/BOLSA · L01-0\d/.test(marcador), `o HUD diz onde está a bolsa — "${marcador}"`);
exigir(/▸/.test(marcador), 'o marcador está assinalado como "nesta sala"');
await page.screenshot({ path: `${OUT}/bolsa-01-no-chao.png`, fullPage: true });

await page.waitForTimeout(250);
const noSave = await cena(() => {
  for (let i = 1; i <= 3; i++) {
    const raw = localStorage.getItem(`homem-macho/save/v1/slot-${i}`);
    if (!raw) continue;
    const env = JSON.parse(raw);
    if (env?.progress?.bolsaMorte) return env.progress.bolsaMorte;
  }
  return null;
});
exigir(!!noSave && noSave.moedas === 40, 'a bolsa ficou gravada no save');

// ---------- 2. recuperar: `E` em cima dela ----------
await cena(() => {
  const s = window.__game.scene.getScene('Game');
  const b = s.bolsaSprite;
  s.player.setPosition(b.x, b.y);
  s.player.body.reset(b.x, b.y);
});
await page.waitForTimeout(250);
await page.keyboard.press('KeyE');
await page.waitForTimeout(700);

const r = await estado();
exigir(r.bolsa === null, 'a bolsa desapareceu depois de recuperada');
exigir(r.bag.includes('ITM-004'), 'a arma simples voltou à mochila');
exigir(r.bag.filter((i) => i === 'ITM-001').length === 10, `as 10 curas voltaram (${r.bag.filter((i) => i === 'ITM-001').length})`);
exigir(r.moedas === 40, `as moedas voltaram ao HUD (${r.moedas})`);
exigir(await page.locator('.hud__counter--bolsa').count() === 0, 'o marcador sai do HUD');
exigir(r.tetos.hp === 140, 'o teto continua nos 140 depois de recuperar');

// ---------- 3. segunda morte sem recuperar: a anterior é destruída ----------
await cena(() => {
  const s = window.__game.scene.getScene('Game');
  s.bag = ['ITM-004'];
  s.moedas = 15;
  s.pushInventory();
});
await page.waitForTimeout(150);
await cena(() => window.__game.scene.getScene('Game').onPlayerDeath());
await page.waitForTimeout(1200);
const primeira = await estado();
exigir(!!primeira.bolsa && primeira.bolsa.moedas === 15, 'a segunda morte deixa uma bolsa nova');

// enche a mochila para não valer nada e morre outra vez sem recuperar
await cena(() => {
  const s = window.__game.scene.getScene('Game');
  s.moedas = 7;
  s.bag = ['ITM-004'];
  s.pushInventory();
});
await page.waitForTimeout(150);
await cena(() => window.__game.scene.getScene('Game').onPlayerDeath());
await page.waitForTimeout(1200);
const terceira = await estado();
exigir(!!terceira.bolsa && terceira.bolsa.moedas === 7,
  'a bolsa nova tem só o da última morte — a anterior foi destruída');
exigir(!terceira.bolsa.itens.includes('ITM-001'), 'nada da bolsa anterior sobreviveu');

const aviso = await page.locator('.morte').innerText();
exigir(/BOLSA ANTERIOR FOI DESTRUÍDA/.test(aviso), 'o aviso diz que a bolsa anterior se perdeu');

// ---------- 4. as barras voltam cheias, no teto conquistado ----------
const barras = await cena(() => {
  const s = window.__game.scene.getScene('Game');
  return { hp: s.player.resources.hp, shield: s.player.resources.shield, cap: s.permanentes.hp };
});
exigir(barras.hp === barras.cap, `as barras voltam cheias no teto conquistado (${barras.hp} / ${barras.cap})`);
exigir(barras.shield === 50, `o escudo volta cheio (${barras.shield})`);

exigir(errors.length === 0, errors.length ? `sem erros de consola — ${errors.join(' | ')}` : 'sem erros de consola');

await browser.close();
console.log(falhas.length ? `\n${falhas.length} FALHA(S):\n- ${falhas.join('\n- ')}` : '\nBOLSA OK');
process.exit(falhas.length ? 1 : 0);
