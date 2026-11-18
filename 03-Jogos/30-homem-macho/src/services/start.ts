/**
 * A **intenção de partida** — o único estado que atravessa a fronteira React ↔ Phaser *antes*
 * da cena existir (`04-interface` §4.1: Menu → Dificuldade → Jogo).
 *
 * Vive em `services/` porque `ui/` não pode importar `game/` e `game/` não pode importar `react`
 * (`ADR-01`). Nada aqui é regra de jogo: é transporte de uma escolha do jogador, do mesmo jeito
 * que o save.
 */
import type { Difficulty } from '../core/types';
import type { Personagem } from './character';
import type { ItemId } from '../core/items';
import type { BolsaDaMorte } from '../core/deathbag';

export interface PendingStart {
  /** `new` zera o progresso; `continue` retoma o save de `MEC-007`. */
  mode: 'new' | 'continue';
  difficulty: Difficulty;
  /**
   * `DEC-027`: o slot do save em que esta partida vive. Uma partida nova escreve no slot que o
   * menu anunciou; retomar escreve **de volta no mesmo slot** — senão o jogador que retoma o
   * slot 2 passa a gravar por cima do slot 1 sem saber.
   */
  slot: number;
  /** `UI-12`: quem vai jogar. Vem da criação de personagem (ou do save, ao retomar). */
  personagem?: Personagem;
  /** Só em `continue`: o ponto exato de retomada. */
  resume?: {
    areaId: string; roomIndex: number; hp: number; shield: number;
    /** `UI-07`: o baú das salas seguras, que vive no save. */
    bau?: ItemId[];
    /** `DEC-040`: e as moedas que lá estão guardadas. */
    bauMoedas?: number;
    /** `UI-14`: os níveis das habilidades (progressão permanente). */
    melhorias?: Record<string, number>;
    /** `UI-14`: o que já foi apanhado — as habilidades conquistadas saem daqui. */
    coletados?: readonly ItemId[];
    /** `DEC-042`: a garantia do drop raro (chefes sem drop). */
    tentativasDrop?: number;
    /** `MEC-006`: a porta de senha de L02-07 já cedida. */
    senhaAberta?: boolean;
    /** `UI-22` (`DEC-043`): as salas já visitadas — o mapa desenha o que se andou. */
    visitadas?: readonly string[];
    /** `MEC-004`: a bolsa da morte que ficou no chão (`DEC-038`). */
    bolsaMorte?: BolsaDaMorte | null;
  };
}

let pendente: PendingStart | null = null;

/** O menu escolheu; o jogo ainda não existe. */
export function setPendingStart(p: PendingStart): void { pendente = p; }

/** Uma vez só: quem entra no jogo **consome** a intenção (`PAT-C-07`). */
export function takePendingStart(): PendingStart | null {
  const p = pendente;
  pendente = null;
  return p;
}

/** Leitura sem consumir — a cena precisa saber a dificuldade também ao trocar de sala. */
export function peekPendingStart(): PendingStart | null { return pendente; }

export function clearPendingStart(): void { pendente = null; }
