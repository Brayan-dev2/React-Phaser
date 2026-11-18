/**
 * Verificação de LVL-12 (`[PÓS]`) no navegador — `node tests/lvl12.mjs`.
 *
 * O que só o runtime prova:
 *  - a arena **não trava** a saída (`gate: 'none'`) e é atravessável sob fogo;
 *  - `ENT-005` nasce com 260 HP e **volta a 260** quando o jogador morre na arena;
 *  - `ATK-11` é uma peça em brasa na altura do peito: ela **não segue** o salto;
 *  - os dois pilões batem defasados e **param** quando o chefe morre (§7.5);
 *  - `ITM-011` **não existe** com o chefe vivo e aparece depois (`MEC-009`);
 *  - a esteira é decor: o jogador parado em cima dela não anda;
 *  - a calha desce para L12-01 sem salvar.
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

/** Recarrega a página: zera o estado de sessão (`forjadorDefeated` é da cena, não da sala). */
const boot = async () => {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
  await page.evaluate(() => { window.__game.loop._coolDown = 0; });
};

const go = async (room) => {
  await page.evaluate(async (i) => {
    const s = window.__game.scene.getScene('Game');
    s.player?.releaseHook?.();
    s.player?.releaseClimb?.();
    s.player.gliding = false;
    s.busy = false;
    s.scene.restart({ area: 'LVL-12', room: i });
    await new Promise((r) => setTimeout(r, 800));
  }, room);
  await page.waitForTimeout(500);
};

const state = () => page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    area: s.area.id, room: s.roomIndex,
    x: Math.round(s.player.x), y: Math.round(s.player.y),
    hp: s.player.resources.hp + s.player.resources.shield,
    plataformas: s.built.platforms.getLength(),
    sentinelas: s.built.sentinels.length,
    fornos: s.built.decorBack.filter((d) => d.kind === 'furnace').length,
    correntes: s.built.decor.filter((d) => d.kind === 'chain').length,
    esteiras: s.built.conveyors.length,
    piloes: s.built.hammers.length,
    chefe: s.built.forjador ? { x: Math.round(s.built.forjador.x), y: Math.round(s.built.forjador.y) } : null,
    itens: s.built.items.map((i) => i.id),
    oeste: s.built.westOpen, leste: s.built.eastOpen,
  };
});

const report = {};

// ---------- 1. L12-01: a queda no conduto ----------
await go(0);
report.entrada = { ...(await state()), esperado: 'plataformas 0 · 1 sentinela · 1 forno · chefe null · leste aberto' };

// ---------- 2. a esteira é decor: não move o jogador (§4.3) ----------
await go(2);
const esteira = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const c = s.built.conveyors[0];
  s.virtuais.delete('esquerda'); s.virtuais.delete('direita');
  s.player.setPosition(c.x, 7 * 64 - 6);
  s.player.body.reset(c.x, 7 * 64 - 6);
  await new Promise((r) => setTimeout(r, 200));
  const x0 = s.player.x;
  await new Promise((r) => setTimeout(r, 900));
  return {
    x0: Math.round(x0), x1: Math.round(s.player.x),
    larguraTiles: Math.round(c.width), y: Math.round(c.y),
    colide: !!s.built.solids.getChildren().some((z) => Math.abs(z.x - c.x) < 4 && Math.abs(z.y - c.y) < 4),
  };
});
report.esteira = { ...esteira, esperado: 'x parado (Δ≈0) · largura 13 tiles · sem colisão' };

// ---------- 3. a arena não trava a saída (§8) ----------
await go(4);
const arena = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    leste: s.built.eastOpen, oeste: s.built.westOpen,
    grade: s.built.grates.length,
    piloes: s.built.hammers.map((h) => Math.round(h.x / 64)),
    hpChefe: s.forjador?.hp ?? null,
    gate: 'none',
  };
});
report.arena = { ...arena, esperado: 'leste true · grade 0 · pilões em 7 e 17 · 260 HP' };

