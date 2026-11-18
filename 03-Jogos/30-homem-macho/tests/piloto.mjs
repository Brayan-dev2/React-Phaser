/**
 * **O censo do piloto, medido ao vivo** (`DEC-048`).
 *
 * Os testes unitários provam a grade; este prova o **jogo**. A diferença não é académica: uma
 * grade com três arquétipos pode chegar à cena e todos os corpos nascerem iguais (foi o que
 * aconteceu enquanto o `LevelBuilder` não lia `Room.variantes`), e um atirador pode estar a
 * atirar para o lado errado sem que nenhum teste de dados note.
 *
 * Mede, sala a sala: quantos corpos existem, de que arquétipo, e — nas salas com atirador — se o
 * projétil chega a sair e a que velocidade. Não mede diversão; mede existência.
 *
 * `node tests/piloto.mjs` com o dev server no ar.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:5173';
const OUT = process.env.SMOKE_OUT ?? '/tmp';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

let falhas = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`OK   ${msg}`);
  else { console.log(`FALHA ${msg}`); falhas++; }
};

await page.goto(`${BASE}/?skip=menu`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game?.scene?.getScene('Game')?.area, null, { timeout: 20000 });

/** Entra numa sala e espera que a cena esteja montada. */
const irPara = async (sala) => {
  await page.evaluate((s) => {
    const cena = window.__game.scene.getScene('Game');
    cena.scene.restart({ area: 'LVL-01', room: s });
  }, sala);
  await page.waitForFunction(
    (s) => {
      const c = window.__game.scene.getScene('Game');
      return c.roomIndex === s && !c.busy && c.sentinels;
    },
    sala, { timeout: 15000 },
  );
  await page.waitForTimeout(400);
};

/** O que está de facto no mundo, lido dos corpos e não da grade. */
const censoDaSala = () => page.evaluate(() => {
  const c = window.__game.scene.getScene('Game');
  const corpos = c.sentinels.getChildren().filter((o) => o.active);
  return {
    total: corpos.length,
    por: corpos.reduce((acc, o) => {
      const a = o.arquetipo ?? 'sentinela';
      acc[a] = (acc[a] ?? 0) + 1;
      return acc;
    }, {}),
    danos: [...new Set(corpos.map((o) => o.dano))],
    texturas: [...new Set(corpos.map((o) => o.texture.key))],
  };
});

// ---------- 1. o censo de cada sala ----------
const ESPERADO = [
  { sala: 0, nome: 'L01-01 abertura', total: 0 },
  { sala: 1, nome: 'L01-02 ensina mover', total: 0 },
  { sala: 2, nome: 'L01-03 ensina atacar', total: 2, sentinela: 2 },
  { sala: 3, nome: 'L01-04 ensina pular + combate', total: 5, sentinela: 2, atirador: 2, voador: 1 },
  { sala: 4, nome: 'L01-05 quarto seguro', total: 0 },
  { sala: 5, nome: 'L01-06 saída', total: 1, atirador: 1 },
];

const censo = {};
for (const e of ESPERADO) {
  await irPara(e.sala);
  const c = await censoDaSala();
  censo[e.nome] = c;
  ok(c.total === e.total, `${e.nome}: ${c.total} corpo(s) no mundo (esperado ${e.total})`);
  if (e.sentinela) ok(c.por.sentinela === e.sentinela, `${e.nome}: ${c.por.sentinela ?? 0} Sentinela(s)`);
  if (e.atirador) ok(c.por.atirador === e.atirador, `${e.nome}: ${c.por.atirador ?? 0} atirador(es)`);
  if (e.voador) ok(c.por.voador === e.voador, `${e.nome}: ${c.por.voador ?? 0} voador(es)`);
}

// ---------- 2. os três arquétipos têm corpo próprio ----------
await irPara(3);
const corpos = await page.evaluate(() => {
  const c = window.__game.scene.getScene('Game');
  return c.sentinels.getChildren().filter((o) => o.active).map((o) => ({
    arq: o.arquetipo, tex: o.texture.key, dano: o.dano, hp: o.hp,
    gravidade: o.body?.allowGravity,
  }));
});
const sent = corpos.find((c) => c.arq === 'sentinela');
const atir = corpos.find((c) => c.arq === 'atirador');
const voa = corpos.find((c) => c.arq === 'voador');
ok(sent?.tex === 'sentinel', `a Sentinela usa a textura de sempre (${sent?.tex})`);
ok(atir?.tex === 'enemy_shooter', `o atirador tem corpo próprio (${atir?.tex})`);
ok(voa?.tex === 'enemy_flyer', `o voador tem corpo próprio (${voa?.tex})`);
ok(voa?.gravidade === false, 'o voador não tem gravidade — é o que o distingue do resto');
ok(sent?.gravidade === true, 'a Sentinela continua presa ao chão');
ok(voa?.dano === 10 && sent?.dano === 20, `o dano é do arquétipo, não uma constante (voador ${voa?.dano}, sentinela ${sent?.dano})`);

