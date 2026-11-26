/**
 * Preload — no slice não há assets externos; existe para o contrato de cena do GDD §7.4.
 *
 * `UI-01` (§4.2): a tela de carregamento é **logo + progresso**. O progresso é real (as
 * texturas procedurais de `BootScene`), o logo é **placeholder** — arte é do proprietário.
 *
 * A saída é o **Menu** (`UI-02`), não o jogo: `?skip=menu` (usado por todo o E2E de setor)
 * entra direto na sala, e é a única porta que pula o menu. Um jogo não começa sozinho.
 */
import Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { PAL } from '../data/palette';
import { BOOT } from '../data/tuning';
import { peekPendingStart } from '../../services/start';

/**
 * `?skip=menu` — porta de serviço das capturas e do E2E (`tests/*.mjs`). **Não é um menu
 * escondido**: sem ele, todo teste teria de clicar em "JOGAR" antes de provar qualquer coisa.
 */
function entrada(): 'menu' | 'jogo' {
  if (typeof window === 'undefined') return 'menu';
  const q = new URLSearchParams(window.location.search);
  return q.get('skip') === 'menu' ? 'jogo' : 'menu';
}

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  create(): void {
    this.add.text(24, 24, 'HOMEM MACHO', {
      fontFamily: 'monospace', fontSize: '28px', color: '#E6DFD2',
    });
    this.add.text(24, 60, 'pacote mvp · placeholder de arte', {
      fontFamily: 'monospace', fontSize: '14px', color: '#464052',
    });
    this.cameras.main.setBackgroundColor(PAL.bg);
    // barra de progresso: o carregamento real é síncrono (texturas em `Graphics`), então a
    // barra mostra o **passo**, não um temporizador inventado
    const barra = this.add.rectangle(24, 96, 8, 6, PAL.gold, 1).setOrigin(0, 0.5);
    this.tweens.add({ targets: barra, width: 220, duration: BOOT.barMs, ease: 'Linear' });

    EventBus.emit('scene:ready', { key: 'Preload' });
    this.time.delayedCall(BOOT.holdMs, () => {
      /*
       * `UI-02`: a intenção de partida vence a porta de serviço — o menu escolheu primeiro.
       * **Lida sem consumir** (`peek`): em `StrictMode` um jogo fantasma chega a correr este
       * `Preload` e, se consumisse a intenção, o jogo a sério nascia sem ela. Quem a leva é o
       * `GameScene.init`.
       */
      const inicio = peekPendingStart();
      if (inicio) {
        this.scene.start('Game', {
          room: inicio.resume?.roomIndex ?? 0,
          area: inicio.resume?.areaId,
          difficulty: inicio.difficulty,
          // `DEC-027`: a partida grava no slot que o menu escolheu (retomar grava no mesmo)
          slot: inicio.slot,
          // `UI-12`: o `BootScene` desenha o herói a partir desta escolha
          personagem: inicio.personagem,
          hp: inicio.resume?.hp,
          shield: inicio.resume?.shield,
          // `UI-07`: o baú volta com a partida
          bau: inicio.resume?.bau,
          // `DEC-040`: com as moedas que lá estavam guardadas
          bauMoedas: inicio.resume?.bauMoedas,
          // `UI-14`: e os níveis comprados
          melhorias: inicio.resume?.melhorias,
          coletados: inicio.resume?.coletados,
          tentativasDrop: inicio.resume?.tentativasDrop,
          visitadas: inicio.resume?.visitadas,
          senhaAberta: inicio.resume?.senhaAberta,
          // `MEC-004`: e a bolsa da morte também
          bolsaMorte: inicio.resume?.bolsaMorte,
        });
        return;
      }
      if (entrada() === 'jogo') this.scene.start('Game', { room: 0 });
      else EventBus.emit('game:menu', { open: true, reason: 'boot' });
    });
  }
}
