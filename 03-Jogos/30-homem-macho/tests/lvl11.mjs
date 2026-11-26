/**
 * Verificação de LVL-11 (`[PÓS]`) no navegador — `node tests/lvl11.mjs`.
 *
 * O setor entrega `HAB-07` e **não mata**. O que só o runtime prova: o planeio não liga no
 * chão, trava a queda em 120 px/s sem dar um pixel de altura, um vão de 11 tiles é
 * intransponível sem o estandarte e atravessável com ele + o duplo, cair custa **tempo e
 * não vida** (`DEC-011`), e o conduto da chaminé devolve à orla sem salvar.
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

const go = async (room, estandarte = false) => {
  await page.evaluate(async ([i, g]) => {
    const s = window.__game.scene.getScene('Game');
    s.player?.releaseHook?.();
    s.player?.releaseClimb?.();
    s.player.gliding = false;
    s.busy = false;
    s.scene.restart({ area: 'LVL-11', room: i });
    await new Promise((r) => setTimeout(r, 800));
    if (g) window.__game.scene.getScene('Game').player.unlockGlide();
  }, [room, estandarte]);
  await page.waitForTimeout(600);
};

const state = () => page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    area: s.area.id, room: s.roomIndex,
    x: Math.round(s.player.x), y: Math.round(s.player.y),
    hp: s.player.resources.hp + s.player.resources.shield,
    plataformas: s.built.platforms.getLength(),
    argolas: s.built.rings.length,
    sentinelas: s.built.sentinels.length,
    estandarte: s.player.abilities.glide,
    itens: s.built.items.map((i) => i.id),
    trepadeiras: s.built.decor.filter((d) => d.kind === 'vine').length,
    flores: s.built.decor.filter((d) => d.kind === 'flower').length,
    flora: s.built.decorBack.filter((d) => d.kind === 'flora').length,
    estatua: s.built.decorBack.filter((d) => d.kind === 'statue').length,
    oeste: s.built.westOpen, leste: s.built.eastOpen,
  };
});

const report = {};

// ---------- 1. a orla: nada de plataforma, nada de argola ----------
await go(0);
report.entrada = { ...(await state()), esperado: 'plataformas 0 · argolas 0 · 1 sentinela · estátua sem rosto' };

// ---------- 2. a estufa já NÃO entrega o estandarte: a rara cai de chefe (`DEC-042`) ----------
await go(1);
const entrega = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const antes = s.player.abilities.glide;
  const vao = s.built.roomGrid[7].split('').filter((c) => c !== '#').length;
  const noPedestal = s.built.items.filter((i) => i.id === 'ITM-010').length;
  // o caminho do jogo: o chefe entrega (aqui forçado, como a garantia faz ao 12.º). Sem a garantia,
  // esta — a rara mais exigida do jogo — podia faltar dentro de `CEN-096` (LVL-13).
  s.soltarItemRaro('ITM-010', 'garantia');
  await new Promise((r) => setTimeout(r, 300));
  return {
    antes, noPedestal, depois: s.player.abilities.glide,
    coletados: s.collected.slice(), vaoTiles: vao,
  };
});
report.entrega = { ...entrega, esperado: 'estufa vazia (0 × ITM-010); o drop entrega: glide false → true em qualquer sala; vão de 11 tiles a partir de x=9' };

// ---------- 3. o planeio NÃO liga no chão (no chão não é andar lento) ----------
await go(1);
const noChao = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.unlockGlide();
  s.virtuais.add('pular');
  await new Promise((r) => setTimeout(r, 700));
  const chao = { gliding: s.player.gliding, y: Math.round(s.player.y) };
  // anda com o pano "aberto": a velocidade horizontal não pode mudar (o pano não acelera)
  s.virtuais.add('direita');
  await new Promise((r) => setTimeout(r, 500));
  const andando = Math.round(s.player.body.velocity.x);
  s.virtuais.delete('direita');
  s.virtuais.delete('pular');
  return { ...chao, andando };
});
report.noChao = { ...noChao, esperado: 'gliding false; andar continua 220 px/s' };

// ---------- 4. no ar: trava a queda em 120 px/s e não ganha UM pixel de altura ----------
await go(1);
const noAr = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const p = s.player;
  p.unlockGlide();
  p.setPosition(4 * 64, 2 * 64);
  p.body.reset(4 * 64, 2 * 64);
  p.body.setVelocity(0, 0);
  await new Promise((r) => setTimeout(r, 150));       // começa a cair
  s.virtuais.add('pular');
  const inicio = { y: p.y, t: performance.now() };
  let menorY = p.y;
  let piorVy = 0;
  let planeou = false;
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (p.gliding) planeou = true;
    menorY = Math.min(menorY, p.y);
    piorVy = Math.max(piorVy, p.body.velocity.y);
  }
  const fim = { y: p.y, t: performance.now() };
  s.virtuais.delete('pular');
  const segundos = Math.max(0.001, (fim.t - inicio.t) / 1000);
  return {
    planeou,
    vyTeto: Math.round(piorVy),
    descidaPxS: Math.round((fim.y - inicio.y) / segundos),   // a ficha pede 120
    subiuAlgumPixel: menorY < inicio.y - 0.5,
  };
});
report.noAr = { ...noAr, esperado: 'planeou true · vy nunca passa de 120 · subiuAlgumPixel false' };

// ---------- 5. soltar o pano volta a cair na hora, sem cooldown (§7.1) ----------
const soltar = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const p = s.player;
  p.setPosition(4 * 64, 2 * 64);
  p.body.reset(4 * 64, 2 * 64);
  p.body.setVelocity(0, 400);
  s.virtuais.add('pular');
  await new Promise((r) => setTimeout(r, 300));
  const comPano = Math.round(p.body.velocity.y);
  s.virtuais.delete('pular');
  await new Promise((r) => setTimeout(r, 300));
  const semPano = Math.round(p.body.velocity.y);
  return { comPano, semPano, gliding: p.gliding };
});
report.soltar = { ...soltar, esperado: 'comPano = 120 → semPano > 300 e gliding false' };

// ---------- 6. o alcance do pano: a mesma altura, com e sem o estandarte ----------
/**
 * A prova determinística do `HAB-07`: o jogador é largado a uma altura fixa na beirada do
 * vão, correndo a 308 px/s. **Sem o pano** a gravidade de 1.100 px/s² come o vão em 0,7 s;
 * **com o pano** a descida é de 120 px/s e o mesmo vão leva 2,5 s para ser cruzado.
 *
 * Isto é a ficha inteira em duas linhas: planar não acelera, não sobe e não dá impulso —
 * só troca altura por tempo, e tempo por distância.
 */
