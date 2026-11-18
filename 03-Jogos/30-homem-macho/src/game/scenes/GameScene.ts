/** GameScene — mundo, entidades, física e câmera (GDD §7.4). Sem regra: regra vive em `core/`. */
import Phaser from 'phaser';
import { EventBus, type GameEvents } from '../EventBus';
import { buildRoom, type BuiltRoom } from '../systems/LevelBuilder';
import { AREAS, nextArea, type Area } from '../data/levels/index';
import { Boss } from '../entities/Boss';
import { Alferes } from '../entities/Alferes';
import { Comum, type CorpoComumCena } from '../entities/Comum';
import type { ArquetipoId } from '../../core/arquetipos';
import { Forjador } from '../entities/Forjador';
import { Comandante } from '../entities/Comandante';
import { Guardiao } from '../entities/Guardiao';
import { Plantonista } from '../entities/Plantonista';
import {
  ELEVATOR_LINE, applyCounterweight, elevatorVerdict, engagesCounterweight, pushBlock,
} from '../../core/machines';
import {
  consume, isDrowning, maxBreath, refill, shouldShowDrownHint,
} from '../../core/breathe';
import {
  activeSand, enterPhase2, groundSpeedMultiplier, pointInSand, startSandClock,
  stepSandClock, zeroSand, type SandClockState,
} from '../../core/sand';
import { maxHoles, pickHole } from '../../core/posto';
import { LVL16_BADGE, LVL16_LAST_LINE } from '../data/levels/lvl16';
import {
  addDeath, addDifficultyChange, addItem, addPasswordAttempt, createSession,
  endFight, endSession, enterRoom, startFight, summarize, type Session,
} from '../../core/metrics';
import type { Room } from '../data/levels/lvl01';
import {
  ALFERES, AMBIENT, ARENA, BOSS, COMANDANTE, DEFAULT_DIFFICULTY, ECLIPSE, FLAGS, FORJADOR,
  GUARDIAO, PLANTONISTA, DESGASTE, VAGA, HAMMER, HOOK, INVENTARIO, ITEMS, KEYS, ECHO, LONG_FALL, MOVE,
  DROPS_RAROS, MELHORIAS, MOEDAS, NOME_HABILIDADE, ORDEM_HABILIDADES, PERDA,
  PIT, PLAYER, SAND, SENTINEL, SILENCE,
  SPIKE, SPIKE_CYCLE, TILE, UPDRAFT, VIEW,
} from '../data/tuning';
import { CLIMB } from '../../core/climb';
import { pickRing } from '../../core/hook';
import {
  hammerPhaseAt, hammerPeriod, hammerStops, inForgeArc, pieceHitsPlayer,
} from '../../core/forge';
import {
  echoAt, echoGhostVisible, inUpdraft, longFallMs,
} from '../../core/updraft';
import {
  KEY_ITEMS, eclipseStops, gateVerdict, keyLabel, skyAt, type Sky,
} from '../../core/eclipse';
import {
  addSeal, duoDefeated, reviveHp, sealExpired, sealLabel, suspensionMs,
} from '../../core/duo';
import { PAL } from '../data/palette';
import { Player, type InputState } from '../entities/Player';
import { Sentinel } from '../entities/Sentinel';
import { saveProgress } from '../../services/save';
import { ACOES, loadConfig, type AcaoJogo, type Config, type TipoControle } from '../../services/settings';
import { clearPendingStart } from '../../services/start';
import { PERSONAGEM_PADRAO, normalizarPersonagem, type Personagem } from '../../services/character';
import { applyItem, type ItemEffect, type ItemId } from '../../core/items';
import {
  BOLSA_VAZIA, MOTIVO_TEXTO, guardar, prender as prenderNaBolsa, soltar as soltarDaBolsa,
  type Bolsa,
} from '../../core/inventory';
import { sortearDrop } from '../../core/drop';
import {
  estadoDaSala, ligacoesDe, normalizarVisitadas, resumoDoSetor,
} from '../../core/mapa';
import { MAPA, TODAS_AS_SALAS } from '../data/mapa';
import type { Habilidade } from '../../core/permanentes';
import {
  MOTIVO_MELHORIA_TEXTO, fatorDe, habilidadesConquistadas, normalizarColetados, melhorar, nivelDe, niveisIniciais, normalizarNiveis,
  proximoCusto, proximoTexto, type Niveis,
} from '../../core/melhorias';
import {
  MOTIVO_BAU_TEXTO, guardarMoedas, guardarNoBauEm, guardarTudoNoBau, moedasValidas,
  normalizarBau, retirarDoBauEm, retirarMoedas, retirarTudoDoBau,
  type MotivoBau, type ResultadoMover,
} from '../../core/storage';
/** Os seis gestos do baú (`DEC-040`), tirados do contrato — uma lista escrita à mão divergiria. */
type TipoComandoBau = GameEvents['ui:bau-command']['action'];
import { ehItemId } from '../../core/items';
import {
  mulberry32, perderNaMorte, resumoDaPerda, type Classe,
} from '../../core/loot';
import {
  criarBolsa, naSala, normalizarBolsaDaMorte, recolher, rotuloDaBolsa, substituir,
  type BolsaDaMorte, type Local,
} from '../../core/deathbag';
import {
  aoMorrer as permanecerAoMorrer, aoReaparecer, conquistar, limites, permanentesIniciais,
  type Permanentes,
} from '../../core/permanentes';
import { checkPassword, type PasswordSymbol } from '../../core/password';
import type { Difficulty } from '../../core/types';

interface SceneData {
  area?: string;
  room?: number;
  hp?: number;
  shield?: number;
  difficulty?: Difficulty;
  /** `DEC-027`: o slot onde esta partida grava. */
  slot?: number;
  /** `UI-12`: o personagem escolhido no ecrã de criação. */
  personagem?: Personagem;
  /** `UI-07`: o conteúdo do baú que veio do save (a lista é compartilhada pelas salas seguras). */
  bau?: readonly ItemId[];
  /** `DEC-040`: e as moedas guardadas no baú — o único sítio a salvo da morte. */
  bauMoedas?: number;
  /** `UI-14`: os níveis das habilidades comprados (`DEC-041`). */
  melhorias?: Niveis;
  /** `UI-14`: o que já foi apanhado (`collected`), agora no save — as habilidades saem daqui. */
  coletados?: readonly ItemId[];
  /** `DEC-042`: chefes derrotados desde o último drop raro (a garantia). */
  tentativasDrop?: number;
  /** `MEC-006`: a porta de senha de L02-07 já cedida (progressão permanente, como o baú). */
  senhaAberta?: boolean;
  /** `UI-22` (`DEC-043`): as salas onde o herói já entrou — é o que o mapa pode desenhar. */
  visitadas?: readonly string[];
  /** `MEC-004`: a bolsa da morte que ficou no chão de uma partida anterior (`DEC-038`). */
  bolsaMorte?: BolsaDaMorte | null;
}
/** `start` = entrada da sala; `west`/`east` = vindo da lateral; `ceiling` = caindo da fenda do teto. */
type SpawnSide = 'start' | 'west' | 'east' | 'ceiling';

/**
 * O que a cena exige de um inimigo comum, seja ele a Sentinela antiga ou um corpo de arquétipo
 * novo (`DEC-048`). Escrever isto como **interface** (e não como união de classes) evita o
 * `never` que sai de `Sentinel & Comum`: as duas classes têm campos privados com o mesmo nome e
 * para o TypeScript isso é uma interseção impossível, mesmo sendo a mesma coisa no mundo real.
 */
interface SentinelaOuComum {
  active: boolean;
  x: number;
  body: unknown;
  alive: boolean;
  dangerous: boolean;
  dano: number;
  update(time: number, player: Phaser.GameObjects.Sprite): void;
}

const ITEM_TEXTURE: Record<ItemId, string> = {
  'ITM-001': 'item_heal',
  'ITM-002': 'item_shield',
  'ITM-003': 'item_jump',
  'ITM-004': 'item_trophy',
  'ITM-005': 'item_strength',
  'ITM-006': 'item_breath',
  'ITM-007': 'item_relic',
  'ITM-008': 'item_hook',
  'ITM-009': 'item_claw',
  'ITM-010': 'item_banner',   // `CEN-087` estandarte rasgado (`HAB-07`, `P-56`)
  'ITM-011': 'item_piece',    // `LVL-12` a peça que faltava — só cai se o Forjador cair
};

interface SpikeSlot {
  zone: Phaser.GameObjects.Zone;
  sprite: Phaser.GameObjects.Image;
  /** defasagem em ms — pares alternados ficam 0,6 s fora de fase (§5.3) */
  phase: number;
  dangerous: boolean;
}

/**
 * `LVL-16` §5.5–§5.6 — os números do chefe final num lugar só, para `core/posto.ts` e para o
 * desgaste. Nada de literal espalhado (`PAT-C-04`).
 */
const POSTO_TIMING = {
  poise: PLANTONISTA.poise as unknown as readonly [number, number, number],
  golpePoise: PLANTONISTA.golpePoise,
  staggerMs: PLANTONISTA.staggerMs,
  staggerSwayMs: PLANTONISTA.staggerSwayMs,
  channelMs: PLANTONISTA.channelMs,
  staggerSlackMs: PLANTONISTA.staggerSlackMs,
  protocolHits: PLANTONISTA.protocolHits,
  protocolWindowMs: PLANTONISTA.protocolWindowMs,
  protocolMs: PLANTONISTA.protocolMs,
  crackMs: DESGASTE.crackMs,
  holeMs: DESGASTE.holeMs,
  maxHoles: DESGASTE.maxHoles,
  maxHolesFinal: DESGASTE.maxHolesFinal,
  maxAdjacent: DESGASTE.maxAdjacent,
} as const;

export class GameScene extends Phaser.Scene {
  private area!: Area;
  private rooms!: readonly Room[];
  private roomIndex = 0;
  private difficulty: Difficulty = DEFAULT_DIFFICULTY;
  private carried: { hp: number; shield: number } = { hp: PLAYER.hp, shield: PLAYER.shield };
  private checkpointRoom = 0;
  private collected: ItemId[] = [];
  /**
   * `UI-07`/`MEC-004`: a mochila e os itens presos. Vivem na sessão, não no save — como os
   * permanentes (`P-28`: a bolsa da morte é a próxima etapa).
   */
  private bag: ItemId[] = [];
  private presos: ItemId[] = [];
  /** `UI-07`: a mochila está aberta (a cena está pausada enquanto estiver). */
  private inventarioAberto = false;
  /**
   * `UI-07`: o baú. **Uma lista só para o jogo inteiro** — as salas seguras partilham-na, e é o
   * save que a guarda. Um baú por sala seria um sítio onde o jogador perde coisas ao avançar.
   */
  private bau: ItemId[] = [];
  /** Os baús desenhados nesta sala (um por ponto de salvamento) e se algum está ao alcance. */
  private bauSprites: Phaser.GameObjects.Image[] = [];
  private bauDisponivel = false;
  /**
   * `DEC-040`: as **moedas guardadas no baú**. Vivem no save, como os itens do baú, e a morte não
   * lhes toca — `perderNaMorte` não recebe esta conta (é a mesma regra do baú: o que lá está não
   * cai). É o que dá sentido ao gesto de guardar antes de entrar numa arena.
   */
  private bauMoedas = 0;
  /**
   * `UI-14` (`DEC-041`) — os **níveis** das habilidades (`0` não conquistada, `1..3`). Vivem no save:
   * um nível comprado com moedas é progressão permanente, e perder progressão permanente é
   * exactamente o que o dono proibiu (`DEC-038`).
   */
  private niveis: Niveis = niveisIniciais([], MELHORIAS);
  /** `UI-14`: o painel das habilidades está aberto (a cena está pausada enquanto estiver). */
  private habilidadesAberto = false;
  /**
   * `UI-22` (`DEC-043`) — **as salas visitadas**. Vive no save (`Progress.visitadas`): o mapa é o
   * registo do que o jogador andou, e um registo que se apaga ao fechar o jogo não é um registo.
   */
  private visitadas: string[] = [];
  /** `UI-22`: o mapa está aberto (a cena está pausada enquanto estiver). */
  private mapaAberto = false;
  /**
   * `DEC-042`: chefes derrotados desde o último drop raro. Vive no save — a garantia é uma promessa
   * ao jogador, e uma promessa que se reinicia ao fechar o jogo não é promessa nenhuma.
   */
  private tentativasDrop = 0;
  /**
   * Gerador do drop. Semeado e avançado a cada chefe (`mulberry32` já existe para a morte) para que
   * dois chefes seguidos não tirem o mesmo número — e para o E2E poder forçar um resultado.
   */
  private rngDrop: () => number = Math.random;
  /**
   * `MEC-004` de moedas: o que os mobs e os chefes deixaram. **Não** está no save — e não precisa:
   * a morte apaga-o a 100 %, logo o pior que um save antigo poderia fazer é dar moedas a mais a
   * quem nunca morreu.
   */
  private moedas = 0;
  /** Semente da perda na morte: avança a cada morte para duas mortes não darem o mesmo dado. */
  private sementePerda = 1;
  /**
   * `MEC-004` (`DEC-038`): a **bolsa da morte**. Uma só no mundo; morrer outra vez destrói a
   * anterior. Vive no save (é o que a torna recuperável depois de fechar o jogo).
   */
  private bolsaMorte: BolsaDaMorte | null = null;
  private bolsaSprite: Phaser.GameObjects.Image | null = null;
  private bolsaNaSala = false;
  private bolsaAnunciada = false;
  /** `MEC-004`: o que se conquistou — tetos e habilidades. **Nunca regride** (`core/permanentes`). */
  private permanentes: Permanentes = permanentesIniciais({
    hp: PLAYER.hp, shield: PLAYER.shield, power: PLAYER.power,
  });
  /**
   * `MEC-006` — **a porta de senha de L02-07 já cedeu**.
   *
   * Vive no save (`Progress.senhaAberta`) pela mesma razão que o baú e os níveis: é progressão
   * permanente. Antes disto o campo morria com a cena, e o jogador que voltava a L02-07 encontrava
   * a porta fechada **e sem poder pedir a senha outra vez** (`nearPasswordDoor` cala-se quando ela
   * já está aberta) — um caminho para LVL-03 que se fechava sozinho.
   */
  private passwordOpen = false;

  private built!: BuiltRoom;
  private player!: Player;
  /**
   * Os **inimigos comuns** da sala (`ENT-002`/`ENT-010`/`ENT-011`, `DEC-048`). O nome do campo
   * ficou `sentinels` porque metade do ficheiro o lê; o que mudou é o que pode estar lá dentro —
   * e por isso o tipo é o contrato `CorpoComumCena`, não a classe de uma criatura.
   */
  /** `DEC-049`: de que lado está a parede de ganchos, e até quando o contacto conta. */
  private paredeContato: -1 | 1 = 1;
  private paredeContatoAte = 0;

  private sentinels!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private saveZones?: Phaser.Physics.Arcade.StaticGroup;
  private itemZones?: Phaser.Physics.Arcade.StaticGroup;
  private spikeSlots: SpikeSlot[] = [];
  private boss: Boss | null = null;
  /** `ENT-004` O Alferes da Ronda (`LVL-08` §5) — chefe médio da arena. */
  private alferes: Alferes | null = null;
  /** `LVL-12` §5: `ENT-005` O Forjador — chefe **opcional** e sem grade (§8). */
  private forjador: Forjador | null = null;
  /** `LVL-12` §7.5: `MEC-009` é da sessão, não da sala — a peça some se ele só foi ferido. */
  private forjadorDefeated = false;
  /** `LVL-14` §5: `ENT-006` O Comandante — chefe alto, fixo e com grade. */
  private comandante: Comandante | null = null;
  private comandanteDefeated = false;
  /**
   * `LVL-15` §5: `ENT-007` — **dois corpos, um chefe**. O par é tratado como uma entidade:
   * `MEC-009` só conta com os dois caídos, e a revivificação é infinita (§5.5).
   */
  private guardioes: Guardiao[] = [];
  /**
   * `LVL-16` §5: **`ENT-008` O Plantonista** — o único chefe **sem vida**. A cena nunca chama
   * `MEC-009` nele: a luta termina em `rendido` (3ª baixa) e a grade abre por `MEC-011`.
   */
  private plantonista: Plantonista | null = null;
  /** As baixas assinadas **sobrevivem à morte do jogador** (§10.1) — o oposto de LVL-15. */
  private postoBaixas = 0;
  private postoRendido = false;
  /** Quanto o jogador já segurou `interact` no posto (`MEC-011`: 3.000 ms). */
  private canalMs = 0;
  /** `CEN-113`: os buracos do piso da arena, por índice de tile. */
  private holeTiles = new Set<number>();
  private holeSprites: Phaser.GameObjects.Image[] = [];
  private crackSprite?: Phaser.GameObjects.Image;
  private stillTile: number | null = null;
  private stillMs = 0;
  /** `MEC-012`: o fim é **uma tecla**, processada uma vez (`PAT-C-07`). */
  private terminou = false;
  private guardiaoDefeated = false;
  /** Os selos no jogador (`ATK-17`): dois seguram, um só aparece no HUD (§5.3). */
  private seals = 0;
  private sealAt = 0;
  /**
   * `CEN-100` (§7): o relógio do céu. `skyClock` é **tempo próprio** — não é a FSM do chefe, e
   * é por isso que ele sobrevive à morte dele (§7.2) e reinicia na entrada da arena (§10).
   */
  private skyClock = 0;
  /** Marca de `performance.now()` na montagem da sala: o céu conta a partir da entrada. */
  private skyStart = 0;
  private sky: Sky = 'luz';
  private skySprites: Phaser.GameObjects.GameObject[] = [];
  /** `CEN-103` (§8): as duas fechaduras e o corpo que barra a saída enquanto `keys < 2`. */
  private lockBodies: Phaser.GameObjects.Zone[] = [];
  /** Evita repetir o aviso do portão a cada frame (§8.3). */
  private lastGateHint = 0;
  /** `CEN-092` (§7): cada pilão tem posição fixa, relógio próprio e defasagem. */
  /** `CEN-096` (§6): retângulos de vento da sala corrente, em px. */
  private updraftRects: Array<{ left: number; right: number; top: number; bottom: number }> = [];
  private updraftSprites: Phaser.GameObjects.Rectangle[] = [];
  /** `CEN-095` (§5): a cópia de 700 ms atrás — a silhueta é do eco, não um inimigo. */
  private echoGhost?: Phaser.GameObjects.Image;
  private echoHistory: Array<{ x: number; y: number; t: number }> = [];
  /** `VIS-009`: em movimento reduzido a silhueta sai e a queda cai para 900 ms. */
  private reducedMotion = false;
  /** `CEN-092` conta o próprio tempo: o relógio é da fábrica, não do chefe (§7.2). */
  private hammerStart = 0;
  private hammerSlots: Array<{
    x: number; y: number; offset: number;
    ram: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Ellipse; lastHit: number;
  }> = [];
  /** Relógio das âncoras de areia (§7.3): corre em paralelo à FSM, não dentro dela. */
  private sandClock: SandClockState = startSandClock();
  /** `true` depois de vencer o Alferes: destrava monta-carga, grade leste e `ITM-007`. */
  private bossDefeated = false;
  /** Corpos das grades da arena (`CEN-065`): oeste fecha, leste quebra. */
  private grateBodies: Phaser.GameObjects.Zone[] = [];
  /** A grade oeste já caiu atrás do jogador? (uma vez por entrada na arena) */
  private westClosed = false;
  private sandSprites: Phaser.GameObjects.Image[] = [];
  private sinkZones?: Phaser.Physics.Arcade.StaticGroup;
  /** `CEN-070` boca do trifório (`LVL-07` §5.1): entra por contato, não por `E`. */
  private triforiumZone?: Phaser.GameObjects.Zone;
  /** Sala montada agora — o destino do sumidouro/trifório é dado da ficha. */
  private current!: Room;
  private blockGroup?: Phaser.Physics.Arcade.StaticGroup;
  /** `LVL-05` §8: o contrapeso é estado de MAPA — não volta a desengatar. */
  private counterweight = false;
  private blockSprites: Array<{ sprite: Phaser.GameObjects.Image; column: number }> = [];
  private pushing = false;
  /** Chegada fora do padrão (sumidouro de `CEN-034`): consumida no próximo `mountRoom`. */
  private pendingSpawn: { x: number; y: number } | null = null;
  private ashTimer?: Phaser.Time.TimerEvent;
  /** `LVL-06` §5: fôlego em ms e o contador de afogamentos por sala (dica de `UI`). */
  private breathMs = 0;
  private drownsInRoom = 0;
  private waterRect?: Phaser.Geom.Rectangle;
  /** `LVL-09` §3/§6.2: argolas (`CEN-072`), o cabo da puxada e os ratos (`CEN-075`). */
  private ringSprites: Phaser.GameObjects.Image[] = [];
  private hookRope?: Phaser.GameObjects.Graphics;
  private ratSprites: Phaser.GameObjects.Image[] = [];
  /** `LVL-10` §6/§7.1: alçapão (`CEN-081`) e paredes de ganchos (`CEN-080`). */
  private hatchSprite?: Phaser.GameObjects.Image;
  private wallSprites: Phaser.GameObjects.Image[] = [];
  private finished = false;
  /** `MEC-008`: mortes dentro da arena, escopo por área (zera fora de LVL-03). */
  private arenaDeaths = 0;
  /** Relatório de sessão (`P-01`, `P-27`, `P-29`) — medido, não estimado. */
  private session: Session = createSession(0);
  private colliders: Phaser.Physics.Arcade.Collider[] = [];

  /**
   * `DEC-027` — **ações, não teclas**. O jogador remapeia ações nas configurações; o jogo só
   * pergunta "esquerda está premida?", nunca "a tecla A está premida?".
   */
  private teclas: Partial<Record<AcaoJogo, Phaser.Input.Keyboard.Key[]>> = {};
  /** Entrada virtual do tipo de controle `toque`: o mesmo caminho, sem teclado. */
  private virtuais = new Set<AcaoJogo>();
  private virtualPulso = new Set<AcaoJogo>();
  /**
   * `§4.6`/`MEC-001` — **os atalhos em vigor**, para o `keydown` do DOM os poder reconhecer.
   *
   * O `update` da cena lê as teclas por `JustDown`, que é uma pergunta feita **uma vez por frame**:
   * um toque mais curto do que o frame seguinte perde-se. Medido no navegador, um `M` tapado
   * depressa falhava uma vez em três — que é exactamente o jogador a dizer «o mapa não abre e
   * tenho de carregar outra vez». O `keydown` do DOM não perde nada; guarda o pulso e o `update`
   * consome-o quando puder.
   */
  private atalhosTecla: Partial<Record<AcaoJogo, readonly string[]>> = {};
  /** Remove o `keydown` global no `shutdown` (`DEC-027`). */
  private removerTeclado?: () => void;
  private tipoControle: TipoControle = 'teclado-rato';
  private legendas = true;
  /** `DEC-027`: slot do save em que esta partida vive. Retomar grava **de volta** nele. */
  private slot = 1;
  /** `UI-12`: quem o jogador criou. Guardado no save e usado pelo `BootScene` para o desenhar. */
  private personagem: Personagem = PERSONAGEM_PADRAO;
  private pointerAttack = false;
  private lastHudAt = 0;
  private busy = false;
  private unsubs: Array<() => void> = [];

  constructor() { super('Game'); }

  init(data: SceneData): void {
    this.area = AREAS[data.area ?? 'LVL-01'] ?? AREAS['LVL-01'];
    this.rooms = this.area.rooms;
    this.roomIndex = data.room ?? 0;
    this.difficulty = data.difficulty ?? DEFAULT_DIFFICULTY;
    this.slot = data.slot ?? 1;
    this.personagem = normalizarPersonagem(data.personagem);
    /**
     * `UI-07`: o baú vem do save e é **filtrado na entrada** (`normalizarBau`): o `localStorage`
     * é editável, e um baú com 500 itens ou com `"ITM-999"` dentro não pode chegar ao jogo.
     */
    this.bau = [...normalizarBau(data.bau, { slots: INVENTARIO.bau, presos: INVENTARIO.presos }, ehItemId)];
    // `DEC-040`: as moedas do baú são saneadas como as da carteira (`moedasValidas`)
    this.bauMoedas = moedasValidas(data.bauMoedas);
    // `MEC-004`: a bolsa da morte volta com o save — filtrada na entrada, como o baú
    this.bolsaMorte = normalizarBolsaDaMorte(data.bolsaMorte, ehItemId, INVENTARIO.slots);
    /*
     * `UI-14` — **as habilidades conquistadas vêm do save**, a partir do que foi apanhado. Antes
     * desta linha a lista vivia só na memória da cena: o `CONTINUAR` devolvia o herói sem as
     * habilidades e os itens voltavam a nascer no chão (`TST-005` dizia permanente, o save não).
     */
    this.collected = normalizarColetados(data.coletados, ehItemId) as ItemId[];
    this.niveis = normalizarNiveis(
      data.melhorias, habilidadesConquistadas(this.collected), MELHORIAS,
    );
    // `DEC-042`: o contador da garantia vem do save e o gerador começa numa semente diferente por morte
    this.tentativasDrop = Number.isFinite(data.tentativasDrop)
      ? Math.max(0, Math.floor(data.tentativasDrop as number)) : 0;
    this.rngDrop = mulberry32((this.tentativasDrop + 1) * 7919);
    /*
     * `UI-22`: as salas visitadas vêm do save, filtradas pelas 90 salas que existem — o
     * `localStorage` é editável e um mapa não pode desenhar salas inventadas.
     */
    this.visitadas = normalizarVisitadas(data.visitadas, TODAS_AS_SALAS);
    // `UI-02`: a partida começou — a intenção de partida cumpriu-se e pode sair de cena
    clearPendingStart();
    this.session = createSession(this.now());
    this.carried = { hp: data.hp ?? PLAYER.hp, shield: data.shield ?? PLAYER.shield };
    this.checkpointRoom = 0;
    // `MEC-006`: a senha já resolvida volta com o `CONTINUAR` (o `localStorage` é editável — só
    // `true` conta, e o que não for booleano cai em "fechada", que é o estado seguro)
    this.passwordOpen = data.senhaAberta === true;
    this.busy = false;
  }

  create(): void {
    // Teclado e assinaturas de evento vivem a vida inteira da cena: trocar de sala não os recria.
    this.setupInput();
    this.setupEvents();
    this.mountRoom(this.roomIndex, 'start');
  }

  // ---------- montagem da sala ----------

