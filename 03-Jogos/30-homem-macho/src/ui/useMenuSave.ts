/**
 * Lê o save de `MEC-007` para o **menu** (`UI-02`). Não é fonte de verdade: ele só mostra ao
 * jogador onde ele parou. Quem retoma de fato é a `GameScene`, com o mesmo `saveProgress`.
 */
import { useEffect, useState } from 'react';
import { loadSave, readEnvelope, type SaveEnvelope } from '../services/save';

export interface MenuSave {
  areaName: string;
  roomId: string;
  roomName: string;
  roomIndex: number;
  roomTotal: number;
  updatedAt: string | null;
  completed: boolean;
}

/**
 * Converte o envelope em rótulo legível. Os nomes vêm **do próprio save** (`areaName`,
 * `roomName`): save antigo sem rótulo cai no id — feio, mas honesto, e nunca inventado.
 */
export function describeSave(env: SaveEnvelope | null): MenuSave | null {
  if (!env?.progress) return null;
  const p = env.progress;
  return {
    areaName: p.areaName ?? p.areaId,
    roomId: p.roomId,
    roomName: p.roomName ?? '',
    roomIndex: p.roomIndex ?? 0,
    roomTotal: p.roomTotal ?? 0,
    updatedAt: env.updatedAt ?? null,
    completed: p.completed === true,
  };
}

/**
 * `reloadKey`: o save muda **enquanto o jogo roda** (a cada transição, `MEC-007`). Quando o
 * jogador volta ao menu, o rótulo de `CONTINUAR` tem de ser o de agora, não o do boot.
 */
export function useMenuSave(reloadKey = 0): {
  save: MenuSave | null; raw: SaveEnvelope | null; pronto: boolean;
} {
  const [raw, setRaw] = useState<SaveEnvelope | null>(null);
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    let vivo = true;
    void loadSave().then((env) => {
      if (!vivo) return;
      setRaw(env);
      setPronto(true);
    });
    return () => { vivo = false; };
  }, [reloadKey]);
  return { save: describeSave(raw), raw, pronto };
}

/** Só para o teste de unidade não depender de `localStorage`. */
export { readEnvelope };