const lancamento = (arg) => page.evaluate(async ({ x0, y0, pano }) => {
  const s = window.__game.scene.getScene('Game');
  const p0 = s.player;
  const hpAntes = p0.resources.hp + p0.resources.shield;
  p0.setPosition(x0, y0);
  p0.body.reset(x0, y0);
  s.virtuais.add('direita');
  s.virtuais.add('correr');
  if (pano) s.virtuais.add('pular'); else s.virtuais.delete('pular');
  p0.body.setVelocity(308, 0);                 // sai a correr, sem impulso vertical
  let planeou = false;
  let maxX = x0;
  let caiu = false;
  let pousou = false;
  let respawn = false;
  let yFinal = y0;
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 60));
    const q = s.player;
    if (q !== p0) { respawn = true; yFinal = Math.round(q.y); break; }   // respawn troca o corpo
    if (q.gliding) planeou = true;
    maxX = Math.max(maxX, q.x);
    if (q.y > 7 * 64 + 40) caiu = true;
    yFinal = Math.round(q.y);
    if (q.grounded && i > 2) { pousou = true; break; }
  }
  s.virtuais.delete('direita');
  s.virtuais.delete('correr');
  s.virtuais.delete('pular');
  return {
    planeou, caiu, pousou, respawn,
    x: Math.round(maxX), y: yFinal, sala: s.roomIndex,
    hpAntes, hpDepois: s.player.resources.hp + s.player.resources.shield,
  };
}, arg);

