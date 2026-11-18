/**
 * PAT-C-04 — tuning data-driven. NENHUM número de gameplay fora deste arquivo.
 * Fontes: DEC-014 (config B), 02-gameplay §2.2/§2.5, LVL-01.md §6, 07-padroes §7.1.
 * Imutável em runtime; o painel de debug (dev) só exporta JSON, nunca escreve aqui.
 */
import { SAVE_SLOTS } from '../../services/save';
import type { Difficulty } from '../../core/types';

export const TILE = 64;                       // 07-padroes §7.1
export const VIEW = { width: 1280, height: 704 } as const; // 20×11 tiles = uma tela lógica

export const MOVE = {
  moveSpeed: 220,          // px/s — 02-gameplay §2.5
  runMultiplier: 1.4,      // 308 px/s
  jumpImpulse: 560,        // DEC-014
  gravity: 1100,           // DEC-014
  coyoteMs: 100,           // PAT-C-05
  jumpBufferMs: 100,       // PAT-C-05
  cornerPx: 6,             // PAT-C-05
  maxFallSpeed: 980,
  variableJumpCut: 0.45,   // soltar o botão multiplica a velocidade vertical
  // DEC-014 / LVL-02 §8: duplo = 138 + 138 = 276 px. O segundo salto usa o mesmo impulso;
  // a leitura de "é o segundo" vem do feedback visual, não de cortar altura.
  airJumpMultiplier: 1,
} as const;

export const PLAYER = {
  hp: 100,                 // MEC-003
  shield: 50,
  power: 100,
  body: { width: 36, height: 110 },  // ≤ 2 tiles de altura (128 px)
  iframesMs: 900,
  respawnFadeMs: 300,      // DEC-011
  attack: { damage: 20, reachPx: 78, heightPx: 74, activeMs: 140, cooldownMs: 320 },
  shot:   { damage: 10, speed: 620, cooldownMs: 420, poolSize: 10 },
} as const;

export const SENTINEL = {
  id: 'ENT-002',
  hp: 20,                  // LVL-01 §6 — 1 golpe de arma branca (TST-002)
  damage: 20,
  touchDamage: 20,
  speed: 46,
  patrolTiles: 3,
  telegraphMs: 800,        // P2 — ataque legível
  lungePx: 26,
  recoverMs: 1000,
  body: { width: 44, height: 78 },
} as const;

/**
 * **`ENT-010` e `ENT-011`** (`DEC-048`) — os outros dois arquétipos comuns.
 *
 * Como a Sentinela, são **só números de corpo**: o comportamento está em `core/arquetipos.ts`
 * (que é puro e testado) e as variantes por setor em `VARIANTES`. A separação é a mesma do chefe
 * (`DEC-021`): o `tuning.ts` diz *quanto*, o arquétipo diz *como*, o setor diz *com quem*.
 *
 * O corpo é **igual ao da Sentinela** (44 × 78) de propósito: o jogador não deve descobrir por
 * tentativa se um corpo é sólido. O que muda é a silhueta e o ataque.
 */
export const ARQUEIRO = {
  id: 'ENT-010',
  glifo: 'T',
  hp: 20,
  dano: 10,
  /** O tiro é o mesmo objeto do `PAT-C-03`, num grupo próprio (nunca no grupo do jogador). */
  projetil: { velocidadePx: 240, dano: 10 },
  corpo: { width: 44, height: 78 },
} as const;

export const VOADOR = {
  id: 'ENT-011',
  glifo: 'V',
  hp: 20,
  dano: 10,
  /** Sem gravidade: é a única criatura do jogo que não obedece ao chão. */
  gravidade: false,
  corpo: { width: 44, height: 78 },
} as const;

export const SPIKE = { damage: 20 } as const;  // LVL-01 §5: CEN-001 estático (sempre ativo)

/** `CEN-001` cíclico — LVL-02 §6: 1,2 s ativo / 1,2 s inativo, telegraph de 300 ms. */
export const SPIKE_CYCLE = { activeMs: 1200, inactiveMs: 1200, telegraphMs: 300, offsetMs: 600 } as const;

/** `DEC-011` / LVL-02 §5.6: cair em vão não mata — volta para a entrada da sala. */
export const PIT = { fallLimitPx: 260, fadeMs: 300 } as const;

/**
 * `ENT-003` Guardião da Passagem — `LVL-03.md` §5.
 * Nada aqui é estimativa: os tempos vêm da tabela §5.3 e a geometria da §6.5.
 */
export const BOSS = {
  id: 'ENT-003',
  name: 'GUARDIÃO DA PASSAGEM',
  hp: 200,
  phase2At: 100,          // §5.5 — vida ≤ 100 vira fase 2, uma única vez
  damage: 20,             // antes do multiplicador de dificuldade
  body: { width: 160, height: 176 },  // hurtbox menor que o sprite (anti-hitbox)
  sprite: { width: 192, height: 192 },
  charge: { speed: 520, tiles: 5, px: 320 },   // §6.5: 5 tiles = 0,62 s
  telegraphMs: 800,
  telegraphPhase2Ms: 600,
  recoverMs: 1000,
  recoverPhase2Ms: 800,
  stunMs: 1200,           // pilar quebrado = 2 golpes de janela
  areaTelegraphMs: 1000,  // ATK-02
  areaRecoverMs: 900,
  areaWave: { speed: 400, tiles: 3 },
  introMs: 400,           // VIS-007
  transitionMs: 600,
  deathHoldMs: 600,
  knockbackResistant: true,
} as const;

/**
 * `ENT-004` O Alferes da Ronda — chefe médio de `LVL-08` §5.1.
 * A diferença para `BOSS` não é vida: é a **segunda fonte de dano** (o eco) e a
 * recuperação menor. A válvula de dificuldade é `recoverMs`, não `hp` (§6.4).
 */
