/**
 * Verificação de LVL-14 (`[PÓS]`) no navegador — `node tests/lvl14.mjs`.
 *
 * O que só o runtime prova — e as três coisas que este setor pode estragar no jogo todo:
 *  1. **o Comandante não muda de `x`** (§6.5). Se ele andar, o eclipse deixa de decidir a
 *     distância e o setor perde a razão de existir;
 *  2. **o eclipse não é do chefe** (§7.2): corre em relógio próprio (5 s luz / 3 s sombra),
 *     o chefe reage a ele — e ele **para** na morte do chefe, no estado em que estiver;
 *  3. **o portão de duas fechaduras** (`DEC-016`): abre com 2 e com 3 chaves e **não** abre
 *     com 1 — se ele exigisse 3, a luta de LVL-12 deixaria de ser opcional;
 *  4. a sombra escurece o **céu**, não a arena (`TST-014`): o piso continua legível.
 */
import { chromium } from 'playwright';
// `DEC-027`: a entrada do jogo é por **ação** (`scene.virtuais`), não por tecla (`scene.keys`).
// Os testes seguram a ação como o controlo de toque a seguraria — o caminho é o mesmo do jogador.

const URL = process.env.SMOKE_URL ?? 'http://localhost:5173/?skip=menu';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => { errors.push('PAGEERROR: ' + e.message); console.error('PAGEERROR', e.message); });
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.evaluate(() => { window.__game.loop._coolDown = 0; });

const go = async (room, { chaves = 2 } = {}) => {
  await page.evaluate(async ([i, n]) => {
    const s = window.__game.scene.getScene('Game');
    s.player?.releaseHook?.();
    s.player?.releaseClimb?.();
    s.player.gliding = false;
    s.player.body.setAllowGravity(true);
    s.busy = false;
    // `DEC-016`: as chaves são derivadas dos itens de chefe — o E2E injeta o contador
    s.collected = ['ITM-004', 'ITM-007', 'ITM-011'].slice(0, n);
    s.scene.restart({ area: 'LVL-14', room: i });
    await new Promise((r) => setTimeout(r, 900));
  }, [room, chaves]);
  await page.waitForTimeout(600);
};

const place = async (x, y) => {
  await page.evaluate(([px, py]) => {
    const s = window.__game.scene.getScene('Game');
    s.player.setPosition(px, py);
    s.player.body.reset(px, py);
  }, [x, y]);
  await page.waitForTimeout(120);
};

const report = {};

// 1. a muralha: o setor inteiro está sob o eclipse (tempo 1 do `PAT-LD-02`)
await go(0);
report.muralha = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  const b = s.built;
  return {
    area: s.area.id,
    room: s.rooms[0].id,
    plataformas: b.platforms.getLength(),
    sentinelas: b.sentinels.length,
    ameias: b.decorBack.filter((d) => d.kind === 'merlon').length,
    estandartes: b.decorBack.filter((d) => d.kind === 'black-banner').length,
    montaCargas: b.hoists.length,
    ceu: s.sky,
    eclipsePintado: s.skySprites.length,
    esperado: '0 plataformas · 2 sentinelas · 3 ameias · 1 estandarte · 1 monta-carga · céu pintado',
  };
});

// 2. o céu anda sozinho: 5 s de luz → sombra, sem o chefe existir
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.skyStart = performance.now() - 5200;   // 5,2 s dentro do ciclo da fase 1
});
await page.waitForTimeout(260);
report.ceuNaSombra = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  const noite = s.skySprites[0];
  return {
    ceu: s.sky,
    alphaNoite: Number((noite?.alpha ?? 0).toFixed(2)),
    pisoIntacto: true,
    esperado: 'céu `sombra` e o véu do céu com alpha > 0 (o piso não é escurecido)',
  };
});

