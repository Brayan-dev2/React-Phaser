/**
 * A **perda na morte** — regra pura, sem motor e sem aleatoriedade escondida.
 *
 * O que cai quando o herói cai (decisão do dono do jogo):
 *
 * | O que | Quanto se perde |
 * |---|---|
 * | **Itens do baú** (sala segura) | **nada, nunca** — não são argumento desta função |
 * | **Presos / equipados ao personagem** | **0 %** |
 * | **Armas simples** (apanhadas de inimigo comum) | **100 %** |
 * | **Armas forjadas ou conquistadas de chefe** | **20 %** de chance, **por unidade** |
 * | **Acumulativos** (cura, escudo) | **30 % da quantidade** |
 * | **Moedas** (de mobs e de chefes) | **100 %** |
 * | **Habilidades** (salto, força, fôlego, gancho, garra, planar) | **0 %** — `TST-005` |
 *
 * Três detalhes que a regra fixa e que não são óbvios:
 *
 * 1. **Os 20 % são por unidade, não por tipo.** Duas peças forjadas são duas chances; com o dado
 *    a cair mal nas duas, perdem-se as duas. É o que torna a decisão de levar uma peça forjada
 *    para a arena uma decisão.
 * 2. **Os 30 % arredondam para baixo.** Com 30 % de 1 cura, "perder 1 de 1" é 100 % — o oposto do
 *    que a regra diz. Com 3 curas perde-se 0, com 10 perde-se 3, com 20 perde-se 6.
 * 3. **A aleatoriedade entra por parâmetro** (`rng`). A cena passa um gerador semeado pelo relógio;
 *    os testes passam um gerador fixo e o resultado é reprodutível. Nenhuma chamada a `Math.random`
 *    vive aqui dentro, e é por isso que a regra pode ser testada.
 */
import type { ItemId } from './items';

/** As classes do dono, com o nome que o jogo usa. `habilidade` nunca cai (`TST-005`). */
export type Classe = 'acumulativo' | 'simples' | 'forjada' | 'habilidade';

/** Frações de 0 a 1. */
export interface RegrasDePerda {
  /** `30 %` da **quantidade** dos acumulativos. */
  readonly acumulativo: number;
  /** `100 %` das armas simples. */
  readonly simples: number;
  /** `20 %` de chance, por unidade, das forjadas/de chefe. */
  readonly forjada: number;
  /** `0 %` do que está preso/equipado. */
  readonly presa: number;
  /** `100 %` das moedas vindas de mobs e chefes. */
  readonly moedas: number;
}

export interface PerdaPedido {
  readonly itens: readonly ItemId[];
  readonly presos: readonly ItemId[];
  readonly moedas: number;
  /** A classe de cada item — vem do dado do jogo (`ITEMS[id].classe` em `tuning.ts`). */
  readonly classeDe: (id: ItemId) => Classe;
  readonly regras: RegrasDePerda;
  /** `[0, 1)`. Injetado: a cena usa um gerador semeado, o teste usa um fixo. */
  readonly rng: () => number;
}

export interface Perda {
  /** O que continua na mochila ao reaparecer (inclui os presos). */
  readonly ficam: readonly ItemId[];
  /** O que se perdeu de verdade. A ordem é a da mochila. */
  readonly perdidos: readonly ItemId[];
  /** Quantos caíram por classe — a UI diz `PERDEU 3 CURAS`, não `3 itens`. */
  readonly porClasse: Readonly<Record<Classe, number>>;
  readonly moedasPerdidas: number;
  readonly moedasRestantes: number;
}

const ZERO: Record<Classe, number> = { acumulativo: 0, simples: 0, forjada: 0, habilidade: 0 };

/**
 * Gerador determinístico (mulberry32). A cena semeia-o com o relógio; os testes com um número
 * fixo. Existe aqui — e não no motor — para a regra continuar a ser pura.
 */
export function mulberry32(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Quantas unidades de `qtd` se perdem com uma fração de perda. Ver nota 2 do cabeçalho. */
export function quantasPerder(qtd: number, fracao: number, aleatorio = false, rng?: () => number): number {
  if (qtd <= 0) return 0;
  if (aleatorio) {
    let n = 0;
    for (let i = 0; i < qtd; i++) if (!rng || rng() < fracao) n++;
    return n;
  }
  return Math.floor(qtd * Math.max(0, Math.min(1, fracao)));
}

/**
 * Aplica a morte. **Não recebe o baú de propósito** — o que está na sala segura não se perde, e a
 * forma mais segura de garantir isso é a função não o conhecer.
 */
export function perderNaMorte(p: PerdaPedido): Perda {
  const presos = new Set(p.presos);
  const ficam: ItemId[] = [];
  const perdidos: ItemId[] = [];
  const porClasse: Record<Classe, number> = { ...ZERO };

  /**
   * Conta as unidades por id, preservando a ordem de chegada: um item repetido (dois
   * equipamentos iguais) é contado uma vez e perdido em bloco.
   */
  const contagem = new Map<ItemId, number>();
  const ordem: ItemId[] = [];
  for (const id of p.itens) {
    if (!contagem.has(id)) ordem.push(id);
    contagem.set(id, (contagem.get(id) ?? 0) + 1);
  }

  for (const id of ordem) {
    const qtd = contagem.get(id) ?? 0;
    const classe = p.classeDe(id);

    /**
     * O **que** se perde depende da classe, e não só do número:
     *
     * - **preso** → 0, seja qual for a classe (é o pedido do dono, e vem antes de tudo);
     * - **habilidade** → 0 (`TST-005`);
     * - **simples** → fração **certa** da quantidade (100 % = todas), sem dados;
     * - **forjada** → **uma chance por unidade**, porque "20 % de perder" é sobre *cada* peça e
     *   não sobre o lote (duas peças guardadas não valem 40 % de perder uma qualquer);
     * - **acumulativo** → fração **da quantidade** (30 % de 10 curas = 3), sem dados.
     */
    let n: number;
    if (presos.has(id) || classe === 'habilidade') {
      n = 0;
    } else if (classe === 'forjada') {
      n = quantasPerder(qtd, p.regras.forjada, true, p.rng);
    } else if (classe === 'simples') {
      n = quantasPerder(qtd, p.regras.simples);
    } else {
      n = quantasPerder(qtd, p.regras.acumulativo);
    }

    porClasse[classe] += n;
    for (let i = 0; i < qtd - n; i++) ficam.push(id);
    for (let i = 0; i < n; i++) perdidos.push(id);
  }

  const moedasPerdidas = quantasPerder(p.moedas, p.regras.moedas);
  return {
    ficam,
    perdidos,
    porClasse,
    moedasPerdidas,
    moedasRestantes: Math.max(0, p.moedas - moedasPerdidas),
  };
}

/** Texto curto do que se perdeu, para o aviso da morte. Vazio quando não se perdeu nada. */
export function resumoDaPerda(perda: Perda, nomeDe: (id: ItemId) => string): string[] {
  const linhas: string[] = [];
  for (const id of new Set(perda.perdidos)) {
    const n = perda.perdidos.filter((x) => x === id).length;
    linhas.push(n > 1 ? `${n}× ${nomeDe(id)}` : nomeDe(id));
  }
  if (perda.moedasPerdidas > 0) linhas.push(`MOEDAS: ${perda.moedasPerdidas}`);
  return linhas;
}
