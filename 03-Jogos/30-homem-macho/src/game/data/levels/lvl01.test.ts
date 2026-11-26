/**
 * Guarda-corpo da grade — o mesmo que o validador da documentação faz nos 16 setores.
 * Se alguém editar uma sala à mão e quebrar largura, altura ou borda, o teste reprova.
 *
 * **Actualizado por `DEC-048` (o piloto de ampliação):** as larguras passaram de
 * 20·30·20·40·20·20 para 60·70·55·90·40·50 e o setor ganhou dois arquétipos novos. O que este
 * ficheiro guarda, para além do formato, são as **propriedades do piloto**: que cada sala é de
 * rolagem (mais larga que o ecrã), que o piso continua na linha 7, que a densidade de inimigos
 * subiu sem ultrapassar o teto, e que nenhum dos três arquétipos ficou de fora.
 */
import { describe, expect, it } from 'vitest';
import { LVL01 } from './lvl01';
import { TILE, VIEW } from '../tuning';
import { ARQUETIPOS, censoDeGrade, resolverVariante, varianteValida } from '../../../core/arquetipos';

const WIDTHS = [60, 70, 55, 90, 40, 50];
/** 20 tiles = 1280 px = o ecrã lógico. Acima disto, a câmara tem de rolar (`DEC-048`). */
const LARGURA_DO_ECRA = VIEW.width / TILE;

const censoTotal = () => LVL01.reduce(
  (acc, r) => {
    const c = censoDeGrade(r.grid);
    acc.total += c.total;
    for (const k of Object.keys(c.porArquetipo) as Array<keyof typeof c.porArquetipo>) {
      acc.porArquetipo[k] += c.porArquetipo[k];
    }
    return acc;
  },
  { total: 0, porArquetipo: { sentinela: 0, atirador: 0, voador: 0 } },
);

describe('LVL-01 (docs/niveis/LVL-01.md §4)', () => {
  it('tem 6 salas', () => expect(LVL01).toHaveLength(6));

  it('toda sala tem 11 linhas e a largura do documento', () => {
    LVL01.forEach((room, i) => {
      expect(room.grid).toHaveLength(11);
      for (const row of room.grid) expect(row.length).toBe(WIDTHS[i]);
    });
  });

  it('teto e piso são sólidos, exceto onde o documento abre vão', () => {
    LVL01.forEach((room) => {
      expect([...room.grid[0]].every((c) => c === '#')).toBe(true);
      expect([...room.grid[10]].every((c) => c === '#')).toBe(true);
    });
  });

  it('existe um único ponto de spawn, na primeira sala', () => {
    const withSpawn = LVL01.filter((r) => r.grid.some((row) => row.includes('S')));
    expect(withSpawn).toHaveLength(1);
    expect(withSpawn[0].id).toBe('L01-01');
  });

  it('as saídas casam: uma abertura leste por sala, uma oeste a partir da segunda', () => {
    LVL01.forEach((room, i) => {
      const east = room.grid.slice(4, 7).some((row) => row.endsWith('+') || row.endsWith('D'));
      const west = room.grid.slice(4, 7).every((row) => row.startsWith('+'));
      expect(east).toBe(true);
      if (i === 0) expect(west).toBe(false);
      else expect(west).toBe(true);
    });
  });

  it('LVL-01 é config-agnóstico: nenhuma sala usa plataforma como trava obrigatória', () => {
    /*
     * Eram 6 (as três da escada de prática de L01-02). São 10 desde `DEC-048`: L01-04 ganhou
     * quatro tiles de plataforma **opcionais** — uma rota alta que serve para fugir do chão e
     * não para passar. O teste continua a guardar o que importa: **nenhuma delas está na rota
     * crítica**, e a contagem é fixa para que ninguém acrescente uma quinta sem pensar nisso.
     */
    const oneway = LVL01.flatMap((r) => r.grid).join('').split('=').length - 1;
    expect(oneway).toBe(10);
    // as únicas salas com plataforma são a da escada (opcional) e a da rota alta (opcional)
    expect(LVL01.flatMap((r, i) => (r.grid.join('').includes('=') ? [i] : []))).toEqual([1, 3]);
  });

  it('a escada de L01-02 tem 3 degraus de 2 tiles, com 1 tile de vão e 1 de subida', () => {
    const grid = LVL01[1].grid;
    const runs: Array<{ row: number; from: number; to: number }> = [];
    grid.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] !== '=') continue;
        const last = runs[runs.length - 1];
        if (last && last.row === y && last.to === x - 1) last.to = x;
        else runs.push({ row: y, from: x, to: x });
      }
    });
    // varredura de cima para baixo: y4 → y6, cada degrau 2 tiles, 1 tile de vão, 1 de subida
    expect(runs).toEqual([
      { row: 4, from: 64, to: 65 },
      { row: 5, from: 61, to: 62 },
      { row: 6, from: 58, to: 59 },
    ]);
  });

  it('ITM-001 e ITM-002 estão no grid; ITM-003 fica para LVL-02', () => {
    const glyphs = LVL01.flatMap((r) => r.grid).join('');
    expect(glyphs.split('h').length - 1).toBe(1); // ITM-001 em L01-04
    expect(glyphs.split('s').length - 1).toBe(1); // ITM-002 em L01-05
    expect(glyphs.includes('j')).toBe(false);     // ITM-003 nasce em LVL-02 (DEC-008)
  });
});

