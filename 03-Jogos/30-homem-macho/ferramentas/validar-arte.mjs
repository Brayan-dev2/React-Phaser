#!/usr/bin/env node
/**
 * `npm run arte` — **o encaixe da arte, medido**.
 *
 * Compara o que está em `public/assets/` com as medidas de `src/game/data/arte.json` e diz, ficheiro
 * a ficheiro, se o PNG tem o tamanho que o jogo espera. Não é um linter de gosto: é a diferença
 * entre "o artista entregou" e "o sprite entrou torto no jogo".
 *
 * Lê o cabeçalho PNG à mão (8 bytes de assinatura + `IHDR`) porque uma dependência nova para ler
 * dois inteiros é uma dependência a mais para manter. Sem instalação, sem rede.
 *
 * Uso:
 *   node ferramentas/validar-arte.mjs            # valida o que existe e lista o que falta
 *   node ferramentas/validar-arte.mjs --lista    # só a lista de folhas a produzir (com medidas)
 *   node ferramentas/validar-arte.mjs --exigir   # falha também quando falta ficheiro (CI pré-arte)
 *
 * Saída: 0 = tudo o que existe encaixa · 1 = há tamanho errado (ou falta, com `--exigir`)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const RAIZ = process.cwd();
const MANIFESTO = join(RAIZ, 'src/game/data/arte.json');
const PASTAS = [
  join(RAIZ, 'public/assets/images'),
  join(RAIZ, 'public/assets/atlases'),
  join(RAIZ, 'public/assets/tilemaps'),
];

const args = new Set(process.argv.slice(2));
const SO_LISTA = args.has('--lista');
const EXIGIR = args.has('--exigir');

/** Cabeçalho PNG: assinatura de 8 bytes, tamanho do `IHDR` (4), tipo `IHDR` (4) e então os dados. */
export function medirPng(bytes) {
  const assinatura = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 33 || assinatura.some((b, i) => bytes[i] !== b)) {
    return { erro: 'não é PNG' };
  }
  if (bytes.toString('latin1', 12, 16) !== 'IHDR') return { erro: 'PNG sem IHDR' };
  return {
    w: bytes.readUInt32BE(16),
    h: bytes.readUInt32BE(20),
    bits: bytes[24],
    // 6 = RGBA · 4 = cinza+alfa · 2 = RGB · 3 = paleta · 0 = cinza
    cor: bytes[25],
    rgba: bytes[25] === 6,
    paleta: bytes[25] === 3,
    interlace: bytes[28],
  };
}

function pngs(diretorio) {
  if (!existsSync(diretorio)) return [];
  return readdirSync(diretorio, { withFileTypes: true }).flatMap((e) => {
    const caminho = join(diretorio, e.name);
    if (e.isDirectory()) return pngs(caminho);
    return e.name.toLowerCase().endsWith('.png') ? [caminho] : [];
  });
}

const manifesto = JSON.parse(readFileSync(MANIFESTO, 'utf8'));
const atlasMax = manifesto.base.atlasMax;

const totalFrames = (p) => p.acoes.reduce((s, a) => s + a.frames, 0);
const folha = (p) => {
  const linhas = Math.ceil(totalFrames(p) / p.colunas);
  return { w: p.colunas * p.frame.w, h: linhas * p.frame.h, linhas };
};
/** Cada tipo de peça tem a sua pasta: tiles vão para `tilemaps`, o resto para `images`. */
const pasta = (p) => (p.tipo === 'tileset'
  ? join(RAIZ, 'public/assets/tilemaps')
  : join(RAIZ, 'public/assets/images'));

const pecas = manifesto.pecas;

