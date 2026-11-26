/**
 * `UI-02` — o **menu inicial**, provado no navegador (`node tests/menu.mjs`).
 *
 * É o único ecrã que todo jogador vê, e o único que pode estragar o jogo **antes** dele começar.
 * O que este teste prova, na ordem em que o jogador vive:
 *
 *  1. **tela limpa**: "PRESSIONE QUALQUER BOTÃO" sobre a área reservada à arte (parallax), sem
 *     canvas nenhum montado (§4.4);
 *  2. **a primeira tecla só dispensa o título** — e nada fica em foco;
 *  3. **JOGAR → dificuldade → partida**, com a dificuldade a chegar ao `GameScene`;
 *  4. **o save aparece**: `CONTINUAR` lista os slots, e o slot usado diz onde parou;
 *  5. **retomar escolhe o save certo**: mesma sala, mesma vida, mesma dificuldade (`MEC-007`);
 *  6. **configurações**: tipo de controle, volumes, legendas, idioma e **atalhos remapeados**;
 *  7. **créditos**: o nome do desenvolvedor;
 *  8. `?skip=menu` continua a porta de serviço do E2E dos 16 setores.
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:5173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => { errors.push('PAGEERROR: ' + e.message); console.error('PAGEERROR', e.message); });
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

const report = {};
const canvas = () => page.evaluate(() => document.querySelectorAll('canvas').length);
const texto = () => page.evaluate(() => document.querySelector('.menu')?.innerText ?? '');
const focado = () => page.evaluate(
  () => document.querySelector('.menu__acao[data-foco="true"], .menu__linha[data-foco="true"]')
    ?.innerText.split('\n')[0] ?? null,
);
const jogo = () => page.evaluate(() => {
  const s = window.__game?.scene?.getScene('Game');
  return { sala: s?.current?.id ?? null, hp: s?.player?.resources?.hp ?? null, dificuldade: s?.difficulty ?? null };
});

// 1. boot → título: tela limpa, sem canvas
await page.addInitScript(() => { try { localStorage.clear(); } catch { /* sem storage */ } });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('.menu', { timeout: 20000 });
await page.waitForTimeout(900);
report.titulo = {
  canvas: await canvas(),
  press: (await texto()).includes('PRESSIONE QUALQUER BOTÃO'),
  areaReservada: (await texto()).includes('ARTE DE ABERTURA'),
  semItens: await page.evaluate(() => document.querySelectorAll('.menu__acoes').length),
  esperado: '0 canvas · "PRESSIONE QUALQUER BOTÃO" · área reservada · nenhum item ainda',
};
await page.screenshot({ path: 'docs/capturas/MENU-01-titulo.png' });

// 2. a primeira tecla só dispensa o título
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
report.primeiraTecla = {
  canvas: await canvas(),
  menuAberto: await page.evaluate(() => !!document.querySelector('.menu__acoes')),
  emFoco: await focado(),
  semContinuar: !(await texto()).includes('CONTINUAR'),
  esperado: '0 canvas · menu visível · nada em foco · sem CONTINUAR (não há save)',
};
await page.screenshot({ path: 'docs/capturas/MENU-02-menu.png' });

// 3. JOGAR → dificuldade → partida
await page.keyboard.press('ArrowDown');            // foca JOGAR
await page.keyboard.press('Enter');                // abre a dificuldade
await page.waitForTimeout(300);
const painelDificuldade = await page.evaluate(
  () => !!document.querySelector('[aria-label="Dificuldade"].menu__lista'),
);
await page.keyboard.press('ArrowRight');           // MÉDIO → DIFÍCIL
await page.waitForTimeout(200);
await page.screenshot({ path: 'docs/capturas/MENU-03-dificuldade.png' });
await page.keyboard.press('Enter');                // COMEÇAR → `UI-12` (criação de personagem)
await page.waitForTimeout(400);
const criacao = await page.evaluate(
  () => !!document.querySelector('[aria-label="Criação de personagem"]'),
);
await page.keyboard.press('Enter');                // personagem padrão → introdução (`UI-13`)
await page.waitForSelector('.historia', { timeout: 8000 });
const introducao = await page.evaluate(() => ({
  quadro: document.querySelector('.historia__migalha')?.textContent ?? null,
  titulo: document.querySelector('.historia__titulo')?.textContent ?? null,
  canvas: document.querySelectorAll('canvas').length,
}));
for (let i = 0; i < 5; i += 1) {                   // cinco quadros até à primeira sala
  await page.keyboard.press('Enter');
  await page.waitForTimeout(220);
}
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.waitForTimeout(800);
report.entrou = {
  painelDificuldade,
  // `UI-12`: a dificuldade leva à criação de personagem, nunca direto à sala
  criacaoAntesDoJogo: criacao,
  // `UI-13`: e a criação leva à história, ainda sem jogo montado
  introducaoAntesDoJogo: introducao,
  canvas: await canvas(),
  ...(await jogo()),
  menuSumiu: await page.evaluate(() => !document.querySelector('.menu__acoes')),
  esperado: 'true · true · 1 canvas · L01-01 · hp 100 · `hard` · menu fora da tela',
};
await page.screenshot({ path: 'docs/capturas/MENU-04-entrou.png' });