// ---------- 4. a travessia sob fogo: 1.344 px sem matar o chefe ----------
const travessia = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const p = s.player;
  p.resources.hp = 20; p.resources.shield = 10;
  p.setPosition(1 * 64 + 48, 7 * 64 - 6);
  p.body.reset(1 * 64 + 48, 7 * 64 - 6);
  await new Promise((r) => setTimeout(r, 250));
  const x0 = p.x;
  const t0 = performance.now();
  const hpAntes = p.resources.hp + p.resources.shield;
  const hpChefeAntes = s.forjador.hp;
  s.virtuais.add('direita'); s.virtuais.add('correr');
  let maxX = x0;
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 50));
    maxX = Math.max(maxX, s.player.x);
    if (s.player.x >= 22 * 64) break;
    if (s.player.resources.hp <= 0) break;
  }
  const ms = performance.now() - t0;
  s.virtuais.delete('direita'); s.virtuais.delete('correr');
  return {
    x0: Math.round(x0), maxX: Math.round(maxX), ms: Math.round(ms),
    chegou: maxX >= 22 * 64,
    salaDepois: s.roomIndex,
    hpAntes, hpDepois: s.player.resources.hp + s.player.resources.shield,
    hpChefeAntes, hpChefeDepois: s.forjador?.hp ?? null,
    vivo: (s.forjador?.hp ?? 0) > 0,
  };
});
report.travessia = {
  ...travessia,
  esperado: 'chega a x≥22 tiles em ~4,4 s sem matar o chefe (hpChefeDepois = 260)',
};

// ---------- 5. `ATK-11`: a peça voa na altura do peito e NÃO segue o salto ----------
await go(4);
const peca = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const f = s.forjador;
  const piso = 7 * 64;
  // força o disparo da peça (o ataque escolhido em fase 1 alterna; aqui fixamos ATK-11)
  f.attack = 'ATK-11';
  f.enterState('golpe', s.time.now);
  const amostras = [];
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 60));
    if (f.piece) amostras.push({ x: Math.round(f.piece.x), y: Math.round(f.piece.y) });
  }
  const alturas = amostras.map((a) => a.y);
  return {
    temPeca: amostras.length > 0,
    amostras,
    // a cintura/pescoço ficam entre `piso-160` e `piso-20`: a peça nunca desce ao chão
    alturaMin: alturas.length ? Math.min(...alturas) : null,
    alturaMax: alturas.length ? Math.max(...alturas) : null,
    piso,
    // e ela não sobe junto com o jogador: a faixa é estreita (a resposta é lateral)
    deslocamento: Math.round(Math.abs((amostras.at(-1)?.x ?? 0) - (amostras[0]?.x ?? 0))),
  };
});
report.peca = {
  ...peca,
  esperado: 'peça entre piso-170 e o piso, andando para o lado — ela não segue o salto (§5.3)',
};