export const ALFERES = {
  id: 'ENT-004',
  name: 'O ALFERES DA RONDA',
  hp: 240,
  phase2At: 120,            // §5.5 — vida ≤ 120 vira fase 2, uma única vez
  damage: 20,               // sabre, antes do multiplicador de dificuldade
  echoDamage: 15,           // `ATK-06`
  body: { width: 128, height: 160 },   // hurtbox menor que o sprite (anti-hitbox)
  sprite: { width: 192, height: 192 },
  lunge: { tiles: 4, px: 256, speed: 640 },   // §6.5: 4 tiles a 640 px/s = 400 ms
  windupMs: 700,
  recoverMs: 1100,
  recoverPhase2Ms: 900,
  echoDelayMs: 600,         // o eco nasce 600 ms depois do início da estocada
  echoMs: 500,
  introMs: 400,
  transitionMs: 800,
  deathHoldMs: 600,
  knockbackResistant: true,
} as const;

/**
 * `CEN-064` areia — `LVL-08` §7. Atrito de piso, **sem dano**.
 * A regra vive em `core/sand.ts`; aqui mora o número (`PAT-C-04`).
 */
export const SAND = {
  /** 0,75× no chão: o salto de corrida cai de 313 px para 235 px (§7.5). */
  speedMultiplier: 0.75,
  /** Largura da âncora ativa, em tiles (§4.4). */
  anchorTiles: 3,
  /** Linha do piso da arena (a âncora nasce no tile acima). */
  floorRow: 7,
} as const;

/** `CEN-065` grade da arena (`LVL-08` §4.4). */
export const ARENA = {
  /** Oeste fecha quando o jogador cruza `x ≥ 3` tiles. */
  westClosesAtTile: 3,
  grateDropMs: 600,
  /** A câmera de 24 tiles rola o mínimo possível (§4.4). */
  tiles: 24,
} as const;

/**
 * `HAB-04` gancho — `LVL-09` §6.2. A regra vive em `core/hook.ts`; aqui mora o número
 * (`PAT-C-04`). O gancho **não é arma**: não há dano aqui de propósito.
 */
export const HOOK = {
  reachTiles: 6,            // 384 px, hemisfério superior
  pullSpeed: 900,           // px/s — 6 tiles em 0,43 s
  jumpSpeed: 380,           // px/s horizontal ao saltar do pendurado
  /** Raio do alvo (`hook_ring`): meia célula, como o `radius_px` do `.tmj`. */
  ringRadiusPx: 32,
  /** Folga vertical do corpo pendurado em relação à argola. */
  hangGapPx: 8,
  /** Altura da argola acima do piso, em tiles (o glifo fica em `y=2`/`y=3`). */
  ringRowsAboveFloor: 3,
} as const;

/**
 * `HAB-03` escalada e o alçapão — `LVL-10` §6/§7. A regra vive em `core/climb.ts`;
 * aqui mora o número (`PAT-C-04`).
 */
export const CLIMB = {
  gripMs: 100,
  upSpeed: 90,
  downSpeed: 240,
  wallJumpX: 420,
  wallJumpY: 560,
} as const;

/** `CEN-081` alçapão no teto (`DEC-015`): 2 tiles, dois sentidos, exige `HAB-03`. */
export const HATCH = {
  widthTiles: 2,
  /** Sempre em `y=0`: o teto é a passagem, a sala continua com 11 linhas. */
  row: 0,
} as const;

/**
 * `CEN-096` corrente de ar — `LVL-13` §6 (`P-63`). **Quem sobe é a corrente, não o pano.**
 * A regra vive em `core/updraft.ts`; aqui mora o número (`PAT-C-04`).
 */
export const UPDRAFT = {
  /** 140 e não 120: a 120 o jogador ficaria parado na coluna (§6.3). */
  risePxS: 140,
  /** Largura declarada na ficha da sala, em tiles (3×6, §3). */
  widthTiles: 3,
  heightTiles: 6,
  /** O alçapão fica no topo da coluna, a 6 tiles do piso (`DEC-015`). */
  hatchPx: 6 * 64,
  requires: 'HAB-07',
  /** Só com o pano aberto: a corrente empurra, o estandarte impede a queda (§6.2). */
  needsGlide: true,
} as const;

/**
 * `CEN-095` / `AMB-13` — o eco (`LVL-13` §5). O setor não tem voz própria: devolve a do
 * jogador. É **efeito de bus**, não `SFX` duplicado, e a silhueta sai em `reduce_motion`.
 */
export const ECHO = {
  delayMs: 700,
  ghostAlpha: 0.3,
  /** A história de posições precisa cobrir o atraso: 700 ms a 60 Hz. */
  historyMs: 900,
} as const;

/**
 * `CEN-099` a queda longa de L13-02 (`LVL-13` §8, `P-64`). A profundidade do setor mora
 * na transição, não na grade: **3 s de preto com vento, zero de dano**.
 */
export const LONG_FALL = {
  fallMs: 3000,
  reducedMotionMs: 900,
  fadeOutMs: 600,
  fadeInMs: 600,
  damage: 0,
} as const;

/**
 * `ENT-005` O Forjador — `LVL-12` §5 (`P-60`). A regra vive em `core/forge.ts`; aqui mora
 * o número (`PAT-C-04`). **`gate: 'none'`**: ele não tranca a porta, e isso é o setor (§8).
 */
export const FORJADOR = {
  id: 'ENT-005',
  name: 'O FORJADOR',
  hp: 260,                  // 20 acima de `ENT-004`; a diferença não é vida, é o metrônomo
  phase2At: 130,
  /** `ATK-10` corrente: 5 tiles a 700 px/s = 457 ms (§6.5). */
  arc: { tiles: 5, px: 320, speed: 700, damage: 22 },
  /** `ATK-11` peça em brasa: viaja na altura do peito e quica **uma** vez. */
  piece: { px: 384, speed: 520, damage: 18, bounces: 1 },
  /** `ATK-12` onda de bigorna: 6 tiles de piso, só na fase 2. */
  wave: { tiles: 6, px: 384, height: 26, damage: 20 },
  body: { width: 128, height: 160 },   // hurtbox menor que o sprite (anti-hitbox)
  sprite: { width: 192, height: 192 },
  /** Ele não persegue: só ocupa o posto. `leash` é a coluna máxima (§5.1). */
  leashX: 21,
  engageTiles: 5,
  /** `gate: 'none'` é o campo que implementa §8 — nenhum outro valor é válido aqui. */
  gate: 'none',
  optional: true,
  arcWindupMs: 800,
  arcMs: 460,
  arcRecoverMs: 900,
  arcRecoverPhase2Ms: 750,
  pieceWindupMs: 500,
  pieceMs: 400,
  pieceRecoverMs: 700,
  waveWindupMs: 600,
  waveMs: 600,
  waveRecoverMs: 650,
  transitionMs: 800,
  deathHoldMs: 600,
  knockbackResistant: true,
} as const;

