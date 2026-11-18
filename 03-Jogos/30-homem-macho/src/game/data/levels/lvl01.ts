/**
 * LVL-01 — Ruínas da Vigília. Fonte: docs/niveis/LVL-01.md §4.
 * As grades são copiadas caractere a caractere do documento; `LevelBuilder` as traduz
 * em colisão + objetos. O caminho para `.tmj` (Tiled) é o vertical slice (BKL-012);
 * aqui a grade é a fonte única e o `collision` sai dela — nunca de um número à mão.
 */

export type RoomObject =
  | 'spawn' | 'sentinel' | 'spikes' | 'save' | 'door' | 'plaque' | 'board'
  | 'crate' | 'candle' | 'sigil';

export interface Room {
  /** `L01-01` etc. */
  readonly id: string;
  readonly name: string;
  /** linha 0 = teto; 11 linhas; largura variável (20/30/40). */
  readonly grid: readonly string[];
  /** texto de placa/quadro, por coordenada `"x,y"` */
  readonly texts?: Record<string, readonly string[]>;
  /**
   * Pilares quebráveis (`CEN-021`). Ficam fora da grade porque nela são `#`:
   * a diferença entre parede e pilar é de comportamento, não de desenho.
   */
  readonly breakables?: ReadonlyArray<{ from: number; to: number; topRow: number; bottomRow: number }>;
  /**
   * Reinterpretação de glifo por sala. `V` é estandarte em LVL-03 (`CEN-020`) e
   * sumidouro de cinza em LVL-04 (`CEN-034`): o mesmo símbolo, dois objetos — o
   * significado é da sala, não do alfabeto. Ver `LVL-04.md` §3 vs. `LVL-03.md` §3.
   */
  readonly glyphs?: Readonly<Record<string,
    'sink' | 'sink-arrival' | 'banner' | 'block' | 'crystal' | 'breath-item'
    | 'arc' | 'stained' | 'sun' | 'banner' | 'chain' | 'sand' | 'grate'
    | 'hoist' | 'boss-reward'
    /** `LVL-09` `§3`: argola de ferro (`CEN-072`) — o único alvo de `HAB-04`. */
    | 'ring'
    /** `LVL-09`: glifos de cenário do canal — não desenham nada, dão nome à peça. */
    | 'rat' | 'sluice' | 'lamp' | 'brick-arch' | 'hook-item'
    /** `LVL-10`: parede de ganchos (`CEN-080`), sino (`CEN-077`), escada em caracol, tocha e janela alta. */
    | 'climb-wall' | 'bell' | 'spiral' | 'torch' | 'window'
    /** `LVL-10`: alçapão (`CEN-081`), poço (`CEN-082`) e corda do sino (`CEN-078`). */
    | 'hatch' | 'well' | 'rope' | 'climb-item'
    /**
     * `LVL-11` §3 — o alfabeto do jardim, e **nenhum destes glifos é novo no alfabeto**:
     * `f` era estandarte, `s` era escudo, `c` era vela, `o` era óleo e `w` era rato.
     * A sala decide o significado (`DEC-023`).
     */
    | 'flora' | 'statue' | 'vine' | 'flower' | 'glass' | 'banner-torn'
    /** `LVL-11` §4.5: `CEN-088` conduto da chaminé — a boca vem do glifo, o destino da ficha. */
    | 'duct'
    /** `LVL-11` §4.2: o estandarte rasgado (`ITM-010`, `HAB-07`). */
    | 'glide-item'
    /**
     * `LVL-12` §3 — o alfabeto da forja. De novo **nenhum glifo é novo**: `h` era corrente
     * (LVL-08), `e` era vazio, `j` era fragmento, `c` era vela/trepadeira, `F` era chefe.
     */
    | 'furnace' | 'conveyor' | 'anvil' | 'chain' | 'slag-chute' | 'forge-item'
    /** `LVL-13` §3: `a` corrente de ar, `b` fundo do abismo, `k` estaca, `e` marca de eco. */
    | 'updraft' | 'abyss' | 'stake' | 'echo'
    /** `LVL-13` §4: `CEN-099` a boca do poço e a queda longa, ambas de um sentido. */
    | 'well-mouth' | 'long-fall'
    /**
     * `LVL-14` §3 — o alfabeto da fortaleza, e de novo **nenhum glifo é novo**:
     * `w` era rato e vira **ameia** (`CEN-104`), `f` era estandarte e vira o **estandarte
     * negro** (`CEN-102`), `M` era monta-carga em minúscula e vira o **monta-carga de duas
     * paradas** (`CEN-101`), `y` é o eclipse no céu (`CEN-100`) e `K` a fechadura
     * (`CEN-103`). A sala decide o significado (`DEC-023`).
     */
    | 'merlon' | 'black-banner' | 'lift' | 'eclipse' | 'lock'
    /**
     * `LVL-15` §3 — o alfabeto da ante-sala, e de novo **nenhum glifo é novo**: `T` era árvore
     * morta e vira **porta lacrada** (`CEN-107`), `S` era spawn e vira **porta de serviço**
     * (`CEN-106`), `w` era rato e vira **parede de cinza-osso** (`CEN-108`), `c` era vela e
     * vira **cinza caindo** (`CEN-109`). A sala decide o significado (`DEC-023`).
     */
    | 'sealed-door' | 'service-door' | 'bone-wall' | 'ash-fall'
    /**
     * `LVL-16` §3 — o alfabeto do Trono, e **mais uma vez nenhum glifo é novo**: `K` era
     * fechadura e vira **posto de guarda** (`CEN-111`), `S` era spawn/porta de serviço e vira
     * **distribuidor de senha** (`CEN-112`), `C` era placa de pressão e vira **quadro de
     * crachás** (`CEN-116`), `T` era porta lacrada e vira **trono partido** (`CEN-114`), `V`
     * era estandarte e vira **varanda** (`CEN-115`), `c` era vela e vira **cadeira vazia**,
     * `v` era cinza e vira **luz de vinho** (`PAL-16`), `w` era rato e vira **pedra nua**.
     * A sala decide o significado (`DEC-023`).
     */
    | 'guard-post' | 'ticket-dispenser' | 'badge-wall' | 'throne-broken' | 'varanda'
    | 'empty-chair' | 'wine-light' | 'bare-stone'>>;
  /** `LVL-04.md` §5.2: `E` desta sala patrulha em formação (`patrol_sync`). */
  readonly ronda?: { readonly tiles: number };
  /**
   * `ENT-010` (`DEC-048`) — **que inimigo é cada letra desta sala**, e com que números.
   *
   * A regra `DEC-023` diz que o significado de um glifo é da sala; esta é a mesma regra aplicada a
   * inimigos. `E` é sempre a Sentinela; `T` e `V` **só** são inimigos onde a sala o declarar —
   * em LVL-15 `T` continua a ser porta lacrada e em LVL-16 `V` continua a ser a varanda, e nenhum
   * dos dois é um corpo que ataca. O valor é o nome da variante em `core/arquetipos.ts`
   * (`VARIANTES`), que carrega vida, dano e telegrafo.
   */
  readonly variantes?: Readonly<Partial<Record<'E' | 'T' | 'V', string>>>;
  /**
   * `LVL-06.md` §3: o volume de água é declarado **na ficha da sala**, não lido do glifo.
   * O `~` da grade é só legibilidade; a autoridade é este retângulo.
   */
  readonly water?: { from: number; to: number; topRow: number; bottomRow: number };
  /**
   * Passagem de mão única (`LVL-07` §5.1 trifório, `LVL-04` §6 sumidouro). O destino é
   * dado da sala, como a água: a cena não inventa coordenada. `mode: 'interact'` pede `E`
   * (sumidouro de cinza); `mode: 'touch'` dispara ao entrar na boca (trifório).
   */
  /**
   * `LVL-08` §3/§7: a areia é um **retângulo declarado na ficha da sala**, como a água de
   * LVL-06. O glifo `s` só deixa a grade legível.
   */
  readonly sand?: ReadonlyArray<{ from: number; to: number; topRow: number; bottomRow: number }>;
  /**
   * `LVL-10` §6 (`DEC-015`): alçapão no teto — passagem **vertical** de 2 tiles, em `y=0`.
   * `sealed` bloqueia com corpo sólido; `open` com `requires` só passa com a habilidade.
   */
  readonly hatch?: {
    readonly from: number;
    readonly to: number;
    readonly state: 'sealed' | 'open';
    readonly requires?: 'HAB-03' | 'HAB-07';
  };
  /**
   * `LVL-13` §4.4: **dois** alçapões na mesma sala, com destinos diferentes — um que volta
   * (`A` → L13-01) e um que segue (`B` → L13-05). A escolha é do jogador e o cenário não a
   * indica: quem sobe pela coluna errada descobre em 2,74 s.
   */
  readonly hatches?: ReadonlyArray<{
    readonly from: number;
    readonly to: number;
    readonly state: 'sealed' | 'open';
    readonly requires?: 'HAB-07';
    /** Índice da sala de destino; ausente = a sala seguinte (`DEC-015`). */
    readonly destRoom?: number;
  }>;
  /**
   * `CEN-096` corrente de ar (`LVL-13` §3): **retângulo declarado**, como a areia de LVL-08
   * e a água de LVL-06. O glifo `a` só deixa a grade legível; o motor lê daqui.
   */
  readonly updrafts?: ReadonlyArray<{
    readonly from: number;
    readonly to: number;
    readonly topRow: number;
    readonly bottomRow: number;
  }>;
  /**
   * `CEN-099` queda longa (`LVL-13` §8): transição de 3 s, **sem dano**, que salva antes e
   * depois. `interact` — o jogador precisa decidir cair.
   */
  readonly longFall?: {
    readonly to: number;
    readonly oneWay: boolean;
  };
  /** `CEN-095` marcas de eco (`LVL-13` §5): onde o abismo devolve o jogador. */
  readonly echoes?: ReadonlyArray<{ readonly tx: number; readonly ty: number }>;
  /**
   * `LVL-10` §7.1: paredes de ganchos (`CEN-080`). São **sólidas antes de agarráveis** —
   * a região existe para a garra saber onde pode aderir, não para abrir passagem.
   */
  readonly climbable?: ReadonlyArray<{ from: number; to: number; topRow: number; bottomRow: number }>;
  /** `LVL-08` §7.3: colunas das âncoras dormentes da arena (viram areia no relógio). */
  readonly anchors?: readonly number[];
  /** `LVL-08` §4: monta-carga (`CEN-066`) — destino e a trava `boss-defeated`. */
  readonly hoist?: {
    readonly area: string;
    readonly room: number;
    readonly at: { readonly tx: number; readonly ty: number };
    readonly lockedUntil?: 'boss-defeated';
  };
  /**
   * Chefe da sala: `'ENT-003'` (LVL-03) · `'ENT-004'` (LVL-08) · `'ENT-005'` (LVL-12) ·
   * `'ENT-006'` (LVL-14) · `'ENT-007'` (LVL-15) · `'ENT-008'` (LVL-16).
   * `'ENT-005'` é **opcional e sem grade**
   * (`LVL-12` §8): a saída existe sem matá-lo. `'ENT-007'` são **dois corpos, um chefe**
   * (`LVL-15` §5.1) e o glifo `O` aparece duas vezes.
   */
  readonly boss?: string;
  /**
   * `CEN-092` pilões (`LVL-12` §7): posição fixa, relógio próprio e defasagem de meio
   * período. Não são ataque do chefe — são a fábrica. Param quando ele morre.
   */
  readonly hammers?: ReadonlyArray<{ readonly tx: number; readonly ty: number }>;
  /**
   * `LVL-12` §4.6: `ITM-011` só existe se `ENT-005` morreu (`MEC-009`). O glifo `I` fica na
   * grade como legibilidade; a autoridade é este campo.
   */
  readonly bossReward?: { readonly itm: 'ITM-011'; readonly tx: number; readonly ty: number };
  /**
   * `CEN-100` eclipse (`LVL-14` §7): o relógio do céu corre nesta sala. É declarado na ficha —
   * não lido do glifo `y` — porque o tempo 1 do `PAT-LD-02` é **o setor inteiro**: o jogador
   * atravessa quatro salas sob o eclipse antes de ele significar qualquer coisa.
   */
  readonly eclipse?: boolean;
  /**
   * `LVL-15` §7.3: **nenhum objeto da sala tem `SFX` ambiente.** Cinza caindo e porta lacrada
   * são mudas; a batida de coração de `06-audio` está descartada porque o setor só tem o som
   * que o jogador faz. Não é um flag de gameplay: é uma proibição de conteúdo.
   */
  readonly silent?: boolean;
  /** `PAT-LD-05`: quarto seguro (`BGM-03`, sem inimigo, com `P`). `LVL-15` §4.3. */
  readonly safeRoom?: boolean;
  /**
   * `LVL-16` §5.5 — **`CEN-111` o posto de guarda**, o alvo de `MEC-011`. O glifo `K` só
   * deixa a grade legível; a coordenada vem da ficha (`PAT-C-04`). Enquanto `ENT-008`
   * estiver de pé este ponto é **inalcançável**: os dois são adjacentes de propósito (§3), e
   * é a luta inteira resumida numa linha de grade.
   */
  readonly posto?: { readonly tx: number; readonly ty: number };
  /**
   * `LVL-16` §5.6 — **`CEN-113` o desgaste é o piso da arena**, não um objeto da grade: o
   * Caos não tem corpo (`LOR-03c`). Racha em 1.400 ms, cede em 2.000 ms, **dano 0 sempre**,
   * e **nunca três tiles contíguos** (senão fecharia caminho). `DEC-018`.
   */
  readonly desgaste?: boolean;
  /** `LVL-16` §4.2 — `CEN-112` distribuidor de senha (`interact`, display `000`). */
  readonly dispenser?: {
    readonly tx: number; readonly ty: number; readonly display: string;
  };
  /** `LVL-16` §4.5 — `CEN-116`: 40 crachás em **41 pregos**, e o último está vazio. */
  readonly badgeWall?: {
    readonly tx: number; readonly ty: number; readonly badges: number; readonly hooks: number;
  };
  /**
   * `LVL-16` §7.2 — `MEC-012`: `interact` no trono (`CEN-114`), **uma tecla, sem estado de
   * falha**, processada **uma única vez** (`PAT-C-07`). Encerra o jogo.
   */
  readonly throne?: { readonly tx: number; readonly ty: number; readonly once: true };
  /** `LVL-16` §4.6 — `CEN-115`: a varanda de onde se vê LVL-01 e **não se pode descer**. */
  readonly varanda?: {
    readonly tx: number; readonly ty: number; readonly area: string;
  };
  /**
   * `CEN-103` fechadura de chaves (`LVL-14` §8, `DEC-016`): `required` é o número do portão
   * (2). As `tiles` são as fechaduras desenhadas lado a lado; `barrierTx` é a coluna que
   * fica sólida enquanto `keys < required`. `keys` é **contador, não item**.
   */
  readonly locks?: {
    readonly required: number;
    readonly tiles: ReadonlyArray<{ readonly tx: number; readonly ty: number }>;
    readonly barrierTx: number;
  };
  readonly sink?: {
    readonly area: string;
    readonly room: number;
    /** destino em **tiles** da grade (`tx`,`ty`), convertido com `TILE` na cena. */
    readonly at: { readonly tx: number; readonly ty: number };
    readonly mode: 'interact' | 'touch';
    /** `LVL-10` §5: o poço da Vigília só desce com a garra (`requires=HAB-03`). */
    readonly requires?: 'HAB-03';
    readonly text?: readonly string[];
  };
}

