/**
 * `UI-14` — **as melhorias das habilidades**: subir de nível o que já se conquistou, pagando com
 * moedas. Regra pura, sem motor e sem dados do jogo (a tabela entra por parâmetro).
 *
 * Três decisões que este ficheiro toma e que os testes fixam:
 *
 * 1. **Só se melhora o que se conquistou.** Nível `0` é "não tem a habilidade" e nenhuma quantidade
 *    de moedas o compra — não há loja de habilidades no jogo, há melhorias sobre o que já se ganhou
 *    a jogar. Melhorar uma habilidade que não se tem é recusado com `nao-conquistada`, e não é
 *    um erro: é a resposta certa.
 * 2. **O teto é o nível máximo da tabela**, e ele é lido da tabela — não há um `3` mágico aqui.
 * 3. **Nada se perde por pedir.** Uma compra sem moedas, no máximo, ou de uma habilidade que não se
 *    tem devolve o estado **intacto** e o motivo. O dinheiro nunca sai sem o nível entrar.
 *
 * O que **não** está aqui: quanto custa e quanto cada nível vale. Isso é dado do jogo
 * (`MELHORIAS` em `game/data/tuning.ts`, `PAT-C-04`), porque é o que o proprietário vai balancear.
 */
import type { Habilidade } from './permanentes';

/** Níveis de cada habilidade: `0` não conquistada, `1` conquistada, `2` e `3` melhorada. */
export type Niveis = Readonly<Record<Habilidade, number>>;

/** Um nível da tabela. `custo` é em moedas; `fator` multiplica a constante que aquele nível afeta. */
export interface NivelDaHabilidade {
  readonly custo: number;
  readonly fator: number;
  readonly texto: string;
}

/** A tabela de melhorias: seis habilidades, cada uma com os seus níveis em ordem. */
export type TabelaDeMelhorias = Readonly<Record<Habilidade, readonly NivelDaHabilidade[]>>;

export type MotivoMelhoria = 'nao-conquistada' | 'maximo' | 'sem-moedas' | 'desconhecida';

export interface EstadoDeMelhorias {
  readonly niveis: Niveis;
  readonly moedas: number;
}

export interface ResultadoMelhoria extends EstadoDeMelhorias {
  readonly ok: boolean;
  readonly motivo?: MotivoMelhoria;
  /** O nível novo, quando a compra passou. */
  readonly nivel?: number;
}

/**
 * Os itens que **dão** cada habilidade (`03-conteudo` §3.3). Vive no `core` porque é a mesma tabela
 * que `core/items` descreve, e porque é ela que permite a um save antigo reconstruir as habilidades
 * a partir do que o jogador já apanhou — sem isto, os níveis comprados ficavam sem dono ao retomar.
 */
export const ITEM_DA_HABILIDADE: Readonly<Record<Habilidade, string>> = {
  'double-jump': 'ITM-003',
  strength: 'ITM-005',
  breath: 'ITM-006',
  hook: 'ITM-008',
  climb: 'ITM-009',
  glide: 'ITM-010',
};

/** As habilidades conquistadas, a partir dos itens apanhados. `[]` quando não se apanhou nada. */
export function habilidadesConquistadas(coletados: readonly string[]): Habilidade[] {
  const tem = new Set(coletados);
  return (Object.keys(ITEM_DA_HABILIDADE) as Habilidade[])
    .filter((hab) => tem.has(ITEM_DA_HABILIDADE[hab]));
}

/**
 * Fronteira do save: a lista de itens apanhados. Um `localStorage` editável pode trazer `"ITM-999"`,
 * números ou `null`; devolve só ids que existem, sem repetições e com um teto (a lista só cresce com
 * o que o jogo tem para dar, e uma lista infinita é um save corrompido).
 */
export function normalizarColetados(bruto: unknown, ehId: (v: unknown) => boolean): string[] {
  if (!Array.isArray(bruto)) return [];
  const vistos = new Set<string>();
  for (const valor of bruto) {
    if (typeof valor === 'string' && ehId(valor)) vistos.add(valor);
  }
  return [...vistos].slice(0, 64);
}

/** Nível de uma habilidade, sempre dentro do que a tabela permite. */
export function nivelDe(niveis: Niveis, hab: Habilidade, tabela: TabelaDeMelhorias): number {
  const max = maxNivel(tabela, hab);
  const n = niveis[hab] ?? 0;
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(0, Math.floor(n)));
}

/** O nível máximo daquela habilidade — o comprimento da tabela dela. */
export function maxNivel(tabela: TabelaDeMelhorias, hab: Habilidade): number {
  return Math.max(0, (tabela[hab] ?? []).length);
}

/**
 * Níveis de partida a partir das habilidades conquistadas: conquistada = nível `1`, o resto `0`.
 * É o que faz um save antigo (sem `melhorias`) abrir com as habilidades que o jogador já tinha — e
 * sem níveis comprados que ele nunca comprou.
 */
