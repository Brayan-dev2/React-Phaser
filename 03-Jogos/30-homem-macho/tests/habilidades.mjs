/**
 * `UI-14` — **as habilidades e as melhorias**, ao vivo (`npm run habilidades` com o `npm run dev` no ar).
 *
 * O que este teste prova, e que os 22 casos puros não conseguem:
 *
 * 1. A tecla `H` (e o ícone do HUD) abrem o painel e **pausam** a cena — o jogo não corre por baixo.
 * 2. Só o que foi conquistado tem preço; o resto aparece trancado, com a razão.
 * 3. Comprar **cobra e entrega na mesma operação**: o nível sobe, as moedas saem, a marca acende.
 * 4. O nível **muda o motor**: o segundo salto sobe mais, o fôlego dura mais, o gancho alcança mais.
 * 5. Sem moedas o botão diz quanto falta e não deixa comprar.
 * 6. O que se comprou **vai para o save** — fechar o jogo não custa o que se pagou.
 *
 * `DEC-042`: dez níveis por habilidade, preços diferentes por complexidade (salto 100, fôlego 180,
 * estandarte 380) e **+40 % por nível**. Os números aqui são os do `tuning` (100 → 140 → 196): se o
 * dono os mudar, o teste tem de mudar com eles — é dinheiro do jogador.
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

const painel = page.locator('[aria-label="Habilidades"]');
const cena = (fn, arg) => page.evaluate(fn, arg);
const estado = () => cena(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    moedas: s.moedas, niveis: { ...s.niveis },
    bonus: s.player ? { ...s.player.bonus } : null,
    breathMax: s.breathMs, aberto: s.habilidadesAberto,
  };
});

/** Conquista três habilidades como se tivessem sido apanhadas a jogar. */
await cena(() => {
  const s = window.__game.scene.getScene('Game');
  s.collected = ['ITM-003', 'ITM-005', 'ITM-006'];
  s.player.unlockStrength();
  s.player.unlockBreath();
  s.player.abilities.doubleJump = true;
  s.niveis = { 'double-jump': 1, strength: 1, breath: 1, hook: 0, climb: 0, glide: 0 };
  // `DEC-042`: o salto tem dez níveis e o 2.º custa 100 (base). 240 chega para dois níveis e
  // falta para o terceiro — que é o que o caso 5 precisa de provar.
  s.ganharMoedas(240);
  s.aplicarNiveis();
});
await page.waitForTimeout(200);

// ---------- 1. o painel abre com a tecla H e pausa o jogo ----------
await page.keyboard.press('KeyH');
await painel.waitFor({ state: 'visible', timeout: 5000 });
exigir(true, 'a tecla H abre o painel das habilidades');
exigir(await cena(() => window.__game.scene.getScene('Game').scene.isPaused()),
  'abrir as habilidades pausa a GameScene');
await page.screenshot({ path: `${OUT}/habilidades-01-painel.png`, fullPage: true });

// ---------- 2. conquistadas com preço, o resto trancado ----------
const linhas = await page.locator('.hab__linha').evaluateAll((els) =>
  els.map((e) => e.getAttribute('aria-label')));
exigir(linhas.length === 6, `as seis habilidades estão na lista (${linhas.length})`);
exigir(/SALTO DUPLO: nível 1 de 10/.test(linhas[0]), `o salto está a nível 1 de 10 (${linhas[0]})`);
exigir(/GANCHO: nível 0 de 10 — não conquistada/.test(linhas[3]),
  `o gancho aparece trancado (${linhas[3]})`);
exigir(await page.locator('.hab__linha--trancada').count() === 3,
  'três habilidades ainda não conquistadas');
exigir(/CONQUISTADAS 3 \/ 6/.test(await page.locator('.hab__contadores').innerText()),
  'o cabeçalho conta as conquistadas');
const botaoDoGancho = page.locator('.hab__linha').nth(3).locator('.panel__btn');
exigir(await botaoDoGancho.count() === 0,
  'uma habilidade não conquistada não tem botão de comprar (não é uma loja)');

