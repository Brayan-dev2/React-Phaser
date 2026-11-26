/**
 * `UI-07` / `DEC-040` — **as ferramentas da mochila e do baú**, ao vivo (`npm run bau-ferramentas`
 * com o `npm run dev` no ar).
 *
 * O que este teste prova e os testes puros não conseguem:
 *
 * 1. **O painel abre em duas metades** — a mochila à esquerda, o baú à direita, cada uma com metade
 *    da tela (medido em pixels, não em classes de CSS).
 * 2. **Ordenar é uma vista** — a grelha muda de ordem e a mochila da cena **não**: se ordenar
 *    mexesse nos dados, a ordem de chegada (a única que diz o que se apanhhou primeiro) perdia-se.
 * 3. **A quantidade atravessa a UI** — `+ +` e `GUARDAR 2` movem dois de três; `TODOS OS IGUAIS`
 *    move o resto.
 * 4. **As moedas têm dono** — guardar no baú tira-as da carteira; retirar devolve-as; guardar tudo
 *    esvazia a carteira; retirar tudo esvazia o baú.
 * 5. **O que está no baú vai para o save** (itens e moedas), porque é a promessa do baú.
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
await page.evaluate(() => { if (window.__game) window.__game.loop._coolDown = 0; });
await page.waitForTimeout(500);

const painel = page.locator('[aria-label="Mochila"]');
const ladoMochila = page.locator('.mochila__lado--mochila');
const ladoBau = page.locator('.mochila__lado--bau');
const estado = () => page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    bag: [...s.bag], bau: [...s.bau], moedas: s.moedas, bauMoedas: s.bauMoedas,
    presos: [...s.presos],
  };
});

// ---------- montagem: a sala segura (L01-05) tem um baú ----------
await page.evaluate(() => window.__game.scene.getScene('Game').mountRoom(4, 'start'));
await page.waitForTimeout(400);

// mesmo caminho que o `npm run bau` usa para chegar ao baú
async function irParaOBau() {
  await page.evaluate(() => {
    const s = window.__game.scene.getScene('Game');
    const b = s.bauSprites[0];
    const alvo = s.built.saves[0];
    s.player.setPosition(b.x, alvo.y - 60);
    s.player.body.reset(b.x, alvo.y - 60);
  });
  await page.waitForTimeout(250);
}
await irParaOBau();
exigir(await page.evaluate(() => window.__game.scene.getScene('Game').bauDisponivel),
  'a sala segura tem um baú e o herói está ao alcance');

await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  // de propósito **fora** da ordem alfabética e com cinco iguais: é o único jeito de o teste
  // ver a ordem mudar e de haver "semelhantes" para passar de uma vez
  s.bag = ['ITM-011', 'ITM-007', 'ITM-004', 'ITM-004', 'ITM-004', 'ITM-004', 'ITM-004'];
  s.presos = ['ITM-004'];
  s.bau = ['ITM-007'];
  // `ganharMoedas` (e não `s.moedas = 40`) porque o HUD só sabe das moedas pelo evento
  s.ganharMoedas(40);
  s.bauMoedas = 5;
  s.pushInventory();
  s.pushBau();
});
await page.waitForTimeout(200);

await page.keyboard.press('KeyI');
await painel.waitFor({ state: 'visible', timeout: 5000 });

// ---------- 1. as duas metades ----------
const caixa = async (l) => l.boundingBox();
const mBox = await caixa(ladoMochila);
const bBox = await caixa(ladoBau);
exigir(!!mBox && !!bBox, 'as duas metades estão desenhadas');
exigir(mBox.x < bBox.x, `a mochila está à esquerda do baú (${Math.round(mBox.x)} < ${Math.round(bBox.x)})`);
const larguraJanela = await page.evaluate(() => window.innerWidth);
exigir(Math.abs(mBox.width - bBox.width) <= 2,
  `as duas metades têm a mesma largura (${Math.round(mBox.width)} vs ${Math.round(bBox.width)})`);
exigir(mBox.width / larguraJanela > 0.42 && mBox.width / larguraJanela < 0.58,
  `a mochila ocupa (quase) meia tela (${Math.round((mBox.width / larguraJanela) * 100)} %)`);
exigir(bBox.x + bBox.width <= larguraJanela + 1, 'o baú não sai da tela');
// as duas metades têm de acabar no mesmo pixel: grelhas, detalhes e pés alinhados
const alinhamento = await page.evaluate(() => {
  const r = (sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) };
  };
  return {
    gradeM: r('.mochila__lado--mochila .mochila__grade'),
    gradeB: r('.mochila__lado--bau .bau__linha'),
    detalheM: r('.mochila__detalhe'),
    detalheB: r('.bau__detalhe'),
    peM: r('.mochila__rodape'),
    peB: r('.bau__tudo'),
    celula: r('.mochila__celula'),
  };
});
exigir(alinhamento.gradeM.top === alinhamento.gradeB.top
  && alinhamento.gradeM.bottom === alinhamento.gradeB.bottom,
  `as duas grelhas começam e acabam no mesmo pixel (${alinhamento.gradeM.top}–${alinhamento.gradeM.bottom})`);
exigir(alinhamento.detalheM.top === alinhamento.detalheB.top
  && alinhamento.detalheM.bottom === alinhamento.detalheB.bottom,
  `as duas fichas ocupam a mesma faixa (${alinhamento.detalheM.h} px)`);
exigir(Math.abs(alinhamento.peM.bottom - alinhamento.peB.bottom) <= 1,
  `os dois pés assentam na mesma linha (${alinhamento.peM.bottom} vs ${alinhamento.peB.bottom})`);
exigir(alinhamento.celula.h >= 44,
  `a célula não desce do alvo de toque de 44 px (${alinhamento.celula.h} px, §4.6)`);
await page.screenshot({ path: `${OUT}/bau-ferramentas-01-duas-metades.png`, fullPage: true });

// ---------- 2. ordenar é uma vista, não uma mudança ----------
const ordemAntes = await page.evaluate(() => [...window.__game.scene.getScene('Game').bag]);
const primeirasAntes = await page.locator('.mochila__lado--mochila [role="gridcell"]')
  .evaluateAll((els) => els.slice(0, 3).map((e) => e.getAttribute('aria-label')));
const ordensDaMochila = page.getByRole('group', { name: 'Ordenar a mochila por' });
await ordensDaMochila.getByRole('button', { name: 'NOME', exact: true }).click();
await page.waitForTimeout(150);
const primeirasDepois = await page.locator('.mochila__lado--mochila [role="gridcell"]')
  .evaluateAll((els) => els.slice(0, 3).map((e) => e.getAttribute('aria-label')));
exigir(JSON.stringify(primeirasAntes) !== JSON.stringify(primeirasDepois),
  'o botão NOME muda a ordem da grelha');
exigir(/EQUIPAMENTO DE TESTE/.test(primeirasDepois[0]),
  `por nome, o EQUIPAMENTO vem primeiro (${primeirasDepois[0]})`);
exigir(JSON.stringify(await page.evaluate(() => [...window.__game.scene.getScene('Game').bag]))
  === JSON.stringify(ordemAntes),
  'e a mochila da cena continua na ordem de chegada');
await ordensDaMochila.getByRole('button', { name: 'VALOR', exact: true }).click();
await page.waitForTimeout(150);
const porValor = await page.locator('.mochila__lado--mochila [role="gridcell"]')
  .evaluateAll((els) => els.slice(0, 2).map((e) => e.getAttribute('aria-label')));
exigir(/PEÇA DO FORJADOR/.test(porValor[0]), `por valor, a peça mais cara vem primeiro (${porValor[0]})`);
await ordensDaMochila.getByRole('button', { name: 'CHEGADA', exact: true }).click();
await page.waitForTimeout(100);

// ---------- 3. quantidade: guardar 2 de 3 ----------
// a célula do equipamento, onde quer que a ordem a tenha posto neste momento
await page.locator('.mochila__lado--mochila [role="gridcell"][aria-label*="EQUIPAMENTO"]').first().click();
const nomeSelecionado = await page.locator('.mochila__lado--mochila .mochila__nome').innerText();
exigir(/EQUIPAMENTO DE TESTE/.test(nomeSelecionado) && /×5/.test(nomeSelecionado),
  `o primeiro espaço é o equipamento e diz que há 5 (${nomeSelecionado.replace(/\s+/g, ' ')})`);

const mais = page.locator('.mochila__lado--mochila [aria-label="Aumentar a quantidade a guardar"]');
await mais.click();
await mais.click();
exigir(await page.locator('.mochila__lado--mochila .mochila__passo-valor').first().innerText() === '3',
  'dois cliques em + levam a quantidade a 3');
await page.locator('.mochila__lado--mochila [aria-label="Diminuir a quantidade a guardar"]').click();
exigir(await page.locator('.mochila__lado--mochila .mochila__passo-valor').first().innerText() === '2',
  'e o − traz de volta a 2');
await page.getByRole('button', { name: 'GUARDAR 2', exact: true }).click();
await page.waitForTimeout(300);
let e = await estado();
exigir(e.bau.filter((x) => x === 'ITM-004').length === 2,
  `dois equipamentos foram para o baú (${e.bau.filter((x) => x === 'ITM-004').length})`);
exigir(e.bag.filter((x) => x === 'ITM-004').length === 3,
  `e sobraram três na mochila (${e.bag.filter((x) => x === 'ITM-004').length})`);
exigir(e.presos.includes('ITM-004'),
  'o alfinete fica: ainda há uma cópia presa na mochila (presos são por item, não por cópia)');

// ---------- 4. passar os semelhantes ----------
const todosIguais = page.locator('.mochila__lado--mochila').getByRole('button', { name: /TODOS OS IGUAIS/ });
exigir(await todosIguais.innerText() === 'TODOS OS IGUAIS (3)',
  `o botão diz quantos iguais há (${await todosIguais.innerText()})`);
await todosIguais.click();
await page.waitForTimeout(300);
e = await estado();
exigir(e.bag.filter((x) => x === 'ITM-004').length === 0,
  'TODOS OS IGUAIS levou os três equipamentos de uma vez');
exigir(e.bau.filter((x) => x === 'ITM-004').length === 5, 'o baú ficou com os cinco');
exigir(!e.presos.includes('ITM-004'),
  'sem nenhuma cópia na mochila, o alfinete desaparece (não fica a contar para os 20)');

// ---------- 5. moedas: guardar tudo e retirar por quantidade ----------
await page.getByRole('button', { name: 'GUARDAR TODAS', exact: true }).click();
await page.waitForTimeout(300);
e = await estado();
exigir(e.moedas === 0, `a carteira ficou a zero (${e.moedas})`);
exigir(e.bauMoedas === 45, `o baú ficou com as 45 moedas (${e.bauMoedas})`);
exigir(/NO BAÚ 45/.test((await page.locator('.bau__moedas-conta').innerText()).replace(/\s+/g, ' ')),
  `o painel conta as 45 no baú (${(await page.locator('.bau__moedas-conta').innerText()).replace(/\s+/g, ' ')})`);
await page.getByRole('button', { name: 'RETIRAR TODAS', exact: true }).click();
await page.waitForTimeout(300);
e = await estado();
exigir(e.moedas === 45 && e.bauMoedas === 0, `retirar todas devolveu as 45 (${e.moedas} / ${e.bauMoedas})`);

// guardar uma quantidade escolhida
await page.locator('.bau__moedas [aria-label="Aumentar as moedas"]').click();
await page.locator('.bau__moedas [aria-label="Aumentar as moedas"]').click();
await page.getByRole('button', { name: 'GUARDAR 3', exact: true }).click();
await page.waitForTimeout(300);
e = await estado();
exigir(e.moedas === 42 && e.bauMoedas === 3,
  `guardar 3 deixou 42 na carteira e 3 no baú (${e.moedas} / ${e.bauMoedas})`);

// ---------- 6. guardar tudo (itens e moedas) e retirar tudo do baú ----------
await page.getByRole('button', { name: /GUARDAR TUDO \(ITENS E MOEDAS\)/ }).click();
await page.waitForTimeout(350);
e = await estado();
exigir(e.bag.length === 0, `a mochila ficou vazia (${e.bag.length})`);
exigir(e.moedas === 0, 'e a carteira também');
exigir(e.bau.length === 8, `o baú ficou com os 8 itens (${e.bau.length})`);
exigir(e.bauMoedas === 45, `com as 45 moedas (${e.bauMoedas})`);

// ---------- 7. o baú (itens e moedas) vai para o save ----------
await page.evaluate(() => window.__game.scene.getScene('Game').persist('transition'));
await page.waitForTimeout(400);
const guardado = await page.evaluate(() => {
  for (const k of Object.keys(localStorage)) {
    const cru = localStorage.getItem(k) ?? '';
    if (!cru.includes('bauMoedas')) continue;
    try {
      const v = JSON.parse(cru);
      const p = v.progress ?? v;
      return { chave: k, bau: p.bau, bauMoedas: p.bauMoedas };
    } catch { /* outra chave: ignora */ }
  }
  return null;
});
exigir(!!guardado, 'o save tem uma chave com o baú');
exigir(guardado?.bauMoedas === 45, `as moedas do baú estão no save (${guardado?.bauMoedas})`);
exigir(Array.isArray(guardado?.bau) && guardado.bau.length === 8,
  `e os oito itens também (${guardado?.bau?.length})`);

