/**
 * PAT-C-07 (transporte local) — save com envelope versionado e revisão monotônica.
 * Sem phaser, sem react: `services/` não conhece `game/` nem `ui/` (ADR-01).
 * P-14 segue aberta: quando houver backend, muda o transporte, não o envelope.
 *
 * **Três slots.** O menu tem de mostrar *quais* saves existem para o jogador escolher qual
 * retomar (`UI-02`); com um slot só, "CONTINUAR" era um botão sem escolha. Cada slot é uma
 * chave própria (`…/slot-1`, `…/slot-2`, `…/slot-3`) e o slot 1 herda o save antigo de chave
 * única — ninguém perde a partida que já tinha.
 */
import type { Difficulty } from '../core/types';
import type { ItemId } from '../core/items';
import type { BolsaDaMorte } from '../core/deathbag';
import type { Personagem } from './character';

export interface Progress {
  areaId: string;
  roomId: string;
  roomIndex: number;
  checkpointRoom: number;
  hp: number;
  shield: number;
  completed?: boolean;
  /**
   * `UI-04`: a dificuldade escolhida no menu **é parte do save**. Sem isto, o jogador que
   * escolhia DIFÍCIL e voltava pelo CONTINUAR recebia MÉDIO sem ser avisado.
   */
  difficulty?: Difficulty;
  /**
   * `UI-02`: o menu mostra **onde** o jogador parou. Os rótulos são gravados aqui, no save,
   * porque `ui/` não pode importar `game/` (`ADR-01`) e o menu não vai conhecer as 90 salas
   * para descobrir um nome. Opcionais: save antigo (sem rótulo) continua válido.
   */
  areaName?: string;
  roomName?: string;
  roomTotal?: number;
  /**
   * `UI-07`: o **baú das salas seguras**. É um só, compartilhado por todas elas, e vive no save —
   * guardar um item e fechar o jogo não pode custar o item. Opcional: save antigo abre com o baú
   * vazio, e a lista é filtrada por `normalizarBau` na entrada (o `localStorage` é editável).
   */
  bau?: ItemId[];
  /**
   * `DEC-040`: as **moedas guardadas no baú**. Vivem no save pela mesma razão que os itens dele —
   * o baú é o sítio onde nada cai — e são saneadas na entrada (`moedasValidas`). Opcional: save
   * antigo abre com o baú sem moedas.
   */
  bauMoedas?: number;
  /**
   * `UI-14` (`DEC-041`): os **níveis** das habilidades (`0` não conquistada, `1..3`). Progressão
   * permanente comprada com moedas — fica no save pela mesma razão que o baú: perder o que se pagou
   * seria pior do que não o ter comprado. Opcional: save antigo abre com as habilidades que tem a
   * nível 1 (`normalizarNiveis`).
   */
  melhorias?: Record<string, number>;
  /**
   * `UI-14` — **o que já foi apanhado** (`collected`). Ficava só na memória da cena e por isso o
   * `CONTINUAR` devolvia o herói **sem as habilidades** que ele tinha conquistado (e os itens
   * voltavam a nascer no chão). É progressão permanente (`TST-005`): passa a viver no save, com as
   * habilidades reconstruídas a partir desta lista (`habilidadesConquistadas`).
   */
  coletados?: ItemId[];
  /**
   * `MEC-006` — **a porta de senha de L02-07 já cedeu**. Progressão permanente como o baú e os
   * níveis: a porta é a passagem para L02-08 e para LVL-03, e uma porta que se fecha outra vez
   * depois de aberta (ou que já não aceita a senha, porque o motor sabe que ela está aberta) é um
   * caminho cortado. Opcional: save antigo abre com a porta fechada, que é o estado inicial.
   */
  senhaAberta?: boolean;
  /**
   * `UI-22` (`DEC-043`) — **as salas onde o herói já entrou**, para o mapa.
   *
   * O mapa não pode ser um mapa do jogo inteiro: um mapa que mostra tudo no minuto 1 tira a
   * exploração. Fica no save porque um mapa que "esquece" o que se andou ontem é uma mentira — e
   * porque é a única lista do jogo que cresce com o jogador, e não com o que ele compra.
   * Saneada na entrada (`normalizarVisitadas`): um save editado não desenha salas inexistentes.
   */
  visitadas?: string[];
  /**
   * `DEC-042`: chefes derrotados desde o último drop raro. Vive no save porque a **garantia** ao 12.º
   * é uma promessa ao jogador — e uma promessa que se reinicia ao fechar o jogo não é promessa.
   */
  tentativasDrop?: number;
  /**
   * `MEC-004` (`DEC-038`): a **bolsa da morte** que ficou no chão. Guardada no save porque a
   * promessa é que ela espera pelo jogador — fechar o jogo não pode ser uma forma de a perder
   * (nem de a ganhar). Opcional: save antigo não tem bolsa, e é filtrada na entrada.
   */
  bolsaMorte?: BolsaDaMorte | null;
  /**
   * `UI-12`: o personagem criado **faz parte da partida**. Sem isto, `CONTINUAR` devolvia o
   * herói padrão e o jogador perdia o rosto que escolheu. Opcional: save antigo cai no padrão.
   */
  personagem?: Personagem;
}

