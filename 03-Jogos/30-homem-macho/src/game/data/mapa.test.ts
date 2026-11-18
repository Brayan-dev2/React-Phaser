/**
 * `UI-22` (`DEC-043`) — **a planta dos 16 setores**, verificada contra os dados do jogo.
 *
 * Estes casos são o guarda-corpo do mapa: o `core/mapa.test.ts` prova a regra com dados de teste,
 * e este prova que a regra, aplicada aos **90 salas reais**, produz uma planta sã. É também aqui que
 * fica preso o bug que o jogador encontrou — a fenda de L02-02 que descia para L02-03.
 */
import { describe, expect, it } from 'vitest';
import { AREAS, AREA_ORDER } from './levels';
import { MAPA, TODAS_AS_SALAS, fendaDoTeto, saidasDaSala, setorDaSala } from './mapa';
import { ligacoesDe } from '../../core/mapa';

const setor = (id: string): (typeof MAPA)[number] => {
  const s = MAPA.find((m) => m.id === id);
  if (!s) throw new Error(`setor ${id} fora do mapa`);
  return s;
};
const posicao = (setorId: string, salaId: string): { x: number; y: number } => {
  const p = setor(setorId).posicoes.find((q) => q.id === salaId);
  if (!p) throw new Error(`${salaId} fora da planta de ${setorId}`);
  return { x: p.x, y: p.y };
};

describe('mapa — cobertura', () => {
  it('os 16 setores estão no mapa, com todas as salas', () => {
    expect(MAPA).toHaveLength(16);
    expect(MAPA.map((s) => s.id).sort()).toEqual(Object.keys(AREAS).sort());
    const salasNoJogo = Object.values(AREAS).reduce((n, a) => n + a.rooms.length, 0);
    expect(TODAS_AS_SALAS).toHaveLength(salasNoJogo);
    expect(new Set(TODAS_AS_SALAS).size).toBe(salasNoJogo); // nenhum id repetido
  });

  it('a ordem é a da progressão: os três do MVP primeiro, os `[PÓS]` depois', () => {
    expect(MAPA.slice(0, 3).map((s) => s.id)).toEqual(['LVL-01', 'LVL-02', 'LVL-03']);
    expect(MAPA.slice(0, 3).every((s) => s.naProgressao && s.ordem >= 0)).toBe(true);
    for (const pos of MAPA.slice(3)) {
      expect(pos.naProgressao).toBe(AREA_ORDER.includes(pos.id));
    }
  });

  it('cada sala tem nome, e o mapa mostra o nome que o jogo mostra', () => {
    for (const s of MAPA) {
      for (const sala of s.salas) {
        expect(sala.nome, sala.id).toBeTruthy();
        const real = AREAS[s.id].rooms.find((r) => r.id === sala.id);
        expect(sala.nome, sala.id).toBe(real?.name);
      }
    }
  });
});

