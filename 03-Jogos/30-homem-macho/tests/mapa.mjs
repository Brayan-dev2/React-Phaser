/**
 * `UI-15` (`DEC-043`) — **o mapa**, e a fenda de L02-02, ao vivo (`npm run mapa` com o `dev` no ar).
 *
 * Este teste nasceu de um bug que o jogador encontrou **antes** de o mapa existir: em L02-02 —
 * Bifurcação, subir pela plataforma do gate e atravessar a fenda do teto mandava o herói para
 * **L02-03** (a sala que ele acabou de atravessar por baixo) em vez de **L02-06**, a rota alta.
 * A causa: `DEC-015` decide o destino de uma fenda como "a sala seguinte", e no meio de um setor
 * isso é a sala do lado. O mapa tornou o bug visível — uma planta em que a fenda desce em vez de
 * subir — e este ficheiro prende as duas metades:
 *
 * 1. **o mapa abre** (`M` e o ícone do HUD), **pausa** a cena e fecha nos dois sentidos;
 * 2. **a planta é a topologia**: L02-06 aparece **por cima** de L02-02, e a rota baixa ao lado;
 * 3. **o que não se viu não se desenha** — três estados, e o resto fica fora do mapa;
 * 4. **a fenda leva a L02-06** — o jogador sobe pela plataforma e chega à rota alta (o bug);
 * 5. **o mapa vai para o save** — fechar o jogo não apaga o que se andou.
 */
import { chromium } from 'playwright';

const OUT = process.env.SMOKE_OUT ?? '/tmp';
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
await page.waitForTimeout(500);

const cena = (fn, arg) => page.evaluate(fn, arg);
const painel = page.locator('.panel--mapa');

/** Leva o herói a uma sala do setor atual pelo caminho da cena (e devolve o id). */
const irParaSala = async (indice) => {
  await cena((i) => {
    const s = window.__game.scene.getScene('Game');
    s.mountRoom(i, 'start');
  }, indice);
  await page.waitForTimeout(450);
  return cena(() => window.__game.scene.getScene('Game').rooms[window.__game.scene.getScene('Game').roomIndex].id);
};

/** Abre o mapa e espera que a cena tenha assentado (a troca de sala tem fade e `busy`). */
const abrirMapa = async () => {
  // a transição de sala tem fade e `busy`: com o jogo a meio de uma mudança o `update` não corre
  // (e a tecla não é lida de propósito — um mapa a abrir sozinho depois do fade seria pior)
  await page.waitForFunction(() => {
    const s = window.__game.scene.getScene('Game');
    return s.scene.isActive() && !s.scene.isPaused() && !s.busy;
  }, null, { timeout: 8000 });
  await page.waitForTimeout(150);
  await page.keyboard.press('KeyM');
  await painel.waitFor({ state: 'visible', timeout: 5000 });
};

/** Entra mesmo no setor 2 (o caminho é o `enterArea`, o mesmo da porta dourada do fim de LVL-01). */
const entrarNoSetor2 = async () => {
  await cena(() => {
    const s = window.__game.scene.getScene('Game');
    s.enterArea(window.__area('LVL-02'), 0);
  });
  await page.waitForTimeout(900);
};

// a cena não expõe as áreas; o teste injeta uma ponte mínima a partir do registo do jogo
await page.evaluate(async () => {
  const mod = await import('/src/game/data/levels/index.ts');
  window.__area = (id) => mod.AREAS[id];
});

// ---------- 11. o painel nunca fica em branco à espera de um payload ----------
/*
 * A outra metade do «não carrega»: se o `game:mapa` se perder, a UI não pode ficar sem nada. Ou
 * tem planta, ou diz que está a preparar — as duas coisas são legíveis; o vazio não é.
 */
/*
 * O caso é o do payload perdido: a UI sabe que o mapa está aberto (`game:mapa-painel`) e a planta
 * nunca chegou (`game:mapa`). Numa página nova isso é o estado real do arranque — a UI fica com
 * `mapa = null` — e é aí que o `return null` de antes deixava o ecrã **vazio**, indistinguível de
 * um jogo congelado. Agora aparece "a preparar…", o painel volta a pedir a planta e a planta chega.
 */
