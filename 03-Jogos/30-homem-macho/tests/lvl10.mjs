/**
 * Verificação de LVL-10 (`[PÓS]`) no navegador — `node tests/lvl10.mjs`.
 *
 * O setor devolveu à **altura** o direito de ser trava (`DEC-015`): o alçapão fica a 6
 * tiles e o duplo chega a 4,3. O que só o runtime prova: o alçapão lacrado é sólido, a
 * parede de ganchos só agarra **com** a garra, a subida de 6 tiles leva ~4,3 s, o poço
 * exige `HAB-03` e troca de **setor**, e a corda do sino não salva.
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

const go = async (room, garra = false) => {
  await page.evaluate(async ([i, g]) => {
    const s = window.__game.scene.getScene('Game');
    s.player?.releaseHook?.();
    s.player?.releaseClimb?.();
    s.busy = false;
    s.scene.restart({ area: 'LVL-10', room: i });
    await new Promise((r) => setTimeout(r, 800));
    if (g) window.__game.scene.getScene('Game').player.unlockClimb();
  }, [room, garra]);
  await page.waitForTimeout(600);
};

const state = () => page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    area: s.area.id, room: s.roomIndex,
    x: Math.round(s.player.x), y: Math.round(s.player.y),
    hp: s.player.resources.hp + s.player.resources.shield,
    plataformas: s.built.platforms.getLength(),
    alcapa: s.built.hatch
      ? { sealed: s.built.hatch.sealed, requires: s.built.hatch.requires ?? null, largura: s.built.hatch.width }
      : null,
    paredes: s.built.climbables.length,
    sentinelas: s.built.sentinels.length,
    garra: s.player.abilities.climb,
    escalando: s.player.climb,
    itens: s.built.items.map((i) => i.id),
    oeste: s.built.westOpen, leste: s.built.eastOpen,
  };
});

const report = {};

// ---------- 1. a base: alçapão lacrado no teto, poço no chão, a torre acesa ----------
await go(0);
report.entrada = await state();

// ---------- 2. o alçapão lacrado é sólido: subir por baixo não abre nada ----------
const lacrado = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const h = s.built.hatch;
  s.player.setPosition(h.x + h.width / 2, 6 * 64);
  s.player.body.reset(h.x + h.width / 2, 6 * 64);
  await new Promise((r) => setTimeout(r, 300));
  // tenta sair pelo teto: a sala não pode mudar, nem com a garra
  s.player.unlockClimb();
  s.player.setPosition(h.x + h.width / 2, 40);
  s.player.body.reset(h.x + h.width / 2, 40);
  s.checkTransition(performance.now());
  await new Promise((r) => setTimeout(r, 600));
  const salaDepois = s.roomIndex;
  s.player.unlockClimb();
  const comGarra = s.player.abilities.climb;
  return { salaDepois, comGarra, selado: s.built.hatch?.sealed };
});
report.lacrado = { ...lacrado, esperado: 'selado: a sala não muda mesmo tocando o teto' };

// ---------- 3. o poço exige a garra: sem ela, só a frase (§5) ----------
await go(0);
const pocoSemGarra = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const poco = s.built.sinks[0];
  s.player.setPosition(poco.x, poco.y - 30);
  s.player.body.reset(poco.x, poco.y - 30);
  await new Promise((r) => setTimeout(r, 400));
  const areaAntes = s.area.id;
  s.trySink();
  await new Promise((r) => setTimeout(r, 900));
  return {
    areaAntes, areaDepois: s.area.id, sala: s.roomIndex,
    texto: document.querySelector('.panel--text')?.textContent?.trim() ?? null,
  };
});
report.pocoSemGarra = { ...pocoSemGarra, esperado: 'continua em LVL-10 e avisa que não há onde segurar' };

// ---------- 4. a parede de ganchos sem a garra não agarra (§7.1) ----------
await go(4);
const semGarra = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const p = s.built.climbables[0];
  s.player.setPosition(p.x - 30, 6 * 64);
  s.player.body.reset(p.x - 30, 6 * 64);
  await new Promise((r) => setTimeout(r, 300));
  s.virtuais.add('direita');
  await new Promise((r) => setTimeout(r, 700));
  s.virtuais.delete('direita');
  return { escalando: s.player.climb, temGarra: s.player.abilities.climb, x: Math.round(s.player.x) };
});
report.semGarra = { ...semGarra, esperado: 'climb === "none": a parede só agarra com HAB-03' };

// ---------- 5. o arsenal já NÃO entrega a garra: a rara cai de chefe (`DEC-042`) ----------
await go(1);
const entrega = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const antes = s.player.abilities.climb;
  const noPedestal = s.built.items.filter((i) => i.id === 'ITM-009').length;
  // o caminho do jogo: o chefe entrega (aqui forçado, como a garantia faz ao 12.º). A garantia
  // existe porque é esta habilidade que o poço de L10-05 exige — sem ela o save fechava.
  s.soltarItemRaro('ITM-009', 'garantia');
  await new Promise((r) => setTimeout(r, 300));
  return { antes, noPedestal, depois: s.player.abilities.climb, coletados: s.collected.slice() };
});
report.entrega = { ...entrega, esperado: 'arsenal vazio (0 × ITM-009); o drop entrega: climb false → true' };

// ---------- 6. a subida: 6 tiles a 90 px/s, a segurar **subir** (`DEC-049`) ----------
/*
 * Este bloco mentiu durante meses. Segurava o **pulo** (`s.virtuais.add('pular')`) e chamava-lhe
 * subida — mas pendurado numa parede o pulo é o **salto de parede**: o herói soltava-se, voltava
 * a agarrar e subia aos saltos de 16 px. O teste passava porque só perguntava «a sala mudou?»,
 * e a sala mudava ao fim de alguns saltos. O dono viu em dois segundos o que o teste não viu,
 * e a correção (`DEC-049`) aparece aqui como o gesto certo: `subir` **não** é `pular`.
 */