// ---------- 8. retirar tudo do baú volta atrás ----------
await page.getByRole('button', { name: 'RETIRAR TUDO DO BAÚ', exact: true }).click();
await page.waitForTimeout(350);
e = await estado();
exigir(e.bag.length === 8, `retirar tudo devolveu os 8 itens (${e.bag.length})`);
exigir(e.bau.length === 0 && e.bauMoedas === 0, 'e o baú ficou vazio, moedas incluídas');
exigir(e.moedas === 45, `as 45 moedas voltaram à carteira (${e.moedas})`);

// ---------- 9. teclado: TAB troca de metade e T é o "tudo" do lado em que se está ----------
await page.keyboard.press('KeyT');
await page.waitForTimeout(300);
e = await estado();
exigir(e.bau.length === 8, `T com a mochila selecionada guarda tudo (${e.bau.length})`);
await page.keyboard.press('Tab');
await page.waitForTimeout(150);
exigir(await page.locator('.mochila__lado--bau .mochila__celula--sel').count() === 1,
  'TAB leva a seleção para o baú');
await page.keyboard.press('KeyT');
await page.waitForTimeout(300);
e = await estado();
exigir(e.bau.length === 0, 'e T do lado do baú retira tudo');

await page.keyboard.press('Escape');
await painel.waitFor({ state: 'hidden', timeout: 5000 });
exigir(await page.evaluate(() => !window.__game.scene.getScene('Game').scene.isPaused()),
  'ESC fecha o painel e o jogo volta a correr');

exigir(errors.length === 0, `sem erros de consola${errors.length ? ': ' + errors[0] : ''}`);
await browser.close();

if (falhas.length) {
  console.log(`\n${falhas.length} FALHA(S):`);
  for (const f of falhas) console.log(`- ${f}`);
  process.exit(1);
}
console.log('\nBAÚ + FERRAMENTAS OK');
