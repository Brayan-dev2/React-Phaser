/**
 * Verificação de LVL-09 (`[PÓS]`) no navegador — `node tests/lvl09.mjs`.
 *
 * O setor **não cobra vida**: cobra ar e distância. O que só o runtime prova: a água
 * afoga sem dano (`P-40`), o gancho puxa e pendura (`pull → hang`), o salto do gancho
 * soma horizontal **e** vertical, o canal de 8 tiles devolve à entrada sem o gancho, e o
 * sumidouro exige `interact` e não salva (`LVL-09` §8.1).
 */
import { chromium } from 'playwright';
// `DEC-027`: a entrada do jogo é por **ação** (`scene.virtuais`), não por tecla (`scene.keys`).
// Os testes seguram a ação como o controlo de toque a seguraria — o caminho é o mesmo do jogador.

const URL = process.env.SMOKE_URL ?? 'http://localhost:5173/?skip=menu';
const TILE = 64;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.evaluate(() => { window.__game.loop._cooldown = 0; window.__game.loop._coolDown = 0; });

const gotoRoom = async (index, gancho = false) => {
  await page.evaluate(async ([i, g]) => {
    const s = window.__game.scene.getScene('Game');
    s.scene.restart({ area: 'LVL-09', room: i });
    await new Promise((r) => setTimeout(r, 700));
    const cena = window.__game.scene.getScene('Game');
    if (g) cena.player.unlockHook();
  }, [index, gancho]);
  await page.waitForTimeout(700);
};

const state = () => page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    area: s.area.id, room: s.roomIndex,
    x: Math.round(s.player.x), y: Math.round(s.player.y),
    hp: s.player.resources.hp, shield: s.player.resources.shield,
    plataformas: s.built.platforms.getLength(),
    agua: s.waterRect
      ? { from: Math.round(s.waterRect.x / 64), to: Math.round(s.waterRect.right / 64) - 1,
        topRow: Math.round(s.waterRect.y / 64) }
      : null,
    argolas: s.built.rings.length,
    ratos: s.ratSprites.length,
    sentinelas: s.built.sentinels.length,
    ganchoItem: s.built.items.filter((i) => i.id === 'ITM-008').length,
    temGancho: s.player.abilities.hook,
    estadoGancho: s.player.hook,
    nadando: s.player.swimming,
    folego: Math.round(s.breathMs),
    oeste: s.built.westOpen, leste: s.built.eastOpen,
  };
});

const report = {};

// ---------- 1. a boca: tubo de tijolo, vazamento raso, nenhuma plataforma ----------
await gotoRoom(0);
report.entrada = await state();

// ---------- 2. a galeria cega: 3 tiles úteis, submerso, e afogar NÃO dá dano (§4.3, P-40) ----------
await gotoRoom(1);           // o gancho ainda não existe
const galeria = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.scene.restart({ area: 'LVL-09', room: 2 });
  await new Promise((r) => setTimeout(r, 800));
  const c = window.__game.scene.getScene('Game');
  const r = c.waterRect;
  c.player.setPosition(r.x + 120, r.bottom - 20);
  c.player.body.reset(r.x + 120, r.bottom - 20);
  await new Promise((r2) => setTimeout(r2, 600));
  const submerso = { nadando: c.player.swimming, folego: Math.round(c.breathMs) };
  const hpAntes = c.player.resources.hp + c.player.resources.shield;
  // força o afogamento: 7 s de relógio consumidos de uma vez
  c.breathMs = 1;
  await new Promise((r2) => setTimeout(r2, 900));
  return {
    submerso, hpAntes,
    hpDepois: c.player.resources.hp + c.player.resources.shield,
    voltouParaEntrada: Math.round(c.player.x) < 3 * 64,
    x: Math.round(c.player.x), sala: c.roomIndex,
  };
});
report.galeria = { ...galeria, esperado: 'nadando; ao afogar volta à entrada da sala com hp intacto' };

// ---------- 3. sem o gancho, o canal de 8 tiles não se atravessa: cair devolve à entrada (§4.5) ----------
const semGancho = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.scene.restart({ area: 'LVL-09', room: 4 });
  await new Promise((r) => setTimeout(r, 800));
  const c = window.__game.scene.getScene('Game');
  const tentativa = { gancho: c.player.abilities.hook, x: Math.round(c.player.x) };
  // o jogador tenta pular o canal: vai para o ar sobre o vão e cai
  c.player.setPosition(10 * 64 + 40, 6 * 64);
  c.player.body.reset(10 * 64 + 40, 6 * 64);
  await new Promise((r) => setTimeout(r, 1400));
  return {
    ...tentativa,
    voltouParaEntrada: Math.round(c.player.x) < 3 * 64,
    x: Math.round(c.player.x),
    hp: c.player.resources.hp + c.player.resources.shield,
    sala: c.roomIndex,
  };
});
report.semGancho = { ...semGancho, esperado: 'cai, respawn na entrada, sala continua a 5ª, sem dano' };