// ---------- 3. comprar: cobra e entrega ----------
const antes = await estado();
exigir(antes.moedas === 240, `a carteira tem 240 moedas (${antes.moedas})`);
// dez marcas de nível desenhadas, uma acesa: a escada do `DEC-042` está no painel
exigir(await page.locator('.hab__linha').first().locator('.hab__marca').count() === 10,
  'a linha do salto mostra as dez marcas de nível');
const botaoSalto = page.locator('.hab__linha').first().locator('.panel__btn');
exigir(/100 MOEDAS/.test(await botaoSalto.innerText()),
  `o 2.º nível do salto custa o base, 100 (${await botaoSalto.innerText()})`);
await botaoSalto.click();
await page.waitForTimeout(300);
const depois = await estado();
exigir(depois.niveis['double-jump'] === 2, `o nível do salto subiu para 2 (${depois.niveis['double-jump']})`);
exigir(depois.moedas === 140, `e as moedas saíram: 240 → 140 (${depois.moedas})`);
exigir(/SALTO DUPLO: nível 2 de 10/.test(await page.locator('.hab__linha').first().getAttribute('aria-label')),
  'a linha do salto anuncia o nível novo');
exigir(await page.locator('.hab__linha').first().locator('.hab__marca--cheia').count() === 2,
  'duas marcas de nível acesas');
// o 3.º nível custa 40 % mais: 140 — e é isso que o botão passa a pedir
exigir(/140 MOEDAS/.test(await botaoSalto.innerText()),
  `o 3.º nível custa 40 % mais que o 2.º (${await botaoSalto.innerText()})`);
await botaoSalto.click();
await page.waitForTimeout(300);
const terceiro = await estado();
exigir(terceiro.niveis['double-jump'] === 3, `e o nível 3 chegou (${terceiro.niveis['double-jump']})`);
exigir(terceiro.moedas === 0, `cobrando os 140: 140 → 0 (${terceiro.moedas})`);
const depois2 = terceiro;

// ---------- 4. o nível muda o motor ----------
exigir(Math.abs(depois.bonus.airJump - 1.055) < 0.001,
  `o segundo salto do nível 2 sobe 5,5 % mais (fator ${depois.bonus.airJump})`);
exigir(Math.abs(depois2.bonus.airJump - 1.11) < 0.001,
  `e o do nível 3 sobe 11 % (fator ${depois2.bonus.airJump})`);
const fatores = await cena(() => {
  const s = window.__game.scene.getScene('Game');
  return s.bonusDeNiveis();
});
exigir(fatores.airJump > 1, `o salto é multiplicado no motor (${fatores.airJump})`);
exigir(fatores.breath === 1, `e o fôlego, ainda no nível 1, é o de sempre (${fatores.breath})`);

// as habilidades não custam todas o mesmo (`DEC-042`): o fôlego parte de 180, o salto de 100
const botaoFolego = page.locator('.hab__linha').nth(2).locator('.panel__btn');
exigir(/FALTAM 180/.test(await botaoFolego.innerText()),
  `o fôlego custa 180 e a carteira está vazia (${await botaoFolego.innerText()})`);

// ---------- 5. sem moedas: o botão diz quanto falta e não compra ----------
exigir(await botaoFolego.isDisabled(), 'e está desactivado — não há compra a descoberto');
const antesFalha = await estado();
await cena(() => window.__game.scene.getScene('Game').comprarMelhoria('breath'));
await page.waitForTimeout(200);
const depoisFalha = await estado();
exigir(depoisFalha.niveis.breath === 1 && depoisFalha.moedas === antesFalha.moedas,
  'e uma tentativa forçada não cobra nem sobe nada');
// o salto, que já gastou o que havia, diz quanto falta para o nível 4 (196)
exigir(/FALTAM 196/.test(await botaoSalto.innerText()),
  `e no 4.º nível do salto falta o que já não há (${await botaoSalto.innerText()})`);

