/**
 * `UI-22` (`DEC-043`) — a **planta do mapa**, sem navegador.
 *
 * O que estes casos prendem:
 *
 * 1. **a planta não pode sobrepor duas salas** — duas salas na mesma casa é um mapa que mente;
 * 2. **o teto anda para cima e o piso para baixo** — é a única coisa que a planta promete sobre a
 *    topologia, e é o que faz o L02-06 aparecer por cima do L02-02 (o bug que o jogador viu);
 * 3. **uma sala nunca desaparece** — mesmo que nenhuma saída a alcance (dados tortos);
 * 4. **`conhecida` não é `visitada`** — o mapa mostra a porta que se viu, não o setor inteiro;
 * 5. o save é saneado: um `localStorage` editado à mão não desenha salas inventadas.
 */
import { describe, expect, it } from 'vitest';
import {
  disporSalas, estadoDaSala, ligacoesDe, normalizarVisitadas, resumoDoSetor,
  setorDe, setoresVisitados, vizinhoNaDirecao, type SalaDoMapa,
} from './mapa';

/** Um setor em linha, como LVL-01: L01-01 → L01-06. */
const LINHA: readonly SalaDoMapa[] = ['L01-01', 'L01-02', 'L01-03', 'L01-04', 'L01-05', 'L01-06'].map((id, i, todos) => ({
  id,
  saidas: {
    ...(i + 1 < todos.length ? { leste: todos[i + 1] } : {}),
    ...(i > 0 ? { oeste: todos[i - 1] } : {}),
  },
}));

/**
 * O setor que teve o bug: L02-02 tem uma fenda no teto que sobe para L02-06, e a rota baixa segue
 * para L02-03. É esta a forma que o mapa tem de desenhar.
 */
const BIFURCACAO: readonly SalaDoMapa[] = [
  { id: 'L02-01', saidas: { leste: 'L02-02' } },
  { id: 'L02-02', saidas: { leste: 'L02-03', oeste: 'L02-01', teto: 'L02-06' } },
  { id: 'L02-03', saidas: { leste: 'L02-04', oeste: 'L02-02' } },
  { id: 'L02-04', saidas: { leste: 'L02-05', oeste: 'L02-03' } },
  { id: 'L02-05', saidas: { oeste: 'L02-04' } },
  { id: 'L02-06', saidas: { leste: 'L02-07' } },
  { id: 'L02-07', saidas: { leste: 'L02-08', oeste: 'L02-06' } },
  { id: 'L02-08', saidas: { oeste: 'L02-07', portal: 'LVL-03' } },
];

const casa = (posicoes: ReturnType<typeof disporSalas>, id: string): { x: number; y: number } => {
  const p = posicoes.find((q) => q.id === id);
  if (!p) throw new Error(`sem casa para ${id}`);
  return { x: p.x, y: p.y };
};

