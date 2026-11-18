/**
 * `UI-13` — **a introdução** (`docs/04` §4.2.3): o que o jogador lê depois de criar o herói e
 * antes de a primeira sala existir.
 *
 * O texto vive aqui, e não no componente, pela mesma razão que a `MENU` vive no `tuning.ts`: um
 * ecrã que guarda a própria história não pode ser lido, revisto nem traduzido sem mexer no desenho.
 * Também é o único jeito de o conteúdo ser testado — **a história não é decoração**: diz quem é o
 * Homem Macho, contra o que ele luta e por que a humanidade depende dele.
 *
 * A navegação é pura (`avancar`, `voltar`, `saltar`, `teclaHistoria`): o componente React só ouve
 * o teclado e desenha o quadro que estas funções escolherem.
 *
 * **Arte:** nenhuma. Cada quadro tem uma **área reservada** (`ARTE · RESERVADA`), como a abertura
 * em parallax; quando a arte chegar, entra por trás do texto e nenhum quadro se move.
 */

export type IdQuadro = 'veu' | 'queda' | 'trevas' | 'soldados' | 'comeco';

export interface Quadro {
  id: IdQuadro;
  /** Título curto, em maiúsculas, como os títulos dos painéis. */
  titulo: string;
  /** Duas ou três frases. Mais que isso e o jogador salta — e então a história não existe. */
  linhas: readonly string[];
}

export const HISTORIA: readonly Quadro[] = [
  {
    id: 'veu',
    titulo: 'O VÉU',
    linhas: [
      'Esta guerra não começou contigo. Já dura gerações.',
      'De um lado, o que resta da humanidade. Do outro, monstros e demónios '
      + 'que não deviam estar deste lado.',
    ],
  },
  {
    id: 'queda',
    titulo: 'O VÉU ROMPEU',
    linhas: [
      'Havia uma fronteira — o véu — que lhes barrava o acesso livre a este mundo.',
      'Já não há. Alguém a rompeu, e o que estava do outro lado entrou todo de uma vez.',
    ],
  },
  {
    id: 'trevas',
    titulo: 'O QUE SOBROU',
    linhas: [
      'Parte da civilização humana foi escravizada. A outra parte foi exterminada.',
      'O planeta está mergulhado em trevas e devastação — sem céu, sem colheita, sem recuo.',
    ],
  },
  {
    id: 'soldados',
    titulo: 'OS HOMENS MACHOS',
    linhas: [
      'Os Homens Machos são soldados rasos. Não são escolhidos: são o que sobrou de pé.',
      'São a esperança da raça humana e deste planeta. Lutam para se tornarem os heróis '
      + 'de quem já não pode lutar.',
    ],
  },
  {
    id: 'comeco',
    titulo: 'O COMEÇO',
    linhas: [
      'Um soldado raso. Uma batalha que já era antiga quando ele nasceu.',
      'É aqui que a tua história começa.',
    ],
  },
];

export const TOTAL_QUADROS = HISTORIA.length;

/** Estado da introdução. `fim` é a única coisa que o `App` observa: manda entrar no jogo. */
export interface HistoriaState {
  indice: number;
  /** `true` quando o jogador chegou ao fim **ou** saltou. */
  fim: boolean;
}

export const HISTORIA_INICIAL: HistoriaState = { indice: 0, fim: false };

export function quadroAtual(e: HistoriaState): Quadro {
  return HISTORIA[Math.min(Math.max(0, e.indice), TOTAL_QUADROS - 1)];
}

/** `Enter`/`Espaço`/`→`: mais um quadro. No último, a história acaba e o jogo começa. */
export function avancar(e: HistoriaState): HistoriaState {
  if (e.fim) return e;
  return e.indice >= TOTAL_QUADROS - 1
    ? { ...e, fim: true }
    : { indice: e.indice + 1, fim: false };
}

/**
 * `←`: um quadro atrás. No primeiro não faz nada — não há para onde ir, e uma história já
 * terminada (`fim`) não volta a existir.
 */
export function voltar(e: HistoriaState): HistoriaState {
  return e.indice <= 0 ? e : { indice: e.indice - 1, fim: false };
}

/** `S` ou o botão `SALTAR`: o jogador já sabe o que precisa e quer jogar. */
export function saltar(e: HistoriaState): HistoriaState {
  return { ...e, fim: true };
}

/**
 * O teclado da introdução, num só sítio. Devolve **estado**, não ações: quem chama compara com o
 * anterior e decide se há algo a fazer (o mesmo contrato do `tecla` do menu).
 */
export function teclaHistoria(e: HistoriaState, key: string): HistoriaState {
  switch (key) {
    case 'Enter':
    case ' ':
    case 'ArrowRight':
    case 'ArrowDown':
      return avancar(e);
    case 'ArrowLeft':
    case 'ArrowUp':
      return voltar(e);
    case 's':
    case 'S':
    case 'Escape':
      return saltar(e);
    default:
      return e;
  }
}

/** Texto acessível de um quadro — o leitor de ecrã ouve a história, não só o título. */
export function descreverQuadro(q: Quadro, indice: number): string {
  return `${q.titulo}. ${q.linhas.join(' ')} (${indice + 1} de ${TOTAL_QUADROS})`;
}
