#!/usr/bin/env node
/**
 * `npm run modelos` — gera os **modelos base** das spritesheets e dos tilesets.
 *
 * Não é arte final: é o *esqueleto* de cada folha, nas medidas exatas de
 * `src/game/data/arte.json` — célula certa, número de frames certo, pés no fundo, corpo centrado.
 * Serve para três coisas:
 *
 * 1. **Desenhar por cima.** `public/assets/modelos/modelo_*.png` traz a grelha, a linha dos pés, o
 *    eixo central e o número de cada frame — é a folha de trabalho do artista.
 * 2. **Encaixar hoje.** `public/assets/images|tilemaps/*.png` são as mesmas figuras **sem guias**,
 *    com o tamanho que o validador exige (`npm run arte` diz `OK`).
 * 3. **Ver o movimento.** As poses já mudam por ação (passada, salto, golpe, morte), portanto dá
 *    para ver se o número de frames de cada ação chega antes de desenhar o primeiro traço.
 *
 * Sem dependências: escreve o PNG à mão (RGBA, `zlib` do próprio Node). Um `pip install pillow`
 * a mais para desenhar retângulos seria uma dependência a mais para manter.
 *
 * Uso:
 *   node ferramentas/gerar-modelos.mjs              # todas as peças
 *   node ferramentas/gerar-modelos.mjs player tm_ruinas
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const RAIZ = process.cwd();
const MANIFESTO = JSON.parse(readFileSync(join(RAIZ, 'src/game/data/arte.json'), 'utf8'));
const CAT = MANIFESTO.customizacao;          // ids e cores = os de src/services/character.ts

// ---------------------------------------------------------------- paleta (PAL-00, docs/05 §5.2)
const COR = {
  ink: '#0B0910', bg: '#15131F', mass: '#2A2433', stone: '#464052', bone: '#E6DFD2',
  threat: '#D95555', gold: '#F2C66D', pele: '#D9A97E', peleSombra: '#B8865C',
  metal: '#8A8694', osso: '#C9C3B4', pele2: '#B8865C',
};
const rgba = (hex, a = 255) => [
  Number.parseInt(hex.slice(1, 3), 16), Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16), a,
];

// ---------------------------------------------------------------- tela + PNG à mão
class Tela {
  constructor(w, h, fundo = null) {
    this.w = w; this.h = h;
    this.d = new Uint8Array(w * h * 4);
    if (fundo) this.retangulo(0, 0, w, h, fundo);
  }

  px(x, y, cor) {
    const xi = Math.round(x); const yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= this.w || yi >= this.h) return;
    const i = (yi * this.w + xi) * 4;
    const [r, g, b, a] = cor;
    if (a === 255) { this.d[i] = r; this.d[i + 1] = g; this.d[i + 2] = b; this.d[i + 3] = 255; return; }
    // alfa sobre o que já lá está (o modelo é opaco ou transparente: nada de blending exótico)
    const t = a / 255; const u = 1 - t;
    this.d[i] = Math.round(r * t + this.d[i] * u);
    this.d[i + 1] = Math.round(g * t + this.d[i + 1] * u);
    this.d[i + 2] = Math.round(b * t + this.d[i + 2] * u);
    this.d[i + 3] = Math.max(this.d[i + 3], a);
  }

  retangulo(x, y, w, h, cor) {
    for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) this.px(x + i, y + j, cor);
  }

  /** Trapézio vertical: largura interpolada de `w0` (topo) a `w1` (base). É o tronco. */
  trapezio(cx, y, h, w0, w1, cor) {
    for (let j = 0; j < h; j += 1) {
      const w = w0 + ((w1 - w0) * j) / Math.max(1, h - 1);
      this.retangulo(Math.round(cx - w / 2), y + j, Math.max(1, Math.round(w)), 1, cor);
    }
  }

  /** Membro como linha grossa: passo a passo, para poder ter ângulo. */
  membro(x0, y0, ang, comp, esp, cor) {
    const dx = Math.cos(ang); const dy = Math.sin(ang);
    for (let s = 0; s <= comp; s += 1) {
      this.retangulo(
        Math.round(x0 + dx * s - esp / 2),
        Math.round(y0 + dy * s - esp / 2),
        Math.max(1, Math.round(esp)), Math.max(1, Math.round(esp)), cor,
      );
    }
  }

  circulo(cx, cy, r, cor) {
    for (let j = -r; j <= r; j += 1) {
      const w = Math.floor(Math.sqrt(Math.max(0, r * r - j * j)));
      this.retangulo(Math.round(cx - w), Math.round(cy + j), Math.max(1, w * 2), 1, cor);
    }
  }

  /** Linha tracejada — só para as guias (nunca na arte). */
  tracejado(x0, y0, x1, y1, cor, passo = 4, vao = 3) {
    const n = Math.hypot(x1 - x0, y1 - y0);
    for (let s = 0; s < n; s += passo + vao) {
      for (let k = 0; k < passo && s + k < n; k += 1) {
        this.px(x0 + ((x1 - x0) * (s + k)) / n, y0 + ((y1 - y0) * (s + k)) / n, cor);
      }
    }
  }

  /** Moldura de 1 px. */
  moldura(x, y, w, h, cor) {
    this.retangulo(x, y, w, 1, cor); this.retangulo(x, y + h - 1, w, 1, cor);
    this.retangulo(x, y, 1, h, cor); this.retangulo(x + w - 1, y, 1, h, cor);
  }

  /**
   * Copia uma célula já desenhada para a posição `(dx, dy)`. É o que permite desenhar cada pose
   * numa tela pequena (fácil de raciocinar) e depois montar a folha.
   */
  colar(outra, dx, dy) {
    for (let y = 0; y < outra.h; y += 1) {
      for (let x = 0; x < outra.w; x += 1) {
        const i = (y * outra.w + x) * 4;
        if (outra.d[i + 3] === 0) continue;
        this.px(dx + x, dy + y, [outra.d[i], outra.d[i + 1], outra.d[i + 2], outra.d[i + 3]]);
      }
    }
  }
}

const TABELA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bloco(tipo, dados) {
  const len = Buffer.alloc(4); len.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'latin1'), dados]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([len, corpo, crc]);
}