describe('mapa — a planta', () => {
  it('a primeira sala fica em 0,0 e a linha anda para a direita', () => {
    const p = disporSalas(LINHA);
    expect(casa(p, 'L01-01')).toEqual({ x: 0, y: 0 });
    expect(casa(p, 'L01-06')).toEqual({ x: 5, y: 0 });
  });

  it('a bifurcação desenha a rota baixa na horizontal e a alta **por cima**', () => {
    const p = disporSalas(BIFURCACAO);
    const b02 = casa(p, 'L02-02');
    // a rota baixa é a sala ao lado, na mesma linha
    expect(casa(p, 'L02-03')).toEqual({ x: b02.x + 1, y: b02.y });
    // a rota alta é a sala **imediatamente acima**, na mesma coluna…
    expect(casa(p, 'L02-06')).toEqual({ x: b02.x, y: b02.y - 1 });
    // …e segue para a direita a partir de lá
    expect(casa(p, 'L02-07')).toEqual({ x: b02.x + 1, y: b02.y - 1 });
  });

  it('duas salas nunca ficam na mesma casa', () => {
    for (const setor of [LINHA, BIFURCACAO]) {
      const p = disporSalas(setor);
      const casas = p.map((q) => `${q.x},${q.y}`);
      expect(new Set(casas).size).toBe(p.length);
    }
  });

  it('o `y` cresce para baixo: o teto tem `y` menor que a sala de onde se subiu', () => {
    const p = disporSalas(BIFURCACAO);
    expect(casa(p, 'L02-06').y).toBeLessThan(casa(p, 'L02-02').y);
  });

  it('uma sala que nenhuma saída alcança entra na linha de baixo (nunca desaparece)', () => {
    const orfas: readonly SalaDoMapa[] = [
      ...LINHA,
      { id: 'L01-99', saidas: {} },                     // sem porta nenhuma
      { id: 'L01-98', saidas: {} },                     // e outra
    ];
    const p = disporSalas(orfas);
    expect(p).toHaveLength(8);
    expect(new Set(p.map((q) => `${q.x},${q.y}`)).size).toBe(8);
    // as duas órfãs na **mesma** linha de baixo, uma ao lado da outra
    expect(casa(p, 'L01-99').y).toBe(casa(p, 'L01-98').y);
    expect(casa(p, 'L01-99').y).toBe(casa(p, 'L01-01').y + 1);
  });

  it('uma saída para um id que não está na lista é ignorada, não desenha casa fantasma', () => {
    const torto: readonly SalaDoMapa[] = [
      { id: 'L01-01', saidas: { leste: 'L01-02' } },
      { id: 'L01-02', saidas: { leste: 'L09-77' } },     // não existe neste setor
    ];
    const p = disporSalas(torto);
    expect(p.map((q) => q.id)).toEqual(['L01-01', 'L01-02']);
  });

  it('as coordenadas começam em 0 — a UI não desenha casas negativas', () => {
    // setor que começa pela direita e cresce para oeste
    const paraOeste: readonly SalaDoMapa[] = [
      { id: 'L01-01', saidas: { oeste: 'L01-02' } },
      { id: 'L01-02', saidas: { oeste: 'L01-03' } },
      { id: 'L01-03', saidas: {} },
    ];
    const p = disporSalas(paraOeste);
    expect(Math.min(...p.map((q) => q.x))).toBe(0);
    expect(Math.max(...p.map((q) => q.x))).toBe(2);
  });

  it('duas salas que se apontam uma à outra não entram em ciclo', () => {
    const ciclo: readonly SalaDoMapa[] = [
      { id: 'L01-01', saidas: { leste: 'L01-02' } },
      { id: 'L01-02', saidas: { oeste: 'L01-01', leste: 'L01-01' } },
    ];
    const p = disporSalas(ciclo);
    expect(p).toHaveLength(2);
    expect(new Set(p.map((q) => `${q.x},${q.y}`)).size).toBe(2);
  });
});

describe('mapa — as ligações', () => {
  it('uma porta declarada pelos dois lados é **um** traço, não dois', () => {
    const lig = ligacoesDe(LINHA);
    const par = lig.filter((l) => (l.de === 'L01-01' && l.para === 'L01-02') || (l.de === 'L01-02' && l.para === 'L01-01'));
    expect(par).toHaveLength(1);
  });

  it('cada direção é guardada — o desenho precisa de saber se a linha sobe ou desce', () => {
    const lig = ligacoesDe(BIFURCACAO);
    expect(lig.find((l) => l.de === 'L02-02' && l.para === 'L02-06')?.direcao).toBe('teto');
    expect(lig.find((l) => l.de === 'L02-02' && l.para === 'L02-03')?.direcao).toBe('leste');
  });

  it('uma saída para outro setor é uma ligação de portal, não uma sala', () => {
    const lig = ligacoesDe(BIFURCACAO);
    const portal = lig.find((l) => l.para === 'LVL-03');
    expect(portal?.portal).toBe(true);
    expect(portal?.de).toBe('L02-08');
  });
});