export function niveisIniciais(
  conquistadas: readonly Habilidade[], tabela: TabelaDeMelhorias,
): Niveis {
  const base: Record<Habilidade, number> = {
    'double-jump': 0, strength: 0, breath: 0, hook: 0, climb: 0, glide: 0,
  };
  for (const hab of conquistadas) {
    if (maxNivel(tabela, hab) > 0) base[hab] = 1;
  }
  return base;
}

/**
 * Fronteira do save: um `localStorage` editável pode trazer `9`, `-2`, `NaN` ou uma habilidade que
 * não existe. Devolve sempre um estado válido, e **nunca abaixo do que foi conquistado** (senão
 * um save torto tirava uma habilidade que o jogador ganhou a jogar).
 */
export function normalizarNiveis(
  bruto: unknown, conquistadas: readonly Habilidade[], tabela: TabelaDeMelhorias,
): Niveis {
  const base: Record<Habilidade, number> = { ...niveisIniciais(conquistadas, tabela) };
  if (!bruto || typeof bruto !== 'object') return base;
  for (const [chave, valor] of Object.entries(bruto as Record<string, unknown>)) {
    if (!(chave in base)) continue; // habilidade inventada: ignorada em silêncio
    const hab = chave as Habilidade;
    // não conquistada fica a zero: o save não é uma loja, e um `localStorage` editado não pode
    // dar uma habilidade que o jogador não ganhou a jogar
    if (base[hab] === 0) continue;
    const max = maxNivel(tabela, hab);
    const n = typeof valor === 'number' && Number.isFinite(valor) ? Math.floor(valor) : 0;
    base[hab] = Math.min(max, Math.max(base[hab], n));
  }
  return base;
}

/** O custo do **próximo** nível, ou `null` quando já está no máximo. */
export function proximoCusto(
  niveis: Niveis, hab: Habilidade, tabela: TabelaDeMelhorias,
): number | null {
  const atual = nivelDe(niveis, hab, tabela);
  if (atual === 0) return null; // não conquistada: não há preço, há um requisito
  const proximo = tabela[hab]?.[atual]; // índice `atual` = o nível seguinte (0-based)
  return proximo ? proximo.custo : null;
}

/** O texto do **próximo** nível — é o que a UI mostra antes de o jogador pagar. */
export function proximoTexto(
  niveis: Niveis, hab: Habilidade, tabela: TabelaDeMelhorias,
): string | null {
  const atual = nivelDe(niveis, hab, tabela);
  if (atual === 0) return null;
  return tabela[hab]?.[atual]?.texto ?? null;
}

/**
 * O fator do nível **atual** (o primeiro nível vale `1`: a habilidade tal como foi conquistada). É
 * o número que a cena multiplica à constante do `tuning` — salto aéreo, segundos de fôlego,
 * alcance do gancho, velocidade da escalada, queda do planeio, alcance do golpe.
 */
export function fatorDe(niveis: Niveis, hab: Habilidade, tabela: TabelaDeMelhorias): number {
  const atual = nivelDe(niveis, hab, tabela);
  if (atual === 0) return 1;
  const f = tabela[hab]?.[atual - 1]?.fator;
  return typeof f === 'number' && Number.isFinite(f) && f > 0 ? f : 1;
}

/**
 * Compra o nível seguinte. Recusa — sem tocar em nada — quando a habilidade não foi conquistada,
 * já está no máximo, ou as moedas não chegam. Quando passa, o nível sobe **e** o dinheiro sai, na
 * mesma operação: não existe um estado em que um aconteceu e o outro não.
 */
export function melhorar(
  estado: EstadoDeMelhorias, hab: Habilidade, tabela: TabelaDeMelhorias,
): ResultadoMelhoria {
  if (!(hab in tabela)) return { ...estado, ok: false, motivo: 'desconhecida' };
  const atual = nivelDe(estado.niveis, hab, tabela);
  if (atual === 0) return { ...estado, ok: false, motivo: 'nao-conquistada' };
  const custo = proximoCusto(estado.niveis, hab, tabela);
  if (custo === null) return { ...estado, ok: false, motivo: 'maximo' };
  const moedas = Number.isFinite(estado.moedas) ? Math.max(0, Math.floor(estado.moedas)) : 0;
  if (moedas < custo) return { ...estado, moedas, ok: false, motivo: 'sem-moedas' };
  return {
    niveis: { ...estado.niveis, [hab]: atual + 1 },
    moedas: moedas - custo,
    ok: true,
    nivel: atual + 1,
  };
}

/** Texto curto do motivo. A UI mostra isto; nunca um código. */
export const MOTIVO_MELHORIA_TEXTO: Record<MotivoMelhoria, string> = {
  'nao-conquistada': 'AINDA NÃO CONQUISTASTE ESTA HABILIDADE.',
  maximo: 'JÁ ESTÁ NO NÍVEL MÁXIMO.',
  'sem-moedas': 'MOEDAS INSUFICIENTES.',
  desconhecida: 'ESSA HABILIDADE NÃO EXISTE.',
};