const L01_01: Room = {
  id: 'L01-01', name: 'Abertura silenciosa',
  grid: [
    '############################################################',
    '#..........................................................#',
    '#..........................................................#',
    '#...............................................G..........#',
    '#..........................................................+',
    '#..........................................................+',
    '#.S.........c.........N.......k.........k..................+',
    '############################################################',
    '############################################################',
    '############################################################',
    '############################################################',
  ],
  texts: { '22,6': ['TURNO 1', 'NÃO ABANDONE O POSTO'] },
};

const L01_02: Room = {
  id: 'L01-02', name: 'Ensina mover',
  grid: [
    '######################################################################',
    '#....................................................................#',
    '#....................................................................#',
    '#...............................................................N....#',
    '+...............................................................==...+',
    '+............................................................==......+',
    '+.........k.....k.........................................==.........+',
    '##############################.......#################################',
    '##############################......##################################',
    '######################################################################',
    '######################################################################',
  ],
  texts: { '64,3': ['TRILHA DE RONDA.', 'REPITA ATÉ NÃO ERRAR.'] },
};

const L01_03: Room = {
  id: 'L01-03', name: 'Ensina atacar',
  grid: [
    '#######################################################',
    '#.....................................................#',
    '#.....................................................#',
    '#............................................G........#',
    '+.....................................................+',
    '+..........E..........................................+',
    '+.........####................E.......................+',
    '#######################################################',
    '#######################################################',
    '#######################################################',
    '#######################################################',
  ],
  /** `DEC-048`: nesta sala `E` é a Sentinela do tutorial — 1 golpe branco mata (`TST-002`). */
  variantes: { E: 'L01-sentinela' },
};

