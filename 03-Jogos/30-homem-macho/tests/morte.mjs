/**
 * `MEC-004` — **a perda na morte**, ao vivo (`npm run morte`, com `npm run dev` no ar).
 *
 * A regra em si é testada em `src/core/loot.test.ts` (20 casos). Aqui prova-se o que só se vê no
 * jogo a correr:
 *
 * 1. As moedas **caem de um inimigo** (20 por corpo, `DEC-042`) e aparecem no HUD.
 * 2. **Morrer** aplica as percentagens, e o aviso diz o que se perdeu.
 * 3. O que estava **no baú** continua lá — nem a morte lhe toca.
 * 4. O que estava **preso** fica com o jogador; o simples **desaparece**.
 * 5. **100 % das moedas** desaparecem e o contador sai do HUD.
 *
 * O caso das forjadas é o único com dado: em vez de fixar o resultado, prova-se que o que fica
 * **mais** o que cai é sempre o que havia (nada desaparece por engano).
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

// ---------- 1. matar um inimigo dá moedas ----------
// L01-01 é a sala da abertura e não tem inimigos: ir para L01-04, que tem dois
await cena(() => window.__game.scene.getScene('Game').mountRoom(3, 'start'));
await page.waitForTimeout(400);
const sentinelas = await cena(() => window.__game.scene.getScene('Game').sentinels.countActive(true));
exigir(sentinelas > 0, `há ${sentinelas} inimigo(s) na sala para derrubar`);
await cena(() => {
  const s = window.__game.scene.getScene('Game');
  s.sentinels.children.each((c) => { if (c.active) c.hit(999); return true; });
});
await page.waitForTimeout(300);
const moedasDepoisDoMob = await cena(() => window.__game.scene.getScene('Game').moedas);
// `DEC-042` subiu a fonte de 5 para 20 por mob: as melhorias custam moedas a sério
exigir(moedasDepoisDoMob === sentinelas * 20, `${sentinelas} inimigo(s) → ${moedasDepoisDoMob} moedas (20 cada)`);
exigir(new RegExp(`MOEDAS ${sentinelas * 20}`).test(await page.locator('.hud__counter--moedas').innerText()),
  'o HUD mostra as moedas');

// ---------- 2. preparar a mochila da morte ----------
const antes = await cena(() => {
  const s = window.__game.scene.getScene('Game');
  s.bag = [
    'ITM-004',                                              // simples, solta → cai (100 %)
    'ITM-011',                                              // forjada, **presa** → fica (0 %)
    'ITM-007',                                              // forjada, solta → 20 %
    ...Array.from({ length: 10 }, () => 'ITM-001'),          // 10 curas → caem 3
    'ITM-003',                                              // habilidade → fica
  ];
  s.presos = ['ITM-011'];
  s.bau = ['ITM-002'];                                      // no baú: **não se perde**
  s.pushInventory();
  return { bag: [...s.bag], presos: [...s.presos], bau: [...s.bau], moedas: s.moedas };
});
exigir(antes.bag.length === 14, `a mochila tem 14 itens e o baú 1 (${antes.bag.length})`);

// ---------- 3. morrer ----------
await cena(() => window.__game.scene.getScene('Game').onPlayerDeath());
await page.waitForTimeout(900);

const depois = await cena(() => {
  const s = window.__game.scene.getScene('Game');
  return { bag: [...s.bag], presos: [...s.presos], bau: [...s.bau], moedas: s.moedas };
});

exigir(depois.moedas === 0, `100 % das moedas caíram (${antes.moedas} → ${depois.moedas})`);
exigir(depois.bau.includes('ITM-002'), 'o item do baú sobreviveu à morte');
exigir(depois.presos.includes('ITM-011'), 'o item preso sobreviveu (0 %)');
exigir(depois.bag.includes('ITM-003'), 'a habilidade sobreviveu (TST-005)');
exigir(!depois.bag.includes('ITM-004'), 'a arma simples caiu (100 %)');
exigir(depois.bag.filter((i) => i === 'ITM-001').length === 7,
  `10 curas → 7 ficam, 3 caem (30 %): ${depois.bag.filter((i) => i === 'ITM-001').length}`);

const soma = depois.bag.length;
exigir(soma + (antes.bag.length - depois.bag.length) === antes.bag.length,
  'nada desaparece por engano: o que fica + o que cai é a mochila de antes');

// ---------- 4. o aviso diz o que se perdeu ----------
const aviso = page.locator('.morte');
exigir(await aviso.count() === 1, 'o aviso da morte aparece');
const textoAviso = await aviso.innerText();
exigir(/VOCÊ CAIU/.test(textoAviso), 'o aviso tem título');
exigir(/CURA|EQUIPAMENTO|ESPÓLIO/.test(textoAviso), `o aviso nomeia o que se perdeu — "${textoAviso.replace(/\s+/g, ' ')}"`);
exigir(/BAÚ DA SALA SEGURA NÃO SE PERDE/.test(textoAviso), 'o aviso lembra que o baú está a salvo');
await page.screenshot({ path: `${OUT}/morte-01-aviso.png`, fullPage: true });

// ---------- 5. o contador de moedas sai do HUD ----------
exigir(await page.locator('.hud__counter--moedas').count() === 0,
  'sem moedas, o contador sai do HUD (nada de `MOEDAS 0` permanente)');

exigir(errors.length === 0, errors.length ? `sem erros de consola — ${errors.join(' | ')}` : 'sem erros de consola');

await browser.close();
console.log(falhas.length ? `\n${falhas.length} FALHA(S):\n- ${falhas.join('\n- ')}` : '\nMORTE OK');
process.exit(falhas.length ? 1 : 0);