// 4. `UI-06`: pausa → sair para o menu; o save entra no slot 1 e CONTINUAR aparece
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.resources.hp = 40;
  await s.persist('manual');
});
await page.waitForTimeout(400);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await page.screenshot({ path: 'docs/capturas/MENU-05-pausa.png' });
await page.click('text=SAIR PARA O MENU');
await page.waitForSelector('.menu__acoes', { timeout: 8000 });
await page.waitForTimeout(500);
const itemContinuar = await page.evaluate(
  () => document.querySelector('.menu__acoes .menu__acao')?.innerText.replace(/\n+/g, ' · ') ?? '',
);
const menuDepois = await texto();
report.continuar = {
  canvas: await canvas(),
  temContinuar: menuDepois.includes('CONTINUAR'),
  detalhe: itemContinuar,
  esperado: '0 canvas · CONTINUAR presente, com "saves" e a sala onde parou',
};

// 5. CONTINUAR → lista de slots → retomar o slot 1
await page.keyboard.press('ArrowDown');            // foca CONTINUAR
await page.keyboard.press('Enter');                // abre a lista de saves
await page.waitForTimeout(400);
const listaSaves = await page.evaluate(
  () => [...document.querySelectorAll('[aria-label="Saves"] .menu__linha')].map((e) => e.innerText.replace(/\n+/g, ' · ')),
);
await page.screenshot({ path: 'docs/capturas/MENU-06-saves.png' });
await page.keyboard.press('Enter');                // retoma o slot em foco
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.waitForTimeout(900);
report.retomou = {
  slots: listaSaves.length,
  slot1: listaSaves[0] ?? null,
  slotsVazios: listaSaves.filter((l) => l.includes('VAZIO')).length,
  ...(await jogo()),
  esperado: '3 slots · slot 1 com sala e hora · 2 vazios · L01-01 · hp 40 · `hard`',
};

// 6. configurações: tipo de controle, volume, legendas, idioma e atalhos
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await page.click('text=SAIR PARA O MENU');
await page.waitForSelector('.menu__acoes', { timeout: 8000 });
await page.mouse.move(4, 4);
await page.waitForTimeout(400);
await page.keyboard.press('ArrowDown');            // CONTINUAR
await page.keyboard.press('ArrowDown');            // JOGAR
await page.keyboard.press('ArrowDown');            // CONFIGURAÇÕES
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
const linhasConfig = await page.evaluate(
  () => [...document.querySelectorAll('[aria-label="Ajustes"] .menu__linha')]
    .map((e) => e.innerText.replace(/\n+/g, ' · ')),
);
await page.screenshot({ path: 'docs/capturas/MENU-07-config.png' });

// tipo de controle: ←/→ ciclam (TECLADO → TECLADO+RATO → TOQUE)
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(200);
const tipoDepois = (await page.evaluate(
  () => document.querySelector('[aria-label="Ajustes"] .menu__linha')?.innerText ?? '',
)).replace(/\n+/g, ' ');

// som geral: ←/→ andam de 10 em 10
await page.keyboard.press('ArrowDown');            // ATALHOS
await page.keyboard.press('ArrowDown');            // SOM GERAL
const somAntes = (await page.evaluate(
  () => document.querySelectorAll('[aria-label="Ajustes"] .menu__linha')[2]?.innerText ?? '',
)).replace(/\n+/g, ' ');
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(150);
const somDepois = (await page.evaluate(
  () => document.querySelectorAll('[aria-label="Ajustes"] .menu__linha')[2]?.innerText ?? '',
)).replace(/\n+/g, ' ');

// atalhos: remapear ATACAR de J para Z e provar que o jogo usa a tecla nova
for (let i = 0; i < 2; i += 1) await page.keyboard.press('ArrowUp');  // volta ao topo
await page.keyboard.press('ArrowDown');            // ATALHOS
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
const acoes = await page.evaluate(
  () => [...document.querySelectorAll('[aria-label="Ações e teclas"] .menu__linha')]
    .map((e) => e.innerText.replace(/\n+/g, ' ')),
);
// cursor já vem na primeira ação (MOVER À ESQUERDA); descer até ATACAR
const idxAtacar = acoes.findIndex((a) => a.startsWith('ATACAR'));
for (let i = 0; i < idxAtacar; i += 1) await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');                // "pressione a nova tecla"
await page.waitForTimeout(200);
await page.keyboard.press('z');
await page.waitForTimeout(300);
const atalhoNovo = (await page.evaluate(
  (i) => document.querySelectorAll('[aria-label="Ações e teclas"] .menu__linha')[i]
    ?.innerText ?? '', idxAtacar,
)).replace(/\n+/g, ' ');
await page.screenshot({ path: 'docs/capturas/MENU-08-atalhos.png' });
report.config = {
  linhas: linhasConfig,
  tipoDepois,
  somAntes,
  somDepois,
  atalhoNovo,
  esperado: '9 linhas · tipo muda com ←/→ · som desce 10% · ATACAR passa a Z',
};
await page.keyboard.press('Escape');               // atalhos → config
await page.keyboard.press('Escape');               // config → menu
await page.waitForTimeout(300);

