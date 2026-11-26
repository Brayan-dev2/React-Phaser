/**
 * A **bolsa da morte** — o que se perdeu fica no chão, recuperável. Regra pura, sem motor.
 *
 * O ciclo que o dono do jogo pediu, e que este ficheiro fixa:
 *
 * 1. Ao morrer, o que se perdeu (`core/loot.ts`) **não desaparece**: vai para uma bolsa deixada no
 *    sítio onde o herói caiu — ou, na arena de chefe, à entrada dela (`P-28`: a misericórdia é não
 *    obrigar a atravessar o chefe para reaver as coisas).
 * 2. A bolsa guarda **todos** os itens perdidos e **todas** as moedas perdidas.
 * 3. **Só existe uma bolsa de cada vez.** Morrer outra vez sem a recuperar **destrói a anterior** —
 *    itens e moedas incluídos. É a única forma de a perda doer: com duas bolsas no mundo, a morte
 *    não custava nada.
 * 4. Recolher devolve o que **cabe**: as moedas entram sempre; os itens entram até a mochila
 *    encher, e o que sobra **fica na bolsa** (nada desaparece por falta de espaço).
 */
import type { ItemId } from './items';

export interface Local {
  readonly areaId: string;
  readonly roomIndex: number;
  /** Rótulo da sala no save (`L01-04`), para o HUD poder dizer onde é sem conhecer as 90 salas. */
  readonly sala: string;
  readonly x: number;
  readonly y: number;
}

export interface BolsaDaMorte {
  readonly itens: readonly ItemId[];
  readonly moedas: number;
  readonly local: Local;
}

/**
 * Cria a bolsa do que se perdeu. **Sem perdas, sem bolsa** — uma bolsa vazia no chão seria um
 * objeto que não faz nada e que o jogador teria de ir buscar por nada.
 */
export function criarBolsa(itens: readonly ItemId[], moedas: number, local: Local): BolsaDaMorte | null {
  const temItens = itens.length > 0;
  const temMoedas = moedas > 0;
  if (!temItens && !temMoedas) return null;
  return { itens: [...itens], moedas: Math.max(0, moedas), local };
}

/**
 * A morte seguinte. A bolsa anterior **é destruída** (o que lá estava perde-se) e a nova ocupa o
 * lugar dela. Devolve as duas coisas porque a cena tem de contar as duas ao jogador.
 */
export function substituir(
  anterior: BolsaDaMorte | null,
  nova: BolsaDaMorte | null,
): { destruida: BolsaDaMorte | null; atual: BolsaDaMorte | null } {
  return { destruida: anterior, atual: nova };
}

export interface Recolha {
  /** Itens que voltaram para a mochila, pela ordem da bolsa. */
  readonly itens: readonly ItemId[];
  readonly moedas: number;
  /** `null` quando a bolsa ficou vazia (deixou de existir). */
  readonly sobra: BolsaDaMorte | null;
  /** `true` quando havia itens a mais para a mochila — a bolsa continua no chão. */
  readonly mochilaCheia: boolean;
}

/**
 * Recolhe a bolsa. `espacosLivres` vem da mochila no momento do gesto: as moedas entram sempre, e
 * os itens entram até encher. O que não couber fica — a bolsa não é um saco sem fundo nem um
 * limbo: se não cabe, continua no chão à espera.
 */
export function recolher(bolsa: BolsaDaMorte, espacosLivres: number): Recolha {
  const cabem = Math.max(0, espacosLivres);
  const itens = bolsa.itens.slice(0, cabem);
  const restantes = bolsa.itens.slice(cabem);
  const sobra: BolsaDaMorte | null = restantes.length
    ? { itens: restantes, moedas: 0, local: bolsa.local }
    : null;
  return {
    itens,
    moedas: bolsa.moedas,
    sobra,
    mochilaCheia: restantes.length > 0,
  };
}

/** A bolsa está nesta sala? A comparação é de área **e** de índice — dois setores têm salas 0. */
export function naSala(bolsa: BolsaDaMorte | null, areaId: string, roomIndex: number): boolean {
  if (!bolsa) return false;
  return bolsa.local.areaId === areaId && bolsa.local.roomIndex === roomIndex;
}

/**
 * Fronteira do save: a bolsa vem de um `localStorage` que qualquer pessoa edita. Devolve `null` ou
 * uma bolsa com ids conhecidos, moedas finitas e um local com números — nunca um objeto meio
 * preenchido que rebentaria no `mountRoom`.
 */
export function normalizarBolsaDaMorte(
  bruto: unknown, ehId: (v: unknown) => boolean, limiteItens: number,
): BolsaDaMorte | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const b = bruto as Partial<BolsaDaMorte>;
  const itens = Array.isArray(b.itens) ? b.itens.filter(ehId).slice(0, limiteItens) as ItemId[] : [];
  const moedas = typeof b.moedas === 'number' && Number.isFinite(b.moedas)
    ? Math.max(0, Math.floor(b.moedas)) : 0;
  const l = b.local as Partial<Local> | undefined;
  if (!l || typeof l !== 'object') return null;
  const local: Local = {
    areaId: typeof l.areaId === 'string' ? l.areaId : 'LVL-01',
    roomIndex: typeof l.roomIndex === 'number' && Number.isInteger(l.roomIndex) ? l.roomIndex : 0,
    sala: typeof l.sala === 'string' ? l.sala : 'L01-01',
    x: typeof l.x === 'number' && Number.isFinite(l.x) ? l.x : 96,
    y: typeof l.y === 'number' && Number.isFinite(l.y) ? l.y : 380,
  };
  if (itens.length === 0 && moedas === 0) return null;
  return { itens, moedas, local };
}

/** Texto do HUD: `BOLSA · L01-04 · 3 ITENS · 10 MOEDAS`. */
export function rotuloDaBolsa(bolsa: BolsaDaMorte): string {
  const partes = [`BOLSA · ${bolsa.local.sala}`];
  if (bolsa.itens.length) partes.push(`${bolsa.itens.length} ${bolsa.itens.length > 1 ? 'ITENS' : 'ITEM'}`);
  if (bolsa.moedas) partes.push(`${bolsa.moedas} MOEDA${bolsa.moedas > 1 ? 'S' : ''}`);
  return partes.join(' · ');
}
