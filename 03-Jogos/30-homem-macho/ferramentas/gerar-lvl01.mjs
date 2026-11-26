/**
 * Gera as seis salas de LVL-01 na escala do piloto (`DEC-048`) e confere invariantes.
 * `node ferramentas/gerar-lvl01.mjs` — imprime as grades prontas a colar em `lvl01.ts`.
 *
 * Construir as salas por código (e não à mão) é o que impede o erro de conta: a linha 1 da
 * primeira tentativa tinha 54 caracteres onde eu esperava 60, e o script disse-mo antes de a
 * grade chegar ao jogo.
 *
 * Regras da grandeza nova:
 *  - 11 linhas (a altura **não** muda: `VIEW.height` = 704 = 11 tiles);
 *  - larguras 60·70·55·90·40·50 (eram 20·30·20·40·20·20);
 *  - **piso na linha 7** e aberturas em 4–6, como antes (`DEC-007`) — a cena spawna a leste/oeste
 *    a `7*TILE - 6`, e essa convenção é do motor, não do setor;
 *  - só dois objetos no chão (espinho `A`, caixote `k`): nenhum glifo novo é inventado.
 */

const INIMIGOS = { E: 'sentinela', T: 'atirador', V: 'voador' };
const PISO = 7;

/** Monta uma sala: paredes, chão, poços, plataformas one-way e objetos por coordenada. */
function sala(largura, spec) {
  const g = [];
  for (let y = 0; y < 11; y++) {
    // 0 é o teto e `PISO` em diante é chão: a linha 7 tem de ser sólida, é ela que o motor usa
    // como `floorY` (`7 * TILE - 6`) em todas as salas do jogo
    if (y === 0 || y >= PISO) g.push('#'.repeat(largura));
    else g.push('#' + '.'.repeat(largura - 2) + '#');
  }
  for (const [y, from, to] of spec.solidos ?? []) {
    g[y] = g[y].slice(0, from) + '#'.repeat(to - from + 1) + g[y].slice(to + 1);
  }
  for (const [y, from, to] of spec.plataformas ?? []) {
    g[y] = g[y].slice(0, from) + '='.repeat(to - from + 1) + g[y].slice(to + 1);
  }
  for (const [y, from, to] of spec.buracos ?? []) {
    g[y] = g[y].slice(0, from) + '.'.repeat(to - from + 1) + g[y].slice(to + 1);
  }
  const oeste = spec.oeste !== false;   // a primeira sala não tem porta a oeste
  const leste = spec.leste ?? 'D';      // 'D' porta dourada, '+' abertura, null sem porta
  if (oeste) for (const y of [4, 5, 6]) g[y] = '+' + g[y].slice(1);
  if (leste) for (const y of [4, 5, 6]) g[y] = g[y].slice(0, -1) + (leste === 'D' ? 'D' : '+');
  for (const [x, y, ch] of spec.objetos ?? []) {
    g[y] = g[y].slice(0, x) + ch + g[y].slice(x + 1);
  }
  return g;
}

const L01_01 = sala(60, {
  oeste: false, leste: '+',
  objetos: [
    [2, 6, 'S'], [12, 6, 'c'], [22, 6, 'N'], [30, 6, 'k'], [40, 6, 'k'], [48, 3, 'G'],
  ],
});

const L01_02 = sala(70, {
  leste: '+',
  buracos: [[7, 30, 36], [8, 30, 35]],   // a bacia de 2 tiles, com saída em dois degraus
  plataformas: [[6, 58, 59], [5, 61, 62], [4, 64, 65]],
  objetos: [
    [10, 6, 'k'], [16, 6, 'k'], [64, 3, 'N'],
  ],
});

const L01_03 = sala(55, {
  leste: '+',
  solidos: [[6, 10, 13]],                 // o pedestal de 1 tile: um pulo obrigatório
  objetos: [
    [11, 5, 'E'],                          // a Sentinela de costas, em cima do pedestal
    [30, 6, 'E'],                          // a segunda, de frente, no chão
    [45, 3, 'G'],
  ],
});

const L01_04 = sala(90, {
  leste: '+',
  solidos: [[6, 8, 12]],                  // degrau: salto obrigatório
  plataformas: [[4, 80, 81], [5, 76, 77]],
  objetos: [
    [19, 6, 'A'], [20, 6, 'A'],            // vão de espinhos de 2 tiles
    [25, 3, 'V'],                          // a mariposa, no ar
    [30, 6, 'h'],                          // a cura vem **depois** da armadilha
    [40, 6, 'E'],
    [52, 6, 'T'], [62, 6, 'T'],            // dois atiradores, longe um do outro
    [72, 6, 'E'],
    [84, 3, 'G'],
  ],
});

const L01_05 = sala(40, {
  leste: '+',                             // o quarto seguro não é a saída: a porta dourada é L01-06
  objetos: [
    [6, 6, 'c'], [12, 6, 'P'], [18, 6, 'k'], [26, 6, 's'], [13, 3, 'Q'], [30, 3, 'G'],
  ],
});

const L01_06 = sala(50, {
  leste: 'D',
  objetos: [[10, 6, 'N'], [18, 6, 'k'], [24, 6, 'T'], [30, 6, 'c'], [14, 3, 'G']],
});

const SALAS = [
  ['L01-01', L01_01], ['L01-02', L01_02], ['L01-03', L01_03],
  ['L01-04', L01_04], ['L01-05', L01_05], ['L01-06', L01_06],
];

let ok = true;
const resumo = [];
for (const [id, grade] of SALAS) {
  const larg = grade[0].length;
  const censo = { sentinela: 0, atirador: 0, voador: 0 };
  for (const [y, linha] of grade.entries()) {
    if (linha.length !== larg) { console.error(`${id}: linha ${y} com ${linha.length}`); ok = false; }
    for (const ch of linha) if (INIMIGOS[ch]) censo[INIMIGOS[ch]] += 1;
    if ((y === 0 || y === 10) && /[^#]/.test(linha)) { console.error(`${id}: linha ${y} aberta`); ok = false; }
  }
  // abaixo da linha do piso só pode haver chão ou o vazio da bacia — **nunca um objeto**,
  // que ficaria inalcançável (o motor spawna tudo com a âncora no fundo da célula)
  const abaixo = grade.slice(8).join('').replace(/[#.]/g, '');
  if (abaixo) { console.error(`${id}: objeto abaixo do piso: ${abaixo}`); ok = false; }
  const total = Object.values(censo).reduce((a, b) => a + b, 0);
  resumo.push(`${id} ${larg}×11  inimigos ${total} (E${censo.sentinela} T${censo.atirador} V${censo.voador})`);
  console.log(`\n// ${id} — ${larg}×11`);
  for (const l of grade) console.log(`    '${l}',`);
}
console.log('\n' + resumo.join('\n'));
console.log('\n' + (ok ? 'INVARIANTES OK' : 'INVARIANTES FALHARAM'));