/**
 * `CEN-092` pilão — `LVL-12` §7. **Não é ataque do chefe**: relógio próprio, posição fixa,
 * defasado em meio período e **para quando ele morre** (quem bate é ele).
 */
export const HAMMER = {
  damage: 25,          // o maior dano único do jogo (§7.1)
  periodMs: 6000,
  periodPhase2Ms: 4500,
  offsetMs: 3000,      // meio período: os dois nunca batem juntos (§7.3)
  telegraphMs: 900,
  activeMs: 180,
} as const;

/**
 * `ENT-006` O Comandante — `LVL-14` §5 (`P-66`). A FSM vive em `core/comandante.ts`; aqui
 * mora o número (`PAT-C-04`).
 *
 * **`mobile: false`** é o §6.5 e a razão de existir do setor: um chefe fixo que gira faz a
 * decisão de distância ser toda do jogador. Se este campo virar `true`, o eclipse perde a
 * função — a luz e a sombra só mudam o tamanho da arena porque ele não anda.
 *
 * **`grantsKey: false`** é o §8.3 e um desvio registrado no `LVL-14.md` §13 (desvio 8): a §5.6
 * manda `keys += 1` também aqui, mas a §8.2 mede `keys` em L14-06 como **2 ou 3** — a sobra é
 * a chave de LVL-12 (`ITM-011`). Se ele somasse, o portão mostraria `4 / 2` e a placa
 * "DUAS CHAVES. UMA SOBRA." deixaria de ser verdade. Ele entrega a lança e o posto, não a chave.
 */
export const COMANDANTE = {
  id: 'ENT-006',
  name: 'O COMANDANTE',
  hp: 320,                  // 60 acima de `ENT-005`; a diferença é margem, não resistência
  phase2At: 160,
  mobile: false,            // §6.5 — o único chefe que não muda de x
  cell: { tileX: 12, tileY: 6 },   // pivô na arena 24×11 (glifo `C`)
  /** `ATK-13` estocada: só na luz. 6 tiles a 640 px/s = 600 ms. */
  lunge: { tiles: 6, px: 384, speed: 640, damage: 26 },
  /** `ATK-14` lança arremessada: só na sombra. 7 tiles a 500 px/s = 900 ms de voo. */
  spear: { tiles: 7, px: 448, speed: 500, damage: 24 },
  body: { width: 128, height: 160 },   // hurtbox menor que o sprite (anti-hitbox)
  sprite: { width: 192, height: 192 }, // 3×3 tiles (`AST-018`, `P-66`)
  /** Fase 2 mantém tudo e só encurta a recuperação de `ATK-13` (§5.5, §6.4). */
  lungeWindupMs: 700,
  lungeMs: 600,
  lungeRecoverMs: 1000,
  lungeRecoverPhase2Ms: 850,
  spearWindupMs: 800,
  spearFlightMs: 900,       // 900 ms de voo: dá para ver chegando (§5.3)
  unarmedMs: 1200,          // a janela: ~3 golpes (§9)
  introMs: 400,             // VIS-007
  transitionMs: 1000,       // o hold mais longo do jogo (§5.5)
  deathHoldMs: 600,
  knockbackResistant: true,
  gate: 'arena',            // PAT-LD-07 — a saída só abre com 0 HP processado
  optional: false,
  grantsKey: false,         // §8.3 — ver o comentário acima
  /** As três falas (`VIS-007`): entrada, fase 2 e morte. Nenhuma é ameaça (§5.4). */
  lines: {
    intro: 'VOCÊ ESTÁ DE SERVIÇO. ASSUMA O POSTO.',
    phase2: 'EU NÃO PEDI O POSTO. NINGUÉM PEDE.',
    death: 'É SEU.',
  },
} as const;

/**
 * `ENT-007` O Guardião Duplo — `LVL-15` §5 (`P-68`). **Um chefe, dois corpos**: a regra vive
 * em `core/duo.ts`, aqui mora o número (`PAT-C-04`).
 *
 * Três coisas são a luta inteira e nenhuma delas é dano:
 *   - `hpPerBody` 180 × `bodies` 2 = **360**, e `MEC-009` só conta com **os dois** caídos;
 *   - `reviveMs` 4.000 e `revivePct` 50, **sem limite de tentativas** (§5.5): punição limitada
 *     ensina a esperar, ilimitada ensina a não matar um de cada vez;
 *   - `suspendMs` 800 é o **teto de perda de controle do jogo** (`P-70`) e exige **dois** selos.
 */