/*
 * A planta "perde-se" no sítio onde ela nasce: `pushMapa` cala-se nesta página. O resto é o
 * caminho real do jogador — `M` pausa a cena e a UI fica à espera de uma planta que não vem.
 * (Um `EventBus.emit` a partir do teste não serviria: em `dev` com HMR o módulo importado pela
 * página pode ser outra instância, e o teste estaria a falar sozinho.)
 */
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  window.__pushMapaOriginal = s.pushMapa.bind(s);
  s.pushMapa = () => {};
});
await page.keyboard.press('KeyM');
await page.waitForTimeout(400);
const provisorio = await page.evaluate(() => {
  const p = document.querySelector('.panel--mapa');
  return p ? p.innerText.replace(/\n/g, ' ') : null;
});
exigir(!!provisorio && /preparar/i.test(provisorio),
  `sem planta, o painel diz que está a preparar em vez de ficar vazio (${provisorio?.slice(0, 40)})`);
// e o pedido repetido cura-se sozinho: a planta volta a existir e o painel passa a desenhar
await page.evaluate(() => { window.__game.scene.getScene('Game').pushMapa = window.__pushMapaOriginal; });
await page.waitForFunction(() => document.querySelectorAll('.mapa__sala').length > 0, null, { timeout: 8000 })
  .then(() => exigir(true, 'e o painel volta a pedir a planta — a planta chega sem o jogador fazer nada'))
  .catch(() => exigir(false, 'e o painel volta a pedir a planta — a planta chega sem o jogador fazer nada'));
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
exigir(await page.evaluate(() => !window.__game.scene.getScene('Game').scene.isPaused()),
  'e sai-se dele com ESC (a cena volta a correr)');


// ---------- 1. o mapa abre com a tecla M e pausa a cena ----------
await abrirMapa();
exigir(true, 'a tecla M abre o mapa');
exigir(await cena(() => window.__game.scene.getScene('Game').scene.isPaused()),
  'abrir o mapa pausa a GameScene — o jogo não corre por baixo');
const topo = await page.locator('.mapa__topo').innerText();
exigir(/MAPA/.test(topo) && /LVL-01/.test(topo), `o cabeçalho diz onde se está (${topo.replace(/\n/g, ' · ')})`);

// ---------- 2. a planta: as seis salas de LVL-01 numa linha, corredores incluídos ----------
const salas1 = await page.locator('.mapa__sala').count();
exigir(salas1 === 6, `LVL-01 tem as seis salas na planta (${salas1})`);
const primeira = page.locator('.mapa__sala').first();
exigir(/L01-01/.test(await primeira.getAttribute('aria-label')),
  'a primeira casa da planta é L01-01');
exigir(/atual/i.test(await primeira.getAttribute('data-estado')),
  'e está marcada como "você está aqui"');
exigir(await page.locator('.mapa__sala--conhecida').count() === 1,
  'a porta que se viu (L01-02) aparece tracejada — e só essa');
exigir(await page.locator('.mapa__sala--desconhecida').count() === 4,
  'o resto do setor não se desenha: quatro salas por descobrir (6 − 1 atual − 1 porta vista)');
exigir(await page.locator('.mapa__sala--atual .mapa__liga--leste').count() > 0 ||
  await page.locator('.mapa__sala--atual .mapa__liga').count() > 0,
  'a sala atual mostra por onde se sai (corredor desenhado)');
await page.screenshot({ path: `${OUT}/mapa-01-lvl01.png`, fullPage: true });

// ---------- 3. fecha com M e o jogo volta ----------
await page.keyboard.press('KeyM');
await painel.waitFor({ state: 'hidden', timeout: 5000 });
exigir(await cena(() => !window.__game.scene.getScene('Game').scene.isPaused()),
  'M fecha o mapa e a cena volta a correr');

// ---------- 4. o bug: a fenda de L02-02 tem de levar a L02-06 ----------
await entrarNoSetor2();
const naBifurcacao = await irParaSala(1);
exigir(naBifurcacao === 'L02-02', `o herói está em L02-02 — Bifurcação (${naBifurcacao})`);

// a planta, antes de subir: L02-06 **acima** de L02-02
await abrirMapa();
const planta = await page.locator('.mapa__sala').evaluateAll((els) =>
  els.map((e) => {
    const r = e.getBoundingClientRect();
    return { id: e.getAttribute('aria-label'), x: Math.round(r.x), y: Math.round(r.y) };
  }));
