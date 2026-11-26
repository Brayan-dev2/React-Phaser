/**
 * `MEC-006` — **a porta de senha de L02-07**, ao vivo (`npm run porta-senha` com o `dev` no ar).
 *
 * Este ficheiro existe por causa de um bug que o jogador descreveu assim: «a porta de senha não
 * consigo passar, fica em loop». Eram **dois** defeitos, e nenhum deles estava no sítio onde ele
 * os viu:
 *
 * 1. **A porta fechada não tinha corpo.** O glifo `Y` desenhava a porta e não criava colisão (só
 *    `+` e `D` abriam a saída, e nenhum dos dois é sólido). O herói atravessava a porta, saía do
 *    mundo pelo lado leste, caía abaixo do mundo e o `respawnInRoom` devolvia-o ao início da sala
 *    — que é literalmente um **loop**, e o jogador via-o com os próprios olhos.
 * 2. **A porta aberta voltava a fechar-se.** `eastOpen` era recalculado do glifo a cada
 *    `mountRoom`, e `passwordOpen` vivia só na memória da cena: voltar a L02-07 dava a porta
 *    fechada **e** o `E` calado (o motor sabia que ela estava aberta e por isso não voltava a
 *    pedir a senha). O caminho para L02-08 — e para LVL-03 — fechava-se sozinho.
 *
 * A terceira coisa que este ficheiro prende é o que devia ter apanhado o bug da primeira vez: a
 * porta é uma **passagem**, e uma passagem tem de se poder atravessar, voltar a atravessar e
 * continuar a atravessar depois de fechar o jogo.
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
await page.waitForTimeout(500);

const cena = (fn, arg) => page.evaluate(fn, arg);

/** Abre a sala pelo caminho da cena (`mountRoom`), como uma transição faria. */
const naSala = async (area, indice, dados = {}) => {
  await cena(([a, i, d]) => {
    window.__game.scene.getScene('Game').scene.restart({ area: a, room: i, ...d });
  }, [area, indice, dados]);
  await page.waitForFunction(() => {
    const s = window.__game.scene.getScene('Game');
    return s && s.scene.isActive() && !s.scene.isPaused() && !s.busy;
  }, null, { timeout: 15000 });
  await page.waitForTimeout(200);
};

const estado = () => cena(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    sala: s.rooms[s.roomIndex].id,
    indice: s.roomIndex,
    x: Math.round(s.player.x),
    mundo: s.built.worldWidth,
    senha: s.passwordOpen,
    leste: s.built.eastOpen,
    cadeado: s.built.passwordLock.length,
    painel: !!document.querySelector('.panel'),
  };
});

/** Põe o corpo do herói em cima do chão, à distância pedida da porta. */
const aDistancia = (tiles) => cena((t) => {
  const s = window.__game.scene.getScene('Game');
  const d = s.built.passwordDoors[0];
  if (!d) return;   // não estamos numa sala com porta de senha: as asserções dizem-no
  s.player.body.reset(d.x - t * 64, 6 * 64 - 30);
}, tiles);

/** Segura a tecla uns frames: um `press` instantâneo pode cair entre dois `update`. */
const tecla = async (k, ms = 140) => {
  await page.keyboard.down(k);
  await page.waitForTimeout(ms);
  await page.keyboard.up(k);
  await page.waitForTimeout(350);
};

// ---------- 1. a porta fechada é uma parede ----------
await naSala('LVL-02', 6);
const fechada = await estado();
exigir(fechada.sala === 'L02-07', `a partida é L02-07 — Porta de senha (${fechada.sala})`);
exigir(fechada.senha === false && fechada.leste === false, 'a porta começa fechada e a leste não é saída');
exigir(fechada.cadeado === 3, `a porta fechada tem corpo: três tiles sólidos (${fechada.cadeado})`);

// ---------- 2. empurrar contra ela não sai do mundo (era o loop) ----------
await aDistancia(2);
await page.waitForTimeout(300);
await page.keyboard.down('KeyD');
await page.waitForTimeout(2200);
await page.keyboard.up('KeyD');
await page.waitForTimeout(400);
const empurrada = await estado();
exigir(empurrada.sala === 'L02-07', `empurrar contra a porta não sai da sala (${empurrada.sala})`);
exigir(empurrada.x < empurrada.mundo - 40,
  `e o herói fica dentro do mundo, não a cair no vazio (x ${empurrada.x} < ${empurrada.mundo})`);
exigir(empurrada.x >= empurrada.mundo - 200,
  `mas chega à porta — ela barra, não desaparece (${empurrada.x} de ${empurrada.mundo})`);
await page.screenshot({ path: `${process.env.SMOKE_OUT ?? '/tmp'}/senha-01-fechada.png` });

// ---------- 3. a senha: o painel abre com o E, e a ordem certa levanta a porta ----------
await aDistancia(1.5);
await page.waitForTimeout(250);
await tecla('KeyE', 200);
const comPainel = await estado();
exigir(comPainel.painel, 'o E junto à porta abre o painel da senha');
exigir(await cena(() => window.__game.scene.getScene('Game').scene.isPaused()),
  'e o jogo pára enquanto se escolhem os glifos');