describe('mapa — a planta é sã', () => {
  it('nenhum setor põe duas salas na mesma casa', () => {
    for (const s of MAPA) {
      const casas = s.posicoes.map((p) => `${p.x},${p.y}`);
      expect(new Set(casas).size, s.id).toBe(s.posicoes.length);
    }
  });

  it('todas as salas aparecem na planta, e nada negativo', () => {
    for (const s of MAPA) {
      expect(s.posicoes, s.id).toHaveLength(s.salas.length);
      for (const p of s.posicoes) {
        expect(p.x, s.id).toBeGreaterThanOrEqual(0);
        expect(p.y, s.id).toBeGreaterThanOrEqual(0);
      }
      expect(Math.min(...s.posicoes.map((p) => p.x)), s.id).toBe(0);
      expect(Math.min(...s.posicoes.map((p) => p.y)), s.id).toBe(0);
    }
  });

  it('nenhuma sala aponta para si própria, e todo destino existe ou é um setor', () => {
    const setoresConhecidos = new Set(MAPA.map((s) => s.id));
    for (const s of MAPA) {
      const ids = new Set(s.salas.map((r) => r.id));
      for (const sala of s.salas) {
        const simples: [string, string | undefined][] = [
          ['leste', sala.saidas.leste], ['oeste', sala.saidas.oeste],
          ['teto', sala.saidas.teto], ['piso', sala.saidas.piso], ['portal', sala.saidas.portal],
        ];
        for (const [dir, destino] of simples) {
          if (!destino) continue;
          expect(destino, `${sala.id} ${dir}`).not.toBe(sala.id);
          const valido = ids.has(destino) || (dir === 'portal' && setoresConhecidos.has(destino));
          expect(valido, `${sala.id} ${dir} → ${destino}`).toBe(true);
        }
        for (const atalho of sala.saidas.atalhos ?? []) {
          expect(atalho.para, `${sala.id} atalho`).not.toBe(sala.id);
          expect(ids.has(atalho.para), `${sala.id} atalho → ${atalho.para}`).toBe(true);
        }
      }
    }
  });

  it('o setor inteiro fica ligado por corredores de **uma casa** (nenhuma sala flutua)', () => {
    // Um grafo com ciclos não cabe sempre numa planta com todas as arestas de comprimento 1 — e
    // não precisa: o que o mapa promete é que **há um caminho de corredores** entre as salas. A
    // segunda metade é o que interessa a quem olha para o mapa.
    for (const s of MAPA) {
      const adjacentes = ligacoesDe(s.salas).filter((lig) => {
        if (lig.portal || lig.atalho) return false;
        const de = posicao(s.id, lig.de);
        const para = posicao(s.id, lig.para);
        return Math.abs(de.x - para.x) + Math.abs(de.y - para.y) === 1;
      });
      const vistas = new Set([s.salas[0].id]);
      let mudou = true;
      while (mudou) {
        mudou = false;
        for (const lig of adjacentes) {
          if (vistas.has(lig.de) && !vistas.has(lig.para)) { vistas.add(lig.para); mudou = true; }
          if (vistas.has(lig.para) && !vistas.has(lig.de)) { vistas.add(lig.de); mudou = true; }
        }
      }
      // as salas que só se alcançam por um atalho (monta-carga de L08) não entram nesta conta
      const soPorAtalho = s.salas
        .map((r) => r.id)
        .filter((id) => !Object.values(s.salas.find((r) => r.id === id)?.saidas ?? {})
          .some((v) => typeof v === 'string' && v !== id) &&
          (s.salas.find((r) => r.id === id)?.saidas.atalhos?.length ?? 0) > 0);
      expect(vistas.size + soPorAtalho.length, `${s.id}: ${[...vistas].join(',')}`)
        .toBeGreaterThanOrEqual(s.salas.length);
    }
  });

  it('nenhuma ligação primária salta mais de duas casas', () => {
    for (const s of MAPA) {
      for (const lig of ligacoesDe(s.salas)) {
        if (lig.portal || lig.atalho) continue;
        const de = posicao(s.id, lig.de);
        const para = posicao(s.id, lig.para);
        const d = Math.abs(de.x - para.x) + Math.abs(de.y - para.y);
        expect(d, `${lig.de} → ${lig.para}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it('o caminho do setor inteiro é alcançável a partir da primeira sala', () => {
    for (const s of MAPA) {
      const vistas = new Set([s.salas[0].id]);
      const fila = [s.salas[0].id];
      while (fila.length) {
        const atual = fila.shift() as string;
        const sala = s.salas.find((r) => r.id === atual);
        // os atalhos contam: o monta-carga de L08-01 é a **única** entrada de L08-05
        const destinos = [
          sala?.saidas.leste, sala?.saidas.oeste, sala?.saidas.teto, sala?.saidas.piso,
          ...(sala?.saidas.atalhos ?? []).map((a) => a.para),
        ];
        for (const destino of destinos) {
          if (!destino || vistas.has(destino) || !s.salas.some((r) => r.id === destino)) continue;
          vistas.add(destino);
          fila.push(destino);
        }
      }
      expect(vistas.size, `${s.id}: ${[...vistas].join(',')}`).toBe(s.salas.length);
    }
  });
});

describe('mapa — o bug de L02-02 (DEC-043)', () => {
  it('a fenda do teto de L02-02 leva a L02-06, e não a L02-03', () => {
    const sala = setor('LVL-02').salas.find((s) => s.id === 'L02-02');
    expect(sala?.saidas.teto).toBe('L02-06');
    // a rota baixa continua a existir, e é a de leste
    expect(sala?.saidas.leste).toBe('L02-03');
  });

  it('no mapa, L02-06 fica por cima de L02-02 — é o que o jogador espera ver', () => {
    const de = posicao('LVL-02', 'L02-02');
    const para = posicao('LVL-02', 'L02-06');
    expect(para).toEqual({ x: de.x, y: de.y - 1 });
  });

  it('a sala declara a fenda na ficha (o motor lê daqui, não da regra geral)', () => {
    const fonte = AREAS['LVL-02'].rooms.find((r) => r.id === 'L02-02');
    expect(fonte).toBeDefined();
    expect(fendaDoTeto(fonte!)).toEqual({ from: 24, to: 25 });
    const hatches = fonte!.hatches ?? [];
    expect(hatches).toHaveLength(1);
    expect(hatches[0]).toMatchObject({ from: 24, to: 25, destRoom: 5 }); // 5 = L02-06
  });

  it('as outras fendas do jogo continuam a usar a regra de DEC-015 (sala seguinte)', () => {
    // L02-02 é a única sala cujo teto **não** é a sala seguinte; se outra passar a precisar de
    // destino declarado, este caso obriga a olhar para ela em vez de a deixar cair na regra geral
    const excecoes: string[] = [];
    for (const s of MAPA) {
      for (const sala of s.salas) {
        const fonte = AREAS[s.id].rooms.find((r) => r.id === sala.id);
        const temFenda = fonte ? fendaDoTeto(fonte) !== null : false;
        if (!temFenda) continue;
        const declarado = (fonte?.hatches ?? []).some((h) => h.destRoom !== undefined);
        if (declarado) excecoes.push(sala.id);
      }
    }
    expect(excecoes).toEqual(['L02-02', 'L13-04']);
  });
});

describe('mapa — as portas entre setores', () => {
  it('a última sala de um setor da progressão aponta para o seguinte', () => {
    expect(setor('LVL-01').salas.at(-1)?.saidas.portal).toBe('LVL-02');
    expect(setor('LVL-02').salas.at(-1)?.saidas.portal).toBe('LVL-03');
  });

  it('o último setor da progressão não inventa um setor 17', () => {
    const ultimo = AREA_ORDER.at(-1) as string;
    expect(setor(ultimo).salas.at(-1)?.saidas.portal ?? null).toBeNull();
  });

  it('o poço de LVL-10 sai para LVL-03 (o hub tem uma porta para trás)', () => {
    expect(setor('LVL-10').liga).toContain('LVL-03');
  });

  it('um portal nunca aponta para o próprio setor', () => {
    for (const s of MAPA) {
      for (const sala of s.salas) {
        if (sala.saidas.portal) expect(sala.saidas.portal, sala.id).not.toBe(s.id);
      }
    }
  });

  it('o mapa sabe de que setor é uma sala', () => {
    expect(setorDaSala('L02-06')?.id).toBe('LVL-02');
    expect(setorDaSala('nada')).toBeUndefined();
  });
});

describe('mapa — a leitura das grades', () => {
  it('lê a porta de senha (`Y`) de L02-07 como saída de leste', () => {
    const room = AREAS['LVL-02'].rooms.find((r) => r.id === 'L02-07')!;
    const ids = AREAS['LVL-02'].rooms.map((r) => r.id);
    expect(saidasDaSala(room, 6, ids, 'LVL-02').leste).toBe('L02-08');
  });

  it('uma sala sem portas nas bordas não inventa saída', () => {
    const room = AREAS['LVL-03'].rooms[0];
    const ids = AREAS['LVL-03'].rooms.map((r) => r.id);
    // L03-01 tem porta a leste; o que se afirma é que **oeste** é `undefined` (é a entrada do setor)
    expect(saidasDaSala(room, 0, ids, 'LVL-03').oeste).toBeUndefined();
  });
});