await go(1);
report.semPano = {
  ...(await lancamento({ x0: 8 * 64 + 24, y0: 150, pano: false })),
  esperado: 'sem estandarte cai no vão de 11 tiles e volta sem perder vida (DEC-011)',
};

await go(1, true);
report.comPano = {
  ...(await lancamento({ x0: 8 * 64 + 24, y0: 150, pano: true })),
  esperado: 'com estandarte plana e pousa no banco leste do MESMO vão (x > 1.280)',
};

// ---------- 7. a trava: o vão de 13 tiles de L11-04, o mais largo do jogo ----------
await go(3, true);
report.trava = {
  ...(await lancamento({ x0: 13 * 64 + 24, y0: 120, pano: true })),
  esperado: 'com estandarte cruza os 832 px e pousa em x > 1.664',
};

// ---------- 8. a travessia jogável: salto, duplo no ápice, pano na descida ----------
/** Três tentativas: o timing do duplo depende do FPS do headless, o alcance não. */
const jogavel = (arg) => page.evaluate(async ({ x0, meta, tentativas }) => {
  const s = window.__game.scene.getScene('Game');
  const resultados = [];
  for (let t = 0; t < tentativas; t++) {
    const p0 = s.player;
    p0.setPosition(x0, 6 * 64);
    p0.body.reset(x0, 6 * 64);
    s.virtuais.add('direita');
    s.virtuais.add('correr');
    s.virtuais.add('pular');               // o pano abre assim que começar a cair
    p0.body.setVelocity(308, -560);
    // segundo salto **quase** no ápice: com FPS baixo o `vy` já passou de zero quando o
    // polling chega, e 80 px/s de margem vale mais que 40 px de altura perdida
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 16));
      if (s.player !== p0 || s.player.body.velocity.y >= -80) break;
    }
    if (s.player === p0) s.player.body.setVelocity(308, -560);
    let maxX = x0;
    let pousou = false;
    let respawn = false;
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 60));
      const q = s.player;
      if (q !== p0) { respawn = true; break; }
      maxX = Math.max(maxX, q.x);
      if (q.grounded && i > 2) { pousou = true; break; }
    }
    s.virtuais.delete('direita');
    s.virtuais.delete('correr');
    s.virtuais.delete('pular');
    resultados.push({ tentativa: t + 1, pousou, respawn, x: Math.round(maxX) });
    if (pousou && maxX > meta) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  return { tentativas: resultados, passou: resultados.some((r) => r.pousou && r.x > meta) };
}, arg);

await go(1, true);
report.jogavel11 = {
  ...(await jogavel({ x0: 8 * 64 + 24, meta: 19 * 64, tentativas: 3 })),
  esperado: 'saltar + duplo no ápice + pano atravessa o vão de 11 tiles e pousa',
};

await go(3, true);
report.jogavel13 = {
  ...(await jogavel({ x0: 13 * 64 + 24, meta: 26 * 64, tentativas: 5 })),
  esperado: 'o mesmo movimento cruza os 13 tiles da trava de 11 → 12',
};

// ---------- 9. o conduto: mão única para a orla, e NÃO salva (§4.5, §9) ----------
await go(4);
const conduto = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const boca = s.built.sinks[0];
  s.player.setPosition(boca.x, boca.y - 30);
  s.player.body.reset(boca.x, boca.y - 30);
  await new Promise((r) => setTimeout(r, 400));
  const salaAntes = s.roomIndex;
  const checkpointAntes = s.checkpointRoom;
  s.trySink();
  await new Promise((r) => setTimeout(r, 1500));
  return {
    salaAntes, salaDepois: s.roomIndex, x: Math.round(s.player.x),
    checkpointAntes, checkpointDepois: s.checkpointRoom,
  };
});
report.conduto = { ...conduto, esperado: 'de L11-05 para L11-01 em (1,6), checkpoint igual' };

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
