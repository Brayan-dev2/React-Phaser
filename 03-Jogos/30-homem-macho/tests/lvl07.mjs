/**
 * Verificação de LVL-07 (`[PÓS]`) no navegador — `node tests/lvl07.mjs`.
 *
 * O setor não tem trava, habilidade nem chefe (§7): o que o runtime precisa provar aqui é
 * **ausência** (nada bloqueia a rota reta, nada obriga plataforma) e a única mecânica nova —
 * o **trifório** de mão única, que entra por salto deliberado e nunca ao passar (§5.1).
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

const gotoRoom = async (index) => {
  await page.evaluate((i) => {
    window.__game.scene.getScene('Game').scene.restart({ area: 'LVL-07', room: i });
  }, index);
  await page.waitForTimeout(900);
};

const state = () => page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    area: s.area.id, room: s.roomIndex,
    x: Math.round(s.player.x), y: Math.round(s.player.y),
    hp: s.player.resources.hp, shield: s.player.resources.shield,
    arcos: s.built.decorBack.filter((d) => d.kind === 'arc').length,
    vitrais: s.built.decorBack.filter((d) => d.kind === 'stained').length,
    bancos: s.built.decor.filter((d) => d.kind === 'b').length,
    velas: s.built.decor.filter((d) => d.kind === 'c').length,
    sentinelas: s.built.sentinels.length,
    estacas: s.built.spikes.length,
    plataformas: s.built.platforms.getLength(),
    saves: s.built.saves.length,
    bocas: s.built.sinks.length,
    chegadas: s.built.arrivals.length,
    leste: s.built.eastOpen, oeste: s.built.westOpen,
  };
});

const report = {};

// ---------- 1. a nave carrega com 8 arcos, o vitral e nenhuma plataforma ----------
await gotoRoom(0);
report.nave = await state();

// ---------- 2. as arquitraves de L07-02 são one-way: pousa em cima e não atravessa ----------
await gotoRoom(1);
const oneWay = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const topo = 4 * 64;                       // topo da arquitrave esquerda (x = 4–10)
  s.player.setPosition(7 * 64, topo - 80);   // cai de 80 px acima do topo
  s.player.body.reset(7 * 64, topo - 80);
  await new Promise((r) => setTimeout(r, 1400));
  return {
    yFinal: Math.round(s.player.y),
    topo,
    // o corpo do herói é 2 tiles: pousado no topo, `y` fica 16 px abaixo dele
    pousouNaArquitrave: Math.abs(s.player.y - (topo + 16)) < 8,
    xFinal: Math.round(s.player.x),
    plataformas: s.built.platforms.getLength(),
  };
});
report.arquitraveOneWay = { ...oneWay, esperado: 'pousa no topo em y=256 e não cai para o piso' };

// ---------- 3. as lascas `A` de L07-02 machucam (CEN-001 cíclico) ----------
const lascas = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const dente = s.built.spikes[0];
  s.player.resources.hp = 100;
  s.player.resources.shield = 0;
  const antes = s.player.resources.hp + s.player.resources.shield;
  s.player.setPosition(dente.x, dente.y - 8);
  s.player.body.reset(dente.x, dente.y - 8);
  await new Promise((r) => setTimeout(r, 900));
  return { antes, depois: s.player.resources.hp + s.player.resources.shield, lascas: s.built.spikes.length };
});
report.lascas = { ...lascas, dano: lascas.antes - lascas.depois };

// ---------- 4. o save do Coro existe e responde a `E` ----------
await gotoRoom(2);
const save = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const p = s.built.saves[0];
  s.player.setPosition(p.x + 10, p.y - 20);
  s.player.body.reset(p.x + 10, p.y - 20);
  await new Promise((r) => setTimeout(r, 300));
  const perto = s.nearSavePoint();
  s.interactSave();
  await new Promise((r) => setTimeout(r, 300));
  return { perto, saves: s.built.saves.length, texto: document.querySelector('.panel--text')?.textContent ?? '' };
});
report.saveCoro = save;

// ---------- 5. a rota reta atravessa: nenhuma trava, nenhum sólido no caminho ----------
const rota = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const linhas = [];
  for (let i = 0; i < 5; i++) {
    linhas.push({
      id: s.area.rooms[i].id,
      linhaDeCaminhada: s.area.rooms[i].grid[6].slice(1, -1),
      leste: s.area.rooms[i].grid[6].slice(-1),
    });
  }
  return linhas.map((l) => ({
    id: l.id,
    solidosNoCaminho: [...l.linhaDeCaminhada].filter((c) => c === '#').length,
    saida: l.leste,
  }));
});
report.rotaReta = { ...rota, esperado: '0 sólidos no caminho em todas as 5 salas' };

// ---------- 6. o trifório: passar por baixo NÃO teleporta ----------
await gotoRoom(4);
const passouPorBaixo = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(6 * 64, 4 * 64);      // em cima da passarela, ao lado da boca
  s.player.body.reset(6 * 64, 4 * 64);
  await new Promise((r) => setTimeout(r, 200));
  s.virtuais.add('direita');
  await new Promise((r) => setTimeout(r, 1400));   // anda sob a boca (x = 12)
  s.virtuais.delete('direita');
  await new Promise((r) => setTimeout(r, 400));
  return { sala: s.roomIndex, x: Math.round(s.player.x), y: Math.round(s.player.y) };
});
report.triforioAoPassar = { ...passouPorBaixo, esperado: 'continua em L07-05: a boca exige salto' };

// ---------- 7. o trifório: entrar por salto leva a L07-01 (3,4), de mão única ----------
const entrou = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const boca = s.built.sinks[0];
  const zona = s.triforiumZone.getBounds();
  // O headless roda a ~9 FPS e o ápice amostrado do salto fica em ~95 px (o canônico é
  // 138 px, `core/movement.test.ts`), então o salto real não alcança a boca **aqui**.
  // Este trecho testa o gatilho: colocar o herói dentro da boca equivale ao ápice do salto.
  s.player.setPosition(boca.x, zona.bottom + 40);
  s.player.body.reset(boca.x, zona.bottom + 40);
  await new Promise((r) => setTimeout(r, 200));
  const hpAntes = s.player.resources.hp + s.player.resources.shield;
  s.player.body.velocity.y = -80;            // sobe o último trecho, como no salto
  await new Promise((r) => setTimeout(r, 2600));
  return {
    hpAntes,
    sala: s.roomIndex, area: s.area.id,
    x: Math.round(s.player.x), y: Math.round(s.player.y),
    hpDepois: s.player.resources.hp + s.player.resources.shield,
    texto: document.querySelector('.panel--text')?.textContent ?? '',
  };
});
report.triforioAoEntrar = { ...entrou, esperado: 'L07-01 em x≈224, queda de 3 tiles, sem dano' };

// ---------- 8. a chegada é `arrival_only`: não teleporta de volta ----------
const naoVolta = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const chegada = s.built.arrivals[0];
  if (!chegada) return { erro: 'sem chegada: o trifório não levou de volta a L07-01', sala: s.roomIndex };
  s.player.setPosition(chegada.x, chegada.y - 120);
  s.player.body.reset(chegada.x, chegada.y - 200);
  await new Promise((r) => setTimeout(r, 1600));
  return {
    chegadaEm: { x: Math.round(chegada.x), y: Math.round(chegada.y) },
    sala: s.roomIndex, x: Math.round(s.player.x), y: Math.round(s.player.y),
  };
});
report.chegadaArrivalOnly = { ...naoVolta, esperado: 'continua em L07-01 (não volta para L07-05)' };

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
