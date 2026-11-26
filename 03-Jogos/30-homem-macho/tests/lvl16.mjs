/**
 * Verificação de LVL-16 (`[PÓS]`) no navegador — `node tests/lvl16.mjs`.
 *
 * **O último setor do jogo**, e as quatro coisas que ele pode estragar para sempre:
 *
 *  1. **o chefe não tem vida.** `ENT-008` tem **postura** (100/125/150, golpe de 25) e se
 *     vence com **três baixas assinadas**. Se algum caminho der HP a ele, o sexto chefe vira o
 *     primeiro outra vez (`TST-018`);
 *  2. **a grade não abre com 0 HP** — não existe 0 HP. Ela abre com a 3ª baixa;
 *  3. **as baixas sobrevivem à morte do jogador**; a postura não (§10.1) — o oposto de LVL-15;
 *  4. **o Caos não tira vida** (§`DEC-018`): o desgaste abre buracos, **nunca 3 contíguos**, e
 *     cair devolve o jogador à entrada sem um único ponto de dano;
 *  5. **`MEC-012` é uma tecla**, idempotente, sem estado de falha — e ela encerra o jogo.
 */
import { chromium } from 'playwright';

const URL = process.env.SMOKE_URL ?? 'http://localhost:5173/?skip=menu';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => { errors.push('PAGEERROR: ' + e.message); console.error('PAGEERROR', e.message); });
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game?.scene.isActive('Game'), null, { timeout: 20000 });
await page.evaluate(() => { window.__game.loop._coolDown = 0; });

const go = async (room) => {
  await page.evaluate(async (i) => {
    const s = window.__game.scene.getScene('Game');
    s.player?.releaseHook?.();
    s.player?.releaseClimb?.();
    s.player.gliding = false;
    s.player.body.setAllowGravity(true);
    s.busy = false;
    s.scene.restart({ area: 'LVL-16', room: i });
    await new Promise((r) => setTimeout(r, 900));
  }, room);
  await page.waitForTimeout(500);
};

const place = async (x, y) => {
  await page.evaluate(([px, py]) => {
    const s = window.__game.scene.getScene('Game');
    s.player.setPosition(px, py);
    s.player.body.reset(px, py);
  }, [x, y]);
  await page.waitForTimeout(150);
};

const report = {};

// 1. os corredores do Trono: 134 tiles no setor, zero plataforma, `bgm=none`
await go(0);
report.corredores = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    area: s.area.id,
    salas: s.rooms.length,
    plataformas: s.built.platforms.getLength(),
    sentinelas: s.built.sentinels.length,
    paredesNuas: s.built.decorBack.filter((d) => d.kind === 'bare-stone').length,
    luzDeVinho: s.built.decor.filter((d) => d.kind === 'wine-light').length,
    bgm: 'none',
    esperado: '6 salas · 0 plataformas · 1 Sentinela no patamar · pedra nua e vinho',
  };
});

// 2. a fila: a senha nunca foi retirada — `000` não é bug de display
await go(1);
report.fila = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(s.built.dispenser.x, 448);
  s.player.body.reset(s.built.dispenser.x, 448);
  await new Promise((r) => setTimeout(r, 200));
  return {
    display: s.built.dispenser.display,
    cadeiras: s.built.decorBack.filter((d) => d.kind === 'empty-chair').length,
    sentinelas: s.built.sentinels.length,
    esperado: 'SENHA ATUAL: 000 · 6 cadeiras desenhadas (40 implicadas)',
  };
});

// 3. o formulário: 5 linhas, e a última é a única permissão para não matar
report.formulario = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    linhas: s.rooms[2].texts['8,6'],
    palavras: s.rooms[2].texts['8,6'].join(' ').split(/\s+/).length,
    esperado: '5 linhas com "NÃO É NECESSÁRIO MATAR."',
  };
});

// 4. a arena: **o chefe sem vida**, o posto, a grade fechada e o posto inalcançável
await go(3);
await place(4 * 64, 448);
report.arena = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  await new Promise((r) => setTimeout(r, 600));
  const p = s.plantonista;
  return {
    existe: !!p,
    temHp: p ? 'hp' in p : null,
    postura: p?.poise,
    maxPostura: p?.maxPoise,
    baixas: p?.baixas,
    estado: p?.state,
    posto: !!s.built.posto,
    gradeFechada: !s.built.eastOpen,
    dano: s.mecanicaDeDano ?? 'não existe',
    esperado: 'chefe **sem `hp`** · postura 100 · grade fechada · posto em x=21',
  };
});

// 5. quinze golpes de 25: quatro na 1ª baixa, e ele **não morre** — ele cambaleia
report.quinzeGolpes = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const p = s.plantonista;
  p.poise = 100;
  const seq = [];
  for (let i = 0; i < 4; i++) {
    p.takeGolpe(s.time.now);
    seq.push(p.poise);
  }
  await new Promise((r) => setTimeout(r, 300));
  const estado = p.state;
  // a postura **não** é vida: passados os 4.500 ms, ele volta inteiro (100) e sem baixa
  await new Promise((r) => setTimeout(r, 4600));
  return {
    posturas: seq,
    estadoApos4: estado,
    depoisDoAtordoamento: { estado: p.state, postura: p.poise, baixas: p.baixas },
    vivo: p.alive,
    gradeSegue: !s.built.eastOpen,
    esperado: '75 · 50 · 25 · 0 → `atordoado` · volta com 100 de postura e 0 baixas',
  };
});

