/**
 * `DEC-042` — **o drop raro de chefe**, ao vivo (`npm run drop` com o `npm run dev` no ar).
 *
 * O que os 16 casos puros (`core/drop.test.ts`) não conseguem provar e este prova:
 *
 * 1. O **contador vive na cena e sobrevive à morte**: onze chefes sem drop deixam o jogador a 11/12.
 * 2. O aviso diz a verdade (`NADA RARO CAIU · n / 12`) — o jogador sabe que a garantia existe.
 * 3. Ao 12.º chefe **o item cai no chão**, é apanhável e **dá a habilidade**.
 * 4. Apanhado o item, o contador **volta a zero** e aquela rara **não volta a cair**.
 * 5. O que caiu **vai para o save** — fechar o jogo não custa um drop de sorte.
 * 6. O painel das habilidades (`UI-14`) mostra-a **conquistada a nível 1 de 10**, e não trancada.
 *
 * O teste força o gerador (`s.rngDrop`) em vez de matar doze chefes: matar um chefe a sério é uma
 * luta de minutos, e a regra a testar não é o combate — é o que acontece **depois** dele.
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
await page.waitForTimeout(400);

const cena = (fn, arg) => page.evaluate(fn, arg);
const estado = () => cena(() => {
  const s = window.__game.scene.getScene('Game');
  return {
    tentativas: s.tentativasDrop,
    coletados: [...s.collected],
    conquistadas: Object.entries(s.niveis).filter(([, n]) => n > 0).map(([h, n]) => `${h}:${n}`),
    noChao: s.children.list
      .filter((o) => o.getData && o.getData('itemId'))
      .map((o) => ({ id: o.getData('itemId'), x: Math.round(o.x), y: Math.round(o.y) })),
  };
});

/** Um chefe derrotado, com a sorte que o teste quiser. */
const matarChefe = (r) => cena((sorte) => {
  const s = window.__game.scene.getScene('Game');
  s.rngDrop = () => sorte;
  s.aoMatarChefe();
  return s.tentativasDrop;
}, r);

// ---------- 1. onze chefes com azar: o contador sobe e nada cai ----------
const trancadasAntes = await cena(() => {
  const s = window.__game.scene.getScene('Game');
  // estado limpo: nenhuma rara apanhada e o contador a zero, como num save novo
  s.collected = s.collected.filter((id) => !['ITM-008', 'ITM-009', 'ITM-010'].includes(id));
  s.tentativasDrop = 0;
  s.niveis = { ...s.niveis, hook: 0, climb: 0, glide: 0 };
  s.player.abilities.hook = false;
  s.player.abilities.climb = false;
  s.player.abilities.glide = false;
  s.aplicarNiveis();
  s.pushHabilidades();
  // quantas linhas o painel mostra trancadas agora — o drop tem de tirar exactamente uma
  const flags = s.player.abilities;
  const chave = { 'double-jump': 'doubleJump', strength: 'strength', breath: 'breath',
    hook: 'hook', climb: 'climb', glide: 'glide' };
  return Object.entries(chave).filter(([id, f]) => !(s.niveis[id] > 0 && flags[f])).length;
});
for (let i = 1; i <= 11; i += 1) await matarChefe(0.99);
const azar = await estado();
exigir(azar.tentativas === 11, `onze chefes sem drop deixam o contador a 11 (${azar.tentativas})`);
exigir(azar.noChao.length === 0, 'e não há item nenhum no chão');
exigir(!azar.coletados.some((id) => ['ITM-008', 'ITM-009', 'ITM-010'].includes(id)),
  'nenhuma habilidade rara entrou na mochila por onze chefes de azar');
await page.waitForTimeout(200);
const avisoDoAzar = await cena(() => document.querySelector('.toast')?.textContent ?? '');
exigir(/NADA RARO CAIU · 11 \/ 12/.test(avisoDoAzar),
  `o aviso diz quanto falta para a garantia (${avisoDoAzar})`);

// ---------- 2. o 12.º chefe entrega, mesmo com a pior sorte possível ----------
await matarChefe(0.99);
const garantido = await estado();
exigir(garantido.tentativas === 0,
  `ao 12.º chefe o item cai e o contador volta a zero (${garantido.tentativas})`);
