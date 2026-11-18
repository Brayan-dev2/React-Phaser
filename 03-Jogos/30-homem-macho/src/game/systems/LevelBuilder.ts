/**
 * Grade ASCII → mundo. A grade é a fonte única da colisão (07-padroes §7.13):
 * `#` vira corpo estático, `=` vira plataforma one-way, o resto vira objeto.
 * Corridas horizontais são fundidas para não criar centenas de corpos.
 */
import Phaser from 'phaser';
import { TILE } from '../data/tuning';
import type { Room } from '../data/levels/lvl01';
import type { ItemId } from '../../core/items';
import type { ArquetipoId } from '../../core/arquetipos';

export interface BuiltRoom {
  width: number;
  height: number;
  /** A grade original: quem precisa saber "o que é parede" lê daqui (nunca de um número). */
  roomGrid: readonly string[];
  worldWidth: number;
  worldHeight: number;
  solids: Phaser.Physics.Arcade.StaticGroup;
  platforms: Phaser.Physics.Arcade.StaticGroup;
  spawn: { x: number; y: number };
  /**
   * `ENT-010` — os inimigos comuns da sala, **com o arquétipo de cada um**. Antes era uma lista
   * de posições e todo corpo era uma Sentinela; a lista passou a dizer *quem* é, porque agora há
   * três comportamentos e a cena não os pode adivinhar pela posição.
   */
  sentinels: Array<{ x: number; y: number; sync: boolean; arquetipo: ArquetipoId; variante: string }>;
  spikes: Array<{ x: number; y: number }>;
  saves: Array<{ x: number; y: number }>;
  items: Array<{ id: ItemId; x: number; y: number }>;
  passwordDoors: Array<{ x: number; y: number }>;
  /**
   * `MEC-006` — **as zonas sólidas da porta de senha fechada**, para o `GameScene` as poder
   * levantar quando o jogador acerta nos quatro glifos.
   *
   * A porta de senha é o único glifo de saída que **não** é uma passagem: `+` e `D` querem dizer
   * "por aqui anda-se", e `Y` quer dizer "por aqui anda-se **depois**". Sem estas zonas, a porta
   * era só um desenho — o jogador atravessava-a, saía do mundo pelo lado leste e caía, e o
   * respawn devolvia-o ao início da sala: o «loop» que ele relatou em L02-07.
   */
  passwordLock: Phaser.GameObjects.Zone[];
  /** `ENT-003` (só a arena tem). */
  boss: { x: number; y: number } | null;
  /** `CEN-021` — cada pilar é um conjunto de zonas que pode ser destruído de uma vez. */
  pillars: Array<{
    id: number; centerX: number; sprite: Phaser.GameObjects.Image | null;
    zones: Phaser.GameObjects.Zone[];
  }>;
  pillarGroup: Phaser.Physics.Arcade.StaticGroup;
  /** Aberturas na linha do teto (`y=0`): passagem vertical (`DEC-015`). */
  ceilingHoles: Array<{ from: number; to: number }>;
  doors: Array<{ x: number; y: number }>;
  decor: Array<{ kind: string; x: number; y: number; tiles?: number }>;
  /** Desenhados atrás do plano de jogo (sem colisão): `CEN-030` árvore, `CEN-031` cinza. */
  decorBack: Array<{
    kind: 'tree' | 'ash' | 'gear' | 'crystal' | 'arc' | 'stained' | 'sun' | 'banner' | 'brick'
      | 'bell' | 'spiral' | 'window'
      /** `LVL-11` §3: `CEN-083` flora, `CEN-084` estátua sem rosto, vidro da estufa, estandarte. */
      | 'flora' | 'statue' | 'glass' | 'banner-torn'
      /** `LVL-12` §3: `CEN-089` forno, `CEN-090` esteira, `CEN-094` corrente. */
      | 'furnace' | 'conveyor'
      /** `LVL-13` §3: `CEN-097` fundo do abismo e `CEN-098` estaca de corda. */
      | 'abyss' | 'stake'
      /** `LVL-14` §3: `CEN-104` ameia e `CEN-102` estandarte negro (o de 2 tiles). */
      | 'merlon' | 'black-banner'
      /** `LVL-15` §3: `CEN-108` parede de cinza-osso — a única textura do setor. */
      | 'bone-wall'
      /** `LVL-16` §3: pedra nua, cadeira vazia (seis, nenhuma ocupada) e a varanda. */
      | 'bare-stone' | 'empty-chair' | 'varanda' | 'badge-wall';
    x: number; y: number; column?: number;
    /** altura da peça em tiles (arcos e vitrais nascem em grupo retangular). */
    tiles?: number;
    /** largura da peça em tiles (a rosácea de L07-05 tem 2). */
    width?: number;
  }>;
  /** `CEN-034` sumidouro de cinza — entrada do atalho, com `interact` (`LVL-04.md` §6). */
  sinks: Array<{ x: number; y: number; top?: number }>;
  /** Chegada do sumidouro: onde a cinza cai. Não é gatilho (`arrival_only`). */
  arrivals: Array<{ x: number; y: number; top?: number }>;
  /** `LVL-06` §3: volume de água declarado pela ficha da sala (em px). */
  water: { x: number; y: number; width: number; height: number } | null;
  /** `HAB-05` (`LVL-05` §5): blocos pesados, placa de contrapeso e elevador. */
  blocks: Array<{ x: number; y: number }>;
  plates: Array<{ x: number; y: number }>;
  elevators: Array<{ x: number; y: number }>;
  texts: Array<{ x: number; y: number; lines: readonly string[] }>;
  /** `LVL-08` §3: retângulos de areia da ficha (px) + âncoras dormentes (px). */
  sand: Array<{ x: number; y: number; width: number; height: number }>;
  anchors: Array<{ x: number; y: number }>;
  /** Monta-carga (`CEN-066`): destino e a trava. */
  hoists: Array<{ x: number; y: number; area: string; room: number; tx: number; ty: number; locked: boolean }>;
  /** `ENT-004`: a arena tem chefe médio — a cena instancia o Alferes, não o Guardião. */
  /** `LVL-13` §3: `CEN-096` correntes de ar — **região declarada**, não colisão. */
  updrafts: Array<{ x: number; y: number; width: number; height: number }>;
  /** `LVL-13` §4.4: alçapões com destino explícito (A volta, B segue). */
  hatches: Array<{
    x: number; y: number; width: number; sealed: boolean;
    requires?: string; destRoom?: number;
  }>;
  /** `LVL-13` §8: `CEN-099` a queda longa (3 s, sem dano). */
  longFall: { x: number; y: number; to: number } | null;
  /** `LVL-13` §7: pilões (`CEN-092`) — relógio próprio, defasagem de meio período. */
  hammers: Array<{ x: number; y: number }>;
  /** `LVL-12` §5: `ENT-005` O Forjador — chefe **opcional** e sem grade (§8). */
  forjador: { x: number; y: number } | null;
  /** `LVL-14` §5: `ENT-006` O Comandante — chefe **alto**, fixo e com `gate: 'arena'`. */
  comandante: { x: number; y: number } | null;
  /** `LVL-14` §8: o portão de duas fechaduras (`CEN-103`, `DEC-016`). */
  locks: Array<{ x: number; y: number; required: number; barrierTx: number }>;
  /**
   * `LVL-15` §5: `ENT-007` — **dois corpos, um chefe**. A ficha da sala declara `boss`; o
   * glifo `O` aparece duas vezes e o motor trata os dois como uma entidade só.
   */
  guardioes: Array<{ x: number; y: number }>;
  /** `LVL-15` §8: portas lacradas (`CEN-107`) — 3 tiles de altura, sem colisão e mudas. */
  sealedDoors: Array<{ x: number; y: number; tiles: number }>;
  /**
   * `LVL-16` §5: **`ENT-008` O Plantonista** — um corpo, **sem vida** (`damageable=false`),
   * com postura 100/125/150. A cena nunca o trata como `boss` com HP: `MEC-009` não existe
   * aqui (`TST-018`).
   */
  plantonista: { x: number; y: number } | null;
  /** `CEN-111` o posto de guarda — o alvo de `MEC-011` (`interact` segurado por 3.000 ms). */
  posto: { x: number; y: number } | null;
  /** `CEN-112` distribuidor de senha — `interact`, mostra `SENHA ATUAL: 000`. */
  dispenser: { x: number; y: number; display: string } | null;
  /** `CEN-116` quadro de crachás — 40 crachás em 41 pregos. */
  badgeWall: { x: number; y: number; badges: number; hooks: number } | null;
  /** `CEN-114` trono partido — `MEC-012`, uma tecla, uma vez (`PAT-C-07`). */
  throne: { x: number; y: number; once: boolean } | null;
  /** `CEN-115` varanda — `decor-back`, sem colisão: mostra LVL-01 e não deixa descer. */
  varanda: { x: number; y: number; area: string } | null;
  /** `CEN-113` o desgaste: nesta sala **o piso é o Caos** (§5.6, dano 0 sempre). */
  desgaste: boolean;
  /** `LVL-12` §4.3: a esteira é `decor-back` — anda, e **não** move o jogador. */
  conveyors: Array<{ x: number; y: number; width: number }>;
  alferes: { x: number; y: number } | null;
  /** `LVL-10` §6: alçapão (`CEN-081`) — `sealed` ganha corpo sólido, `open` é passagem. */
  hatch: { x: number; y: number; width: number; sealed: boolean; requires?: string } | null;
  /** `LVL-10` §7.1: paredes de ganchos (`CEN-080`), em px. */
  climbables: Array<{ x: number; y: number; width: number; height: number }>;
  /** `LVL-09` §3: argolas de ferro (`CEN-072`) — os únicos alvos de `HAB-04`. */
  rings: Array<{ x: number; y: number }>;
  /** `CEN-075` rato: decor animado, `wander_tiles`=2, nunca ataca. */
  rats: Array<{ x: number; y: number }>;
  /** Grades da arena (`CEN-065`): oeste fecha atrás, leste quebra ao vencer. */
  grates: Array<{ x: number; y: number; side: 'west' | 'east'; tiles?: number }>;
  eastOpen: boolean;
  westOpen: boolean;
}