// ---------- 3. o atirador atira ----------
const tiro = await page.evaluate(async () => {
  const c = window.__game.scene.getScene('Game');
  const atirador = c.sentinels.getChildren().find((o) => o.arquetipo === 'atirador');
  if (!atirador) return { semAtirador: true };
  // pôr o jogador à frente dele, dentro do alcance, e deixar o ciclo correr
  c.player.body.reset(atirador.x + 220, atirador.y - 6);
  const antes = c.children.list.filter((o) => o.texture?.key === 'proj_enemy').length;
  const limite = performance.now() + 8000;
  let viu = 0;
  while (performance.now() < limite) {
    await new Promise((r) => setTimeout(r, 100));
    const balas = c.children.list.filter((o) => o.texture?.key === 'proj_enemy');
    viu = Math.max(viu, balas.length);
    if (viu > antes) {
      const b = balas[0];
      return { saiu: true, vx: Math.round(b.body.velocity.x), gravidade: b.body.allowGravity, estado: atirador.estado };
    }
  }
  return { saiu: false, estado: atirador.estado, hpJogador: c.player.resources.hp };
});
ok(tiro.semAtirador !== true, 'há um atirador na sala para testar');
ok(tiro.saiu === true, `o atirador dispara (estado ${tiro.estado}, vx ${tiro.vx})`);
ok(tiro.gravidade === false, 'o tiro não cai — é um projétil reto');
await page.screenshot({ path: `${OUT}/piloto-01-atirador.png` });

// ---------- 4. a sala é maior que o ecrã e a câmara rola ----------
await irPara(3);
const cam = await page.evaluate(async () => {
  const c = window.__game.scene.getScene('Game');
  const larguraDoMundo = c.built.worldWidth;
  c.player.body.reset(64 * 2, 7 * 64 - 6);
  await new Promise((r) => setTimeout(r, 500));
  const esquerda = c.cameras.main.scrollX;
  c.player.body.reset(larguraDoMundo - 128, 7 * 64 - 6);
  await new Promise((r) => setTimeout(r, 900));
  const direita = c.cameras.main.scrollX;
  return { larguraDoMundo, ecra: c.cameras.main.width, esquerda: Math.round(esquerda), direita: Math.round(direita) };
});
ok(cam.larguraDoMundo > cam.ecra, `a sala é maior que o ecrã (${cam.larguraDoMundo} px contra ${cam.ecra})`);
ok(cam.direita > cam.esquerda + 1000, `a câmara rola de verdade (${cam.esquerda} → ${cam.direita})`);
await page.screenshot({ path: `${OUT}/piloto-02-longo.png` });

// ---------- 5. o voador passa por cima do degrau ----------
await irPara(3);
const voo = await page.evaluate(async () => {
  const c = window.__game.scene.getScene('Game');
  const v = c.sentinels.getChildren().find((o) => o.arquetipo === 'voador');
  const y0 = v.y;
  await new Promise((r) => setTimeout(r, 1200));
  return { y0: Math.round(y0), y1: Math.round(v.y), subiu: v.y < y0 - 4, chao: 7 * 64 };
});
ok(voo.y1 < voo.chao - 64, `o voador está no ar (y ${voo.y1}, chão em ${voo.chao})`);

// ---------- 6. e o conjunto continua a jogar-se ----------
const vivo = await page.evaluate(() => {
  const c = window.__game.scene.getScene('Game');
  return { hp: c.player.resources.hp, area: c.area.id, sala: c.rooms[c.roomIndex].id };
});
ok(vivo.hp > 0, `o jogador sobreviveu à visita (${vivo.hp} de vida em ${vivo.sala})`);
ok(errors.length === 0, `sem erros de consola${errors.length ? ': ' + errors[0] : ''}`);

console.log('\nCENSO MEDIDO NO JOGO:');
console.log(JSON.stringify(censo, null, 1));
console.log(falhas === 0 ? '\nPILOTO OK' : `\n${falhas} FALHA(S)`);
await browser.close();
process.exit(falhas ? 1 : 0);
