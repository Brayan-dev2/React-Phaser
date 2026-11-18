/**
 * `DEC-047` — **a campanha inteira, de LVL-01 ao Trono do Caos**, ao vivo (`npm run campanha`).
 *
 * Este ficheiro existe porque o jogo tinha **dois jogos**: o recorte (LVL-01 a LVL-03, jogável) e
 * os treze setores seguintes, que estavam escritos, testados e presos atrás de treze flags. Nada
 * provava que eles se ligavam uns aos outros — cada `lvlXX.mjs` prova o seu setor por teleporte, e
 * um setor pode estar perfeito e não ter porta para o seguinte.
 *
 * O que se prova aqui, para cada uma das 16 passagens:
 *
 * 1. a sala final do setor tem **uma saída real** para o setor seguinte — porta a leste, sumidouro,
 *    alçapão, elevador ou portão de chaves, conforme o setor declara;
 * 2. o gesto do jogador (andar, `E`) **atravessa**, e a cena chega ao setor seguinte;
 * 3. a vida, o escudo e o kit **viajam** com ele — uma transição que cura ou que apaga habilidades
 *    é pior do que uma parede.
 *
 * Depois das 16, o fim: sentar no trono de LVL-16 fecha o jogo com o crachá, e não com um ecrã de
 * «fim do recorte».
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

/**
 * As 16 passagens, com o **gesto** que as abre. O setor diz onde está a saída; o teste não inventa:
 * se o documento do setor diz que a saída é o elevador de L05-03, é lá que se carrega em `E`.
 *
 * `itens` = o que o jogador **já recolheu** ao chegar aqui. Não é batota: as habilidades e as
 * chaves do portão de LVL-14 não são campos soltos, são derivadas dos itens (`habilidadesConquistadas`,
 * `bossKeys` sobre `KEY_ITEMS`). Dar o kit por fora mediria um jogador que não existe.
 */
const PASSAGENS = [
  { de: 'LVL-01', para: 'LVL-02', via: 'leste', sala: 5 },
  { de: 'LVL-02', para: 'LVL-03', via: 'leste', sala: 7 },
  { de: 'LVL-03', para: 'LVL-04', via: 'leste', sala: 3 },
  { de: 'LVL-04', para: 'LVL-05', via: 'leste', sala: 4 },
  // `LVL-05` §11: a saída é o **elevador de L05-03**, não a última sala — e exige `HAB-05` + contrapeso
  { de: 'LVL-05', para: 'LVL-06', via: 'elevador', sala: 2, itens: ['ITM-003', 'ITM-005'], contrapeso: true },
  { de: 'LVL-06', para: 'LVL-07', via: 'leste', sala: 4 },
  { de: 'LVL-07', para: 'LVL-08', via: 'leste', sala: 4 },
  { de: 'LVL-08', para: 'LVL-09', via: 'leste', sala: 5 },
  { de: 'LVL-09', para: 'LVL-10', via: 'leste', sala: 5 },
  // `LVL-10` §6: a torre sobe pelo **alçapão** e exige `HAB-03` (garra) — `ITM-009`
  { de: 'LVL-10', para: 'LVL-11', via: 'alcapa', sala: 4, itens: ['ITM-003', 'ITM-005', 'ITM-009'] },
  { de: 'LVL-11', para: 'LVL-12', via: 'leste', sala: 4 },
  { de: 'LVL-12', para: 'LVL-13', via: 'leste', sala: 5 },
  { de: 'LVL-13', para: 'LVL-14', via: 'leste', sala: 5 },
  // `LVL-14` §11: o portão de **duas fechaduras** — as duas chaves são `ITM-004` e `ITM-007`,
  // as recompensas dos dois chefes obrigatórios (`DEC-016`)
  { de: 'LVL-14', para: 'LVL-15', via: 'portao', sala: 5, itens: ['ITM-003', 'ITM-004', 'ITM-007', 'ITM-009', 'ITM-010'] },
  { de: 'LVL-15', para: 'LVL-16', via: 'leste', sala: 5 },
];

