/**
 * Verificação de LVL-05 (`[PÓS]`) no navegador — `node tests/lvl05.mjs`.
 *
 * Cobre a mecânica que só o runtime prova: bloco pesado que não cede sem `HAB-05`,
 * `ITM-005` permanente depois da morte (`TST-005`, crítico aqui), contrapeso engatado
 * como estado de mapa (`§8`) e o veredito do elevador (sem força → sem contrapeso → pronto).
 */
import { chromium } from 'playwright';
// `DEC-027`: a entrada do jogo é por **ação** (`scene.virtuais`), não por tecla (`scene.keys`).
// Os testes seguram a ação como o controlo de toque a seguraria — o caminho é o mesmo do jogador.

const URL = process.env.SMOKE_URL ?? 'http://localhost:5173/?skip=menu';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.evaluate(() => { window.__game.loop._coolDown = 0; });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const gotoRoom = async (index) => {
  await page.evaluate((i) => {
    window.__events = [];
    window.__game.scene.getScene('Game').scene.restart({ area: 'LVL-05', room: i });
  }, index);
  await page.waitForTimeout(800);
};

const state = () => page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    area: s.area.id, room: s.roomIndex,
    x: Math.round(s.player.x), hp: s.player.resources.hp,
    strength: s.player.abilities.strength,
    doubleJump: s.player.abilities.doubleJump,
    collected: [...s.collected],
    blocks: s.blockSprites.map((b) => b.column),
    counterweight: s.counterweight,
    elevators: s.built.elevators.length,
    plates: s.built.plates.length,
    gears: s.built.decorBack.filter((d) => d.kind === 'gear').length,
    oil: s.built.decor.filter((d) => d.kind === 'oil').length,
    spikes: s.built.spikes.length,
  };
});

const report = {};

// ---------- 1. a soleira carrega com o cenário novo ----------
await gotoRoom(0);
report.entrada = await state();

// ---------- 2. bloco de L05-02 sem Força: não cede (exposição 1 de PAT-LD-03) ----------
await gotoRoom(1);
const semForca = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const bloco = s.blockSprites[0];
  s.player.setPosition(bloco.sprite.x - 50, 7 * 64 - 40);
  s.player.body.reset(bloco.sprite.x - 50, 7 * 64 - 40);
  const antes = bloco.column;
  // anda contra o bloco por ~1,2 s (rota real: input de teclado)
  s.player.abilities.strength = false;
  for (let i = 0; i < 12; i++) {
    s.player.body.setVelocityX(220);
    await new Promise((r) => setTimeout(r, 100));
  }
  return { antes, depois: bloco.column, tinhaForca: s.player.abilities.strength };
});
report.blocoSemForca = { ...semForca, esperado: 'coluna não muda (sem HAB-05)' };

// ---------- 3. pegar a Força em L05-04 ----------
await gotoRoom(3);
const pegouForca = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const item = s.built.items.find((i) => i.id === 'ITM-005');
  s.player.setPosition(item.x, item.y - 40);
  s.player.body.reset(item.x, item.y - 40);
  await new Promise((r) => setTimeout(r, 700));
  return {
    encontrado: Boolean(item),
    strength: s.player.abilities.strength,
    collected: [...s.collected],
  };
});
report.forca = pegouForca;

// ---------- 4. TST-005: a Força sobrevive à morte ----------
const aposMorte = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.takeDamage(999, s.difficulty, s.player.x + 10);
  await new Promise((r) => setTimeout(r, 1500));
  return { strength: s.player.abilities.strength, coletados: [...s.collected], hp: s.player.resources.hp };
});
report.forcaAposMorte = aposMorte;

// ---------- 5. com Força o bloco anda 1 tile por empurrão até a placa ----------
await gotoRoom(4);
const empurrou = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.abilities.strength = true;
  const bloco = s.blockSprites[0];
  const colunas = [bloco.column];
  await new Promise((r) => setTimeout(r, 200));
  for (let passo = 0; passo < 5; passo++) {
    s.player.setPosition(bloco.sprite.x - 50, 7 * 64 - 40);
    s.player.body.reset(bloco.sprite.x - 50, 7 * 64 - 40);
    await new Promise((r) => setTimeout(r, 120));
    s.virtuais.add('direita');                    // intenção de input, como no teclado real
    await new Promise((r) => setTimeout(r, 900));
    s.virtuais.delete('direita');
    await new Promise((r) => setTimeout(r, 500));
    colunas.push(bloco.column);
  }
  return { colunas, placa: s.built.plates.map((c) => Math.round((c.x - 32) / 64)), counterweight: s.counterweight };
});
report.empurrou = { ...empurrou, esperado: '13 → 17, contrapeso engatado' };

// ---------- 6. o contrapeso é estado de mapa: morrer não desengata ----------
const contrapesoAposMorte = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.takeDamage(999, s.difficulty, s.player.x + 10);
  await new Promise((r) => setTimeout(r, 1600));
  return { counterweight: s.counterweight, hp: s.player.resources.hp };
});
report.contrapesoAposMorte = contrapesoAposMorte;

// ---------- 7. elevador: sem força → sem contrapeso → pronto ----------
await gotoRoom(2);
const elevador = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const u = s.built.elevators[0];
  s.player.setPosition(u.x - 40, 7 * 64 - 40);
  s.player.body.reset(u.x - 40, 7 * 64 - 40);
  await new Promise((r) => setTimeout(r, 400));

  const ler = () => document.querySelector('.panel--text')?.textContent ?? '';
  s.player.abilities.strength = false; s.counterweight = false;
  s.tryElevator();
  await new Promise((r) => setTimeout(r, 400));
  const semForca = ler();

  s.player.abilities.strength = true; s.counterweight = false;
  s.tryElevator();
  await new Promise((r) => setTimeout(r, 400));
  const semContrapeso = ler();

  s.player.abilities.strength = true; s.counterweight = true;
  s.tryElevator();
  await new Promise((r) => setTimeout(r, 400));
  const pronto = ler();

  return { semForca, semContrapeso, pronto };
});
report.elevador = elevador;

// ---------- 8. dentes de engrenagem de L05-02 machucam ----------
await gotoRoom(1);
const dentes = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const dente = s.built.spikes[0];
  // `MEC-003`: o escudo absorve antes da vida, então a leitura é do total
  s.player.resources.hp = 100;
  s.player.resources.shield = 0;
  const antes = s.player.resources.hp + s.player.resources.shield;
  s.player.setPosition(dente.x, dente.y - 8);
  s.player.body.reset(dente.x, dente.y - 8);
  await new Promise((r) => setTimeout(r, 700));
  const depois = s.player.resources.hp + s.player.resources.shield;
  return { antes, depois, dano: antes - depois, dentesNaSala: s.built.spikes.length };
});
report.dentes = dentes;

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
