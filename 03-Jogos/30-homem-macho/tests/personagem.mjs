/**
 * `UI-12` — a **criação de personagem**, provada no navegador (`node tests/personagem.mjs`).
 *
 * A ordem que o jogador vive: `JOGAR` → dificuldade → **este ecrã** → sala. O que tem de ser
 * verdade:
 *
 *  1. o ecrã vem **depois** da dificuldade e **antes** de qualquer sala;
 *  2. cada um dos sete grupos muda o valor com `←/→` e a prévia **muda com ele**;
 *  3. `R` sorteia; `Esc` volta à dificuldade sem perder a escolha;
 *  4. a escolha **chega ao jogo** (`GameScene.personagem`) e **volta no save** (`CONTINUAR`);
 *  5. o rato faz o mesmo que o teclado (o menu não é só de teclado, mas é teclado primeiro).
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:5173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => { errors.push('PAGEERROR: ' + e.message); console.error('PAGEERROR', e.message); });
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

const previa = () => page.evaluate(() => {
  const s = document.querySelector('.previa');
  return s ? { ...s.dataset } : null;
});
const jogoPersonagem = () => page.evaluate(
  () => window.__game.scene.getScene('Game').personagem ?? null,
);

const report = {};

// --- chegar ao ecrã: título → JOGAR → dificuldade → personagem ---
await page.addInitScript(() => { try { localStorage.clear(); } catch { /* sem storage */ } });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('.menu', { timeout: 20000 });
await page.waitForTimeout(800);
await page.keyboard.press('Enter');                       // dispensa o título
await page.waitForTimeout(300);
await page.keyboard.press('ArrowDown');                   // JOGAR
await page.keyboard.press('Enter');                       // abre a dificuldade
await page.waitForTimeout(300);
await page.keyboard.press('ArrowRight');                  // MÉDIO → DIFÍCIL
await page.keyboard.press('Enter');                       // COMEÇAR → criação de personagem
await page.waitForTimeout(500);

const grupos = await page.evaluate(
  () => [...document.querySelectorAll('[aria-label="Características do personagem"] .menu__linha')]
    .map((e) => e.querySelector('.menu__linha-rotulo')?.textContent ?? ''),
);
report.nome = {
  campo: await page.evaluate(() => !!document.querySelector('#pers-nome')),
  valor: await page.evaluate(() => document.querySelector('#pers-nome')?.value ?? null),
  esperado: 'campo de nome presente, começando no valor de fábrica',
};
report.ecra = {
  aberto: await page.evaluate(() => !!document.querySelector('[aria-label="Criação de personagem"]')),
  grupos,
  canvas: await page.evaluate(() => document.querySelectorAll('canvas').length),
  previaTemNome: await page.evaluate(() => {
    const s = document.querySelector('.previa');
    return !!s?.getAttribute('aria-label')?.startsWith('Prévia do personagem');
  }),
  esperado: '7 grupos · 0 canvas (ainda não há jogo) · prévia com descrição em texto',
};
await page.screenshot({ path: 'docs/capturas/PERS-01-tela.png' });

// --- EASTER EGG: escrever "Macho" no nome dá o herói de fábrica ---
await page.click('#pers-nome');
await page.fill('#pers-nome', '');          // o nome de fábrica é um espaço vazio com texto
await page.keyboard.type('Macho');          // tecla a tecla, como o jogador faria
await page.waitForTimeout(400);
const egg = await page.evaluate(() => {
  const s = document.querySelector('.previa');
  return {
    nome: document.querySelector('#pers-nome')?.value ?? null,
    aviso: document.querySelector('.menu__aviso')?.textContent ?? null,
    previa: { ...(s?.dataset ?? {}) },
  };
});
// as escolhas do easter egg, lidas da própria lista do ecrã
const linhaValor = (rotulo) => page.evaluate((r) => {
  const linha = [...document.querySelectorAll('.pers__lista .menu__linha')]
    .find((e) => e.querySelector('.menu__linha-rotulo')?.textContent === r);
  return linha?.querySelector('.menu__linha-valor')?.textContent?.replace(/[◀▶\s]+/g, '') ?? null;
}, rotulo);
report.easterEgg = {
  ...egg,
  cabelo: await linhaValor('CABELO'),
  corCabelo: await linhaValor('COR DO CABELO'),
  expressao: await linhaValor('EXPRESSÃO'),
  corpo: await linhaValor('CORPO'),
  pele: await linhaValor('TOM DE PELE'),
  esperado: 'nome MACHO · aviso de easter egg · moicano · azul · FURIOSA · MAROMBA · CLARA',
};
await page.screenshot({ path: 'docs/capturas/PERS-04-easter-egg.png' });

