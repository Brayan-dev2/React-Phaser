/**
 * `UI-22` — **o mapa do jogo**, à maneira dos jogos de exploração (`DEC-043`).
 *
 * A ideia é a de sempre nesse género: o mapa **não é uma lista de salas**, é uma **planta** — as
 * salas ficam onde ficam, os corredores ligam o que está ligado, e o que ainda não se visitou não se
 * inventa. Isso obriga a duas coisas que uma lista não tem: **posições** e **ligações**.
 *
 * Este ficheiro é TS puro (`ADR-01`): não sabe o que é Phaser, não sabe o que é um setor do jogo e
 * não desenha nada. Recebe salas com saídas declaradas e devolve onde cada uma fica; recebe a lista
 * do que já se visitou e devolve o estado de cada sala. A cena entrega os dados, a UI desenha.
 *
 * **As posições não são escritas à mão.** Uma tabela de 90 coordenadas diverge do jogo à primeira
 * sala nova — e uma planta que mente sobre a topologia é pior do que não ter mapa. A disposição é
 * **derivada** das saídas (leste/oeste/teto/piso), com `BFS` a partir da primeira sala: leste anda
 * para a direita, o teto anda para cima. O mapa do L02-02 passa a mostrar a fenda a subir para
 * L02-06 exactamente porque a sala o declara (era esse o bug que o jogador viu antes do mapa
 * existir: a fenda descia para L02-03).
 */

/** Para onde vai cada saída de uma sala. Ids de sala (`L02-06`), nunca índices. */
export interface Saidas {
  readonly leste?: string;
  readonly oeste?: string;
  /** Fenda/alçapão no teto (`DEC-015`) — desenha-se **para cima**. */
  readonly teto?: string;
  /** Sumidouro, poço, queda longa — desenha-se **para baixo**. */
  readonly piso?: string;
  /**
   * Saída que muda de **setor** (poço de LVL-10 → LVL-03, conduto de LVL-11, escada de serviço).
   * Não é uma sala: é uma seta com o nome do setor ao lado, porque `L03-01` não é uma sala que se
   * veja daqui.
   */
  readonly portal?: string;
  /**
   * **Atalhos**: ligações do mesmo setor que **não** são a sala ao lado — o trifório de L07-05 (que
   * devolve a L07-01 com 4 salas de distância), o segundo alçapão de L13-04, uma queda longa. Não
   * entram na planta como casa vizinha (sobreporiam salas): desenham-se como **seta tracejada**, que
   * é o que elas são — um tubo, não um corredor.
   */
  readonly atalhos?: ReadonlyArray<{ readonly para: string; readonly direcao: 'teto' | 'piso' | 'leste' | 'oeste' }>;
}

export interface SalaDoMapa {
  readonly id: string;
  readonly nome?: string;
  readonly saidas: Saidas;
}

