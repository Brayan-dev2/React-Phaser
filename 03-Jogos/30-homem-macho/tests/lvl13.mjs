/**
 * Verificação de LVL-13 (`[PÓS]`) no navegador — `node tests/lvl13.mjs`.
 *
 * O que só o runtime prova — e as três coisas que este setor pode estragar no jogo todo:
 *  1. **quem sobe é a corrente, não o pano**: dentro da coluna sobe a 140 px/s, fora dela o
 *     pano continua a descer a 120 e **não ganha um pixel de altura** (regressão de LVL-11);
 *  2. sem o pano, a coluna **não segura ninguém** — a trava é a conjunção;
 *  3. a queda longa **não dá dano**, salva antes e depois, e cai para 900 ms em `reduce_motion`;
 *  4. o alçapão A volta a L13-01 e o B leva a L13-05 (dois destinos na mesma sala).
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

const go = async (room, pano = false) => {
  await page.evaluate(async ([i, g]) => {
    const s = window.__game.scene.getScene('Game');
    s.player?.releaseHook?.();
    s.player?.releaseClimb?.();
    s.player.gliding = false;
    s.player.body.setAllowGravity(true);
    s.busy = false;
    s.scene.restart({ area: 'LVL-13', room: i });
    await new Promise((r) => setTimeout(r, 800));
    if (g) window.__game.scene.getScene('Game').player.unlockGlide();
  }, [room, pano]);
  await page.waitForTimeout(600);
};

const state = () => page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    area: s.area.id, room: s.roomIndex,
    x: Math.round(s.player.x), y: Math.round(s.player.y),
    hp: s.player.resources.hp + s.player.resources.shield,
    plataformas: s.built.platforms.getLength(),
    sentinelas: s.built.sentinels.length,
    correntes: s.built.updrafts.length,
    alcapoes: s.built.hatches.length,
    estacas: s.built.decorBack.filter((d) => d.kind === 'stake').length,
    fundo: s.built.decorBack.filter((d) => d.kind === 'abyss').length,
    ecos: s.built.decor.filter((d) => d.kind === 'echo').length,
    queda: s.built.longFall,
    itens: s.built.items.map((i) => i.id),
    oeste: s.built.westOpen, leste: s.built.eastOpen,
  };
});

const report = {};

// ---------- 1. a beira: nada de plataforma, estacas, boca e eco ----------
await go(0);
report.beira = { ...(await state()), esperado: '0 plataformas · 1 sentinela · 2 estacas · 2 fundos · 1 eco · boca `o`' };

// ---------- 2. sem o pano, a coluna não segura ninguém (§6.2) ----------
await go(3, false);
const semPano = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const u = s.built.updrafts[1];                 // coluna B: x = 19–21
  const x = u.x + u.width / 2;
  s.player.setPosition(x, 6 * 64 - 6);
  s.player.body.reset(x, 6 * 64 - 6);
  await new Promise((r) => setTimeout(r, 200));
  s.virtuais.add('pular');                 // segura o salto, mas sem a habilidade
  s.player.body.setVelocityY(-560);              // o pulo normal, que é o máximo sem pano
  let minY = s.player.y;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 60));
    minY = Math.min(minY, s.player.y);
  }
  const r = {
    y: Math.round(s.player.y), yMinimo: Math.round(minY),
    subiuPx: Math.round(6 * 64 - minY),
    updraft: s.player.updraft, gliding: s.player.gliding,
    dentro: s.player.updraftZone,
    gravidade: s.player.body.allowGravity,
  };
  s.virtuais.delete('pular');
  return r;
});
report.semPano = { ...semPano, esperado: 'fica no piso, `updraft false`, `gliding false`' };

// ---------- 3. com o pano, a corrente sobe a 140 px/s (§6.3) ----------
await go(3, true);
const subida = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const u = s.built.updrafts[1];
  const x = u.x + u.width / 2;
  s.player.setPosition(x, 6 * 64 - 6);
  s.player.body.reset(x, 6 * 64 - 6);
  await new Promise((r) => setTimeout(r, 200));
  const y0 = s.player.y;
  const t0 = performance.now();
  s.virtuais.add('pular');                 // o pano abre logo depois do pulo
  s.player.body.setVelocityY(-560);              // `canGlide` exige estar no ar
  let amostras = [];
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 60));
    amostras.push({ y: Math.round(s.player.y), vy: Math.round(s.player.body.velocity.y), up: s.player.updraft });
    if (s.player.y < 6 * 64 - 200) break;
  }
  const ms = performance.now() - t0;
  const dy = y0 - s.player.y;
  const subiu = dy;
  s.virtuais.delete('pular');
  const comPano = amostras.filter((a) => a.up);
  return {
    y0: Math.round(y0), yFim: Math.round(s.player.y),
    subiuPx: Math.round(subiu), ms: Math.round(ms),
    velocidadeMedia: Math.round(subiu / (ms / 1000)),
    vyDurante: comPano.length ? Math.round(comPano[Math.floor(comPano.length / 2)].vy) : null,
    updraftLigado: comPano.length > 0,
    gravidadeDesligada: !s.player.body.allowGravity,
    amostras: amostras.slice(0, 6),
  };
});
report.subida = {
  ...subida,
  esperado: 'subiu ~200 px a ~140 px/s com `updraft` ligado e gravidade desligada',
};

// ---------- 4. fora da corrente o pano NÃO ganha altura (regressão de LVL-11) ----------
await go(3, true);
const foraColuna = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  // x = 14 está entre as duas colunas: pano aberto, vento nenhum
  s.player.setPosition(14 * 64, 1 * 64);
  s.player.body.reset(14 * 64, 1 * 64);
  await new Promise((r) => setTimeout(r, 100));
  s.virtuais.add('pular');
  let minY = s.player.y;
  let maxVy = 0;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 60));
    minY = Math.min(minY, s.player.y);
    maxVy = Math.max(maxVy, s.player.body.velocity.y);
  }
  s.virtuais.delete('pular');
  return {
    yInicial: 64, yMinimo: Math.round(minY),
    desceu: Math.round(minY) > 64,       // nunca subiu acima de 64
    vyMaxima: Math.round(maxVy),
    updraft: s.player.updraft,
    gliding: s.player.gliding,
  };
});
report.foraColuna = {
  ...foraColuna,
  esperado: 'desce sempre (vy ≤ 120), `updraft false`: o pano não dá altura em lugar nenhum',
};

// ---------- 5. o alçapão B leva a L13-05 (a trava 13 → 14) ----------
await go(3, true);
const alcapaoB = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const h = s.built.hatches[1];                 // B: 20–21 → L13-05
  const x = h.x + h.width / 2;
  s.player.setPosition(x, 6 * 64 - 6);
  s.player.body.reset(x, 6 * 64 - 6);
  await new Promise((r) => setTimeout(r, 200));
  s.virtuais.add('pular');
  s.player.body.setVelocityY(-560);
  let trocou = false;
  let yMin = s.player.y;
  for (let i = 0; i < 110; i++) {
    await new Promise((r) => setTimeout(r, 80));
    yMin = Math.min(yMin, s.player.y);
    if (s.roomIndex !== 3) { trocou = true; break; }
  }
  s.virtuais.delete('pular');
  await new Promise((r) => setTimeout(r, 700));
  return {
    trocou, salaDestino: s.rooms[s.roomIndex]?.id, index: s.roomIndex,
    x: Math.round(s.player.x), yMinimo: Math.round(yMin), hp: s.player.resources.hp,
  };
});
report.alcapaoB = { ...alcapaoB, esperado: 'de L13-04 para L13-05 (beira alta)' };

// ---------- 6. o alçapão A volta a L13-01 (atalho, não salva) ----------
await go(3, true);
const alcapaoA = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const h = s.built.hatches[0];                 // A: 8–9 → L13-01
  const x = h.x + h.width / 2;
  const ckptAntes = s.checkpointRoom;
  s.player.setPosition(x, 6 * 64 - 6);
  s.player.body.reset(x, 6 * 64 - 6);
  await new Promise((r) => setTimeout(r, 200));
  s.virtuais.add('pular');
  s.player.body.setVelocityY(-560);
  let trocou = false;
  let yMin = s.player.y;
  for (let i = 0; i < 110; i++) {
    await new Promise((r) => setTimeout(r, 80));
    yMin = Math.min(yMin, s.player.y);
    if (s.roomIndex !== 3) { trocou = true; break; }
  }
  s.virtuais.delete('pular');
  await new Promise((r) => setTimeout(r, 700));
  return {
    trocou, salaDestino: s.rooms[s.roomIndex]?.id, index: s.roomIndex,
    x: Math.round(s.player.x), yMinimo: Math.round(yMin),
    ckptAntes, ckptDepois: s.checkpointRoom,
  };
});
report.alcapaoA = { ...alcapaoA, esperado: 'de L13-04 para L13-01, na boca do poço (x ≈ 288)' };

// ---------- 7. a queda longa: 3 s, sem dano, salva antes e depois ----------
await go(1, true);
const queda = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const q = s.built.longFall;
  const hpAntes = s.player.resources.hp + s.player.resources.shield;
  s.player.setPosition(q.x, q.y - 6);
  s.player.body.reset(q.x, q.y - 6);
  await new Promise((r) => setTimeout(r, 300));
  const t0 = performance.now();
  const entrou = s.tryLongFall();
  let salaNova = null;
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (s.roomIndex !== 1) { salaNova = s.roomIndex; break; }
  }
  const ms = performance.now() - t0;
  await new Promise((r) => setTimeout(r, 900));
  return {
    entrou, ms: Math.round(ms), salaDestino: s.rooms[s.roomIndex]?.id,
    hpAntes, hpDepois: s.player.resources.hp + s.player.resources.shield,
    checkpoint: s.checkpointRoom,
  };
});
report.queda = {
  ...queda,
  esperado: 'L13-02 → L13-03: troca de sala em ~2,4 s (total 3 s com o fade de volta), hp igual, checkpoint 2',
};

// ---------- 8. `reduce_motion`: a queda cai para 900 ms e a silhueta sai ----------
await go(1, true);
const reduzido = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.reducedMotion = true;
  const q = s.built.longFall;
  s.player.setPosition(q.x, q.y - 6);
  s.player.body.reset(q.x, q.y - 6);
  await new Promise((r) => setTimeout(r, 300));
  const t0 = performance.now();
  s.tryLongFall();
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 60));
    if (s.roomIndex !== 1) break;
  }
  const ms = performance.now() - t0;
  s.reducedMotion = false;
  return { ms: Math.round(ms), salaDestino: s.rooms[s.roomIndex]?.id };
});
report.reduzido = { ...reduzido, esperado: 'a mesma queda em ≤ 900 ms + folga de montagem' };

// ---------- 9. o eco: 700 ms atrás, e 7 marcas no setor ----------
await go(0);
const eco = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(10 * 64, 6 * 64 - 6);
  s.player.body.reset(10 * 64, 6 * 64 - 6);
  await new Promise((r) => setTimeout(r, 500));
  const fantasma = s.echoGhost;
  const temFantasma = !!fantasma && fantasma.visible;
  s.player.setPosition(15 * 64, 6 * 64 - 6);
  s.player.body.reset(15 * 64, 6 * 64 - 6);
  await new Promise((r) => setTimeout(r, 150));
  const atrasado = fantasma ? Math.round(fantasma.x) : null;   // deve estar atrás do jogador
  await new Promise((r) => setTimeout(r, 900));
  const alcancou = fantasma ? Math.round(fantasma.x) : null;
  return {
    temFantasma, atrasado, alcancou,
    alpha: fantasma?.alpha ?? null, profundidade: fantasma?.depth ?? null,
    marcas: s.built.decor.filter((d) => d.kind === 'echo').length,
  };
});
report.eco = { ...eco, esperado: 'fantasma 700 ms atrás (x≈960 quando o jogador está em 960→960)' };

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
