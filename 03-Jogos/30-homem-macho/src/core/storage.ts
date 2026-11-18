/**
 * `UI-07` — o **baú das salas seguras**. Regra pura, sem motor, sem `localStorage`.
 *
 * O que este ficheiro decide, e por quê:
 *
 * 1. **Há um baú, e não um por sala.** Os quartos seguros existem para o jogador respirar e
 *    guardar; um baú por sala transformaria "guardar" em "escolher onde deixar as coisas" — e o
 *    jogador que guarda no quarto errado perde tudo o que lá deixou quando a campanha avança. A
 *    lista é **a mesma** em todas as salas seguras: o que se guarda em L01-05 está em L16-04.
 * 2. **Guardar tira da mochila**, não copia. O item não existe em dois sítios ao mesmo tempo —
 *    senão o baú seria uma máquina de duplicar equipamento.
 * 3. **O baú tem 40 espaços, como a mochila**, e as duas capacidades são checadas na hora de
 *    mover: tirar do baú com a mochila cheia é recusado, e o item **fica onde estava** (nada se
 *    perde por falta de espaço).
 * 4. **O que está no baú não se prende.** Prender é sobre a bolsa da morte; o baú é o sítio onde
 *    nada cai. Guardar um item preso **solta-o** — o contrário seria um preso a contar para os 20
 *    sem estar na mochila.
 */
import type { ItemId } from './items';
import { largar, ocupacao, type Bolsa, type Capacidade, type Motivo } from './inventory';

/** O baú é uma lista de itens; a ordem é a de chegada (é a que a UI desenha). */
export type Bau = readonly ItemId[];

export type MotivoBau = Motivo | 'bau-cheio' | 'mochila-cheia' | 'sem-espaco-no-bau';

export interface ResultadoBau {
  readonly bolsa: Bolsa;
  readonly bau: Bau;
  readonly ok: boolean;
  readonly motivo?: MotivoBau;
}

/**
 * Guarda um item da mochila no baú. Recusa: item que não está na mochila, baú cheio.
 * Ao guardar, o item **deixa de estar preso** (regra 4).
 */
export function guardarNoBau(
  bolsa: Bolsa, bau: Bau, id: ItemId, capMochila: Capacidade, capBau: Capacidade,
): ResultadoBau {
  if (!bolsa.itens.includes(id)) return { bolsa, bau, ok: false, motivo: 'sem-item' };
  if (bau.length >= capBau.slots) return { bolsa, bau, ok: false, motivo: 'bau-cheio' };
  const semItem = largar(bolsa, id);
  return { bolsa: semItem.bolsa, bau: [...bau, id], ok: true };
}

/**
 * Tira um item do baú para a mochila. Recusa: mochila cheia, item ausente.
 * O item chega **solto** (não preso): quem quer que ele não caia volta a prendê-lo.
 */
export function retirarDoBau(
  bolsa: Bolsa, bau: Bau, id: ItemId, capMochila: Capacidade,
): ResultadoBau {
  const i = bau.indexOf(id);
  if (i < 0) return { bolsa, bau, ok: false, motivo: 'sem-item' };
  if (ocupacao(bolsa, capMochila).livres < 1) return { bolsa, bau, ok: false, motivo: 'mochila-cheia' };
  return {
    bolsa: { ...bolsa, itens: [...bolsa.itens, id] },
    bau: bau.filter((_, k) => k !== i),
    ok: true,
  };
}

/** `true` quando o item está no baú (a UI marca as células com isto). */
export function estaNoBau(bau: Bau, id: ItemId): boolean {
  return bau.includes(id);
}

/** Quantos espaços ainda cabem no baú, para o cabeçalho do painel. */
export function espacosDoBau(bau: Bau, capBau: Capacidade): { usados: number; livres: number; cheio: boolean } {
  const usados = bau.length;
  return {
    usados,
    livres: Math.max(0, capBau.slots - usados),
    cheio: usados >= capBau.slots,
  };
}

/**
 * Fronteira do save: o `Progress.bau` vem de um `localStorage` que qualquer pessoa pode editar.
 * Devolve uma lista **sempre válida** — ids conhecidos, no máximo `capBau.slots`, e nada de
 * duplicados inventados por um JSON torto.
 */
export function normalizarBau(bruto: unknown, capBau: Capacidade, ehId: (v: unknown) => boolean): Bau {
  if (!Array.isArray(bruto)) return [];
  return bruto.filter(ehId).slice(0, capBau.slots) as ItemId[];
}