const salaDe = (id) => planta.find((p) => p.id?.startsWith(id));
const b02 = salaDe('L02-02');
const b06 = salaDe('L02-06');
const b03 = salaDe('L02-03');
exigir(!!b02 && !!b06 && !!b03, 'as três salas da bifurcação estão na planta');
exigir(b06.y < b02.y - 10, `L02-06 está ACIMA de L02-02 na planta (${b06?.y} < ${b02?.y})`);
exigir(Math.abs((b06?.x ?? 0) - (b02?.x ?? 0)) < 4,
  `e na mesma coluna — é uma passagem vertical, não um corredor lateral (Δx ${Math.abs((b06?.x ?? 0) - (b02?.x ?? 0))})`);
exigir(Math.abs((b03?.y ?? 0) - (b02?.y ?? 0)) < 4 && b03.x > b02.x,
  'e a rota baixa (L02-03) continua ao lado, na mesma linha');
await page.screenshot({ path: `${OUT}/mapa-02-lvl02.png`, fullPage: true });
await page.keyboard.press('Escape');
await painel.waitFor({ state: 'hidden', timeout: 5000 });

// ---------- 5. e o motor: subir pela fenda chega a L02-06, não a L02-03 ----------
const chegada = await cena(async () => {
  const s = window.__game.scene.getScene('Game');
  const antes = s.rooms[s.roomIndex].id;
  // o jogador já tem o salto duplo quando usa esta fenda (`DEC-010`); aqui o que se testa é a
  // passagem do teto — põe-se o corpo na fenda em (24–25, 0), como o solver faria ao subir
  s.player.unlockDoubleJump();
  s.player.setPosition(24 * 64 + 32, 20);
  s.player.body.reset(24 * 64 + 32, 20);
  // espera pela **condição**, não por um número de milissegundos: o fade de 180 ms é medido em
  // frames, e numa máquina lenta (a 4 fps, medido) isso são segundos. Um `sleep` fixo aqui media
  // a velocidade do sandbox, não a regra do jogo.
  const limite = performance.now() + 20000;
  while (s.rooms[s.roomIndex].id === antes && performance.now() < limite) {
    await new Promise((r) => setTimeout(r, 100));
  }
  return { antes, depois: s.rooms[s.roomIndex].id, sala: s.roomIndex };
});
exigir(chegada.antes === 'L02-02', `a partida é L02-02 (${chegada.antes})`);
exigir(chegada.depois === 'L02-06', `a fenda leva a L02-06 — a rota alta (${chegada.depois})`);
exigir(chegada.depois !== 'L02-03', 'e NÃO a L02-03, o bug que o jogador encontrou');

// ---------- 6. o mapa aprendeu: L02-06 passou a visitada, e L02-07 a "porta vista" ----------
await cena(() => window.__game.scene.getScene('Game').pushMapa());
await abrirMapa();
const estados = await page.locator('.mapa__sala').evaluateAll((els) =>
  Object.fromEntries(els.map((e) => [e.getAttribute('aria-label')?.split(' ')[0], e.getAttribute('data-estado')])));
exigir(estados['L02-06'] === 'atual', `L02-06 é agora a sala atual (${estados['L02-06']})`);
exigir(estados['L02-02'] === 'visitada', `L02-02 passou a visitada (${estados['L02-02']})`);
exigir(estados['L02-07'] === 'conhecida', `L02-07 é a porta que se vê de L02-06 (${estados['L02-07']})`);
exigir(estados['L02-05'] === 'desconhecida', 'L02-05 continua fora do mapa (nunca lá se entrou)');
exigir(estados['L02-08'] === 'desconhecida', 'e L02-08 também — o mapa não é um spoiler do setor');
const contadores = await page.locator('.mapa__contadores').innerText();
exigir(/\d+ \/ 8 SALAS/.test(contadores), `o cabeçalho conta as salas do setor (${contadores})`);
await page.screenshot({ path: `${OUT}/mapa-03-lvl02-depois.png`, fullPage: true });
await page.keyboard.press('KeyM');
await painel.waitFor({ state: 'hidden', timeout: 5000 });