describe('mapa — o que se revela', () => {
  const visitadas = ['L02-01', 'L02-02'];

  it('a sala atual ganha o estado `atual` — mesmo já tendo sido visitada', () => {
    expect(estadoDaSala('L02-02', visitadas, 'L02-02', BIFURCACAO)).toBe('atual');
  });

  it('o que já se viu é `visitada`', () => {
    expect(estadoDaSala('L02-01', visitadas, 'L02-02', BIFURCACAO)).toBe('visitada');
  });

  it('a porta que se viu mas não se atravessou é `conhecida`', () => {
    expect(estadoDaSala('L02-03', visitadas, 'L02-02', BIFURCACAO)).toBe('conhecida');
    expect(estadoDaSala('L02-06', visitadas, 'L02-02', BIFURCACAO)).toBe('conhecida'); // a fenda
  });

  it('duas salas à frente continuam escondidas — o mapa não é um spoiler do setor', () => {
    expect(estadoDaSala('L02-04', visitadas, 'L02-02', BIFURCACAO)).toBe('desconhecida');
    expect(estadoDaSala('L02-08', visitadas, 'L02-02', BIFURCACAO)).toBe('desconhecida');
  });

  it('sem a lista de salas, só se sabe o que se visitou (nunca se inventa vizinho)', () => {
    expect(estadoDaSala('L02-03', visitadas, 'L02-02')).toBe('desconhecida');
  });
});

describe('mapa — o save', () => {
  const VALIDAS = BIFURCACAO.map((s) => s.id);

  it('as visitadas são filtradas pelas salas que existem', () => {
    expect(normalizarVisitadas(['L02-01', 'L99-99', 42, null], VALIDAS)).toEqual(['L02-01']);
  });

  it('não duplica e não rebenta com lixo', () => {
    expect(normalizarVisitadas(['L02-01', 'L02-01'], VALIDAS)).toEqual(['L02-01']);
    for (const lixo of [undefined, null, 'L02-01', {}, 7]) {
      expect(normalizarVisitadas(lixo, VALIDAS)).toEqual([]);
    }
  });

  it('tem tecto: um save adulterado não faz crescer a lista sem fim', () => {
    const muitas = Array.from({ length: 500 }, (_, i) => `L02-0${(i % 8) + 1}`);
    expect(normalizarVisitadas(muitas, VALIDAS, 5)).toHaveLength(5);
  });

  it('o resumo do setor conta as visitadas e sabe quando está completo', () => {
    expect(resumoDoSetor(BIFURCACAO, ['L02-01', 'L02-02'])).toEqual({ visitadas: 2, total: 8, completo: false });
    expect(resumoDoSetor(BIFURCACAO, VALIDAS).completo).toBe(true);
  });

  it('o setor vem do id da sala, sem tabela paralela', () => {
    expect(setorDe('L02-06')).toBe('LVL-02');
    expect(setorDe('L16-01')).toBe('LVL-16');
    expect(setorDe('bosta')).toBe('');
  });

  it('os setores visitados saem pela ordem em que se pisou neles', () => {
    expect(setoresVisitados(['L01-01', 'L02-01', 'L01-02', 'L03-01']))
      .toEqual(['LVL-01', 'LVL-02', 'LVL-03']);
  });
});

describe('mapa — a seleção', () => {
  const p = disporSalas(BIFURCACAO);

  it('as setas andam uma casa, e só quando há casa', () => {
    expect(vizinhoNaDirecao('L02-02', 'direita', p)).toBe('L02-03');
    expect(vizinhoNaDirecao('L02-02', 'cima', p)).toBe('L02-06');
    expect(vizinhoNaDirecao('L02-02', 'esquerda', p)).toBe('L02-01');
  });

  it('na borda a seleção não salta por cima de paredes — devolve `null`', () => {
    expect(vizinhoNaDirecao('L02-01', 'esquerda', p)).toBeNull();
    expect(vizinhoNaDirecao('L02-03', 'baixo', p)).toBeNull();
  });

  it('uma sala que não está na planta não move a seleção', () => {
    expect(vizinhoNaDirecao('L99-01', 'direita', p)).toBeNull();
  });
});