// 6. `MEC-011`: segurar `E` no posto por 3.000 ms assina **uma** baixa
await go(3);
await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const p = s.plantonista;
  s.player.setPosition(s.built.posto.x - 40, 448);
  s.player.body.reset(s.built.posto.x - 40, 448);
  p.poise = 25;
  p.takeGolpe(s.time.now);                     // 0 de postura → atordoado
  await new Promise((r) => setTimeout(r, 420)); // passou o cambaleio de 300 ms
});
await page.keyboard.down('KeyE');
await page.waitForTimeout(3300);
await page.keyboard.up('KeyE');
report.baixa = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const p = s.plantonista;
  const depois = { baixas: p.baixas, postura: p.poise, max: p.maxPoise };
  // §10.1: a morte do jogador **não** desassina o que já foi assinado
  s.onPlayerDeath();
  await new Promise((r) => setTimeout(r, 1600));
  return {
    depois,
    aposMorte: { baixas: s.plantonista?.baixas, postura: s.plantonista?.poise },
    esperado: '1 baixa assinada · postura volta a 125 · depois da morte: baixas 1, postura 125',
  };
});

// 7. `ATK-21` protocolo: 3 golpes em 4 s abrem a janela, e bater nela **não tira postura**
report.protocolo = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const p = s.plantonista;
  p.state = 'avanco';                          // limpa o atordoamento do teste anterior
  p.poise = p.maxPoise;
  p.hits = [];
  // três golpes **no passado recente**: o protocolo conta a janela de 4.000 ms
  const t = s.time.now;
  p.takeGolpe(t - 300);
  p.takeGolpe(t - 200);
  p.takeGolpe(t - 100);
  await new Promise((r) => setTimeout(r, 700));
  const janelaAberta = p.protocolOpen;
  const antes = p.poise;
  p.takeGolpe(s.time.now);                     // bateu na janela: contra-ataque, postura intacta
  const depois = p.poise;
  return {
    estado: p.state,
    janelaAberta,
    posturaAntes: antes,
    posturaDepois: depois,
    esperado: '3 golpes em ≤4 s → `protocolo` com janela de 1.400 ms; bater nela não muda postura',
  };
});

// 8. o desgaste: o chão racha, cede e **não tira vida** — e nunca 3 contíguos
await go(3);
report.desgaste = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const p = s.plantonista;
  p.state = 'posto';
  s.player.setPosition(8 * 64, 448);
  s.player.body.reset(8 * 64, 448);
  const hp0 = s.player.resources.hp;
  await new Promise((r) => setTimeout(r, 2400));   // 1.400 racha + 2.000 cede
  const rachou = !!s.crackSprite || s.holeTiles.size > 0;
  const buracos = s.holeTiles.size;
  // a regra de segurança, medida no mundo real: nenhum trio contíguo
  const ordenados = [...s.holeTiles].sort((a, b) => a - b);
  let tresContiguos = false;
  for (let i = 0; i + 2 < ordenados.length; i++) {
    if (ordenados[i + 1] === ordenados[i] + 1 && ordenados[i + 2] === ordenados[i] + 2) {
      tresContiguos = true;
    }
  }
  return {
    rachou,
    buracos,
    tresContiguos,
    vida: { antes: hp0, depois: s.player.resources.hp },
    esperado: 'rachadura visível · ≥1 buraco · **nunca** 3 contíguos · dano 0',
  };
});

// 9. a rendição: a 3ª baixa abre a grade — e **só** ela
report.rendicao = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  const p = s.plantonista;
  s.postoBaixas = 2;
  p.baixas = 2;
  p.poise = 25;
  p.takeGolpe(s.time.now);
  await new Promise((r) => setTimeout(r, 400));
  p.signBaixa(s.time.now);
  await new Promise((r) => setTimeout(r, 500));
  return {
    baixas: p.baixas,
    estado: p.state,
    rendido: s.postoRendido,
    gradeAberta: s.built.eastOpen,
    vivo: p.alive,
    esperado: '3ª baixa → `rendido`, grade abre, ele **não** morre (`MEC-009` nunca roda)',
  };
});

// 10. `MEC-012`: uma tecla, uma vez, e o jogo termina com o crachá
await go(5);
report.fim = await page.evaluate(async () => {
  const s = window.__game.scene.getScene('Game');
  s.player.setPosition(s.built.throne.x - 30, 448);
  s.player.body.reset(s.built.throne.x - 30, 448);
  await new Promise((r) => setTimeout(r, 200));
  const porta = s.current.throne;
  const primeira = s.tryThrone();
  const segunda = s.tryThrone();               // idempotente (`PAT-C-07`)
  const eventos = (window.__events ?? []).filter((e) => e.type === 'game:end');
  return {
    trono: porta,
    portaOeste: s.current.grid[4][0],
    portaLeste: s.current.grid[4].at(-1),
    primeira,
    segunda,
    terminou: s.terminou,
    eventosGameEnd: eventos.length,
    cracha: eventos[0]?.badge,
    esperado: 'parede leste sólida · `MEC-012` processa **uma vez** · crachá de 3 linhas',
  };
});

report.erros = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