export const GUARDIAO = {
  id: 'ENT-007',
  name: 'O GUARDIÃO DUPLO',
  bodies: 2,
  hpPerBody: 180,          // 360 no total: 18 golpes de arma branca (§6.1)
  /** `ATK-16` lanterna: arco de 4 tiles, só no braço — não há linha no chão (§5.3). */
  lantern: { tiles: 4, px: 256, damage: 20 },
  /** `ATK-17` selo: projétil lento de 6 tiles a 400 px/s = 960 ms de voo. */
  seal: { tiles: 6, px: 384, speed: 400, damage: 12 },
  body: { width: 96, height: 112 },    // hurtbox menor que o sprite (anti-hitbox)
  sprite: { width: 128, height: 128 }, // 2×2 tiles cada (`AST-020`, `P-68`)
  /** Os dois se deslocam **devagar** e não perseguem: mantêm a distância do parceiro. */
  speedPxS: 90,
  minSeparation: 10,       // tiles entre os dois: o número que faz a luta existir (§6.5)
  bodyWindupMs: 700,
  lanternMs: 300,
  lanternRecoverMs: 1000,
  sealWindupMs: 600,
  sealFlightMs: 960,
  sealRecoverMs: 800,
  /** A janela de revivificação, a interrupção e a vida devolvida (§5.5). */
  reviveMs: 4000,
  revivePct: 50,
  interruptDamage: 30,
  /** `ATK-18`: o sobrevivente recua para 8+ tiles em vez de ficar mais agressivo. */
  retreatTiles: 8,
  /** Suspensão: **dois** selos, 800 ms, HUD contável (`P-70`). */
  suspendMs: 800,
  sealLifeMs: 6000,
  introMs: 400,
  deathHoldMs: 600,
  /** A trilha é a do **quarto seguro** — este combate é um expediente, não um clímax (§7.2). */
  bgm: 'BGM-03',
  gate: 'arena',
  optional: false,
  grantsKey: true,         // `keys += 1` por `MEC-009` (a terceira chave, `P-65`)
  /** As três falas, **em coro**: os dois dizem a mesma frase no mesmo instante (§5.4). */
  lines: {
    intro: 'PROTOCOLO DE ENTREGA. DOIS CARIMBOS.',
    revive: 'FALTA UM.',
    death: 'PROTOCOLO ENCERRADO.',
  },
  /** O quadro de aviso de L15-03 (`LOR-04`) — o texto mais importante do jogo (§4.3). */
  notice: [
    'TURNO DA NOITE: POSTO VAGO.',
    'TURNO DO DIA: POSTO VAGO.',
    'SUBSTITUTO: NINGUÉM DESIGNADO.',
    'O POSTO PERMANECE ABERTO ATÉ PREENCHIMENTO.',
    'ASSINATURA: —',
  ],
} as const;

/**
 * `LVL-15` §5.3 — **o teto de perda de controle do jogo** (`P-70`). Dois selos suspendem o
 * jogador; nada neste build pode segurá-lo por mais que isto. Se algum efeito futuro precisar
 * de mais, é decisão de design com `AGT-07`, não um número a ajustar aqui.
 */
export const SUSPEND = { maxMs: 800, sealsNeeded: 2 } as const;

/**
 * `AMB-15` — `LVL-15` §7.1: **silêncio absoluto**. Não é um arquivo de áudio: é a ausência
 * dele. Nenhum objeto do setor tem `SFX` ambiente (§7.3) — a cinza é muda, a porta lacrada é
 * muda, e a batida de coração que `06-audio` sugere está **descartada**.
 */
export const SILENCE = { amb: 'AMB-15', ambientSfx: 'none', heartbeat: false } as const;

/**
 * `CEN-100` o eclipse — `LVL-14` §7. **Não é ataque do chefe**: relógio próprio, e o chefe
 * reage a ele (§7.2). Cinco segundos de luz e três de sombra na fase 1; **o total não muda na
 * fase 2**, só a proporção (§7.3). Para na morte de `ENT-006` (§7.4).
 */
export const ECLIPSE = {
  id: 'CEN-100',
  cycleMs: 8000,        // o total é o mesmo nas duas fases
  lightPhase1Ms: 5000,
  shadowPhase1Ms: 3000,
  lightPhase2Ms: 3000,  // a fase 2 é a fase 1 invertida
  shadowPhase2Ms: 5000,
  /** A sombra escurece o **céu**, não a arena (`VIS-004`, `TST-014`). */
  skyAlpha: 0.42,
  floorAlpha: 0.1,      // piso: só a sombra do eclipse, nunca escuridão
  stopsOnBossDeath: true,
  /** Aviso em `aria-live` na fase 2 (§5.5). */
  announce: 'O ECLIPSE MUDOU — A ESCURIDÃO AGORA DURA MAIS QUE A LUZ.',
} as const;

/**
 * `DEC-016` — chave de chefe é **contador, não item** (§8.2). Quem incrementa é `MEC-009`
 * dos chefes com `grantsKey`. `ITM-011` conta e **não abre nada**: é a sobra da placa.
 */
export const KEYS = {
  required: 2,                        // L14-06 (`CEN-103`)
  /** Só os dois chefes obrigatórios dão chave; o Comandante não (§8.3). */
  grants: ['ITM-004', 'ITM-007', 'ITM-011'],
  label: 'DUAS CHAVES. UMA SOBRA.',
} as const;


/**
 * `ENT-008` O Plantonista — `LVL-16` §5 (`P-71`). **O último chefe não tem vida.**
 *
 * `damageable: false` é a fiação do setor: nenhum número abaixo é HP. O que existe é
 * **postura** (`poise: 100 / 125 / 150`) e **golpe de 25** — 4, 5 e 6 golpes por baixa,
 * **15** na luta inteira (§5.5, §6.1). A vitória é `MEC-011`: **três baixas assinadas**.
 *
 * `4.500 = 300 + 3.000 + 1.200`: cambaleio, canal no posto e folga. E o leash de **8 tiles**
 * (512 px, o alcance do gancho) é o número que faz a luta existir (§6.5).
 */