// 7. créditos
for (let i = 0; i < 4; i += 1) await page.keyboard.press('ArrowDown');   // 4º item, com o foco limpo
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
const creditos = await page.evaluate(
  () => document.querySelector('[aria-label="Créditos"]')?.innerText.replace(/\n+/g, ' · ') ?? '',
);
await page.screenshot({ path: 'docs/capturas/MENU-09-creditos.png' });
report.creditos = {
  texto: creditos,
  temDev: creditos.includes('DAVID CREATOR'),
  esperado: 'o painel nomeia DAVID CREATOR como desenvolvimento',
};
await page.keyboard.press('Escape');

// 8. a tecla remapeada chega ao jogo: Z ataca depois de entrar
await page.keyboard.press('ArrowDown');            // (foco foi limpo ao sair dos créditos) → CONTINUAR
await page.keyboard.press('ArrowDown');            // JOGAR
await page.keyboard.press('Enter');                // abre a dificuldade
await page.waitForTimeout(300);
await page.keyboard.press('Enter');                // COMEÇAR → criação de personagem
await page.waitForTimeout(300);
await page.keyboard.press('Enter');                // personagem → introdução (`UI-13`)
await page.waitForSelector('.historia', { timeout: 8000 });
await page.keyboard.press('s');                    // `S` salta a introdução
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.waitForTimeout(900);
report.atalhoNoJogo = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const teclas = s.teclas?.atacar?.map((k) => k.keyCode) ?? [];
  return { atacar: teclas, temZ: teclas.includes(90), temJ: teclas.includes(74) };
});
report.atalhoNoJogo.esperado = 'atacar ligado a Z (90) e **não** a J (74)';

// 9. controle de toque e legendas (as duas opções ligadas nas configurações)
// **uma página de cada vez**: cada Phaser é um jogo a sério, e dois jogos em segundo plano
// competem pelo `requestAnimationFrame` (o browser limita-o fora do separador ativo)
await page.close();
const toque = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await toque.addInitScript(() => {
  try {
    localStorage.setItem('homem-macho/config/v1', JSON.stringify({ tipoControle: 'toque', legendas: true }));
  } catch { /* sem storage */ }
});
await toque.goto(`${BASE}?skip=menu`, { waitUntil: 'networkidle' });
// o Phaser só avança a cena quando a página está à frente: em segundo plano o `requestAnimationFrame`
// é limitado pelo browser e o boot pára (comportamento normal, não um bug do jogo)
await toque.bringToFront();
await toque.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await toque.waitForTimeout(700);
const botoes = await toque.evaluate(() => document.querySelectorAll('.toque__btn').length);
const cx = () => toque.evaluate(() => window.__game.scene.getScene('Game').player.x);
const xAntes = await cx();
const caixa = await (await toque.$('.toque__btn:nth-child(2)')).boundingBox();
await toque.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
await toque.mouse.down();
await toque.waitForTimeout(600);
await toque.mouse.up();
const xDepois = await cx();
await toque.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.player.takeDamage(18, 'medium', s.player.x + 10);
});
await toque.waitForTimeout(300);
const legenda = await toque.evaluate(() => document.querySelector('.legenda')?.innerText.replace(/\n/g, ' ') ?? null);
await toque.screenshot({ path: 'docs/capturas/MENU-10-toque-legenda.png' });
await toque.close();
report.toqueELegenda = {
  botoes,
  andou: Math.round(xDepois - xAntes),
  legenda,
  esperado: '8 botões · o botão ▶ move o herói · legenda "Dano recebido." com marca de perigo',
};

// 10. `?skip=menu` continua a porta de serviço do E2E
const direto = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await direto.goto(`${BASE}?skip=menu`, { waitUntil: 'networkidle' });
await direto.bringToFront();
await direto.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
report.skipMenu = {
  sala: await direto.evaluate(() => window.__game.scene.getScene('Game').current?.id),
  temMenu: await direto.evaluate(() => !!document.querySelector('.menu__acoes')),
  esperado: 'L01-01 direto, sem menu — o E2E dos 16 setores depende disto',
};

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
