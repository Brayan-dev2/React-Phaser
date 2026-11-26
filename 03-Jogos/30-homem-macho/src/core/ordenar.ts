/**
 * `UI-07` — a **ordem** do que está na mochila e no baú. Regra pura, sem motor e sem dados do jogo:
 * a ficha de cada item entra por parâmetro (`Ficha`), porque `core/` não importa `game/`.
 *
 * Três decisões que este ficheiro toma e que os testes fixam:
 *
 * 1. **A ordem é uma vista, não uma mudança.** Ordenar não reescreve a mochila nem o save: a lista
 *    guardada continua na ordem de chegada, e a ordem escolhida é a que o painel desenha. Um
 *    "ordenar" que mexesse nos dados tornaria a ordem de chegada irrecuperável — e é a única
 *    ordem que diz ao jogador o que ele apanhhou primeiro.
 * 2. **"Quantidade" conta iguais.** O mesmo `ITM-004` apanhado três vezes são três espaços (é a
 *    regra da mochila, `core/inventory`), mas para efeitos de ordem são a mesma linha com `3`.
 * 3. **Nenhuma ordem depende do acaso.** Empatam sempre por nome e depois por classe, para que a
 *    grelha não mude de sítio entre dois desenhos iguais (um empate resolvido pelo `sort` do
 *    motor fazia os itens dançarem ao prender e soltar).
 */
import type { ItemId } from './items';

/** As ordens que o painel oferece. A primeira é a de fábrica: a ordem de chegada. */
export const ORDENS = ['chegada', 'nome', 'tipo', 'quantidade', 'valor', 'raridade'] as const;

export type Ordem = (typeof ORDENS)[number];

/** O que a ordenação precisa de saber de cada item — vem de `game/data/tuning.ts`. */
export interface FichaDeItem {
  readonly nome: string;
  /** `consumivel` · `arma` · `habilidade` (`ITEMS[id].tipo`). */
  readonly tipo: string;
  /** Moedas que o item vale. `0` para o que não se vende (habilidades). */
  readonly valor: number;
  /** `0` comum · `1` rara · `2` lendária. Número e não texto: a ordem é a do número. */
  readonly raridade: number;
}

export type Ficha = (id: ItemId) => FichaDeItem;

/** O texto de cada ordem — o painel não escreve rótulos à mão. */
export const ROTULO_ORDEM: Record<Ordem, string> = {
  chegada: 'CHEGADA',
  nome: 'NOME',
  tipo: 'TIPO',
  quantidade: 'QTD',
  valor: 'VALOR',
  raridade: 'RARIDADE',
};

/** O `tipo` desempata por esta ordem: primeiro o que se usa, depois o que se guarda. */
const PESO_TIPO: Record<string, number> = { arma: 0, consumivel: 1, habilidade: 2 };

/** Quantas vezes cada id aparece. A ordem das chaves é a da primeira aparição. */
export function contar(itens: readonly ItemId[]): Map<ItemId, number> {
  const mapa = new Map<ItemId, number>();
  for (const id of itens) mapa.set(id, (mapa.get(id) ?? 0) + 1);
  return mapa;
}

function compararTexto(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Devolve **uma nova lista** na ordem pedida. `chegada` devolve a lista como está (a mesma ordem
 * que o save guarda). A função não mexe no argumento.
 */
export function ordenar(itens: readonly ItemId[], ordem: Ordem, ficha: Ficha): ItemId[] {
  const copia = [...itens];
  if (ordem === 'chegada') return copia;

  const quantos = contar(itens);
  const chave = (id: ItemId): FichaDeItem => {
    try {
      return ficha(id);
    } catch {
      // um id que a ficha não conhece (save antigo) não pode rebentar o painel: vai para o fim
      return { nome: `\uffff${id}`, tipo: 'outro', valor: 0, raridade: 0 };
    }
  };

  /**
   * Desempate final, sempre igual: nome, depois classe, depois o id. Sem isto, dois itens com o
   * mesmo valor trocavam de lugar entre dois desenhos e o painel parecia instável.
   */
  const desempate = (a: ItemId, b: ItemId): number => {
    const fa = chave(a);
    const fb = chave(b);
    return compararTexto(fa.nome, fb.nome)
      || (PESO_TIPO[fa.tipo] ?? 9) - (PESO_TIPO[fb.tipo] ?? 9)
      || compararTexto(a, b);
  };

  switch (ordem) {
    case 'nome':
      return copia.sort(desempate);
    case 'tipo':
      return copia.sort((a, b) => {
        const fa = chave(a);
        const fb = chave(b);
        return (PESO_TIPO[fa.tipo] ?? 9) - (PESO_TIPO[fb.tipo] ?? 9) || desempate(a, b);
      });
    case 'quantidade':
      // mais cópias primeiro; os iguais ficam juntos e na ordem de chegada entre si
      return copia.sort((a, b) => (quantos.get(b) ?? 1) - (quantos.get(a) ?? 1) || desempate(a, b));
    case 'valor':
      return copia.sort((a, b) => chave(b).valor - chave(a).valor || desempate(a, b));
    case 'raridade':
      return copia.sort((a, b) => chave(b).raridade - chave(a).raridade || desempate(a, b));
    default:
      return copia;
  }
}

/** Quantas cópias iguais existem na lista — o número que o painel mostra em `×N`. */
export function quantidadeDe(itens: readonly ItemId[], id: ItemId): number {
  return itens.reduce((n, outro) => (outro === id ? n + 1 : n), 0);
}

/** Descreve a ficha num texto de uma linha (`ARMA · 12 MOEDAS · RARA`). */
export function descreverFicha(f: FichaDeItem): string {
  const raridade = ['COMUM', 'RARA', 'LENDÁRIA'][f.raridade] ?? 'COMUM';
  const valor = f.valor > 0 ? ` · ${f.valor} MOEDAS` : ' · NÃO SE VENDE';
  return `${f.tipo.toUpperCase()}${valor} · ${raridade}`;
}