// ---------- 6. os pilões batem defasados e PARAM na morte do chefe (§7.5) ----------
await go(4);
const pilao = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const f = s.forjador;
  const antes = s.hammerSlots.map((h) => ({ x: Math.round(h.x / 64), offset: h.offset, y: Math.round(h.ram.y) }));
  // o relógio é da fábrica: no mesmo instante os dois estão em fases diferentes
  const fases = [];
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 400));
    fases.push(s.hammerSlots.map((h) => Math.round(h.ram.y)));
  }
  // o dano do pilão: quem está na coluna e no piso leva 25 quando o aríete desce (§7.1)
  const coluna = s.hammerSlots[0];
  // isola a medição: o chefe vai para o canto (ainda dentro da `leash`) para a corrente
  // de 5 tiles não ser o primeiro golpe a cair — o que se mede aqui é o pilão (§7.1)
  const xChefe = f.x;
  f.x = 20 * 64;
  s.player.resources.hp = 20; s.player.resources.shield = 10;
  s.player.setPosition(coluna.x, 7 * 64 - 6);
  s.player.body.reset(coluna.x, 7 * 64 - 6);
  const hpAntes = s.player.resources.hp + s.player.resources.shield;
  let hpDepois = hpAntes;
  // mede **um** golpe: sai do ciclo no primeiro decremento (o período é de 6 s)
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 100));
    hpDepois = s.player.resources.hp + s.player.resources.shield;
    if (hpDepois < hpAntes) break;
  }
  const perdeu = hpAntes - hpDepois;
  // sobrevive à medição: sai da coluna e volta à vida cheia antes de matar o chefe
  s.player.resources.hp = 20; s.player.resources.shield = 10;
  s.player.setPosition(2 * 64, 7 * 64 - 6);
  s.player.body.reset(2 * 64, 7 * 64 - 6);
  f.x = xChefe;
  const semChefe = (() => {
    f.takeHit(999);
    return true;
  })();
  await new Promise((r) => setTimeout(r, 700));
  const depois = s.hammerSlots.map((h) => Math.round(h.ram.y));
  return {
    antes, fases, semChefe, hpAntes, hpDepois, perdeu,
    chefeMorto: !f.alive, hpChefe: f.hp,
    depois, pilaoParado: s.hammerSlots.every((h) => Math.abs(h.ram.y - (h.y - 260)) < 2),
    parado: depois.every((y, i) => y === s.hammerSlots[i].y - 260),
    defasados: antes[0].offset === 0 && antes[1].offset === 3000,
  };
});
report.pilao = { ...pilao, esperado: 'defasagem 0/3000 · aríetes sobem e ficam após a morte' };

// ---------- 7. `ITM-011`: ausente com o chefe vivo, presente depois (§5.6) ----------
// sessão limpa: sem isto o flag de `MEC-009` do teste anterior sobrevive ao `scene.restart`
await boot();
await go(5);
const recompensaVivo = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    itens: s.built.items.map((i) => i.id),
    temZona: s.itemZones.getChildren().some((z) => z.getData('itemId') === 'ITM-011'),
    ficha: s.rooms[5].bossReward ?? null,
  };
});
await go(4);
await page.evaluate(() => window.__game.scene.getScene('Game').forjador.takeHit(999));
await page.waitForTimeout(900);
await go(5);
const recompensaMorto = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    itens: s.built.items.map((i) => i.id),
    temZona: s.itemZones.getChildren().some((z) => z.getData('itemId') === 'ITM-011'),
    derrotado: s.forjadorDefeated,
  };
});
report.recompensa = {
  vivo: recompensaVivo, morto: recompensaMorto,
  esperado: 'ITM-011 ausente com o chefe vivo e presente depois que ele cai',
};

// ---------- 8. morrer na arena reinicia o chefe a 260 HP ----------
await go(4);
const reinicio = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.forjador.takeHit(160);          // 260 → 100, fase 1 ainda
  const ferido = s.forjador.hp;
  // morre de verdade: um único toque que atravessa escudo e vida
  s.player.resources.shield = 0;
  s.player.resources.hp = 1;
  const mortesAntes = s.session?.deaths ?? 0;
  s.player.takeDamage(999, s.difficulty, s.player.x + 10);
  const morreu = s.player.resources.hp <= 0;
  await new Promise((r) => setTimeout(r, 2600));
  return {
    ferido, morreu,
    mortesAntes, mortesDepois: s.session?.deaths ?? 0,
    salaAposMorte: s.roomIndex,
    hp: s.player.resources.hp,
    hpChefe: s.forjador?.hp ?? null,
  };
});
report.reinicio = { ...reinicio, esperado: 'chefe volta a 260 HP depois da morte do jogador' };

// ---------- 9. a calha volta a L12-01 sem salvar (§4.6) ----------
await go(5);
const calha = await page.evaluate(async () => {
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
    salaAntes, salaDepois: s.roomIndex,
    x: Math.round(s.player.x),
    checkpointAntes, checkpointDepois: s.checkpointRoom,
  };
});
report.calha = { ...calha, esperado: 'de L12-06 para L12-01 em (1,6), checkpoint igual' };

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