export interface SaveEnvelope {
  version: number;
  revision: number;
  updatedAt: string;
  /** `UI-02`: em que slot este envelope vive. Redundante com a chave de propósito — o menu
   *  mostra o número da lista sem depender da posição no `localStorage`. */
  slot?: number;
  progress: Progress;
  settings: { music: number; sfx: number; reducedMotion: boolean };
}

export interface SaveResult { ok: boolean; revision?: number; errorCode?: string }

export interface SlotResumo {
  slot: number;
  /** `null` = slot vazio (primeira partida, ou o jogador apagou). */
  envelope: SaveEnvelope | null;
}

/** `MEC-007` no papel de regra de UI: três partidas em paralelo, nem mais nem menos. */
export const SAVE_SLOTS = 3;

const VERSION = 1;
/** Chave do save de slot único, anterior a esta versão. Lida uma vez e migrada para o slot 1. */
const LEGACY_KEY = 'homem-macho/save/v1';

export function chaveSlot(slot: number): string {
  return `homem-macho/save/v1/slot-${slot}`;
}

function storage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

function slotValido(slot: number): boolean {
  return Number.isInteger(slot) && slot >= 1 && slot <= SAVE_SLOTS;
}

function ler(store: Storage, chave: string): SaveEnvelope | null {
  const raw = store.getItem(chave);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SaveEnvelope;
    if (!parsed || parsed.version !== VERSION || !parsed.progress) return null;
    return parsed;
  } catch { return null; }
}

/**
 * Migração de uma vez: se o slot 1 está vazio e existe o save antigo de chave única, ele passa a
 * ser o slot 1. O save antigo **não** é apagado — se o jogador voltar a uma versão anterior, ele
 * continua lá.
 */
function migrarLegado(store: Storage): void {
  if (store.getItem(chaveSlot(1))) return;
  const antigo = ler(store, LEGACY_KEY);
  if (antigo) store.setItem(chaveSlot(1), JSON.stringify({ ...antigo, slot: 1 }));
}

export function readEnvelope(store: Storage, slot = 1): SaveEnvelope | null {
  if (!slotValido(slot)) return null;
  if (slot === 1) migrarLegado(store);
  return ler(store, chaveSlot(slot));
}

export async function saveProgress(progress: Progress, slot = 1): Promise<SaveResult> {
  const store = storage();
  if (!store) return { ok: false, errorCode: 'NO_STORAGE' };
  if (!slotValido(slot)) return { ok: false, errorCode: 'BAD_SLOT' };
  try {
    const prev = readEnvelope(store, slot);
    const envelope: SaveEnvelope = {
      version: VERSION,
      revision: (prev?.revision ?? 0) + 1,
      updatedAt: new Date().toISOString(),
      slot,
      progress,
      settings: prev?.settings ?? { music: 0.7, sfx: 0.8, reducedMotion: false },
    };
    store.setItem(chaveSlot(slot), JSON.stringify(envelope));
    return { ok: true, revision: envelope.revision };
  } catch {
    return { ok: false, errorCode: 'WRITE_FAILED' };
  }
}

export async function loadSave(slot = 1): Promise<SaveEnvelope | null> {
  const store = storage();
  return store ? readEnvelope(store, slot) : null;
}

/** `UI-02`: a lista que o painel de saves desenha, na ordem dos slots (vazios incluídos). */
export function listarSaves(): SlotResumo[] {
  const store = storage();
  return Array.from({ length: SAVE_SLOTS }, (_, i) => ({
    slot: i + 1,
    envelope: store ? readEnvelope(store, i + 1) : null,
  }));
}

/**
 * Slot onde uma partida nova deve entrar: o primeiro vazio; se não houver, o **mais antigo**
 * (menor `updatedAt`). É determinístico de propósito — o menu diz qual vai ser antes de o
 * jogador confirmar, em vez de escolher por ele em silêncio.
 */
export function slotParaNovaPartida(saves: SlotResumo[] = listarSaves()): number {
  const vazio = saves.find((s) => !s.envelope);
  if (vazio) return vazio.slot;
  const comData = saves
    .filter((s): s is SlotResumo & { envelope: SaveEnvelope } => !!s.envelope)
    .sort((a, b) => a.envelope.updatedAt.localeCompare(b.envelope.updatedAt));
  return comData[0]?.slot ?? 1;
}

export function clearSave(slot = 1): void {
  const store = storage();
  if (!store || !slotValido(slot)) return;
  store.removeItem(chaveSlot(slot));
  if (slot === 1) store.removeItem(LEGACY_KEY);
}

/** Apagar um slot é uma ação do jogador, não do jogo: existe para o painel de saves poder fazê-lo. */
export function apagarSlot(slot: number): void {
  clearSave(slot);
}