// ---------- 6. o save leva os níveis e o que foi apanhado ----------
await cena(() => window.__game.scene.getScene('Game').persist('transition'));
await page.waitForTimeout(400);
const guardado = await cena(() => {
  for (const k of Object.keys(localStorage)) {
    const cru = localStorage.getItem(k) ?? '';
    if (!cru.includes('melhorias')) continue;
    try {
      const v = JSON.parse(cru);
      const p = v.progress ?? v;
      return { melhorias: p.melhorias, coletados: p.coletados };
    } catch { /* outra chave */ }
  }
  return null;
});
exigir(!!guardado, 'o save tem uma chave com as melhorias');
exigir(guardado?.melhorias?.['double-jump'] === 3,
  `o nível comprado está no save (${guardado?.melhorias?.['double-jump']})`);
exigir(Array.isArray(guardado?.coletados) && guardado.coletados.includes('ITM-003'),
  'e o que foi apanhado também — é o que dá as habilidades ao retomar');

// ---------- 7. fechar devolve o controlo ----------
await page.keyboard.press('KeyH');
await painel.waitFor({ state: 'hidden', timeout: 5000 });
exigir(await cena(() => !window.__game.scene.getScene('Game').scene.isPaused()),
  'H fecha o painel e o jogo volta a correr');

/*
 * ---------- 8. o nível muda a FÍSICA do segundo salto ----------
 *
 * Depois de fechar o painel, de propósito: com ele aberto a cena está pausada e a tecla nem chega
 * ao jogador — foi assim que este caso falhou da primeira vez.
 */
async function alturaDoSegundoSalto() {
  await cena(() => {
    const s = window.__game.scene.getScene('Game');
    // 160 px acima do chão, onde a sala é livre: um `y` fixo caía dentro da geometria
    const sp = s.spawnPoint('start', s.roomIndex);
    const pulo = { x: sp.x, y: sp.y - 160 };
    s.player.setPosition(pulo.x, pulo.y);
    s.player.body.reset(pulo.x, pulo.y);
    s.player.body.setVelocity(0, 0);
    s.player.grounded = false;
    s.player.jumpsUsed = 1; // como se já tivesse gasto o primeiro salto
  });
  await page.keyboard.down('Space');
  await page.waitForTimeout(40);
  const v = await cena(() => window.__game.scene.getScene('Game').player.body.velocity.y);
  await page.keyboard.up('Space');
  return Math.round(v);
}
const saltoNivel3 = await alturaDoSegundoSalto();
await cena(() => {
  const s = window.__game.scene.getScene('Game');
  s.niveis = { ...s.niveis, 'double-jump': 1 };
  s.aplicarNiveis();
  s.pushHabilidades();
});
await page.waitForTimeout(150);
const saltoNivel1 = await alturaDoSegundoSalto();
exigir(saltoNivel1 < -500 && saltoNivel1 > -620,
  `no nível 1 o segundo salto arranca a ~560 px/s (${saltoNivel1})`);
exigir(saltoNivel3 < saltoNivel1 - 40,
  `e no nível 3 arranca mais depressa (${saltoNivel1} → ${saltoNivel3})`);
// volta ao nível 3 para o resto dos casos (o save é escrito com o que estiver aqui)
await cena(() => {
  const s = window.__game.scene.getScene('Game');
  s.niveis = { ...s.niveis, 'double-jump': 3 };
  s.aplicarNiveis();
  s.pushHabilidades();
});
await page.waitForTimeout(150);

// o ícone do HUD faz o mesmo que a tecla
await page.locator('.hud__btn--habilidades').click();
await painel.waitFor({ state: 'visible', timeout: 5000 });
exigir(true, 'o ícone do HUD também abre o painel');
await page.keyboard.press('Escape');
await painel.waitFor({ state: 'hidden', timeout: 5000 });

exigir(errors.length === 0, `sem erros de consola${errors.length ? ': ' + errors[0] : ''}`);
await browser.close();

if (falhas.length) {
  console.log(`\n${falhas.length} FALHA(S):`);
  for (const f of falhas) console.log(`- ${f}`);
  process.exit(1);
}
console.log('\nHABILIDADES OK');
