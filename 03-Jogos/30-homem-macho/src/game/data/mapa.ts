/**
 * `UI-22` (`DEC-043`) — **o mapa do jogo ligado aos dados dos setores**.
 *
 * Aqui vive a única tradução que o mapa precisa: uma `Room` do jogo (grade de caracteres + fichas
 * declaradas) vira uma `SalaDoMapa` (id, nome, saídas). Nada de coordenadas escritas à mão — a
 * planta é derivada em `core/mapa.ts` a partir destas saídas, e é por isso que o mapa **não pode
 * mentir** sobre a topologia: com a fenda de L02-02 a declarar L02-06, o mapa desenha-a a subir; se
 * a sala não a declarasse, o motor mandava o jogador para L02-03 e o mapa desenhava-o a subir para
 * a sala errada — o bug que o jogador viu antes de o mapa existir.
 *
 * As saídas vêm de onde o motor as lê, e não de uma segunda opinião:
 *
 * - **leste/oeste** — as portas `+`/`D` nas linhas 4–6 das bordas (a mesma janela do
 *   `LevelBuilder`, incluindo `Y`, a porta de senha de L02-07);
 * - **teto** — `+`/`^` na linha 0. O destino é `Room.hatches[].destRoom` quando a sala o declara;
 *   sem declaração vale a regra geral de `DEC-015` (a sala seguinte);
 * - **piso** — sumidouro (`Room.sink`, que pode mudar de setor), queda longa e monta-carga;
 * - **portal** — as passagens que **mudam de setor** (poço de LVL-10, conduto de LVL-11, escada de
 *   serviço de LVL-09 → LVL-10 e a saída dourada da última sala). Desenham-se como seta com o nome
 *   do setor, porque a sala de chegada não pertence a esta planta. A **varanda** de L16-06 não é
 *   portal: é `decor-back` sem colisão (`CEN-115`), um mirante para LVL-01, não um caminho.
 */
import { AREAS, AREA_ORDER } from './levels';
import type { Room } from './levels/lvl01';
import { disporSalas, setorDe, type Posicao, type SalaDoMapa, type Saidas } from '../../core/mapa';

/** O que o mapa mostra de um setor: as salas, as posições e o nome. */
export interface SetorNoMapa {
  readonly id: string;
  readonly nome: string;
  readonly salas: readonly SalaDoMapa[];
  readonly posicoes: readonly Posicao[];
  /** `0..15` na progressão, `-1` nos setores `[PÓS]` (`PAT-C-10`). */
  readonly ordem: number;
  readonly naProgressao: boolean;
  /** Setores alcançados por um `portal` a partir deste (poço, conduto, escada). */
  readonly liga: readonly string[];
}

/** As linhas onde o motor procura portas laterais. */
const LINHAS_DE_PORTA = [4, 5, 6] as const;

/** Todas as fendas/alçapões da linha 0 (o motor varre a linha toda, e uma sala pode ter duas). */
export function fendasDoTeto(room: Room): { from: number; to: number }[] {
  const linha = room.grid[0] ?? '';
  const fendas: { from: number; to: number }[] = [];
  for (let x = 0; x < linha.length; x += 1) {
    const ch = linha[x];
    if (ch !== '+' && ch !== '^') continue;
    const ultima = fendas[fendas.length - 1];
    if (ultima && ultima.to === x - 1) ultima.to = x;
    else fendas.push({ from: x, to: x });
  }
  return fendas;
}

/** A primeira fenda, para quem só quer saber se há teto. */
export function fendaDoTeto(room: Room): { from: number; to: number } | null {
  return fendasDoTeto(room)[0] ?? null;
}

/** O setor seguinte: na progressão, o da ordem; num `[PÓS]`, o número seguinte (se existir). */
export function proximoSetor(setor: string): string | undefined {
  const i = AREA_ORDER.indexOf(setor);
  if (i >= 0) return AREA_ORDER[i + 1];
  const numero = Number(setor.slice(4)) + 1;
  const candidato = `LVL-${String(numero).padStart(2, '0')}`;
  return AREAS[candidato] ? candidato : undefined;
}

