/**
 * `UI-13` — a introdução, no browser a sério (`npm run historia`).
 *
 * O que este ficheiro prova, e que os testes puros não podem provar:
 *
 * 1. **A introdução aparece depois da criação do personagem e antes do jogo** — e enquanto está no
 *    ecrã não há `canvas` nenhum (`§4.4`: o jogo só monta quando o jogador entra).
 * 2. **`Enter` avança um quadro de cada vez**, e `←` volta — sem `Enter` duplo (o bug clássico de
 *    dois ouvintes de teclado).
 * 3. **`S` salta** e a partida começa com o herói que o jogador criou (nada se perde no caminho).
 * 4. **A área da arte está reservada** e não finge ser arte.
 *
 * Uso: `node tests/historia.mjs` (precisa de `npm run dev` a correr em `:5173`).
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:5173/';
const CAPTURAS = 'docs/capturas';
await mkdir(CAPTURAS, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', (e) => erros.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });

const report = {};

const tela = () => page.evaluate(() => {
  const h = document.querySelector('.historia');
  return h ? {
    migalha: h.querySelector('.historia__migalha')?.textContent ?? null,
    titulo: h.querySelector('.historia__titulo')?.textContent ?? null,
    linhas: [...h.querySelectorAll('.historia__linha')].map((p) => p.textContent),
    quadro: h.getAttribute('data-quadro'),
    canvas: document.querySelectorAll('canvas').length,
    etiquetaArte: h.querySelector('.historia__arte-etiqueta')?.textContent ?? null,
    focados: [...h.querySelectorAll('button')].map((b) => `${b.textContent}:${b.disabled}`),
  } : null;
});

// --- chegar à introdução: título → JOGAR → dificuldade → personagem → introdução ---
await page.addInitScript(() => { try { localStorage.clear(); } catch { /* sem storage */ } });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('.menu', { timeout: 20000 });
await page.waitForTimeout(700);
await page.keyboard.press('Enter');                 // dispensa o título
await page.waitForTimeout(250);
await page.keyboard.press('ArrowDown');             // JOGAR
await page.keyboard.press('Enter');                 // abre a dificuldade
await page.waitForTimeout(250);
await page.keyboard.press('Enter');                 // COMEÇAR → criação de personagem
await page.waitForTimeout(400);
await page.fill('#pers-nome', '');                  // uma marca para reconhecer o herói depois
await page.keyboard.type('Ana');
await page.waitForTimeout(200);
await page.keyboard.press('ArrowDown');             // sai do NOME (e o campo perde o foco)
await page.keyboard.press('Enter');                 // → introdução
await page.waitForSelector('.historia', { timeout: 8000 });
await page.waitForTimeout(300);

report.abertura = {
  ...(await tela()),
  esperado: 'quadro 1 de 5 · O VÉU · 0 canvas · área da arte marcada como reservada',
};
await page.screenshot({ path: `${CAPTURAS}/INTRO-01-veu.png` });

// --- `Enter` avança um de cada vez e `←` volta ---
await page.keyboard.press('Enter');
await page.waitForTimeout(220);
const segundo = await tela();
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(220);
const voltou = await tela();
await page.keyboard.press('Enter');
await page.waitForTimeout(220);
report.avancarEVoltar = {
  segundoQuadro: segundo?.quadro,
  voltouPara: voltou?.quadro,
  esperado: 'queda · veu (o `←` volta sem sair da introdução)',
};

// --- todos os quadros, um a um, com captura ---
const quadros = [];
for (let i = 0; i < 5; i += 1) {
  const t = await tela();
  if (!t) break;
  quadros.push({ migalha: t.migalha, titulo: t.titulo, quadro: t.quadro, canvas: t.canvas });
  // o número do ficheiro é o do próprio quadro (`INTRODUÇÃO · N / 5`), não o da iteração
  const n = Number(t.migalha?.match(/(\d+)\s*\//)?.[1] ?? i + 1);
  await page.screenshot({ path: `${CAPTURAS}/INTRO-0${n}-${t.quadro}.png` });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(260);
}
report.quadros = { lista: quadros, esperado: 'cinco quadros, por esta ordem, sem canvas em nenhum' };

// --- o último `Enter` monta o jogo, com o herói criado ---
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.waitForTimeout(600);
report.entrou = {
  canvas: await page.evaluate(() => document.querySelectorAll('canvas').length),
  historiaSumiu: await page.evaluate(() => !document.querySelector('.historia')),
  personagem: await page.evaluate(
    () => window.__game.scene.getScene('Game').personagem ?? null,
  ),
  esperado: '1 canvas · introdução fora do ecrã · o herói com o nome ANA',
};

// --- `S` salta: a segunda partida nova não obriga a ler outra vez ---
await page.keyboard.press('Escape');                // pausa
await page.waitForTimeout(400);
await page.click('text=SAIR PARA O MENU');
await page.waitForSelector('.menu__acoes', { timeout: 8000 });
await page.waitForTimeout(400);
await page.keyboard.press('ArrowDown');             // CONTINUAR (há save) → JOGAR
await page.keyboard.press('ArrowDown');             // JOGAR
await page.keyboard.press('Enter');                 // dificuldade
await page.waitForTimeout(250);
await page.keyboard.press('Enter');                 // criação de personagem
await page.waitForTimeout(350);
await page.keyboard.press('Enter');                 // → introdução
await page.waitForSelector('.historia', { timeout: 8000 });
const antesDeSaltar = await tela();
await page.keyboard.press('s');
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.waitForTimeout(500);
report.saltar = {
  estavaNoQuadro: antesDeSaltar?.quadro,
  entrou: await page.evaluate(() => window.__game?.scene.isActive('Game') === true),
  esperado: 'veu · true (o `S` no primeiro quadro já entra no jogo)',
};

// --- `CONTINUAR` não passa pela introdução: quem retoma quer a sala onde parou ---
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  await s.persist('manual');
});
await page.waitForTimeout(400);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await page.click('text=SAIR PARA O MENU');
await page.waitForSelector('.menu__acoes', { timeout: 8000 });
await page.waitForTimeout(400);
await page.keyboard.press('ArrowDown');             // CONTINUAR
await page.keyboard.press('Enter');                 // lista de saves
await page.waitForTimeout(300);
await page.keyboard.press('Enter');                 // retoma o slot em foco
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.waitForTimeout(500);
report.continuar = {
  houveIntroducao: await page.evaluate(() => !!document.querySelector('.historia')),
  esperado: 'false — retomar cai direto na sala',
};

report.erros = erros;
console.log(JSON.stringify(report, null, 2));
await browser.close();
