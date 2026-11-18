/** PAT-C-06 — uma instância por montagem, `destroy(true)` no unmount, 0 listener órfão. */
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './config';
import { EventBus } from './EventBus';

/** Sonda de smoke test (E2E): exposta só em desenvolvimento. */
function montarProbe(game: Phaser.Game): void {
  if (!import.meta.env.DEV) return;
  const w = window as unknown as {
    __game?: Phaser.Game;
    __bus?: typeof EventBus;
    __events?: unknown[];
    __eventsHooked?: boolean;
  };
  w.__game = game;
  // só em DEV: o E2E precisa espiar os eventos sem abrir o bundle do jogo
  w.__bus = EventBus;
  // o jogador pode voltar ao menu e entrar outra vez: os espiões ficam registados uma só vez
  if (w.__eventsHooked) return;
  w.__eventsHooked = true;
  w.__events = [];
  EventBus.on('game:completed', (p) => w.__events?.push({ type: 'game:completed', ...p }));
  EventBus.on('game:boss', (p) => w.__events?.push({ type: 'game:boss', ...p }));
  EventBus.on('game:toast', (p) => w.__events?.push({ type: 'game:toast', ...p }));
  // `MEC-012` (`LVL-16` §7.4): o fim é observável — o E2E precisa ver o crachá
  EventBus.on('game:end', (p) => w.__events?.push({ type: 'game:end', ...p }));
  EventBus.on('game:posto', (p) => w.__events?.push({ type: 'game:posto', ...p }));
}

/** A sonda não pode apontar para um jogo morto: `window.__game` mentiria ao E2E. */
function limparProbe(): void {
  if (!import.meta.env.DEV) return;
  const w = window as unknown as { __game?: Phaser.Game };
  delete w.__game;
}

export function PhaserGame(): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return;
    const host = hostRef.current;
    /**
     * A criação é **imediata**. Já foi adiada um frame para o `StrictMode` não fabricar um jogo
     * fantasma — e o adiamento era pior: `requestAnimationFrame` não corre numa aba em segundo
     * plano, portanto o jogo **nunca** arrancava se a página fosse aberta escondida. A corrida
     * com o `StrictMode` resolve-se no sítio certo: a intenção de partida é lida sem ser
     * consumida (`peekPendingStart`) e só o `GameScene` a leva (`services/start.ts`).
     */
    const game = new Phaser.Game(createGameConfig(host));
    gameRef.current = game;
    montarProbe(game);
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
      limparProbe();
    };
  }, []);

  return <div className="game-host" ref={hostRef} />;
}