export const PLANTONISTA = {
  id: 'ENT-008',
  name: 'O PLANTONISTA',
  /** A regra inteira do chefe final em duas palavras (§5.1, `TST-018`). */
  damageable: false,
  kills: false,
  /** Postura por baixa — cada baixa assinada deixa o homem pior (§5.5). */
  poise: [100, 125, 150],
  golpePoise: 25,
  baixas: 3,
  /** `4.500` de atordoamento: `300` cambaleio + `3.000` canal + `1.200` folga (§5.5). */
  staggerMs: 4500,
  staggerSwayMs: 300,
  channelMs: 3000,
  staggerSlackMs: 1200,
  /** O cambaleio o tira de cima do posto: 2 tiles para leste (§5.5). */
  swayTiles: 2,
  /** `ATK-19` ronda: caminha 3 tiles a 110 px/s com a lanterna acesa; zona de 2 tiles. */
  speedPxS: 110,
  speedBoost2: 1.08,       // 119 px/s na 2ª baixa — ele acelera o que já fazia
  roundTiles: 3,
  lanternTiles: 2,
  lanternPx: 128,
  roundDamage: 18,
  roundWindupMs: 600,
  roundRecoverMs: 900,
  /** `ATK-20` apito: invoca `ENT-002` do piso, no máximo 2 vivas (§5.3). */
  apitoDamage: 0,
  apitoNearMs: 1500,
  apitoTiles: 3,
  apitoMaxAlive: 2,
  apitoWindupMs: 1200,
  apitoRecoverMs: 800,
  apitoSpawnX: 16,
  /** `ATK-21` protocolo: 3 golpes em 4.000 ms → janela de 1.400 ms que devolve 22. */
  protocolHits: 3,
  protocolWindowMs: 4000,
  protocolMs: 1400,
  protocolDamage: 22,
  protocolWindupMs: 400,
  protocolEarlyMs: 200,    // a 3ª baixa anuncia 200 ms antes
  /** Geometria: leash de 8 tiles a oeste do posto, sprite 128×192 (`AST-022`). */
  leashTiles: 8,
  leashX: 13,
  body: { width: 96, height: 176 },
  sprite: { width: 128, height: 192 },
  /** Estado: `posto` → `avanco` quando o jogador chega a 8 tiles; `apito` a 3. */
  aggroTiles: 8,
  introMs: 900,
  deathHoldMs: 600,
  /** Ele **não dá nada**: o Ato IV cobra, não dá. A recompensa é a porta (§5.7). */
  grantsKey: false,
  optional: false,
  bgm: 'BGM-02',
  gate: 'arena',
  /** As três falas — e nenhuma é ameaça (§5.4, §5.7). */
  lines: {
    intro: 'Posto ocupado. Aguarde.',
    rendido: 'Demorou.',
    // a terceira é do jogador, não dele: `MEC-012` §7.2
    throne: 'O assento é duro.',
  },
} as const;

/**
 * `CEN-113` o desgaste — `LVL-16` §5.6. `LOR-03c` **sem corpo**: o Caos aqui é o chão.
 * Dano **0 sempre**. A regra de segurança é `maxAdjacent: 2` — nunca três tiles contíguos,
 * porque 2 (128 px) cabem num salto andando (224 px) e 3 fechariam o caminho.
 */
export const DESGASTE = {
  id: 'CEN-113',
  crackMs: 1400,
  holeMs: 2000,
  holeMsHurt: 300,         // a rachadura é sonora: 1 estalo por tile
  maxHoles: 8,
  maxHolesFinal: 10,
  maxAdjacent: 2,
  holeDurationMs: 6000,    // na 3ª baixa, permanente
  permanentOnFinal: true,
  damage: 0,
  fallReturnMs: 300,       // `DEC-011`: volta à entrada da arena, cancela o canal
} as const;

/**
 * `AMB-16` — o zumbido da vaga (§8.3). **É o único som do jogo que desliga por ação do
 * jogador e não volta**: o prêmio por assumir o posto é o silêncio da vaga fechada.
 */
export const VAGA = {
  amb: 'AMB-16',
  duckUnderBgm: 0.8,       // −20% sob `BGM-02` (§8.3)
  creakMinMs: 12000,       // trono rangendo a cada 12–20 s, só **antes** de `MEC-012`
  creakMaxMs: 20000,
  stopsOnSeat: true,       // para **de uma vez**, sem fade (§8.3)
  bgmFinal: 'BGM-04',      // a trilha do Trono, 75 s, **sem loop** (§8.2)
  bgmFinalFromRoom: 4,     // índice 4 = L16-05: a trilha do Trono começa lá e vai até o fim
  bgmFinalLoop: false,
  bgmFadeOutMs: 6000,
  /** A tela final é um crachá, não um quadro (§7.4). */
  badge: ['POSTO: PREENCHIDO', 'Nº: 041', 'ASSINATURA: VOCÊ'],
  badgeMs: 3000,
} as const;

/** `CEN-090` esteira — anda sempre para a direita, sem fim, e **não move o jogador** (§4.3). */
export const CONVEYOR = { speedPxS: 40 } as const;

/**
 * `HAB-07` planar — `LVL-11` §7.1 (`P-56`). A regra vive em `core/glide.ts`; aqui mora o
 * número (`PAT-C-04`). **Sem ganho de altura, nunca** — se este bloco ganhar um `lift`,
 * todo vão do jogo passa a ser atravessável de baixo para cima (`P-59`).
 */
export const GLIDE = {
  fallSpeed: 120,        // px/s contra 1.100 px/s² de gravidade: o único freio do jogo
  airSpeed: 308,         // px/s — o estandarte troca queda por descida, não acelera
  /** Medido pelo solver, não estimado (§7.2 publica 1.042; a conta honesta dá 1.022). */
  rangePx: 1022,
  /** Tiles de vão que o planeio ainda atravessa (`rangePx / 64`). */
  rangeTiles: 15.97,
  /**
   * Teto de velocidade do corpo **enquanto o pano está aberto**. É `setMaxVelocity` e não
   * `setVelocity`: a gravidade é integrada em cada passo de física e um simples `setVelocity`
   * por frame deixa a queda escapar para ~143 px/s em ecrãs lentos — 20% menos alcance e o
   * vão de 13 tiles deixa de fechar. O teto do Arcade vale em todos os passos.
   */
} as const;

/** `CEN-086` flora que estala (`LVL-11` §3): só som, zero gameplay. */
export const AMBIENT = { flowerPeriodMs: 9000 } as const;

export const SAVE = { key: 'homem-macho/save/v1', debounceMs: 400 } as const;

/**
 * `ITM-001`/`ITM-002`/`ITM-003` — 03-conteudo-do-jogo §2.
 * O efeito é dado; a regra (teto, não reduz) vive em `core/items.ts`.
 */