if (SO_LISTA) {
  const porTipo = {};
  for (const p of pecas) (porTipo[p.tipo] ??= []).push(p);
  console.log('\nFOLHAS A PRODUZIR — medidas de src/game/data/arte.json\n');
  for (const [tipo, lista] of Object.entries(porTipo)) {
    console.log(`  ${tipo.toUpperCase()}`);
    for (const p of lista) {
      const f = folha(p);
      const frames = totalFrames(p);
      console.log(
        `    ${p.ficheiro.padEnd(22)} ${String(f.w).padStart(4)}×${String(f.h).padEnd(4)}`
        + `  célula ${p.frame.w}×${p.frame.h} · ${frames} frame(s) · ${p.colunas} col.`
        + `  ${p.onde}`,
      );
    }
    console.log('');
  }
  console.log('Os fundos (1280×720 / 1280×704 / 704×640) são uma imagem por peça: o `colunas` é 1.\n');
  process.exit(0);
}

// --- comparação ---
const encontrados = PASTAS.flatMap(pngs);
const porNome = new Map(encontrados.map((c) => [caminhoRelativo(c), c]));

function caminhoRelativo(c) { return relative(RAIZ, c).replaceAll('\\', '/'); }

const linhas = [];
let erros = 0;
let faltas = 0;
let prontas = 0;

for (const p of pecas) {
  const f = folha(p);
  const esperado = join(pasta(p), p.ficheiro);
  const rel = caminhoRelativo(esperado);
  const existe = existsSync(esperado);

  if (!existe) {
    faltas += 1;
    linhas.push({ estado: 'falta', ficheiro: rel, esperado: `${f.w}×${f.h}`, obtido: '—', nota: p.onde });
    continue;
  }

  const bytes = readFileSync(esperado);
  const m = medirPng(bytes);
  if (m.erro) {
    erros += 1;
    linhas.push({ estado: 'ERRO', ficheiro: rel, esperado: `${f.w}×${f.h}`, obtido: m.erro, nota: '' });
    continue;
  }
  const medidasOk = m.w === f.w && m.h === f.h;
  const formatoOk = m.rgba || m.paleta;                     // precisa de transparência
  const atlasOk = m.w <= atlasMax && m.h <= atlasMax;
  const ok = medidasOk && formatoOk && atlasOk;
  if (ok) prontas += 1; else erros += 1;
  const notas = [];
  if (!medidasOk) notas.push(`esperado ${f.w}×${f.h}`);
  if (!formatoOk) notas.push('sem canal alfa (RGBA ou PNG-8 com transparência)');
  if (!atlasOk) notas.push(`passa ${atlasMax}²`);
  if (m.interlace) notas.push('entrelaçado (não usar)');
  linhas.push({
    estado: ok ? 'OK' : 'ERRO',
    ficheiro: rel,
    esperado: `${f.w}×${f.h}`,
    obtido: `${m.w}×${m.h}`,
    nota: notas.length ? notas.join(' · ') : p.onde,
  });
}

// --- ficheiros de arte que ninguém reivindica ---
const esperados = new Set(pecas.map((p) => caminhoRelativo(join(pasta(p), p.ficheiro))));
const orfaos = [...porNome.keys()].filter((c) => !esperados.has(c));

const largura = Math.max(...linhas.map((l) => l.ficheiro.length), 10);
console.log('\nARTE — MEDIDAS (src/game/data/arte.json)\n');
for (const l of linhas) {
  console.log(
    `${l.estado.padEnd(5)} ${l.ficheiro.padEnd(largura)}  ${l.esperado.padStart(9)}  `
    + `${l.obtido.padStart(9)}  ${l.nota}`,
  );
}
console.log('');
console.log(`  ${prontas} pronta(s) · ${faltas} a entregar · ${erros} com problema`);
if (orfaos.length) {
  console.log(`\n  ${orfaos.length} PNG sem peça no manifesto (nome errado ou sobra):`);
  for (const o of orfaos) console.log(`    ${o}`);
}
if (faltas === 0 && erros === 0) console.log('\n  A arte encaixa toda.\n');
else console.log(`\n  Detalhe do formato em docs/14-arte-tilesets-e-spritesheets.md\n`);

process.exit(erros > 0 || (EXIGIR && faltas > 0) ? 1 : 0);