// --- EASTER EGG 2: `Alucard` — cabelo grande branco, presas, corpo magro, pele pálida ---
await page.fill('#pers-nome', '');
await page.keyboard.type('Alucard');
await page.waitForTimeout(400);
const alucard = await page.evaluate(() => {
  const s = document.querySelector('.previa');
  return {
    nome: document.querySelector('#pers-nome')?.value ?? null,
    aviso: document.querySelector('.menu__aviso')?.textContent ?? null,
    previa: { ...(s?.dataset ?? {}) },
  };
});
report.alucard = {
  ...alucard,
  cabelo: await linhaValor('CABELO'),
  corCabelo: await linhaValor('COR DO CABELO'),
  corpo: await linhaValor('CORPO'),
  pele: await linhaValor('TOM DE PELE'),
  esperado: 'nome ALUCARD · aviso próprio · LONGO · BRANCO · MAGRO · PÁLIDA · prévia com presas',
};
await page.screenshot({ path: 'docs/capturas/PERS-05-alucard.png' });

// depois do easter egg o jogador continua livre: volta-se ao estado anterior para o resto do teste
await page.fill('#pers-nome', 'Ana');
await page.waitForTimeout(200);
await page.keyboard.press('ArrowDown');   // desce à linha CABELO (e tira o foco do campo)

// --- cada grupo muda, e a prévia acompanha ---
const antes = await previa();
const mudancas = {};
// grupo a grupo: ↓ para descer, → para mudar
for (let i = 0; i < 7; i += 1) {
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(120);
  if (i < 6) await page.keyboard.press('ArrowDown');
}
const depois = await previa();
report.previa = {
  antes,
  depois,
  mudouPele: antes.pele !== depois.pele,
  mudouCorpo: antes.corpo !== depois.corpo,
  mudouCabelo: antes.cabelo !== depois.cabelo,
  mudouRosto: antes.rosto !== depois.rosto,
  esperado: 'os quatro atributos do SVG mudam com as setas',
};
void mudancas;
await page.screenshot({ path: 'docs/capturas/PERS-02-escolhas.png' });

// --- o rato escolhe o mesmo que o teclado (os botões são os do grupo em foco) ---
await page.keyboard.press('ArrowUp');      // volta ao grupo CORPO
await page.waitForTimeout(150);
await page.click('text=MAROMBA');
await page.waitForTimeout(200);
const porRato = await previa();
report.rato = {
  corpo: porRato.corpo,
  esperado: 'maromba (o botão do valor faz o mesmo que ←/→)',
};

// --- Esc volta à dificuldade sem perder nada ---
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
const voltouParaDificuldade = await page.evaluate(
  () => !!document.querySelector('[aria-label="Dificuldade"]'),
);
await page.keyboard.press('Enter');                       // e de volta à criação
await page.waitForTimeout(300);
report.voltar = {
  voltouParaDificuldade,
  corpoPreservado: (await previa()).corpo,
  esperado: 'true · maromba (a escolha não se perde ao voltar)',
};

// --- `R` sorteia (fora da linha do nome, onde o `R` é uma letra) ---
await page.keyboard.press('ArrowDown');     // sai do NOME para CABELO
await page.waitForTimeout(150);
const antesDoSorteio = await previa();
const nomeAntesDoSorteio = await page.evaluate(() => document.querySelector('#pers-nome')?.value);
await page.keyboard.press('r');
await page.waitForTimeout(250);
const depoisDoSorteio = await previa();
report.sorteio = {
  aviso: await page.evaluate(() => document.querySelector('.menu__aviso')?.textContent ?? null),
  mudou: JSON.stringify(antesDoSorteio) !== JSON.stringify(depoisDoSorteio),
  nomePreservado: (await page.evaluate(() => document.querySelector('#pers-nome')?.value)) === nomeAntesDoSorteio,
  esperado: 'aviso de sorteio · prévia diferente · o nome escrito à mão fica',
};

// --- começar: a escolha chega ao jogo ---
const escolhido = await previa();
await page.keyboard.press('Enter');                 // → introdução (`UI-13`), ainda sem canvas
await page.waitForSelector('.historia', { timeout: 8000 });
const houveIntroducao = await page.evaluate(() => !!document.querySelector('.historia'));
for (let i = 0; i < 5; i += 1) {                    // cinco quadros: `Enter` em cada um
  await page.keyboard.press('Enter');
  await page.waitForTimeout(220);
}
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.waitForTimeout(800);
report.emJogo = {
  personagem: await jogoPersonagem(),
  escolhido,
  introducaoAntesDoJogo: houveIntroducao,
  esperado: 'o `GameScene` recebe exatamente o que o ecrã mostrava (pele/corpo/cabelo/rosto)',
};
await page.screenshot({ path: 'docs/capturas/PERS-03-em-jogo.png' });

// --- e volta no save: CONTINUAR tem de devolver o mesmo herói ---
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
// CONTINUAR → lista de saves → primeiro slot
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.waitForTimeout(800);
report.retomou = {
  personagem: await jogoPersonagem(),
  igual: JSON.stringify(await jogoPersonagem()) === JSON.stringify(report.emJogo.personagem),
  esperado: 'o herói retomado é o mesmo que foi criado',
};

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