// ---------- 7. a coluna dos setores diz onde se está no mundo ----------
await abrirMapa();
const setores = await page.locator('.mapa__setor-linha').count();
exigir(setores === 16, `a coluna mostra os 16 setores (${setores})`);
const linhaAtual = await page.locator('.mapa__setor-linha--atual').innerText();
exigir(/02/.test(linhaAtual) && /Galeria/.test(linhaAtual), `e marca o setor onde se está (${linhaAtual.replace(/\n/g, ' ')})`);
const ruinas = await page.locator('.mapa__setor-linha').first().innerText();
// o teste só andou por L01-01: o setor tem de mostrar 1 de 6 **e não** 6 de 6 (uma contagem
// generosa era tão má como uma planta inventada)
exigir(/1\/6/.test(ruinas), `LVL-01 mostra o que se andou, e não o setor inteiro (${ruinas.replace(/\n/g, ' ')})`);
const semVisita = await page.locator('.mapa__setor-linha--vazio').count();
// 16 setores − LVL-01 − LVL-02 (os dois onde se andou) = 14 sem visita
exigir(semVisita === 14, `os setores onde nunca se entrou mostram "—" e não "0/valor" (${semVisita})`);

// ---------- 8. o mapa vai para o save ----------
await page.keyboard.press('Escape');
await painel.waitFor({ state: 'hidden', timeout: 5000 });
await cena(() => window.__game.scene.getScene('Game').persist('transition'));
await page.waitForTimeout(500);
const guardado = await cena(() => {
  for (const k of Object.keys(localStorage)) {
    const cru = localStorage.getItem(k) ?? '';
    if (!cru.includes('visitadas')) continue;
    try {
      const v = JSON.parse(cru);
      const p = v.progress ?? v;
      return { visitadas: p.visitadas };
    } catch { /* outra chave */ }
  }
  return null;
});
exigir(Array.isArray(guardado?.visitadas), 'o save tem a lista das salas visitadas');
exigir(guardado?.visitadas?.includes('L02-02') && guardado?.visitadas?.includes('L02-06'),
  `e as duas salas da bifurcação estão lá (${guardado?.visitadas?.length} visitadas)`);
exigir(!guardado?.visitadas?.includes('L02-05'), 'sem inventar salas onde não se entrou');

// ---------- 9. o ícone do HUD faz o mesmo que a tecla ----------
await page.waitForFunction(() => !window.__game.scene.getScene('Game').scene.isPaused(), null, { timeout: 5000 });
await page.locator('.hud__btn--mapa').click();
await painel.waitFor({ state: 'visible', timeout: 5000 });
exigir(true, 'o ícone do HUD também abre o mapa');
await page.keyboard.press('Escape');
await painel.waitFor({ state: 'hidden', timeout: 5000 });

// ---------- 10. o mapa abre também a partir da pausa (o jogador carrega em ESC; o `M` morria) ----------
/*
 * O bug que o jogador relatou como «o mapa não está carregando»: a tecla `M` é lida no `update` da
 * `GameScene`, e uma cena pausada não corre o `update`. Com a pausa aberta — o gesto mais comum do
 * jogo — `M` não fazia nada, e o ecrã ficava na pausa. Aqui o caminho é o do jogador: `ESC`, `M`.
 */
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
exigir(await cena(() => window.__game.scene.getScene('Game').scene.isPaused()),
  'ESC abre a pausa (e pausa a cena)');
await page.keyboard.press('KeyM');
await painel.waitFor({ state: 'visible', timeout: 5000 });
const daPausa = await page.locator('.mapa__sala').count();
exigir(daPausa > 0, `M, com a pausa aberta, abre o mapa com a planta (${daPausa} salas)`);
exigir(await page.locator('.panel--mapa .mapa__setor').count() === 1,
  'e o mapa não aparece em branco — o cabeçalho do setor está lá');
await page.screenshot({ path: `${OUT}/mapa-04-da-pausa.png`, fullPage: true });
await page.keyboard.press('Escape');
await painel.waitFor({ state: 'hidden', timeout: 5000 });
exigir(await cena(() => !window.__game.scene.getScene('Game').scene.isPaused()),
  'e ESC fecha o mapa devolvendo o jogo (o mapa nunca é um beco sem saída)');

exigir(errors.length === 0, `sem erros de consola${errors.length ? ': ' + errors[0] : ''}`);
await browser.close();

if (falhas.length) {
  console.log(`\n${falhas.length} FALHA(S):`);
  for (const f of falhas) console.log(`- ${f}`);
  process.exit(1);
}
console.log('\nMAPA OK');