/**
 * As propriedades do **piloto** (`DEC-048`). Não são do formato: são a razão do experimento.
 * O que este bloco guarda é que o setor deixou de caber num ecrã, que tem mais corpos, e que os
 * tem de três tipos — sem nunca ultrapassar o teto de densidade do `PAT-LD-10`.
 */
describe('LVL-01 — o piloto de ampliação (`DEC-048`)', () => {
  it('o piso de jogo continua na linha 7 em todas as salas (o motor spawna a `7*TILE-6`)', () => {
    LVL01.forEach((room) => {
      // nenhum objeto ou plataforma abaixo da linha do piso
      const abaixo = room.grid.slice(8).join('').replace(/[#.]/g, '');
      expect(abaixo).toBe('');
    });
  });

  it('todas as salas são mais largas que o ecrã: a câmara tem de rolar', () => {
    for (const room of LVL01) {
      const tiles = room.grid[0].length;
      expect(tiles).toBeGreaterThan(LARGURA_DO_ECRA);
    }
  });

  it('o setor triplicou de comprimento: 160 → 365 tiles', () => {
    const total = LVL01.reduce((n, r) => n + r.grid[0].length, 0);
    expect(total).toBe(365);
  });

  it('a densidade sobe de 3 para 8 corpos, e todos os arquétipos aparecem', () => {
    const c = censoTotal();
    expect(c.total).toBe(8);
    expect(c.porArquetipo.sentinela).toBeGreaterThan(0);
    expect(c.porArquetipo.atirador).toBeGreaterThan(0);
    expect(c.porArquetipo.voador).toBeGreaterThan(0);
  });

  it('a densidade mantém-se: no máximo 1 corpo por 20 tiles de sala', () => {
    /*
     * O teto antigo era **3 corpos por sala**, e era um teto de sala de 40 tiles — escrito quando
     * a sala maior do setor tinha 40. Com salas de 90, um teto fixo de 3 não mede densidade
     * nenhuma: mede o comprimento da sala. O que se guarda agora é a **razão** (1 corpo por 20
     * tiles, que é a mesma dos 3-em-40 do documento), e é isso que impede uma sala de virar um
     * corredor de tiro ao alvo sem que ninguém repare.
     */
    for (const room of LVL01) {
      const tiles = room.grid[0].length;
      const cap = Math.ceil(tiles / 20);
      expect(censoDeGrade(room.grid).total, `${room.id} (${tiles} tiles)`).toBeLessThanOrEqual(cap);
    }
  });

  it('as salas de respiro continuam sem inimigos', () => {
    // a abertura e o quarto seguro: `PAT-LD-04` — o jogador precisa de sítios onde nada o morde
    expect(censoDeGrade(LVL01[0].grid).total).toBe(0);
    expect(censoDeGrade(LVL01[4].grid).total).toBe(0);
    expect(LVL01[4].safeRoom).toBe(true);
  });

  it('onde a sala escreve `T` ou `V`, declara a variante — e a variante é válida', () => {
    for (const room of LVL01) {
      const glifos = room.grid.join('');
      if (glifos.includes('T')) expect(room.variantes?.T, `${room.id} usa T sem variante`).toBeTruthy();
      if (glifos.includes('V')) expect(room.variantes?.V, `${room.id} usa V sem variante`).toBeTruthy();
      for (const nome of Object.values(room.variantes ?? {})) {
        expect(varianteValida(nome)).toBeNull();
        const v = resolverVariante(nome)!;
        expect(ARQUETIPOS[v.id]).toBeTruthy();
      }
    }
  });

  it('o `V` de L01-04 é inimigo nesta sala e decoração nas outras do jogo', () => {
    // `DEC-023`: o significado do glifo é da sala — aqui está o caso que o prova
    expect(LVL01[3].variantes?.V).toBeTruthy();
    expect(LVL01[3].glyphs?.V).toBeUndefined();
  });
});