export const ITEMS = {
  // `resumo`: uma linha para a mochila (`UI-07`). Vive aqui, ao lado do efeito, para a UI não
  // inventar texto — e para o item não ter nome no HUD e outro no painel.
  // `classe` é a classe de **perda na morte** (`core/loot.ts`): o dono quer percentagens diferentes
  // para armas simples, armas forjadas/de chefe, acumulativos e o que está preso.
  // `tipo`, `valor` e `raridade` (`DEC-040`) são o que a **ordenação** do painel usa — e só isso.
  // `valor` não é preço de loja (não há loja): é a grandeza que ordena o que o jogador tem, e o
  // número que a ficha mostra. Habilidades valem `0` de propósito: não se vendem nem se perdem.
  'ITM-001': { name: 'CURA', hp: 20, classe: 'acumulativo', tipo: 'consumivel', valor: 5, raridade: 0, resumo: 'Devolve 20 de vida, sem passar do teto.' },
  'ITM-002': { name: 'ESCUDO', shield: 10, classe: 'acumulativo', tipo: 'consumivel', valor: 8, raridade: 0, resumo: 'Devolve 10 de escudo. O escudo gasta antes da vida.' },
  'ITM-003': { name: 'SALTO DUPLO', permanent: true, kind: 'double-jump', classe: 'habilidade', tipo: 'habilidade', valor: 0, raridade: 2, resumo: 'Habilidade permanente: um segundo pulo no ar.' },
  'ITM-004': {
    name: 'EQUIPAMENTO DE TESTE', slot: true, classe: 'simples', tipo: 'arma', valor: 12, raridade: 0,
    resumo: 'Ocupa um espaço da mochila. Pode ser preso.',
    // `nota`: segunda linha do aviso ao apanhar. É texto do item e vive ao lado do nome — a cena
    // não inventa frases, e o dia em que houver mais drops não há uma linha comum a todos.
    nota: 'CABE NA BOLSA. O GUARDIÃO VAI SENTIR.',
  },  // 03-conteudo §3.3: drop, 1 slot
  'ITM-005': { name: 'FORÇA', permanent: true, kind: 'strength', classe: 'habilidade', tipo: 'habilidade', valor: 0, raridade: 2, resumo: 'Habilidade permanente: empurrar o que está caído.' },   // HAB-05, LVL-05 §5 (P-38)
  'ITM-006': { name: 'FÔLEGO', permanent: true, kind: 'breath', classe: 'habilidade', tipo: 'habilidade', valor: 0, raridade: 2, resumo: 'Habilidade permanente: vinte segundos debaixo da água.' },    // HAB-06, LVL-06 §5 (P-40)
  'ITM-007': {
    name: 'ESPÓLIO DO ALFERES', slot: true, classe: 'forjada', tipo: 'arma', valor: 40, raridade: 1,
    resumo: 'O que o chefe médio deixou cair. Ocupa um espaço.',
    nota: 'O ALFERES NÃO PRECISA MAIS DISTO.',
  },             // recompensa de chefe, LVL-08 (P-47)
  'ITM-008': { name: 'GANCHO', permanent: true, kind: 'hook', classe: 'habilidade', tipo: 'habilidade', valor: 0, raridade: 2, resumo: 'Habilidade permanente: puxar-se até às argolas de ferro.' },      // HAB-04, LVL-09 §6 (P-51)
  'ITM-009': { name: 'GARRA', permanent: true, kind: 'climb', classe: 'habilidade', tipo: 'habilidade', valor: 0, raridade: 2, resumo: 'Habilidade permanente: subir paredes de ganchos.' },      // HAB-03, LVL-10 §7 (P-53)
  'ITM-010': { name: 'ESTANDARTE', permanent: true, kind: 'glide', classe: 'habilidade', tipo: 'habilidade', valor: 0, raridade: 2, resumo: 'Habilidade permanente: planar e trocar altura por distância.' }, // HAB-07, LVL-11 §7 (P-56)
  'ITM-011': {
    name: 'PEÇA DO FORJADOR', slot: true, classe: 'forjada', tipo: 'arma', valor: 60, raridade: 2,
    resumo: 'Só existe se o Forjador cair. Ocupa um espaço.',
    nota: 'A PEÇA QUE ELE NUNCA ACABOU.',
  },               // recompensa condicional, LVL-12 (P-61)
} as const;

/**
 * A **perda na morte** (decisão do dono, `DEC-037`). Frações de 0 a 1, e a regra em `core/loot.ts`:
 *
 * - acumulativos (cura, escudo) → **30 % da quantidade**;
 * - armas simples → **100 %**;
 * - armas forjadas / conquistadas de chefe → **20 %**, com uma chance por unidade;
 * - presos ou equipados ao personagem → **0 %**;
 * - moedas vindas de mobs e chefes → **100 %**.
 *
 * O que está no **baú** não entra nesta conta: `perderNaMorte` não recebe o baú (ver `core/loot.ts`).
 */
export const PERDA = {
  acumulativo: 0.30,
  simples: 1.00,
  forjada: 0.20,
  presa: 0.00,
  moedas: 1.00,
} as const;

/**
 * `MEC-004` de moedas: o que os inimigos deixam. **Só mobs e chefes dão moeda** — é o que a regra
 * de perda diz ao apagar 100 % na morte, e o que impede uma moeda caída de uma parede.
 *
 * `P-22` respondida assim: a moeda passa a ter um risco (perde-se toda na morte) em vez de um
 * sumidouro. Quando a loja entrar, o preço dela é o que falta decidir.
 */
export const MOEDAS = {
  /**
   * `DEC-042`: com dez níveis por habilidade e +40 % por nível, os valores antigos (5 e 25) tornavam
   * a árvore decorativa — o nível 10 de uma só habilidade pedia 53 mobs *por upgrade*. A partida
   * inteira passa a deixar ≈ 8.800 moedas (96 salas × ~4 mobs × 20, mais 6 chefes × 200), o que paga
   * **uma** habilidade do 1 ao 10 (4.915 a 18.677) e nunca as seis.
   */
  porInimigo: 20,
  porChefe: 200,
} as const;