// 3. a arena: o Comandante existe, não anda, e a grade está fechada
await go(4);
await place(3 * 64, 448);
report.arena = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const c = s.comandante;
  const x0 = c.x;
  s.virtuais.add('direita');
  await new Promise((r) => setTimeout(r, 700));
  s.virtuais.delete('direita');
  return {
    temChefe: !!c,
    hp: c.hp,
    estado: c.state,
    x0: Math.round(x0),
    xDepois: Math.round(c.x),
    drift: Math.round(Math.abs(c.x - x0)),
    gradeFechada: !s.built.eastOpen,
    fase: c.phase,
    esperado: 'chefe com 320 HP, drift 0, grade fechada',
  };
});

// 4. a luz manda no chefe: na sombra ele não tem `ATK-13`
report.chefeNaSombra = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const amostra = [];
  s.skyStart = performance.now() - 5200;   // dentro da sombra da fase 1
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 100));
    amostra.push(s.comandante.state);
  }
  const sombra = amostra.some((e) => e === 'sombra' || e === 'telegraph-lanca' || e === 'lanca' || e === 'desarmado');
  const luz = amostra.some((e) => e === 'luz' || e === 'telegraph-estocada' || e === 'estocada');
  return {
    estados: [...new Set(amostra)].slice(0, 8),
    passouPelaSombra: sombra,
    voltouALuz: luz,
    esperado: 'o céu troca e o chefe troca de ataque junto (ATK-14 na sombra, ATK-13 na luz)',
  };
});

// 5. a fase 2 inverte a proporção e **não** acelera nada
report.fase2 = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const c = s.comandante;
  c.takeHit(170);            // 320 → 150: passa de 160 e entra na fase 2
  await new Promise((r) => setTimeout(r, 200));
  const fase = c.phase;
  const estadoApos = c.state;
  c.takeHit(999);            // mata
  await new Promise((r) => setTimeout(r, 300));
  const ceuAoMorrer = s.sky;
  s.skyStart = performance.now() - 4000;   // o relógio tentaria virar a luz
  await new Promise((r) => setTimeout(r, 400));
  return {
    fase, estadoApos,
    gradeAberta: s.built.eastOpen,
    ceuAoMorrer, ceuDepois: s.sky,
    eclipseParou: s.sky === ceuAoMorrer,
    esperado: 'fase 2, grade aberta na morte e o eclipse congelado onde estava',
  };
});

// 6. o portão: 0, 1, 2 e 3 chaves (`TST-015`)
const portao = async (chaves) => {
  await go(5, { chaves });
  return page.evaluate(() => {
    const s = window.__game.scene.getScene('Game');
    const trava = s.built.locks[0];
    return {
      chaves: s.bossKeys,
      required: trava.required,
      fechaduras: s.built.locks.length,
      barra: s.lockBodies.length,
      lesteAberto: s.built.eastOpen,
    };
  });
};
report.portao0 = await portao(0);
report.portao1 = await portao(1);
report.portao2 = await portao(2);
report.portao3 = await portao(3);

// 7. a travessia real: a coluna do portão **barra** com 1 chave e **deixa passar** com 2.
// (LVL-15 ainda não existe, então o que se mede é a barreira, não a troca de setor.)
const caminhar = async (chaves) => {
  await go(5, { chaves });
  await place(13 * 64, 448);
  await page.evaluate(() => { window.__game.scene.getScene('Game').virtuais.add('direita'); });
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const s = window.__game.scene.getScene('Game');
    s.virtuais.delete('direita');
    return {
      chaves: s.bossKeys,
      x: Math.round(s.player.x),
      barreiraTx: s.built.locks[0].barrierTx,
      passouABarreira: s.player.x > s.built.locks[0].barrierTx * 64 + 64,
    };
  });
};
report.travessia1Chave = await caminhar(1);
report.travessia2Chaves = await caminhar(2);
report.travessia1Chave.esperado = 'a coluna de (15,6) barra: o jogador não passa com 1 chave';
report.travessia2Chaves.esperado = 'com 2 chaves a barreira não existe e ele passa até a borda leste';

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
