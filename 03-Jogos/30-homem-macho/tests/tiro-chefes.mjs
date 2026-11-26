/**
 * `PAT-C-03` — **o tiro acerta o inimigo, não o desliga**, em todos os seis chefes.
 *
 * Nasceu do bug que o jogador viu em L03-02 — Arena do chefe: «ao levar qualquer ataque ele some da
 * tela, dessa forma não é possível derrotá-lo». A causa não estava no chefe: em
 * `overlap(grupo, sprite, cb)` o Phaser chama o callback na ordem que ele normalizou — `(sprite,
 * filhoDoGrupo)` — e não na ordem em que registámos. As seis cópias do mesmo callback assumiam que
 * o primeiro argumento era o projétil, e por isso desligavam **o inimigo** (`active = false`,
 * `visible = false`, corpo desligado) e deixavam o tiro a voar.
 *
 * O que este ficheiro prende, para cada chefe:
 *
 * 1. o tiro **tira vida** ao chefe, uma vez por tiro;
 * 2. o chefe **continua visível, ativo e com corpo** depois de levar o tiro — é a asserção que
 *    faltava em todo o lado e que teria apanhado o bug;
 * 3. o **projétil** é o que desaparece (o pool fica sem nenhum ativo);
 * 4. e o chefe de LVL-03 **morre** de tiro e a arena abre — «derrotável» é a promessa.
 *
 * `npm run tiro` (com o `dev` no ar).
 */
import { chromium } from 'playwright';

const URL = process.env.SMOKE_URL ?? 'http://localhost:5173/?skip=menu';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

const falhas = [];
function exigir(cond, texto) {
  if (!cond) falhas.push(texto);
  console.log(`${cond ? 'OK  ' : 'FALHA'} ${texto}`);
}

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.evaluate(() => { if (window.__game) window.__game.loop._coolDown = 0; });
await page.waitForTimeout(400);

const cena = (fn, arg) => page.evaluate(fn, arg);

/** Os seis alvos com tiro. `campo` é o campo da cena que guarda a entidade. */
const ALVOS = [
  { area: 'LVL-03', sala: 1, campo: 'boss', nome: 'L03-02 · Guardião da Passagem', n: 0 },
  { area: 'LVL-08', sala: 3, campo: 'alferes', nome: 'L08-04 · O Alferes da Ronda', n: 0 },
  { area: 'LVL-12', sala: 4, campo: 'forjador', nome: 'L12-05 · O Forjador', n: 0 },
  { area: 'LVL-14', sala: 4, campo: 'comandante', nome: 'L14-05 · O Comandante', n: 0 },
  { area: 'LVL-15', sala: 4, campo: 'guardioes', nome: 'L15-05 · O Guardião do Silêncio', n: 0 },
  { area: 'LVL-16', sala: 3, campo: 'plantonista', nome: 'L16-04 · O Plantonista', n: 0 },
];