// ---------- 4. a casa de bombas já NÃO entrega HAB-04: a rara cai de chefe (`DEC-042`) ----------
await gotoRoom(3);
const entrega = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const antes = s.player.abilities.hook;
  // o pedestal de L09-04 ficou vazio: um item garantido na sala tornava o drop uma formalidade
  const noPedestal = s.built.items.filter((i) => i.id === 'ITM-008').length;
  // o caminho do jogo: o chefe entrega (aqui forçado, como a garantia faz ao 12.º)
  s.soltarItemRaro('ITM-008', 'garantia');
  await new Promise((r) => setTimeout(r, 300));
  return { antes, noPedestal, depois: s.player.abilities.hook, coletados: s.collected.slice() };
});
report.entrega = { ...entrega, esperado: 'pedestal vazio (0 × ITM-008); o drop entrega: hook false → true' };

// ---------- 5. o gancho puxa, pendura e o salto soma horizontal + vertical (§6.2) ----------
await gotoRoom(4, true);
const gancho = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(10 * 64 - 20, 6 * 64);
  s.player.body.reset(10 * 64 - 20, 6 * 64);
  await new Promise((r) => setTimeout(r, 400));
  const antes = { x: Math.round(s.player.x), y: Math.round(s.player.y), estado: s.player.hook };
  s.tryGrapple();
  await new Promise((r) => setTimeout(r, 600));
  const pendurado = {
    estado: s.player.hook, x: Math.round(s.player.x), y: Math.round(s.player.y),
    alvo: s.player.hookTarget ? Math.round(s.player.hookTarget.x) : null,
  };
  // salto do gancho para leste: espaço pressionado na mesma passada do update
  s.virtuais.add('direita');
  // `JustDown` do Phaser lê e zera `_justDown`: é assim que o E2E aperta uma tecla
  s.virtuais.add('pular');
  s.virtualPulso.add('pular');
  await new Promise((r) => setTimeout(r, 240));
  s.virtuais.delete('pular');
  await new Promise((r) => setTimeout(r, 1400));
  s.virtuais.delete('direita');
  return {
    antes, pendurado,
    depois: {
      estado: s.player.hook, x: Math.round(s.player.x), y: Math.round(s.player.y),
      noPisoLeste: Math.round(s.player.x) >= 18 * 64, sala: s.roomIndex,
    },
  };
});
report.gancho = { ...gancho, esperado: 'pull → hang (abaixo da argola) → salto para x ≥ 18 tiles' };

// ---------- 6. sumidouro: `interact` devolve a L09-01 e não salva (§4.6, §8.1) ----------
await gotoRoom(5);
const sumidouro = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const ficha = s.built.sinks[0];
  s.player.setPosition(ficha.x, ficha.y - 40);
  s.player.body.reset(ficha.x, ficha.y - 40);
  await new Promise((r) => setTimeout(r, 400));
  const salaAntes = s.roomIndex;
  const checkpointAntes = s.checkpointRoom;
  s.trySink();
  await new Promise((r) => setTimeout(r, 1200));
  return {
    salaAntes, salaDepois: s.roomIndex,
    // §8.1: o atalho **não** é checkpoint — ele só devolve
    checkpointAntes, checkpointDepois: s.checkpointRoom,
    x: Math.round(s.player.x), y: Math.round(s.player.y),
  };
});
report.sumidouro = { ...sumidouro, esperado: 'de L09-06 para L09-01 em (9,2), sem salvar' };

// ---------- 7. o rato anda 2 tiles e nunca ataca (§1, CEN-075) ----------
await gotoRoom(0);
const rato = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const sprite = s.ratSprites[0];
  const x0 = Math.round(sprite.x);
  const hpAntes = s.player.resources.hp + s.player.resources.shield;
  s.player.setPosition(sprite.x, 7 * 64 - 40);
  s.player.body.reset(sprite.x, 7 * 64 - 40);
  await new Promise((r) => setTimeout(r, 1800));
  return {
    x0, x1: Math.round(sprite.x), hpAntes,
    hpDepois: s.player.resources.hp + s.player.resources.shield,
  };
});
report.rato = { ...rato, esperado: 'o rato se move e o hp não muda por perto dele' };

// ---------- 8. a água da escada e o fôlego: 11 tiles = 5,9 s de natação (§4.6) ----------
const escada = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.scene.restart({ area: 'LVL-09', room: 5 });
  await new Promise((r) => setTimeout(r, 800));
  const c = window.__game.scene.getScene('Game');
  const r = c.waterRect;
  c.player.setPosition(r.x + 30, r.bottom - 20);
  c.player.body.reset(r.x + 30, r.bottom - 20);
  await new Promise((r2) => setTimeout(r2, 400));
  const folegoCheio = Math.round(c.breathMs);
  const t0 = performance.now();
  c.virtuais.add('direita');
  await new Promise((r2) => setTimeout(r2, 2200));
  c.virtuais.delete('direita');
  return {
    folegoCheio, folegoAgora: Math.round(c.breathMs),
    x: Math.round(c.player.x), nadando: c.player.swimming,
    msDecorridos: Math.round(performance.now() - t0),
  };
});
report.escada = { ...escada, esperado: 'fôlego cai enquanto nada e o herói avança para leste' };

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