/** PNG RGBA (8 bits, tipo 6, sem entrelaçamento). */
function png(tela) {
  const { w, h, d } = tela;
  const cru = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y += 1) {
    cru[y * (w * 4 + 1)] = 0;                                  // filtro: nenhum
    Buffer.from(d.buffer, y * w * 4, w * 4).copy(cru, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr),
    bloco('IDAT', deflateSync(cru, { level: 9 })),
    bloco('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- fonte minúscula (só dígitos)
const DIGITOS = {
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'],
  4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '001', '001', '001'],
  8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'],
};

function numero(tela, valor, x, y, cor = rgba(COR.gold)) {
  String(valor).split('').forEach((c, i) => {
    const g = DIGITOS[c];
    if (!g) return;
    g.forEach((linha, j) => linha.split('').forEach((b, k) => {
      if (b === '1') tela.retangulo(x + i * 4 + k, y + j, 1, 1, cor);
    }));
  });
}

// ---------------------------------------------------------------- a figura humana base
/**
 * As cinco silhuetas do `UI-12`, convertidas em pixéis a partir de uma altura de referência.
 * `CORPOS` dá quatro razões; os denominadores são o corpo atlético. Assim o atlético reproduz a
 * figura base e os outros quatro afastam-se dele sem nenhuma largura escondida por variante.
 *
 * A mesma conta alimenta o corpo inteiro e as folhas de partes: tronco, braços, mãos, pernas e pés
 * da célula 3 são sempre do corpo 3 (`maromba`). Ampliar uma peça para a ler não muda esta razão.
 */
function medidasForma(c, H) {
  const largura = c.ombro / 0.94;
  const ombro = Math.round(H * 0.33 * largura);
  const tronco = Math.round(H * 0.29 * (c.tronco / 0.9));
  const cintura = Math.round(H * 0.23 * ((c.tronco * c.cintura) / (0.9 * 0.74)));
  const pernaEsp = Math.max(4, Math.round(H * 0.085 * largura));
  const bracoEsp = Math.max(4, Math.round(H * 0.075 * largura));
  return {
    H, largura, ombro, tronco, cintura, pernaEsp, bracoEsp,
    cabecaH: Math.round(H * 0.23), troncoH: Math.round(H * 0.34),
    pernaH: H - Math.round(H * 0.23) - Math.round(H * 0.34),
    afast: Math.max(pernaEsp + 2, Math.round(cintura * 0.55)),
  };
}

/**
 * Uma figura de bloco, com as proporções certas para o jogo: `altura` = altura do desenho,
 * pés em `y = base`, centro em `cx`. Tudo o que é pose vem de `p` (parâmetros), para cada ação
 * poder ser uma linha em vez de um desenho novo. `forma` só é passado pelas folhas do `UI-12`.
 */
function figura(tela, {
  cx, base, altura, largura = 1, p = {}, cores = {}, forma = null,
}) {
  const c = {
    contorno: rgba(COR.ink), roupa: rgba(COR.mass), roupa2: rgba(COR.stone),
    pele: rgba(COR.pele), pele2: rgba(COR.peleSombra), cabelo: rgba(COR.ink),
    detalhe: rgba(COR.gold), botas: rgba(COR.ink), ...cores,
  };
  const lean = p.lean ?? 0;                    // inclinação do tronco (px no topo)
  const bob = p.bob ?? 0;                      // subir/descer o corpo inteiro
  const bobagem = p.encolher ?? 0;             // quanto a figura encurta (agachar/morte)
  const H = altura - bobagem;
  const topo = base - H + bob;                 // topo da cabeça
  const cabecaH = Math.round(H * 0.23);
  const troncoH = Math.round(H * 0.34);
  const pernaH = H - cabecaH - troncoH;
  // proporções de bloco: ombro largo, cintura estreita. Um herói de 36 px de hurtbox não pode ter
  // ombros de 15 — o desenho ficava mais estreito do que aquilo que dói. Na personalização entram
  // também `tronco` e `cintura`: antes só o ombro mudava e os cinco corpos pareciam o mesmo.
  const formaMedida = forma ? medidasForma(forma, H) : null;
  const ombro = formaMedida?.ombro ?? Math.round(H * 0.33 * largura);
  const troncoW = formaMedida?.tronco ?? Math.round((ombro + Math.round(H * 0.23 * largura)) / 2);
  const cintura = formaMedida?.cintura ?? Math.round(H * 0.23 * largura);
  const pescoco = 3;
  const yCabeca = topo;
  const yTronco = topo + cabecaH + pescoco;
  const yQuadril = yTronco + troncoH;
  const cxTopo = cx + lean;

  // --- silhueta de contorno primeiro: sem ela o modelo desaparece no fundo escuro
  const silhueta = (extra = 1) => {
    tela.retangulo(cxTopo - ombro / 2 - extra, yTronco - extra,
      ombro + extra * 2, troncoH + extra, rgba(COR.ink));
    tela.retangulo(cx - cintura / 2 - extra, yQuadril - extra,
      cintura + extra * 2, pernaH * 0.45 + extra, rgba(COR.ink));
    tela.retangulo(cxTopo - cabecaH / 2 - extra, yCabeca - extra,
      cabecaH + extra * 2, cabecaH + extra * 2, rgba(COR.ink));
  };
  silhueta();

  // --- pernas
  /*
   * Duas pernas **separadas**: encostadas uma à outra (e ambas com contorno escuro) liam-se como
   * um bloco só — o modelo deixava de mostrar onde está a passada. A folga entre elas é o que faz
   * a diferença entre "pernas" e "saia".
   */
  const pernaEsp = formaMedida?.pernaEsp ?? Math.max(4, Math.round(H * 0.085 * largura));
  const afast = formaMedida?.afast ?? Math.max(pernaEsp + 2, Math.round(cintura * 0.55));
  const pAng = p.pernas ?? [Math.PI / 2, Math.PI / 2];
  const pComp = p.pernasComp ?? [pernaH * 0.92, pernaH * 0.92];
  const pOff = p.pernasOff ?? [0, 0];
  [0, 1].forEach((lado) => {
    const x = cx + (lado ? 1 : -1) * afast;
    tela.membro(x, yQuadril, pAng[lado], pComp[lado], pernaEsp + 2, rgba(COR.ink));
    tela.membro(x, yQuadril, pAng[lado], pComp[lado], pernaEsp, c.botas);
    // cano do casaco cobre o topo da perna (senão a perna "nasce" do nada)
    tela.retangulo(Math.round(x - pernaEsp / 2) - 1, yQuadril - 2, pernaEsp + 2, 5, c.contorno);
  });
  // pés: a base do modelo — têm de tocar o fundo da célula
  if (!p.semPes) {
    [0, 1].forEach((lado) => {
      const x = cx + (lado ? 1 : -1) * afast + (pOff[lado] ?? 0)
        + Math.cos(pAng[lado]) * pComp[lado];
      const y = yQuadril + Math.sin(pAng[lado]) * pComp[lado];
      tela.retangulo(Math.round(x - pernaEsp / 2) - 2, Math.round(y - 1), pernaEsp + 4, 3, rgba(COR.ink));
      tela.retangulo(Math.round(x - pernaEsp / 2) - 2, Math.round(y - 1), pernaEsp + 4, 1, rgba(COR.stone));
    });
  }

  // --- tronco (casaco): ombro → peito → cintura. As duas metades evitam transformar o `gordo`
  // num triângulo e deixam o `maromba` com peito cheio e cintura mais estreita, como no catálogo.
  const meioTronco = Math.round(troncoH * 0.55);
  tela.trapezio(cxTopo, yTronco, meioTronco, ombro, troncoW, c.contorno);
  tela.trapezio(cxTopo, yTronco + meioTronco, troncoH - meioTronco, troncoW, cintura, c.contorno);
  tela.trapezio(cxTopo, yTronco + 1, Math.max(1, meioTronco - 1), ombro - 2, troncoW - 2, c.roupa);
  tela.trapezio(cxTopo, yTronco + meioTronco, troncoH - meioTronco - 1,
    troncoW - 2, cintura - 2, c.roupa);
  // faixa dourada (a mesma linguagem do sprite em jogo)
  tela.retangulo(Math.round(cxTopo - cintura * 0.62), Math.round(yQuadril - troncoH * 0.28),
    Math.round(cintura * 1.24), Math.max(2, Math.round(H * 0.03)), c.detalhe);
  // abertura do casaco
  tela.retangulo(Math.round(cxTopo - 1), Math.round(yTronco + troncoH * 0.25), 2,
    Math.round(troncoH * 0.7), rgba(COR.ink));

  // --- braços
  const bracoEsp = formaMedida?.bracoEsp ?? Math.max(4, Math.round(H * 0.075 * largura));
  const bAng = p.bracos ?? [Math.PI / 2 + 0.25, Math.PI / 2 - 0.25];
  const bComp = p.bracosComp ?? [troncoH * 0.95, troncoH * 0.95];
  [0, 1].forEach((lado) => {
    tela.membro(cxTopo + (lado ? 1 : -1) * (ombro / 2 - 2), yTronco + 3,
      bAng[lado], bComp[lado], bracoEsp + 2, rgba(COR.ink));
  });
  [0, 1].forEach((lado) => {
    tela.membro(cxTopo + (lado ? 1 : -1) * (ombro / 2 - 2), yTronco + 3,
      bAng[lado], bComp[lado], bracoEsp, c.roupa2);
  });
  // mãos (a pele aparece: é o sinal de que há um corpo dentro do casaco)
  [0, 1].forEach((lado) => {
    const x = cxTopo + (lado ? 1 : -1) * (ombro / 2 - 2) + Math.cos(bAng[lado]) * bComp[lado];
    const y = yTronco + 3 + Math.sin(bAng[lado]) * bComp[lado];
    tela.circulo(x, y, Math.max(2, Math.round(bracoEsp * 0.55)), c.pele2);
    tela.circulo(x, y, Math.max(1, Math.round(bracoEsp * 0.42)), c.pele);
  });

  // --- pescoço (sem ele, a cabeça parece colada aos ombros)
  tela.retangulo(Math.round(cxTopo - cabecaH * 0.18), yTronco - pescoco,
    Math.max(3, Math.round(cabecaH * 0.36)), pescoco + 2, c.pele2);

  // --- cabeça
  const rx = cabecaH / 2;
  tela.circulo(cxTopo, yCabeca + rx, rx, c.contorno);
  tela.circulo(cxTopo, yCabeca + rx, rx - 1, c.pele);
  // cabelo (bloco em cima, mechas aos lados conforme `p.cabelo`)
  const cabeloH = Math.round(cabecaH * 0.34);
  tela.retangulo(cxTopo - rx + 1, yCabeca + 1, Math.round(rx * 2 - 2), cabeloH, c.cabelo);
  if (p.cabelo === 'longo') {
    tela.retangulo(cxTopo - rx + 1, yCabeca + cabeloH, 3, Math.round(cabecaH * 0.8), c.cabelo);
    tela.retangulo(cxTopo + rx - 4, yCabeca + cabeloH, 3, Math.round(cabecaH * 0.8), c.cabelo);
  }
  if (p.cabelo === 'moicano') {
    tela.retangulo(cxTopo - 2, yCabeca - Math.round(cabecaH * 0.25), 4,
      Math.round(cabecaH * 0.35), c.cabelo);
  }
  // olhos
  const olhoY = Math.round(yCabeca + cabecaH * 0.56);
  const olhoDx = Math.max(2, Math.round(rx * 0.42));
  const olhoCor = p.olhos ?? rgba(COR.ink);
  tela.retangulo(Math.round(cxTopo - olhoDx - 1), olhoY, 2, Math.max(1, Math.round(cabecaH * 0.09)), olhoCor);
  tela.retangulo(Math.round(cxTopo + olhoDx - 1), olhoY, 2, Math.max(1, Math.round(cabecaH * 0.09)), olhoCor);
  // boca
  if (!p.semBoca) {
    tela.retangulo(Math.round(cxTopo - 2), Math.round(yCabeca + cabecaH * 0.76),
      Math.max(3, Math.round(cabecaH * 0.22)), 1, rgba(COR.ink));
  }
  // presas (`ALUCARD`): brancas por cima da boca escura — o mesmo cuidado do desenho em jogo
  if (p.presas) {
    tela.retangulo(Math.round(cxTopo - 3), Math.round(yCabeca + cabecaH * 0.75),
      Math.max(6, Math.round(cabecaH * 0.3)), 2, rgba(COR.ink));
    tela.retangulo(Math.round(cxTopo - 3), Math.round(yCabeca + cabecaH * 0.75), 1, 3, rgba(COR.bone));
    tela.retangulo(Math.round(cxTopo + 2), Math.round(yCabeca + cabecaH * 0.75), 1, 3, rgba(COR.bone));
  }
  return { topo, yCabeca, yTronco, yQuadril, cabecaH, rx };
}

/** Arco de golpe: a área útil só serve para isto — o golpe tem de caber na célula. */
function golpe(tela, cx, y, r, fase, cor = rgba(COR.gold, 190)) {
  const a0 = -1.15 + fase * 1.9;
  for (let a = a0 - 0.5; a < a0 + 0.35; a += 0.06) {
    for (let d = r * 0.55; d < r; d += 1) tela.px(cx + Math.cos(a) * d, y + Math.sin(a) * d, cor);
  }
}

// ---------------------------------------------------------------- poses por ação
const POSES = {
  parado: (i, n) => ({ bob: i % 2 === 0 ? 0 : -1, bracos: [Math.PI / 2 + 0.22, Math.PI / 2 - 0.22] }),
  corrida: (i, n) => {
    const t = (i / n) * Math.PI * 2;
    const s = Math.sin(t);
    return {
      lean: 2,
      bob: Math.abs(Math.cos(t)) > 0.5 ? -1 : 0,
      pernas: [Math.PI / 2 + s * 0.6, Math.PI / 2 - s * 0.6],
      pernasComp: [Math.abs(Math.sin(Math.PI / 2 + s * 0.6)) * 0 + 0.92, 0.92],
      pernasOff: [s * 4, -s * 4],
      bracos: [Math.PI / 2 - s * 0.7, Math.PI / 2 + s * 0.7],
    };
  },
  salto: () => ({
    pernas: [Math.PI / 2 + 0.85, Math.PI / 2 - 0.25], pernasComp: [0.6, 0.55],
    bracos: [-0.9, -0.5], encolher: 4,
  }),
  queda: () => ({
    pernas: [Math.PI / 2 - 0.35, Math.PI / 2 + 0.35],
    bracos: [-2.2, -0.9], encolher: 2,
  }),
  ataque: (i, n) => ({ lean: 3, bracos: [-0.15, 1.4], bracosComp: [1.25, 0.9], fase: i / n }),
  disparo: (i) => ({ bracos: [-0.05, 1.5], bracosComp: [1.2, 0.9], fase: i }),
  dano: (i) => ({ lean: -3 - i, bob: i, bracos: [-2.0, 0.4] }),
  morte: (i, n) => ({ encolher: Math.round((i / n) * 26), semPes: i > n - 3, bob: i * 2 }),
};

/** Desenha a folha de um personagem: uma célula por frame, na ordem de `arte.json`. */
function folhaPersonagem(peca, desenhar) {
  const { frame, colunas } = peca;
  const total = peca.acoes.reduce((s, a) => s + a.frames, 0);
  const linhas = Math.ceil(total / colunas);
  const folhaTela = new Tela(colunas * frame.w, linhas * frame.h);
  let n = 0;
  for (const acao of peca.acoes) {
    for (let i = 0; i < acao.frames; i += 1) {
      const celula = new Tela(frame.w, frame.h, null);
      const pose = POSES[acao.nome] ? POSES[acao.nome](i, acao.frames) : {};
      desenhar(celula, pose, { acao: acao.nome, i, n: acao.frames, indice: n, peca });
      folhaTela.colar(celula, (n % colunas) * frame.w, Math.floor(n / colunas) * frame.h);
      n += 1;
    }
  }
  return folhaTela;
}

/** Herói — o mesmo desenho do `personagem.ts` (casaco, faixa, pele), agora em 96×128. */
function desenharHeroi(tela, pose, ctx) {
  const base = tela.h;                                   // pés no fundo da célula
  const altura = Math.min(ctx.peca.util.h, tela.h - 2);   // 112 numa célula de 128
  const info = figura(tela, { cx: tela.w / 2, base: base - 1, altura, largura: 1.05, p: pose });
  if (ctx.acao === 'ataque') {
    // o golpe vive na folga lateral da célula: é por isto que a célula é 96 e não 40
    golpe(tela, tela.w / 2 + 14, info.yTronco + 14, 34, pose.fase ?? 0.5);
  }
  if (ctx.acao === 'disparo' && ctx.i > 0) {
    tela.retangulo(tela.w / 2 + 26, info.yTronco + 12, 8, 3, rgba(COR.gold, 230));
    tela.circulo(tela.w / 2 + 36, info.yTronco + 13, 3, rgba(COR.gold, 150));
  }
}

const CARTOLA = {
  boss: { detalhe: COR.threat, ombreiras: true, chifres: true },
  alferes: { detalhe: COR.gold, coroa: true },
  forjador: { detalhe: '#8A5033', avental: true, martelo: true },
  comandante: { detalhe: COR.threat, capa: true },
  guardiao: { detalhe: COR.gold, lanterna: true },
  plantonista: { detalhe: COR.osso, tunica: true, alto: true },
};

/** Chefes: mesma figura, outra massa e um adereço que diz quem é (é modelo base, não arte). */
function desenharChefe(peca) {
  const cart = CARTOLA[peca.chave] ?? {};
  return (tela, pose) => {
    const altura = Math.min(peca.util.h, tela.h - 4);
    const largura = peca.chave === 'guardiao' ? 1.0 : peca.chave === 'plantonista' ? 0.75 : 1.25;
    const info = figura(tela, {
      cx: tela.w / 2, base: tela.h - 2, altura, largura, p: { ...pose, olhos: rgba(COR.threat) },
      cores: { detalhe: rgba(cart.detalhe), roupa: rgba(COR.mass), roupa2: rgba(COR.stone) },
    });
    const cx = tela.w / 2;
    if (cart.ombreiras) {
      tela.retangulo(Math.round(cx - info.cabecaH * 0.95), info.yTronco - 3,
        Math.round(info.cabecaH * 0.55), 6, rgba(COR.stone));
      tela.retangulo(Math.round(cx + info.cabecaH * 0.4), info.yTronco - 3,
        Math.round(info.cabecaH * 0.55), 6, rgba(COR.stone));
    }
    if (cart.chifres) {
      tela.membro(cx - 6, info.yCabeca + 4, -1.1, 12, 3, rgba(COR.osso));
      tela.membro(cx + 6, info.yCabeca + 4, -2.0, 12, 3, rgba(COR.osso));
    }
    if (cart.coroa) {
      for (let k = -1; k <= 1; k += 1) {
        tela.retangulo(Math.round(cx + k * 6) - 1, info.yCabeca - 4, 2, 5, rgba(COR.gold));
      }
      tela.retangulo(Math.round(cx - 8), info.yCabeca - 1, 16, 2, rgba(COR.gold));
    }
    if (cart.avental) {
      tela.retangulo(Math.round(cx - info.cabecaH * 0.5), info.yTronco + 12,
        Math.round(info.cabecaH), Math.round(altura * 0.34), rgba('#8A5033'));
    }
    if (cart.capa) {
      tela.trapezio(cx, info.yTronco + 2, Math.round(altura * 0.62),
        info.cabecaH * 1.5, info.cabecaH * 2.4, rgba(COR.threat, 90));
    }
    if (cart.lanterna) {
      tela.membro(cx + Math.round(info.cabecaH * 1.1), info.yTronco + 16, 1.4, 18, 3, rgba(COR.ink));
      tela.circulo(cx + Math.round(info.cabecaH * 1.1) + 3, info.yTronco + 34, 4, rgba(COR.gold));
      tela.circulo(cx + Math.round(info.cabecaH * 1.1) + 3, info.yTronco + 34, 2, rgba(COR.bone));
    }
    if (cart.martelo) {
      tela.membro(cx + 18, info.yTronco + 10, 1.2, 26, 3, rgba('#8A7A5C'));
      tela.retangulo(cx + 20, info.yTronco + 34, 14, 8, rgba(COR.metal));
    }
  };
}

/** Sentinela: pequena e curvada — cabe em 48×80 de uma célula de 96×128. */
function desenharSentinela(tela, pose, ctx) {
  const altura = ctx.peca.util.h;                        // 80
  figura(tela, {
    cx: tela.w / 2, base: tela.h - 1, altura, largura: 0.85,
    p: { ...pose, lean: 3, olhos: rgba(COR.threat) },
    cores: { roupa: rgba('#3A3346'), roupa2: rgba(COR.stone), cabelo: rgba(COR.mass) },
  });
}

/** Itens: 11 ícones de 32×34, um por célula — 1:1 no jogo, sem escala. */
function desenharItens(tela, pose, ctx) {
  const s = ctx.indice;
  const cx = 16; const cy = 17;
  const ouro = rgba(COR.gold); const osso = rgba(COR.bone); const ameaca = rgba(COR.threat);
  const escuro = rgba(COR.ink); const metal = rgba(COR.metal);
  const caixa = (x, y, w, h, c) => tela.retangulo(x, y, w, h, c);
  switch (s) {
    case 0: // ITM-001 cura: cruz
      caixa(cx - 3, cy - 9, 6, 18, osso); caixa(cx - 9, cy - 3, 18, 6, osso);
      caixa(cx - 1, cy - 7, 2, 14, ameaca); caixa(cx - 7, cy - 1, 14, 2, ameaca); break;
    case 1: // ITM-002 escudo
      tela.retangulo(cx - 9, cy - 9, 18, 12, metal);
      for (let k = 0; k < 6; k += 1) caixa(cx - 9 + k, cy + 3 + k, 18 - k * 2, 1, metal);
      caixa(cx - 2, cy - 6, 4, 8, ouro); break;
    case 2: // ITM-003 salto: botas
      caixa(cx - 9, cy, 7, 10, '#8A7A5C'); caixa(cx - 11, cy + 8, 11, 4, escuro);
      caixa(cx + 2, cy - 4, 7, 10, '#8A7A5C'); caixa(cx, cy + 4, 11, 4, escuro); break;
    case 3: // ITM-004 troféu
      caixa(cx - 7, cy - 9, 14, 9, ouro); caixa(cx - 3, cy, 6, 6, ouro);
      caixa(cx - 7, cy + 6, 14, 3, ouro); caixa(cx - 9, cy - 7, 2, 5, ouro);
      caixa(cx + 7, cy - 7, 2, 5, ouro); break;
    case 4: // ITM-005 força: punho
      caixa(cx - 7, cy - 6, 14, 12, rgba(COR.pele));
      for (let k = 0; k < 4; k += 1) caixa(cx - 7 + k * 4, cy - 8, 3, 3, rgba(COR.pele2));
      caixa(cx - 7, cy + 2, 14, 2, rgba(COR.ink)); break;
    case 5: // ITM-006 fôlego: bolha
      tela.circulo(cx, cy, 8, metal); tela.circulo(cx, cy, 6, rgba('#3C5C8E'));
      tela.circulo(cx - 3, cy - 3, 2, osso); break;
    case 6: // ITM-007 relíquia: gema
      tela.retangulo(cx - 6, cy - 6, 12, 8, ouro);
      for (let k = 0; k < 6; k += 1) caixa(cx - 6 + k, cy + 4 + k, 12 - k * 2, 1, ouro);
      caixa(cx - 2, cy - 4, 3, 3, osso); break;
    case 7: // ITM-008 gancho
      tela.membro(cx - 6, cy - 8, 1.2, 12, 2, metal);
      for (let a = 0.4; a < 2.6; a += 0.12) tela.px(cx + Math.cos(a) * 6, cy + 4 + Math.sin(a) * 6, metal);
      break;
    case 8: // ITM-009 garra
      for (let k = -1; k <= 1; k += 1) tela.membro(cx + k * 5, cy - 8, 1.6 + k * 0.25, 12, 2, osso);
      caixa(cx - 8, cy - 10, 16, 3, rgba(COR.ink)); break;
    case 9: // ITM-010 estandarte
      caixa(cx - 8, cy - 10, 16, 4, '#8A7A5C'); caixa(cx - 6, cy - 6, 12, 12, rgba('#9C3B54'));
      caixa(cx - 2, cy - 3, 4, 4, osso); break;
    default: // ITM-011 peça da forja
      caixa(cx - 7, cy - 7, 14, 14, metal); caixa(cx - 3, cy - 3, 6, 6, rgba(COR.threat));
      caixa(cx - 1, cy - 1, 2, 2, osso); break;
  }
}

/** Projétil: 4 frames de uma lasca a girar. */
function desenharSpark(tela, pose, ctx) {
  const cx = tela.w / 2; const cy = tela.h / 2;
  const a = (ctx.indice / 4) * Math.PI;
  const ouro = rgba(COR.gold); const osso = rgba(COR.bone);
  for (let s = -6; s <= 6; s += 1) {
    tela.px(cx + Math.cos(a) * s, cy + Math.sin(a) * s, ouro);
    tela.px(cx + Math.cos(a + 1.2) * s * 0.6, cy + Math.sin(a + 1.2) * s * 0.6, ouro);
  }
  tela.circulo(cx, cy, 2, osso);
}

/**
 * Tiles de ruínas: 24 células de 64×64. Sem guias no ficheiro final; costura garantida porque
 * cada tile pinta as próprias bordas (a laje continua na vizinha).
 */
function folhaTiles(peca, pintar) {
  const { frame, colunas } = peca;
  const total = peca.acoes.reduce((s, a) => s + a.frames, 0);
  const linhas = Math.ceil(total / colunas);
  const tela = new Tela(colunas * frame.w, linhas * frame.h);
  for (let n = 0; n < total; n += 1) {
    const celula = new Tela(frame.w, frame.h);
    pintar(celula, n);
    tela.colar(celula, (n % colunas) * frame.w, Math.floor(n / colunas) * frame.h);
  }
  return tela;
}

function pintarRuina(tela, n) {
  const pedra = rgba(COR.stone); const pedraEsc = rgba('#332F3D'); const pedraClara = rgba('#5A5466');
  const musgo = rgba('#3F5A44'); const ink = rgba(COR.ink);
  const bloco = () => {
    tela.retangulo(0, 0, 64, 64, pedraEsc);
    // quatro fiadas de tijolo, alternadas — a costura é o próprio desenho
    for (let fy = 0; fy < 4; fy += 1) {
      const y = fy * 16;
      tela.retangulo(0, y, 64, 14, pedra);
      const off = fy % 2 ? 16 : 0;
      for (let x = off; x < 64 + 16; x += 32) {
        tela.retangulo(x - 1, y, 2, 14, pedraEsc);
      }
      tela.retangulo(0, y, 64, 1, pedraClara);
    }
  };
  switch (n) {
    case 1: case 9: case 17:                       // parede
      bloco(); break;
    case 0: case 8: case 16:                       // chão (topo com brilho)
      bloco();
      tela.retangulo(0, 0, 64, 4, pedraClara);
      tela.retangulo(0, 4, 64, 2, ink);
      break;
    case 2:                                        // canto sup. esq.
      bloco(); tela.retangulo(0, 0, 64, 3, pedraClara); break;
    case 3:                                        // canto sup. dir.
      bloco(); tela.retangulo(0, 0, 64, 3, pedraClara); break;
    case 4:                                        // plataforma (fina)
      tela.retangulo(0, 0, 64, 10, pedraClara); tela.retangulo(0, 10, 64, 4, ink);
      tela.retangulo(8, 14, 6, 6, pedraEsc); tela.retangulo(48, 14, 6, 6, pedraEsc); break;
    case 5:                                        // plataforma, meio
      tela.retangulo(0, 0, 64, 10, pedra); tela.retangulo(0, 10, 64, 4, ink); break;
    case 6:                                        // topo de parede com musgo
      bloco(); tela.retangulo(0, 0, 64, 5, pedraClara);
      for (let k = 0; k < 64; k += 7) tela.retangulo(k, 4, 4, 2, musgo); break;
    case 7:                                        // bloco quebrável (com racha)
      bloco(); tela.membro(14, 6, 1.1, 40, 2, ink); tela.membro(40, 10, 2.2, 26, 2, ink); break;
    case 10: case 18:                              // interior de parede (mais escuro)
      bloco(); tela.retangulo(0, 0, 64, 64, rgba(COR.ink, 40)); break;
    case 11:                                       // borda esquerda
      bloco(); tela.retangulo(0, 0, 3, 64, ink); tela.retangulo(3, 0, 2, 64, pedraClara); break;
    case 12:                                       // borda direita
      bloco(); tela.retangulo(61, 0, 3, 64, ink); tela.retangulo(59, 0, 2, 64, pedraClara); break;
    case 13:                                       // teto
      bloco(); tela.retangulo(0, 60, 64, 4, ink); break;
    case 14:                                       // chão com erva
      bloco(); tela.retangulo(0, 0, 64, 4, pedraClara);
      for (let k = 2; k < 62; k += 9) tela.retangulo(k, 3, 2, 4, musgo); break;
    case 15:                                       // chão com rachadela
      bloco(); tela.retangulo(0, 0, 64, 4, pedraClara); tela.membro(20, 8, 1.4, 20, 2, ink); break;
    case 19:                                       // coluna (vertical contínua)
      tela.retangulo(0, 0, 64, 64, pedraEsc);
      tela.retangulo(16, 0, 32, 64, pedra); tela.retangulo(16, 0, 3, 64, pedraClara);
      tela.retangulo(45, 0, 3, 64, pedraEsc); break;
    case 20: case 21: case 22:                     // reserva (transparente)
      break;
    default:                                       // reserva: bloco simples
      bloco();
  }
}

function pintarArmadilha(tela, n) {
  const metal = rgba(COR.metal); const ink = rgba(COR.ink); const osso = rgba(COR.bone);
  const pedra = rgba(COR.stone); const ameaca = rgba(COR.threat);
  switch (n) {
    case 0: case 1:                                // espinho estático (base + 3 pontas)
      tela.retangulo(0, 54, 64, 10, pedra);
      for (let k = 0; k < 3; k += 1) {
        const cx = 12 + k * 20;
        for (let h = 0; h < 34; h += 1) {
          tela.retangulo(cx - Math.round(h * 0.22), 54 - h, Math.max(1, Math.round(h * 0.44)), 1, metal);
        }
      }
      tela.retangulo(0, 54, 64, 2, osso); break;
    case 2: case 3:                                // espinho cíclico: 2 fases (recolhido/fora)
      tela.retangulo(0, 54, 64, 10, pedra);
      if (n === 3) {
        for (let k = 0; k < 3; k += 1) {
          const cx = 12 + k * 20;
          for (let h = 0; h < 34; h += 1) {
            tela.retangulo(cx - Math.round(h * 0.22), 54 - h, Math.max(1, Math.round(h * 0.44)), 1, metal);
          }
        }
      } else {
        tela.retangulo(4, 52, 56, 4, rgba(COR.ink));
        for (let k = 0; k < 3; k += 1) tela.retangulo(10 + k * 20, 52, 4, 2, ameaca);
      }
      break;
    case 4:                                        // porta (folha)
      tela.retangulo(0, 0, 64, 64, rgba('#3A2C1E'));
      tela.retangulo(4, 4, 56, 60, rgba('#5A422C'));
      for (let y = 10; y < 60; y += 12) tela.retangulo(8, y, 48, 2, rgba(COR.ink));
      tela.circulo(46, 34, 3, rgba(COR.gold)); break;
    case 5:                                        // moldura da porta (arco)
      tela.retangulo(0, 0, 64, 10, pedra); tela.retangulo(0, 0, 10, 64, pedra);
      tela.retangulo(54, 0, 10, 64, pedra); tela.retangulo(0, 0, 64, 2, osso); break;
    case 6:                                        // placa de senha
      tela.retangulo(6, 12, 52, 40, rgba(COR.ink));
      tela.retangulo(8, 14, 48, 36, rgba('#2B2A3A'));
      for (let k = 0; k < 4; k += 1) tela.retangulo(14 + k * 10, 28, 6, 6, rgba(COR.gold)); break;
    default:                                       // reserva
      tela.retangulo(0, 0, 64, 64, rgba(COR.stone, 60));
  }
}

// ---------------------------------------------------------------- guias (folha de trabalho)
/**
 * Sobre a folha base: contorno de cada célula, linha dos pés, eixo central e número do frame.
 * Nada disto vai para o jogo — vive só em `public/assets/modelos/`.
 */
function comGuias(peca, folha) {
  const { frame } = peca;
  const guia = new Tela(folha.w, folha.h);
  guia.colar(folha, 0, 0);
  const total = peca.acoes.reduce((s, a) => s + a.frames, 0);
  const borda = rgba('#7A6FA8', 150);
  const pes = rgba(COR.threat, 120);
  const eixo = rgba('#7A6FA8', 90);
  for (let n = 0; n < total; n += 1) {
    const x = (n % peca.colunas) * frame.w;
    const y = Math.floor(n / peca.colunas) * frame.h;
    guia.moldura(x, y, frame.w, frame.h, borda);
    guia.tracejado(x + frame.w / 2, y + 2, x + frame.w / 2, y + frame.h - 2, eixo, 3, 5);
    // linha dos pés: encostada ao fundo, desviada 1 px para cima (o pixel do fundo é do desenho)
    guia.tracejado(x + 1, y + frame.h - 1, x + frame.w - 2, y + frame.h - 1, pes, 5, 3);
    numero(guia, n, x + 3, y + 3);
  }
  return guia;
}


// ---------------------------------------------------------------- personalização (`UI-12`)
/**
 * Cabeça **ampliada** dentro da célula: é assim que um penteado, um rosto, uma expressão ou uma
 * cicatriz se conseguem ler num modelo de conceito. A célula continua 96 × 128 — o que muda é o
 * zoom do desenho, não a medida. A arte final volta a ser a figura inteira.
 */
function cabecaAmpliada(tela, {
  pele = rgba(COR.pele), sombra = rgba(COR.peleSombra), cabelo = rgba(COR.ink),
  penteado = 'curto', rosto = 'quadrado', expressao = 'serio', marca = 'nenhuma',
  dentes = 'normais',
} = {}) {
  const cx = tela.w / 2;
  const r = Math.min(tela.w, tela.h) * 0.30;           // raio: 30% do lado menor (≈29 px)
  const cy = Math.round(tela.h * 0.42);
  // ombros, para a cabeça não flutuar
  tela.trapezio(cx, cy + r + 6, Math.round(tela.h * 0.34), Math.round(r * 1.5), Math.round(r * 2.4),
    rgba(COR.mass));
  tela.trapezio(cx, cy + r + 9, Math.round(tela.h * 0.30), Math.round(r * 1.3), Math.round(r * 2.2),
    rgba(COR.stone));
  // pescoço
  tela.retangulo(Math.round(cx - r * 0.3), cy + r - 4, Math.round(r * 0.6), 10, sombra);

  // --- a forma do rosto: quatro silhuetas, não um círculo com mais ou menos raio
  const desenha = (cor) => {
    switch (rosto) {
      case 'oval':
        tela.circulo(cx, cy, r, cor);
        tela.retangulo(Math.round(cx - r * 0.92), Math.round(cy), Math.round(r * 1.84),
          Math.round(r * 0.95), cor);
        break;
      case 'angular':
        for (let j = -r; j <= r; j += 1) {
          const w = Math.round(r * (1 - Math.pow(Math.abs(j) / r, 3) * 0.75));
          tela.retangulo(Math.round(cx - w), Math.round(cy + j), Math.max(1, w * 2), 1, cor);
        }
        break;
      case 'redondo':
        tela.circulo(cx, cy + 2, r * 1.06, cor);
        break;
      default:                                   // quadrado: mandíbula larga
        tela.retangulo(Math.round(cx - r), Math.round(cy - r), Math.round(r * 2), Math.round(r * 2), cor);
        tela.retangulo(Math.round(cx - r + 2), Math.round(cy - r - 2), Math.round(r * 2 - 4), 3, cor);
        break;
    }
  };
  desenha(rgba(COR.ink));                        // contorno
  desenha(pele);
  // sombra do queixo: dá volume sem gradiente
  tela.retangulo(Math.round(cx - r * 0.7), Math.round(cy + r * 0.62), Math.round(r * 1.4),
    Math.max(2, Math.round(r * 0.18)), sombra);

  // --- cabelo: sete penteados, o mesmo bloco em sítios diferentes
  const cima = Math.round(cy - r);
  switch (penteado) {
    case 'raspado':
      tela.retangulo(Math.round(cx - r * 0.95), cima + Math.round(r * 0.25),
        Math.round(r * 1.9), Math.max(3, Math.round(r * 0.18)), rgba(COR.stone)); break;
    case 'moicano':
      tela.retangulo(Math.round(cx - r * 0.95), cima + Math.round(r * 0.2),
        Math.round(r * 1.9), Math.max(3, Math.round(r * 0.2)), cabelo);
      tela.retangulo(Math.round(cx - r * 0.2), Math.round(cima - r * 0.55),
        Math.round(r * 0.4), Math.round(r * 0.8), cabelo); break;
    case 'coque':
      tela.retangulo(Math.round(cx - r * 0.95), cima + Math.round(r * 0.05),
        Math.round(r * 1.9), Math.round(r * 0.45), cabelo);
      tela.circulo(cx + r * 1.05, cima + Math.round(r * 0.2), Math.round(r * 0.34), cabelo); break;
    case 'longo':
      tela.retangulo(Math.round(cx - r * 1.05), Math.round(cima - r * 0.12),
        Math.round(r * 2.1), Math.round(r * 0.5), cabelo);
      tela.retangulo(Math.round(cx - r * 1.15), Math.round(cima), Math.round(r * 0.42),
        Math.round(r * 2.3), cabelo);
      tela.retangulo(Math.round(cx + r * 0.73), Math.round(cima), Math.round(r * 0.42),
        Math.round(r * 2.3), cabelo); break;
    case 'franja':
      tela.retangulo(Math.round(cx - r * 1.02), Math.round(cima - r * 0.15),
        Math.round(r * 2.04), Math.round(r * 0.85), cabelo); break;
    case 'cacheado':
      for (let k = -2; k <= 2; k += 1) {
        tela.circulo(cx + k * r * 0.45, cima + Math.round(r * 0.1), Math.round(r * 0.36), cabelo);
      }
      tela.retangulo(Math.round(cx - r * 0.98), cima + Math.round(r * 0.3),
        Math.round(r * 1.96), Math.round(r * 0.2), cabelo); break;
    default:                                     // curto
      tela.retangulo(Math.round(cx - r * 1.02), Math.round(cima - r * 0.1),
        Math.round(r * 2.04), Math.round(r * 0.55), cabelo);
      tela.retangulo(Math.round(cx - r * 1.02), Math.round(cima + Math.round(r * 0.45)),
        Math.round(r * 0.3), Math.round(r * 0.5), cabelo);
      tela.retangulo(Math.round(cx + r * 0.72), Math.round(cima + Math.round(r * 0.45)),
        Math.round(r * 0.3), Math.round(r * 0.5), cabelo); break;
  }

  // --- expressão: olhos, sobrancelhas e boca (cinco)
  const olhoY = Math.round(cy + r * 0.02);
  const dx = Math.round(r * 0.42);
  const olho = (lado) => {
    const x = Math.round(cx + lado * dx);
    switch (expressao) {
      case 'furioso':
        tela.retangulo(x - 4, olhoY - 1, 8, 4, rgba(COR.ink));
        tela.membro(x - lado * 6, olhoY - 6, lado > 0 ? 0.25 : Math.PI - 0.25, 10, 2, rgba(COR.ink));
        break;
      case 'sorriso':
        tela.membro(x - 4, olhoY + 1, 2.9, 4, 2, rgba(COR.ink));
        tela.membro(x + 4, olhoY + 1, Math.PI - 2.9, 4, 2, rgba(COR.ink));
        break;
      case 'cansado':
        tela.retangulo(x - 4, olhoY + 1, 8, 2, rgba(COR.ink));
        tela.retangulo(x - 5, olhoY + 4, 10, 1, rgba('#6D4327'));
        break;
      case 'grito':
        tela.circulo(x, olhoY, 4, rgba(COR.ink));
        break;
      default:                                   // séria
        tela.retangulo(x - 4, olhoY, 8, 3, rgba(COR.ink));
    }
  };
  olho(-1); olho(1);
  const bocaY = Math.round(cy + r * 0.52);
  if (dentes === 'vampiro') {
    tela.retangulo(Math.round(cx - 7), bocaY - 2, 14, 6, rgba(COR.ink));   // boca escura
    tela.retangulo(Math.round(cx - 6), bocaY - 2, 2, 5, rgba(COR.bone));    // presa esquerda
    tela.retangulo(Math.round(cx + 4), bocaY - 2, 2, 5, rgba(COR.bone));    // presa direita
  } else if (expressao === 'grito') {
    tela.circulo(cx, bocaY + 2, 6, rgba(COR.ink));
    tela.retangulo(Math.round(cx - 4), bocaY - 1, 8, 2, rgba(COR.bone));
  } else if (expressao === 'sorriso') {
    // boca em arco: dois troços a descer e um fundo — um traço só lia-se como cicatriz
    tela.membro(cx - 7, bocaY - 1, 0.7, 4, 2, rgba(COR.ink));
    tela.membro(cx - 3, bocaY + 2, 0, 6, 2, rgba(COR.ink));
    tela.membro(cx + 3, bocaY + 2, -0.7, 4, 2, rgba(COR.ink));
  } else if (expressao === 'furioso') {
    tela.membro(cx - 6, bocaY + 2, 0.35, 12, 2, rgba(COR.ink));
  } else {
    tela.retangulo(Math.round(cx - 6), bocaY, 12, 2, rgba(COR.ink));
  }

  // --- marcas: onde a arte as vai pôr
  switch (marca) {
    case 'cicatriz-olho':
      tela.membro(cx + r * 0.62, cy - r * 0.45, 1.35, Math.round(r * 1.1), 2, rgba('#7B2E4A')); break;
    case 'cicatriz-boca':
      tela.membro(cx + r * 0.5, cy + r * 0.35, 1.9, Math.round(r * 0.7), 2, rgba('#7B2E4A')); break;
    case 'tatuagem-braco':
      for (let k = 0; k < 3; k += 1) {
        tela.retangulo(Math.round(cx - r * 1.35), Math.round(cy + r * 1.5 + k * 5), 10, 3,
          rgba('#3B2418'));
      }
      break;
    case 'tatuagem-peito':
      tela.retangulo(Math.round(cx - r * 0.7), Math.round(cy + r * 1.45), Math.round(r * 1.4), 4,
        rgba('#3B2418')); break;
    case 'pintura':
      tela.retangulo(Math.round(cx - r * 0.95), Math.round(cy - r * 0.1), Math.round(r * 1.9), 4,
        rgba('#7B2E4A', 200));
      tela.retangulo(Math.round(cx - r * 0.95), Math.round(cy + r * 0.2), Math.round(r * 1.9), 4,
        rgba('#7B2E4A', 200)); break;
    default: break;
  }
  return { cx, cy, r };
}

/** Uma célula por variante; o índice diz qual. */
function folhaDeVariantes(peca, desenhar) {
  const { frame, colunas } = peca;
  const total = peca.acoes.reduce((s, a) => s + a.frames, 0);
  const linhas = Math.ceil(total / colunas);
  const tela = new Tela(colunas * frame.w, linhas * frame.h);
  for (let n = 0; n < total; n += 1) {
    const celula = new Tela(frame.w, frame.h);
    desenhar(celula, n);
    tela.colar(celula, (n % colunas) * frame.w, Math.floor(n / colunas) * frame.h);
  }
  return tela;
}

const corDe = (lista, id) => rgba((lista.find((t) => t.id === id) ?? lista[0]).cor);
const sombraDe = (lista, id) => rgba((lista.find((t) => t.id === id) ?? lista[0]).sombra);

// Ampliação de **leitura**, igual para as cinco células de cada folha. Não se ajusta a variante
// para caber: se cada corpo tivesse um zoom próprio, magro e gordo voltariam a parecer iguais.
const ZOOM_PECA = { torsos: 1.55, bracos: 1.35, maos: 3.2, pernas: 1.25, pes: 2.2, marcas: 1.45 };
const medidasPeca = (n, zoom) => {
  const c = CAT.corpos[n];
  return medidasForma(c, Math.round(112 * c.altura * zoom));
};

/** Tronco isolado, com o pescoço que liga à cabeça. `pele` mostra a superfície das tatuagens. */
function desenharTroncoPeca(tela, m, { topo = 40, pele = false, marca = 'nenhuma' } = {}) {
  const cx = tela.w / 2;
  const preenche = pele ? corDe(CAT.peles, 'media') : rgba(COR.mass);
  const sombra = pele ? sombraDe(CAT.peles, 'media') : rgba(COR.stone);
  const pescocoW = Math.max(5, Math.round(m.cabecaH * 0.36));
  const pescocoH = Math.max(7, Math.round(m.cabecaH * 0.28));
  tela.retangulo(Math.round(cx - pescocoW / 2) - 1, topo - pescocoH - 1,
    pescocoW + 2, pescocoH + 3, rgba(COR.ink));
  tela.retangulo(Math.round(cx - pescocoW / 2), topo - pescocoH, pescocoW, pescocoH + 2,
    sombraDe(CAT.peles, 'media'));

  const meio = Math.round(m.troncoH * 0.55);
  tela.trapezio(cx, topo, meio, m.ombro, m.tronco, rgba(COR.ink));
  tela.trapezio(cx, topo + meio, m.troncoH - meio, m.tronco, m.cintura, rgba(COR.ink));
  tela.trapezio(cx, topo + 1, Math.max(1, meio - 1), m.ombro - 2, m.tronco - 2, preenche);
  tela.trapezio(cx, topo + meio, m.troncoH - meio - 1, m.tronco - 2, m.cintura - 2, preenche);
  // sombra lateral: acompanha o peito e a cintura, sem alterar a silhueta medida
  tela.membro(cx - m.tronco / 2 + 3, topo + meio, Math.PI / 2, m.troncoH - meio - 4, 2, sombra);
  tela.membro(cx + m.tronco / 2 - 3, topo + meio, Math.PI / 2, m.troncoH - meio - 4, 2, sombra);

  if (marca === 'tatuagem-peito') {
    // U em nove pontos: o mesmo desenho curvo da prévia, mas legível sem antialias.
    for (let k = -4; k <= 4; k += 1) {
      tela.circulo(cx + (k * m.tronco) / 11, topo + 14 + Math.abs(k) * 1.4,
        Math.max(2, Math.round(m.bracoEsp * 0.16)), rgba('#3B2418', 220));
    }
  }
  const faixaY = Math.round(topo + m.troncoH * 0.74);
  tela.retangulo(Math.round(cx - m.cintura * 0.48), faixaY,
    Math.max(2, Math.round(m.cintura * 0.96)), Math.max(2, Math.round(m.H * 0.025)),
    pele ? sombra : rgba(COR.gold));
  if (!pele) tela.retangulo(cx - 1, topo + Math.round(m.troncoH * 0.24), 2,
    Math.round(m.troncoH * 0.64), rgba(COR.ink));
  return { cx, meio, faixaY };
}

/** Par de braços, do ombro ao pulso. Devolve os dois eixos para a folha de marcas. */
function desenharBracosPeca(tela, m, { topo = 26, pele = true, marca = 'nenhuma' } = {}) {
  const cx = tela.w / 2;
  const preenche = pele ? corDe(CAT.peles, 'media') : rgba(COR.stone);
  const comp = m.troncoH * 0.95;
  const bracos = [];
  [-1, 1].forEach((lado) => {
    const x = cx + lado * (m.ombro / 2 - 2);
    const ang = Math.PI / 2 - lado * 0.12;
    tela.membro(x, topo, ang, comp, m.bracoEsp + 2, rgba(COR.ink));
    tela.membro(x, topo, ang, comp, m.bracoEsp, preenche);
    const pulsoX = x + Math.cos(ang) * comp;
    const pulsoY = topo + Math.sin(ang) * comp;
    tela.membro(pulsoX, pulsoY - 2, ang, 3, m.bracoEsp + 1, rgba(COR.ink));
    bracos.push({ x, topo, ang, comp, pulsoX, pulsoY });
  });
  if (marca === 'tatuagem-braco') {
    const b = bracos[0];
    for (let k = 0; k < 3; k += 1) {
      const d = comp * (0.34 + k * 0.13);
      const x = b.x + Math.cos(b.ang) * d;
      const y = b.topo + Math.sin(b.ang) * d;
      tela.retangulo(Math.round(x - m.bracoEsp / 2) + 1, Math.round(y - 1),
        Math.max(2, m.bracoEsp - 2), Math.max(2, Math.round(m.bracoEsp * 0.18)), rgba('#3B2418'));
    }
  }
  return bracos;
}

/** Os seis desenhadores do restante do corpo. Todos partilham o índice de `CAT.corpos`. */
const DESENHADORES_CORPO = {
  spr_pers_torsos: (tela, n) => {
    desenharTroncoPeca(tela, medidasPeca(n, ZOOM_PECA.torsos), { topo: 43 });
  },
  spr_pers_bracos: (tela, n) => {
    desenharBracosPeca(tela, medidasPeca(n, ZOOM_PECA.bracos), { topo: 25 });
  },
  spr_pers_maos: (tela, n) => {
    const m = medidasPeca(n, ZOOM_PECA.maos);
    const cx = tela.w / 2;
    [-1, 1].forEach((lado) => {
      const x = cx + lado * 23;                 // par afastado só para leitura; a escala é comum
      const y = 70;
      tela.membro(x, 35, Math.PI / 2, 27, Math.max(4, Math.round(m.bracoEsp * 0.72)) + 2,
        rgba(COR.ink));
      tela.membro(x, 35, Math.PI / 2, 27, Math.max(3, Math.round(m.bracoEsp * 0.72)),
        sombraDe(CAT.peles, 'media'));
      tela.circulo(x, y, Math.max(3, Math.round(m.bracoEsp * 0.55)), rgba(COR.ink));
      tela.circulo(x, y, Math.max(2, Math.round(m.bracoEsp * 0.42)), corDe(CAT.peles, 'media'));
      for (let d = -1; d <= 1; d += 1) {
        tela.retangulo(Math.round(x + d * m.bracoEsp * 0.2), Math.round(y + m.bracoEsp * 0.22),
          1, Math.max(2, Math.round(m.bracoEsp * 0.16)), sombraDe(CAT.peles, 'media'));
      }
    });
  },
  spr_pers_pernas: (tela, n) => {
    const m = medidasPeca(n, ZOOM_PECA.pernas);
    const cx = tela.w / 2;
    const topo = 28;
    tela.retangulo(Math.round(cx - m.cintura / 2) - 1, topo - 7,
      m.cintura + 2, 11, rgba(COR.ink));
    tela.retangulo(Math.round(cx - m.cintura / 2), topo - 6, m.cintura, 8, rgba(COR.mass));
    [-1, 1].forEach((lado) => {
      const x = cx + lado * m.afast;
      const comp = m.pernaH * 0.92;
      tela.membro(x, topo, Math.PI / 2, comp, m.pernaEsp + 2, rgba(COR.ink));
      tela.membro(x, topo, Math.PI / 2, comp, m.pernaEsp, rgba(COR.mass));
      tela.retangulo(Math.round(x - m.pernaEsp / 2) + 1, Math.round(topo + comp * 0.58),
        Math.max(2, m.pernaEsp - 2), 2, rgba(COR.stone));
    });
  },
  spr_pers_pes: (tela, n) => {
    const m = medidasPeca(n, ZOOM_PECA.pes);
    const cx = tela.w / 2;
    [-1, 1].forEach((lado) => {
      const x = Math.round(cx + lado * 20);
      const base = 101;
      tela.membro(x, 45, Math.PI / 2, 42, m.pernaEsp + 2, rgba(COR.ink));
      tela.membro(x, 45, Math.PI / 2, 42, m.pernaEsp, rgba(COR.mass));
      const w = m.pernaEsp + 4;
      const h = Math.max(5, Math.round(m.pernaEsp * 0.34));
      tela.retangulo(Math.round(x - w / 2) - 2, base - h - 1, w + 4, h + 3, rgba(COR.ink));
      tela.retangulo(Math.round(x - w / 2) - 1, base - h, w + 2, h, rgba(COR.ink));
      tela.retangulo(Math.round(x - w / 2), base - h, w, 2, rgba(COR.stone));
    });
  },
  spr_pers_marcas_corpo: (tela, n) => {
    const marca = CAT.marcasCorpo[n];
    const m = medidasPeca(1, ZOOM_PECA.marcas);      // atlético: a régua é a mesma nas 3 células
    desenharBracosPeca(tela, m, { topo: 40, marca });
    desenharTroncoPeca(tela, m, { topo: 37, pele: true, marca });
  },
};

/** Os desenhadores da personalização, cada um lendo o catálogo do manifesto. */
const DESENHADORES = {
  spr_pers_corpos: (tela, n) => {
    const c = CAT.corpos[n];
    const altura = Math.round(Math.min(tela.h, 112) * c.altura);
    figura(tela, {
      cx: tela.w / 2, base: tela.h - 1, altura, largura: c.ombro / 0.94, forma: c,
      p: { bracos: [Math.PI / 2 + 0.12, Math.PI / 2 - 0.12] },
    });
    // marca de largura: uma linha no chão do tamanho do ombro (é o que muda entre corpos)
    tela.retangulo(Math.round(tela.w / 2 - (36 * c.ombro) / 2), tela.h - 4,
      Math.round(36 * c.ombro), 1, rgba(COR.gold, 140));
  },
  spr_pers_cabelos: (tela, n) => {
    cabecaAmpliada(tela, { penteado: CAT.cabelos[n], cabelo: corDe(CAT.coresCabelo, CAT.coresCabelo[n % 7].id) });
  },
  spr_pers_rostos: (tela, n) => cabecaAmpliada(tela, { rosto: CAT.rostos[n] }),
  spr_pers_expressoes: (tela, n) => cabecaAmpliada(tela, { expressao: CAT.expressoes[n] }),
  spr_pers_marcas: (tela, n) => cabecaAmpliada(tela, { marca: CAT.marcas[n] }),
  spr_pers_dentes: (tela, n) => cabecaAmpliada(tela, { dentes: CAT.dentes[n], expressao: 'serio' }),
  spr_pers_peles: (tela, n) => {
    const t = CAT.peles[n];
    tela.retangulo(2, 2, 28, 28, rgba(t.cor));
    for (let k = 0; k < 28; k += 1) {
      tela.retangulo(2 + k, 2 + 28 - k, 1, 1, rgba(t.sombra));   // canto sombreado
    }
    tela.moldura(1, 1, 30, 30, rgba(COR.ink));
  },
  spr_pers_cores_cabelo: (tela, n) => {
    const t = CAT.coresCabelo[n];
    tela.retangulo(2, 2, 28, 28, rgba(t.cor));
    for (let k = 0; k < 28; k += 1) tela.retangulo(2 + k, 2 + 28 - k, 1, 1, rgba(t.sombra));
  },
  spr_pers_exemplos: (tela, n) => {
    // 0 = padrão · 1 = MACHO (moicano azul, furioso, maromba, clara) · 2 = ALUCARD (longo branco,
    // presas, magro, pálida). Os três vêm dos presets de `services/character.ts`.
    const receita = [
      { corpo: 'atletico', penteado: 'curto', cor: 'preto', pele: 'media', expressao: 'serio', dentes: 'normais' },
      { corpo: 'maromba', penteado: 'moicano', cor: 'azul', pele: 'clara', expressao: 'furioso', dentes: 'normais' },
      { corpo: 'magro', penteado: 'longo', cor: 'branco', pele: 'palida', expressao: 'serio', dentes: 'vampiro' },
    ][n];
    const c = CAT.corpos.find((x) => x.id === receita.corpo);
    figura(tela, {
      cx: tela.w / 2, base: tela.h - 1, altura: Math.round(Math.min(tela.h, 112) * c.altura),
      largura: c.ombro / 0.94, forma: c,
      p: {
        cabelo: receita.penteado === 'longo' ? 'longo' : receita.penteado === 'moicano' ? 'moicano' : 'curto',
        presas: receita.dentes === 'vampiro',
        olhos: rgba(COR.ink),
      },
      cores: { pele: corDe(CAT.peles, receita.pele), pele2: sombraDe(CAT.peles, receita.pele),
               cabelo: corDe(CAT.coresCabelo, receita.cor) },
    });
  },
  ...DESENHADORES_CORPO,
};

// ---------------------------------------------------------------- execução
const ARG = process.argv.slice(2);
const escolhidas = ARG.length ? MANIFESTO.pecas.filter((p) => ARG.includes(p.chave)) : MANIFESTO.pecas;

const PASTA_IMAGENS = join(RAIZ, MANIFESTO.pastas.imagens);
const PASTA_TILES = join(RAIZ, MANIFESTO.pastas.tilemaps);
const PASTA_MODELOS = join(RAIZ, 'public/assets/modelos');
mkdirSync(PASTA_IMAGENS, { recursive: true });
mkdirSync(PASTA_TILES, { recursive: true });
mkdirSync(PASTA_MODELOS, { recursive: true });

const feito = [];
for (const p of escolhidas) {
  let tela = null;
  if (p.chave === 'player') tela = folhaPersonagem(p, desenharHeroi);
  else if (p.chave === 'sentinel') tela = folhaPersonagem(p, desenharSentinela);
  else if (p.tipo === 'spritesheet' && p.id.startsWith('AST-003')) tela = folhaPersonagem(p, desenharChefe(p));
  else if (p.tipo === 'itens') tela = folhaPersonagem(p, desenharItens);
  else if (p.tipo === 'efeito') tela = folhaPersonagem(p, desenharSpark);
  else if (p.chave === 'tm_ruinas') tela = folhaTiles(p, pintarRuina);
  else if (p.chave === 'tm_armadilhas') tela = folhaTiles(p, pintarArmadilha);
  else if (DESENHADORES[p.chave]) tela = folhaDeVariantes(p, DESENHADORES[p.chave]);

  if (!tela) continue;

  // 1) o ficheiro do jogo (medidas exatas, sem guias)
  const destino = join(p.tipo === 'tileset' ? PASTA_TILES : PASTA_IMAGENS, p.ficheiro);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, png(tela));

  // 2) a folha de trabalho, com guias
  const modelo = join(PASTA_MODELOS, `modelo_${p.ficheiro}`);
  writeFileSync(modelo, png(comGuias(p, tela)));

  feito.push({ chave: p.chave, tamanho: `${tela.w}×${tela.h}`, ficheiro: p.ficheiro });
}

console.log(`\nMODELOS BASE — ${feito.length} peça(s)\n`);
for (const f of feito) console.log(`  ${f.chave.padEnd(16)} ${f.tamanho.padStart(9)}  ${f.ficheiro}`);
console.log(`
  jogo:    public/assets/images · public/assets/tilemaps
  trabalho: public/assets/modelos (grelha, linha dos pés, eixo, número do frame)
  conferir: npm run arte
`);