/** Casa da planta. `x` cresce para leste, `y` cresce para **baixo** (como na tela). */
export interface Posicao {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

export type EstadoDaSala = 'atual' | 'visitada' | 'conhecida' | 'desconhecida';

export interface Ligacao {
  readonly de: string;
  readonly para: string;
  readonly direcao: 'leste' | 'oeste' | 'teto' | 'piso' | 'portal';
  /** `true` quando o destino é noutro setor: a linha termina numa seta, não numa sala. */
  readonly portal: boolean;
  /** `true` num atalho (trifório, segundo alçapão): desenha-se tracejado, não é casa vizinha. */
  readonly atalho?: boolean;
}

/** Deslocamento de cada direção na planta. O teto é `-1` porque **y cresce para baixo**. */
const PASSO = {
  leste: { x: 1, y: 0 },
  oeste: { x: -1, y: 0 },
  teto: { x: 0, y: -1 },
  piso: { x: 0, y: 1 },
} as const;

const DIRECOES = ['leste', 'oeste', 'teto', 'piso'] as const;
type Direcao = typeof DIRECOES[number];

const chave = (x: number, y: number): string => `${x},${y}`;

/**
 * Dispõe as salas numa planta, por `BFS` a partir da **primeira** sala da lista (que fica em `0,0`).
 *
 * Regras, e cada uma tem teste:
 *
 * - uma saída leva ao vizinho **uma casa** nessa direção;
 * - se a casa estiver ocupada por outra sala (dois corredores que se cruzam sem porta), a sala
 *   **continua a andar** nessa direção até encontrar casa livre — melhor uma planta esticada do que
 *   duas salas empilhadas na mesma casa;
 * - salas que nenhuma saída alcança (sala sem porta declarada, dados tortos) entram na primeira casa
 *   livre da linha de baixo, para **nunca desaparecerem** do mapa;
 * - as coordenadas são normalizadas para começarem em `0,0` (a UI não desenha casas negativas).
 */
export function disporSalas(salas: readonly SalaDoMapa[]): Posicao[] {
  const ocupadas = new Map<string, string>();
  const posicoes = new Map<string, { x: number; y: number }>();
  const porId = new Map(salas.map((s) => [s.id, s]));

  const ocupar = (id: string, x: number, y: number): void => {
    ocupadas.set(chave(x, y), id);
    posicoes.set(id, { x, y });
  };
  const livre = (x: number, y: number): boolean => !ocupadas.has(chave(x, y));

  /** Anda na direção até encontrar casa livre (nunca sobrepõe duas salas). */
  const acharCasa = (de: { x: number; y: number }, passo: { x: number; y: number }): { x: number; y: number } => {
    let x = de.x + passo.x;
    let y = de.y + passo.y;
    let voltas = 0;
    while (!livre(x, y) && voltas < 64) {
      x += passo.x;
      y += passo.y;
      voltas += 1;
    }
    return { x, y };
  };

  if (salas.length === 0) return [];
  ocupar(salas[0].id, 0, 0);

  /*
   * **Primeiro passo: só as portas.** A planta é a topologia, e a topologia é feita de corredores
   * (`leste`/`oeste`/`teto`/`piso`). Os atalhos entram depois, de propósito: o monta-carga de
   * L08-01 também leva a L08-05, e se ele fosse processado na mesma passagem «roubava» a casa que
   * a porta de L08-04 ia ocupar — a arena e a sala seguinte apareciam a quatro casas de distância
   * por causa de um tubo.
   */
  const fila: string[] = [salas[0].id];
  while (fila.length > 0) {
    const id = fila.shift() as string;
    const sala = porId.get(id);
    const casa = posicoes.get(id);
    if (!sala || !casa) continue;
    for (const dir of DIRECOES) {
      const destino = sala.saidas[dir];
      if (!destino || destino === id) continue;
      if (posicoes.has(destino) || !porId.has(destino)) continue;
      const { x, y } = acharCasa(casa, PASSO[dir]);
      ocupar(destino, x, y);
      fila.push(destino);
    }
  }

  /*
   * **Segundo passo: os atalhos.** Uma sala que só se alcança por um tubo (L08-05 pelo
   * monta-carga, L13-05 pelo segundo alçapão) tem de aparecer na planta — uma sala que existe e
   * não está no mapa é pior do que um tubo desenhado torto.
   */
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const sala of salas) {
      const casa = posicoes.get(sala.id);
      if (!casa) continue;
      for (const atalho of sala.saidas.atalhos ?? []) {
        const destino = atalho.para;
        if (!destino || posicoes.has(destino) || !porId.has(destino)) continue;
        const { x, y } = acharCasa(casa, PASSO[atalho.direcao]);
        ocupar(destino, x, y);
        mudou = true;
      }
    }
  }

  /*
   * **Terceiro passo: as órfãs.** Uma sala sem porta nenhuma (dados tortos, sala em construção)
   * entra na linha de baixo — todas na mesma linha, pela ordem da lista. Uma sala que existe e
   * desaparece do mapa é um bug silencioso.
   */
  const orfas = salas.filter((s) => !posicoes.has(s.id));
  if (orfas.length > 0) {
    const y = Math.max(0, ...[...posicoes.values()].map((p) => p.y)) + 1;
    let x = 0;
    for (const sala of orfas) {
      while (!livre(x, y)) x += 1;
      ocupar(sala.id, x, y);
      x += 1;
    }
  }

  // normaliza para o canto superior esquerdo
  const todos = [...posicoes.values()];
  const minX = Math.min(0, ...todos.map((p) => p.x));
  const minY = Math.min(0, ...todos.map((p) => p.y));
  return salas.map((s) => {
    const p = posicoes.get(s.id) ?? { x: 0, y: 0 };
    return { id: s.id, x: p.x - minX, y: p.y - minY };
  });
}