/**
 * `UI-07`/`MEC-004` — a mochila. **40 espaços, até 20 presos** (`02-gameplay` §2.10 e a tabela de
 * dificuldade: os três degraus usam os mesmos números, porque a mochila não é uma alavanca de
 * balanceamento). `colunas` não é regra de jogo: é o desenho da grelha do painel.
 *
 * `P-24` fica respondida por estes números: o pedido foi um MVP de 40 espaços com "prender", e é
 * isso que a mochila entrega — o que se reduz é o *conteúdo*, não o contrato.
 */
export const INVENTARIO = {
  slots: 40,
  presos: 20,
  colunas: 8,
  /**
   * `UI-07`: o baú das salas seguras tem os mesmos 40 espaços da mochila. Um número só para os
   * dois é de propósito: o jogador não tem de aprender duas capacidades, e o teste fixa que o
   * baú nunca é menor do que aquilo que a mochila consegue carregar.
   */
  bau: 40,
  /** Distância (px) a que o baú se abre — o dobro da zona do ponto de salvamento. */
  alcanceBau: 70,
  /** Quantas linhas a grelha desenha; `slots / colunas`. Existe para o teste não dividir à mão. */
  get linhas(): number { return this.slots / this.colunas; },
} as const;


/**
 * `UI-14` / `DEC-042` — **as melhorias das habilidades**: dez níveis cada, pagos em moedas.
 *
 * O nível `1` é a habilidade **como foi conquistada** (custo `0`, fator `1,00`). Do `1` ao `10` são
 * nove compras, e cada uma custa **+40 %** sobre a anterior (`CUSTO_UP`); o **preço de partida** é
 * diferente por habilidade porque a complexidade de uso e a ordem da progressão não são a mesma:
 * um segundo pulo é a primeira coisa que o jogo ensina, o estandarte é a última e a que muda o
 * alcance de um vão inteiro (`DEC-042`).
 *
 * | Habilidade | Base | O que o nível muda | Onde é lido |
 * |---|---|---|---|
 * | `double-jump` | **100** | o impulso do **segundo** salto | `Player` (salto aéreo) |
 * | `strength` | **140** | o **alcance do golpe** | `Player.attackRect` |
 * | `breath` | **180** | os **segundos** debaixo d'água | `core/breathe.maxBreath` |
 * | `hook` | **240** | o **alcance** do gancho | `GameScene.tryGrapple` |
 * | `climb` | **300** | a **velocidade** a subir a parede | `Player` (`CLIMB.upSpeed`) |
 * | `glide` | **380** | a **queda** com o pano aberto (menor = mais longe) | `Player` (`GLIDE.fallSpeed`) |
 *
 * **A aritmética, à vista** (é a parte que se pode discutir com números): do nível 1 ao 10, a
 * habilidade mais barata custa **4.915** moedas e a mais cara **18.677**. Uma partida inteira
 * (16 setores, ~96 salas) deixa cerca de **8.800** (`MOEDAS`: 20 por mob, 200 por chefe). Ou seja:
 * levar **uma** habilidade ao topo é um objetivo de campanha inteira; levar as seis, não acontece —
 * e é isso que impede o jogador de conquistar tudo depressa.
 */
export const NIVEIS_MAX = 10;
/** `DEC-042`: cada nível extra custa +40 % sobre o anterior. */
export const CUSTO_UP = 1.40;

/**
 * A base de cada habilidade e o quanto cada nível acrescenta ao efeito (`porNivel`, somado ao fator
 * do nível 1). O texto de cada nível é **gerado** do valor — não há 60 frases escritas à mão que
 * possam mentir sobre o número.
 */
export const MELHORIAS_BASE = {
  'double-jump': {
    custo: 100, porNivel: 0.055, grandeza: 'IMPULSO DO 2.º PULO',
    texto: (f: number): string => `O segundo pulo sobe ${Math.round((f - 1) * 100)} % mais.`,
  },
  strength: {
    custo: 140, porNivel: 0.05, grandeza: 'ALCANCE DO GOLPE',
    texto: (f: number): string => `O golpe chega ${Math.round((f - 1) * 100)} % mais longe.`,
  },
  breath: {
    custo: 180, porNivel: 0.09, grandeza: "SEGUNDOS DEBAIXO D'ÁGUA",
    texto: (f: number): string => `${Math.round(20 * f)} segundos debaixo da água.`,
  },
  hook: {
    custo: 240, porNivel: 0.06, grandeza: 'ALCANCE DO GANCHO',
    texto: (f: number): string => `${(6 * f).toFixed(1).replace('.', ',')} tiles de alcance.`,
  },
  climb: {
    custo: 300, porNivel: 0.07, grandeza: 'VELOCIDADE A SUBIR',
    texto: (f: number): string => `Sobe a parede ${Math.round((f - 1) * 100)} % mais depressa.`,
  },
  glide: {
    custo: 380, porNivel: 0.035, grandeza: 'QUEDA COM O PANO ABERTO',
    // no planeio o fator **desce** (menos queda = mais longe), por isso o texto fala de distância
    texto: (f: number): string => `Desce ${Math.round((1 - f) * 100)} % mais devagar: mais longe com a mesma altura.`,
  },
} as const;

/**
 * A tabela pronta: dez níveis por habilidade, preço `base × 1,4^(n−2)` e fator `1 + porNivel × (n−1)`.
 * Construída aqui (e não à mão) porque 60 linhas escritas à mão divergem à primeira correcção — e
 * porque o teste do `tuning` consegue então verificar a regra em vez de copiar a tabela.
 */
export const MELHORIAS = Object.fromEntries(
  (Object.keys(MELHORIAS_BASE) as (keyof typeof MELHORIAS_BASE)[]).map((hab) => {
    const base = MELHORIAS_BASE[hab];
    const niveis = Array.from({ length: NIVEIS_MAX }, (_, i) => {
      const nivel = i + 1;
      const fatorBruto = 1 + base.porNivel * i;
      // no planeio, o fator do nível 1 é a queda atual e os níveis **reduzem-na**
      const fator = hab === 'glide' ? 1 - base.porNivel * i : fatorBruto;
      return {
        custo: nivel === 1 ? 0 : Math.round(base.custo * Math.pow(CUSTO_UP, nivel - 2)),
        fator: Number(fator.toFixed(4)),
        texto: nivel === 1
          ? `Nível de conquista. ${base.grandeza.toLowerCase()} como o jogo a entrega.`
          : base.texto(hab === 'glide' ? 1 - base.porNivel * i : fator),
      };
    });
    return [hab, niveis];
  }),
) as unknown as Record<
  keyof typeof MELHORIAS_BASE, readonly { custo: number; fator: number; texto: string }[]
