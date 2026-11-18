/**
 * Máquinas de LVL-05 — `HAB-05` Força, bloco pesado, placa de contrapeso e elevador.
 * Fonte: `docs/niveis/LVL-05.md` §5 (habilidade) e §8 (o contrapeso é estado de mapa).
 *
 * TS puro (`ADR-01`): as regras de "pode empurrar?" e "o elevador sobe?" não precisam
 * de Phaser para serem verdadeiras — a cena só desenha o veredito.
 */

/** Veredito do elevador de L05-03 (`U`) — `requires=HAB-05`, `dest=LVL-06`. */
export type ElevatorVerdict =
  /** Sem `HAB-05`: a mensagem de `UI-12` (não é punição, é informação). */
  | 'sem-forca'
  /** Com Força, mas o contrapeso de L05-05 não foi engatado (§8). */
  | 'sem-contrapeso'
  /** HAB-05 + contrapeso: sobe. */
  | 'pronto';

export function elevatorVerdict(hasStrength: boolean, counterweightEngaged: boolean): ElevatorVerdict {
  if (!hasStrength) return 'sem-forca';
  if (!counterweightEngaged) return 'sem-contrapeso';
  return 'pronto';
}

/** Texto de `UI-12` por veredito — a mesma frase no jogo e no teste. */
export const ELEVATOR_LINE: Record<ElevatorVerdict, string> = {
  'sem-forca': 'AS ENGRENAGENS NÃO CEDEM. FALTA FORÇA.',
  'sem-contrapeso': 'A MÁQUINA ESTÁ SOLTA. FALTA CONTRAPESO.',
  'pronto': 'O ELEVADOR SOBE.',
};

export interface PushInput {
  readonly hasStrength: boolean;
  /** Coluna do bloco (em tiles) e direção que o jogador está empurrando. */
  readonly blockColumn: number;
  readonly dir: -1 | 1;
  /** Colunas ocupadas por parede/desnível/outro bloco. */
  readonly blockedColumns: readonly number[];
  /** Limites do corredor, em tiles (o bloco não sai do piso plano). */
  readonly minColumn: number;
  readonly maxColumn: number;
}

export interface PushResult {
  readonly moved: boolean;
  /** Coluna final do bloco (a mesma de entrada quando não moveu). */
  readonly column: number;
  /** Por que não moveu — `null` quando moveu. */
  readonly blockedBy: 'sem-forca' | 'parede' | 'limite' | null;
}

/**
 * Um empurrão = 1 tile, e só em piso plano (§5.3). Sem Força, nada acontece — é o que
 * faz o bloco de L05-02 (`PAT-LD-03`, exposição 1) ser lido como "pesado" e não como bug.
 */
export function pushBlock(input: PushInput): PushResult {
  if (!input.hasStrength) {
    return { moved: false, column: input.blockColumn, blockedBy: 'sem-forca' };
  }
  const alvo = input.blockColumn + input.dir;
  if (input.blockedColumns.includes(alvo)) {
    return { moved: false, column: input.blockColumn, blockedBy: 'parede' };
  }
  if (alvo < input.minColumn || alvo > input.maxColumn) {
    return { moved: false, column: input.blockColumn, blockedBy: 'limite' };
  }
  return { moved: true, column: alvo, blockedBy: null };
}

/**
 * O contrapeso engata quando o bloco chega à coluna da placa (`CEN-043`).
 * É estado de **mapa**, não de sessão: uma vez engatado, não desengata (§8).
 */
export function engagesCounterweight(blockColumn: number, plateColumn: number): boolean {
  return blockColumn === plateColumn;
}

/** Fusível do contrapeso: engatado é permanente, aceite ou não a repetição. */
export function applyCounterweight(engaged: boolean, reached: boolean): boolean {
  return engaged || reached;
}