  /**
   * Troca de sala in-place (`DEC-020`). Antes era `scene.restart`: a cena nova criava `Key`
   * zeradas e o jogador que atravessava segurando `D` parava de andar até soltar e apertar.
   */
  private mountRoom(index: number, side: SpawnSide): void {
    this.clearRoom();
    // destino fora da área (ficha errada, atalho apontando para sala que não existe):
    // cair para a primeira sala é melhor que derrubar a cena com `undefined.grid`
    this.roomIndex = index >= 0 && index < this.rooms.length ? index : 0;
    const room = this.rooms[this.roomIndex];
    this.current = room;
    this.built = buildRoom(this, room);
    /*
     * `MEC-006` — **a porta de senha já aberta nasce aberta**. O `buildRoom` nasce do glifo, e o
     * glifo não sabe o que o jogador já fez: sem esta linha, voltar a L02-07 (ou morrer nela)
     * voltava a fechar a porta e o `E` já não a reabria — o caminho para LVL-03 ficava cortado.
     */
    if (this.built.passwordDoors.length && this.passwordOpen) this.abrirPortaDaSenha();

    this.paintLevel(room.grid);

    // --- jogador ---
    const spawn = this.spawnPoint(side, this.roomIndex);
    this.player = new Player(this, spawn.x, spawn.y);
    this.player.resources.hp = this.carried.hp;
    this.player.resources.shield = this.carried.shield;
    /*
     * `MEC-004` (`DEC-038`): as habilidades conquistadas voltam a ser registadas a cada sala — a
     * lista `collected` é a fonte (é o que sobrevive à morte, `TST-005`), e `permanentes` o retrato
     * que o jogo lê.
     */
    if (FLAGS.doubleJump) this.conquistarHabilidade('double-jump');
    if (this.collected.includes('ITM-003')) {
      this.player.unlockDoubleJump();
      this.conquistarHabilidade('double-jump');
    }
    // `TST-005`: Força sobrevive à morte — sem isso o elevador de L05-03 vira soft lock
    if (this.collected.includes('ITM-005')) { this.player.unlockStrength(); this.conquistarHabilidade('strength'); }
    if (this.collected.includes('ITM-006')) { this.player.unlockBreath(); this.conquistarHabilidade('breath'); }
    if (this.collected.includes('ITM-008')) { this.player.unlockHook(); this.conquistarHabilidade('hook'); }
    if (this.collected.includes('ITM-009')) { this.player.unlockClimb(); this.conquistarHabilidade('climb'); }
    if (this.collected.includes('ITM-010')) { this.player.unlockGlide(); this.conquistarHabilidade('glide'); }
    this.player.onAttack = (rect) => this.resolveAttack(rect);
    this.player.onShoot = (x, y, dir) => this.fire(x, y, dir);
    this.player.onDamaged = () => { this.pushHud(); this.legenda('Dano recebido.', 'perigo'); };
    this.player.onDied = () => this.onPlayerDeath();

    this.physics.world.setBounds(0, 0, this.built.worldWidth, this.built.worldHeight);
    this.addCollide(this.player, this.built.solids);
    this.addCollide(this.player, this.built.platforms, undefined, (p, plat) => {
      const body = (p as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.Body;
      const platBody = (plat as Phaser.GameObjects.GameObject).body as Phaser.Physics.Arcade.StaticBody;
      return body.velocity.y >= -1 && body.bottom <= platBody.top + 14;
    });

    // --- inimigos ---
    this.sentinels = this.physics.add.group({ allowGravity: true });
    for (const s of this.built.sentinels) {
      /*
       * `DEC-048`: o corpo é escolhido pelo **arquétipo que a sala declarou**, não pela posição.
       * A Sentinela continua a nascer na classe antiga — ela é a que tem `enableFormation` e a que
       * o apito de `ENT-008` chama; as outras duas nascem no corpo genérico, que corre o mesmo
       * `passoComum`. Uma fábrica só evita que a cena saiba dois caminhos de construção.
       */
      const facing = (room.id === 'L01-03' ? 1 : -1) as 1 | -1;
      const corpo: CorpoComumCena & Phaser.GameObjects.GameObject = s.arquetipo === 'sentinela'
        ? Object.assign(new Sentinel(this, s.x, s.y, facing), { arquetipo: 'sentinela' as const, dano: SENTINEL.damage })
        : new Comum(this, s.x, s.y, facing, s.variante);
      // `MEC-004`: cada corpo derrubado larga a moeda de inimigo comum
      (corpo as { onDeath?: () => void }).onDeath = () => this.ganharMoedas(MOEDAS.porInimigo);
      if (s.sync && corpo instanceof Sentinel) corpo.enableFormation();   // `LVL-04` §5.2
      this.sentinels.add(corpo as unknown as Phaser.GameObjects.GameObject);
      /*
       * O grupo nasce com `allowGravity: true` e **impõe-no a quem entra** — foi assim que o
       * voador apareceu no ar mas sempre a cair (o teste `npm run piloto` apanhou-o: "o voador
       * não tem gravidade" falhou com o corpo já criado, correto, e a aterrar). A gravidade é do
       * arquétipo, portanto volta a ser dita **depois** de o corpo entrar no grupo.
       */
      const b = (corpo as unknown as { body: Phaser.Physics.Arcade.Body }).body;
      if (b) b.setAllowGravity(s.arquetipo !== 'voador');
    }
    this.addCollide(this.sentinels, this.built.solids);

    // --- fundo do bosque (`CEN-030` árvores, `CEN-031` cinza) ---
    // --- `LVL-06`: volume de água (ficha da sala) + cristais como única luz ---
    this.waterRect = this.built.water
      ? new Phaser.Geom.Rectangle(
        this.built.water.x, this.built.water.y, this.built.water.width, this.built.water.height,
      )
      : undefined;
    if (this.waterRect) {
      const r = this.waterRect;
      this.add.rectangle(r.centerX, r.centerY, r.width, r.height, 0x3b3363, 0.34)
        .setDepth(16);
      this.add.rectangle(r.x, r.y, r.width, 3, 0x8c7bc7, 0.8).setOrigin(0, 0).setDepth(17);
    }
    this.breathMs = maxBreath(this.player.abilities.breath, this.bonusDeNiveis().breath);
    this.drownsInRoom = 0;

    // --- `LVL-09` §3: argolas de ferro (`CEN-072`) — o único alvo de `HAB-04` ---
    this.ringSprites = this.built.rings.map((r) => this.add.image(r.x, r.y, 'hook_ring')
      .setDepth(15));
    this.ratSprites = this.built.rats.map((r) => {
      // `CEN-075`: anda 2 tiles, para, repete (`wander_tiles`=2). Nunca ataca.
      const sprite = this.add.image(r.x, r.y - 6, 'rat').setOrigin(0.5, 1).setDepth(11);
      this.tweens.add({
        targets: sprite, x: r.x + TILE * 2, duration: 1400, yoyo: true, hold: 900,
        repeat: -1, ease: 'Linear',
      });
      sprite.setFlipX(true);
      return sprite;
    });
    this.hookRope = this.add.graphics().setDepth(19);

    // --- `LVL-10` §6: alçapão (`CEN-081`) — lacrado ou aberto, e a diferença é o desenho ---
    this.hatchSprite = undefined;
    this.wallSprites = [];
    // `LVL-13` §4.4: dois alçapões na mesma sala — cada um com o seu destino
    for (const h of (this.built.hatches.length ? this.built.hatches : (this.built.hatch ? [this.built.hatch] : []))) {
      const sprite = this.add.image(h.x + h.width / 2, 6, h.sealed ? 'hatch_sealed' : 'hatch_open')
        .setOrigin(0.5, 0).setDisplaySize(h.width, TILE).setDepth(4);
      if (!this.hatchSprite) this.hatchSprite = sprite;
    }
    // `CEN-080`: a parede de ganchos precisa gritar "agarre aqui" (`PAT-LD-03`)
    for (const c of this.built.climbables) {
      const colunas = Math.round(c.width / TILE);
      const linhas = Math.round(c.height / TILE);
      for (let i = 0; i < colunas; i++) {
        for (let j = 0; j < linhas; j++) {
          this.wallSprites.push(this.add.image(c.x + i * TILE + TILE / 2, c.y + j * TILE + TILE / 2, 'climb_wall')
            .setDisplaySize(TILE, TILE).setDepth(8));
        }
      }
    }

    // --- `LVL-05`: óleo no chão (`CEN-041`, sem dano) ---
    for (const d of this.built.decor) {
      if (d.kind === 'oil') this.add.image(d.x, d.y - 6, 'oil').setDepth(9);
    }

    // --- `LVL-05` §5: blocos pesados, placa de contrapeso e elevador ---
    this.blockSprites = [];
    for (const b of this.built.blocks) {
      const sprite = this.add.image(b.x, b.y - TILE / 2, 'block').setDepth(13);
      this.blockSprites.push({ sprite, column: Math.round((b.x - TILE / 2) / TILE) });
    }
    for (const c of this.built.plates) {
      this.add.image(c.x, c.y, 'plate').setOrigin(0.5, 1).setDepth(10);
    }
    for (const u of this.built.elevators) {
      this.add.image(u.x, u.y, 'elevator').setOrigin(0.5, 1).setDepth(11);
    }

    const emissoresDeCinza: number[] = [];
    for (const d of this.built.decorBack) {
      if (d.kind === 'tree') {
        this.add.image(d.x, d.y, 'tree').setOrigin(0.5, 1).setDepth(2);   // atrás do plano de jogo
      } else if (d.kind === 'crystal') {
        const crystal = this.add.image(d.x, d.y, 'crystal').setOrigin(0.5, 1).setDepth(2);
        this.tweens.add({ targets: crystal, alpha: 0.78, duration: 1400, yoyo: true, repeat: -1 });
      } else if (d.kind === 'arc') {
        // `CEN-061`: o arco nasce no teto e sobe **além do quadro** (`LVL-07` §5, técnica 2).
        // Altura mínima de 3 tiles para o arco ser sempre cortado pela borda de cima.
        const alto = Math.max(d.tiles ?? 3, 3) * TILE;
        this.add.image(d.x, d.y, 'arc').setOrigin(0.5, 1).setDisplaySize(TILE * 0.75, alto).setDepth(2);
      } else if (d.kind === 'stained') {
        // `CEN-060`: a única cor do setor; o vitral cobre o grupo inteiro de células
        this.add.image(d.x, d.y, 'stained').setOrigin(0.5, 1)
          .setDisplaySize((d.width ?? 1) * TILE, (d.tiles ?? 5) * TILE).setDepth(2);
      } else if (d.kind === 'bell') {
        // `CEN-077`: 3×3 rachado, **sem badalo** — nunca emite som em estado algum (§4.3)
        this.add.image(d.x, d.y, 'bell').setOrigin(0.5, 1)
          .setDisplaySize(TILE * (d.width ?? 3), TILE * (d.tiles ?? 3)).setDepth(2);
      } else if (d.kind === 'spiral') {
        // `CEN-079`: a escada quebrada — uma peça por coluna, cortada no topo
        this.add.image(d.x, d.y, 'spiral').setOrigin(0.5, 1)
          .setDisplaySize(TILE, (d.tiles ?? 1) * TILE).setDepth(2);
      } else if (d.kind === 'window') {
        // janela alta: a luz de fora, sem ninguém dentro
        this.add.image(d.x, d.y, 'window_tall').setOrigin(0.5, 1)
          .setDisplaySize(TILE, (d.tiles ?? 1) * TILE).setDepth(1);
      } else if (d.kind === 'brick') {
        // `CEN-074`: arco de tijolo do canal — nasce do teto e é cortado por ele
        this.add.image(d.x, (d.y ?? 0) - (d.tiles ?? 1) * TILE, 'brick_arch')
          .setOrigin(0.5, 0).setDisplaySize(TILE, (d.tiles ?? 1) * TILE).setDepth(1);
      } else if (d.kind === 'sun') {
        // `CEN-067`: disco fixo, sem parallax — nunca se move, nunca some (`LVL-08` §4.1)
        const lado = Math.max(d.width ?? 3, d.tiles ?? 3) * TILE;
        this.add.image(d.x, d.y, 'red_sun').setOrigin(0.5, 1)
          .setDisplaySize(lado, (d.tiles ?? 3) * TILE).setDepth(1);
      } else if (d.kind === 'banner') {
        // `CEN-069`: estandarte rasgado, pendurado da altura em que está na grade
        this.add.image(d.x, d.y, 'banner_ronda').setOrigin(0.5, 1)
          .setDisplaySize(48, 128).setDepth(3);
      } else if (d.kind === 'flora') {
        // `CEN-083`: a flora balança (`wind=low`) — é o único movimento vivo do setor e a
        // fonte visível do `AMB-11` (flora estalando). Sem o balanço, o som não tem dono.
        const flora = this.add.image(d.x, d.y, 'flora').setOrigin(0.5, 1)
          .setDisplaySize(TILE * 0.75, TILE).setDepth(2);
        this.tweens.add({
          targets: flora, angle: { from: -3, to: 3 },
          duration: 2200 + (d.x % 7) * 120, yoyo: true, repeat: -1, ease: 'Sine.inOut',
        });
      } else if (d.kind === 'statue') {
        // `CEN-084` 1×2: a trepadeira comeu a cara — a imagem do setor
        this.add.image(d.x, d.y, 'statue').setOrigin(0.5, 1)
          .setDisplaySize(TILE, (d.tiles ?? 2) * TILE).setDepth(2);
      } else if (d.kind === 'glass') {
        // vidro quebrado do telhado da estufa: 1 tile, preso ao teto
        this.add.image(d.x, d.y - TILE, 'glass').setOrigin(0.5, 0)
          .setDisplaySize(TILE, TILE * 0.75).setDepth(1);
      } else if (d.kind === 'banner-torn') {
        // `CEN-087`: precisa parecer a bandeira de LVL-03 — e está apodrecida
        this.add.image(d.x, d.y, 'banner_torn').setOrigin(0.5, 1)
          .setDisplaySize(48, TILE * 1.5).setDepth(3);
      } else if (d.kind === 'abyss') {
        // `CEN-097` (§1): o fundo do abismo é **gradiente e nada mais** — o setor mais
        // barato em arte do ato. O parallax é mínimo de propósito: não há o que mostrar.
        const vazio = this.add.rectangle(d.x, d.y, TILE * 1.2, TILE * 1.6, PAL.ink, 0.55)
          .setOrigin(0.5, 1).setDepth(1);
        this.tweens.add({
          targets: vazio, alpha: { from: 0.55, to: 0.35 },
          duration: 3600 + (d.x % 7) * 220, yoyo: true, repeat: -1, ease: 'Sine.inOut',
        });
      } else if (d.kind === 'bare-stone') {
        // `LVL-16` §3: pedra nua — o último andar é despovoado, e a textura é o vazio
        this.add.image(d.x, d.y, 'bare_wall').setOrigin(0.5, 1).setDepth(1);
      } else if (d.kind === 'empty-chair') {
        // `LVL-16` §4.2: seis cadeiras desenhadas, quarenta implicadas, **nenhuma ocupada**
        this.add.image(d.x, d.y, 'empty_chair').setOrigin(0.5, 1).setDepth(2);
      } else if (d.kind === 'varanda') {
        // `LVL-16` §4.6 (`DEC-005`): a amurada — vê-se LVL-01 e **não se pode descer**
        this.add.image(d.x, d.y, 'varanda').setOrigin(0.5, 1)
          .setDisplaySize(TILE * 2, TILE * 2.5).setDepth(2);
      } else if (d.kind === 'badge-wall') {
        // `CEN-116`: 40 crachás em 41 pregos. O prego 41 está vazio desde antes do jogador.
        this.add.image(d.x, d.y, 'cracha').setOrigin(0.5, 1)
          .setDisplaySize(TILE * 3, TILE * 4).setDepth(2);
      } else if (d.kind === 'merlon') {
        // `CEN-104` (§4.1): a fortaleza vista de fora. Três ameias por sala — é o lado de fora
        // que o jogador vê primeiro, e o lado de fora é uma passarela onde alguém andou em fila.
        this.add.image(d.x, d.y, 'merlon').setOrigin(0.5, 1).setDepth(1);
      } else if (d.kind === 'black-banner') {
        // `CEN-102` (§4.3): luto oficial **permanente**. O de L14-03 ocupa 2 tiles e é o maior
        // do jogo; a peça é do grupo, não da célula (`width`).
        const largura = (d.width ?? 1) * TILE;
        this.add.image(d.x, d.y, 'black_banner').setOrigin(0.5, 1)
          .setDisplaySize(largura, TILE * 2).setDepth(2);
      } else if (d.kind === 'stake') {
        // `CEN-098` (§4.2): a corda que não chegou — três estacas, cada uma mais perto
        // do vão, e a última a 2 tiles. Alguém mediu o abismo três vezes e desistiu.
        this.add.image(d.x, d.y, 'stake').setOrigin(0.5, 1).setDepth(3);
      } else if (d.kind === 'furnace') {
        // `CEN-089`: a boca do forno é a única luz do setor — e ela pulsa como fogo
        const forno = this.add.image(d.x, d.y, 'furnace').setOrigin(0.5, 1)
          .setDisplaySize(TILE * 1.5, TILE * 2).setDepth(2);
        this.tweens.add({
          targets: forno, alpha: { from: 1, to: 0.86 },
          duration: 900 + (d.x % 5) * 90, yoyo: true, repeat: -1, ease: 'Sine.inOut',
        });
      } else if (d.kind === 'conveyor') {
        // `CEN-090` (§4.3): anda sempre para a direita e **não move o jogador**. O desenho
        // é `decor-back`: quem entra não colide com ela, e é isso que a torna informação.
        const largura = (d.width ?? 1) * TILE;
        // a cinta está um tile acima do piso: sem pernas ela flutua e lê como cenário errado
        for (const lado of [-0.5, 0.5]) {
          this.add.rectangle(d.x + lado * largura * 0.94, d.y + (d.y - d.y) , 10, TILE * 1.1, PAL.stone)
            .setOrigin(0.5, 0).setDepth(1)
            .setPosition(d.x + lado * largura * 0.94, d.y - TILE * 2.1);
        }
        const esteira = this.add.image(d.x, d.y - 6, 'conveyor').setOrigin(0.5, 1)
          .setDisplaySize(largura, 26).setDepth(2);
        // o movimento é do padrão de elos, não da imagem: 24 px/s, sem colisão nenhuma
        this.tweens.add({
          targets: esteira, alpha: { from: 1, to: 0.82 }, duration: 420,
          yoyo: true, repeat: -1, ease: 'Linear',
        });
      } else if (d.kind === 'gear') {
        const gear = this.add.image(d.x, d.y - 40, 'gear').setDepth(2);
        this.tweens.add({ targets: gear, angle: 360, duration: 24000, repeat: -1 });   // 2 rpm
      } else {
        emissoresDeCinza.push(d.x);
      }
    }
    if (emissoresDeCinza.length) this.startAsh(emissoresDeCinza);

    // --- sumidouro de cinza (`CEN-034`, LVL-04 §6) ---
    this.sinkZones = this.physics.add.staticGroup();
    for (const k of this.built.sinks) {
      const boca = room.id.startsWith('L07');
      // o conduto do jardim já se desenha como `CEN-088` (`decor.duct`): aqui só a boca ativa
      const jaDesenhado = this.built.decor.some(
        (d) => d.kind === 'duct' && Math.abs(d.x - k.x) < 1 && Math.abs(d.y - k.y) < 1,
      );
      // o trifório é um vão no teto; o sumidouro de cinza é grade no chão
      if (!jaDesenhado) {
        this.add.image(k.x, k.y, boca ? 'triforium' : 'sink_grate').setOrigin(0.5, 1).setDepth(11);
      }
      if (!boca) {
        const zone = this.add.zone(k.x, k.y - 20, 70, 70);
        this.sinkZones.add(zone);
      } else {
        // `LVL-07` §5.1: a boca só existe no fim do setor e se entra por salto
        this.triforiumZone = this.add.zone(k.x, k.y - 28, 56, 56);
      }
    }
    for (const a of this.built.arrivals) {
      if (room.id.startsWith('L07')) this.add.image(a.x, a.y, 'triforium').setOrigin(0.5, 1).setDepth(11);
    }

    // --- pilares quebráveis (`CEN-021`) ---
    if (this.built.pillars.length) {
      this.addCollide(this.player, this.built.pillarGroup);
      for (const p of this.built.pillars) {
        p.sprite = this.add.image(p.centerX, 7 * TILE, 'pillar').setOrigin(0.5, 1).setDepth(11);
      }
    }

    // --- `LVL-05`: os blocos são parede até a Força empurrá-los ---
    if (this.blockSprites.length) {
      this.blockGroup = this.physics.add.staticGroup();
      for (const b of this.blockSprites) {
        const body = this.add.zone(b.sprite.x, b.sprite.y, TILE, TILE);
        this.blockGroup.add(body);
        b.sprite.setData('zone', body);
      }
      this.addCollide(this.player, this.blockGroup);
    } else {
      this.blockGroup = undefined;
    }

    // --- chefe (`ENT-003`) ---
    this.boss = null;
    if (this.built.boss) {
      const boss = new Boss(this, this.built.boss.x, this.built.boss.y);
      this.boss = boss;
      this.addCollide(boss, this.built.solids);
      if (this.built.pillars.length) {
        this.addCollide(boss, this.built.pillarGroup, (b, zone) => this.bossHitsPillar(b as Boss, zone as Phaser.GameObjects.Zone));
      }
      boss.onDefeated = () => this.onBossDefeated();
      boss.onChanged = () => this.pushBoss();
      // `P-29`: a tentativa conta a partir da entrada na arena
      this.session = startFight(this.session, this.now());
      // `PAT-LD-07`/`MEC-009`: a saída da arena fica trancada até o chefe cair
      this.built.eastOpen = false;
      // `VIS-007`: hold de entrada + nome + fala (1,8 s)
      EventBus.emit('game:text', { lines: ['GUARDIÃO DA PASSAGEM', '"NENHUM PASSA PELA PORTA QUE EU GUARDO."'], hold: true });
      this.time.delayedCall(1800, () => EventBus.emit('game:text', null));
      // `DEC-012`: a transição para a arena é checkpoint
      this.checkpointRoom = this.roomIndex;
      this.pushBoss();
    }

    // --- `LVL-08`: areia (ficha da sala), âncoras, monta-carga e grades ---
    this.sandSprites = [];
    this.sandClock = startSandClock();
    this.westClosed = false;
    this.alferes = null;
    this.grateBodies = [];
    for (const rect of this.built.sand) this.paintSand(rect.x, rect.y, rect.width, rect.height);
    for (const a of this.built.anchors) {
      this.add.image(a.x, a.y - 4, 'sand_shard').setOrigin(0.5, 1).setDepth(8).setAlpha(0.5);
    }
    for (const h of this.built.hoists) {
      this.add.image(h.x, h.y, 'hoist').setOrigin(0.5, 1).setDepth(11);
    }
    for (const g of this.built.grates) {
      const sprite = this.add.image(g.x, g.y, 'arena_grate').setOrigin(0.5, 1).setDepth(12)
        .setDisplaySize(TILE, (g.tiles ?? 3) * TILE);
      // `LVL-08` §4.4: a oeste chega aberta; a leste está fechada desde sempre
      const aberta = g.side === 'west';
      sprite.setAlpha(aberta ? 0.15 : 1);
      const zone = this.add.zone(g.x, g.y - TILE, TILE, TILE * 2);
      this.physics.add.existing(zone, true);
      this.grateBodies.push(zone);
      if (!aberta) this.addCollide(this.player, zone);
    }

    // --- `ENT-004` O Alferes da Ronda: chefe médio, arena aberta (§4.4/§5) ---
    if (this.built.alferes) {
      const chefe = new Alferes(this, this.built.alferes.x, this.built.alferes.y);
      this.alferes = chefe;
      this.addCollide(chefe, this.built.solids);
      chefe.onDefeated = () => this.onAlferesDefeated();
      chefe.onChanged = () => this.pushBoss();
      chefe.onAnchorCall = () => this.callSand();
      this.session = startFight(this.session, this.now());
      this.built.eastOpen = false;
      // `VIS-007`: nome + fala única (§5.4)
      EventBus.emit('game:text', {
        lines: ['O ALFERES DA RONDA', '"NÃO POSSO PARAR. ESTOU DE SERVIÇO."'], hold: true,
      });
      this.time.delayedCall(1900, () => EventBus.emit('game:text', null));
      this.checkpointRoom = this.roomIndex;
      this.pushBoss();
    }

    // --- `ENT-005` O Forjador (`LVL-12` §5): chefe médio **opcional**, sem grade (§8) ---
    if (this.built.forjador) {
      const chefe = new Forjador(this, this.built.forjador.x, this.built.forjador.y);
      this.forjador = chefe;
      this.addCollide(chefe, this.built.solids);
      chefe.onDefeated = () => this.onForjadorDefeated();
      chefe.onChanged = () => this.pushBoss();
      this.session = startFight(this.session, this.now());
      // §5.4: `VIS-007` — hold de 400 ms, nome 900 ms e **uma** fala que não é ameaça.
      // Nada de `eastOpen = false`: a forja não fecha (§8), e é isso que o setor afirma.
      EventBus.emit('game:text', {
        lines: ['O FORJADOR', '"ESTÁ QUENTE. NÃO FICA MUITO TEMPO."'], hold: true,
      });
      this.time.delayedCall(1700, () => EventBus.emit('game:text', null));
      this.checkpointRoom = this.roomIndex;
      this.pushBoss();
    }

    // --- `LVL-15` §5: `ENT-007` — **dois corpos, um chefe**. A saída só abre com os dois ---
    this.guardioes = [];
    if (this.built.guardioes.length) {
      this.built.guardioes.forEach((pos, i) => {
        const corpo = new Guardiao(this, pos.x, pos.y, i);
        this.guardioes.push(corpo);
        this.addCollide(corpo, this.built.solids);
        corpo.onChanged = () => this.pushBoss();
        // §5.5: quem canaliza devolve a vida ao parceiro caído quando a janela completa
        corpo.onRevive = () => {
          const caido = this.guardioes.find((o) => o !== corpo && o.felled);
          if (caido) this.reviveBody(caido, this.now());
        };
      });
      this.session = startFight(this.session, this.now());
      // `PAT-LD-07`: a grade fecha na entrada e só quebra com `MEC-009`
      this.built.eastOpen = false;
      // §5.4: **coro** — os dois dizem a mesma frase no mesmo instante
      EventBus.emit('game:text', {
        lines: [GUARDIAO.name, `"${GUARDIAO.lines.intro}"`], hold: true,
      });
      this.time.delayedCall(1900, () => EventBus.emit('game:text', null));
      this.checkpointRoom = this.roomIndex;
      this.pushBoss();
      // §7.2: `BGM-03` — a trilha do quarto seguro, **não** `BGM-02`
      EventBus.emit('game:toast', { text: `${GUARDIAO.bgm} · PROTOCOLO` });
    } else if (this.guardiaoDefeated && this.current.boss === 'ENT-007') {
      this.built.eastOpen = true;
    }

    // --- `LVL-15` §8: as portas lacradas (`CEN-107`) — mudas, sem colisão e sem função ---
    for (const d of this.built.sealedDoors) {
      this.add.image(d.x, d.y, 'sealed_door').setOrigin(0.5, 1)
        .setDisplaySize(TILE, d.tiles * TILE).setDepth(2);
    }
    // §7.3: no setor do silêncio **nada** toca — nem a cinza, nem o lacre
    for (const c of this.children.list) void c;
    if (this.current.silent || this.area.id === 'LVL-15') void SILENCE.ambientSfx;

    // --- `LVL-16` §5: `ENT-008` O Plantonista — **o chefe sem vida** ---
    this.plantonista = null;
    this.canalMs = 0;
    if (this.built.plantonista) {
      const chefe = new Plantonista(
        this, this.built.plantonista.x, this.built.plantonista.y,
        PLANTONISTA.leashX * TILE,
      );
      this.plantonista = chefe;
      chefe.baixas = this.postoBaixas;   // §10.1: as baixas não se desassinam
      chefe.poise = chefe.maxPoise;
      this.addCollide(chefe, this.built.solids);
      chefe.onChanged = () => this.pushPosto();
      // `ATK-20`: o apito chama **uma** Sentinela do piso — e no máximo 2 vivas (§5.3)
      chefe.onApito = () => this.apitoSentinela();
      // `ATK-21`: bater na janela do protocolo devolve **22** e a postura fica intacta
      chefe.onCounter = () => {
        this.player.takeDamage(PLANTONISTA.protocolDamage, this.difficulty, chefe.x);
        EventBus.emit('game:toast', { text: 'PROTOCOLO · 22' });
      };
      chefe.onRendido = () => this.onPlantonistaRendido();
      this.session = startFight(this.session, this.now());
      // `PAT-LD-07` (desvio 2): a grade fecha na entrada e **não** abre com 0 HP — não
      // existe 0 HP. Ela abre com a 3ª baixa assinada.
      this.built.eastOpen = false;
      // §5.4: a única fala de chefe do jogo que **não ameaça**
      EventBus.emit('game:text', {
        lines: [PLANTONISTA.name, `"${PLANTONISTA.lines.intro}"`], hold: true,
      });
      this.time.delayedCall(PLANTONISTA.introMs + 1000, () => EventBus.emit('game:text', null));
      this.checkpointRoom = this.roomIndex;
      this.pushPosto();
      // §8.2: `BGM-02` — a última vez que a trilha de chefe toca no jogo
      EventBus.emit('game:toast', { text: `${PLANTONISTA.bgm} · O POSTO` });
    } else if (this.postoRendido && this.current.boss === 'ENT-008') {
      this.built.eastOpen = true;   // ele já se rendeu: a grade está no chão desde então
    }

    // --- `LVL-16` §4/§6: as peças do Trono (`CEN-111` a `CEN-116`) ---
    if (this.built.posto) {
      this.add.image(this.built.posto.x, this.built.posto.y, 'posto')
        .setOrigin(0.5, 1).setDepth(10);
    }
    if (this.built.dispenser) {
      const dist = this.add.image(this.built.dispenser.x, this.built.dispenser.y, 'senha')
        .setOrigin(0.5, 1).setDepth(11);
      // `CEN-112`: `SENHA ATUAL: 000` — o display pulsa devagar, e o número não muda
      this.tweens.add({ targets: dist, alpha: 0.86, duration: 2400, yoyo: true, repeat: -1 });
    }
    if (this.built.badgeWall) {
      this.add.image(this.built.badgeWall.x, this.built.badgeWall.y, 'cracha')
        .setOrigin(0.5, 1).setDepth(2);
    }
    if (this.built.throne) {
      this.add.image(this.built.throne.x, this.built.throne.y, 'trono')
        .setOrigin(0.5, 1).setDepth(11);
    }
    if (this.built.varanda) {
      // `CEN-115`: a amurada de onde se vê LVL-01 — e de onde **não se pode descer**
      this.add.image(this.built.varanda.x, this.built.varanda.y, 'varanda')
        .setOrigin(0.5, 1).setDepth(2);
    }
    this.holeTiles = new Set<number>();
    this.holeSprites = [];
    this.crackSprite = undefined;
    this.stillTile = null;
    this.stillMs = 0;
    if (this.built.desgaste) {
      // §5.6: o Caos **é o chão**. Nada de objeto novo: o piso da arena inteiro é a ameaça.
      this.add.rectangle(this.built.worldWidth / 2, 7 * TILE - 3, this.built.worldWidth, 6,
        PAL.accent16, 0.18).setDepth(8);
    }
    // a barra do ocupante **sai de cena** quando não há ocupante: sem isto o HUD fica com
    // `BAIXAS 0/3` na parede dos crachás, quinze segundos depois da luta
    if (!this.built.plantonista) this.pushPosto();
    // §8.1: `BGM-04` **só** de L16-05 ao fim, e ela não faz loop (§8.2)
    if (this.area.id === 'LVL-16' && this.roomIndex >= VAGA.bgmFinalFromRoom) {
      EventBus.emit('game:toast', { text: `${VAGA.bgmFinal} · O TRONO` });
    }

    // --- `LVL-14` §5: `ENT-006` O Comandante — chefe alto, **fixo**, com grade (§6.5) ---
    if (this.built.comandante) {
      const chefe = new Comandante(this, this.built.comandante.x, this.built.comandante.y);
      this.comandante = chefe;
      this.addCollide(chefe, this.built.solids);
      chefe.onDefeated = () => this.onComandanteDefeated();
      chefe.onChanged = () => this.pushBoss();
      this.session = startFight(this.session, this.now());
      // `PAT-LD-07`: a grade fecha na entrada e só cai com 0 HP processado — LVL-14 é a regra,
      // LVL-12 foi a exceção documentada (§8 de lá, desvio 2 daqui)
      this.built.eastOpen = false;
      // §5.4: hold de 400 ms, nome na tela e **a primeira ordem do jogo com destinatário**
      EventBus.emit('game:text', {
        lines: [COMANDANTE.name, `"${COMANDANTE.lines.intro}"`], hold: true,
      });
      this.time.delayedCall(2000, () => EventBus.emit('game:text', null));
      this.checkpointRoom = this.roomIndex;
      this.pushBoss();
      EventBus.emit('game:boss-keys', { keys: this.bossKeys, required: KEYS.required });
    } else if (this.comandanteDefeated && this.current.boss === 'ENT-006') {
      // ele já caiu: a grade está quebrada desde a primeira visita
      this.built.eastOpen = true;
    }

    // --- `LVL-14` §8: `CEN-103` o portão de **duas** fechaduras (`DEC-016`) ---
    this.lockBodies = [];
    if (this.built.locks.length) {
      for (const l of this.built.locks) {
        this.add.image(l.x, l.y - 20, 'key_lock').setDepth(11).setOrigin(0.5, 1);
      }
      const aberto = gateVerdict(this.bossKeys, this.built.locks[0].required) === 'abre';
      // a coluna que barra fica **sólida enquanto faltar chave** — a saída existe, o portão não
      if (!aberto) {
        const tx = this.built.locks[0].barrierTx;
        const zone = this.add.zone(tx * TILE + TILE / 2, 5 * TILE, TILE, TILE * 3);
        this.physics.add.existing(zone, true);
        this.lockBodies.push(zone);
        this.addCollide(this.player, zone);
        this.built.eastOpen = false;
      } else {
        this.built.eastOpen = true;
      }
      EventBus.emit('game:boss-keys', {
        keys: this.bossKeys, required: this.built.locks[0].required,
      });
    }

    // --- `LVL-14` §7: `CEN-100` o eclipse — estado global de luz, `decor-front` ---
    this.skySprites = [];
    this.skyClock = 0;
    this.skyStart = this.now();
    this.sky = 'luz';
    if (this.current.eclipse) this.paintEclipse();

    // --- `LVL-13` §6: `CEN-096` correntes de ar — região declarada, sem colisão ---
    this.updraftRects = this.built.updrafts.map((u) => ({
      left: u.x, right: u.x + u.width, top: u.y, bottom: u.y + u.height,
    }));
    this.updraftSprites = [];
    for (const u of this.built.updrafts) this.paintUpdraft(u);

    // --- `LVL-13` §5: `CEN-095` a silhueta de eco, 700 ms atrás (§5, `VIS-009`) ---
    this.echoGhost = undefined;
    this.echoHistory = [];
    if (this.built.decor.some((d) => d.kind === 'echo') && echoGhostVisible(this.reducedMotion)) {
      this.echoGhost = this.add.image(this.player.x, this.player.y, 'player')
        .setOrigin(0.5, 1).setAlpha(ECHO.ghostAlpha).setDepth(6).setTint(PAL.accent13);
    }

    // --- `CEN-092` pilões (`LVL-12` §7): relógio próprio, defasado em meio período ---
    this.hammerSlots = [];
    if (this.built.hammers.length) {
      this.hammerStart = this.time.now;
      const defasagem = this.built.hammers.length > 1 ? HAMMER.offsetMs : 0;
      this.built.hammers.forEach((h, i) => {
        // a sombra no piso é a única coisa que o jogador lê antes da descida (§7.4)
        const shadow = this.add.ellipse(h.x, h.y - 4, TILE * 1.5, 18, 0x0d0b12, 0.55).setDepth(9);
        const ram = this.add.image(h.x, h.y - 260, 'hammer_ram').setOrigin(0.5, 1).setDepth(16);
        this.hammerSlots.push({
          x: h.x, y: h.y, offset: defasagem * i, ram, shadow, lastHit: -10_000,
        });
      });
    }

    // --- projéteis (PAT-C-03: pool fixo) ---
    this.projectiles = this.physics.add.group({
      defaultKey: 'spark', maxSize: PLAYER.shot.poolSize, allowGravity: false,
    });
    this.addCollide(this.projectiles, this.built.solids, (a, b) => this.despawnProjetilDe(a, b));
    if (this.boss) {
      this.projetilContra(this.boss, () => this.boss?.takeHit(PLAYER.shot.damage));
    }
    if (this.alferes) {
      this.projetilContra(this.alferes, () => this.alferes?.takeHit(PLAYER.shot.damage));
    }
    if (this.forjador) {
      this.projetilContra(this.forjador, () => this.forjador?.takeHit(PLAYER.shot.damage));
    }
    if (this.comandante) {
      this.projetilContra(this.comandante, () => this.comandante?.takeHit(PLAYER.shot.damage));
    }
    if (this.plantonista) {
      // §6.1: **"dano à distância = 0"** — o tiro atravessa e some no corpo dele. Nenhum
      // caminho leva a `MEC-009`: quem der HP ao último chefe desfaz o setor inteiro.
      this.projetilContra(this.plantonista, () => {});
    }
    for (const g of this.guardioes) {
      this.projetilContra(g, () => g.takeHit(PLAYER.shot.damage));
    }

    // --- espinhos: estáticos em LVL-01, cíclicos em LVL-02 (`CEN-001`) ---
    if (this.built.spikes.length) {
      const spikes = this.physics.add.staticGroup();
      const pair = new Map<number, number>();
      this.built.spikes.forEach((s, i) => {
        const zone = this.add.zone(s.x, s.y - 15, TILE, 30);
        spikes.add(zone);
        const sprite = this.add.image(s.x, s.y, 'spike').setOrigin(0.5, 1).setDepth(12);
        // dois tiles vizinhos formam um par; pares alternados recebem 0,6 s de defasagem
        const group = Math.floor(s.x / (TILE * 2));
        if (!pair.has(group)) pair.set(group, pair.size);
        const phase = this.area.spikesCyclic && pair.get(group)! % 2 === 1 ? SPIKE_CYCLE.offsetMs : 0;
        this.spikeSlots.push({ zone, sprite, phase, dangerous: true });
        void i;
      });
      this.addOverlap(this.player, spikes, (_p, other) => {
        const slot = this.spikeSlots.find((s) => s.zone === other);
        if (!slot || !slot.dangerous) return;
        this.player.takeDamage(SPIKE.damage, this.difficulty, this.player.x + this.player.facing * -1);
      });
      if (!this.area.spikesCyclic) this.spikeSlots.forEach((s) => { s.sprite.setAlpha(1); });
    }

    // --- pontos de salvamento ---
    this.saveZones = this.physics.add.staticGroup();
    this.bauSprites = [];
    for (const s of this.built.saves) {
      this.saveZones.add(this.add.zone(s.x, s.y - 30, 110, 90));
      this.add.image(s.x, s.y, 'save').setOrigin(0.5, 1).setDepth(11);
      /*
       * `UI-07`: o baú fica **ao lado** do pilar de salvamento, no primeiro lado que for chão
       * (o `P` da grade pode estar encostado a uma parede). Se não houver chão de nenhum dos
       * dois lados, não há baú nesta sala — e o painel diz que não há, em vez de abrir um baú
       * que não se vê.
       */
      const lado = this.ladoLivreDoBau(s);
      if (lado !== 0) {
        const bau = this.add.image(s.x + lado * INVENTARIO.alcanceBau, s.y, 'chest')
          .setOrigin(0.5, 1).setDepth(11);
        this.bauSprites.push(bau);
      }
    }
    this.bauDisponivel = false;
    this.pushBau();

    // `MEC-004`: a bolsa da morte, se ficou nesta sala
    this.bolsaAnunciada = false;
    this.desenharBolsaDaSala();
    this.pushBolsa();

    // --- porta de senha (`MEC-006`): o glifo ocupa 3 tiles; desenha uma vez por coluna ---
    const drawnColumns = new Set<number>();
    for (const d of [...this.built.passwordDoors].sort((a, b) => b.y - a.y)) {
      const column = Math.round(d.x);
      if (drawnColumns.has(column)) continue;
      drawnColumns.add(column);
      this.add.image(d.x, d.y, 'door_password').setOrigin(0.5, 1).setDepth(11);
    }

    // --- itens de campo (ITM-001/002/003) ---
    this.itemZones = this.physics.add.staticGroup();
    for (const item of this.built.items) {
      if (this.collected.includes(item.id)) continue; // permanente: não volta depois de pego
      const zone = this.add.zone(item.x, item.y - 26, 46, 52);
      zone.setData('itemId', item.id);
      this.itemZones.add(zone);
      // `P-47`/§5.6: a recompensa do chefe só existe depois de vencê-lo
      if (item.id === 'ITM-007' && !this.bossDefeated) continue;
      const sprite = this.add.image(item.x, item.y - 26, ITEM_TEXTURE[item.id]).setDepth(14);
      zone.setData('sprite', sprite);
      this.tweens.add({ targets: sprite, y: sprite.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    // `LVL-12` §5.6 / §8: `ITM-011` **só existe** se `ENT-005` caiu. A luta é opcional,
    // e a recompensa é a única coisa do setor que depende de aceitá-la.
    const reward = room.bossReward;
    if (reward && this.forjadorDefeated && !this.collected.includes(reward.itm)) {
      const x = reward.tx * TILE + TILE / 2;
      const y = (reward.ty + 1) * TILE;
      const zone = this.add.zone(x, y - 26, 46, 52);
      zone.setData('itemId', reward.itm);
      this.itemZones.add(zone);
      const sprite = this.add.image(x, y - 26, ITEM_TEXTURE[reward.itm]).setDepth(14);
      zone.setData('sprite', sprite);
      this.tweens.add({ targets: sprite, y: sprite.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    this.addOverlap(this.player, this.itemZones, (_p, zone) => {
      const id = (zone as Phaser.GameObjects.Zone).getData('itemId') as ItemId | undefined;
      if (id) this.collectItem(zone as Phaser.GameObjects.Zone, id);
    });

    // --- textos de lore ---
    for (const t of this.built.texts) {
      const kind = t.lines.length > 2 ? 'board' : 'plaque';
      this.add.image(t.x, t.y - 40, kind).setOrigin(0.5, 1).setDepth(11);
    }

    this.setupCamera();

    /*
     * `UI-22` (`DEC-043`): **entrar numa sala é visitá-la**. É a única coisa que o mapa aprende
     * sozinho — e é o que faz dele um registo do jogador em vez de um ecrã de sistema.
     */
    if (!this.visitadas.includes(room.id)) this.visitadas.push(room.id);
    this.session = enterRoom(this.session, this.area.id, room.id, this.now());
    this.pushMetrics();
    EventBus.emit('scene:ready', { key: room.id });
    EventBus.emit('game:room', {
      id: room.id, name: room.name, index: this.roomIndex, total: this.rooms.length,
      area: this.area.name,
    });
    this.cameras.main.fadeIn(220, 21, 19, 31);
    // `UI-14`: o jogador é recriado a cada sala — os níveis comprados voltam a ser aplicados aqui
    this.aplicarNiveis();
    this.pushHud();
    this.pushInventory();
    this.pushBau();
  }

  /** Onde o jogador nasce em cada tipo de entrada. */
  private spawnPoint(side: SpawnSide, index: number): { x: number; y: number } {
    if (this.pendingSpawn) {
      const at = this.pendingSpawn;
      this.pendingSpawn = null;
      return at;                      // chegada do sumidouro (`CEN-034`), 3 tiles acima do piso
    }
    const floorY = 7 * TILE - 6;
    switch (side) {
      case 'west': return { x: TILE * 1.4, y: floorY };
      case 'east': return { x: this.built.worldWidth - TILE * 1.4, y: floorY };
      case 'ceiling': return { x: TILE * 4.5, y: floorY }; // §5.6: entrada pelo furo, spawn (4,6)
      default:
        // primeira sala da área usa o `S` do grid; as demais caem na entrada lateral
        return index === 0 && this.built.spawn ? this.built.spawn : { x: TILE * 1.4, y: floorY };
    }
  }

  /** Desmonta a sala anterior: colisores, grupos, display list e tweens. */
  private clearRoom(): void {
    this.resetHook();
    for (const c of this.colliders) this.physics.world.removeCollider(c);
    this.colliders = [];
    this.tweens.killAll();
    this.spikeSlots = [];
    this.ashTimer?.remove();
    this.ashTimer = undefined;
    this.sinkZones = undefined;
    this.triforiumZone = undefined;
    this.blockSprites = [];
    this.waterRect = undefined;
    this.blockGroup = undefined;
    this.pushing = false;
    this.boss = null;
    this.alferes = null;
    this.forjador = null;
    this.comandante = null;
    this.guardioes = [];
    this.plantonista = null;
    this.canalMs = 0;
    this.holeTiles = new Set<number>();
    this.holeSprites = [];
    this.crackSprite = undefined;
    this.stillTile = null;
    this.stillMs = 0;
    this.seals = 0;
    this.sealAt = 0;
    this.skyClock = 0;
    this.skyStart = 0;
    this.sky = 'luz';
    this.skySprites = [];
    this.lockBodies = [];
    this.updraftRects = [];
    this.updraftSprites = [];
    this.echoGhost = undefined;
    this.echoHistory = [];
    this.hammerSlots = [];
    this.hammerStart = 0;
    this.grateBodies = [];
    this.sandSprites = [];
    this.westClosed = false;
    this.ringSprites = [];
    this.ratSprites = [];
    this.hookRope = undefined;
    this.saveZones = undefined;
    this.itemZones = undefined;
    this.bauSprites = [];
    this.bauDisponivel = false;
    this.bolsaSprite = null;
    this.bolsaNaSala = false;
    this.cameras.main.stopFollow();
    this.children.removeAll(true);
  }

  /** Colisores são rastreados para a troca de sala poder desmontá-los. */
  private addCollide(
    a: Phaser.Types.Physics.Arcade.ArcadeColliderType,
    b: Phaser.Types.Physics.Arcade.ArcadeColliderType,
    cb?: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
    process?: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
  ): void {
    this.colliders.push(this.physics.add.collider(a, b, cb, process));
  }

  private addOverlap(
    a: Phaser.Types.Physics.Arcade.ArcadeColliderType,
    b: Phaser.Types.Physics.Arcade.ArcadeColliderType,
    cb: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
  ): void {
    this.colliders.push(this.physics.add.overlap(a, b, cb));
  }

  // ---------- montagem visual ----------

  private paintLevel(grid: readonly string[]): void {
    const h = grid.length;
    const w = grid[0].length;
    this.cameras.main.setBackgroundColor(PAL.bg);
    this.add.rectangle(0, 0, w * TILE, h * TILE, PAL.bg).setOrigin(0).setDepth(0);
    // halo de poeira no alto — paleta do setor, sem informação
    this.add.ellipse((w * TILE) / 2, 56, w * TILE * 0.72, 190, PAL.accent01, 0.022).setDepth(1);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = grid[y][x];
        const cx = x * TILE + TILE / 2;
        const cy = y * TILE + TILE / 2;
        if (ch === '#') {
          const above = y > 0 ? grid[y - 1][x] : '.';
          this.add.image(cx, cy, above === '#' ? 'stone' : 'stone_top').setDepth(10);
        } else if (ch === '=') {
          this.add.image(cx, cy, 'platform').setDepth(10);
        }
      }
    }
    for (const d of this.built.decor) {
      if (d.kind === 'rope') {
        // a corda é contínua: uma peça do teto ao piso, não um retângulo por tile
        this.add.image(d.x, d.y, 'rope').setOrigin(0.5, 1)
          .setDisplaySize(14, (d.tiles ?? 1) * TILE).setDepth(9);
        continue;
      }
      if (d.kind === 'vine') {
        // `CEN-085`: trepadeira **decor-front** — ela fica na frente do plano de jogo,
        // porque é sinalização: quem cai no vão precisa vê-la na beirada, não atrás
        this.add.image(d.x, d.y, 'vine').setOrigin(0.5, 1)
          .setDisplaySize(TILE * 0.5, TILE).setDepth(12);
        continue;
      }
      if (d.kind === 'flower') {
        // `CEN-086`: estala uma vez a cada 9 s (`AMBIENT.flowerPeriodMs`). Só som.
        const flor = this.add.image(d.x, d.y, 'flower').setOrigin(0.5, 1).setDepth(11);
        this.tweens.add({
          targets: flor, scaleX: { from: 1, to: 1.25 }, scaleY: { from: 1, to: 0.86 },
          duration: AMBIENT.flowerPeriodMs / 2, yoyo: true, repeat: -1, ease: 'Sine.inOut',
        });
        continue;
      }
      if (d.kind === 'duct') {
        // `CEN-088`: a boca do conduto — a arte é do decor, a zona é da `sink`
        this.add.image(d.x, d.y, 'duct').setOrigin(0.5, 1).setDepth(11);
        continue;
      }
      if (d.kind === 'chain') {
        // `CEN-094`: corrente pendurada — balança sem vento (§4.1). Existia em LVL-08 e
        // caía no `sigil` por engano; aqui tem forma própria.
        const corrente = this.add.image(d.x, d.y, 'chain').setOrigin(0.5, 1).setDepth(9);
        this.tweens.add({
          targets: corrente, angle: { from: -2, to: 2 },
          duration: 2600 + (d.x % 6) * 140, yoyo: true, repeat: -1, ease: 'Sine.inOut',
        });
        continue;
      }
      if (d.kind === 'well-mouth') {
        // `CEN-099` (§4.1/§8): a boca do poço e a queda longa — o mesmo buraco, dois papéis
        this.add.image(d.x, d.y, 'well_mouth').setOrigin(0.5, 1).setDepth(9);
        continue;
      }
      if (d.kind === 'echo') {
        // `CEN-095` (§5): a marca no piso é onde o abismo devolve o jogador. Não brilha,
        // não pulsa e não chama: é uma marca, como tudo neste setor.
        this.add.image(d.x, d.y, 'echo_mark').setOrigin(0.5, 1).setDepth(9).setAlpha(0.5);
        continue;
      }
      if (d.kind === 'anvil') {
        // `CEN-091`: a bigorna é o que o Forjador bate enquanto trabalha (§5.2)
        this.add.image(d.x, d.y, 'anvil').setOrigin(0.5, 1).setDepth(11);
        continue;
      }
      if (d.kind === 'wine-light') {
        // `LVL-16` §4.1: a luz vem **de cima**, do que está no fim do andar. Sem colisão e
        // sem som: ela é a única coisa quente em 134 tiles de pedra.
        const luz = this.add.image(d.x, d.y, 'wine_light').setOrigin(0.5, 1)
          .setDisplaySize(TILE * 1.5, TILE * 2.5).setDepth(16).setAlpha(0.7);
        this.tweens.add({
          targets: luz, alpha: { from: 0.5, to: 0.8 },
          duration: 2800 + (d.x % 5) * 180, yoyo: true, repeat: -1, ease: 'Sine.inOut',
        });
        continue;
      }
      if (d.kind === 'throne-broken') {
        // `CEN-114`: mobília danificada que ninguém trocou — e a última tecla do jogo (`MEC-012`)
        this.add.image(d.x, d.y, 'trono').setOrigin(0.5, 1)
          .setDisplaySize(TILE * 2, TILE * 2.5).setDepth(11);
        continue;
      }
      if (d.kind === 'slag-chute') {
        // `CEN-093`: a boca da calha — a zona é da `sink`, a arte é do decor
        this.add.image(d.x, d.y, 'slag_chute').setOrigin(0.5, 1).setDepth(11);
        continue;
      }
      const key = d.kind === 'k' ? 'crate' : d.kind === 'c' ? 'candle'
        : d.kind === 'b' ? 'pew' : d.kind === 'R' ? 'grate'
          : d.kind === 'sluice' ? 'sluice' : d.kind === 'lamp' ? 'lamp'
            : d.kind === 'rope' ? 'rope' : d.kind === 'torch' ? 'torch'
              : d.kind === 'well' ? 'well' : 'sigil';
      this.add.image(d.x, d.y, key).setOrigin(0.5, 1).setDepth(d.kind === 'k' ? 13 : 11);
    }
    for (const door of this.built.doors) {
      this.add.image(door.x, door.y, 'door').setOrigin(0.5, 1).setDepth(11);
    }
  }

  private setupCamera(): void {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, Math.max(this.built.worldWidth, VIEW.width), VIEW.height);
    cam.startFollow(this.player, true, 0.14, 0.14);
    cam.setDeadzone(180, 120);
  }

  private setupInput(): void {
    this.aplicarConfig(loadConfig());
    /*
     * `§4.6` — **nenhum toque se perde**. O `keydown` chega aqui e guarda um pulso; o `update`
     * consome-o (em `justDown`), mesmo que a tecla já tenha subido no frame seguinte. Sem isto, um
     * `tap` de `M`/`H`/`I` com menos de um frame caía na fissura do `JustDown` do Phaser.
     *
     * O pulso **não** é guardado com o jogo parado: uma cena pausada não corre o `update`, e o
     * pulso antigo abriria o painel sozinho ao retomar (o oposto do bug que se está a corrigir).
     */
    const aoPremir = (e: KeyboardEvent): void => {
      if (e.repeat) return;
      if (!this.scene.isActive() || this.scene.isPaused() || this.busy) return;
      const alvo = e.target as HTMLElement | null;
      if (alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA')) return;
      for (const acao of ACOES) {
        const nomes = this.atalhosTecla[acao] ?? [];
        // o nome do atalho é um nome do Phaser (`KeyCodes`), não uma tecla do DOM: comparam-se
        // os códigos, e um nome desconhecido simplesmente não corresponde a nada
        const codigos = Phaser.Input.Keyboard.KeyCodes as unknown as Record<string, number>;
        if (nomes.some((n) => codigos[n] === e.keyCode)) {
          this.virtualPulso.add(acao);
          return;
        }
      }
    };
    window.addEventListener('keydown', aoPremir);
    this.removerTeclado = () => window.removeEventListener('keydown', aoPremir);
    // `tipoControle: 'teclado'` desliga o clique como ataque — é a diferença entre os modos
    this.input.on('pointerdown', () => {
      if (this.tipoControle !== 'teclado') this.pointerAttack = true;
    });
    this.unsubs.push(EventBus.on('ui:input', ({ acao, pressed }) => {
      if (pressed) {
        this.virtuais.add(acao);
        this.virtualPulso.add(acao);        // o toque também precisa de "acabou de premir"
      } else {
        this.virtuais.delete(acao);
      }
    }));
    // o menu mudou a configuração com o jogo a correr (voltar ao menu → configurações)
    this.unsubs.push(EventBus.on('ui:settings', (p) => {
      this.reducedMotion = p.reducedMotion;
      if (p.legendas !== undefined) this.legendas = p.legendas;
    }));
    // `DEC-027`: sair para o menu grava **antes** de a cena ser destruída
    this.unsubs.push(EventBus.on('ui:persist', () => { void this.persist('transition'); }));
  }

  /**
   * Lê a configuração uma vez, no arranque da cena, e constrói as teclas a partir dela. Se o
   * jogador remapear e voltar ao menu, a cena é recriada e isto corre outra vez — uma fonte de
   * verdade, sem teclas "presas" de uma configuração antiga.
   */
  private aplicarConfig(cfg: Config): void {
    const kb = this.input.keyboard!;
    const nomes = [...new Set(Object.values(cfg.atalhos).flat())].join(',');
    const mapa = (nomes ? kb.addKeys(nomes) : {}) as Record<string, Phaser.Input.Keyboard.Key>;
    for (const acao of ACOES) {
      this.teclas[acao] = (cfg.atalhos[acao] ?? []).map((n) => mapa[n]).filter(Boolean);
    }
    this.atalhosTecla = cfg.atalhos;
    this.legendas = cfg.legendas;
    this.tipoControle = cfg.tipoControle;
    this.reducedMotion = cfg.movimentoReduzido;
  }

  /** `true` enquanto a ação estiver premida — teclado **ou** botão de toque. */
  private isDown(acao: AcaoJogo): boolean {
    return (this.teclas[acao] ?? []).some((k) => k.isDown) || this.virtuais.has(acao);
  }

  /** `true` no frame em que a ação foi premida. Consome o pulso virtual, como o `JustDown`. */
  private justDown(acao: AcaoJogo): boolean {
    const tecla = (this.teclas[acao] ?? []).some((k) => Phaser.Input.Keyboard.JustDown(k));
    // o pulso é **sempre** consumido: se o Phaser também viu a tecla, o pulso do DOM é o mesmo
    // toque, e ficar no `Set` faria a ação disparar duas vezes (o mapa a abrir e a fechar-se)
    const pulso = this.virtualPulso.delete(acao);
    return tecla || pulso;
  }

  /** `§4.6`: legenda do que só se ouviria. Só sai se as legendas estiverem ligadas. */
  private legenda(text: string, kind: 'info' | 'perigo' | 'marco' = 'info'): void {
    if (!this.legendas) return;
    EventBus.emit('game:subtitle', { text, kind });
  }

  /**
   * Volta a correr depois de um painel (pausa, senha, mochila).
   *
   * O `resetKeys` não é cosmético: **uma cena pausada não corre o `KeyboardPlugin`**, logo o
   * `keyup` da tecla que fechou o painel perde-se e ela fica `isDown: true` para o Phaser. A
   * tecla seguinte dessa mesma tecla não produz `JustDown` — e o jogador tinha de a carregar
   * duas vezes (`I` para abrir, `I` para fechar, `I` para abrir outra vez: silêncio).
   */
  private retomarJogo(): void {
    if (!this.scene.isPaused()) return;
    this.scene.resume();
    this.input.keyboard?.resetKeys();
    // o que foi premido **enquanto** estava parado foi tratado pelos painéis (ou ignorado): um pulso
    // antigo a sobreviver aqui abria o mapa outra vez sozinho ao voltar ao jogo
    this.virtualPulso.clear();
  }

  private setupEvents(): void {
    this.unsubs.push(EventBus.on('ui:pause', ({ paused }) => {
      if (paused) this.scene.pause(); else this.retomarJogo();
    }));
    // `VIS-009`: a preferência de movimento chega do save/UI e muda a queda e a silhueta
    this.unsubs.push(EventBus.on('ui:settings', ({ reducedMotion }) => {
      this.reducedMotion = reducedMotion;
      if (reducedMotion) this.echoGhost?.setVisible(false);
    }));
    this.unsubs.push(EventBus.on('ui:password', ({ symbols }) => this.tryPassword(symbols)));
    /*
     * `UI-07`: um só caminho para abrir a mochila, venha a tecla `I` ou o ícone do HUD. Abrir
     * pausa a cena (o jogo continua desenhado, o tempo para — como na porta de senha), fechar
     * retoma. Os dois sentidos emitem `game:inventario`, para a UI ter o estado autoritativo.
     */
    this.unsubs.push(EventBus.on('ui:inventario', ({ open }) => {
      if (open === this.inventarioAberto) return;
      this.inventarioAberto = open;
      if (open) this.scene.pause(); else this.retomarJogo();
      this.pushInventory();
      EventBus.emit('game:inventario', { open });
    }));
    /*
     * `UI-14`: o painel das habilidades. Mesmo mecanismo da mochila — abrir pausa a cena, fechar
     * retoma, e os dois sentidos emitem o estado para a UI não adivinhar.
     */
    this.unsubs.push(EventBus.on('ui:habilidades', ({ open }) => {
      if (open === this.habilidadesAberto) return;
      this.habilidadesAberto = open;
      if (open) this.scene.pause(); else this.retomarJogo();
      EventBus.emit('game:habilidades-painel', { open });
      if (open) this.pushHabilidades();
    }));
    /*
     * `UI-22`: o mapa. Mesmo mecanismo de pausa da mochila e das habilidades — um só no jogo — e o
     * mesmo contrato nos dois sentidos: a UI pede, a cena responde com o estado real.
     */
    this.unsubs.push(EventBus.on('ui:mapa', ({ open }) => {
      if (open) {
        /*
         * A pausa é idempotente, **a resposta não**: `mapaAberto` serve para não pausar duas
         * vezes, mas não pode engolir o pedido do jogador. Antes, um `open === mapaAberto`
         * desencontrado (a UI achava o mapa fechado e a cena achava-o aberto) fazia o `return`
         * antes de `pushMapa` — a UI ficava à espera de um payload que nunca vinha e o painel
         * aparecia vazio, ou não aparecia. O mapa pedido é o mapa entregue.
         */
        if (!this.mapaAberto) {
          this.mapaAberto = true;
          this.scene.pause();
        }
        // a **confirmação** vai sempre: é ela que faz o painel aparecer. Guardá-la atrás de um
        // `!mapaAberto` deixava o jogo pausado com o painel fechado — o pior dos dois mundos.
        EventBus.emit('game:mapa-painel', { open: true });
        this.pushMapa();
      } else if (this.mapaAberto) {
        this.mapaAberto = false;
        this.retomarJogo();
        EventBus.emit('game:mapa-painel', { open: false });
      }
    }));
    // `UI-14`: comprar um nível. Quem decide é a regra pura (`core/melhorias`); a cena aplica.
    this.unsubs.push(EventBus.on('ui:habilidade-command', ({ habilidade }) => {
      this.comprarMelhoria(habilidade);
    }));
    // `EVT-009`: prender/soltar são intenções da UI; quem decide é a cena (`core/inventory`)
    this.unsubs.push(EventBus.on('ui:inventory-command', ({ action, itemId }) => {
      if (!itemId) return;
      this.commandInventory(action, itemId);
    }));
    // `UI-07`: o baú. Só se mexe nele com o herói ao alcance — a UI não é um teletransporte.
    this.unsubs.push(EventBus.on('ui:bau-command', ({ action, itemId, quantidade }) => {
      if (!this.bauDisponivel) {
        EventBus.emit('game:toast', { text: 'APROXIME-SE DO BAÚ.' });
        return;
      }
      this.commandBau(action, itemId, quantidade);
    }));
    // `MEC-008`: aceitar a oferta só rebaixa a dificuldade, nunca sobe
    this.unsubs.push(EventBus.on('ui:difficulty', ({ difficulty }) => {
      this.difficulty = difficulty;
      this.session = addDifficultyChange(this.session);
      EventBus.emit('game:toast', { text: `DIFICULDADE · ${difficulty.toUpperCase()}` });
      this.pushHud();
    }));
    // fechar o painel (SAIR, ESC ou acerto) devolve o controle ao jogo
    this.unsubs.push(EventBus.on('game:password', ({ open }) => {
      if (!open) this.retomarJogo();
    }));
    /**
     * `DEC-027` — **duas** saídas para a mesma limpeza. `shutdown` cobre troca de cena; `destroy`
     * cobre o `game.destroy(true)` que o menu faz ao voltar para a tela inicial — e o
     * `Systems.destroy` do Phaser **não** emite `shutdown`. Sem esta segunda linha, cada ida ao
     * menu deixava assinaturas vivas apontando para uma cena morta, e o `ESC` do jogo seguinte
     * rebentava num `queueOp` de `this.scene` nulo.
     */
    const limpar = (): void => {
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
      this.removerTeclado?.();
      this.removerTeclado = undefined;
    };
    this.events.once('shutdown', limpar);
    this.events.once('destroy', limpar);
  }

  // ---------- loop ----------

  update(time: number, delta: number): void {
    if (this.busy) return;
    const input = this.readInput();
    this.player.update(time, input);
    this.updateSpikes(time);

    this.sentinels.children.each((child) => {
      const s = child as unknown as SentinelaOuComum;
      if (s.active) {
        s.update(time, this.player);
        /*
         * O dano é **do corpo** (`s.dano`), não uma constante: o voador de LVL-01 causa 10 e a
         * Sentinela 20, e a cena não pode ter opinião sobre isso (`PAT-C-04`).
         */
        if (s.dangerous && this.overlapsPlayer(s)) {
          this.player.takeDamage((s as { dano?: number }).dano ?? SENTINEL.damage, this.difficulty, s.x);
        }
        // quem atira largo um projétil por ataque — uma vez, nunca em cada frame do ataque
        if (s instanceof Comum && s.deveAtirar()) this.dispararDe(s);
      }
      return true;
    });

    if (this.alferes && this.alferes.alive) {
      this.alferes.update(time, this.player.x);
      this.alferes.clampTo(TILE * 2, this.built.worldWidth - TILE * 2);
      if (this.alferes.dangerous && this.overlapsSprite(this.alferes)) {
        // `ATK-04` (sabre) × `ATK-06` (eco): o dano do eco é menor (§5.1)
        const dano = this.alferes.state === 'eco' ? ALFERES.echoDamage : ALFERES.damage;
        this.player.takeDamage(dano, this.difficulty, this.alferes.x);
      }
      if (this.alferes.echo) {
        const e = this.alferes.echo;
        const noEco = this.player.x >= e.from && this.player.x <= e.to;
        // o eco só machuca quem está no chão: pular é resposta legítima (§7.1)
        if (noEco && this.player.grounded && this.player.y - 40 > TILE * 5) {
          this.player.takeDamage(ALFERES.echoDamage, this.difficulty, e.from);
        }
      }
    }

    // `LVL-13` §6.2: a cena informa a região; quem decide subir é a corrente (Player)
    this.player.updraftZone = this.updraftRects.length > 0 && (() => {
      const b = this.player.body as Phaser.Physics.Arcade.Body;
      return this.updraftRects.some((r) => inUpdraft(r, b.center.x, b.center.y));
    })();
    this.updateEcho(time);

    if (this.forjador && this.forjador.alive) {
      this.updateForjador(time);
    }
    if (this.comandante && this.comandante.alive) {
      this.updateComandante(time);
    }
    // `LVL-15` §5: o **par** — um corpo caído não fecha a luta
    if (this.guardioes.length && !this.guardiaoDefeated) {
      this.updateGuardioes(time);
    }
    // `LVL-16` §5: **o chefe sem vida** — postura, baixas e a grade que abre por assinatura
    if (this.plantonista) this.updatePlantonista(time);
    // `CEN-113` §5.6: o Caos é o chão — dano 0 e no máximo 2 tiles contíguos
    if (this.built.desgaste) this.updateDesgaste(time);
    // `CEN-100`: o céu corre em **relógio próprio** e o chefe reage a ele (§7.2)
    this.updateEclipse();
    this.updateHammers(time);

    if (this.boss && this.boss.alive) {
      this.boss.update(time, this.player.x);
      this.boss.clampTo(TILE * 3, this.built.worldWidth - TILE * 2);
      if (this.boss.dangerous && this.overlapsBoss(this.boss)) {
        this.player.takeDamage(BOSS.damage, this.difficulty, this.boss.x);
      }
    }

    this.updateWater(delta);
    this.updateSand(delta);
    this.updateArena();
    this.updateBlocks(time);

    if (this.justDown('interagir')) {
      // `MEC-012` §7.2: o último ato do jogo é uma tecla — e ele vem **antes** de tudo
      if (this.tryThrone()) { void time; return; }
      if (this.tryDispenser()) { void time; return; }
      if (this.tryLongFall()) { void time; return; }
      if (this.trySink()) { void time; return; }
      if (this.tryElevator()) { void time; return; }
      if (this.tryHoist()) { void time; return; }
      if (this.nearPasswordDoor()) this.askPassword();
      // `MEC-004`: a bolsa da morte vem **primeiro** — é o que o jogador veio buscar, e o gesto
      // não pode ser ambíguo com o baú ou o pilar ao lado.
      else if (this.bolsaNaSala && this.pertoDaBolsa()) this.recolherBolsa();
      // `UI-07`: o baú tem prioridade sobre o pilar — é o alvo mais próximo quando se está nele,
      // e o `E` do pilar continua a salvar assim que o herói se afasta do baú.
      else if (this.bauDisponivel) this.abrirBau();
      else if (this.nearSavePoint()) this.interactSave();
      else this.showNearbyText();
    }
    this.updateClimbWall(time);
    if (this.justDown('gancho')) this.tryGrapple();
    this.updateHookRope();
    if (this.justDown('pausar')) EventBus.emit('ui:pause', { paused: true });
    // `UI-07`: a mochila. A tecla é lida aqui (e não na UI) porque é remapeável como as outras.
    if (this.justDown('inventario')) EventBus.emit('ui:inventario', { open: true });
    // `UI-14`: as habilidades também têm tecla própria (remapeável, padrão `H`)
    if (this.justDown('habilidades')) EventBus.emit('ui:habilidades', { open: true });
    // `UI-22`: e o mapa (remapeável, padrão `M`)
    if (this.justDown('mapa')) EventBus.emit('ui:mapa', { open: true });
    this.updateBau();
    this.updateBolsa();

    this.checkTriforium();
    this.checkTransition(time);

    if (time - this.lastHudAt > 100) { this.lastHudAt = time; this.pushHud(); }
    this.pointerAttack = false;
  }

  /** `CEN-001` cíclico: 1,2 s ativo / 1,2 s inativo, com telegraph de 300 ms (§6). */
  private updateSpikes(time: number): void {
    if (!this.area.spikesCyclic) return;
    const cycle = SPIKE_CYCLE.activeMs + SPIKE_CYCLE.inactiveMs;
    for (const slot of this.spikeSlots) {
      const t = (time + slot.phase) % cycle;
      const active = t < SPIKE_CYCLE.activeMs;
      const telegraph = !active && t > cycle - SPIKE_CYCLE.telegraphMs;
      slot.dangerous = active;
      slot.sprite.setAlpha(active ? 1 : telegraph ? 0.62 : 0.28);
      slot.sprite.setScale(1, active ? 1 : 0.35);
    }
  }

  /**
   * `DEC-049`: **a tecla de subir existe e não é a de pular.**
   *
   * `W` e `↑` continuam a pertencer à ação `pular` (no chão é pulo, e é isso que `MEC-001`
   * promete), mas pendurado numa parede eles são **subir**. A leitura é feita nas teclas físicas
   * e não na ação, porque é exatamente essa distinção que faltava: uma ação não pode significar
   * duas coisas no mesmo estado e ser lida por um único booleano.
   */
  private subindoNaParede(): boolean {
    // as teclas da ação `pular` **já resolvidas** pela configuração: remapear o pulo remapeia a
    // subida, e é isso que impede as duas de divergirem quando o jogador muda as teclas
    return (this.teclas.pular ?? []).some((k) => k.isDown);
  }

  private readInput(): InputState {
    const pulando = this.isDown('pular');
    return {
      left: this.isDown('esquerda'),
      right: this.isDown('direita'),
      // nadar para cima usa a ação do pulo; **escalar tem eixo próprio** (`DEC-049`)
      up: pulando,
      down: this.isDown('descer'),
      /*
       * `DEC-049` — o relato de L10-05 («não sobe, virou uma parede») nasceu aqui: `up` era o
       * pulo, e o pulo agarrado é o **salto de parede**. O eixo vertical da escalada lê `W`/`↑`
       * (subir) e `S`/`↓` (descer) diretamente, e o `ESPAÇO` fica para o salto de parede.
       */
      climbUp: this.subindoNaParede(),
      climbDown: this.isDown('descer'),
      run: this.isDown('correr'),
      jumpHeld: pulando,
      jumpPressed: this.justDown('pular'),
      attackPressed: this.justDown('atacar') || this.pointerAttack,
      shootPressed: this.justDown('disparar'),
    };
  }

  private overlapsBoss(boss: Boss): boolean {
    const a = this.player.body as Phaser.Physics.Arcade.Body;
    const b = boss.body as Phaser.Physics.Arcade.Body;
    return a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
  }

  private overlapsSprite(sprite: Phaser.Physics.Arcade.Sprite): boolean {
    const a = this.player.body as Phaser.Physics.Arcade.Body;
    const b = sprite.body as Phaser.Physics.Arcade.Body;
    return a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
  }

  // ---------- `LVL-10`: a escalada (`HAB-03`) e o alçapão ----------

  /**
   * Diz ao jogador em que lado há parede **agarrável** (`CEN-080`) e se o input empurra
   * para dentro dela. Só a região `climbable` conta: parede comum não agarra, e é essa
   * diferença que faz o sinal de `PAT-LD-03` funcionar (`LVL-10` §7.1).
   */
  private updateClimbWall(time: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const encostando = (lado: -1 | 1): boolean => {
      const px = lado < 0 ? body.left - 2 : body.right + 2;
      return this.built.climbables.some((c) =>
        px >= c.x && px <= c.x + c.width && body.bottom > c.y && body.top < c.y + c.height);
    };
    const esquerda = body.blocked.left || body.touching.left;
    const direita = body.blocked.right || body.touching.right;
    const cru: -1 | 1 | 0 = esquerda && encostando(-1) ? -1 : direita && encostando(1) ? 1 : 0;
    /*
     * `DEC-049` — **memória de contacto.** Subir afasta o corpo da parede por alguns pixels, e sem
     * esta memória o `encostando` voltava a `false` no quadro seguinte: a garra largava e o herói
     * caía. O contacto vale `CLIMB.contactRefreshMs` depois de o corpo deixar de tocar.
     */
    if (cru !== 0) {
      this.paredeContato = cru;
      this.paredeContatoAte = time + CLIMB.contactRefreshMs;
    }
    const recente = time <= this.paredeContatoAte ? this.paredeContato : 0;
    const side: -1 | 1 | 0 = cru !== 0 ? cru : (this.player.climb === 'cling' ? recente : 0);
    const empurrando = (side === -1 && this.isDown('esquerda')) || (side === 1 && this.isDown('direita'));
    this.player.updateClimbCandidate(side, empurrando, time);
  }

  // ---------- `LVL-09`: o gancho (`HAB-04`) ----------

  /**
   * `Q` usa o gancho. O alvo vem de `core/hook.pickRing`: só argola, só no hemisfério
   * superior, e a mais próxima na direção em que o herói olha (`LVL-09` §6.2).
   */
  private tryGrapple(): void {
    if (!this.player.abilities.hook || this.player.hook !== 'none' || this.busy) return;
    const alvo = pickRing(
      this.built.rings, this.player.x, this.player.y - PLAYER.body.height / 2,
      this.player.facing, HOOK.reachTiles * TILE * this.bonusDeNiveis().hook,
    );
    if (!alvo) {
      // sem alvo: não gasta nada e não mente — a argola é o único alvo válido
      EventBus.emit('game:toast', { text: 'NENHUMA ARGOLA NO ALCANCE.' });
      return;
    }
    this.player.grapple(alvo);
    EventBus.emit('game:toast', { text: 'PUXA!' });
  }

  /** Cabo da puxada (`VIS-013`): desenhado só enquanto o estado é `pull`. */
  private updateHookRope(): void {
    const g = this.hookRope;
    if (!g) return;
    g.clear();
    const alvo = this.player.hookTarget;
    if (this.player.hook !== 'pull' || !alvo) return;
    g.lineStyle(3, 0x7d8590, 0.9);
    g.lineBetween(this.player.x, this.player.y - PLAYER.body.height / 2, alvo.x, alvo.y);
  }

  /** Solta o gancho em qualquer troca de sala, morte ou respawn (`TST-005`, §6.2). */
  private resetHook(): void {
    // `clearRoom` roda no primeiro mount, antes de existir jogador
    const p = this.player as Player | undefined;
    p?.releaseHook();
    p?.releaseClimb();
    p?.releaseGlide();          // `HAB-07` não atravessa troca de sala pendurado no pano
    this.hookRope?.clear();
  }

  // ---------- `LVL-08`: areia, âncoras, grades e monta-carga ----------

  /** Pinta um retângulo de areia em tiles de 64 px (`CEN-064`, sem colisão). */
  private paintSand(x: number, y: number, width: number, height: number): void {
    for (let ty = y; ty < y + height; ty += TILE) {
      for (let tx = x; tx < x + width; tx += TILE) {
        this.sandSprites.push(
          this.add.image(tx + TILE / 2, ty + TILE - 4, 'sand').setOrigin(0.5, 1).setDepth(7),
        );
      }
    }
  }

  /** Retângulos de areia ativos agora: os da ficha + as âncoras já acordadas. */
  private currentSand() {
    const base = this.built.sand.map((r) => ({
      from: Math.round(r.x / TILE), to: Math.round(r.x / TILE) + Math.round(r.width / TILE) - 1,
      topRow: Math.round(r.y / TILE), bottomRow: Math.round(r.y / TILE) + Math.round(r.height / TILE) - 1,
    }));
    const colunas = this.built.anchors.map((a) => Math.round((a.x - TILE / 2) / TILE));
    return activeSand(base, colunas, this.sandClock.anchors, SAND.floorRow, SAND.anchorTiles);
  }

  /**
   * `LVL-08` §7.1: areia = 0,75× **no chão**. O relógio só corre com o Alferes vivo:
   * ele é do pátio, mas só existe durante a luta (§5.2).
   */
  private updateSand(delta: number): void {
    const vivo = Boolean(this.alferes && this.alferes.alive);
    if (vivo) {
      const antes = this.sandClock.anchors;
      const passo = stepSandClock(this.sandClock, delta);
      if (passo.state.phase !== this.alferes?.phase && this.alferes?.phase === 2) {
        this.sandClock = enterPhase2(passo.state);
      } else {
        this.sandClock = passo.state;
      }
      // cada âncora que acorda pinta o próprio retângulo (`ATK-05`)
      for (let i = antes; i < this.sandClock.anchors; i++) {
        const coluna = Math.round((this.built.anchors[i]?.x ?? 0) / TILE);
        this.paintSand((coluna - 1) * TILE, (SAND.floorRow - 1) * TILE, SAND.anchorTiles * TILE, TILE);
        EventBus.emit('game:toast', { text: 'A AREIA RESPONDE' });
      }
    }

    // `player.y` é o pé: o retângulo termina exatamente nele, então lemos 4 px acima
    const naAreia = pointInSand(this.currentSand(), this.player.x, this.player.y - 4, TILE);
    this.player.speedMultiplier =
      groundSpeedMultiplier(naAreia, this.player.grounded, SAND.speedMultiplier);
  }

  /** `CEN-065`: a grade oeste fecha atrás do jogador quando ele cruza `x ≥ 3` (§5.4). */
  private updateArena(): void {
    if (!this.grateBodies.length) return;
    if (!this.westClosed && this.player.x >= ARENA.westClosesAtTile * TILE) {
      this.westClosed = true;
      const oeste = this.built.grates.find((g) => g.side === 'west');
      const corpo = this.grateBodies[0];
      if (oeste && corpo) {
        this.addCollide(this.player, corpo);
        this.tweens.add({ targets: this.children.list.filter((c) => (c as Phaser.GameObjects.Image).texture?.key === 'arena_grate' && (c as Phaser.GameObjects.Image).x < this.built.worldWidth / 2), alpha: 1, duration: ARENA.grateDropMs });
        this.cameras.main.shake(160, 0.004);
      }
    }
  }

  /** `ATK-05`: o chamado da areia acorda uma âncora já (`LVL-08` §5.3). */
  private callSand(): void {
    if (!this.built.anchors.length) return;
    const antes = this.sandClock.anchors;
    const passo = stepSandClock(this.sandClock, 10_000);
    this.sandClock = passo.state;
    for (let i = antes; i < this.sandClock.anchors; i++) {
      const coluna = Math.round((this.built.anchors[i]?.x ?? 0) / TILE);
      this.paintSand((coluna - 1) * TILE, (SAND.floorRow - 1) * TILE, SAND.anchorTiles * TILE, TILE);
    }
    if (this.sandClock.anchors > antes) EventBus.emit('game:toast', { text: 'A AREIA RESPONDE' });
  }


  /**
   * `LVL-12` §5.3: os três ataques, cada um com a resposta certa e **um canal de leitura
   * diferente** (`VIS-009`): corrente branca à altura do peito (pular), peça em brasa na
   * altura do peito (lado), onda vermelha no piso (sair do chão).
   */
  private updateForjador(time: number): void {
    const f = this.forjador;
    if (!f || !f.alive) return;
    const piso = 7 * TILE;
    const altura = (this.player.body as Phaser.Physics.Arcade.Body).height;

    f.update(time, this.player.x, this.player.grounded, piso);
    // §5.1: ele não persegue nem sai do posto de trabalho (`leashX = 21`)
    f.clampTo(TILE * 3, FORJADOR.leashX * TILE);

    // `ATK-10` corrente: só na execução, e só a quem está no piso ou dentro do arco
    if (f.dangerous && (this.player.grounded || f.state === 'golpe')) {
      if (inForgeArc(f.x, this.player.x < f.x ? -1 : 1, FORJADOR.arc.px, this.player.x)) {
        this.player.takeDamage(FORJADOR.arc.damage, this.difficulty, f.x);
      }
    }

    // `ATK-11` peça em brasa: viaja na altura do peito — **pular não resolve** (§5.3)
    if (f.piece && pieceHitsPlayer(f.piece.x, f.piece.y, this.player.x, this.player.y, altura)) {
      this.player.takeDamage(FORJADOR.piece.damage, this.difficulty, f.piece.x);
    }

    // `ATK-12` onda de bigorna: o frente anda pelo piso; quem saiu do chão não leva
    const frente = f.waveFront;
    if (frente !== null && this.player.grounded && this.player.y >= piso - 8) {
      const desde = f.wave;
      if (desde && frente >= desde.from && frente <= desde.to
        && Math.abs(this.player.x - frente) <= TILE * 0.6) {
        this.player.takeDamage(FORJADOR.wave.damage, this.difficulty, frente);
      }
    }
  }


    /**
   * `DEC-016` (§8.2): **chave é contador, não item.** O contador é derivado dos itens de chefe
   * já recolhidos — não existe estado novo, e por isso não há como dessincronizar. Os dois
   * chefes obrigatórios dão exatamente 2; `ITM-011` (LVL-12) é a **sobra** e não abre nada.
   */
  private get bossKeys(): number {
    return KEY_ITEMS.filter((id) => this.collected.includes(id)).length;
  }

  /**
   * `CEN-100` o eclipse (§7). O desenho tem duas partes e **só uma delas pode escurecer**:
   * o céu (`decor-front`, alpha de `ECLIPSE.skyAlpha`) e a sombra do piso, que fica em
   * `floorAlpha` — o piso continua legível, porque `TST-014` reprova se ele não continuar
   * (§5.3, `VIS-004`). O disco anda no céu em 8 s e some em `reduce_motion`.
   */
  private paintEclipse(): void {
    const w = this.built.worldWidth;
    const noite = this.add.rectangle(w / 2, this.built.worldHeight / 2, w, this.built.worldHeight,
      PAL.ink, 0).setDepth(24);
    const disco = this.add.image(w * 0.45, TILE * 1.6, 'eclipse_disc')
      .setDepth(23).setScale(0.9).setAlpha(0.85);
    this.skySprites.push(noite, disco);
    if (this.reducedMotion) disco.setVisible(false);
  }

  /**
   * `CEN-100`: um passo do relógio do céu. O chefe **reage** (luz → `ATK-13`, sombra →
   * `ATK-14`), nunca o contrário — e o relógio **para** quando ele morre (§7.2, §7.4).
   */
  private updateEclipse(): void {
    if (!this.current.eclipse) return;
    // Sem chefe na sala (L14-01..04, 06) o céu **não para**: quem obedece a ele é `ENT-006`, e
    // nas outras salas não há ninguém para morrer (§7.5 tempo 1). Só a morte dele congela o
    // relógio — daí a leitura de `comandanteDefeated`, e não de `comandante?.alive`.
    const para = eclipseStops(ECLIPSE.stopsOnBossDeath, !this.comandanteDefeated);
    // §7.4: parado, o céu **fica onde está** — o relógio congela, não reinicia
    if (!para) this.skyClock = Math.max(0, this.now() - this.skyStart);
    const estado = skyAt(this.skyClock, this.comandante?.phase ?? 1, ECLIPSE);
    const antes = this.sky;
    this.sky = estado.sky;

    const noite = this.skySprites[0] as Phaser.GameObjects.Rectangle | undefined;
    const disco = this.skySprites[1] as Phaser.GameObjects.Image | undefined;
    if (noite) {
      const alvo = this.sky === 'sombra' ? ECLIPSE.skyAlpha : 0;
      noite.setAlpha(Phaser.Math.Linear(noite.alpha, alvo, 0.06));
      noite.setFillStyle(PAL.ink, noite.alpha);
    }
    if (disco) {
      // o disco atravessa o céu no ciclo inteiro: o jogador vê o tempo sem HUD
      const ciclo = ECLIPSE.cycleMs;
      const frac = ((this.skyClock % ciclo) + ciclo) % ciclo / ciclo;
      disco.x = this.built.worldWidth * (0.15 + frac * 0.7);
      disco.setAlpha(this.sky === 'sombra' ? 0.95 : 0.6);
      if (this.reducedMotion) disco.setVisible(false);
    }

    this.comandante?.setSky(this.sky);

    // `VIS-009`: o cue de transição é **curto e por posição**, não só visual (§Handoff)
    if (antes !== this.sky) {
      EventBus.emit('game:toast', {
        text: this.sky === 'sombra' ? 'A LUZ ACABA.' : 'A LUZ VOLTA.',
      });
      // §5.5: na fase 2 o aviso vai para `aria-live` — quem não vê o céu precisa saber
      if (this.sky === 'sombra' && this.comandante?.phase === 2) {
        EventBus.emit('game:toast', { text: ECLIPSE.announce });
      }
    }
  }

  /**
   * `LVL-14` §5.3: a estocada (`ATK-13`) só existe na luz e a lança (`ATK-14`) só na sombra.
   * **Pular não resolve a estocada** — a lança passa na altura do quadril e o corpo do jogador
   * tem 160 px: a resposta é sair de linha (§6.5). A lança arremessada é visível por 900 ms.
   */
  private updateComandante(time: number): void {
    const c = this.comandante;
    if (!c || !c.alive) return;
    const piso = 7 * TILE;
    c.update(time, this.player.x, piso);
    // §6.5: ele **nunca** muda de x. A trava está na entidade; aqui fica a asserção da cena.
    if (Math.abs(c.x - c.homeX) > 0.5) c.x = c.homeX;

    if (c.dangerous) {
      const naFrente = (this.player.x - c.x) * (c.flipX ? 1 : -1) > -TILE * 0.5;
      if (naFrente && Math.abs(this.player.x - c.x) <= c.lungeReachPx) {
        this.player.takeDamage(COMANDANTE.lunge.damage, this.difficulty, c.x);
      }
    }

    if (c.spear) {
      const corpo = this.player.body as Phaser.Physics.Arcade.Body;
      const perto = Math.abs(c.spear.x - corpo.center.x) <= TILE * 0.6
        && Math.abs(c.spear.y - corpo.center.y) <= TILE * 0.9;
      if (perto) {
        // guardar o `x` **antes**: `consumeSpear` zera `c.spear`, e ler o campo depois estourava
        const x = c.spear.x;
        c.consumeSpear();
        this.player.takeDamage(COMANDANTE.spear.damage, this.difficulty, x);
      }
    }
  }

  /**
   * `MEC-009` de `ENT-006` (§5.6). **`keys` não muda aqui** (§8.3, desvio 8): a chave que o
   * portão conta vem dos dois chefes obrigatórios. Ele entrega a lança e o posto, não a chave.
   */
  private onComandanteDefeated(): void {
    this.comandanteDefeated = true;
    // `CEN-101` (§4.6): o monta-carga só existe depois do chefe — é o mesmo sinal que LVL-08 usa
    this.bossDefeated = true;
    // `PAT-LD-07`: a grade quebra e L14-06 abre
    this.built.eastOpen = true;
    const leste = this.built.grates.find((g) => g.side === 'east');
    if (leste) {
      for (const obj of [...this.children.list]) {
        const img = obj as Phaser.GameObjects.Image;
        if (img.texture?.key === 'arena_grate' && img.x > this.built.worldWidth / 2) img.destroy();
      }
      const corpo = this.grateBodies[this.grateBodies.length - 1];
      if (corpo) { this.physics.world.removeCollider(corpo as never); corpo.destroy(); }
    }
    EventBus.emit('game:toast', { text: 'O POSTO VAGOU' });
    EventBus.emit('game:text', {
      lines: [COMANDANTE.name, `"${COMANDANTE.lines.death}"`, 'A GRADE CEDE.'], hold: true,
    });
    this.time.delayedCall(2400, () => EventBus.emit('game:text', null));
    this.ganharMoedas(MOEDAS.porChefe);
    // `DEC-042`: **todo** chefe derrotado é uma tentativa de drop raro (`core/drop`)
    this.aoMatarChefe();
    this.session = endFight(this.session, this.now(), true, 0);
    this.pushBoss();
    this.pushMetrics();
    void this.persist('transition');
  }

  /**
   * `LVL-15` §5: o par. Três regras, e a primeira é a que dá nome ao setor:
   *
   * 1. **um corpo caído não é morte** — o sobrevivente **recua** (8+ tiles) e canaliza 4 s;
   * 2. **`MEC-009` exige os dois** a 0 HP dentro da mesma janela, e a revivificação é
   *    **infinita**: punição limitada ensinaria o jogador a esperar (§5.5);
   * 3. **dois selos suspendem** o jogador por 800 ms — e nunca mais que isso (`P-70`).
   */
  private updateGuardioes(time: number): void {
    if (!this.guardioes.length) return;
    const piso = 7 * TILE;
    for (const g of this.guardioes) {
      const parceiro = this.guardioes.find((o) => o !== g);
      g.update(time, this.player.x, parceiro ? parceiro.x : g.x, piso);
    }

    // a reação do parceiro: quem está de pé e vê o outro caído começa a canalizar
    const caidos = this.guardioes.filter((g) => g.felled);
    const dePé = this.guardioes.filter((g) => g.alive && !g.felled);
    if (caidos.length === 1 && dePé.length === 1 && dePé[0].state !== 'canalizando') {
      dePé[0].startRevive(time);
    }

    // a lanterna: arco de 4 tiles, **só na execução** (§5.3)
    for (const g of this.guardioes) {
      if (!g.dangerous) continue;
      const dist = Math.abs(this.player.x - g.x);
      const naFrente = (this.player.x - g.x) * (g.flipX ? 1 : -1) > -TILE * 0.5;
      if (naFrente && dist <= GUARDIAO.lantern.px) {
        this.player.takeDamage(g.lanternDamage, this.difficulty, g.x);
      }
    }
    // o selo solto também existe fora da execução: ele voa depois do golpe
    for (const g of this.guardioes) {
      if (!g.seal || g.dangerous) continue;
      const corpo = this.player.body as Phaser.Physics.Arcade.Body;
      const perto = Math.abs(g.seal.x - corpo.center.x) <= TILE * 0.7
        && Math.abs(g.seal.y - corpo.center.y) <= TILE * 0.9;
      if (perto) {
        // guardar o `x` **antes**: `consumeSeal` zera `g.seal` (o mesmo tropeço da lança
        // do Comandante em LVL-14 — ler o campo depois estoura e mata o loop de update)
        const x = g.seal.x;
        g.consumeSeal();
        this.player.takeDamage(g.sealDamage, this.difficulty, x);
        this.addPlayerSeal(time);
      }
    }

    // §5.3: dois selos seguram — um selo só aparece no HUD e expira sozinho
    if (this.seals > 0 && sealExpired(time - this.sealAt, GUARDIAO.sealLifeMs)) {
      this.seals = 0;
      EventBus.emit('game:seals', { seals: 0, label: sealLabel(0) });
    }
    const suspender = suspensionMs(this.seals, {
      introMs: GUARDIAO.introMs, lanternWindupMs: GUARDIAO.bodyWindupMs,
      lanternMs: GUARDIAO.lanternMs, lanternRecoverMs: GUARDIAO.lanternRecoverMs,
      sealWindupMs: GUARDIAO.sealWindupMs, sealFlightMs: GUARDIAO.sealFlightMs,
      sealRecoverMs: GUARDIAO.sealRecoverMs, reviveMs: GUARDIAO.reviveMs,
      interruptDamage: GUARDIAO.interruptDamage, suspendMaxMs: GUARDIAO.suspendMs,
    });
    if (suspender > 0 && this.seals === 2 && !this.player.suspended) {
      this.player.suspend(suspender);
      EventBus.emit('game:seals', { seals: 2, label: sealLabel(2), suspended: true });
      // §5.3: o cue de suspensão é o **silêncio** — quando o som para, ele está suspenso
      this.seals = 0;
      this.sealAt = time;
    }

    // `MEC-009` (§5.6): **só** com os dois a 0 HP. Um corpo vivo nunca fecha a luta.
    if (!this.guardiaoDefeated && duoDefeated(this.guardioes[0].hp, this.guardioes[1].hp)) {
      this.onGuardiaoDefeated();
    }
  }

  /** `ATK-17`: cada corpo aplica **um** selo; o HUD conta `1 / 2` e `2 / 2` (§5.3). */
  private addPlayerSeal(time: number): void {
    this.seals = addSeal(this.seals);
    this.sealAt = time;
    EventBus.emit('game:seals', { seals: this.seals, label: sealLabel(this.seals) });
  }

  /**
   * `MEC-009` de `ENT-007` (§5.6): os dois carimbam o próprio avental e sentam. **`keys += 1`**
   * aqui (`DEC-016`): é a terceira chave, e é ela que vira a sobra da placa de LVL-14.
   */
  private onGuardiaoDefeated(): void {
    this.guardiaoDefeated = true;
    this.bossDefeated = true;
    this.built.eastOpen = true;
    // `MEC-009` (§5.6): **os dois** morrem juntos — nenhum corpo é ressuscitado na derrota
    for (const g of this.guardioes) g.markDead(this.now());
    const leste = this.built.grates.find((g) => g.side === 'east');
    if (leste) {
      for (const obj of [...this.children.list]) {
        const img = obj as Phaser.GameObjects.Image;
        if (img.texture?.key === 'arena_grate' && img.x > this.built.worldWidth / 2) img.destroy();
      }
      const corpo = this.grateBodies[this.grateBodies.length - 1];
      if (corpo) { this.physics.world.removeCollider(corpo as never); corpo.destroy(); }
    }
    EventBus.emit('game:toast', { text: 'PROTOCOLO ENCERRADO' });
    EventBus.emit('game:text', {
      lines: [GUARDIAO.name, `"${GUARDIAO.lines.death}"`, 'A GRADE CEDE.'], hold: true,
    });
    this.time.delayedCall(2200, () => EventBus.emit('game:text', null));
    this.ganharMoedas(MOEDAS.porChefe);
    // `DEC-042`: **todo** chefe derrotado é uma tentativa de drop raro (`core/drop`)
    this.aoMatarChefe();
    this.session = endFight(this.session, this.now(), true, 0);
    this.pushBoss();
    this.pushMetrics();
    void this.persist('transition');
  }

  /** §5.5: a canalização completa — o corpo volta com **50%** e a luta reinicia nele. */
  private reviveBody(caido: Guardiao, now: number): void {
    caido.setHp(reviveHp(GUARDIAO.hpPerBody, GUARDIAO.revivePct));
    caido.markRevived(now);
    EventBus.emit('game:toast', { text: GUARDIAO.lines.revive });
    this.pushBoss();
  }

  // ---------- LVL-16: o chefe sem vida, o chão e o fim ----------

  /**
   * `LVL-16` §5 — **o último chefe**. Quatro regras, e a primeira é a que dá nome ao setor:
   *
   * 1. **ele não tem vida.** O golpe tira **25 de postura**, zero de HP; `MEC-009` não existe
   *    aqui, e a barra do HUD é a postura (`UI-20`, `TST-018`);
   * 2. **a janela é do jogador**: postura a 0 → `atordoado` por 4.500 ms, e o jogador assina
   *    segurando `interact` no posto por 3.000 ms (`MEC-011`);
   * 3. **o leash é de 8 tiles**: ele nunca vai a oeste de `x=13`, e os 12 tiles de entrada da
   *    arena são seguros (§6.5);
   * 4. **a grade não abre com 0 HP** — abre com a terceira baixa (§5.7, desvio 2).
   */
  private updatePlantonista(time: number): void {
    const p = this.plantonista;
    if (!p || this.postoRendido) return;
    const postoX = this.built.posto?.x ?? p.x;
    p.update(time, this.player.x, postoX);

    // `ATK-19`: o perigo é a **lanterna**, num raio de 2 tiles — não há hurtbox de ataque
    if (p.dangerous && Math.abs(this.player.x - p.x) <= PLANTONISTA.lanternPx) {
      this.player.takeDamage(p.touchDamage, this.difficulty, p.x);
    }

    // `MEC-011`: o canal é **segurado**, e só vale dentro da janela do atordoamento
    const segurando = this.isDown('interagir');
    const pertoDoPosto = Math.abs(this.player.x - postoX) <= TILE * 1.4
      && Math.abs(this.player.y - (7 * TILE)) < TILE * 2;
    if (segurando && pertoDoPosto
      && (p.channelOpen || (this.canalMs > 0 && p.channelHoldable))) {
      this.canalMs += this.game.loop.delta;
      if (this.canalMs >= PLANTONISTA.channelMs) {
        this.canalMs = 0;
        if (p.signBaixa(time)) {
          this.postoBaixas = p.baixas;
          EventBus.emit('game:toast', {
            text: p.rendido ? 'BAIXA 3/3 · POSTO PREENCHIDO' : `BAIXA ${p.baixas}/3`,
          });
        }
      }
    } else {
      this.canalMs = 0;
    }
    // §5.5: a folga de 1.200 ms passou — a baixa não foi assinada, e ele levanta
    if (this.canalMs > 0 && !p.channelHoldable) this.canalMs = 0;

    this.pushPosto();
  }

  /**
   * `ATK-20` (§5.3): o apito é a **única** ação reativa dele — ele chama reforço quando o
   * jogador já está perto do posto. O reforço é uma `ENT-002`, o primeiro inimigo do jogo:
   * **o último chefe chama o primeiro capanga.** Máximo de 2 vivas.
   */
  private apitoSentinela(): void {
    const vivas = (this.sentinels.getChildren() as unknown as CorpoComumCena[]).filter((s) => s.alive).length;
    if (vivas >= PLANTONISTA.apitoMaxAlive) return;
    const piso = 7 * TILE;
    const s = new Sentinel(this, PLANTONISTA.apitoSpawnX * TILE, piso, -1);
    this.sentinels.add(s);
    this.addCollide(s, this.built.solids);
    EventBus.emit('game:toast', { text: 'APITO · REFORÇO NO PISO' });
  }

  /** §5.7: **"Demorou."** — a última fala de inimigo do jogo, e ela tem uma palavra. */
  private onPlantonistaRendido(): void {
    this.postoRendido = true;
    this.bossDefeated = true;
    this.built.eastOpen = true;
    const leste = this.built.grates.find((g) => g.side === 'east');
    if (leste) {
      for (const obj of [...this.children.list]) {
        const img = obj as Phaser.GameObjects.Image;
        if (img.texture?.key === 'arena_grate' && img.x > this.built.worldWidth / 2) img.destroy();
      }
      const corpo = this.grateBodies[this.grateBodies.length - 1];
      if (corpo) { this.physics.world.removeCollider(corpo as never); corpo.destroy(); }
    }
    EventBus.emit('game:text', {
      lines: [PLANTONISTA.name, `"${PLANTONISTA.lines.rendido}"`, 'A GRADE SOBE.'], hold: true,
    });
    this.time.delayedCall(1800, () => EventBus.emit('game:text', null));
    this.ganharMoedas(MOEDAS.porChefe);
    // `DEC-042`: **todo** chefe derrotado é uma tentativa de drop raro (`core/drop`)
    this.aoMatarChefe();
    this.session = endFight(this.session, this.now(), true, 0);
    this.pushPosto();
    this.pushMetrics();
    void this.persist('transition');
  }

  /**
   * `CEN-113` (§5.6): **o Caos é o chão**. Parar sobre um tile da arena racha o piso em
   * 1.400 ms e abre um buraco em 2.000 ms. **Dano 0 sempre** (`DEC-018`): cair volta para a
   * entrada, cancela o canal e não tira um único ponto de vida.
   */
  private updateDesgaste(time: number): void {
    if (!this.built.desgaste || this.busy) return;
    const tile = Math.floor(this.player.x / TILE);
    // `MEC-011` × `CEN-113`: **enquanto o jogador assina, o chão não cede**. Sem isso o canal
    // de 3.000 ms seria impossível — o buraco abriria sob ele em 2.000 ms — e a única janela
    // que o jogador abre sozinho no jogo inteiro ficaria fechada por aritmética.
    if (this.canalMs > 0) {
      this.stillMs = 0;
      this.crackSprite?.destroy();
      this.crackSprite = undefined;
      return;
    }
    const parado = this.player.grounded
      && Math.abs((this.player.body as Phaser.Physics.Arcade.Body).velocity.x) < 8;
    if (!parado) {
      this.stillTile = null;
      this.stillMs = 0;
      this.crackSprite?.destroy();
      this.crackSprite = undefined;
      return;
    }
    if (this.stillTile !== tile) {
      this.stillTile = tile;
      this.stillMs = 0;
      this.crackSprite?.destroy();
      this.crackSprite = undefined;
    }
    this.stillMs += this.game.loop.delta;

    if (this.stillMs >= DESGASTE.crackMs && !this.crackSprite && !this.holeTiles.has(tile)) {
      // a rachadura é visível **e sonora** (1 estalo): é ela que avisa sem tirar os olhos dele
      this.crackSprite = this.add.image(tile * TILE + TILE / 2, 7 * TILE, 'crack')
        .setOrigin(0.5, 1).setDepth(9);
      EventBus.emit('game:toast', { text: 'O CHÃO ESTALA' });
    }
    if (this.stillMs >= DESGASTE.holeMs) {
      const baixa = this.plantonista?.baixas ?? 0;
      if (this.holeTiles.size < maxHoles(baixa, POSTO_TIMING)) {
        const escolhido = pickHole(this.holeTiles, tile, POSTO_TIMING);
        if (escolhido !== null) {
          this.holeTiles.add(escolhido);
          this.holeSprites.push(
            this.add.image(escolhido * TILE + TILE / 2, 7 * TILE, 'hole')
              .setOrigin(0.5, 1).setDepth(11).setAlpha(0.9),
          );
          // a 3ª baixa torna o buraco permanente; antes ele volta (§5.6)
          if (!DESGASTE.permanentOnFinal || (this.plantonista?.baixas ?? 0) < 3) {
            this.time.delayedCall(DESGASTE.holeDurationMs, () => {
              this.holeTiles.delete(escolhido);
              const i = this.holeSprites.findIndex(
                (h) => Math.abs(h.x - (escolhido * TILE + TILE / 2)) < 1,
              );
              if (i >= 0) this.holeSprites.splice(i, 1)[0].destroy();
            });
          }
        }
      }
      this.stillTile = null;
      this.stillMs = 0;
      this.crackSprite?.destroy();
      this.crackSprite = undefined;
    }

    // cair no buraco: `DEC-011` — **sem dano**, volta à entrada da arena e cancela o canal
    if (this.holeTiles.has(tile) && this.player.grounded) {
      this.canalMs = 0;
      EventBus.emit('game:toast', { text: 'O CHÃO CEDE · SEM DANO' });
      this.cameras.main.fadeOut(DESGASTE.fallReturnMs, 21, 19, 31);
      this.busy = true;
      this.cameras.main.once('camerafadeoutcomplete', () => {
        const b = this.player.body as Phaser.Physics.Arcade.Body;
        b.reset(TILE * 1.5, 5 * TILE);
        this.cameras.main.fadeIn(DESGASTE.fallReturnMs, 21, 19, 31);
        this.busy = false;
      });
    }
    void time;
  }

  /**
   * `MEC-012` (§7.2) — **o último ato do jogo é uma tecla**. Sem minigame, sem canal e sem
   * estado de falha: o jogador senta, o zumbido de `AMB-16` para **de uma vez** e o save grava
   * `completed = true`. Idempotente (`PAT-C-07`).
   */
  private tryThrone(): boolean {
    const trono = this.built.throne;
    if (!trono) return false;
    const perto = Math.abs(this.player.x - trono.x) <= TILE * 1.6
      && Math.abs(this.player.y - (7 * TILE)) < TILE * 2;
    if (!perto) return false;
    if (this.terminou) return true;
    this.terminou = true;
    this.busy = true;
    const corpoDoJogador = this.player.body as Phaser.Physics.Arcade.Body;
    corpoDoJogador.setVelocity(0, 0);
    EventBus.emit('game:text', { lines: [...LVL16_BADGE], hold: true });
    // §7.3: o zumbido da vaga **para** porque a vaga foi preenchida; `BGM-04` sai em 6 s
    EventBus.emit('game:end', {
      completed: true, badge: [...LVL16_BADGE], lastLine: LVL16_LAST_LINE,
    });
    this.session = endSession(this.session, this.now());
    this.pushMetrics();
    EventBus.emit('game:completed', { scope: 'campaign' });
    void this.persist('end');
    this.time.delayedCall(VAGA.badgeMs, () => {
      EventBus.emit('game:text', null);
      this.busy = false;
    });
    return true;
  }

  /** `CEN-112` (§4.2): o distribuidor mostra `SENHA ATUAL: 000`, e `000` é a resposta. */
  private tryDispenser(): boolean {
    const d = this.built.dispenser;
    if (!d) return false;
    if (Math.abs(this.player.x - d.x) > TILE * 1.6) return false;
    EventBus.emit('game:text', {
      lines: ['DISTRIBUIDOR DE SENHA', `SENHA ATUAL: ${d.display}`, 'NENHUMA RETIRADA EM 31 ANOS.'],
      hold: true,
    });
    this.time.delayedCall(2400, () => EventBus.emit('game:text', null));
    return true;
  }

  /** O canal do posto, quando o jogador larga `interact` no meio: nada acontece (§5.5). */
  private nearPosto(): boolean {
    const posto = this.built.posto;
    if (!posto) return false;
    return Math.abs(this.player.x - posto.x) <= TILE * 1.4;
  }

  /**
   * `CEN-096` (§6, `PAT-LD-03`): o vento tem de ser **visível e legível a 12 tiles**. A
   * coluna é um retângulo declarado, mas o jogador só a encontra no escuro se ela subir na
   * tela: fundo lavado, duas bordas e riscos a subir na velocidade real (140 px/s).
   */
  private paintUpdraft(u: { x: number; y: number; width: number; height: number }): void {
    const cx = u.x + u.width / 2;
    const corpo = this.add.rectangle(cx, u.y + u.height, u.width * 0.9, u.height,
      PAL.accent13, 0.3).setOrigin(0.5, 1).setDepth(3);
    this.updraftSprites.push(corpo);
    this.tweens.add({
      targets: corpo, alpha: { from: 0.22, to: 0.4 },
      duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut',
    });
    // bordas: a coluna tem limite, e o limite é o que diz "aqui o vento acaba"
    for (const lado of [-1, 1]) {
      this.add.rectangle(cx + lado * u.width * 0.45, u.y + u.height, 3, u.height, PAL.bone, 0.3)
        .setOrigin(0.5, 1).setDepth(3);
    }
    // riscos subindo na velocidade real da corrente
    const subida = (u.height / UPDRAFT.risePxS) * 1000;
    for (let i = 0; i < 8; i++) {
      const risco = this.add.rectangle(
        u.x + u.width * (0.12 + (i % 4) * 0.25), u.y + u.height,
        5, 58, PAL.bone, 0.4,
      ).setOrigin(0.5, 1).setDepth(4);
      this.updraftSprites.push(risco);
      this.tweens.add({
        targets: risco,
        y: u.y + 10,
        alpha: { from: 0, to: 0.6 },
        duration: subida,
        delay: (i / 8) * subida,
        repeat: -1,
        ease: 'Linear',
        onRepeat: () => { risco.y = u.y + u.height; risco.setAlpha(0); },
      });
    }
  }

/**
   * `CEN-095` (§5): o eco é uma **cópia técnica**, não um fantasma. Ela repete a posição de
   * 700 ms atrás com 30% de opacidade, não reage, não olha e não ameaça. Em `reduce_motion`
   * a silhueta simplesmente não existe — o eco sonoro continua, porque ele é informação.
   */
  private updateEcho(time: number): void {
    if (!this.echoGhost) return;
    this.echoHistory.push({ x: this.player.x, y: this.player.y, t: time });
    // a história cobre o atraso com folga e não cresce sem fim
    while (this.echoHistory.length && time - this.echoHistory[0].t > ECHO.historyMs) this.echoHistory.shift();
    const passado = echoAt(this.echoHistory, time, ECHO.delayMs);
    if (!passado) { this.echoGhost.setVisible(false); return; }
    this.echoGhost.setVisible(true);
    this.echoGhost.setPosition(passado.x, passado.y);
    this.echoGhost.setFlipX(this.player.flipX);
  }

  /**
   * `CEN-099` (§8, `P-64`): a queda longa de L13-02 — **3 s**, 900 ms em movimento
   * reduzido, **zero de dano** e salva antes e depois. É a única transição do jogo em que
   * o preto tem função: a profundidade do setor não está na grade, está nela.
   */
  private tryLongFall(): boolean {
    const queda = this.built.longFall;
    if (!queda || this.busy) return false;
    if (Math.abs(this.player.x - queda.x) > TILE * 1.2) return false;

    this.busy = true;
    // salva **antes** de cair (`PAT-LD-05`)
    void this.persist('transition');
    const total = longFallMs(LONG_FALL.fallMs, LONG_FALL.reducedMotionMs, this.reducedMotion);
    const fade = Math.min(LONG_FALL.fadeOutMs, Math.max(120, Math.round(total / 4)));
    this.cameras.main.fadeOut(fade, 5, 4, 10);
    EventBus.emit('game:toast', { text: 'O ABISMO NÃO DEVOLVE NADA' });
    // `PAT-LD-05`: salva **no destino** também — é o único par de saves do jogo
    this.checkpointRoom = queda.to;
    this.time.delayedCall(Math.max(fade, total - fade), () => {
      // chega pelo lado oeste da sala de destino, que é o fundo do poço
      this.mountRoom(queda.to, 'west');
      this.cameras.main.fadeIn(fade, 5, 4, 10);
      this.busy = false;
      this.pushMetrics();
    });
    return true;
  }

  /**
   * `CEN-092` (§7): relógio próprio, posição fixa, defasagem de meio período — e **para
   * quando o Forjador morre**, porque quem bate é ele (§7.5).
   */
  private updateHammers(time: number): void {
    if (!this.hammerSlots.length) return;
    const parado = hammerStops(true, this.forjador ? this.forjador.alive : false);
    const periodo = hammerPeriod(this.forjador?.phase ?? 1, HAMMER);
    const corpo = (this.player.body as Phaser.Physics.Arcade.Body).height;

    for (const h of this.hammerSlots) {
      if (parado) {
        // os aríetes sobem e ficam: a fábrica parou com o turno
        h.ram.setY(h.y - 260);
        h.shadow.setAlpha(0.2);
        continue;
      }
      const fase = hammerPhaseAt(time - this.hammerStart, periodo, h.offset, HAMMER);
      const t0 = (((time - this.hammerStart + h.offset) % periodo) + periodo) % periodo;
      const restante = periodo - t0;
      const descida = fase === 'telegraph'
        ? Math.min(1, Math.max(0, 1 - restante / HAMMER.telegraphMs)) : 0;

      if (fase === 'golpe') h.ram.setY(h.y - 6);
      else if (fase === 'telegraph') h.ram.setY(h.y - 260 + descida * 224);
      else h.ram.setY(h.y - 260);

      h.shadow.setAlpha(fase === 'golpe' ? 1 : 0.4 + descida * 0.4);

      // o dano é da coluna, não do aríete: quem está no piso na vertical leva (§7.4)
      if (fase === 'golpe' && this.player.grounded
        && Math.abs(this.player.x - h.x) <= TILE * 0.55
        && this.player.y - corpo <= h.y + 8
        && time - h.lastHit > 500) {
        h.lastHit = time;
        this.player.takeDamage(HAMMER.damage, this.difficulty, h.x);
        this.cameras.main.shake(120, 0.005);
      }
    }
  }

  /**
   * `MEC-009` de `ENT-005` (§5.6). **Nada de `eastOpen = true`**: a saída da forja nunca
   * esteve fechada — é o que o setor afirma (§8). O que muda é a peça em L12-06.
   */
  private onForjadorDefeated(): void {
    this.forjadorDefeated = true;
    EventBus.emit('game:toast', { text: 'O FORJADOR PARA' });
    EventBus.emit('game:text', {
      lines: ['O FORJADOR', '"ACABOU A PEÇA."', 'OS PILÕES SOBEM.'], hold: true,
    });
    this.time.delayedCall(2400, () => EventBus.emit('game:text', null));
    this.ganharMoedas(MOEDAS.porChefe);
    // `DEC-042`: **todo** chefe derrotado é uma tentativa de drop raro (`core/drop`)
    this.aoMatarChefe();
    this.session = endFight(this.session, this.now(), true, 0);
    this.pushBoss();
    this.pushMetrics();
    void this.persist('transition');
  }

  /** `MEC-009`: venceu o Alferes → grade leste quebra, recompensa aparece, areia zera. */
  private onAlferesDefeated(): void {
    this.bossDefeated = true;
    this.built.eastOpen = true;
    this.sandClock = zeroSand();
    EventBus.emit('game:toast', { text: 'O ALFERES PARA' });
    EventBus.emit('game:text', {
      lines: ['O ALFERES DA RONDA', '"ENTÃO É ASSIM QUE ACABA."', 'A GRADE CEDE.'], hold: true,
    });
    this.time.delayedCall(2400, () => EventBus.emit('game:text', null));
    // a grade leste quebra: some o corpo e o desenho
    const leste = this.built.grates.find((g) => g.side === 'east');
    if (leste) {
      for (const c of [...this.children.list]) {
        const img = c as Phaser.GameObjects.Image;
        if (img.texture?.key === 'arena_grate' && img.x > this.built.worldWidth / 2) img.destroy();
      }
      const corpo = this.grateBodies[this.grateBodies.length - 1];
      if (corpo) { this.physics.world.removeCollider(corpo as never); corpo.destroy(); }
    }
    this.ganharMoedas(MOEDAS.porChefe);
    // `DEC-042`: **todo** chefe derrotado é uma tentativa de drop raro (`core/drop`)
    this.aoMatarChefe();
    this.session = endFight(this.session, this.now(), true, 0);
    this.pushBoss();
    this.pushMetrics();
    void this.persist('transition');
  }

  /** `ATK-03`: a investida quebra o pilar e rende 1200 ms de aturdimento. */
  private bossHitsPillar(boss: Boss, zone: Phaser.GameObjects.Zone): void {
    if (boss.state !== 'investida') return;
    const pillar = this.built.pillars.find((p) => p.zones.includes(zone));
    if (!pillar) return;
    boss.hitPillar();
    for (const z of pillar.zones) { this.built.pillarGroup.remove(z, true, true); }
    pillar.sprite?.destroy();
    pillar.sprite = null;
    for (let i = 0; i < 10; i++) {
      const frag = this.add.rectangle(pillar.centerX, 7 * TILE - 20 - Math.random() * 100, 10, 10, 0x8d8478)
        .setDepth(22);
      this.tweens.add({
        targets: frag,
        x: frag.x + (Math.random() - 0.5) * 180,
        y: 7 * TILE,
        angle: 180,
        alpha: 0,
        duration: 420 + Math.random() * 260,
        onComplete: () => frag.destroy(),
      });
    }
    this.cameras.main.shake(180, 0.004);
    EventBus.emit('game:toast', { text: 'PILAR DESTRUÍDO · ATURDIDO' });
  }

  /**
   * O tiro do `ENT-010` (`DEC-048`). Reaproveita o **mesmo pool** do tiro do jogador
   * (`PAT-C-03`), mas num grupo próprio: um projétil de inimigo que entrasse no grupo do jogador
   * acertaria no jogador pelas costas do próprio `overlap` — é a mesma classe de erro que
   * `DEC-046` custou a encontrar.
   */
  private dispararDe(s: Comum): void {
    const dir = s.direcaoDoTiro();
    const bala = this.physics.add.image(s.x + dir.x * 18, s.y - 36, 'proj_enemy')
      .setDepth(19);
    const body = bala.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(dir.x * s.spec.projetil!.velocidadePx, 0);
    this.physics.add.overlap(bala, this.player, () => {
      // o alvo aqui é o **jogador**, e o projétil é o primeiro argumento porque foi assim que o
      // overlap foi registado (`overlap(bala, jogador)`): a ordem é a da chamada, não um acaso
      this.player.takeDamage(s.spec.projetil!.dano, this.difficulty, bala.x);
      bala.destroy();
    });
    // some ao sair do mundo ou depois de 3 s — um tiro perdido não é um objeto eterno
    this.time.delayedCall(3000, () => { if (bala.active) bala.destroy(); });
  }

  private overlapsPlayer(s: { body: unknown; x: number }): boolean {
    const a = this.player.body as Phaser.Physics.Arcade.Body;
    const b = s.body as Phaser.Physics.Arcade.Body;
    return a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
  }

  // ---------- combate ----------

  private resolveAttack(rect: Phaser.Geom.Rectangle): void {
    this.sentinels.children.each((child) => {
      const s = child as Sentinel;
      if (!s.active || !s.alive) return true;
      const body = s.body as Phaser.Physics.Arcade.Body;
      const hit = rect.x < body.right && rect.right > body.x && rect.y < body.bottom && rect.bottom > body.y;
      if (hit) s.hit(PLAYER.attack.damage);
      return true;
    });
    if (this.alferes && this.alferes.alive) {
      const a = this.alferes.body as Phaser.Physics.Arcade.Body;
      const dentro = Math.abs(this.player.x - this.alferes.x)
        < PLAYER.attack.reachPx * this.bonusDeNiveis().reach
        && Math.abs((this.player.y - 40) - (a.center.y)) < 90;
      if (dentro) this.alferes.takeHit(PLAYER.attack.damage);
    }
    if (this.forjador && this.forjador.alive) {
      const f = this.forjador.body as Phaser.Physics.Arcade.Body;
      if (rect.x < f.right && rect.right > f.x && rect.y < f.bottom && rect.bottom > f.y) {
        this.forjador.takeHit(PLAYER.attack.damage);
      }
    }
    if (this.comandante && this.comandante.alive) {
      const c = this.comandante.body as Phaser.Physics.Arcade.Body;
      if (rect.x < c.right && rect.right > c.x && rect.y < c.bottom && rect.bottom > c.y) {
        this.comandante.takeHit(PLAYER.attack.damage);
      }
    }
    for (const g of this.guardioes) {
      if (!g.alive || g.felled) continue;   // `queda` não recebe golpe: ele já está no chão
      const b = g.body as Phaser.Physics.Arcade.Body;
      if (rect.x < b.right && rect.right > b.x && rect.y < b.bottom && rect.bottom > b.y) {
        g.takeHit(PLAYER.attack.damage);
      }
    }
    // `LVL-16` §5.5: aqui o golpe **não é dano** — é 25 de postura. A função é `takeGolpe`
    // de propósito, para nenhum caminho deste arquivo chamar `MEC-009` nele (`TST-018`)
    if (this.plantonista && !this.plantonista.rendido) {
      const c = this.plantonista.body as Phaser.Physics.Arcade.Body;
      if (rect.x < c.right && rect.right > c.x && rect.y < c.bottom && rect.bottom > c.y) {
        this.plantonista.takeGolpe(this.now());
        this.pushPosto();
      }
    }
    if (this.boss && this.boss.alive) {
      const b = this.boss.body as Phaser.Physics.Arcade.Body;
      if (rect.x < b.right && rect.right > b.x && rect.y < b.bottom && rect.bottom > b.y) {
        this.boss.takeHit(PLAYER.attack.damage);
      }
    }
    const flash = this.add.rectangle(rect.centerX, rect.centerY, rect.width, rect.height, PAL.bone, 0.12).setDepth(19);
    this.tweens.add({ targets: flash, alpha: 0, duration: 130, onComplete: () => flash.destroy() });
  }

  private fire(x: number, y: number, dir: 1 | -1): void {
    if (!FLAGS.shoot) return;
    const shot = this.projectiles.get(x, y) as Phaser.Physics.Arcade.Sprite | null;
    if (!shot) return; // pool cheio: degrada, nunca cresce (PAT-C-03)
    shot.setActive(true).setVisible(true).setDepth(19);
    const body = shot.body as Phaser.Physics.Arcade.Body;
    body.setEnable(true);
    body.setAllowGravity(false);
    shot.setVelocity(dir * PLAYER.shot.speed, 0);
    this.time.delayedCall(1200, () => this.despawnProjectile(shot));
  }

  /**
   * `PAT-C-03` — **quem, dos dois, é o projétil.**
   *
   * O Phaser chama o callback de uma colisão (e de um overlap) **na ordem em que ele normalizou os
   * dois objetos**, não na ordem em que os registámos: `overlap(grupo, sprite, cb)` acaba em
   * `collideSpriteVsGroup(sprite, grupo)`, e o callback recebe `(sprite, filhoDoGrupo)`. Assumir
   * «o primeiro argumento é o projétil» desligava o **inimigo** em vez do tiro.
   *
   * Foi o bug que o jogador viu em L03-02: o Guardião levava o tiro, perdia vida, e no mesmo
   * instante era ele o objeto desativado — `active = false`, `visible = false`, corpo desligado. O
   * chefe **desaparecia do ecrã** e deixava de aceitar golpes (o corpo parado não intersecta mais
   * nada): era impossível derrotá-lo. O mesmo valia para o Alferes, o Forjador, o Comandante, os
   * dois Guardiões do Silêncio e o Plantonista.
   *
   * A regra que fica: **nunca confiar na ordem dos argumentos de um callback da física** — a
   * pergunta «qual destes dois é o projétil?» responde-se pelo grupo a que pertencem.
   */
  private projetilDe(a: unknown, b: unknown): Phaser.Physics.Arcade.Sprite | null {
    const grupo = this.projectiles;
    if (!grupo) return null;
    if (grupo.contains(a as Phaser.GameObjects.GameObject)) return a as Phaser.Physics.Arcade.Sprite;
    if (grupo.contains(b as Phaser.GameObjects.GameObject)) return b as Phaser.Physics.Arcade.Sprite;
    return null;
  }

  /** Despacha o projétil do par, esteja ele no primeiro ou no segundo argumento. */
  private despawnProjetilDe(a: unknown, b: unknown): void {
    const proj = this.projetilDe(a, b);
    if (proj) this.despawnProjectile(proj);
  }

  /**
   * Um **alvo** que leva tiros: o dano é de quem chama, o projétil é sempre o outro objeto.
   * Um sítio para a regra — antes eram seis cópias da mesma linha, e as seis estavam erradas.
   */
  private projetilContra(alvo: Phaser.GameObjects.GameObject, aoAcertar: () => void): void {
    this.addOverlap(this.projectiles, alvo, (a, b) => {
      aoAcertar();
      this.despawnProjetilDe(a, b);
    });
  }

  private despawnProjectile(proj: Phaser.Physics.Arcade.Sprite): void {
    if (!proj.active) return;
    // o despacho só existe para projéteis: um inimigo que apareça aqui é um erro de programação, e
    // desligá-lo apagava-o do jogo (foi o bug de L03-02). O grupo é a autoridade.
    if (this.projectiles && !this.projectiles.contains(proj)) return;
    proj.setActive(false).setVisible(false);
    (proj.body as Phaser.Physics.Arcade.Body).setEnable(false);
  }

  // ---------- itens ----------

  private collectItem(zone: Phaser.GameObjects.Zone | undefined, id: ItemId): void {
    const spec: ItemEffect = { id, ...ITEMS[id] };
    // `MEC-004`: o teto é o **conquistado** (`core/permanentes`), não o de fábrica
    const outcome = applyItem(this.player.resources, spec, limites(this.permanentes));
    this.player.resources = { ...outcome.resources };

    /*
     * `UI-07`/`03-conteudo` §3.3: a mochila tem 40 espaços e **não substitui nada**. Se o item
     * não couber, ele fica no chão (a zona não é destruída) e o jogador é avisado — é a única
     * alternativa a perder um drop em silêncio.
     */
    if (outcome.occupiesSlot) {
      const r = guardar(this.bolsa(), id, spec, INVENTARIO);
      if (!r.ok) {
        EventBus.emit('game:toast', { text: MOTIVO_TEXTO[r.motivo ?? 'sem-espaco'] });
        this.legenda('A mochila está cheia: o item fica no chão.', 'perigo');
        this.pushHud();
        return;
      }
      this.bag = [...r.bolsa.itens];
      this.presos = [...r.bolsa.presos];
      const nome = (ITEMS[id] as { name: string }).name;
      const nota = (ITEMS[id] as { nota?: string }).nota ?? 'OCUPA UM ESPAÇO NA MOCHILA.';
      EventBus.emit('game:text', { lines: [nome, nota], hold: true });
      this.time.delayedCall(2200, () => EventBus.emit('game:text', null));
    }

    if (outcome.unlockedBreath) {
      this.conquistarHabilidade('breath');
      this.player.unlockBreath();
      if (!this.collected.includes(id)) this.collected.push(id);
      // §5.4: permanente — sem isso a galeria de L06-05 vira soft lock (`TST-005`)
      this.breathMs = refill(true, this.bonusDeNiveis().breath);
      EventBus.emit('game:text', { lines: ['FÔLEGO', 'VINTE SEGUNDOS DEBAIXO DA ÁGUA.'], hold: true });
      this.time.delayedCall(2200, () => EventBus.emit('game:text', null));
    }

    if (outcome.unlockedStrength) {
      this.conquistarHabilidade('strength');
      this.player.unlockStrength();
      if (!this.collected.includes(id)) this.collected.push(id);
      // `LVL-05` §5.3: permanente, sobrevive à morte (`TST-005`) — sem isso o elevador vira soft lock
      EventBus.emit('game:text', { lines: ['FORÇA', 'O QUE ESTÁ CAÍDO PODE SER EMPURRADO.'], hold: true });
      this.time.delayedCall(2200, () => EventBus.emit('game:text', null));
      this.cameras.main.flash(240, 201, 138, 62);      // flash PAL-05 (§5.3)
    }

    if (outcome.unlockedHook) {
      this.conquistarHabilidade('hook');
      this.player.unlockHook();
      if (!this.collected.includes(id)) this.collected.push(id);
      // `LVL-09` §6.2: permanente — sem isso o canal de L09-05 vira soft lock (`TST-005`)
      EventBus.emit('game:text', { lines: ['GANCHO', 'O FERRO GASTO NÃO MENTE. APONTE E PUXE.'], hold: true });
      this.time.delayedCall(2400, () => EventBus.emit('game:text', null));
      this.cameras.main.flash(240, 126, 148, 110);      // flash PAL-09
    }

    if (outcome.unlockedClimb) {
      this.conquistarHabilidade('climb');
      this.player.unlockClimb();
      if (!this.collected.includes(id)) this.collected.push(id);
      // `LVL-10` §7.1: permanente — sem ela o alçapão de L10-05 vira soft lock (`TST-005`)
      EventBus.emit('game:text', { lines: ['GARRA', 'A PAREDE TEM ONDE SEGURAR. VOCÊ NÃO TINHA.'], hold: true });
      this.time.delayedCall(2400, () => EventBus.emit('game:text', null));
      this.cameras.main.flash(240, 138, 122, 92);       // flash PAL-10
    }

    if (outcome.unlockedGlide) {
      this.conquistarHabilidade('glide');
      this.player.unlockGlide();
      if (!this.collected.includes(id)) this.collected.push(id);
      // `LVL-11` §7: permanente — sem ele os vãos de 11/12/13 tiles viram parede (`TST-005`)
      EventBus.emit('game:text', { lines: ['ESTANDARTE', 'O PANO NÃO VOA. ELE TROCA QUEDA POR DISTÂNCIA.'], hold: true });
      this.time.delayedCall(2600, () => EventBus.emit('game:text', null));
      this.cameras.main.flash(240, 199, 107, 166);      // flash PAL-11 (§4.2)
    }

    if (outcome.unlockedDoubleJump) {
      this.player.unlockDoubleJump();
      this.conquistarHabilidade('double-jump');
      if (!this.collected.includes(id)) this.collected.push(id);
      // `MEC-005`: a habilidade é permanente e sobrevive à morte (`TST-005`)
      EventBus.emit('game:text', { lines: ['SALTO DUPLO', 'A FENDA NO TETO AGORA É CAMINHO.'], hold: true });
      this.time.delayedCall(2200, () => EventBus.emit('game:text', null));
    }

    // `DEC-042`: o drop raro de chefe entrega sem zona (não há item no chão para apanhar)
    const sprite = zone?.getData('sprite') as Phaser.GameObjects.Image | undefined;
    sprite?.destroy();
    zone?.destroy();

    this.session = addItem(this.session, id);
    this.pushMetrics();
    EventBus.emit('game:toast', { text: `${spec.id} · ${(ITEMS[id] as { name: string }).name}` });
    this.pushHud();
    this.pushInventory();
  }

  // ---------- senha (`MEC-006`) ----------

  private nearPasswordDoor(): boolean {
    if (!this.area.hasPasswordDoor || this.passwordOpen) return false;
    return this.built.passwordDoors.some(
      (d) => Phaser.Math.Distance.Between(this.player.x, this.player.y, d.x, d.y) < 130,
    );
  }

  private askPassword(): void {
    // painel aberto = jogo parado: o jogador não pode levar dano enquanto escolhe glifos
    this.scene.pause();
    EventBus.emit('game:password', { open: true });
  }

  /**
   * `MEC-006` — **a porta cede**. Um sítio só para as três coisas que têm de concordar: o estado
   * (`passwordOpen`), a física (as zonas da porta) e a saída da sala (`eastOpen`).
   *
   * Chamado quando o jogador acerta nos glifos e, ao montar a sala, quando a senha já estava
   * resolvida — é o que faz a porta **continuar aberta** ao voltar a L02-07.
   */
  private abrirPortaDaSenha(): void {
    if (!this.passwordOpen) this.passwordOpen = true;
    this.built.eastOpen = true;
    for (const zona of this.built.passwordLock) zona.destroy();
    this.built.passwordLock = [];
  }

  private tryPassword(symbols: readonly PasswordSymbol[]): void {
    const verdict = checkPassword(symbols);
    if (verdict.kind === 'incomplete') { EventBus.emit('game:password-hint', { kind: 'incomplete' }); return; }
    if (verdict.kind === 'wrong') {
      // erro não abre, não pune e não gasta tentativa: `max_attempts = 0`
      this.session = addPasswordAttempt(this.session, false);
      this.pushMetrics();
      EventBus.emit('game:password-hint', { kind: 'wrong', index: verdict.firstWrongIndex });
      return;
    }
    this.session = addPasswordAttempt(this.session, true);
    this.pushMetrics();
    this.abrirPortaDaSenha();
    EventBus.emit('game:password', { open: false });
    EventBus.emit('game:toast', { text: 'A PORTA CEDE' });
    void this.persist('manual');
  }

  // ---------- interação ----------

  private showNearbyText(): void {
    const t = this.built.texts[0];
    if (!t || !t.lines.length) return;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y) > 130) return;
    EventBus.emit('game:text', { lines: [...t.lines], hold: true });
    this.busy = true;
    this.time.delayedCall(2600, () => { this.busy = false; EventBus.emit('game:text', null); });
  }

  /** `PAT`: sem flag de overlap — a física roda antes do `update` e a flag morria no mesmo frame. */
  private nearSavePoint(): boolean {
    return this.built.saves.some(
      (s) => Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y) < 120,
    );
  }

  private interactSave(): void {
    this.player.heal();
    this.checkpointRoom = this.roomIndex;
    this.pushHud();
    this.legenda(`Checkpoint gravado no slot ${this.slot}.`, 'marco');
    void this.persist('manual');
  }

  // ---------- transições e morte ----------

  private checkTransition(time: number): void {
    // fenda no teto (`DEC-015`): passa pela abertura da linha 0
    const top = (this.player.body as Phaser.Physics.Arcade.Body).top;
    if (top <= 4) {
      const tx = Math.floor(this.player.x / TILE);
      const hole = this.built.ceilingHoles.find((h) => tx >= h.from && tx <= h.to);
      if (hole) {
        // `LVL-13` §4.4: **o alçapão da coluna manda primeiro**. A regra geral de
        // `DEC-015` é "sala seguinte", e é exatamente o que a corrente A **não** faz: ela
        // volta. Sem esta ordem, a coluna A levava a L13-05 e o atalho deixava de existir.
        const comDestino = this.built.hatches.find(
          (h) => !h.sealed && h.destRoom !== undefined
            && tx >= Math.floor(h.x / TILE) && tx <= Math.floor((h.x + h.width - 1) / TILE),
        );
        if (comDestino) {
          const precisaPano = comDestino.requires === 'HAB-07' && !this.player.abilities.glide;
          if (precisaPano) {
            EventBus.emit('game:toast', { text: 'O VENTO NÃO SEGURA SEM O PANO.' });
            return;
          }
          this.changeRoom(comDestino.destRoom!, 'ceiling');
          return;
        }
        // `LVL-10` §6: o alçapão exige a garra; lacrado nem existe como passagem
        const hatch = this.current.hatch;
        if (hatch?.state === 'sealed') return;
        if (hatch?.requires === 'HAB-03' && !this.player.abilities.climb) {
          EventBus.emit('game:toast', { text: 'O ALÇAPÃO ESTÁ FORA DE ALCANCE.' });
          return;
        }
        this.changeRoom(this.roomIndex + 1, 'ceiling');
        return;
      }
    }

    // `LVL-10` §6.2: o alçapão fica **sobre a parede de ganchos**, então quem chega ao
    // topo escalando não tem corpo para dentro do buraco — entra nele pelo topo da parede.
    // `LVL-13` §4.4 / §6.4: o alçapão no topo da coluna de vento. Cada um leva ao seu
    // destino — a corrente A volta (atalho) e a B segue (a trava 13 → 14).
    for (const h of this.built.hatches) {
      if (h.sealed) continue;
      const topo = (this.player.body as Phaser.Physics.Arcade.Body).top;
      const naColuna = this.player.x >= h.x - TILE * 0.5 && this.player.x <= h.x + h.width + TILE * 0.5;
      if (topo <= 6 && naColuna) {
        if (h.requires === 'HAB-07' && !this.player.abilities.glide) {
          EventBus.emit('game:toast', { text: 'O VENTO NÃO SEGURA SEM O PANO.' });
          return;
        }
        this.changeRoom(h.destRoom ?? this.roomIndex + 1, 'ceiling');
        return;
      }
    }

    if (this.built.hatch && !this.built.hatch.sealed && this.player.climb === 'cling') {
      const h = this.built.hatch;
      const topoDoCorpo = (this.player.body as Phaser.Physics.Arcade.Body).top;
      const pertoDoAlcapao = Math.abs(this.player.x - (h.x + h.width / 2)) <= TILE * 2;
      if (topoDoCorpo <= TILE + 6 && pertoDoAlcapao) {
        if (h.requires === 'HAB-03' && !this.player.abilities.climb) {
          EventBus.emit('game:toast', { text: 'O ALÇAPÃO ESTÁ FORA DE ALCANCE.' });
          return;
        }
        // só solta a parede se a transição realmente aconteceu: sem LVL-11 no build
        // não há destino, e o jogador fica pendurado em vez de cair no vazio
        this.changeRoom(this.roomIndex + 1, 'ceiling');
        if (this.busy) this.player.releaseClimb();
        return;
      }
    }

    // `LVL-14` §8.3: o portão não barra em silêncio — mostra a **contagem** (`x / 2`), que é
    // como o jogador com 3 descobre sozinho que tem uma sobra que não abre nada
    const trava = this.built.locks[0];
    if (trava && !this.built.eastOpen && this.player.x > this.built.worldWidth - 40) {
      if (time - this.lastGateHint > 1200) {
        this.lastGateHint = time;
        EventBus.emit('game:text', {
          lines: ['PORTÃO FORTIFICADO', `CHAVES: ${keyLabel(this.bossKeys, trava.required)}`],
          hold: true,
        });
        this.time.delayedCall(1200, () => EventBus.emit('game:text', null));
      }
      return;
    }

    const atEast = this.player.x > this.built.worldWidth - 26;
    const atWest = this.player.x < 26;
    if (atEast && this.built.eastOpen) this.changeRoom(this.roomIndex + 1, 'east');
    else if (atWest && this.built.westOpen) this.changeRoom(this.roomIndex - 1, 'west');
    else if (this.player.y > this.built.worldHeight + PIT.fallLimitPx) this.respawnInRoom();
    void time;
  }

  /** `DEC-011`: cair em vão não mata — volta para a entrada da sala com fade. */
  private respawnInRoom(): void {
    if (this.busy) return;
    this.busy = true;
    this.cameras.main.fadeOut(PIT.fadeMs, 21, 19, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.mountRoom(this.roomIndex, 'start');
      this.busy = false;
    });
  }

  private changeRoom(next: number, dir: SpawnSide): void {
    if (this.busy) return;
    this.busy = true;
    this.carried.hp = this.player.resources.hp;
    this.carried.shield = this.player.resources.shield;
    void this.persist('transition');

    if (next < 0) { this.busy = false; return; }
    if (next >= this.rooms.length) {
      const following = nextArea(this.area.id);
      if (following) { this.enterArea(following); return; }
      this.finishSlice();
      return;
    }

    this.cameras.main.fadeOut(180, 21, 19, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const side: SpawnSide = dir === 'east' ? 'west' : dir === 'west' ? 'east' : dir;
      this.mountRoom(next, side);
      this.busy = false;
    });
  }

