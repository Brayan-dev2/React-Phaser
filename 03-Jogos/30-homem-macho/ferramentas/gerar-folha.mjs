#!/usr/bin/env node
/**
 * `node ferramentas/gerar-folha.mjs` — gera `ferramentas/folha-de-medidas.html`.
 *
 * A tabela da doc diz os números; esta folha mostra-os. Cada personagem aparece em três caixas
 * sobrepostas — **célula** (o que o PNG mede), **área útil** (onde o desenho pode viver) e
 * **hurtbox** (o que dói, e que vem do `tuning.ts`) — à escala de 1 px do jogo. Um artista que
 * desenhe dentro da linha certa não tem como errar a entrega.
 *
 * Lê `src/game/data/arte.json`: a folha não pode discordar do manifesto.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = process.cwd();
const manifesto = JSON.parse(readFileSync(join(RAIZ, 'src/game/data/arte.json'), 'utf8'));
const { tile, view } = manifesto.base;
const totalFrames = (p) => p.acoes.reduce((s, a) => s + a.frames, 0);
const folha = (p) => {
  const linhas = Math.ceil(totalFrames(p) / p.colunas);
  return { w: p.colunas * p.frame.w, h: linhas * p.frame.h };
};

const correcoes = manifesto.pecas.filter((p) => p.hurtbox);
const semCorpo = manifesto.pecas.filter((p) => !p.hurtbox);

/** Desenha uma célula com as três caixas, centrada e com o fundo encostado em baixo. */
function celula(p, escala) {
  const { w: W, h: H } = p.frame;
  const { w: uW, h: uH } = p.util;
  const b = p.hurtbox;
  const ux = (W - uW) / 2;
  const bx = b ? (W - b.w) / 2 : 0;
  return `
  <svg viewBox="0 0 ${W} ${H}" width="${W * escala}" height="${H * escala}" class="celula"
       role="img" aria-label="${p.chave}: célula ${W}x${H}, útil ${uW}x${uH}${b ? `, hurtbox ${b.w}x${b.h}` : ''}">
    <rect x="0" y="0" width="${W}" height="${H}" class="cel"/>
    <rect x="${ux}" y="${H - uH}" width="${uW}" height="${uH}" class="util"/>
    ${b ? `<rect x="${bx}" y="${H - b.h}" width="${b.w}" height="${b.h}" class="hurt"/>` : ''}
    <line x1="${W / 2}" y1="0" x2="${W / 2}" y2="${H}" class="eixo"/>
    <line x1="0" y1="${H - 1}" x2="${W}" y2="${H - 1}" class="chao"/>
    <text x="4" y="14" class="rot">${W}×${H}</text>
  </svg>`;
}