/**
 * Retângulo de células `ch` a partir do canto superior esquerdo (`x`,`y`).
 * Arcos e vitrais são desenhados **uma vez por grupo**, não célula a célula: a rosácea
 * de L07-05 tem 2×5 tiles e é uma peça só (`LVL-07` §4.5).
 */
function grupoRetangular(
  grid: readonly string[], x: number, y: number, ch: string,
): { w: number; h: number } {
  let h = 0;
  while (y + h < grid.length && grid[y + h][x] === ch) h++;
  h = Math.max(h, 1);
  let w = 1;
  while (x + w < (grid[0]?.length ?? 0) && grid[y][x + w] === ch) w++;
  return { w, h };
}

/** `true` quando a célula é o canto superior esquerdo do grupo `ch`. */
function ehCanto(grid: readonly string[], x: number, y: number, ch: string): boolean {
  const acima = y > 0 ? grid[y - 1][x] : '.';
  const esquerda = x > 0 ? grid[y][x - 1] : '.';
  return acima !== ch && esquerda !== ch;
}

const SOLID = '#';
/** `LVL-10` §3: `H` é **sólido antes de agarrável** — colide igual a `#` e declara a região. */
const isSolid = (ch: string): boolean => ch === SOLID || ch === 'H';
const ONEWAY = '=';
const DECOR = new Set(['k', 'c', 'G', 'R', 'b']);   // `b` = banco de catedral (`LVL-07`)
// `LVL-08` §3: areia (`s`), âncora dormente (`,`) e monta-carga (`m`) — ver o switch