/*
 * ---------- transferir em quantidade, e moedas no baú (`UI-07`, `DEC-040`) ----------
 *
 * O jogador não quer clicar dez vezes para guardar dez peças iguais, nem ficar com moedas numa
 * conta que a morte esvazia. Estas funções fazem o mesmo que as de cima, mas com um **número**:
 *
 * - `quantidade` é **quantas cópias** daquele id se movem. Nunca é inventada: corta-se no que
 *   existe (e no espaço que há do outro lado), e o que sobra fica onde estava.
 * - **Nada se perde por falta de espaço.** Se só cabem 3 de 5, movem-se 3 e o resultado diz
 *   `movidos: 3`; os outros 2 continuam do lado de origem.
 * - As **moedas** têm o seu próprio par de funções: o baú não tem limite de moedas (é o único
 *   sítio do jogo onde elas estão a salvo da morte), e o par nunca cria nem destrói moeda — o que
 *   sai de um lado entra no outro.
 */

/** Uma quantidade pedida pelo painel: um número, ou `'tudo'`. */
export type Quantidade = number | 'tudo';

export interface ResultadoMover {
  readonly bolsa: Bolsa;
  readonly bau: Bau;
  /** Quantas cópias mudaram de lado. `0` vem com `motivo`. */
  readonly movidos: number;
  readonly ok: boolean;
  readonly motivo?: MotivoBau;
}

/** Corta a quantidade pedida no que existe (e é finito). `'tudo'` é tudo o que há. */
function quantosPedidos(pedido: Quantidade, disponivel: number): number {
  if (pedido === 'tudo') return disponivel;
  if (!Number.isFinite(pedido)) return 0;
  return Math.max(0, Math.min(disponivel, Math.floor(pedido)));
}

/** Tira `n` cópias de `id` de uma lista, mantendo a ordem das que ficam. */
function tirarCopia(itens: readonly ItemId[], id: ItemId, n: number): ItemId[] {
  const saida: ItemId[] = [];
  let restantes = n;
  for (const outro of itens) {
    if (outro === id && restantes > 0) { restantes -= 1; continue; }
    saida.push(outro);
  }
  return saida;
}

/**
 * Passa `quantidade` cópias de um item da mochila para o baú — **o "passar os semelhantes"** é
 * esta função com `'tudo'`. O item larga o alfinete, como em `guardarNoBau`.
 */
export function guardarNoBauEm(
  bolsa: Bolsa, bau: Bau, id: ItemId, quantidade: Quantidade,
  capMochila: Capacidade, capBau: Capacidade,
): ResultadoMover {
  const tenho = bolsa.itens.filter((x) => x === id).length;
  if (tenho === 0) return { bolsa, bau, movidos: 0, ok: false, motivo: 'sem-item' };
  const espaco = Math.max(0, capBau.slots - bau.length);
  if (espaco === 0) return { bolsa, bau, movidos: 0, ok: false, motivo: 'bau-cheio' };
  const movidos = quantosPedidos(quantidade, Math.min(tenho, espaco));
  if (movidos === 0) return { bolsa, bau, movidos: 0, ok: false, motivo: 'sem-item' };
  const itens = tirarCopia(bolsa.itens, id, movidos);
  return {
    bolsa: { itens, presos: bolsa.presos.filter((p) => itens.includes(p)) },
    bau: [...bau, ...Array.from({ length: movidos }, () => id)],
    movidos, ok: true,
  };
}

/** O contrário: `quantidade` cópias do baú para a mochila, cortado no espaço que houver. */
export function retirarDoBauEm(
  bolsa: Bolsa, bau: Bau, id: ItemId, quantidade: Quantidade, capMochila: Capacidade,
): ResultadoMover {
  const tenho = bau.filter((x) => x === id).length;
  if (tenho === 0) return { bolsa, bau, movidos: 0, ok: false, motivo: 'sem-item' };
  const espaco = ocupacao(bolsa, capMochila).livres;
  if (espaco === 0) return { bolsa, bau, movidos: 0, ok: false, motivo: 'mochila-cheia' };
  const movidos = quantosPedidos(quantidade, Math.min(tenho, espaco));
  if (movidos === 0) return { bolsa, bau, movidos: 0, ok: false, motivo: 'sem-item' };
  return {
    bolsa: {
      itens: [...bolsa.itens, ...Array.from({ length: movidos }, () => id)],
      presos: bolsa.presos,
    },
    bau: tirarCopia(bau, id, movidos),
    movidos, ok: true,
  };
}