/** Entra na sala com o chefe e põe o herói de frente para ele. */
const preparar = async (alvo) => {
  await cena(([area, sala]) => {
    window.__game.scene.getScene('Game').scene.restart({ area, room: sala });
  }, [alvo.area, alvo.sala]);
  await page.waitForFunction(() => {
    const s = window.__game.scene.getScene('Game');
    return s && s.scene.isActive() && !s.scene.isPaused() && !s.busy;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(700);
  return cena((campo) => {
    const s = window.__game.scene.getScene('Game');
    const bruto = s[campo];
    const alvoEnt = Array.isArray(bruto) ? bruto[0] : bruto;
    if (!alvoEnt) return { semAlvo: true };
    // o herói fica à esquerda do chefe, ao alcance do tiro e fora do corpo dele
    s.player.body.reset(alvoEnt.x - 220, 6 * 64 - 30);
    // o tiro sai para a direita: o herói tem de olhar para lá
    s.player.setFlipX(false);
    return { x: Math.round(alvoEnt.x), hp: alvoEnt.hp, nome: alvoEnt.constructor.name };
  }, alvo.campo);
};

const estadoDoAlvo = (campo) => cena((c) => {
  const s = window.__game.scene.getScene('Game');
  const bruto = s[c];
  const e = Array.isArray(bruto) ? bruto[0] : bruto;
  if (!e) return { semAlvo: true };
  const body = e.body;
  return {
    // o Plantonista não tem vida: tem **postura** (`MEC-011`). A "vida" do alvo é o que ele tiver.
    vida: e.hp ?? e.poise,   // `poise` é a postura do Plantonista (`MEC-011`)
    visivel: e.visible,
    ativo: e.active,
    corpo: !!body && body.enable,
    alpha: +e.alpha.toFixed(2),
    // o pool de projéteis: nada ativo depois do impacto é o sinal de que o **tiro** foi o despachado
    tirosAtivos: s.projectiles.getChildren().filter((p) => p.active).length,
  };
}, campo);

/**
 * Um tiro **alinhado com o corpo** do alvo, e a espera pelo impacto.
 *
 * Sai pela mesma função que a tecla usa (`fire`), mas com a altura do centro do corpo: um tiro
 * lançado de `player.y − 20` passa por cima de um alvo baixo, e o teste estaria a medir a mira, não
 * o despacho. O caminho da tecla fica coberto à parte, em LVL-03 — que é o caso que o jogador relatou.
 */
const atirarEm = async (campo) => {
  await cena((c) => {
    const s = window.__game.scene.getScene('Game');
    const bruto = s[c];
    const e = Array.isArray(bruto) ? bruto[0] : bruto;
    const corpo = e.body;
    s.fire(e.x - 90, corpo.center.y, 1);
  }, campo);
  await page.waitForFunction(() => {
    const s = window.__game.scene.getScene('Game');
    return s.projectiles.getChildren().every((p) => !p.active);
  }, null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(250);
};

/** Um tiro: a tecla fica em baixo uns frames (o `K` também passa pelo pulso do DOM). */
const atirar = async () => {
  await page.keyboard.down('KeyK');
  await page.waitForTimeout(140);
  await page.keyboard.up('KeyK');
  await page.waitForTimeout(700);
};

for (const alvo of ALVOS) {
  const inicio = await preparar(alvo);
  if (inicio.semAlvo) { exigir(false, `${alvo.nome}: a entidade existe na sala`); continue; }
  const antes = await estadoDoAlvo(alvo.campo);

  await atirarEm(alvo.campo);
  const depois = await estadoDoAlvo(alvo.campo);

  exigir(typeof antes.vida === 'number' && antes.vida > 0,
    `${alvo.nome}: a vida do alvo é um número (${antes.vida}) — a asserção não passa por undefined`);
  if (alvo.campo === 'plantonista') {
    // §6.1: «dano à distância = 0» — o tiro **atravessa e some** no corpo dele, sem tocar a postura
    exigir(depois.vida === antes.vida, `${alvo.nome}: é imune ao tiro, como §6.1 manda (postura ${antes.vida} → ${depois.vida})`);
  } else {
    exigir(depois.vida < antes.vida, `${alvo.nome}: o tiro tira vida (${antes.vida} → ${depois.vida})`);
  }
  /*
   * O coração do teste: **o alvo continua no jogo depois de levar um tiro.** Era exatamente isto
   * que falhava — o chefe ficava `active=false`, `visible=false`, `body.enable=false`, e o jogador
   * via-o desaparecer do ecrã sem forma de o matar.
   */
  exigir(depois.visivel, `${alvo.nome}: e continua VISÍVEL depois do tiro (era o bug: desaparecia)`);
  exigir(depois.ativo, `${alvo.nome}: e ativo (não foi desligado do jogo)`);
  exigir(depois.corpo, `${alvo.nome}: e com corpo — aceita o golpe seguinte`);
  exigir(depois.alpha > 0.9, `${alvo.nome}: e opaco (alpha ${depois.alpha}), não uma sombra a desvanecer`);
  exigir(depois.tirosAtivos === 0, `${alvo.nome}: o TIRO é que foi despachado (${depois.tirosAtivos} ativos no pool)`);
}

// ---------- a tecla `K`, no caso que o jogador relatou ----------
/*
 * O relato foi «ao levar qualquer ataque ele some da tela». Aqui o ataque é o do jogador: a tecla
 * `K`, com o herói de frente para o chefe. O tiro tem de acertar **e** o chefe tem de continuar lá.
 */
const comTecla = await preparar(ALVOS[0]);
const antesTecla = await estadoDoAlvo('boss');
await atirar();
const depoisTecla = await estadoDoAlvo('boss');
exigir(depoisTecla.vida < antesTecla.vida,
  `L03-02: a tecla K tira vida ao Guardião (${antesTecla.vida} → ${depoisTecla.vida})`);
exigir(depoisTecla.visivel && depoisTecla.ativo && depoisTecla.corpo,
  'L03-02: e ele continua em cena depois do tiro com a tecla — o bug era este');

// ---------- o chefe de LVL-03 morre de tiro, e a arena abre ----------
const inicio03 = await preparar(ALVOS[0]);
exigir(!inicio03.semAlvo, 'L03-02: o Guardião está na arena');
const morto = await cena(async () => {
  const s = window.__game.scene.getScene('Game');
  const b = s.boss;
  // tiro a tiro, como o jogador: o chefe não pode ser desligado a meio
  const marcas = [];
  let guarda = 0;
  while (b.hp > 0 && guarda < 70) {
    guarda += 1;
    s.fire(s.player.x + 30, s.player.y - 20, 1);
    await new Promise((r) => setTimeout(r, 60));
    if (!b.visible || !b.active) { marcas.push({ hp: b.hp, vis: b.visible, ativo: b.active }); break; }
  }
  await new Promise((r) => setTimeout(r, 900));
  return {
    hp: b.hp, estado: b.state, visivel: b.visible, ativo: b.active,
    alpha: +b.alpha.toFixed(2), lesteAberto: s.built.eastOpen,
    sala: s.rooms[s.roomIndex].id, defeituoso: marcas,
  };
});
exigir(morto.defeituoso.length === 0, 'L03-02: nenhum tiro o desligou a caminho da morte');
exigir(morto.hp === 0 && morto.estado === 'morte', `L03-02: o Guardião chega a 0 HP e a "morte" (${morto.estado})`);
exigir(morto.visivel && morto.ativo, 'L03-02: e cai em cena — visível, a desvanecer, como §5 manda');
exigir(morto.alpha <= 0.3, `L03-02: a morte é o desvanecer previsto (alpha ${morto.alpha})`);
exigir(morto.lesteAberto, 'L03-02: e a arena abre — a luta tem fim');

await page.screenshot({ path: `${process.env.SMOKE_OUT ?? '/tmp'}/tiro-01-chefe-morto.png` });
exigir(errors.length === 0, `sem erros de consola${errors.length ? ': ' + errors[0] : ''}`);
await browser.close();

if (falhas.length) {
  console.log(`\n${falhas.length} FALHA(S):`);
  for (const f of falhas) console.log(`- ${f}`);
  process.exit(1);
}
console.log('\nTIRO NOS CHEFES OK');
