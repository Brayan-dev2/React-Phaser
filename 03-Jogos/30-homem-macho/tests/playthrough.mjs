/**
 * Playthrough automático L01-01 → L01-06 (`npm run play` com `npm run dev` no ar).
 *
 * Bot burro de propósito: mantém `D`, pula quando há parede à direita ou vão à frente,
 * ataca quando um corpo perigoso está perto. Serve para provar que LVL-01 é atravessável
 * e que o encadeamento para LVL-02 funciona — não substitui playtest humano.
 * LVL-02 (backtracking, gate e senha) é validado por `npm run lvl02`.
 */
import { chromium } from 'playwright';

const OUT = process.env.SMOKE_OUT ?? '/tmp';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(process.env.SMOKE_URL ?? 'http://localhost:5173/?skip=menu', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.evaluate(() => { window.__game.loop._coolDown = 0; });
await page.waitForTimeout(600);

await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  window.__probe = () => {
    const p = s.player, b = p.body;
    // vão à frente: nada sólido/plataforma nos próximos 40 px abaixo dos pés
    const gap = s.physics.overlapRect(p.x + 34, p.y + 40, 44, 46, false, true).length === 0;
    // ameaça à frente: sentinela ativa a menos de 90 px
    let threat = false;
    s.sentinels.children.each((c) => {
      if (c.active && Math.abs(c.x - p.x) < 90) threat = true;
      return true;
    });
    return {
      area: s.area.id,
      room: s.roomIndex, x: Math.round(p.x), y: Math.round(p.y),
      vx: Math.round(b.velocity.x), onGround: b.blocked.down,
      wall: b.blocked.right, gap, threat, hp: p.resources.hp,
      jumps: p.jumpsUsed ?? 0,
      // `DEC-047`: o percurso de LVL-01 já não termina num «fim do recorte» — o jogo segue para os
      // dezesseis setores. O que este teste procura é o **fim da caminhada em LVL-01**: a chegada
      // a LVL-02, que é o que ele sempre mediu de facto.
      done: document.body.innerText.includes('FIM DO RECORTE'),
    };
  };
});

const trail = [];
let jumps = 0;
const t0 = Date.now();
await page.keyboard.down('KeyD');

while (Date.now() - t0 < 150000) {
  const s = await page.evaluate(() => window.__probe());
  const last = trail[trail.length - 1];
  if (!last || last.room !== s.room) {
    trail.push({ room: s.room, at: Math.round((Date.now() - t0) / 1000), x: s.x });
    await page.screenshot({ path: `${OUT}/play-room-${s.room}.png` });
  }
  // o aviso do recorte já não existe; fica a verificação por compatibilidade (nunca dispara)
  if (s.done) { trail.push({ fim: 'FIM DO RECORTE', at: Math.round((Date.now() - t0) / 1000) }); break; }
  if (s.area !== 'LVL-01') { trail.push({ fim: 'entrou em LVL-02', at: Math.round((Date.now() - t0) / 1000) }); break; }

  if (s.threat) { await page.keyboard.press('KeyJ'); }
  if ((s.wall || s.gap) && (s.onGround || s.jumps === 0)) {
    await page.keyboard.down('Space');
    await page.waitForTimeout(230);
    await page.keyboard.up('Space');
    jumps++;
  }
  await page.waitForTimeout(70);
}
await page.keyboard.up('KeyD');
const final = await page.evaluate(() => window.__probe());
const ok = final.area === 'LVL-02' || final.done;
console.log(JSON.stringify({
  ok, trail, jumps,
  final: { area: final.area, room: final.room, hp: final.hp },
  seconds: Math.round((Date.now() - t0) / 1000), errors,
}, null, 2));
await browser.close();