/**
 * Glifos de item: `h` = ITM-001 e `s` = ITM-002 (LVL-01 §3);
 * `F` = ITM-003 é o fragmento de LVL-02 §4 (`j` fica como alias do mesmo item).
 */
const ITEM_GLYPHS: Record<string, ItemId> = {
  h: 'ITM-001', s: 'ITM-002', j: 'ITM-003', F: 'ITM-003', I: 'ITM-004',
  X: 'ITM-005', R: 'ITM-006',   // `X` = Força (LVL-05); `R` = Fôlego (LVL-06, "respirar")
};

export function buildRoom(scene: Phaser.Scene, room: Room): BuiltRoom {
  const h = room.grid.length;
  const w = Math.max(...room.grid.map((r) => r.length));
  const worldWidth = w * TILE;
  const worldHeight = h * TILE;

  const solids = scene.physics.add.staticGroup();
  const platforms = scene.physics.add.staticGroup();

  const built: BuiltRoom = {
    width: w, height: h, worldWidth, worldHeight, solids, platforms, roomGrid: room.grid,
    spawn: { x: TILE * 1.5, y: TILE * 6.5 },
    sentinels: [], spikes: [], saves: [], items: [], passwordDoors: [], passwordLock: [], ceilingHoles: [],
    boss: null, pillars: [], pillarGroup: scene.physics.add.staticGroup(),
    doors: [], decor: [], decorBack: [], sinks: [], arrivals: [], texts: [],
    blocks: [], plates: [], elevators: [], water: null,
    sand: [], anchors: [], hoists: [], alferes: null, grates: [], rings: [], rats: [],
    hammers: [], forjador: null, comandante: null, locks: [], guardioes: [], sealedDoors: [],
    plantonista: null, posto: null, dispenser: null, badgeWall: null, throne: null,
    varanda: null, desgaste: room.desgaste === true,
    conveyors: [], updrafts: [], hatches: [], longFall: null,
    hatch: null, climbables: [],
    eastOpen: false, westOpen: false,
  };

  // --- pilares quebráveis: células próprias, fora dos sólidos ---
  const noPilar = (x: number, y: number): boolean =>
    (room.breakables ?? []).some((b) => x >= b.from && x <= b.to && y >= b.topRow && y <= b.bottomRow);

  for (const [id, b] of (room.breakables ?? []).entries()) {
    const zones: Phaser.GameObjects.Zone[] = [];
    for (let y = b.topRow; y <= b.bottomRow; y++) {
      for (let x = b.from; x <= b.to; x++) {
        const zone = scene.add.zone(x * TILE + TILE / 2, y * TILE + TILE / 2, TILE, TILE);
        built.pillarGroup.add(zone);
        zones.push(zone);
      }
    }
    built.pillars.push({
      id, centerX: ((b.from + b.to + 1) / 2) * TILE, sprite: null, zones,
    });
  }

  // --- colisão: corridas horizontais fundidas, por linha ---
  for (let y = 0; y < h; y++) {
    let runStart = -1;
    for (let x = 0; x <= w; x++) {
      const ch = x < w && !noPilar(x, y) ? room.grid[y][x] : '.';
      if (isSolid(ch) && runStart < 0) runStart = x;
      if (!isSolid(ch) && runStart >= 0) {
        // Zone + corpo estático: a colisão é invisível e nasce da grade, nunca de um número à mão.
        const zone = scene.add.zone(
          (runStart * TILE) + ((x - runStart) * TILE) / 2,
          y * TILE + TILE / 2,
          (x - runStart) * TILE, TILE,
        );
        solids.add(zone);
        runStart = -1;
      }
    }
  }

  // --- areia (`LVL-08` §3/§7): retângulo declarado na ficha, como a água de LVL-06 ---
  for (const r of (room.sand ?? [])) {
    built.sand.push({
      x: r.from * TILE, y: r.topRow * TILE,
      width: (r.to - r.from + 1) * TILE, height: (r.bottomRow - r.topRow + 1) * TILE,
    });
  }
  for (const c of (room.anchors ?? [])) {
    built.anchors.push({ x: c * TILE + TILE / 2, y: 7 * TILE });
  }

  // --- `LVL-10` §6: alçapão no teto (`DEC-015`) e paredes de ganchos (`CEN-080`) ---
  if (room.hatch) {
    const { from, to, state, requires } = room.hatch;
    built.hatch = {
      x: from * TILE, y: 0,
      width: (to - from + 1) * TILE,
      sealed: state === 'sealed',
      requires,
    };
    if (state === 'sealed') {
      // lacrado = sólido: o buraco existe no desenho e não existe na física
      const zone = scene.add.zone(built.hatch.x + built.hatch.width / 2, TILE / 2, built.hatch.width, TILE);
      solids.add(zone);
    }
  }
  for (const h of (room.hatches ?? [])) {
    // `LVL-13` §4.4: dois alçapões na mesma sala. `destRoom` explícito porque um deles
    // **volta** — a regra de `DEC-015` (sala seguinte) não cobre o atalho.
    built.hatches.push({
      x: h.from * TILE, y: 0, width: (h.to - h.from + 1) * TILE,
      sealed: h.state === 'sealed', requires: h.requires, destRoom: h.destRoom,
    });
    if (h.state === 'sealed') {
      const zone = scene.add.zone(h.from * TILE + ((h.to - h.from + 1) * TILE) / 2, TILE / 2,
        (h.to - h.from + 1) * TILE, TILE);
      solids.add(zone);
    }
  }
  if (room.hatches?.length && !built.hatch) built.hatch = built.hatches[0];
  for (const c of (room.climbable ?? [])) {
    built.climbables.push({
      x: c.from * TILE, y: c.topRow * TILE,
      width: (c.to - c.from + 1) * TILE,
      height: (c.bottomRow - c.topRow + 1) * TILE,
    });
  }

  // --- `LVL-13` §3: correntes de ar (`CEN-096`) — retângulo declarado, como a areia ---
  for (const a of (room.updrafts ?? [])) {
    built.updrafts.push({
      x: a.from * TILE, y: a.topRow * TILE,
      width: (a.to - a.from + 1) * TILE,
      height: (a.bottomRow - a.topRow + 1) * TILE,
    });
  }

  // --- volume de água (`LVL-06` §3): vem da ficha da sala, não do desenho da grade ---
  if (room.water) {
    const { from, to, topRow, bottomRow } = room.water;
    built.water = {
      x: from * TILE,
      y: topRow * TILE,
      width: (to - from + 1) * TILE,
      height: (bottomRow - topRow + 1) * TILE,
    };
  }

  // --- objetos e decoração ---
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = room.grid[y][x];
      const cx = x * TILE + TILE / 2;
      const bottom = (y + 1) * TILE; // âncora = célula inferior (LVL-01 §3)
      switch (ch) {
        case ONEWAY: {
          const plat = scene.add.zone(cx, y * TILE + TILE / 2, TILE, TILE * 0.5);
          platforms.add(plat);
          break;
        }
        case 'S':
          // `S` é spawn em LVL-01/02/03 e **sol vermelho** em LVL-08 (`DEC-023`).
          // O sol ocupa um bloco 3×3 na grade e é desenhado **uma vez** por grupo.
          if (room.glyphs?.S === 'sun') {
            if (ehCanto(room.grid, x, y, 'S')) {
              const g = grupoRetangular(room.grid, x, y, 'S');
              built.decorBack.push({
                kind: 'sun', x: cx + ((g.w - 1) * TILE) / 2, y: (y + g.h) * TILE,
                column: x, tiles: g.h, width: g.w,
              });
            }
          }
          // `LVL-15` §4.6: **porta de serviço** (`CEN-106`) — a única que abre num corredor
          // de seis lacradas, e ela dá para trás (`interact`, dois sentidos, não salva)
          // `LVL-16` §4.2: **distribuidor de senha** (`CEN-112`) — a senha nunca foi
          // retirada, e `000` não é bug de display: é o número de quem se ofereceu
          else if (room.glyphs?.S === 'ticket-dispenser') {
            built.dispenser = {
              x: cx, y: bottom, display: room.dispenser?.display ?? '000',
            };
          }
          else if (room.glyphs?.S === 'service-door') {
            built.decor.push({ kind: 'service-door', x: cx, y: bottom });
            if (room.sink) built.sinks.push({ x: cx, y: bottom });
          }
          else built.spawn = { x: cx, y: bottom - 4 };
          break;
        case 'L':
          // `ENT-004` O Alferes da Ronda (`LVL-08` §5)
          if (room.boss === 'ENT-004') built.alferes = { x: cx, y: bottom };
          break;
        case ',': break;   // âncora: a autoridade é a ficha (`anchors`), como a areia
        case 'G':
          // `G` é grade da arena (`CEN-065`), escada em caracol (LVL-10) ou caixote (`DECOR`)
          if (room.glyphs?.G === 'spiral') {
            // `CEN-079` escada em caracol **quebrada**: uma peça por coluna, cortada no topo
            if (ehCanto(room.grid, x, y, 'G')) {
              const g = grupoRetangular(room.grid, x, y, 'G');
              built.decorBack.push({
                kind: 'spiral', x: cx, y: (y + g.h) * TILE, column: x, tiles: g.h,
              });
            }
          } else if (room.glyphs?.G === 'grate') {
            if (y === 0 || room.grid[y - 1][x] !== 'G') {
              const g = grupoRetangular(room.grid, x, y, 'G');
              built.grates.push({
                x: cx, y: (y + g.h) * TILE, side: x < w / 2 ? 'west' : 'east', tiles: g.h,
              });
            }
          } else built.decor.push({ kind: ch, x: cx, y: bottom });
          break;
        case 'M':
        case 'm': {
          // monta-carga (`CEN-066`): destino e trava vêm da ficha da sala
          const h = room.hoist;
          if (h) {
            built.hoists.push({
              x: cx, y: bottom, area: h.area, room: h.room,
              tx: h.at.tx, ty: h.at.ty, locked: h.lockedUntil === 'boss-defeated',
            });
          }
          break;
        }
        case 'f':
          // `f` é estandarte da Vigília em LVL-03 e **flora magenta** em LVL-11 (`DEC-023`).
          // `CEN-083` é o único movimento vivo do setor (`wind=low`): sem ele o `AMB-11`
          // (flora estalando) não tem fonte visível.
          if (room.glyphs?.f === 'flora') built.decorBack.push({ kind: 'flora', x: cx, y: bottom });
          // `LVL-14` §3: **estandarte negro** (`CEN-102`) — o de L14-03 tem 2 tiles e é o
          // maior do jogo. A peça é do grupo, não da célula: `ff` desenha uma vez só.
          else if (room.glyphs?.f === 'black-banner') {
            if (ehCanto(room.grid, x, y, 'f')) {
              const g = grupoRetangular(room.grid, x, y, 'f');
              built.decorBack.push({
                kind: 'black-banner', x: cx + ((g.w - 1) * TILE) / 2, y: bottom, width: g.w,
              });
            }
          } else built.decorBack.push({ kind: 'banner', x: cx, y: bottom });
          break;
        case 'b':
          // `b` é banco de igreja (LVL-03/07) e **fundo do abismo** em LVL-13 (`CEN-097`)
          if (room.glyphs?.b === 'abyss') built.decorBack.push({ kind: 'abyss', x: cx, y: bottom });
          else built.decor.push({ kind: ch, x: cx, y: bottom });
          break;
        case 'k':
          // `k` é caixote e **estaca de corda** em LVL-13 (`CEN-098`, §4.2)
          if (room.glyphs?.k === 'stake') built.decorBack.push({ kind: 'stake', x: cx, y: bottom });
          else built.decor.push({ kind: ch, x: cx, y: bottom });
          break;
        case 'h':
          // `h` é `ITM-001` (cura) no alfabeto de itens, **corrente** em LVL-08 e **forno**
          // em LVL-12 (`CEN-089`) — a sala decide (`DEC-023`)
          if (room.glyphs?.h === 'chain') built.decor.push({ kind: 'chain', x: cx, y: bottom });
          else if (room.glyphs?.h === 'furnace') {
            built.decorBack.push({ kind: 'furnace', x: cx, y: bottom });
          } else built.items.push({ id: ITEM_GLYPHS.h, x: cx, y: bottom });
          break;
        case 's':
          // `s` é `ITM-002` (escudo) no alfabeto de itens e areia em LVL-08 (`DEC-023`).
          // A areia **não** vira objeto: quem desenha é o retângulo da ficha (`Room.sand`).
          if (room.glyphs?.s === 'statue') {
            // `CEN-084` 1×2: uma peça por grupo, ancorada no fundo — a trepadeira comeu a cara
            if (ehCanto(room.grid, x, y, 's')) {
              const g = grupoRetangular(room.grid, x, y, 's');
              built.decorBack.push({
                kind: 'statue', x: cx, y: (y + g.h) * TILE, column: x, tiles: g.h,
              });
            }
          } else if (room.glyphs?.s !== 'sand') {
            built.items.push({ id: ITEM_GLYPHS.s, x: cx, y: bottom });
          }
          break;
        case 'I':
          // `I` é `ITM-004` (bolsa) e `ITM-007` neste setor (`DEC-023`, `P-47`)
          if (room.glyphs?.I === 'boss-reward') built.items.push({ id: 'ITM-007', x: cx, y: bottom });
          // `LVL-12` §5.6: `ITM-011` **só existe** se `ENT-005` cair — quem cria é a cena,
          // a partir de `Room.bossReward` (`MEC-009`, desvio 6). Aqui não nasce nada.
          else if (room.glyphs?.I === 'forge-item') { /* a cena decide */ }
          else built.items.push({ id: ITEM_GLYPHS.I, x: cx, y: bottom });
          break;
        case '!':
          // `LVL-12` §7: `CEN-092` pilão. A posição vem da grade; o relógio, de `HAMMER`.
          built.hammers.push({ x: cx, y: bottom });
          break;
        case 'E':
          built.sentinels.push({
            x: cx, y: bottom, sync: room.ronda !== undefined,
            arquetipo: 'sentinela', variante: room.variantes?.E ?? 'L01-sentinela',
          });
          break;
        case 'A': built.spikes.push({ x: cx, y: bottom }); break;
        case 'P': built.saves.push({ x: cx, y: bottom }); break;
        case 'X':
          // `X` é Força (LVL-05), Fôlego (06), Gancho (09) e Garra (10) — a sala decide
          built.items.push({
            id: room.glyphs?.X === 'breath-item' ? 'ITM-006'
              : room.glyphs?.X === 'hook-item' ? 'ITM-008'
                : room.glyphs?.X === 'climb-item' ? 'ITM-009'
                  : room.glyphs?.X === 'glide-item' ? 'ITM-010' : 'ITM-005',
            x: cx, y: bottom,
          });
          break;
        case 'F':
          // `LVL-12` §4.5: `F` é o chefe da sala. `ENT-005` é **opcional** e não tranca
          // nada — o campo `Room.boss` é quem diz quem é, como em LVL-03/LVL-08.
          if (room.boss === 'ENT-005') built.forjador = { x: cx, y: bottom };
          else built.items.push({ id: ITEM_GLYPHS.F, x: cx, y: bottom });
          break;
        case 'j':
          // `j` é fragmento de salto duplo no alfabeto de itens e **forja/bigorna** em
          // LVL-12 (`CEN-091`, `glyphs.j = 'anvil'`) — a sala decide (`DEC-023`).
          if (room.glyphs?.j === 'anvil') built.decor.push({ kind: 'anvil', x: cx, y: bottom });
          else built.items.push({ id: ITEM_GLYPHS.j, x: cx, y: bottom });
          break;
        case 'B':
          // `B` é chefe (LVL-03), bloco pesado (LVL-05) ou sino sem badalo (LVL-10) (`DEC-023`)
          if (room.glyphs?.B === 'bell') {
            // o sino é 3×3 e é **uma** peça: o grupo inteiro desenha uma vez
            if (ehCanto(room.grid, x, y, 'B')) {
              const g = grupoRetangular(room.grid, x, y, 'B');
              built.decorBack.push({
                kind: 'bell', x: cx + ((g.w - 1) * TILE) / 2, y: (y + g.h) * TILE,
                column: x, tiles: g.h, width: g.w,
              });
            }
          } else if (room.glyphs?.B === 'block') built.blocks.push({ x: cx, y: bottom });
          else built.boss = { x: cx, y: bottom };
          break;
        case 'Y': {
          // `MEC-006`: a porta de senha **fecha** enquanto não se acerta nos glifos. O corpo é
          // sólido como o alçapão lacrado (`DEC-015`) — a grade de colisão nasce do glifo, não de
          // um número à mão. `GameScene` remove-o quando a senha cede.
          built.passwordDoors.push({ x: cx, y: bottom });
          const zona = scene.add.zone(cx, y * TILE + TILE / 2, TILE, TILE);
          solids.add(zona);
          built.passwordLock.push(zona);
          break;
        }
        case 'D': built.doors.push({ x: cx, y: bottom }); break;
        case 'T':
          /*
           * `LVL-01` (`DEC-048`): onde a sala declara `variantes.T`, a letra é o **atirador**
           * (`ENT-010`) e não árvore nem porta. Onde não declara, nada mudou — e é essa metade
           * que importa: em LVL-15 `T` continua a ser porta lacrada e em LVL-07 a boca do trifório.
           * A regra é a de `DEC-023` aplicada a corpos: o significado do glifo é da sala.
           */
          if (room.variantes?.T) {
            built.sentinels.push({
              x: cx, y: bottom, sync: false, arquetipo: 'atirador', variante: room.variantes.T,
            });
            break;
          }
          // `T` é árvore morta em LVL-04/06 e boca do trifório em LVL-07 (`DEC-023`)
          // `LVL-15` §3: `T` é **porta lacrada** (`CEN-107`) — 3 tiles de altura, **sem
          // colisão** (o jogador atravessa a pedra do lado dela) e **muda** (§7.3). Existe
          // para o corredor parecer um corredor de portas e para contar quantas não abrem.
          if (room.glyphs?.T === 'sealed-door') {
            if (ehCanto(room.grid, x, y, 'T')) {
              const g = grupoRetangular(room.grid, x, y, 'T');
              built.sealedDoors.push({ x: cx, y: bottom, tiles: g.h });
            }
          }
          // `LVL-16` §4.6: **trono partido** (`CEN-114`) — `interact`, `MEC-012`, uma vez
          else if (room.glyphs?.T === 'throne-broken') {
            built.throne = { x: cx, y: bottom, once: room.throne?.once ?? true };
            built.decor.push({ kind: 'throne-broken', x: cx, y: bottom });
          }
          else if (room.glyphs?.T === 'sink') built.sinks.push({ x: cx, y: bottom });
          else if (room.glyphs?.T === 'sink-arrival') built.arrivals.push({ x: cx, y: bottom });
          else built.decorBack.push({ kind: 'tree', x: cx, y: bottom });
          break;
        case 't':
          // `t` é escora da mina (LVL-06) e tocha da Vigília (LVL-10): a sala decide
          if (room.glyphs?.t === 'torch') built.decor.push({ kind: 'torch', x: cx, y: bottom });
          else built.decorBack.push({ kind: 'tree', x: cx, y: bottom });
          break;
        case 'V':
          // `LVL-01` (`DEC-048`): a sala pode declarar `V` como **voador** (`ENT-011`). Então o
          // glifo é inimigo e não decoração — e é por isso que `Room.variantes` existe: a mesma
          // letra continua a ser estandarte, sumidouro, cristal ou varanda onde a sala o diz.
          if (room.variantes?.V) {
            built.sentinels.push({
              x: cx * 1, y: bottom - TILE * 3, sync: false, arquetipo: 'voador', variante: room.variantes.V,
            });
            break;
          }
          // `V` é estandarte (LVL-03), sumidouro (LVL-04) ou cristal (LVL-06): a sala decide
          if (room.glyphs?.V === 'crystal') built.decorBack.push({ kind: 'crystal', x: cx, y: bottom });
          // `LVL-16` §4.6: **a varanda** (`CEN-115`) — `decor-back`, sem colisão. O jogador
          // vê o setor 01 lá embaixo e **não pode descer**: ver de onde se veio ≠ voltar.
          else if (room.glyphs?.V === 'varanda') {
            built.varanda = { x: cx, y: bottom, area: room.varanda?.area ?? 'LVL-01' };
            built.decorBack.push({ kind: 'varanda', x: cx, y: bottom });
          }
          else if (room.glyphs?.V === 'sink') built.sinks.push({ x: cx, y: bottom });
          // `LVL-13` §8: `CEN-099` queda longa — 3 s, sem dano, `interact`
          else if (room.glyphs?.V === 'long-fall') {
            built.longFall = { x: cx, y: bottom, to: room.longFall?.to ?? 0 };
            built.decor.push({ kind: 'well-mouth', x: cx, y: bottom });
          }
          else if (room.glyphs?.V === 'sink-arrival') built.arrivals.push({ x: cx, y: bottom });
          // `LVL-11` §4.5: `CEN-088` conduto — a boca vem do glifo, o destino da ficha
          // (`Room.sink`, `mode: 'interact'`, `save: false`). Como o poço de `CEN-082`.
          // `LVL-12` §4.6: `CEN-093` calha de escória — boca no glifo, destino na ficha.
          // Na chegada (L12-01) não há `Room.sink`: é só a boca de onde a escória cai.
          else if (room.glyphs?.V === 'slag-chute') {
            built.decor.push({ kind: 'slag-chute', x: cx, y: bottom });
            if (room.sink) built.sinks.push({ x: cx, y: bottom });
            else built.arrivals.push({ x: cx, y: bottom });
          } else if (room.glyphs?.V === 'duct') {
            built.decor.push({ kind: 'duct', x: cx, y: bottom });
            built.sinks.push({ x: cx, y: bottom });
          } else built.decor.push({ kind: ch, x: cx, y: bottom });
          break;
        case 'W':
          // `W` é engrenagem (LVL-05/06) ou o poço da Vigília (LVL-10): a sala decide.
          // A boca vem do glifo; o **destino** vem da ficha (`Room.sink`, `CEN-082`).
          if (room.glyphs?.W === 'well') {
            built.decor.push({ kind: 'well', x: cx, y: bottom });
            built.sinks.push({ x: cx, y: bottom });
          } else built.decorBack.push({ kind: 'gear', x: cx, y: bottom });
          break;
        case 'R':
          // `R` é item de Fôlego no alfabeto de itens; em LVL-07 é o arco de costela.
          // Uma peça por coluna, ancorada no topo do grupo: o arco `overflow_top` é
          // desenhado cortado pelo teto (`LVL-07` §5, técnica 2).
          if (room.glyphs?.R === 'arc') {
            if (ehCanto(room.grid, x, y, 'R')) {
              const g = grupoRetangular(room.grid, x, y, 'R');
              built.decorBack.push({
                kind: 'arc', x: cx, y: (y + g.h) * TILE, column: x, tiles: g.h,
              });
            }
          } else built.items.push({ id: ITEM_GLYPHS.R, x: cx, y: bottom });
          break;
        case 'o':
          // `o` é óleo no chão (LVL-05, `CEN-041`) e argola de ferro (LVL-09, `CEN-072`)
          if (room.glyphs?.o === 'ring') built.rings.push({ x: cx, y: y * TILE + TILE / 2 });
          // `CEN-086` flor que estala: só som, zero gameplay (período de 9 s, §4.2)
          else if (room.glyphs?.o === 'flower') built.decor.push({ kind: 'flower', x: cx, y: bottom });
          // `LVL-13` §4.1: `CEN-099` a boca do poço é **chegada** do atalho, não gatilho
          else if (room.glyphs?.o === 'well-mouth') {
            built.decor.push({ kind: 'well-mouth', x: cx, y: bottom });
            built.arrivals.push({ x: cx, y: bottom });
          }
          else built.decor.push({ kind: 'oil', x: cx, y: bottom });
          break;
        case 'a':
          // `LVL-13` §3: o glifo da corrente é só legibilidade — a autoridade é a ficha
          if (!room.updrafts?.length) built.arrivals.push({ x: cx, y: bottom });
          break;
        case 'e':
          // `LVL-13` §5: `CEN-095` marca de eco — onde o abismo devolve o jogador
          if (room.glyphs?.e === 'echo') { built.decor.push({ kind: 'echo', x: cx, y: bottom }); break; }
          // `LVL-12` §4.3: `CEN-090` esteira de montagem — uma peça por grupo, `decor-back`
          // e sem colisão: ela é **informação**, não transporte (desvio 5)
          if (room.glyphs?.e === 'conveyor') {
            if (ehCanto(room.grid, x, y, 'e')) {
              const g = grupoRetangular(room.grid, x, y, 'e');
              const meio = cx + ((g.w - 1) * TILE) / 2;
              built.decorBack.push({ kind: 'conveyor', x: meio, y: bottom, column: x, width: g.w });
              // a ficha da sala guarda a esteira inteira: o teste mede `width` em tiles
              built.conveyors.push({ x: meio, y: bottom, width: g.w });
            }
          }
          break;
        case 'C':
          // `C` é placa de pressão no resto do jogo. Em LVL-14 é **`ENT-006`** (`LVL-14` §3/§4.5):
          // a sala decide o significado (`DEC-023`), e o campo `boss` é a autoridade.
          if (room.boss === 'ENT-006') built.comandante = { x: cx, y: bottom };
          // `LVL-16` §4.5: **quadro de crachás** (`CEN-116`) — 40 crachás, 41 pregos, e o
          // prego 41 já estava posto **antes** de alguém se candidatar
          else if (room.glyphs?.C === 'badge-wall') {
            built.badgeWall = {
              x: cx, y: bottom,
              badges: room.badgeWall?.badges ?? 40, hooks: room.badgeWall?.hooks ?? 41,
            };
            built.decorBack.push({ kind: 'badge-wall', x: cx, y: bottom });
          }
          else built.plates.push({ x: cx, y: bottom });
          break;
        case 'K': {
          // `CEN-103` fechadura (`LVL-14` §8): **duas**, lado a lado, sem corpo próprio —
          // quem barra é a coluna `barrierTx`, e ela cai quando `keys >= required` (`DEC-016`)
          // `LVL-16` §3: `K` é o **posto de guarda** (`CEN-111`) na arena do Trono. Ele fica
          // encostado em `O` de propósito: em pé, o chefe cobre o posto (§5.5)
          if (room.glyphs?.K === 'guard-post') {
            built.posto = { x: cx, y: bottom };
            break;
          }
          const l = room.locks;
          if (l && y === 6) {
            built.locks.push({ x: cx, y: bottom, required: l.required, barrierTx: l.barrierTx });
            if (x === l.barrierTx) built.eastOpen = false;
          }
          break;
        }
        case 'U': built.elevators.push({ x: cx, y: bottom }); break;
        case 'w':
          // `CEN-075`: o rato é a única coisa viva do jogo que não ataca (§1).
          // `LVL-11`: `w` é o vidro quebrado do telhado da estufa (`CEN-083` reskin).
          if (room.glyphs?.w === 'glass') built.decorBack.push({ kind: 'glass', x: cx, y: bottom });
          // `LVL-14` §3: `w` é **ameia** (`CEN-104`) — a muralha, não um rato
          else if (room.glyphs?.w === 'merlon') built.decorBack.push({ kind: 'merlon', x: cx, y: bottom });
          // `LVL-15` §3: **parede de cinza-osso** (`CEN-108`) — a única textura do setor
          else if (room.glyphs?.w === 'bone-wall') built.decorBack.push({ kind: 'bone-wall', x: cx, y: bottom });
          // `LVL-16` §3: **pedra nua** — o último andar é despovoado, e a textura é o vazio
          else if (room.glyphs?.w === 'bare-stone') built.decorBack.push({ kind: 'bare-stone', x: cx, y: bottom });
          else built.rats.push({ x: cx, y: bottom });
          break;
        case 'H': break;   // parede de ganchos: a colisão já saiu da linha; a ficha dá a região
        case '^': break;   // alçapão: a autoridade é `Room.hatch` (`CEN-081`)
        case 'r':
          // `CEN-078` corda do sino: **uma** peça por coluna (a corda é contínua), e a boca
          // do atalho (`interact`) fica no pé dela
          if (room.glyphs?.r === 'rope') {
            if (ehCanto(room.grid, x, y, 'r')) {
              const g = grupoRetangular(room.grid, x, y, 'r');
              built.decor.push({
                kind: 'rope', x: cx, y: (y + g.h) * TILE, tiles: g.h,
              });
            }
            // a boca do atalho é o **pé** da corda, não cada célula dela
            if (room.grid[y + 1]?.[x] !== 'r') built.sinks.push({ x: cx, y: bottom });
          }
          break;
        case 'Q': break;   // quadro de aviso: o desenho sai de `built.texts`
        case 'y': break;   // `CEN-100` eclipse: o glifo só marca o céu; quem pinta é a cena
        case 'O':
          // `LVL-15` §5.1: `ENT-007` tem **dois corpos** e cada `O` da grade é um deles.
          // O campo `boss` é a autoridade — sem ele, `O` não é nada (não há outro uso).
          if (room.boss === 'ENT-007') built.guardioes.push({ x: cx, y: bottom });
          // `LVL-16` §5.1: **`ENT-008`** — **um** corpo, e ele **não tem vida**. Não entra em
          // `guardioes` nem em `boss`: a cena o trata por postura, nunca por HP (`TST-018`)
          else if (room.boss === 'ENT-008') built.plantonista = { x: cx, y: bottom };
          break;
        case 'g': built.decor.push({ kind: 'sluice', x: cx, y: bottom }); break;   // `CEN-073`
        case 'l': built.decor.push({ kind: 'lamp', x: cx, y: bottom }); break;     // `CEN-002` reskin
        case 'v':
          // `v` é cinza caindo em LVL-04, vitral em LVL-07 e arco de tijolo em LVL-09
          if (room.glyphs?.v === 'window') {
            // janela alta (`CEN-074` reskin): uma peça por coluna, cortada pelo teto
            if (ehCanto(room.grid, x, y, 'v')) {
              const g = grupoRetangular(room.grid, x, y, 'v');
              built.decorBack.push({
                kind: 'window', x: cx, y: (y + g.h) * TILE, column: x, tiles: g.h,
              });
            }
          } else if (room.glyphs?.v === 'brick-arch') {
            // uma peça por coluna, ancorada no topo do grupo: o arco nasce do teto
            if (ehCanto(room.grid, x, y, 'v')) {
              const g = grupoRetangular(room.grid, x, y, 'v');
              built.decorBack.push({
                kind: 'brick', x: cx, y: (y + g.h) * TILE, column: x, tiles: g.h,
              });
            }
          } else if (room.glyphs?.v === 'stained') {
            // a rosácea é 2×5 tiles e é **uma** peça: o grupo inteiro desenha uma vez
            if (ehCanto(room.grid, x, y, 'v')) {
              const g = grupoRetangular(room.grid, x, y, 'v');
              built.decorBack.push({
                kind: 'stained', x: cx + ((g.w - 1) * TILE) / 2, y: (y + g.h) * TILE,
                column: x, tiles: g.h, width: g.w,
              });
            }
          }
          // `LVL-16` §3: **luz de vinho** (`PAL-16`) — `decor-front`, sem colisão e **sem som**.
          // A luz vem do que está no fim do andar, não de uma vela (§4.1)
          else if (room.glyphs?.v === 'wine-light') built.decor.push({ kind: 'wine-light', x: cx, y: bottom });
          else built.decorBack.push({ kind: 'ash', x: cx, y: bottom });
          break;
        case 'c':
          // `c` é vela (`CEN-025`) e **trepadeira** em LVL-11 (`CEN-085`). No jardim ela é
          // sinalização, não ornamento: marca as duas beiradas de todo vão (§3).
          // `c` é vela (`CEN-025`), trepadeira em LVL-11 e **corrente pendurada** em LVL-12
          // (`CEN-094`), que balança sem vento (§4.1)
          // `LVL-15` §3: **cinza caindo** (`CEN-109`) — `decor-front`, sem colisão e **muda**
          // (§7.3). Ela cai devagar e não faz barulho: o setor é o anti-eco de LVL-13.
          if (room.glyphs?.c === 'ash-fall') {
            built.decor.push({ kind: 'ash-fall', x: cx, y: bottom });
            break;
          }
          // `LVL-16` §3: **cadeira vazia** — seis desenhadas, quarenta implicadas, nenhuma
          // ocupada. `decor-back`, sem colisão: é a fila que nunca andou (§4.2)
          if (room.glyphs?.c === 'empty-chair') {
            built.decorBack.push({ kind: 'empty-chair', x: cx, y: bottom });
            break;
          }
          built.decor.push({
            kind: room.glyphs?.c === 'vine' ? 'vine'
              : room.glyphs?.c === 'chain' ? 'chain' : ch,
            x: cx, y: bottom,
          });
          break;
        default:
          if (DECOR.has(ch)) built.decor.push({ kind: ch, x: cx, y: bottom });
      }
      if (ch === 'N' || ch === 'Q') {
        built.texts.push({ x: cx, y: bottom, lines: room.texts?.[`${x},${y}`] ?? [] });
      }
      if (y === 0 && (ch === '+' || ch === '^')) {   // `^` = alçapão (`DEC-015`)
        const last = built.ceilingHoles[built.ceilingHoles.length - 1];
        if (last && last.to === x - 1) last.to = x;
        else built.ceilingHoles.push({ from: x, to: x });
      }
      if (y >= 4 && y <= 6) {
        if (x === w - 1 && (ch === '+' || ch === 'D')) built.eastOpen = true;
        if (x === 0 && (ch === '+' || ch === 'D')) built.westOpen = true;
      }
    }
  }

  return built;
}

/** Converte coordenada de tile em px (centro). */
export function tileCenter(tx: number, ty: number): { x: number; y: number } {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}
