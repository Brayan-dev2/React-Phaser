/**
 * Lê os **saves** de `MEC-007` para o menu (`UI-02`). Não é fonte de verdade: mostra ao jogador
 * onde ele parou e em que slot. Quem retoma de fato é a `GameScene`, com o mesmo `saveProgress`.
 */
import { useCallback, useEffect, useState } from 'react';
import { listarSaves, slotParaNovaPartida, type SaveEnvelope, type SlotResumo } from '../services/save';
import type { SlotInfo } from './menuMachine';

/** O que o painel de saves desenha — já em texto, para o componente não formatar dados. */
export interface SlotVista {
  slot: number;
  ocupado: boolean;
  titulo: string;
  linhas: string[];
}

/**
 * Converte o envelope em rótulo legível. Os nomes vêm **do próprio save** (`areaName`,
 * `roomName`): save antigo sem rótulo cai no id — feio, mas honesto, e nunca inventado.
 */
export function descreverSlot(
  resumo: SlotResumo, rotuloDificuldade: Record<string, string> = {},
): SlotVista {
  const env = resumo.envelope;
  if (!env?.progress) {
    return { slot: resumo.slot, ocupado: false, titulo: `SLOT ${resumo.slot} · VAZIO`, linhas: ['Nenhuma partida aqui.'] };
  }
  const p = env.progress;
  const quando = env.updatedAt
    ? new Date(env.updatedAt).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })
    : 'sem data';
  const total = p.roomTotal ?? 0;
  const sala = `${p.roomId} — ${p.roomName ?? p.areaId}${total ? ` · ${(p.roomIndex ?? 0) + 1}/${total}` : ''}`;
  const estado = [
    `VIDA ${p.hp}`, `ESCUDO ${p.shield}`,
    p.difficulty ? (rotuloDificuldade[p.difficulty] ?? p.difficulty.toUpperCase()) : null,
    p.completed ? 'POSTO PREENCHIDO' : null,
    quando,
  ].filter(Boolean).join(' · ');
  return {
    slot: resumo.slot,
    ocupado: true,
    titulo: `SLOT ${resumo.slot} · ${p.areaName ?? p.areaId}`,
    linhas: [`${sala} · ${estado}`],
  };
}

export function slotsParaMaquina(vistas: SlotVista[]): SlotInfo[] {
  return vistas.map((v) => ({ slot: v.slot, ocupado: v.ocupado, rotulo: v.ocupado ? v.titulo : null }));
}

export interface MenuSaves {
  vistas: SlotVista[];
  slots: SlotInfo[];
  /** O envelope cru de um slot — é dele que sai a retomada (área, sala, vida). */
  envelope: (slot: number) => SaveEnvelope | null;
  /** Slot que a próxima partida nova ocupa (o menu diz qual é antes de o jogador confirmar). */
  slotNovaPartida: number;
  recarregar: () => void;
  pronto: boolean;
}

/**
 * `recarregar` muda a cada evento que grava um save. O save muda **enquanto o jogo roda** (a cada
 * transição, `MEC-007`); quando o jogador volta ao menu, a lista tem de ser a de agora.
 */
export function useMenuSaves(
  reloadKey = 0, rotuloDificuldade: Record<string, string> = {},
): MenuSaves {
  const [resumos, setResumos] = useState<SlotResumo[]>([]);
  const [pronto, setPronto] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let vivo = true;
    // síncrono de propósito: `listarSaves` lê `localStorage`, e o menu não deve abrir vazio
    const lidos = listarSaves();
    if (vivo) { setResumos(lidos); setPronto(true); }
    return () => { vivo = false; };
  }, [reloadKey, tick]);

  const recarregar = useCallback(() => setTick((n) => n + 1), []);
  const vistas = resumos.map((r) => descreverSlot(r, rotuloDificuldade));
  const envelope = useCallback(
    (slot: number) => resumos.find((r) => r.slot === slot)?.envelope ?? null,
    [resumos],
  );
  return {
    vistas,
    slots: slotsParaMaquina(vistas),
    envelope,
    slotNovaPartida: slotParaNovaPartida(resumos),
    recarregar,
    pronto,
  };
}