>;

/** Nome de cada habilidade na tabela de melhorias — o painel não inventa títulos. */
export const NOME_HABILIDADE = {
  'double-jump': 'SALTO DUPLO',
  strength: 'FORÇA',
  breath: 'FÔLEGO',
  hook: 'GANCHO',
  climb: 'GARRA',
  glide: 'ESTANDARTE',
} as const;

/** A ordem do painel: a ordem em que o jogo as entrega (LVL-02 → LVL-11). */
export const ORDEM_HABILIDADES = [
  'double-jump', 'strength', 'breath', 'hook', 'climb', 'glide',
] as const;

/**
 * `DEC-042` — **as habilidades raras caem de chefe**, com 8 % de chance e garantia ao 12.º chefe.
 *
 * São as três últimas do jogo (`HAB-04` gancho, `HAB-03` garra, `HAB-07` estandarte): as que abrem
 * geometria nova e, por isso, as que fazem sentido como recompensa de chefe. As primeiras três
 * (`ITM-003`, `ITM-005`, `ITM-006`) continuam **garantidas no item** — sem elas o jogo não tem
 * tutorial de salto, elevador nem água.
 *
 * A `garantia` não é decoração: `HAB-03` é exigida pelo poço de LVL-10 e `HAB-07` **dentro** de
 * `CEN-096` (LVL-13). Com 8 % puro, um jogador azarado bloqueava o próprio save (`core/drop.ts`).
 */
export const DROPS_RAROS = {
  chance: 0.08,
  garantia: 12,
  itens: {
    'ITM-008': 'hook',
    'ITM-009': 'climb',
    'ITM-010': 'glide',
  },
} as const;

/** PAT-C-10 — flags por milestone. `false` não pode deixar caminho acessível. */
export const FLAGS = {
  doubleJump: false,   // HAB-01 nasce em LVL-02; LVL-01 é config-agnóstico (DEC-008)
  run: true,
  shoot: true,
  proceduralChallenges: false, // MEC-010 — pós
  /*
   * **A campanha está aberta.** As treze flags `lvl04..lvl16` que existiam aqui eram o cadeado do
   * recorte do MVP: os setores estavam registados, testados e jogáveis por teleporte, mas fora da
   * progressão — chegava-se ao fim de LVL-03, aparecia «FIM DO RECORTE» e o jogo acabava.
   *
   * O recorte foi jogado até ao fim, e o dono pediu o resto. O cadeado saiu **por inteiro** (não
   * ficou em `true`): uma flag que ninguém volta a pôr em `false` não é configuração, é uma
   * promessa por cumprir disfarçada de interruptor — e a progressão passou a ser uma lista
   * literal em `levels/index.ts`. O que continua a ser flag é o que ainda não existe:
   * `proceduralChallenges` (`MEC-010`, pós) e `onlineSave` (`P-14`).
   */
  /** `PAT-C-10`: a progressão é a lista de `AREA_ORDER` — os 16 setores, por ordem. */
  onlineSave: false,           // P-14 — pendente
} as const;

export const DEFAULT_DIFFICULTY: Difficulty = 'medium';

/**
 * `UI-01`/`UI-02` — a porta de entrada (`04-interface` §4.1–§4.2).
 *
 * A tela inicial é **React**, não Phaser: os menus do GDD §4.4 são HTML acessível, e o canvas
 * só existe depois que o jogador decide entrar. `holdMs` é o tempo mínimo de `UI-01` para a
 * marca aparecer de forma legível — não é um atraso artificial de carregamento.
 */
export const BOOT = { barMs: 400, holdMs: 500 } as const;

/**
 * `UI-02` — o menu. **Nenhum texto de marca aqui**: o nome do jogo é do proprietário, e o
 * `LEIA-ME` já registra que o título é provisório. O menu usa só rótulos de função.
 */
export const MENU = {
  /** `UI-04`: o padrão do jogo (`DEFAULT_DIFFICULTY`), exposto ao menu num sítio só. */
  get dificuldadePadrao(): Difficulty {
    return DEFAULT_DIFFICULTY;
  },
  /** `UI-04`: a dificuldade é escolhida **antes** de jogar, e o padrão é o do `tuning`. */
  difficulties: ['easy', 'medium', 'hard'] as const,
  /** `UI-04`: o rótulo do degrau. O menu não escreve "easy"; mostra o degrau. */
  rotuloDificuldade: { easy: 'FÁCIL', medium: 'MÉDIO', hard: 'DIFÍCIL' } as Record<Difficulty, string>,
  /**
   * `MEC-007` revisto em `DEC-027`: **três slots**. `CONTINUAR` tem de mostrar *quais* saves
   * existem para o jogador escolher — com um slot só, o botão não tinha escolha nenhuma.
   */
  slots: SAVE_SLOTS,
  /**
   * `UI-10`/`UI-02`: os créditos de desenvolvimento. O nome é do proprietário e fica escrito
   * **aqui**, num sítio só, para o painel não inventar texto.
   */
  creditos: {
    nome: 'DAVID CREATOR',
    funcao: 'DESENVOLVIMENTO',
    linhas: [
      'Jogo, código e direção · DAVID CREATOR',
      'Motor: Phaser 3 · React 18 · TypeScript',
      'Mundo e regras: os 16 setores do GDD',
      'Arte de abertura: em produção (área reservada)',
    ],
  },
  /** `UI-01`: se o bundle não montar, a tela de erro tem de existir (`UI-11`). */
  bootErrorMessage: 'O JOGO NÃO CARREGOU.',
  bootErrorRetry: 'TENTAR DE NOVO',
} as const;

export const ROOM_BANNER_MS = 1400; // VIS-007 (hold 400 ms + nome)