/** Abre o setor na sala pedida, com o kit que o jogador teria à chegada. */
const abrir = async (area, sala, passo = {}) => {
  await cena(([a, s, itens]) => {
    window.__game.scene.getScene('Game').scene.restart({ area: a, room: s, coletados: itens, melhorias: {} });
  }, [area, sala, passo.itens ?? []]);
  await page.waitForFunction(() => {
    const s = window.__game.scene.getScene('Game');
    return s && s.scene.isActive() && !s.scene.isPaused() && !s.busy;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(300);
  if (passo.contrapeso) {
    // o contrapeso de LVL-05 é ligado pelo próprio jogador em L05-02 (empurrar o bloco para a
    // placa); `lvl05.mjs` prova essa mecânica — aqui ele chega já ligado, como chegaria a jogar.
    await cena(() => { window.__game.scene.getScene('Game').counterweight = true; });
  }
  await page.waitForTimeout(150);
};

const estado = () => cena(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    area: s.area.id,
    sala: s.rooms[s.roomIndex].id,
    hp: s.player.resources.hp,
    escudo: s.player.resources.shield,
    forca: s.player.abilities.strength,
    garra: s.player.abilities.climb,
  };
});

/** Fica em cima da saída e usa o gesto. A espera é pela **chegada**, não por milissegundos. */
const atravessar = async (passo) => {
  await cena(([modo, sala]) => {
    const s = window.__game.scene.getScene('Game');
    const w = s.built.worldWidth;
    if (modo === 'leste' || modo === 'portao') {
      s.player.body.reset(w - 60, 6 * 64 - 30);
    } else if (modo === 'elevador') {
      const u = s.built.elevators[0];
      s.player.body.reset(u.x - 30, 6 * 64 - 30);
    } else if (modo === 'alcapa') {
      // no alçapão: preso na parede, no topo (`HAB-03`) — é assim que se sobe em LVL-10
      const h = s.built.hatches[0] ?? s.built.hatch;
      s.player.releaseClimb?.();
      s.player.body.reset(h.x + h.width / 2, 1.2 * 64);
      s.player.climb = 'cling';
    }
    void sala;
  }, [passo.via, passo.sala]);

  await page.waitForTimeout(250);

  if (passo.via === 'elevador') {
    await page.keyboard.down('KeyE');
    await page.waitForTimeout(160);
    await page.keyboard.up('KeyE');
  } else if (passo.via === 'leste' || passo.via === 'portao') {
    await page.keyboard.down('KeyD');
  }

  // a chegada é a condição — o fade é medido em frames e esta máquina não é rápida
  const chegou = await page.waitForFunction((alvo) => {
    const s = window.__game.scene.getScene('Game');
    return s.area.id === alvo && !s.busy;
  }, passo.para, { timeout: 25000 }).then(() => true).catch(() => false);

  await page.keyboard.up('KeyD').catch(() => {});
  return chegou;
};

// ---------- 1. as 15 passagens setor a setor ----------
for (const passo of PASSAGENS) {
  await abrir(passo.de, passo.sala, passo);
  const antes = await estado();
  const chegou = await atravessar(passo);
  const depois = await estado();
  exigir(chegou && depois.area === passo.para,
    `${passo.de} → ${passo.para} pela ${passo.via}: a passagem existe e leva a ${passo.para} (chegou a ${depois.area} · ${depois.sala})`);
  if (chegou) {
    exigir(depois.hp === antes.hp && depois.escudo === antes.escudo,
      `${passo.de} → ${passo.para}: a vida e o escudo viajam (${antes.hp}/${antes.escudo} → ${depois.hp}/${depois.escudo})`);
    exigir(depois.forca === antes.forca && depois.garra === antes.garra,
      `${passo.de} → ${passo.para}: o kit não se perde na transição`);
  }
}

