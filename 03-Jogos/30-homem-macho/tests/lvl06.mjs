/**
 * Verificação de LVL-06 (`[PÓS]`) no navegador — `node tests/lvl06.mjs`.
 *
 * Cobre o que só o runtime prova: nadar é universal, o item de Fôlego fica alcançável
 * **sem** a habilidade (`DEC-010`), a galeria de 19 tiles de L06-05 **falha** com os 6 s
 * base e **passa** com os 20 s de `HAB-06` (`LVL-06` §5/§8.2), afogar não tira vida
 * (`DEC-011` aquático) e `ITM-006` sobrevive à morte (`TST-005`).
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
    window.__events = [];
    window.__game.scene.getScene('Game').scene.restart({ area: 'LVL-06', room: i });
  }, index);
  await page.waitForTimeout(900);
};

const state = () => page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    area: s.area.id, room: s.roomIndex,
    x: Math.round(s.player.x), y: Math.round(s.player.y),
    hp: s.player.resources.hp, shield: s.player.resources.shield,
    breath: s.player.abilities.breath,
    breathMs: Math.round(s.breathMs),
    submerso: s.waterRect ? s.waterRect.contains(s.player.x, s.player.y - 20) : false,
    agua: s.built.water,
    cristais: s.built.decorBack.filter((d) => d.kind === 'crystal').length,
    estacas: s.built.spikes.length,
    coletados: [...s.collected],
    itens: s.built.items.map((i) => i.id),
  };
});

const report = {};

// ---------- 1. a boca da mina carrega com água derivada da ficha ----------
await gotoRoom(0);
report.entrada = await state();

// ---------- 2. L06-04: sem Fôlego, o item é alcançável a nado (exposição 1) ----------
await gotoRoom(3);
const semHabilidade = await state();
const pegouFolgo = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const item = s.built.items.find((i) => i.id === 'ITM-006');
  const antes = { breath: s.player.abilities.breath, breathMs: Math.round(s.breathMs) };
  // caminho real: entra na água e nada até o item, no leito
  s.player.setPosition(item.x - 160, item.y - 24);
  s.player.body.reset(item.x - 160, item.y - 24);
  s.virtuais.add('direita');
  await new Promise((r) => setTimeout(r, 1800));
  s.virtuais.delete('direita');
  await new Promise((r) => setTimeout(r, 400));
  return {
    antes,
    encontrado: Boolean(item),
    breath: s.player.abilities.breath,
    breathMs: Math.round(s.breathMs),
    coletados: [...s.collected],
    submersoAgora: s.waterRect ? s.waterRect.contains(s.player.x, s.player.y - 20) : false,
    hp: s.player.resources.hp,
  };
});
report.itemSemHabilidade = { ...pegouFolgo, antes: semHabilidade.breathMs, esperado: '6 s base → 20 s com HAB-06' };

// ---------- 3. TST-005: o Fôlego sobrevive à morte ----------
const aposMorte = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.takeDamage(999, s.difficulty, s.player.x + 10);
  await new Promise((r) => setTimeout(r, 1600));
  return { breath: s.player.abilities.breath, breathMax: Math.round(s.breathMs), coletados: [...s.collected] };
});
report.folgoAposMorte = aposMorte;

// ---------- 4. L06-05: a galeria de 19 tiles com 6 s de fôlego — falha ----------
await gotoRoom(4);
const galeriaSemHabilidade = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.abilities.breath = false;
  s.breathMs = 6000;
  const inicio = s.built.water ? s.built.water.x + 40 : 2 * 64;
  const fundo = 7 * 64 - 40;
  s.player.setPosition(inicio, fundo);
  s.player.body.reset(inicio, fundo);
  await new Promise((r) => setTimeout(r, 300));
  const hpAntes = s.player.resources.hp + s.player.resources.shield;
  const t0 = performance.now();
  let afogou = false;
  s.virtuais.add('direita');
  // 9 s de travessia pedida: a galeria levaria ~7,6 s a 160 px/s
  for (let i = 0; i < 45; i++) {
    await new Promise((r) => setTimeout(r, 200));
    if (s.drownsInRoom > 0) { afogou = true; break; }
  }
  s.virtuais.delete('direita');
  await new Promise((r) => setTimeout(r, 1200));
  return {
    afogou,
    segundos: Math.round((performance.now() - t0) / 100) / 10,
    hpAntes, hpDepois: s.player.resources.hp + s.player.resources.shield,
    xFinal: Math.round(s.player.x),
    largura: s.built.water ? s.built.water.width : 0,
    atravessou: s.roomIndex !== 4,
    toasts: (window.__events ?? []).filter((e) => e.type === 'game:toast').map((e) => e.text),
  };
});
report.galeriaSemHabilidade = { ...galeriaSemHabilidade, esperado: 'afoga, hp intacto, volta ao início da sala' };

// ---------- 5. L06-05: com 20 s de fôlego — passa ----------
const galeriaComHabilidade = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.abilities.breath = true;
  s.breathMs = 20000;
  const inicio = s.built.water ? s.built.water.x + 40 : 2 * 64;
  const fundo = 7 * 64 - 40;
  s.player.setPosition(inicio, fundo);
  s.player.body.reset(inicio, fundo);
  await new Promise((r) => setTimeout(r, 300));
  const alvo = s.built.water ? s.built.water.x + s.built.water.width : 19 * 64;
  let minMs = s.breathMs;
  s.virtuais.add('direita');
  for (let i = 0; i < 50; i++) {
    await new Promise((r) => setTimeout(r, 200));
    minMs = Math.min(minMs, s.breathMs);
    if (s.player.x >= alvo - 40 || s.roomIndex !== 4) break;
  }
  s.virtuais.delete('direita');
  await new Promise((r) => setTimeout(r, 300));
  return {
    folegoMinimo: Math.round(minMs),
    xFinal: Math.round(s.player.x),
    alvo: Math.round(alvo),
    afogou: s.drownsInRoom > 0,
    chegou: s.player.x >= alvo - 40 || s.roomIndex !== 4,
  };
});
report.galeriaComHabilidade = { ...galeriaComHabilidade, esperado: 'atravessa sem afogar' };

// ---------- 6. o teto da água em L06-04 é sólido: dá para respirar lá em cima ----------
await gotoRoom(3);
const respiro = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.abilities.breath = false;
  const topo = s.waterRect ? s.waterRect.y - 30 : 3 * 64 - 30;
  s.player.setPosition(2 * 64, topo);
  s.player.body.reset(2 * 64, topo);
  await new Promise((r) => setTimeout(r, 600));
  return {
    submerso: s.waterRect ? s.waterRect.contains(s.player.x, s.player.y - 20) : false,
    breathMs: Math.round(s.breathMs),
    aguaTopo: s.waterRect ? s.waterRect.y : null,
  };
});
report.respiroForaDagua = { ...respiro, esperado: 'fora da água → 6000 ms cheios' };

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