/** As ligações para desenhar entre as salas — as mesmas saídas, já em pares. */
export function ligacoesDe(salas: readonly SalaDoMapa[]): Ligacao[] {
  const ids = new Set(salas.map((s) => s.id));
  const saida: Ligacao[] = [];
  for (const sala of salas) {
    for (const dir of DIRECOES) {
      const destino = sala.saidas[dir];
      if (!destino) continue;
      // uma porta é **um** traço: se as duas salas a declaram, desenha-se uma vez
      if (ids.has(destino) && saida.some((l) => l.de === destino && l.para === sala.id)) continue;
      saida.push({ de: sala.id, para: destino, direcao: dir, portal: !ids.has(destino) });
    }
    // o `portal` não é uma casa na planta: é uma seta para outro setor, e tem traço próprio
    if (sala.saidas.portal) {
      saida.push({ de: sala.id, para: sala.saidas.portal, direcao: 'portal', portal: true });
    }
    // e o atalho também não: é um tubo, desenhado tracejado
    for (const atalho of sala.saidas.atalhos ?? []) {
      saida.push({
        de: sala.id, para: atalho.para, direcao: atalho.direcao, portal: false, atalho: true,
      });
    }
  }
  return saida;
}

/**
 * O estado de uma sala no mapa. É a única regra de "revelação" do jogo:
 *
 * - `atual` — é onde o herói está;
 * - `visitada` — já lá esteve (está na lista do save);
 * - `conhecida` — **não** esteve lá, mas é vizinha de uma visitada: o jogador viu a porta. É o que
 *   torna o mapa útil (sabe para onde ir) sem ser um spoiler do setor inteiro;
 * - `desconhecida` — não se desenha.
 */
export function estadoDaSala(
  id: string, visitadas: readonly string[], atual: string | null, salas?: readonly SalaDoMapa[],
): EstadoDaSala {
  if (id === atual) return 'atual';
  if (visitadas.includes(id)) return 'visitada';
  if (!salas) return 'desconhecida';
  const visitadasSet = new Set(visitadas);
  const vizinha = salas.some((s) => {
    if (!visitadasSet.has(s.id)) return false;
    const direto = [s.saidas.leste, s.saidas.oeste, s.saidas.teto, s.saidas.piso];
    if (direto.includes(id)) return true;
    return (s.saidas.atalhos ?? []).some((a) => a.para === id);
  });
  return vizinha ? 'conhecida' : 'desconhecida';
}

/**
 * Saneia a lista de salas visitadas vinda do `localStorage`: um save editado à mão não pode
 * desenhar salas que não existem, nem crescer sem fim.
 */
export function normalizarVisitadas(
  cru: unknown, validas: readonly string[], teto = 400,
): string[] {
  if (!Array.isArray(cru)) return [];
  const conhecidas = new Set(validas);
  const saida: string[] = [];
  for (const item of cru) {
    if (typeof item !== 'string' || !conhecidas.has(item) || saida.includes(item)) continue;
    if (saida.length >= teto) break;
    saida.push(item);
  }
  return saida;
}

/** Quantas salas do setor já se viram — o número que o cabeçalho do mapa mostra. */
export function resumoDoSetor(
  salas: readonly SalaDoMapa[], visitadas: readonly string[],
): { visitadas: number; total: number; completo: boolean } {
  const vistas = new Set(visitadas);
  const visitadas_ = salas.filter((s) => vistas.has(s.id)).length;
  return { visitadas: visitadas_, total: salas.length, completo: visitadas_ >= salas.length };
}

/** `L02-06` → `LVL-02`. O prefixo é a chave do setor: um id só, sem tabela paralela. */
export function setorDe(salaId: string): string {
  const m = /^L(\d{2})-/.exec(salaId);
  return m ? `LVL-${m[1]}` : '';
}

/** Os setores que já se visitaram, pela ordem em que aparecem na lista de salas visitadas. */
export function setoresVisitados(visitadas: readonly string[]): string[] {
  const saida: string[] = [];
  for (const id of visitadas) {
    const setor = setorDe(id);
    if (setor && !saida.includes(setor)) saida.push(setor);
  }
  return saida;
}

/**
 * A sala seguinte na direção pedida, para as setas do painel. Devolve `null` quando não há nada
 * para onde ir — e não "a mais próxima", que faria a seleção saltar por cima de paredes.
 */
export function vizinhoNaDirecao(
  atual: string, direcao: 'cima' | 'baixo' | 'esquerda' | 'direita', posicoes: readonly Posicao[],
): string | null {
  const aqui = posicoes.find((p) => p.id === atual);
  if (!aqui) return null;
  const passo = direcao === 'direita' ? { x: 1, y: 0 }
    : direcao === 'esquerda' ? { x: -1, y: 0 }
      : direcao === 'cima' ? { x: 0, y: -1 } : { x: 0, y: 1 };
  const alvo = posicoes.find((p) => p.x === aqui.x + passo.x && p.y === aqui.y + passo.y);
  return alvo ? alvo.id : null;
}