/**
 * As saídas de uma sala. `ids` são os ids das salas do setor, pela ordem — é deles que saem os
 * destinos laterais e a regra de `DEC-015` (sem destino declarado, a sala seguinte).
 *
 * **Primário vs. atalho.** Cada direção tem **uma** ligação primária (a que a planta desenha como
 * casa vizinha). O que sobra — o segundo alçapão de L13-04, o trifório de L07-05, que devolve a
 * L07-01 com quatro salas de distância — vai para `atalhos` e desenha-se como seta tracejada. Sem
 * esta separação, a planta teria de sobrepor salas para manter a promessa de "uma casa de
 * distância", que é exactamente o que um mapa não pode fazer.
 */
export function saidasDaSala(
  room: Room, index: number, ids: readonly string[], setor: string,
): Saidas {
  const largura = (room.grid[0] ?? '').length;
  const leste = LINHAS_DE_PORTA.some((y) => {
    const ch = (room.grid[y] ?? '')[largura - 1];
    return ch === '+' || ch === 'D' || ch === 'Y';
  });
  const oeste = LINHAS_DE_PORTA.some((y) => {
    const ch = (room.grid[y] ?? '')[0];
    return ch === '+' || ch === 'D' || ch === 'Y';
  });

  // ---- teto: cada fenda leva à sala que a ficha declara, ou à seguinte (`DEC-015`) ----
  const destinosDoTeto: string[] = [];
  const fendas = fendasDoTeto(room);
  for (const fenda of fendas) {
    const declarado = room.hatches?.find((h) => h.from === fenda.from)?.destRoom;
    const destino = declarado ?? index + 1;
    const id = destino >= 0 && destino < ids.length ? ids[destino] : undefined;
    if (id && id !== room.id && !destinosDoTeto.includes(id)) destinosDoTeto.push(id);
  }

  // ---- piso: sumidouro (pode mudar de setor), queda longa e monta-carga ----
  const destinosDoPiso: string[] = [];
  let portal: string | undefined;
  if (room.sink) {
    if (room.sink.area === setor) destinosDoPiso.push(ids[room.sink.room]);
    else portal = room.sink.area;
  }
  if (destinosDoPiso.length === 0 && !portal && room.longFall) destinosDoPiso.push(ids[room.longFall.to]);
  if (destinosDoPiso.length === 0 && !portal && room.hoist) {
    if (room.hoist.area === setor) destinosDoPiso.push(ids[room.hoist.room]);
    else portal = room.hoist.area;
  }
  /*
   * A **varanda** de L16-06 não entra aqui de propósito: é `decor-back`, sem colisão — mostra LVL-01
   * do outro lado do abismo e **não se pode descer** (§4.6). Marcá-la como portal punha uma seta de
   * LVL-16 para LVL-01 na planta, como se o último setor devolvesse o jogador ao primeiro. A varanda
   * aparece na planta como mirante, não como passagem.
   */

  // ---- saída lateral que muda de setor: a última sala de um setor entra no seguinte ----
  if (leste && index === ids.length - 1) portal = proximoSetor(setor) ?? portal;

  const atalhos: { para: string; direcao: 'teto' | 'piso' | 'leste' | 'oeste' }[] = [];
  /*
   * Quando a sala tem **duas** fendas, a que sobe para a frente é a passagem e a que volta é o
   * atalho: em L13-04, o alçapão A devolve a L13-01 (o atalho de `PAT-LD-08`) e o B segue para
   * L13-05. Escolher "o primeiro declarado" punha a planta a desenhar a volta como se fosse o
   * caminho — e a beira alta aparecia pendurada numa seta.
   */
  const frente = (id: string): number => {
    const i = ids.indexOf(id);
    return i < 0 ? Number.MAX_SAFE_INTEGER : (i > index ? i - index : 1000 + (index - i));
  };
  destinosDoTeto.sort((a, b) => frente(a) - frente(b));
  const teto = destinosDoTeto[0];
  for (const extra of destinosDoTeto.slice(1)) atalhos.push({ para: extra, direcao: 'teto' });
  // o piso só é casa vizinha quando é a **sala seguinte**; um sumidouro que volta ao início do
  // setor (L07-05 → L07-01) é um tubo, não um corredor
  const piso = destinosDoPiso[0];
  const pisoEhVizinho = piso === ids[index + 1];
  if (piso && !pisoEhVizinho) atalhos.push({ para: piso, direcao: 'piso' });

  return {
    ...(leste && index + 1 < ids.length ? { leste: ids[index + 1] } : {}),
    ...(oeste && index > 0 ? { oeste: ids[index - 1] } : {}),
    ...(teto ? { teto } : {}),
    ...(piso && pisoEhVizinho ? { piso } : {}),
    ...(portal ? { portal } : {}),
    ...(atalhos.length > 0 ? { atalhos } : {}),
  };
}