const L01_04: Room = {
  id: 'L01-04', name: 'Ensina pular + combate',
  grid: [
    '##########################################################################################',
    '#........................................................................................#',
    '#........................................................................................#',
    '#........................V..........................................................G....#',
    '+...............................................................................==.......+',
    '+...........................................................................==...........+',
    '+.......#####......AA.........h.........E...........T.........T.........E................+',
    '##########################################################################################',
    '##########################################################################################',
    '##########################################################################################',
    '##########################################################################################',
  ],
  /**
   * `DEC-048` — **os três arquétipos na mesma sala**, que é o ponto do piloto: a Sentinela que
   * persegue, o atirador que fica longe e o voador que passa por cima do degrau.
   */
  variantes: { E: 'L01-sentinela', T: 'L01-atirador', V: 'L01-voador' },
};

const L01_05: Room = {
  id: 'L01-05', name: 'Quarto seguro',
  grid: [
    '########################################',
    '#......................................#',
    '#......................................#',
    '#............Q................G........#',
    '+......................................+',
    '+......................................+',
    '+.....c.....P.....k.......s............+',
    '########################################',
    '########################################',
    '########################################',
    '########################################',
  ],
  texts: {
    '13,3': [
      'AVISO',
      'O POSTO NÃO PODE FICAR VAZIO.',
      'TROCA DE TURNO ÀS 6 E ÀS 18.',
      'NÃO DEIXE A VELA APAGAR.',
    ],
  },
  /** `PAT-LD-04`: o quarto seguro não tem corpos — é onde se respira e se salva. */
  safeRoom: true,
};

const L01_06: Room = {
  id: 'L01-06', name: 'Saída',
  grid: [
    '##################################################',
    '#................................................#',
    '#................................................#',
    '#.............G..................................#',
    '+................................................D',
    '+................................................D',
    '+.........N.......k.....T.....c..................D',
    '##################################################',
    '##################################################',
    '##################################################',
    '##################################################',
  ],
  texts: { '6,6': ['SAÍDA DA ÁREA.', 'TODO TURNO TERMINA EM ALGUM LUGAR.'] },
  /** `DEC-048`: um atirador à saída — a última coisa que o setor ensina é recuar do tiro. */
  variantes: { T: 'L01-atirador' },
};

export const LVL01: readonly Room[] = [L01_01, L01_02, L01_03, L01_04, L01_05, L01_06];

export const LVL01_META = {
  id: 'LVL-01', name: 'Ruínas da Vigília', pal: 'PAL-01',
  bgm: 'BGM-01', amb: 'AMB-01', scope: 'mvp',
} as const;
