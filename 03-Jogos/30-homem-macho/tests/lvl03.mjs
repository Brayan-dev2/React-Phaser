/**
 * Verificação de LVL-03 no navegador (`npm run dev` no ar → `node tests/lvl03.mjs`).
 *
 * Cobre o que o documento do setor promete e não dá para provar só com teste de grade:
 * chefe com 200 HP e barra (VIS-007), saída trancada até `boss_defeated`,
 * pilar quebrável (ATK-03 → 1200 ms de aturdimento), dano de 20 por investida,
 * checkpoint na entrada da arena (DEC-012), ITM-004 e conclusão do MVP.
 */
import { chromium } from 'playwright';

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
    window.__game.scene.getScene('Game').scene.restart({ area: 'LVL-03', room: i });
  }, index);
  await page.waitForTimeout(700);
};

const state = () => page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    area: s.area.id,
    room: s.roomIndex,
    x: Math.round(s.player.x),
    hp: s.player.resources.hp,
    eastOpen: s.built.eastOpen,
    boss: s.boss ? { hp: s.boss.hp, state: s.boss.state, phase: s.boss.phase } : null,
    pillars: s.built.pillars.map((p) => p.zones.filter((z) => z.active).length),
    collected: [...s.collected],
    bag: [...s.bag],
    bar: document.querySelector('.bossbar')?.getAttribute('aria-label') ?? null,
    events: window.__events,
  };
});

const report = {};

// ---------- 1. a arena carrega com o chefe inteiro ----------
await gotoRoom(1);
const arena = await state();
report.arena = { area: arena.area, boss: arena.boss, pillars: arena.pillars, bar: arena.bar };

// ---------- 2. a saída está trancada mesmo com `+` na coluna final ----------
report.saidaTrancada = { eastOpen: arena.eastOpen, esperado: false };

// ---------- 3. dano do jogador no chefe: 3 golpes ----------
const hit = async (times) => {
  for (let i = 0; i < times; i++) {
    await page.evaluate(() => {
      const s = window.__game.scene.getScene('Game');
      s.boss.takeHit(20);
    });
    await sleep(120);
  }
};
await hit(3);
const after = await state();
report.danoNoChefe = { hp: after.boss.hp, esperado: 140, bar: after.bar };

// ---------- 4. a investida que acerta o jogador tira 20 (× 1,00 médio) ----------
// Rota real: o jogador fica no eixo do chefe e espera um ciclo inteiro
// (telegraph 800 ms + investida 620 ms). Sem mexer no estado da FSM.
const antesDoDano = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.player.resources.hp = 100;
  s.player.resources.shield = 0;
  s.player.setPosition(s.boss.x - 200, 7 * 64 - 40);
  s.player.body.reset(s.boss.x - 200, 7 * 64 - 40);
  return { hp: s.player.resources.hp, bossX: Math.round(s.boss.x) };
});
await sleep(4200);
const hurt = await state();
report.danoDoChefe = { antes: antesDoDano.hp, hp: hurt.hp, esperado: '< 100', estado: hurt.boss.state };

// ---------- 5. pilar quebrado → aturdimento de 1200 ms ----------
const pillar = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.boss.setPosition(s.player.x + 400, 7 * 64);
  s.boss.state = 'investida';
  s.boss.dangerous = true;
  const zone = s.built.pillars[0].zones[0];
  s.bossHitsPillar(s.boss, zone);         // mesma rota do collider
  return {
    state: s.boss.state,
    zonasVivas: s.built.pillars[0].zones.filter((z) => z.active).length,
    zonasTotais: s.built.pillars[0].zones.length,
  };
});
const stunMs = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const t0 = performance.now();
  while (s.boss.state === 'atordoado' && performance.now() - t0 < 3000) await new Promise((r) => setTimeout(r, 50));
  return Math.round(performance.now() - t0);
});
report.pilar = { ...pillar, stunMs, esperado: 'state=atordoado, zonas=0, ~1200 ms' };

// ---------- 6. morte do chefe → saída abre, barra some, 200 HP no próximo respawn ----------
const dead = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.boss.takeHit(999);
  await new Promise((r) => setTimeout(r, 400));
  return { state: s.boss.state, eastOpen: s.built.eastOpen, bar: document.querySelector('.bossbar') !== null, events: window.__events };
});
report.morte = dead;