/**
 * Fecha as portas laterais **nos dois sentidos**.
 *
 * Uma porta é um corredor com dois lados: se `L08-05` declara a oeste `L08-04`, então `L08-04` tem
 * uma porta a leste — mesmo quando a borda de L08-04 não desenha `+` (é o caso: a saída dela é a
 * fenda do piso do pátio). Ler as duas bordas em separado dava um mapa com um corredor de sentido
 * único que não existe, e uma sala (L08-04) que parecia não ter saída nenhuma.
 *
 * Isto vale só para **leste/oeste**: o teto e o piso são, de propósito, de sentido único no motor
 * (`DEC-015` sobe; o furo de L02-06 é uma entrada, não uma escada).
 */
function fecharPortas(salas: readonly SalaDoMapa[]): SalaDoMapa[] {
  const porId = new Map(salas.map((s) => [s.id, s]));
  const extraLeste = new Map<string, string>();
  const extraOeste = new Map<string, string>();
  for (const sala of salas) {
    if (sala.saidas.leste && porId.has(sala.saidas.leste)) {
      const alvo = porId.get(sala.saidas.leste) as SalaDoMapa;
      if (!alvo.saidas.oeste) extraOeste.set(alvo.id, sala.id);
    }
    if (sala.saidas.oeste && porId.has(sala.saidas.oeste)) {
      const alvo = porId.get(sala.saidas.oeste) as SalaDoMapa;
      if (!alvo.saidas.leste) extraLeste.set(alvo.id, sala.id);
    }
  }
  if (extraLeste.size === 0 && extraOeste.size === 0) return [...salas];
  return salas.map((s) => ({
    ...s,
    saidas: {
      ...s.saidas,
      ...(extraLeste.has(s.id) ? { leste: extraLeste.get(s.id) } : {}),
      ...(extraOeste.has(s.id) ? { oeste: extraOeste.get(s.id) } : {}),
    },
  }));
}

function setorNoMapa(areaId: string): SetorNoMapa {
  const area = AREAS[areaId];
  const ids = area.rooms.map((r) => r.id);
  const brutas = area.rooms.map((room, i) => ({
    id: room.id,
    nome: room.name,
    saidas: saidasDaSala(room, i, ids, areaId),
  }));
  const salas = fecharPortas(brutas);
  const liga = [...new Set(salas
    .map((s) => s.saidas.portal)
    .filter((p): p is string => !!p && p !== areaId))];
  return {
    id: areaId,
    nome: area.name,
    salas,
    posicoes: disporSalas(salas),
    ordem: AREA_ORDER.indexOf(areaId),
    naProgressao: AREA_ORDER.includes(areaId),
    liga,
  };
}

/**
 * Todos os setores do jogo: primeiro os da progressão, depois os `[PÓS]` (na ordem dos dados). É
 * dado calculado uma vez na importação — não é estado, e não depende do save.
 */
export const MAPA: readonly SetorNoMapa[] = [
  ...AREA_ORDER,
  ...Object.keys(AREAS).filter((id) => !AREA_ORDER.includes(id)),
].map(setorNoMapa);

/** O setor de um id de sala (`L02-06` → `LVL-02`). */
export function setorDaSala(salaId: string): SetorNoMapa | undefined {
  const setor = setorDe(salaId);
  return MAPA.find((s) => s.id === setor);
}

/** Todas as salas do jogo — é esta a lista que o save é validado contra. */
export const TODAS_AS_SALAS: readonly string[] = MAPA.flatMap((s) => s.salas.map((r) => r.id));