// ---------- 2. o elevador de LVL-05 **sem** a Força não sobe ----------
await abrir('LVL-05', 2, { itens: ['ITM-003'] });
const semForca = await cena(() => {
  const s = window.__game.scene.getScene('Game');
  s.player.abilities.strength = false;
  const u = s.built.elevators[0];
  s.player.body.reset(u.x - 30, 6 * 64 - 30);
  return u.x;
});
await page.waitForTimeout(250);
await page.keyboard.down('KeyE');
await page.waitForTimeout(160);
await page.keyboard.up('KeyE');
await page.waitForTimeout(1600);
const travado = await estado();
exigir(travado.area === 'LVL-05',
  `LVL-05: o elevador sem Força não sobe — o setor entrega a habilidade antes de a cobrar (${travado.area}, x=${Math.round(semForca)})`);

// ---------- 3. o portão de LVL-14 com uma chave só ----------
await abrir('LVL-14', 5, { itens: ['ITM-003', 'ITM-004', 'ITM-009', 'ITM-010'] });
await cena(() => window.__game.scene.getScene('Game').player.body.reset(window.__game.scene.getScene('Game').built.worldWidth - 60, 6 * 64 - 30));
await page.keyboard.down('KeyD');
await page.waitForTimeout(1400);
await page.keyboard.up('KeyD');
await page.waitForTimeout(500);
const umaChave = await estado();
exigir(umaChave.area === 'LVL-14',
  `LVL-14: com uma chave o portão não abre — a fechadura de duas é a sério (${umaChave.area})`);

// ---------- 4. o fim: o trono de LVL-16 ----------
await abrir('LVL-16', 5, { itens: ['ITM-003', 'ITM-004', 'ITM-007', 'ITM-011', 'ITM-009', 'ITM-010'] });
const trono = await cena(async () => {
  const s = window.__game.scene.getScene('Game');
  const t = s.built.throne;
  if (!t) return { semTrono: true };
  s.player.body.reset(t.x, 7 * 64 - 6);
  await new Promise((r) => setTimeout(r, 200));
  s.tryThrone();
  await new Promise((r) => setTimeout(r, 900));
  return { terminou: s.terminou, area: s.area.id };
});
exigir(!trono.semTrono, 'L16-06: o trono existe na última sala do jogo');
exigir(trono.terminou === true, 'L16-06: sentar no trono **termina** o jogo (`MEC-012`)');
const fim = await cena(async () => {
  // o relatório chega por `game:metrics` um tique depois do `game:end` — esperar a condição,
  // nunca um número de milissegundos
  const limite = performance.now() + 5000;
  while (!document.querySelector('.report') && performance.now() < limite) {
    await new Promise((r) => setTimeout(r, 100));
  }
  const painel = document.querySelector('[aria-label="Fim do jogo"]');
  return {
    cracha: !!document.querySelector('.badge'),
    texto: painel ? painel.innerText.replace(/\n/g, ' ').slice(0, 90) : null,
    recorte: document.body.innerText.includes('FIM DO RECORTE'),
    relatorio: document.querySelector('.report')
      ? document.querySelector('.report').innerText.replace(/\s+/g, ' ').slice(0, 80) : null,
  };
});
exigir(fim.cracha, `o fim mostra o crachá de LVL-16, não um ecrã de recorte (${fim.texto})`);
exigir(!fim.recorte, 'e o «FIM DO RECORTE» de LVL-03 deixou de existir no jogo');
// `DEC-022` / `P-29`: o relatório de sessão não morreu com o painel do recorte — mudou de fim
exigir(!!fim.relatorio, `o relatório de sessão continua exportável no fim (${fim.relatorio})`);
await page.screenshot({ path: `${process.env.SMOKE_OUT ?? '/tmp'}/campanha-01-fim.png`, fullPage: true });

exigir(errors.length === 0, `sem erros de consola${errors.length ? ': ' + errors[0] : ''}`);
await browser.close();

if (falhas.length) {
  console.log(`\n${falhas.length} FALHA(S):`);
  for (const f of falhas) console.log(`- ${f}`);
  process.exit(1);
}
console.log('\nCAMPANHA OK');