for (const label of ['mão aberta', 'engrenagem partida', 'três traços', 'olho vazado']) {
  await page.locator(`button[aria-label="${label}"]`).click();
  await page.waitForTimeout(120);
}
await page.waitForTimeout(900);
const aberta = await estado();
exigir(aberta.senha === true, 'a ordem certa abre a porta (`passwordOpen`)');
exigir(aberta.leste === true, 'e a leste passa a ser saída');
exigir(aberta.cadeado === 0, `a porta aberta já não tem corpo — dá-se por ela (${aberta.cadeado})`);
await page.screenshot({ path: `${process.env.SMOKE_OUT ?? '/tmp'}/senha-02-aberta.png` });

// ---------- 4. atravessar, voltar a pé, e continuar a atravessar ----------
await cena(() => {
  const s = window.__game.scene.getScene('Game');
  s.player.body.reset(s.built.worldWidth - 60, 6 * 64 - 30);
});
// tecla em baixo até a sala mudar — o mesmo critério do regresso (ver abaixo)
await page.keyboard.down('KeyD');
await page.waitForFunction(() => {
  const s = window.__game.scene.getScene('Game');
  return s.rooms[s.roomIndex].id === 'L02-08' && !s.busy;
}, null, { timeout: 30000 }).catch(() => {});
await page.keyboard.up('KeyD');
await page.waitForTimeout(300);
const passou = await estado();
exigir(passou.sala === 'L02-08', `a porta aberta deixa passar para L02-08 (${passou.sala})`);

/*
 * De volta a pé — é assim que o jogador volta, e é esse o caminho que estava partido.
 *
 * A tecla fica em baixo até a sala mudar: a distância é curta mas a transição tem fade, e medir o
 * que o herói andou em milissegundos mede a máquina, não o jogo (a 4 fps, 80 px de passeio são
 * segundos). O que se afirma é o resultado: voltou.
 */
await cena(() => {
  const s = window.__game.scene.getScene('Game');
  s.player.body.reset(70, 6 * 64 - 30);
});
await page.keyboard.down('KeyA');
await page.waitForFunction(() => {
  const s = window.__game.scene.getScene('Game');
  return s.rooms[s.roomIndex].id === 'L02-07' && !s.busy;
}, null, { timeout: 30000 }).catch(() => {});
await page.keyboard.up('KeyA');
await page.waitForTimeout(300);
const voltou = await estado();
exigir(voltou.sala === 'L02-07', `e volta-se a L02-07 pelo lado oeste (${voltou.sala})`);
exigir(voltou.leste === true, 'a porta **continua** aberta ao voltar à sala (era o bug)');
exigir(voltou.cadeado === 0, 'e sem corpo: não há parede invisível numa porta aberta');
exigir(voltou.senha === true, 'o motor lembra-se de que a senha foi resolvida');

// e o E já não pede a senha outra vez (não há segundo puzzle: a porta está aberta)
await aDistancia(1.5);
await tecla('KeyE', 200);
exigir(!(await estado()).painel, 'com a porta aberta, o E não volta a pedir a senha — não há loop');

// ---------- 5. a senha viaja no save ----------
const guardado = await cena(() => {
  for (const chave of Object.keys(localStorage)) {
    if (!chave.includes('save')) continue;
    try {
      const v = JSON.parse(localStorage.getItem(chave));
      const p = v.progress ?? v;
      if (p.roomId) return { senhaAberta: p.senhaAberta, roomId: p.roomId };
    } catch { /* outra chave */ }
  }
  return null;
});
exigir(guardado?.senhaAberta === true, `o save guarda que a porta cedeu (${JSON.stringify(guardado)})`);

// ---------- 6. retomar devolve a porta aberta, e um save estragado devolve-a fechada ----------
await naSala('LVL-02', 6, { senhaAberta: true });
const retomada = await estado();
exigir(retomada.leste === true && retomada.cadeado === 0,
  'retomar com `senhaAberta` monta a sala com a porta já aberta');

await naSala('LVL-02', 6, { senhaAberta: 'sim' });
const estragada = await estado();
exigir(estragada.leste === false && estragada.cadeado === 3,
  'um valor que não é `true` fecha a porta (o estado seguro) em vez de a abrir por engano');

await naSala('LVL-02', 5, { senhaAberta: true });
const outraSala = await estado();
exigir(outraSala.sala === 'L02-06' && outraSala.cadeado === 0,
  'e a senha não inventa portas nas outras salas do setor');

exigir(errors.length === 0, `sem erros de consola${errors.length ? ': ' + errors[0] : ''}`);
await browser.close();

if (falhas.length) {
  console.log(`\n${falhas.length} FALHA(S):`);
  for (const f of falhas) console.log(`- ${f}`);
  process.exit(1);
}
console.log('\nPORTA DE SENHA OK');