const rarasGanhas = garantido.coletados.filter((id) => ['ITM-008', 'ITM-009', 'ITM-010'].includes(id));
exigir(rarasGanhas.length === 1, `e uma rara entrou na mochila (${rarasGanhas.length})`);
const raro = rarasGanhas[0];
exigir(['ITM-008', 'ITM-009', 'ITM-010'].includes(raro),
  `o que caiu é uma das três raras (${raro})`);
const habilidade = { 'ITM-008': 'hook', 'ITM-009': 'climb', 'ITM-010': 'glide' }[raro];
exigir(garantido.conquistadas.includes(`${habilidade}:1`),
  `e a habilidade ficou conquistada a nível 1 (${garantido.conquistadas.join(', ')})`);
// o texto de lore é o da habilidade (`collectItem` escreve por cima); a **razão** do drop vive no
// aviso, e é ela que diz ao jogador se teve sorte ou se a garantia o salvou
const avisoDoDrop = await cena(() => document.querySelector('.toast')?.textContent ?? '');
exigir(/GARANTIA · /.test(avisoDoDrop),
  `o aviso diz que veio da garantia, não da sorte (${avisoDoDrop})`);

// o drop raro entrega **na hora** (`DEC-042`): não fica um item no chão que se possa perder
exigir(garantido.noChao.length === 0,
  'não fica item nenhum deitado no chão — o drop é entregue no momento');
exigir(!(await cena(() => {
  const s = window.__game.scene.getScene('Game');
  return s.children.list.some((o) => o.getData && o.getData('itemId'));
})), 'e nenhuma zona de recolha ficou pendente na sala');

// ---------- 3. vai para o save logo no drop, sem esperar por nada ----------
const guardadoNoDrop = await cena(() => {
  for (const k of Object.keys(localStorage)) {
    const cru = localStorage.getItem(k) ?? '';
    if (!cru.includes('tentativasDrop')) continue;
    try {
      const v = JSON.parse(cru);
      const p = v.progress ?? v;
      return { tentativasDrop: p.tentativasDrop, coletados: p.coletados };
    } catch { /* outra chave */ }
  }
  return null;
});
exigir(guardadoNoDrop?.coletados?.includes(raro),
  `o drop foi gravado no save no próprio instante (${raro})`);
exigir(guardadoNoDrop?.tentativasDrop === 0,
  `e o contador gravado voltou a zero (${guardadoNoDrop?.tentativasDrop})`);

// ---------- 4. o que já se tem não volta a cair ----------
await matarChefe(0); // sorte máxima: se pudesse repetir a mesma, repetia já
const sobra = await estado();
const rarasAgora = sobra.coletados.filter((id) => ['ITM-008', 'ITM-009', 'ITM-010'].includes(id));
exigir(rarasAgora.length === 2, `o chefe seguinte faz cair outra rara (${rarasAgora.join(', ')})`);
exigir(!rarasAgora.includes(raro) || rarasAgora.filter((id) => id === raro).length === 1,
  'e nunca a mesma duas vezes: o sorteio só olha para o que falta');

// ---------- 5. o painel mostra a rara conquistada, não trancada ----------
await page.keyboard.press('KeyH');
const painel = page.locator('[aria-label="Habilidades"]');
await painel.waitFor({ state: 'visible', timeout: 5000 });
const linhas = await page.locator('.hab__linha').evaluateAll((els) =>
  els.map((e) => e.getAttribute('aria-label')));
const linhaDaRara = linhas.find((l) =>
  l?.startsWith({ hook: 'GANCHO', climb: 'GARRA', glide: 'ESTANDARTE' }[habilidade])) ?? '';
exigir(/nível 1 de 10/.test(linhaDaRara) && !/não conquistada/.test(linhaDaRara),
  `o painel mostra ${habilidade} conquistada a nível 1 de 10 (${linhaDaRara})`);
exigir(await page.locator('.hab__linha--trancada').count() === trancadasAntes - 2,
  `duas linhas trancadas a menos: ${trancadasAntes} → ${await page.locator('.hab__linha--trancada').count()}`);
await page.screenshot({ path: `${OUT}/drop-01-painel.png`, fullPage: true });
await page.keyboard.press('Escape');
await painel.waitFor({ state: 'hidden', timeout: 5000 });

exigir(errors.length === 0, `sem erros de consola${errors.length ? ': ' + errors[0] : ''}`);
await browser.close();

if (falhas.length) {
  console.log(`\n${falhas.length} FALHA(S):`);
  for (const f of falhas) console.log(`- ${f}`);
  process.exit(1);
}
console.log('\nDROP RARO OK');