// ---------- 7. `MEC-009` não roda duas vezes (um único "O GUARDIÃO CAIU") ----------
const twice = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  const caiu = () => (window.__events ?? []).filter((e) => e.type === 'game:toast' && e.text === 'O GUARDIÃO CAIU').length;
  const before = caiu();
  s.boss.takeHit(999);
  s.boss.takeHit(999);
  return { before, after: caiu() };
});
report.idempotencia = twice;

// ---------- 8. ITM-004 na sala seguinte e ponto de salvamento ----------
await gotoRoom(2);
const item004 = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const item = s.built.items.find((i) => i.id === 'ITM-004');
  if (!item) return { encontrado: false, bag: [...s.bag] };
  s.player.setPosition(item.x, item.y - 40);
  s.player.body.reset(item.x, item.y - 40);
  await new Promise((r) => setTimeout(r, 800));
  return { encontrado: true, bag: [...s.bag], hud: document.querySelector('.hud__slots')?.textContent ?? null };
});
report.item004 = item004;

// ---------- 10. MEC-008: 3 mortes na arena → oferta recusável → dano de 15 ----------
await gotoRoom(1);
const morrer = async () => {
  await page.evaluate(() => {
    const s = window.__game.scene.getScene('Game');
    s.player.takeDamage(999, s.difficulty, s.player.x + 10);
  });
  await sleep(1300);   // respawn no checkpoint da arena (0,76 s) + folga
};
await morrer(); await morrer(); await morrer();
const oferta = await page.evaluate(() => {
  const el = document.querySelector('[aria-label="Oferta de dificuldade"]');
  return { apareceu: el !== null, texto: el?.textContent?.replace(/\s+/g, ' ').slice(0, 120) ?? null };
});
await page.click('[aria-label="Oferta de dificuldade"] .panel__btn');
await sleep(400);
const aceitou = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.player.resources.hp = 100; s.player.resources.shield = 0;
  const antes = s.player.resources.hp;
  s.player.takeDamage(20, s.difficulty, s.player.x + 10);   // 20 × 0,75 no fácil = 15
  return { dificuldade: s.difficulty, antes, depois: s.player.resources.hp };
});
report.mec008 = { ...oferta, ...aceitou, esperado: 'difficulty=easy, dano 20→15' };

// ---------- 9. a porta dourada **segue para LVL-04** (`DEC-047`) ----------
/*
 * Era aqui que o jogo acabava: a porta dourada mostrava «FIM DO RECORTE» e devolvia ao menu. Com a
 * campanha aberta, atravessá-la é entrar no Bosque das Cinzas — e o jogo **não** pode declarar-se
 * terminado a meio. A conclusão do jogo mudou-se para o trono de LVL-16 (`npm run campanha`).
 */
await gotoRoom(3);
const end = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(s.built.worldWidth - 20, 6 * 64);
  const limite = performance.now() + 15000;
  while (s.area.id === 'LVL-03' && performance.now() < limite) {
    await new Promise((r) => setTimeout(r, 100));
  }
  return {
    area: s.area.id,
    sala: s.rooms[s.roomIndex].id,
    completou: (window.__events ?? []).filter((e) => e.type === 'game:completed').length,
    overlay: document.querySelector('[aria-label="Fim do recorte"]')?.textContent?.slice(0, 40) ?? null,
  };
});
report.conclusao = end;

// ---------- 11. relatório de sessão: TTK medido e painel com JSON (P-29) ----------
await gotoRoom(1);
const relatorio = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  await new Promise((r) => setTimeout(r, 700));   // tempo de luta real antes do golpe final
  s.boss.takeHit(999);
  await new Promise((r) => setTimeout(r, 250));
  s.finishSlice();                                 // fecha a sessão e publica `game:metrics`
  await new Promise((r) => setTimeout(r, 350));
  return {
    ttkMs: s.session.fights[0]?.ms ?? null,
    ganhou: s.session.fights[0]?.won ?? null,
    painel: document.querySelector('.report')?.textContent?.replace(/\s+/g, ' ').slice(0, 150) ?? null,
  };
});
/*
 * `DEC-047`: o painel `.report` deixou de existir neste setor — ele era o «FIM DO RECORTE», e o
 * relatório de sessão passou para o `EndScreen` do trono de LVL-16 (`npm run campanha` verifica-o
 * lá). Aqui fica o que é deste setor: o TTK é **medido** e a luta é ganha.
 */
report.relatorio = { ...relatorio, esperado: 'ttkMs > 0, ganhou=true (o painel é do fim, em LVL-16)' };

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