/** Uma sala inteira em tiles, para o artista ver o mundo e não só a célula. */
function grade() {
  const { linhas, largurasTiles } = manifesto.base.salas;
  const s = 8;                                   // 8 px por tile na vista de conjunto
  const W = largurasTiles[0] * s * linhas;       // as três larguras, lado a lado
  const celulas = largurasTiles.map((larg, i) => {
    const x = i * larg * s * 1.06;
    const grade = Array.from({ length: linhas }, (_, r) => Array.from({ length: larg }, (_, c) =>
      `<rect x="${x + c * s}" y="${r * s}" width="${s}" height="${s}" class="tile"/>`).join('')).join('');
    return `${grade}<text x="${x}" y="${linhas * s + 14}" class="rot">${larg} × ${linhas} tiles = ${larg * tile} × ${linhas * tile} px</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${linhas * s + 20}" width="${Math.min(W, 940)}" height="${(linhas * s + 20) * Math.min(1, 940 / W)}">
    ${celulas}
    <rect x="0" y="0" width="${largurasTiles[0] * s}" height="${linhas * s}" class="haver"/>
  </svg>`;
}


/** Galeria a 1 px do jogo: aqui as caixas medem exatamente o que o PNG vai medir. */
function galeria() {
  const chaves = ['player', 'sentinel', 'boss', 'guardiao', 'tm_ruinas', 'itens', 'spark'];
  return manifesto.pecas.filter((p) => chaves.includes(p.chave)).map((p) => `
    <figure>
      ${celula(p, 1)}
      <figcaption><b>${p.chave}</b><br>célula ${p.frame.w}×${p.frame.h}<br>útil ${p.util.w}×${p.util.h}${p.hurtbox ? `<br>hurtbox ${p.hurtbox.w}×${p.hurtbox.h}` : ''}</figcaption>
    </figure>`).join('');
}

const linhaCorpo = (p) => `
  <tr>
    <td class="mono">${p.id}</td>
    <td>${p.onde}</td>
    <td class="mono">${p.frame.w}×${p.frame.h}</td>
    <td class="mono">${p.util.w}×${p.util.h}</td>
    <td class="mono">${p.hurtbox ? `${p.hurtbox.w}×${p.hurtbox.h}` : '—'}</td>
    <td class="mono">${p.colunas}</td>
    <td class="mono">${totalFrames(p)}</td>
    <td class="mono">${folha(p).w}×${folha(p).h}</td>
    <td class="mini">${celula(p, Math.min(1, 104 / p.frame.h))}</td>
  </tr>`;

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Folha de medidas — Homem Macho</title>
<style>
  :root { --ink:#0B0910; --bg:#15131F; --mass:#2A2433; --stone:#464052; --bone:#E6DFD2;
          --gold:#F2C66D; --threat:#D95555; --text:#F8F7F2; }
  * { box-sizing: border-box; }
  body { margin:0; padding:26px; background:var(--ink); color:var(--text);
         font:13px/1.55 ui-monospace, Menlo, monospace; }
  h1 { font-size:18px; letter-spacing:.16em; color:var(--bone); margin:0 0 4px; }
  h2 { font-size:12px; letter-spacing:.22em; color:var(--gold); margin:26px 0 8px; }
  p.sub { margin:0 0 18px; color:var(--bone); opacity:.72; max-width:90ch; }
  table { border-collapse:collapse; width:100%; }
  th, td { text-align:left; padding:6px 8px; border-bottom:1px solid var(--mass); vertical-align:bottom; }
  th { color:var(--stone); font-weight:400; font-size:10px; letter-spacing:.16em; }
  .mono { font-variant-numeric:tabular-nums; color:var(--bone); }
  .celula { display:block; background:rgba(42,36,51,.35); }
  .cel { fill:none; stroke:var(--stone); stroke-width:1; }
  .util { fill:rgba(242,198,109,.06); stroke:var(--gold); stroke-dasharray:4 3; stroke-width:1; }
  .hurt { fill:rgba(217,85,85,.16); stroke:var(--threat); stroke-width:1; }
  .eixo { stroke:var(--stone); stroke-dasharray:2 4; stroke-width:1; }
  .chao { stroke:var(--gold); stroke-width:1; }
  .rot { fill:var(--stone); font-size:9px; letter-spacing:.1em; }
  .tile { fill:none; stroke:var(--mass); stroke-width:.5; }
  .haver { fill:rgba(242,198,109,.05); stroke:var(--gold); stroke-width:.8; }
  .legenda { display:flex; gap:18px; flex-wrap:wrap; margin:10px 0 0; color:var(--bone); opacity:.8; }
  .legenda span::before { content:''; display:inline-block; width:10px; height:10px; margin-right:6px;
                          border:1px solid currentColor; vertical-align:-1px; }
  .l-cel::before { color:var(--stone) !important; }
  .l-util::before { color:var(--gold) !important; }
  .l-hurt::before { color:var(--threat) !important; background:rgba(217,85,85,.16); }
  .mini { width:120px; text-align:right; }
  .galeria { display:flex; gap:22px; flex-wrap:wrap; align-items:flex-end; }
  .galeria figure { margin:0; display:grid; gap:6px; justify-items:start; }
  .galeria figcaption { font-size:9px; letter-spacing:.06em; color:var(--stone); line-height:1.5; }
  .galeria figcaption b { color:var(--bone); letter-spacing:.14em; }
  footer { margin-top:26px; color:var(--stone); font-size:10px; letter-spacing:.14em; }
</style></head><body>
<h1>FOLHA DE MEDIDAS — HOMEM MACHO</h1>
<p class="sub">Gerada de <code>src/game/data/arte.json</code>. Tile ${tile} px · viewport ${view.w}×${view.h}
(${view.w / tile}×${view.h / tile} tiles) · atlas máximo ${manifesto.base.atlasMax}² ·
animação ${manifesto.base.fpsMin}–${manifesto.base.fpsMax} fps.</p>

<div class="legenda">
  <span class="l-cel">célula — o que o PNG mede</span>
  <span class="l-util">área útil — onde o desenho pode viver</span>
  <span class="l-hurt">hurtbox — do <code>tuning.ts</code>, não da arte</span>
</div>

<h2>PERSONAGENS E CHEFES</h2>
<table>
  <tr><th>ID</th><th>Quem</th><th>Célula</th><th>Útil</th><th>Hurtbox</th><th>Cols</th><th>Frames</th><th>Folha</th><th>Proporção</th></tr>
  ${correcoes.map(linhaCorpo).join('')}
</table>

<h2>ITENS, TILESETS, FUNDOS</h2>
<table>
  <tr><th>ID</th><th>O que é</th><th>Célula</th><th>Útil</th><th>Hurtbox</th><th>Cols</th><th>Frames</th><th>Folha</th><th>Proporção</th></tr>
  ${semCorpo.map(linhaCorpo).join('')}
</table>

<h2>CÉLULAS A 1:1</h2>
<p class="sub">Nesta secção nada está reduzido: 1 px do desenho = 1 px do jogo. O teu PNG tem de ter
exatamente a largura e a altura da caixa exterior.</p>
<div class="galeria">${galeria()}</div>

<h2>O MUNDO EM TILES</h2>
<p class="sub">A altura de uma sala é sempre ${manifesto.base.salas.linhas} tiles. As larguras são as três
que a grade usa; a moldura dourada é um ecrã inteiro.</p>
${grade()}

<footer>RECOMECAR: node ferramentas/gerar-folha.mjs · REGRAS: docs/14-arte-tilesets-e-spritesheets.md</footer>
</body></html>
`;

const destino = join(RAIZ, 'ferramentas/folha-de-medidas.html');
writeFileSync(destino, html, 'utf8');
console.log(`folha escrita: ${destino} (${manifesto.pecas.length} peças)`);