  private enterArea(area: Area, roomIndex = 0, at?: { x: number; y: number }): void {
    this.area = area;
    this.rooms = area.rooms;
    this.roomIndex = roomIndex;
    this.pendingSpawn = at ?? null;
    this.checkpointRoom = 0;
    /*
     * `MEC-006`: **não** se apaga a senha aqui. A porta é uma no jogo inteiro: quem a abriu e foi a
     * LVL-03 (ou voltou a LVL-01) encontra-a aberta na volta. Apagá-la na troca de setor era a
     * segunda metade do «loop» de L02-07 — a porta fechava por ter havido uma transição.
     */
    this.cameras.main.fadeOut(180, 21, 19, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.mountRoom(roomIndex, 'start');
      this.busy = false;
    });
  }

  /** `LVL-08` §10.1: morrer zera a areia — o oposto do contrapeso de LVL-05. */
  private resetSandOnDeath(): void {
    if (!this.built.anchors.length) return;
    this.sandClock = zeroSand();
  }

  private onPlayerDeath(): void {
    if (this.busy) return;
    this.busy = true;
    this.session = addDeath(this.session, this.now());
    /*
     * `MEC-004` (`DEC-037`): a **perda na morte**. O baú não entra na conta (nem é argumento), o
     * que está preso não cai, e o resto segue as percentagens de `PERDA`. O gerador é semeado e
     * avança a cada morte — a regra é a mesma, o dado é que é outro.
     */
    this.aplicarPerdaDaMorte();
    if (this.built.boss && this.boss) {
      // derrota na arena: fecha a tentativa com a vida que restou ao chefe
      this.session = endFight(this.session, this.now(), false, this.boss.hp);
    }
    if (this.alferes) {
      this.session = endFight(this.session, this.now(), false, this.alferes.hp);
      this.resetSandOnDeath();
    }
    // `LVL-16` §10.1: **a postura reseta, as baixas não** — um formulário assinado não se
    // desassina. É o oposto de LVL-15 e é o que impede a luta mais longa de punir mais.
    this.plantonista?.resetPoise(this.now());
    this.countArenaDeath();
    this.pushMetrics();
    /*
     * `MEC-004` (`DEC-038`): **o que se conquistou não regride**. Os tetos e as habilidades passam
     * por `aoMorrer` (que não tira nada) e as barras voltam cheias no teto conquistado.
     */
    this.permanentes = permanecerAoMorrer(this.permanentes);
    const cheio = aoReaparecer(this.permanentes);
    this.carried.hp = cheio.hp;
    this.carried.shield = cheio.shield;
    this.legenda('Você caiu. Voltando ao checkpoint.', 'perigo');
    EventBus.emit('game:death', { areaId: this.area.id, recoverable: true });
    this.cameras.main.flash(180, 217, 85, 85);
    this.tweens.add({ targets: this.player, alpha: 0, angle: 90, duration: 420 });
    this.time.delayedCall(760, () => {
      this.mountRoom(this.checkpointRoom, 'start');
      this.busy = false;
      // `DEC-038`: grava **depois** de voltar ao checkpoint — o save fica com a sala certa e com a
      // bolsa que ficou no chão (fechar o jogo não pode custar a bolsa)
      void this.persist('transition');
    });
  }

  /**
   * `MEC-008`: a cada 3 mortes na arena o jogo oferece um degrau mais fácil
   * (difícil → médio → fácil). A oferta é recusável e nunca sobe a dificuldade.
   */
  private countArenaDeath(): void {
    if (!this.built.boss && !this.built.alferes) return;
    this.arenaDeaths += 1;
    if (this.arenaDeaths % 3 !== 0) return;
    const order: readonly Difficulty[] = ['hard', 'medium', 'easy'];
    const i = order.indexOf(this.difficulty);
    const to = order[i + 1];
    if (!to) return;                       // já está em fácil: não há o que oferecer
    EventBus.emit('game:difficulty-offer', { from: this.difficulty, to });
  }

  /** `MEC-009`: roda uma única vez (o guarda está em `Boss`/`core/boss.ts`). */
  private onBossDefeated(): void {
    this.built.eastOpen = true;
    EventBus.emit('game:toast', { text: 'O GUARDIÃO CAIU' });
    EventBus.emit('game:text', { lines: ['GUARDIÃO DA PASSAGEM', 'A SAÍDA ESTÁ ABERTA.'], hold: true });
    this.time.delayedCall(2400, () => EventBus.emit('game:text', null));
    this.ganharMoedas(MOEDAS.porChefe);
    // `DEC-042`: **todo** chefe derrotado é uma tentativa de drop raro (`core/drop`)
    this.aoMatarChefe();
    this.session = endFight(this.session, this.now(), true, 0);
    this.pushBoss();
    this.pushMetrics();
    void this.persist('transition');
  }

  /**
   * `CEN-031`: a cinza cai o setor inteiro; é decor, não armadilha (`LVL-04` §6.4).
   * Um timer único emite de todos os emissores da sala — vários timers se anulavam.
   */
  private startAsh(emissores: readonly number[]): void {
    const emit = (): void => {
      for (const x of emissores) {
        const flake = this.add.rectangle(
          x + Phaser.Math.Between(-24, 24), Phaser.Math.Between(70, 140),
          Phaser.Math.Between(2, 4), Phaser.Math.Between(2, 4), 0xe6dfd2, 0.85,
        ).setDepth(20);
        this.tweens.add({
          targets: flake,
          y: 7 * TILE,
          x: flake.x + Phaser.Math.Between(-30, 30),
          alpha: 0.1,
          duration: 3600 + Phaser.Math.Between(0, 1800),
          onComplete: () => flake.destroy(),
        });
      }
    };
    emit();
    this.ashTimer?.remove();
    this.ashTimer = this.time.addEvent({ delay: 260, loop: true, callback: emit });
  }

  /** `E` no sumidouro: mão única para L04-01 (`LVL-04` §6.1). Não salva. */
  private trySink(): boolean {
    if (!this.sinkZones || this.built.sinks.length === 0) return false;
    const destino = this.current.sink;
    if (destino && destino.mode === 'touch') return false;   // o trifório não pede `E`
    const perto = this.built.sinks.some(
      (k) => Phaser.Math.Distance.Between(this.player.x, this.player.y, k.x, k.y) < 90,
    );
    if (!perto) return false;
    // `LVL-10` §5: o poço da Vigília só desce com a garra — é regra, não geometria
    if (destino?.requires === 'HAB-03' && !this.player.abilities.climb) {
      EventBus.emit('game:text', { lines: ['O POÇO NÃO TEM ONDE SEGURAR.', 'AINDA.'], hold: true });
      this.time.delayedCall(1800, () => EventBus.emit('game:text', null));
      return true;
    }
    this.useSink(destino?.text ?? ['A GRADE CEDE.', 'A CINZA VOLTA PARA O COMEÇO.']);
    return true;
  }

  /**
   * `CEN-066` monta-carga (`LVL-08` §4.1/§4.5): duas paradas, e a segunda só depois do
   * chefe (`lockedUntil = boss-defeated`). Antes disso o jogador vê o cabo sem carga.
   */
  private tryHoist(): boolean {
    if (!this.built.hoists.length) return false;
    const perto = this.built.hoists.find(
      (h) => Math.abs(this.player.x - h.x) < 70 && Math.abs(this.player.y - h.y) < 80,
    );
    if (!perto) return false;
    if (perto.locked && !this.bossDefeated) {
      EventBus.emit('game:text', { lines: ['O CABO ESTÁ SEM CARGA.'], hold: true });
      this.time.delayedCall(1200, () => EventBus.emit('game:text', null));
      return true;
    }
    const destino = AREAS[perto.area];
    if (!destino) return false;
    EventBus.emit('game:text', { lines: ['O MONTA-CARGA SOBE.'], hold: true });
    this.time.delayedCall(500, () => EventBus.emit('game:text', null));
    this.cameras.main.fadeOut(260, 21, 19, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.enterArea(destino, perto.room, { x: perto.tx * TILE + TILE / 2, y: perto.ty * TILE });
    });
    if (this.busy) return true;
    this.busy = true;
    return true;
  }

  /**
   * `CEN-070` (`LVL-07` §5.1): a boca do trifório dispara ao entrar, nunca ao passar —
   * ela fica 1 tile acima da cabeça de quem está na passarela e exige salto deliberado.
   */
  private checkTriforium(): void {
    if (!this.triforiumZone || this.busy) return;
    if (this.current.sink?.mode !== 'touch') return;
    const b = this.triforiumZone.getBounds();
    if (!b.contains(this.player.x, this.player.y - 40)) return;
    this.useSink(this.current.sink?.text ?? ['A GALERIA SEGUE PARA TRÁS.']);
  }

  /** Destino do sumidouro/trifório vem da ficha da sala (`Room.sink`), nunca da cena. */
  private useSink(text: readonly string[]): void {
    const destino = this.current.sink;
    const area = destino ? AREAS[destino.area] : AREAS['LVL-04'];
    if (!area) return;
    const sala = destino?.room ?? 0;
    const at = destino
      ? { x: destino.at.tx * TILE + TILE / 2, y: destino.at.ty * TILE }
      : { x: 2.5 * TILE, y: 3 * TILE - 8 };
    EventBus.emit('game:text', { lines: [...text], hold: true });
    this.time.delayedCall(700, () => EventBus.emit('game:text', null));
    this.cameras.main.fadeOut(260, 21, 19, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => this.enterArea(area, sala, { ...at }));
  }

  /**
   * `HAB-05` (`LVL-05` §5.1): andar contra o bloco empurra 1 tile a 60 px/s.
   * Sem Força, o bloco não cede — é a exposição 1 de `PAT-LD-03`.
   */
  private updateBlocks(time: number): void {
    if (!this.blockSprites.length || this.pushing) return;
    // A intenção vem do teclado: encostado no bloco, a velocidade resultante é 0
    const dir: -1 | 1 | 0 = this.isDown('direita') ? 1 : this.isDown('esquerda') ? -1 : 0;
    if (dir === 0) return;

    for (const b of this.blockSprites) {
      const dx = this.player.x - b.sprite.x;
      const encostado = Math.abs(dx) < TILE * 1.15 && Math.abs(this.player.y - 40 - (b.sprite.y + 10)) < 90;
      if (!encostado) continue;
      const empurrando = dir === 1 ? dx < 0 : dx > 0;
      if (!empurrando) continue;

      const resultado = pushBlock({
        hasStrength: this.player.abilities.strength,
        blockColumn: b.column,
        dir,
        blockedColumns: this.blockedColumns(),
        minColumn: 3,
        maxColumn: this.built.width - 3,
      });
      if (!resultado.moved) continue;

      this.pushing = true;
      b.column = resultado.column;
      const alvoX = resultado.column * TILE + TILE / 2;
      this.tweens.add({
        targets: b.sprite,
        x: alvoX,
        duration: (TILE / 60) * 1000,       // 60 px/s (§5.1)
        onUpdate: () => {
          const zone = b.sprite.getData('zone') as Phaser.GameObjects.Zone | undefined;
          zone?.setPosition(b.sprite.x, b.sprite.y);
          (zone?.body as Phaser.Physics.Arcade.StaticBody | undefined)?.updateFromGameObject();
        },
        onComplete: () => {
          this.pushing = false;
          this.checkPlate(b);
        },
      });
      return;
    }
    void time;
  }

  /** Colunas ocupadas por parede: o bloco não atravessa desnível (§5.3). */
  private blockedColumns(): number[] {
    const linha = 7;    // piso
    const cols: number[] = [];
    for (let x = 0; x < this.built.width; x++) {
      const acima = this.built.roomGrid[linha - 1]?.[x];
      if (acima === '#') cols.push(x);
    }
    return cols;
  }

  /** `CEN-043`: o bloco chegando na placa engata o contrapeso — e isso não desengata (§8). */
  private checkPlate(b: { sprite: Phaser.GameObjects.Image; column: number }): void {
    const chegou = this.built.plates.some(
      (c) => engagesCounterweight(b.column, Math.round((c.x - TILE / 2) / TILE)),
    );
    if (!applyCounterweight(this.counterweight, chegou)) return;
    this.counterweight = true;
    EventBus.emit('game:toast', { text: 'CONTRAPESO ENGATADO' });
    EventBus.emit('game:text', { lines: ['A PLACA AFUNDA.', 'ALGO SE ENCAIXA NO EIXO.'], hold: true });
    this.time.delayedCall(2000, () => EventBus.emit('game:text', null));
    void this.persist('manual');
  }

  /** `U` de L05-03: elevador de engrenagem (`requires=HAB-05`, `dest=LVL-06`). */
  private tryElevator(): boolean {
    if (!this.built.elevators.length) return false;
    const perto = this.built.elevators.some(
      (u) => Phaser.Math.Distance.Between(this.player.x, this.player.y, u.x, u.y) < 100,
    );
    if (!perto) return false;
    const veredito = elevatorVerdict(this.player.abilities.strength, this.counterweight);
    if (veredito !== 'pronto') {
      EventBus.emit('game:text', { lines: ['ELEVADOR DE ENGRENAGEM', ELEVATOR_LINE[veredito]], hold: true });
      this.time.delayedCall(1800, () => EventBus.emit('game:text', null));
      return true;
    }
    /*
     * `DEC-047` — **o elevador sobe**. Até aqui ele respondia «LVL-06 FORA DO BUILD · SETOR
     * [PÓS]»: era o cadeado do recorte, escrito à mão no meio de uma interação. Com a campanha
     * aberta, o elevador de L05-03 é a passagem 05 → 06 do grafo (`LVL-05` §11) e tem de subir —
     * é o único caminho para a mina, e o jogador que o encontrava ficava com uma parede de texto
     * que lhe dizia que o jogo acabara ali.
     */
    EventBus.emit('game:text', { lines: ['ELEVADOR DE ENGRENAGEM', ELEVATOR_LINE.pronto], hold: true });
    this.time.delayedCall(700, () => EventBus.emit('game:text', null));
    this.cameras.main.fadeOut(260, 21, 19, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const seguinte = nextArea(this.area.id);
      if (seguinte) this.enterArea(seguinte, 0);
      else this.finishSlice();
    });
    return true;
  }

  /** `true` quando o centro do jogador está dentro do volume da ficha (`LVL-06` §3). */
  private isUnderwater(): boolean {
    if (!this.waterRect) return false;
    return this.waterRect.contains(this.player.x, this.player.y - 20);
  }

  /**
   * `LVL-06` §5: nadar é universal, o fôlego é que muda. Ao zerar, o jogador volta à
   * última superfície com fade e **sem dano** — o análogo aquático de `DEC-011`.
   */
  private updateWater(delta: number): void {
    const submerso = this.isUnderwater();
    this.player.setSwimming(submerso);

    if (!submerso) {
      this.breathMs = refill(this.player.abilities.breath, this.bonusDeNiveis().breath);
      this.drownsInRoom = 0;
      this.pushBreath(false);
      return;
    }

    this.breathMs = consume(this.breathMs, delta);
    this.pushBreath(true);

    if (isDrowning(this.breathMs) && !this.busy) {
      this.drownsInRoom += 1;
      this.breathMs = refill(this.player.abilities.breath);
      const dica = shouldShowDrownHint(this.drownsInRoom);
      if (dica.show) EventBus.emit('game:toast', { text: dica.line });
      EventBus.emit('game:toast', { text: 'SEM AR · VOLTA À SUPERFÍCIE' });
      this.cameras.main.fadeOut(300, 21, 19, 31);
      this.busy = true;
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.mountRoom(this.roomIndex, 'start');
        this.busy = false;
      });
    }
  }

  private pushBreath(submerged: boolean): void {
    EventBus.emit('game:breath', {
      ms: Math.round(this.breathMs),
      max: maxBreath(this.player.abilities.breath),
      submerged,
    });
  }

  /** Relógio monotônico do navegador; o Phaser pausa a cena e isso distorceria o TTK. */
  private now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  private pushMetrics(): void {
    EventBus.emit('game:metrics', summarize(this.session));
  }

  /**
   * `UI-20` — a barra do ocupante. **Postura, não vida**: chega a 0, ele cambaleia 4.500 ms e
   * volta inteiro — e é essa diferença que o HUD precisa mostrar, senão o jogador passa a luta
   * inteira tentando "zerar a vida" de um homem que não tem uma (`TST-018`).
   */
  private pushPosto(): void {
    const p = this.plantonista;
    if (!p) {
      EventBus.emit('game:posto', null);
      return;
    }
    EventBus.emit('game:posto', {
      baixas: p.baixas,
      baixasMax: PLANTONISTA.baixas,
      poise: Math.round(p.poise),
      poiseMax: p.maxPoise,
      staggered: p.state === 'atordoado',
      rendido: p.rendido,
    });
  }

  private pushBoss(): void {
    if (this.guardioes.length) {
      // §5.4: **duas barras finas**, lado a lado. A média é o que a barra única mostra; os
      // dois valores vão no payload para a UI não precisar de um segundo evento.
      const hp = this.guardioes.reduce((n, g) => n + g.hp, 0);
      const dePé = this.guardioes.filter((g) => !g.felled && g.alive).length;
      EventBus.emit('game:boss', {
        // o par **não tem fase 2**: quem cai não deixa o outro mais rápido (§5.3). O que
        // muda é quantos corpos restam, e isso vai no nome — a barra é uma só, de 360.
        name: `${GUARDIAO.name} · ${dePé}/2`,
        hp,
        max: GUARDIAO.hpPerBody * GUARDIAO.bodies,
        phase: 1,
        defeated: this.guardiaoDefeated,
      });
      return;
    }
    if (this.comandante) {
      EventBus.emit('game:boss', {
        name: COMANDANTE.name,
        hp: this.comandante.hp,
        max: COMANDANTE.hp,
        phase: this.comandante.phase,
        defeated: !this.comandante.alive,
      });
      return;
    }
    if (this.forjador) {
      EventBus.emit('game:boss', {
        name: FORJADOR.name,
        hp: this.forjador.hp,
        max: FORJADOR.hp,
        phase: this.forjador.phase,
        defeated: !this.forjador.alive,
      });
      return;
    }
    if (this.alferes) {
      EventBus.emit('game:boss', {
        name: ALFERES.name,
        hp: this.alferes.hp,
        max: ALFERES.hp,
        phase: this.alferes.phase,
        defeated: !this.alferes.alive,
      });
      return;
    }
    if (!this.boss) return;
    EventBus.emit('game:boss', {
      name: BOSS.name,
      hp: this.boss.hp,
      max: BOSS.hp,
      phase: this.boss.phase,
      defeated: !this.boss.alive,
    });
  }

  /**
   * `DEC-047` — **o fim da campanha**, não o fim de um recorte.
   *
   * Chamado quando se atravessa a última sala do último setor sem haver setor seguinte (na prática
   * L16-06 não tem saída a leste: o jogo acaba no trono, em `tryThrone`). Continua a existir como
   * rede: se um dia um setor ganhar uma saída a mais, o jogo termina com o crachá — e não com uma
   * parede invisível ou um ecrã vazio.
   */
  private finishSlice(): void {
    if (this.finished) return;      // `UI-10` abre uma vez só
    this.finished = true;
    this.busy = true;
    this.session = endSession(this.session, this.now());
    this.pushMetrics();
    EventBus.emit('game:end', {
      completed: true, badge: [...LVL16_BADGE], lastLine: LVL16_LAST_LINE,
    });
    EventBus.emit('game:completed', { scope: 'campaign' });
    void this.persist('end');
    this.busy = false;
  }

  private async persist(reason: 'manual' | 'transition' | 'end'): Promise<void> {
    const result = await saveProgress({
      areaId: this.area.id,
      roomId: this.rooms[this.roomIndex].id,
      roomIndex: this.roomIndex,
      checkpointRoom: this.checkpointRoom,
      hp: this.player?.resources.hp ?? PLAYER.hp,
      shield: this.player?.resources.shield ?? PLAYER.shield,
      completed: reason === 'end',
      // `UI-04`: a dificuldade viaja com o save — CONTINUAR não volta a perguntar, mas também
      // não troca a escolha do jogador por um padrão silencioso
      difficulty: this.difficulty,
      // `UI-12`: o herói também. Retomar tem de devolver o rosto que o jogador escolheu
      personagem: this.personagem,
      // `UI-07`: o baú é do save — guardar um item e fechar o jogo não pode custar o item
      bau: this.bau,
      // `DEC-040`: e as moedas que lá estão guardadas
      bauMoedas: this.bauMoedas,
      // `UI-14`: os níveis comprados são progressão permanente — ficam no save
      melhorias: this.niveis,
      // `UI-14`: e o que já foi apanhado (é o que dá as habilidades ao retomar)
      coletados: this.collected,
      // `DEC-042`: a garantia do drop raro também — fechar o jogo não a reinicia
      tentativasDrop: this.tentativasDrop,
      // `UI-22`: e o mapa — o que se andou não se apaga ao fechar o jogo
      visitadas: this.visitadas,
      // `MEC-006`: a porta de senha já cedida — fechar o jogo não a pode voltar a fechar
      senhaAberta: this.passwordOpen,
      // `MEC-004`: a bolsa da morte também — o que ficou no chão espera pelo jogador
      bolsaMorte: this.bolsaMorte,
      // `UI-02`: o menu precisa do nome que o jogador reconhece, e ele é escrito aqui
      areaName: this.area.name,
      roomName: this.rooms[this.roomIndex].name,
      roomTotal: this.rooms.length,
    }, this.slot);
    EventBus.emit('save:result', result);
    if (reason === 'manual') EventBus.emit('game:toast', { text: result.ok ? 'SALVO' : 'FALHA AO SALVAR' });
  }

  private pushHud(): void {
    EventBus.emit('game:resources', {
      hp: this.player?.resources.hp ?? PLAYER.hp,
      shield: this.player?.resources.shield ?? PLAYER.shield,
      power: this.player?.resources.power ?? PLAYER.power,
    });
  }

  /**
   * `UI-07` — de que lado do pilar cabe o baú. Devolve `1` (direita), `-1` (esquerda) ou `0`
   * (nem um nem outro: parede dos dois lados, e então a sala não tem baú).
   */
  private ladoLivreDoBau(s: { x: number; y: number }): 1 | -1 | 0 {
    const grid = this.current.grid;
    const col = Math.floor(s.x / TILE);
    // `s.y` é o fundo do tile onde o `P` está; a linha do glifo é a de cima
    const row = Math.round(s.y / TILE) - 1;
    const livre = (c: number): boolean => {
      const linha = grid[row];
      if (!linha || c < 0 || c >= linha.length) return false;
      return linha[c] === '.' || linha[c] === 'c';
    };
    if (livre(col + 1)) return 1;
    if (livre(col - 1)) return -1;
    return 0;
  }

  /** `UI-07`: o herói está ao alcance de um baú? O estado só é emitido quando muda. */
  private updateBau(): void {
    const perto = this.bauSprites.some(
      (b) => Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y) < INVENTARIO.alcanceBau,
    );
    if (perto === this.bauDisponivel) return;
    this.bauDisponivel = perto;
    if (perto) this.legenda('Baú. `E` para abrir; `I` para a mochila.', 'info');
    this.pushBau();
  }

  /** `MEC-004`: o herói está em cima da bolsa? O raio é o mesmo do baú, para o `E` ser previsível. */
  private pertoDaBolsa(): boolean {
    if (!this.bolsaSprite) return false;
    return Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.bolsaSprite.x, this.bolsaSprite.y,
    ) < INVENTARIO.alcanceBau;
  }

  /** `MEC-004`: o `E` da bolsa só é anunciado quando ela está ao alcance. */
  private updateBolsa(): void {
    if (!this.bolsaMorte || !this.bolsaNaSala) return;
    const perto = this.pertoDaBolsa();
    if (perto === this.bolsaAnunciada) return;
    this.bolsaAnunciada = perto;
    if (perto) this.legenda('Bolsa da morte. `E` para recuperar.', 'info');
  }

  /** `E` no baú abre a mochila, que é onde o baú aparece. Um painel, não dois. */
  private abrirBau(): void {
    EventBus.emit('ui:inventario', { open: true });
  }

  /**
   * `UI-07` — guardar e tirar do baú. Como no prender, a regra decide e a cena aplica; o motivo,
   * quando há um, aparece em aviso. **Cada movimento bem-sucedido grava**: o baú está dentro de
   * uma sala segura, e o objetivo dele é justamente não se perder.
   */
  /**
   * `UI-07`/`DEC-040` — **mexer no baú**, agora com número.
   *
   * Uma função só para seis gestos porque o efeito é sempre o mesmo: tentar mover, dizer o que
   * aconteceu, publicar o estado novo e gravar. O que muda é a operação pura chamada — e essas
   * vivem em `core/storage.ts`, onde os testes as fixam sem motor.
   */
  private commandBau(acao: TipoComandoBau, id?: ItemId, quantidade?: number): void {
    const capMochila = { slots: INVENTARIO.slots, presos: INVENTARIO.presos };
    const capBau = { slots: INVENTARIO.bau, presos: INVENTARIO.presos };
    const pedido = quantidade === undefined ? 'tudo' as const : quantidade;

    // --- moedas: o baú é o cofre, e é o único sítio onde a morte não chega ---
    if (acao === 'moedas-para-bau' || acao === 'moedas-do-bau') {
      const r = acao === 'moedas-para-bau'
        ? guardarMoedas(this.moedas, this.bauMoedas, pedido)
        : retirarMoedas(this.moedas, this.bauMoedas, pedido);
      if (!r.ok) {
        EventBus.emit('game:toast', {
          text: acao === 'moedas-para-bau' ? 'NÃO HÁ MOEDAS PARA GUARDAR.' : 'O BAÚ NÃO TEM MOEDAS.',
        });
        this.pushBau();
        return;
      }
      this.moedas = r.moedas;
      this.bauMoedas = r.noBau;
      EventBus.emit('game:moedas', { moedas: this.moedas });
      EventBus.emit('game:toast', {
        text: `${r.movidas} MOEDA${r.movidas === 1 ? '' : 'S'} ${acao === 'moedas-para-bau' ? 'NO BAÚ' : 'NA CARTEIRA'}`,
      });
      this.pushBau();
      void this.persist('transition');
      return;
    }

    // --- itens ---
    const bolsa = this.bolsa();
    let r: ResultadoMover;
    if (acao === 'guardar-tudo') {
      const itens = guardarTudoNoBau(bolsa, this.bau, capMochila, capBau);
      // `GUARDAR TUDO` é o único gesto que mexe nas duas listas do baú: os itens que couberem e
      // as moedas todas. Um botão que só guardasse metade não seria "tudo".
      const moedas = guardarMoedas(this.moedas, this.bauMoedas, 'tudo');
      if (moedas.ok) {
        this.moedas = moedas.moedas;
        this.bauMoedas = moedas.noBau;
        EventBus.emit('game:moedas', { moedas: this.moedas });
      }
      r = itens;
      if (!itens.ok && !moedas.ok) {
        EventBus.emit('game:toast', { text: 'NÃO HÁ NADA PARA GUARDAR.' });
        this.pushBau();
        this.pushInventory();
        return;
      }
    } else if (acao === 'retirar-tudo') {
      r = retirarTudoDoBau(bolsa, this.bau, capMochila);
      const moedas = retirarMoedas(this.moedas, this.bauMoedas, 'tudo');
      if (moedas.ok) {
        this.moedas = moedas.moedas;
        this.bauMoedas = moedas.noBau;
        EventBus.emit('game:moedas', { moedas: this.moedas });
      }
      if (!r.ok && !moedas.ok) {
        EventBus.emit('game:toast', {
          text: MOTIVO_BAU_TEXTO[(r.motivo ?? 'sem-item') as MotivoBau],
        });
        this.pushBau();
        this.pushInventory();
        return;
      }
    } else {
      if (!id) return;
      r = acao === 'guardar'
        ? guardarNoBauEm(bolsa, this.bau, id, pedido, capMochila, capBau)
        : retirarDoBauEm(bolsa, this.bau, id, pedido, capMochila);
    }

    this.bag = [...r.bolsa.itens];
    this.presos = [...r.bolsa.presos];
    this.bau = [...r.bau];
    if (!r.ok) {
      EventBus.emit('game:toast', { text: MOTIVO_BAU_TEXTO[(r.motivo ?? 'sem-item') as MotivoBau] });
    } else {
      const quantos = r.movidos > 1 ? ` · ${r.movidos}` : '';
      EventBus.emit('game:toast', {
        text: `${acao === 'guardar' || acao === 'guardar-tudo' ? 'GUARDADO NO BAÚ' : 'NA MOCHILA'}${quantos}`,
      });
      // `'transition'` e não `'manual'`: grava **sem** o toast `SALVO` por cima do aviso do baú
      void this.persist('transition');
    }
    this.pushInventory();
    this.pushBau();
    this.pushHud();
  }




  // ---------- `DEC-042`: o drop raro de chefe ----------

  /**
   * `DEC-042` — **um chefe derrotado, uma tentativa**. 8 % de chance e garantia ao 12.º.
   *
   * O item cai **no chão**, onde o chefe estava, e não na mochila: o jogador vê-o, apanha-o e o
   * `collectItem` faz o resto (é o mesmo caminho de todos os itens do jogo — uma segunda via de
   * entrega seria uma segunda coisa para testar). Se ele não o apanhar, o item fica na sala.
   *
   * O contador de tentativas vive no save: fechar o jogo não reinicia a garantia.
   */
  private aoMatarChefe(): void {
    const faltam = (Object.keys(DROPS_RAROS.itens) as ItemId[])
      .filter((id) => !this.collected.includes(id));
    const r = sortearDrop({
      faltam,
      tentativas: this.tentativasDrop,
      regra: { chance: DROPS_RAROS.chance, garantia: DROPS_RAROS.garantia },
      rng: this.rngDrop,
    });
    this.tentativasDrop = r.tentativas;
    if (!r.item) {
      // sem drop: a garantia está mais perto, e o jogador é informado **sem** prometer nada
      if (faltam.length > 0) {
        EventBus.emit('game:toast', {
          text: `NADA RARO CAIU · ${this.tentativasDrop} / ${DROPS_RAROS.garantia}`,
        });
      }
      return;
    }
    this.soltarItemRaro(r.item, r.motivo === 'garantia' ? 'garantia' : 'sorte');
  }

  /**
   * `DEC-042`: o drop raro **é entregue na hora**, com um resto de teatro — e não deitado ao chão.
   *
   * A primeira versão deitava o item no chão (imagem + zona + `collectItem` no overlap). O E2E
   * mostrou o que isso valia: o chefe morre **ao lado do jogador**, o item caía-lhe aos pés e era
   * apanhado no frame seguinte, sem o jogador chegar a vê-lo. E, pior, um item no chão **não está
   * no save**: mudar de sala antes de lhe tocar perdia um drop de sorte — e a garantia, entretanto,
   * já tinha voltado a zero.
   *
   * Fica o que interessa: a imagem sobe e desvanece (o chefe largou alguma coisa), a habilidade é
   * conquistada de imediato (`collectItem` trata do resto: texto, flash, save) e o aviso diz **por
   * que** veio — sorte ou garantia, que são coisas diferentes para quem está a jogar.
   */
  private soltarItemRaro(id: ItemId, motivo: 'sorte' | 'garantia'): void {
    const nome = (ITEMS[id] as { name: string }).name;
    const img = this.add.image(this.player.x, this.player.y - 24, ITEM_TEXTURE[id]).setDepth(18);
    this.tweens.add({
      targets: img, y: img.y - 48, alpha: 0, duration: 700, ease: 'Sine.easeOut',
      onComplete: () => img.destroy(),
    });
    EventBus.emit('game:text', {
      lines: [motivo === 'garantia' ? 'O CHEFE DEIXOU CAIR' : 'DROP RARO', nome],
      hold: true,
    });
    this.collectItem(undefined, id);
    EventBus.emit('game:toast', {
      text: `${motivo === 'garantia' ? 'GARANTIA' : 'DROP RARO'} · ${nome}`,
    });
    // progressão permanente: grava já, como o baú e as melhorias
    void this.persist('transition');
  }

  // ---------- `UI-22`: o mapa ----------

  /**
   * `UI-22` (`DEC-043`) — **o mapa do jogo**, montado aqui e só desenhado na UI.
   *
   * A cena é quem sabe onde o herói está e o que ele já viu; a UI não tem como saber nenhuma das
   * duas coisas (`ADR-01`). Por isso o payload vai **completo**: as salas do setor com posição e
   * estado, as ligações já resolvidas (corredor, atalho ou seta para outro setor), e a coluna dos
   * 16 setores com o que se viu em cada um. A UI não calcula topologia — desenha.
   */
  private pushMapa(): void {
    const setor = MAPA.find((s) => s.id === this.area.id) ?? MAPA[0];
    /*
     * A sala atual tem de estar **neste** setor: numa transição a meio, `area` e `rooms` podem
     * discordar por um frame. Sem esta guarda o painel abria sem informação nenhuma (o mapa
     * desenhava o setor certo e a linha do "você está aqui" ficava vazia).
     */
    const candidata = this.rooms[this.roomIndex]?.id;
    const atual = setor.salas.some((s) => s.id === candidata) ? (candidata as string) : setor.salas[0].id;
    const posicoes = new Map(setor.posicoes.map((p) => [p.id, p]));
    const salas = setor.salas.map((s) => {
      const p = posicoes.get(s.id) ?? { x: 0, y: 0 };
      return {
        id: s.id,
        nome: s.nome ?? '',
        x: p.x,
        y: p.y,
        estado: estadoDaSala(s.id, this.visitadas, atual, setor.salas),
        ...(s.saidas.portal ? { portal: s.saidas.portal } : {}),
      };
    });
    const resumo = resumoDoSetor(setor.salas, this.visitadas);
    EventBus.emit('game:mapa', {
      setor: setor.id,
      setorNome: setor.nome,
      atual,
      salas,
      ligacoes: ligacoesDe(setor.salas),
      setores: MAPA.map((s) => {
        const r = resumoDoSetor(s.salas, this.visitadas);
        return {
          id: s.id, nome: s.nome, ordem: s.ordem, naProgressao: s.naProgressao,
          visitadas: r.visitadas, total: r.total, atual: s.id === setor.id,
        };
      }),
      visitadas: resumo.visitadas,
      total: resumo.total,
    });
  }

  // ---------- `UI-14`: as habilidades e os seus níveis ----------

  /**
   * `UI-14` (`DEC-041`) — **os multiplicadores dos níveis**, tal como o motor os lê.
   *
   * Um sítio só: os seis números que dependem do que o jogador comprou. O `Player` guarda os seus
   * (salto, planeio, escalada, golpe) e a cena usa os dois restantes (fôlego e gancho), porque é
   * ela que lê essas constantes. Se um dia houver um sétimo efeito, é uma linha aqui e uma onde é
   * lido — e nunca um número espalhado pelo motor.
   */
  private bonusDeNiveis(): { airJump: number; glideFall: number; climbUp: number; reach: number;
    hook: number; breath: number } {
    return {
      airJump: fatorDe(this.niveis, 'double-jump', MELHORIAS),
      glideFall: fatorDe(this.niveis, 'glide', MELHORIAS),
      climbUp: fatorDe(this.niveis, 'climb', MELHORIAS),
      reach: fatorDe(this.niveis, 'strength', MELHORIAS),
      hook: fatorDe(this.niveis, 'hook', MELHORIAS),
      breath: fatorDe(this.niveis, 'breath', MELHORIAS),
    };
  }

  /** `UI-14`: empurra os multiplicadores para quem os usa (jogador e fôlego). */
  private aplicarNiveis(): void {
    const b = this.bonusDeNiveis();
    if (this.player) {
      this.player.bonus = { airJump: b.airJump, glideFall: b.glideFall, climbUp: b.climbUp, reach: b.reach };
      // o fôlego em curso é recalculado: comprar o nível com a cabeça debaixo da água tem de valer
      this.breathMs = Math.min(maxBreath(this.player.abilities.breath, b.breath), Math.max(this.breathMs, 0));
    }
  }

  /** `UI-14`: publica as linhas do painel — incluindo custo e texto do **próximo** nível. */
  private pushHabilidades(): void {
    const conquistadas = this.player?.abilities;
    const linhas = ORDEM_HABILIDADES.map((id) => {
      const nivel = nivelDe(this.niveis, id, MELHORIAS);
      const max = MELHORIAS[id].length;
      return {
        id,
        nome: NOME_HABILIDADE[id],
        nivel,
        max,
        conquistada: nivel > 0,
        custo: proximoCusto(this.niveis, id, MELHORIAS),
        texto: proximoTexto(this.niveis, id, MELHORIAS)
          ?? MELHORIAS[id][Math.max(0, nivel - 1)].texto,
      };
    });
    // a UI precisa de saber se a habilidade foi **mesmo** conquistada: um nível 1 sem a flag seria
    // uma habilidade que se compra e não se usa
    const comFlag = linhas.map((l) => ({
      ...l, conquistada: l.conquistada && !!(conquistadas && conquistadas[
        l.id === 'double-jump' ? 'doubleJump' : l.id as keyof typeof conquistadas
      ]),
    }));
    EventBus.emit('game:habilidades', { moedas: this.moedas, linhas: comFlag });
  }

  /**
   * `UI-14`: **comprar um nível**, pagando com moedas da carteira.
   *
   * A regra está em `core/melhorias` (e tem 22 casos); aqui só se liga o que ela decidiu: o nível
   * novo, o dinheiro que saiu, o aviso, o efeito aplicado e a gravação. Nada acontece pela metade —
   * `melhorar` devolve o estado inteiro, e é ele que é escrito.
   */
  private comprarMelhoria(hab: Habilidade): void {
    const r = melhorar({ niveis: this.niveis, moedas: this.moedas }, hab, MELHORIAS);
    if (!r.ok) {
      EventBus.emit('game:toast', { text: MOTIVO_MELHORIA_TEXTO[r.motivo ?? 'desconhecida'] });
      this.pushHabilidades();
      return;
    }
    this.niveis = r.niveis;
    this.moedas = r.moedas;
    EventBus.emit('game:moedas', { moedas: this.moedas });
    EventBus.emit('game:toast', { text: `${NOME_HABILIDADE[hab]} · NÍVEL ${r.nivel}` });
    this.aplicarNiveis();
    this.pushHabilidades();
    // progressão permanente: grava já, como o baú (fechar o jogo não pode custar o que se comprou)
    void this.persist('transition');
  }

  /** `UI-07`: publica o baú para a UI (disponibilidade + conteúdo + capacidade). */
  private pushBau(): void {
    EventBus.emit('game:bau', {
      disponivel: this.bauDisponivel,
      itens: this.bau,
      capacidade: INVENTARIO.bau,
      moedas: this.bauMoedas,
    });
  }

  /**
   * `MEC-004` — **onde a bolsa cai**. No sítio da morte, exceto na arena de chefe: aí cai à
   * entrada (§`P-28`: a misericórdia é não obrigar a atravessar o chefe para reaver as coisas).
   */
  private localDaBolsa(): Local {
    const arena = !!(this.built.boss || this.built.alferes || this.built.forjador || this.built.comandante);
    const entrada = this.spawnPoint('start', this.roomIndex);
    const p = arena
      ? { x: entrada.x, y: entrada.y - 20 }
      : { x: this.player.x, y: this.player.y - 10 };
    return {
      areaId: this.area.id,
      roomIndex: this.roomIndex,
      sala: this.rooms[this.roomIndex].id,
      // coordenadas arredondadas: o save guarda pixels, não `Float32` de física
      x: Math.round(p.x),
      y: Math.round(p.y),
    };
  }

  /** `MEC-004`: desenha a bolsa quando ela está nesta sala, e diz se está. */
  private desenharBolsaDaSala(): void {
    this.destruirBolsaDaSala();
    this.bolsaNaSala = naSala(this.bolsaMorte, this.area.id, this.roomIndex);
    if (!this.bolsaNaSala || !this.bolsaMorte) return;
    const { x, y } = this.bolsaMorte.local;
    this.bolsaSprite = this.add.image(x, y, 'death_bag').setOrigin(0.5, 1).setDepth(12);
    this.tweens.add({ targets: this.bolsaSprite, y: y - 3, duration: 1200, yoyo: true, repeat: -1 });
  }

  private destruirBolsaDaSala(): void {
    this.bolsaSprite?.destroy();
    this.bolsaSprite = null;
    this.bolsaNaSala = false;
  }

  /** `E` na bolsa: devolve o que cabe e deixa o resto no chão. */
  private recolherBolsa(): void {
    if (!this.bolsaMorte) return;
    const livres = Math.max(0, INVENTARIO.slots - this.bag.length);
    const r = recolher(this.bolsaMorte, livres);
    this.bag = [...this.bag, ...r.itens];
    this.moedas += r.moedas;
    this.bolsaMorte = r.sobra;
    this.desenharBolsaDaSala();
    EventBus.emit('game:moedas', { moedas: this.moedas });
    EventBus.emit('game:toast', {
      text: r.mochilaCheia ? 'MOCHILA CHEIA: O RESTO FICA AQUI' : 'BOLSA RECUPERADA',
    });
    this.legenda(r.mochilaCheia ? 'A bolsa não coube toda.' : 'Bolsa da morte recuperada.', 'marco');
    this.pushInventory();
    this.pushHud();
    this.pushBolsa();
    void this.persist('transition');
  }

  /** `MEC-004`: publica a bolsa para a UI (existe? onde? com quê?). */
  private pushBolsa(): void {
    EventBus.emit('game:bolsa', {
      existe: !!this.bolsaMorte,
      naSala: naSala(this.bolsaMorte, this.area.id, this.roomIndex),
      rotulo: this.bolsaMorte ? rotuloDaBolsa(this.bolsaMorte) : null,
      itens: this.bolsaMorte?.itens.length ?? 0,
      moedas: this.bolsaMorte?.moedas ?? 0,
    });
  }

  /**
   * `MEC-004` (`DEC-038`): regista a habilidade em `permanentes`. O `Player` já a tem — isto é o
   * **retrato do que foi conquistado**, que a morte não toca e que o teste pode contar.
   */
  private conquistarHabilidade(
    kind: 'double-jump' | 'strength' | 'breath' | 'hook' | 'climb' | 'glide',
  ): void {
    this.permanentes = conquistar(this.permanentes, kind);
    // `UI-14`: conquistar é o nível 1. Nunca desce — quem já tinha comprado o 2 fica no 2.
    this.niveis = { ...this.niveis, [kind]: Math.max(1, nivelDe(this.niveis, kind, MELHORIAS)) };
    this.aplicarNiveis();
  }

  /** `MEC-004`: soma moedas e publica (HUD). Nunca passa por baixo de zero. */
  private ganharMoedas(n: number): void {
    if (n <= 0) return;
    this.moedas = Math.max(0, this.moedas + n);
    EventBus.emit('game:moedas', { moedas: this.moedas });
    EventBus.emit('game:toast', { text: `+${n} MOEDAS` });
  }

  /**
   * `MEC-004`/`DEC-037` — o que se perde ao cair. Aplica a regra pura (`core/loot.ts`) e conta ao
   * jogador **o que perdeu**: uma perda silenciosa é indistinguível de um bug.
   */
  private aplicarPerdaDaMorte(): void {
    const rng = mulberry32((Date.now() ^ (this.sementePerda++ * 2654435761)) >>> 0);
    const perda = perderNaMorte({
      itens: this.bag,
      presos: this.presos,
      moedas: this.moedas,
      classeDe: (id) => (ITEMS[id] as { classe?: Classe }).classe ?? 'habilidade',
      regras: PERDA,
      rng,
    });
    this.bag = [...perda.ficam];
    // os presos que ficaram continuam presos; os que já não estão na mochila saem da lista
    this.presos = this.presos.filter((id) => this.bag.includes(id));
    this.moedas = perda.moedasRestantes;
    EventBus.emit('game:moedas', { moedas: this.moedas });

    /*
     * `MEC-004` (`DEC-038`): o que se perdeu **fica no chão**, numa bolsa. Só há uma no mundo — a
     * morte de agora destrói a anterior, com itens e moedas, e é isso que dá peso à perda.
     */
    const nova = criarBolsa(perda.perdidos, perda.moedasPerdidas, this.localDaBolsa());
    const troca = substituir(this.bolsaMorte, nova);
    this.bolsaMorte = troca.atual;
    this.destruirBolsaDaSala();
    if (troca.destruida) {
      EventBus.emit('game:toast', { text: 'A BOLSA ANTERIOR FOI PERDIDA' });
      this.legenda('A bolsa da morte anterior foi destruída.', 'perigo');
    }
    this.pushBolsa();
    EventBus.emit('game:morte', {
      perdidos: perda.perdidos,
      moedasPerdidas: perda.moedasPerdidas,
      linhas: resumoDaPerda(perda, (id) => (ITEMS[id] as { name: string }).name),
      presoMantido: this.presos.length,
      bolsa: this.bolsaMorte ? rotuloDaBolsa(this.bolsaMorte) : null,
      bolsaDestruida: !!troca.destruida,
    });
    this.pushInventory();
    this.pushHud();
  }

  /** A mochila como `core/inventory` a entende (lista de itens + lista de presos). */
  private bolsa(): Bolsa {
    return { itens: this.bag, presos: this.presos };
  }

  /**
   * `EVT-009` — prender e soltar. O resultado é aplicado **só** se a regra aceitar; o motivo,
   * quando há um, aparece como aviso (`VINTE JÁ ESTÃO PRESOS.`) e não como erro.
   */
  private commandInventory(action: 'pin' | 'unpin' | 'recover', id: ItemId): void {
    if (action === 'recover') return; // bolsa da morte: etapa seguinte (`MEC-004`)
    const r = action === 'pin'
      ? prenderNaBolsa(this.bolsa(), id, INVENTARIO)
      : soltarDaBolsa(this.bolsa(), id);
    this.bag = [...r.bolsa.itens];
    this.presos = [...r.bolsa.presos];
    if (!r.ok) {
      EventBus.emit('game:toast', { text: MOTIVO_TEXTO[r.motivo ?? 'sem-item'] });
    } else {
      EventBus.emit('game:toast', { text: action === 'pin' ? 'PRESO' : 'SOLTO' });
    }
    this.pushInventory();
    this.pushHud();
  }

  private pushInventory(): void {
    EventBus.emit('game:inventory', {
      slotsUsed: this.bag.length,
      // `pinnedCount` era o número de permanentes; passou a ser o dos **presos** (`MEC-004`).
      pinnedCount: this.presos.length,
      itens: this.bag,
      presos: this.presos,
    });
    this.pushBau();
  }
}

void MOVE;
