/**
 * Verificação de LVL-02 no navegador (`npm run dev` no ar → `node tests/lvl02.mjs`).
 *
 * Cobre o que o documento do setor promete e não dá para provar só com teste de grade:
 * gate de 3 tiles, ITM-003 permanente após a morte (TST-005), espinhos cíclicos,
 * porta de senha (TST-006) e vão sem dano (DEC-011).
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

/** Reinicia a cena dentro de LVL-02 na sala pedida. */
const gotoRoom = async (index) => {
  await page.evaluate((i) => {
    const s = window.__game.scene.getScene('Game');
    s.scene.restart({ area: 'LVL-02', room: i });
  }, index);
  await page.waitForTimeout(700);
};

const state = () => page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    room: s.roomIndex,
    area: s.area.id,
    x: Math.round(s.player.x),
    y: Math.round(s.player.y),
    hp: s.player.resources.hp,
    doubleJump: s.player.abilities.doubleJump,
    collected: [...s.collected],
    passwordOpen: s.passwordOpen,
    eastOpen: s.built.eastOpen,
    spikes: s.spikeSlots.map((k) => k.dangerous),
    hud: document.querySelector('.hud__room')?.textContent ?? '',
  };
});

const report = {};

// ---------- 1. a área carrega ----------
await gotoRoom(0);
report.entrada = await state();

// ---------- 2. o gate: 3 tiles (192 px) não sobem sem HAB-01 ----------
// O segundo salto é apertado no ápice do primeiro (é assim que o jogador joga);
// medir com `press` solto cortaria o salto variável e mediria menos que o real.
const tryGate = async () => {
  await page.evaluate(() => {
    const s = window.__game.scene.getScene('Game');
    s.player.setPosition(22 * 64 + 32, 7 * 64 - 6); // em pé sob a plataforma do gate
    s.player.body.setVelocity(0, 0);
  });
  await page.waitForTimeout(320);
  const y0 = (await state()).y;
  await page.evaluate(() => {
    const s = window.__game.scene.getScene('Game');
    window.__apex = { min: s.player.y, vy: 0 };
    window.__tick = () => { window.__apex.min = Math.min(window.__apex.min, s.player.y); window.__apex.vy = s.player.body.velocity.y; };
    s.events.on('update', window.__tick);
  });

  await page.keyboard.down('Space'); // primeiro salto, segurado
  for (let i = 0; i < 30; i++) {
    if ((await page.evaluate(() => window.__apex.vy)) > -90) break; // chegou ao ápice
    await page.waitForTimeout(30);
  }
  await page.keyboard.up('Space');
  await page.keyboard.down('Space'); // segundo salto no ápice
  await page.waitForTimeout(150);
  await page.keyboard.up('Space');
  await page.waitForTimeout(1300);

  const apex = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Game');
    s.events.off('update', window.__tick);
    return window.__apex.min;
  });
  return { alturaPx: Math.round(y0 - apex), precisa: 192 };
};
report.gateSemHAB01 = await tryGate();

// ---------- 3. o fragmento entrega HAB-01 (e sobrevive à morte) ----------
await gotoRoom(4);
report.antesDoFragmento = await state();
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const frag = s.built.items.find((i) => i.id === 'ITM-003');
  s.player.setPosition(frag.x, frag.y - 40);
  await new Promise((r) => setTimeout(r, 600));
});
report.depoisDoFragmento = await state();

// morte: dano massivo e respawn no checkpoint
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.takeDamage(999, s.difficulty, s.player.x + 40);
  await new Promise((r) => setTimeout(r, 1400));
});
report.aposMorte = await state();

// ---------- 4. com HAB-01 o mesmo gate passa ----------
await gotoRoom(1);
report.gateComHAB01 = await tryGate();

// ---------- 5. espinhos cíclicos ----------
await gotoRoom(2);
const samples = [];
for (let i = 0; i < 8; i++) { samples.push((await state()).spikes); await page.waitForTimeout(300); }
report.espinhosCiclicos = {
  amostras: samples.length,
  viuAtivoEInativo: samples.some((s) => s.includes(true)) && samples.some((s) => s.includes(false)),
  // o par (x=10,11) e o par (x=18,19) devem estar fora de fase em 0,6 s
  paresDefasados: samples.some((s) => s.length >= 3 && s[0] !== s[2]),
  amostra: samples[0],
};

// ---------- 6. porta de senha (TST-006) ----------
await gotoRoom(6);
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const door = s.built.passwordDoors[0];
  // `setPosition` sozinho não move o corpo do Arcade: no passo seguinte o sprite volta para
  // o corpo e o `E` cai longe da porta. Era a causa da falha intermitente deste teste.
  s.player.setPosition(door.x - 70, 6 * 64 - 6);
  s.player.body.reset(door.x - 70, 6 * 64 - 6);
  await new Promise((r) => setTimeout(r, 400));
});
// `press` faz keydown+keyup quase no mesmo instante: em headless lento o `update` da cena
// pode não correr entre os dois e o `JustDown` do Phaser nunca vê a tecla. Segurar 200 ms
// garante que o passo do jogo acontece com a tecla em baixo.
await page.keyboard.down('KeyE');
await page.waitForTimeout(200);
await page.keyboard.up('KeyE');
await page.waitForTimeout(400);
report.painelAberto = await page.locator('.panel--senha, .panel').count();
report.tituloPainel = await page.locator('.panel__title').first().innerText().catch(() => null);

// ordem errada primeiro
for (const label of ['engrenagem partida', 'mão aberta', 'três traços', 'olho vazado']) {
  await page.locator(`button[aria-label="${label}"]`).click();
}
await page.waitForTimeout(400);
report.aposSenhaErrada = await state();
report.avisoErro = await page.locator('.panel__muted').innerText().catch(() => null);
await page.screenshot({ path: '/tmp/hm-l02-senha-erro.png' });

// ordem certa
for (const label of ['mão aberta', 'engrenagem partida', 'três traços', 'olho vazado']) {
  await page.locator(`button[aria-label="${label}"]`).click();
}
await page.waitForTimeout(600);
report.aposSenhaCerta = await state();
await page.screenshot({ path: '/tmp/hm-l02-senha-ok.png' });

// ---------- 7. vão de L02-06 respawn sem dano (DEC-011) ----------
await gotoRoom(5);
const antesDoVao = await state();
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(10 * 64, 6 * 64); // sobre o vão 1
  await new Promise((r) => setTimeout(r, 1500));
});
await page.waitForTimeout(900);
report.vao = { antes: antesDoVao.hp, depois: (await state()).hp, posicao: (await state()).x };

report.errors = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
