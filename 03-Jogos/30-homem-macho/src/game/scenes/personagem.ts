/**
 * `UI-12` — o **herói em jogo**, desenhado a partir do personagem criado no menu.
 *
 * Isto substitui o sprite fixo do `BootScene`: as mesmas 40×112 unidades, agora com a pele, o
 * cabelo, o corpo e a marca que o jogador escolheu. **Continua a ser placeholder** (`P-16`): é
 * um bloco com a paleta certa, não arte. O que importa é que a escolha do menu **chega ao
 * jogo** — sem isto, criar personagem seria um ecrã bonito sem consequência.
 *
 * As medidas vêm de `services/character.ts` (ombro, tronco, cintura), as mesmas que a prévia do
 * menu usa: o herói no jogo e a figura do menu não podem discordar.
 */
import Phaser from 'phaser';
import { PAL } from '../data/palette';
import {
  formaCorpo, temPresas, tomCabelo, tomPele, type Personagem,
} from '../../services/character';

const L = 40;
const A = 112;

/** Converte `#RRGGBB` no inteiro que o `Graphics` espera. */
function cor(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}

export function desenharHeroi(
  g: Phaser.GameObjects.Graphics, p: Personagem,
): void {
  const pele = tomPele(p);
  const cabelo = tomCabelo(p);
  const corpo = formaCorpo(p);

  const peleN = cor(pele.base);
  const peleS = cor(pele.sombra);
  const cabeloN = cor(cabelo.base);
  const cabeloEsc = cor(cabelo.sombra);

  // larguras: o corpo muda a silhueta, não só a cor
  const ombro = Math.round(36 * corpo.ombro);
  const tronco = Math.round(30 * corpo.tronco);
  const cintura = Math.round(tronco * corpo.cintura);
  const ombroX = Math.round((L - ombro) / 2);
  const troncoX = Math.round((L - tronco) / 2);
  const cinturaX = Math.round((L - cintura) / 2);

  /*
   * --- silhueta primeiro ---
   * Um bloco escuro do ombro ao quadril: é ele que faz o herói ler-se contra o cenário (que
   * também é escuro). Sem esta base, o corpo "magro" desaparecia no fundo e só se viam as mãos.
   */
  g.fillStyle(PAL.ink, 1); g.fillRect(ombroX - 1, 30, ombro + 2, 64);
  g.fillStyle(PAL.ink, 1); g.fillRect(cinturaX - 1, 76, cintura + 2, 18);
  g.fillStyle(PAL.ink, 1); g.fillRect(troncoX - 1, 2, tronco + 2, 30);   // pescoço/contorno da cabeça

  // --- casaco, por cima da silhueta ---
  g.fillStyle(PAL.mass, 1); g.fillRect(ombroX, 34, ombro, 8);          // ombros
  g.fillStyle(PAL.mass, 1); g.fillRect(troncoX, 42, tronco, 34);        // casaco
  g.fillStyle(PAL.mass, 1); g.fillRect(cinturaX, 76, cintura, 16);      // cintura
  g.fillStyle(PAL.ink, 1); g.fillRect(L / 2 - 2, 42, 4, 50);            // abertura
  g.fillStyle(PAL.accent01, 1); g.fillRect(troncoX, 60, tronco, 5);     // faixa dourada

  // --- cabeça ---
  const rostoL = p.rosto === 'redondo' ? 24 : p.rosto === 'oval' ? 20 : 22;
  const rostoA = p.rosto === 'oval' ? 22 : 20;
  const rostoX = Math.round((L - rostoL) / 2);
  g.fillStyle(peleN, 1); g.fillRect(rostoX, 12, rostoL, rostoA);
  g.fillStyle(peleS, 1); g.fillRect(rostoX, 12 + rostoA - 3, rostoL, 3);  // sombra do queixo
  g.fillStyle(peleN, 1); g.fillRect(Math.round((L - 8) / 2), 30, 8, 6);   // pescoço

  // --- cabelo ---
  const cima = 4;
  switch (p.cabelo) {
    case 'raspado':
      g.fillStyle(cabeloEsc, 1); g.fillRect(rostoX, cima + 6, rostoL, 4);
      break;
    case 'moicano':
      g.fillStyle(cabeloN, 1); g.fillRect(Math.round(L / 2) - 3, cima - 4, 6, 12);
      g.fillStyle(cabeloEsc, 1); g.fillRect(rostoX, cima + 7, rostoL, 3);
      break;
    case 'coque':
      g.fillStyle(cabeloN, 1); g.fillRect(rostoX, cima + 6, rostoL, 6);
      g.fillStyle(cabeloN, 1); g.fillRect(L - rostoX - 4, cima - 2, 6, 6);   // coque atrás
      break;
    case 'longo':
      g.fillStyle(cabeloN, 1); g.fillRect(rostoX - 2, cima + 4, rostoL + 4, 26);
      g.fillStyle(peleN, 1); g.fillRect(rostoX + 1, 14, rostoL - 2, rostoA - 4);
      break;
    case 'franja':
      g.fillStyle(cabeloN, 1); g.fillRect(rostoX, cima + 4, rostoL, 9);
      g.fillStyle(cabeloEsc, 1); g.fillRect(rostoX, cima + 12, rostoL, 2);
      break;
    case 'cacheado':
      g.fillStyle(cabeloN, 1); g.fillRect(rostoX - 2, cima + 4, rostoL + 4, 8);
      g.fillStyle(cabeloEsc, 1); g.fillRect(rostoX, cima + 2, 4, 4);
      g.fillStyle(cabeloEsc, 1); g.fillRect(rostoX + rostoL - 4, cima + 2, 4, 4);
      break;
    default: // curto
      g.fillStyle(cabeloN, 1); g.fillRect(rostoX, cima + 8, rostoL, 6);
      g.fillStyle(cabeloEsc, 1); g.fillRect(rostoX, cima + 14, 4, 8);
      break;
  }

  // --- expressão: dois olhos e uma boca, cinco variações ---
  const olhoY = 20;
  const olho = (x: number): void => {
    switch (p.expressao) {
      case 'furioso':
        g.fillStyle(PAL.ink, 1); g.fillRect(x - 1, olhoY - 1, 5, 4);
        g.fillRect(x - 1, olhoY - 4, 5, 2);
        break;
      case 'sorriso':
        g.fillStyle(PAL.ink, 1); g.fillRect(x, olhoY, 4, 2);
        break;
      case 'cansado':
        g.fillStyle(PAL.ink, 1); g.fillRect(x, olhoY + 1, 4, 2);
        break;
      case 'grito':
        g.fillStyle(PAL.ink, 1); g.fillRect(x - 1, olhoY - 2, 5, 5);
        break;
      default:
        g.fillStyle(PAL.ink, 1); g.fillRect(x, olhoY, 4, 3);
        break;
    }
  };
  olho(Math.round(L / 2) - 7);
  olho(Math.round(L / 2) + 3);
  g.fillStyle(PAL.ink, 1);
  const bocaY = 26;
  if (p.expressao === 'grito') g.fillRect(Math.round(L / 2) - 2, bocaY, 4, 4);
  else if (p.expressao === 'sorriso') g.fillRect(Math.round(L / 2) - 3, bocaY, 6, 2);
  else g.fillRect(Math.round(L / 2) - 2, bocaY, 5, 2);

  /*
   * Presas (`ALUCARD`): dois triângulos brancos a descer da boca. Em 40×112 são 2×3 unidades —
   * pequenas de propósito: querem-se visíveis no ecrã, não transformar o herói num monstro.
   */
  if (temPresas(p)) {
    g.fillStyle(PAL.ink, 1); g.fillRect(Math.round(L / 2) - 4, bocaY - 1, 8, 4);   // a boca
    g.fillStyle(0xf4f0e6, 1);
    g.fillTriangle(Math.round(L / 2) - 4, bocaY + 2, Math.round(L / 2) - 2, bocaY + 2,
      Math.round(L / 2) - 3, bocaY + 6);
    g.fillTriangle(Math.round(L / 2) + 1, bocaY + 2, Math.round(L / 2) + 3, bocaY + 2,
      Math.round(L / 2) + 2, bocaY + 6);
  }

  // --- marcas ---
  switch (p.marca) {
    case 'cicatriz-olho':
      g.fillStyle(cor('#7B2E4A'), 1); g.fillRect(Math.round(L / 2) + 4, 17, 2, 10);
      break;
    case 'cicatriz-boca':
      g.fillStyle(cor('#7B2E4A'), 1); g.fillRect(Math.round(L / 2) + 4, 24, 2, 7);
      break;
    case 'tatuagem-braco':
      g.fillStyle(PAL.ink, 0.85);
      g.fillRect(troncoX + 2, 46, 6, 2); g.fillRect(troncoX + 2, 50, 6, 2);
      break;
    case 'tatuagem-peito':
      g.fillStyle(PAL.ink, 0.85); g.fillRect(troncoX + 4, 48, tronco - 8, 3);
      break;
    case 'pintura':
      g.fillStyle(cor('#7B2E4A'), 0.85);
      g.fillRect(rostoX + 1, 18, rostoL - 2, 2); g.fillRect(rostoX + 1, 22, rostoL - 2, 2);
      break;
    default: break;
  }

  // --- braços, mãos, pernas e botas (a pele aparece nas mãos) ---
  g.fillStyle(peleN, 1); g.fillRect(ombroX, 44, 3, 34);       // braço esquerdo
  g.fillStyle(peleN, 1); g.fillRect(ombroX + ombro - 3, 44, 3, 34);
  g.fillStyle(peleN, 1); g.fillRect(cinturaX - 1, 80, 4, 8);  // mãos
  g.fillStyle(peleN, 1); g.fillRect(cinturaX + cintura - 3, 80, 4, 8);
  g.fillStyle(PAL.stone, 1); g.fillRect(cinturaX, 92, Math.round(cintura / 2) - 1, 12);
  g.fillStyle(PAL.stone, 1); g.fillRect(cinturaX + Math.round(cintura / 2) + 1, 92,
    Math.round(cintura / 2) - 1, 12);
  g.fillStyle(PAL.ink, 1); g.fillRect(cinturaX - 1, 102, Math.round(cintura / 2) + 1, 6);
  g.fillStyle(PAL.ink, 1); g.fillRect(cinturaX + Math.round(cintura / 2) + 1, 102,
    Math.round(cintura / 2) + 1, 6);
}

/** Gera a textura `player` no `BootScene` com a escolha do jogador. */
export function makePlayer(
  scene: Phaser.Scene, p: Personagem,
  tex: (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => void,
): void {
  tex('player', L, A, (g) => desenharHeroi(g, p));
  void scene;
}

export const HEROI_TAMANHO = { largura: L, altura: A } as const;