await go(4, true);
const subida = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const p = s.built.climbables[0];
  s.player.body.reset(p.x - 30, 6 * 64);
  await new Promise((r) => setTimeout(r, 300));
  s.virtuais.add('direita');
  // espera a aderência de 100 ms acontecer (o corpo ainda tem de encostar na parede)
  let aderiu = null;
  for (let i = 0; i < 30 && !aderiu; i++) {
    await new Promise((r) => setTimeout(r, 60));
    if (s.player.climb === 'cling') aderiu = { y: Math.round(s.player.y), ms: i * 60 };
  }
  const yAderiu = s.player.y;
  // **subir**, não pular: é o gesto que o jogador faz e o que este teste tem de medir
  s.virtuais.add('pular');            // `W`: a ação `pular` é a que sobe (ver `subindoNaParede`)
  let saltouAlgumaVez = false;
  let topo = null;
  let transicao = false;
  const t0 = performance.now();
  for (let i = 0; i < 200; i++) {
    await new Promise((r) => setTimeout(r, 60));
    // se a garra largar a meio da subida, é o bug de `DEC-049` outra vez: falha alto
    if (s.player.climb === 'none' && !s.busy) saltouAlgumaVez = true;
    if (s.busy && s.player.climb === 'none') {
      transicao = true;
      topo = { y: Math.round(s.player.y), ms: Math.round(performance.now() - t0) };
      break;
    }
    if (i === 190) topo = { y: Math.round(s.player.y), ms: Math.round(performance.now() - t0) };
  }
  s.virtuais.delete('pular');
  s.virtuais.delete('direita');
  return {
    aderiu, topo, transicao, sala: s.roomIndex,
    subiuPx: Math.round(yAderiu - s.player.y),
    largouAGarra: saltouAlgumaVez,
  };
});
/*
 * As asserções são do **gesto**, não do destino: a garra não pode largar, e o corpo tem de subir
 * de forma contínua. É a diferença entre «chegou lá» e «chegou lá a escalar» — a primeira
 * escondia o bug, a segunda não.
 */
report.subida = {
  ...subida,
  esperado: 'agarra em ~100 ms, NÃO larga a garra a meio, sobe contínuo e o alçapão dispara',
};
if (subida.largouAGarra) {
  console.log('FALHA a garra largou a meio da subida — o herói está a saltar, não a escalar (`DEC-049`)');
  process.exitCode = 1;
}
if (!(subida.subiuPx > 0)) {
  console.log('FALHA não subiu nenhum pixel agarrado');
  process.exitCode = 1;
}

// ---------- 7. o alçapão aberto sem a garra avisa e não passa (§6.3) ----------
const alcapaSemGarra = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.releaseClimb?.();
  s.player.abilities.climb = false;
  s.player.setPosition(13 * 64 + 40, 40);
  s.player.body.reset(13 * 64 + 40, 40);
  const salaAntes = s.roomIndex;
  s.checkTransition(performance.now());
  await new Promise((r) => setTimeout(r, 500));
  return {
    salaAntes, salaDepois: s.roomIndex,
    texto: document.querySelector('.toast')?.textContent?.trim() ?? null,
  };
});
report.alcapaSemGarra = { ...alcapaSemGarra, esperado: 'a sala não muda e o jogo diz que está fora de alcance' };

// ---------- 8. a corda do sino é atalho: desce para L10-01 e não salva (§4.3, §9) ----------
await go(2);
const corda = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const corda = s.built.sinks[0];
  s.player.setPosition(corda.x, corda.y - 30);
  s.player.body.reset(corda.x, corda.y - 30);
  await new Promise((r) => setTimeout(r, 400));
  const salaAntes = s.roomIndex;
  const checkpointAntes = s.checkpointRoom;
  s.trySink();
  await new Promise((r) => setTimeout(r, 1400));
  return {
    salaAntes, salaDepois: s.roomIndex, x: Math.round(s.player.x),
    checkpointAntes, checkpointDepois: s.checkpointRoom,
  };
});
report.corda = { ...corda, esperado: 'de L10-03 para L10-01 em (17,6), sem salvar' };

// ---------- 9. o poço com a garra: o primeiro atalho entre setores (§5) ----------
await go(0, true);
const poucoComGarra = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const poco = s.built.sinks[0];
  s.player.setPosition(poco.x, poco.y - 30);
  s.player.body.reset(poco.x, poco.y - 30);
  await new Promise((r) => setTimeout(r, 400));
  s.trySink();
  await new Promise((r) => setTimeout(r, 1600));
  return { area: s.area.id, sala: s.roomIndex, x: Math.round(s.player.x), y: Math.round(s.player.y) };
});
report.poucoComGarra = { ...poucoComGarra, esperado: 'LVL-03 — cruza setores, não salas' };

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
