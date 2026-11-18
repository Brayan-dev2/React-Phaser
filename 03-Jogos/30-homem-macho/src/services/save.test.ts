/**
 * `MEC-007` / `DEC-027` — os **três slots** de save (`services/save.ts`).
 *
 * O que está em jogo: a partida do jogador. Um save que se escreve no slot errado, que se perde
 * na migração ou que "não existe" para o menu é a pior classe de bug deste projeto — não dá erro,
 * só apaga progresso.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SAVE_SLOTS, apagarSlot, chaveSlot, clearSave, listarSaves, loadSave, readEnvelope,
  saveProgress, slotParaNovaPartida, type Progress,
} from './save';

/** `localStorage` mínimo em memória — os testes não precisam do jsdom. */
function fakeStorage(): Storage {
  const mapa = new Map<string, string>();
  return {
    get length() { return mapa.size; },
    clear: () => mapa.clear(),
    getItem: (k: string) => mapa.get(k) ?? null,
    key: (i: number) => [...mapa.keys()][i] ?? null,
    removeItem: (k: string) => { mapa.delete(k); },
    setItem: (k: string, v: string) => { mapa.set(k, String(v)); },
  } as Storage;
}

let store: Storage;

beforeEach(() => {
  store = fakeStorage();
  vi.stubGlobal('localStorage', store);
});

const PROGRESSO: Progress = {
  areaId: 'LVL-01', roomId: 'L01-01', roomIndex: 0, checkpointRoom: 0, hp: 80, shield: 30,
  difficulty: 'hard', areaName: 'Ruínas da Vigília', roomName: 'Abertura silenciosa', roomTotal: 6,
};

describe('saves · slots', () => {
  it('são três slots, e todos começam vazios', () => {
    expect(SAVE_SLOTS).toBe(3);
    const lista = listarSaves();
    expect(lista.map((s) => s.slot)).toEqual([1, 2, 3]);
    expect(lista.every((s) => s.envelope === null)).toBe(true);
  });

  it('gravar no slot 2 não toca no slot 1', async () => {
    await saveProgress(PROGRESSO, 1);
    await saveProgress({ ...PROGRESSO, roomId: 'L01-04', hp: 20 }, 2);
    expect((await loadSave(1))?.progress.roomId).toBe('L01-01');
    expect((await loadSave(2))?.progress.roomId).toBe('L01-04');
    expect(await loadSave(3)).toBeNull();
  });

  it('a revisão é monotônica **por slot**', async () => {
    await saveProgress(PROGRESSO, 1);
    await saveProgress(PROGRESSO, 2);
    const r1 = await saveProgress(PROGRESSO, 1);
    expect(r1.revision).toBe(2);
    expect((await loadSave(2))?.revision).toBe(1);
  });

  it('o slot gravado sabe que é ele (`slot` dentro do envelope)', async () => {
    await saveProgress(PROGRESSO, 3);
    expect((await loadSave(3))?.slot).toBe(3);
  });

  it('um slot inválido é recusado em vez de escrever no sítio errado', async () => {
    expect((await saveProgress(PROGRESSO, 0)).ok).toBe(false);
    expect((await saveProgress(PROGRESSO, 99)).ok).toBe(false);
    expect(await loadSave(0)).toBeNull();
  });

  it('a dificuldade viaja com o save', async () => {
    await saveProgress(PROGRESSO, 1);
    expect((await loadSave(1))?.progress.difficulty).toBe('hard');
  });

  /*
   * `MEC-006` — a porta de senha é **progressão**, não estado de sala.
   *
   * O bug de L02-07: a porta abria, o jogador passava, voltava e encontrava-a fechada — e o `E` já
   * não a reabria, porque o motor sabia que ela estava aberta. Um caminho para LVL-03 que se
   * fechava sozinho. O save tem de guardar o facto de ela ter cedido.
   */
  it('a porta de senha já cedida viaja com o save', async () => {
    await saveProgress({ ...PROGRESSO, senhaAberta: true }, 1);
    expect((await loadSave(1))?.progress.senhaAberta).toBe(true);
  });

  it('um save antigo, sem o campo, abre com a porta fechada (e não rebenta)', async () => {
    await saveProgress(PROGRESSO, 1);
    expect((await loadSave(1))?.progress.senhaAberta).toBeUndefined();
  });

  it('apagar um slot não apaga os outros', async () => {
    await saveProgress(PROGRESSO, 1);
    await saveProgress(PROGRESSO, 2);
    apagarSlot(2);
    expect(await loadSave(2)).toBeNull();
    expect(await loadSave(1)).not.toBeNull();
  });
});

describe('saves · qual slot a partida nova ocupa', () => {
  it('o primeiro vazio, na ordem dos slots', () => {
    expect(slotParaNovaPartida(listarSaves())).toBe(1);
  });

  it('com o slot 1 ocupado, vai para o 2', async () => {
    await saveProgress(PROGRESSO, 1);
    expect(slotParaNovaPartida(listarSaves())).toBe(2);
  });

  it('com os três ocupados, o **mais antigo** é o que cede o lugar', async () => {
    await saveProgress(PROGRESSO, 1);
    await new Promise((r) => setTimeout(r, 5));
    await saveProgress(PROGRESSO, 2);
    await new Promise((r) => setTimeout(r, 5));
    await saveProgress(PROGRESSO, 3);
    expect(slotParaNovaPartida(listarSaves())).toBe(1);
  });
});

describe('saves · migração do save antigo (chave única)', () => {
  it('o save de uma chave só passa a ser o slot 1, sem se perder', () => {
    store.setItem('homem-macho/save/v1', JSON.stringify({
      version: 1, revision: 7, updatedAt: '2026-01-01T00:00:00.000Z', progress: PROGRESSO,
    }));
    const lido = readEnvelope(store, 1);
    expect(lido?.progress.roomId).toBe('L01-01');
    expect(lido?.revision).toBe(7);
    // e fica também na chave nova: um segundo `readEnvelope` não depende da migração
    expect(store.getItem(chaveSlot(1))).not.toBeNull();
  });

  it('a migração não sobrescreve um slot 1 que já existe', async () => {
    store.setItem('homem-macho/save/v1', JSON.stringify({
      version: 1, revision: 9, updatedAt: '2026-01-01T00:00:00.000Z', progress: PROGRESSO,
    }));
    await saveProgress({ ...PROGRESSO, hp: 5 }, 1);
    expect((await loadSave(1))?.progress.hp).toBe(5);
  });

  it('um envelope de outra versão é ignorado, não lido pela metade', () => {
    store.setItem(chaveSlot(1), JSON.stringify({ version: 99, progress: PROGRESSO }));
    expect(readEnvelope(store, 1)).toBeNull();
  });

  it('JSON corrompido não derruba o menu', () => {
    store.setItem(chaveSlot(1), '{isso não é json');
    expect(readEnvelope(store, 1)).toBeNull();
  });

  it('apagar o slot 1 apaga também a chave antiga, senão ela voltaria na migração', async () => {
    store.setItem('homem-macho/save/v1', JSON.stringify({
      version: 1, revision: 1, updatedAt: '2026-01-01T00:00:00.000Z', progress: PROGRESSO,
    }));
    clearSave(1);
    expect(readEnvelope(store, 1)).toBeNull();
  });
});