/**
 * `GUARDAR TUDO` — tudo o que o baú aceitar, na ordem de chegada e **sem partir a mochila**:
 * o que não couber fica na mochila (não fica "meio guardado" no vazio).
 */
export function guardarTudoNoBau(
  bolsa: Bolsa, bau: Bau, capMochila: Capacidade, capBau: Capacidade,
): ResultadoMover {
  const espaco = Math.max(0, capBau.slots - bau.length);
  const movidos = Math.min(bolsa.itens.length, espaco);
  if (movidos === 0) {
    return {
      bolsa, bau, movidos: 0, ok: false,
      motivo: bau.length >= capBau.slots ? 'bau-cheio' : 'sem-item',
    };
  }
  const vao = bolsa.itens.slice(0, movidos);
  const ficam = bolsa.itens.slice(movidos);
  return {
    bolsa: { itens: ficam, presos: bolsa.presos.filter((p) => ficam.includes(p)) },
    bau: [...bau, ...vao],
    movidos, ok: true,
  };
}

/** `RETIRAR TUDO` — o baú devolve até a mochila encher; o resto fica no baú. */
export function retirarTudoDoBau(
  bolsa: Bolsa, bau: Bau, capMochila: Capacidade,
): ResultadoMover {
  const espaco = ocupacao(bolsa, capMochila).livres;
  const movidos = Math.min(bau.length, espaco);
  if (movidos === 0) {
    return {
      bolsa, bau, movidos: 0, ok: false,
      motivo: espaco === 0 ? 'mochila-cheia' : 'sem-item',
    };
  }
  return {
    bolsa: { itens: [...bolsa.itens, ...bau.slice(0, movidos)], presos: bolsa.presos },
    bau: bau.slice(movidos),
    movidos, ok: true,
  };
}

export interface ResultadoMoedas {
  /** Moedas na carteira do herói. */
  readonly moedas: number;
  /** Moedas guardadas no baú — a salvo da morte. */
  readonly noBau: number;
  readonly movidas: number;
  readonly ok: boolean;
}

/** Normaliza moeda vinda do save ou do painel: inteiro, nunca negativo, nunca `NaN`. */
export function moedasValidas(n: unknown): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

/** Carteira → baú. `'tudo'` guarda a carteira inteira. */
export function guardarMoedas(moedas: number, noBau: number, quantidade: Quantidade): ResultadoMoedas {
  const tenho = moedasValidas(moedas);
  const caixa = moedasValidas(noBau);
  const n = quantosPedidos(quantidade, tenho);
  if (n === 0) return { moedas: tenho, noBau: caixa, movidas: 0, ok: false };
  return { moedas: tenho - n, noBau: caixa + n, movidas: n, ok: true };
}

/** Baú → carteira. `'tudo'` esvazia as moedas do baú. */
export function retirarMoedas(moedas: number, noBau: number, quantidade: Quantidade): ResultadoMoedas {
  const tenho = moedasValidas(moedas);
  const caixa = moedasValidas(noBau);
  const n = quantosPedidos(quantidade, caixa);
  if (n === 0) return { moedas: tenho, noBau: caixa, movidas: 0, ok: false };
  return { moedas: tenho + n, noBau: caixa - n, movidas: n, ok: true };
}

export const MOTIVO_BAU_TEXTO: Record<MotivoBau, string> = {
  'sem-espaco': 'A MOCHILA ESTÁ CHEIA.',
  'sem-item': 'ESSE ITEM NÃO ESTÁ AQUI.',
  'limite-presos': 'VINTE JÁ ESTÃO PRESOS.',
  'ja-preso': 'JÁ ESTÁ PRESO.',
  'nao-preso': 'NÃO ESTAVA PRESO.',
  'nao-prende': 'ESSE NÃO OCUPA ESPAÇO.',
  'bau-cheio': 'O BAÚ ESTÁ CHEIO.',
  'mochila-cheia': 'A MOCHILA ESTÁ CHEIA. GUARDE ALGO NO BAÚ.',
  'sem-espaco-no-bau': 'O BAÚ ESTÁ CHEIO.',
};
