/**
 * `LVL-14` §11 — as peças da fortaleza (`CEN-100` a `CEN-105`).
 *
 * `AST-019` (`tm_fortaleza`, ~30 tiles) ainda não existe (`P-66`): aqui são silhuetas
 * geométricas na paleta `PAL-14`, do mesmo jeito que os outros setores fizeram antes da arte.
 * São seis peças, e cada uma tem uma leitura obrigatória:
 *
 *   - `comandante` — alto, **imóvel**, capa com o estandarte negro. A capa é o que passa a
 *     mensagem: ele é o posto, não o homem (§5.1).
 *   - `spear` — a lança arremessada (`ATK-14`), longa e fina, para dar os 900 ms de voo.
 *   - `merlon` — a ameia da muralha (`CEN-104`): a fortaleza vista de fora.
 *   - `black_banner` — o estandarte de luto permanente (`CEN-102`); em L14-03 ocupa 2 tiles.
 *   - `key_lock` — a fechadura de chave (`CEN-103`), **duas** lado a lado no portão.
 *   - `eclipse_disc` — o disco do eclipse (`CEN-100`) no céu; a cena o move, não a arte.
 *
 * `P-66` continua aberto: o que falta é arte, não regra.
 */
import Phaser from 'phaser';
import { PAL } from '../data/palette';

/** `PAL-14` azul-noite `#5A6BB0` (`LVL-14` §1) — agora no `PAL`, não numa constante local. */
const NOITE = PAL.accent14;
const NOITE_ESCURO = 0x2d3457;

export function makeFortaleza(scene: Phaser.Scene, tex: (
  key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void,
) => void): void {
  // `ENT-006` O Comandante — 192×192, alto, ereto, capa com o estandarte negro.
  // Ele **não anda** (§6.5): as pernas ficam juntas e o peso é todo vertical.
  tex('comandante', 192, 192, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRoundedRect(20, 4, 152, 188, 10);
    // capa: o estandarte negro escorregando do ombro até o chão (§5.6)
    g.fillStyle(PAL.ink, 1); g.fillRect(24, 60, 146, 128);
    g.fillStyle(NOITE_ESCURO, 1); g.fillRect(30, 64, 134, 124);
    g.fillStyle(PAL.ink, 1); g.fillRect(96, 64, 8, 124);            // a dobra da capa
    // tronco: alto e estreito, armadura de peito com o brasão da Vigília
    g.fillStyle(PAL.mass, 1); g.fillRoundedRect(58, 62, 78, 92, 6);
    g.fillStyle(NOITE, 1); g.fillRect(64, 70, 66, 40);
    g.fillStyle(PAL.ink, 1); g.fillRect(64, 92, 66, 4);             // faixa do peito
    g.fillStyle(PAL.gold, 0.85); g.fillRect(88, 78, 18, 12);        // brasão
    // cabeça: elmo fechado, sem rosto — ele é um posto, não um homem
    g.fillStyle(PAL.bone, 1); g.fillRect(74, 20, 46, 42);
    g.fillStyle(PAL.ink, 1); g.fillRect(74, 38, 46, 12);            // a fenda
    g.fillStyle(NOITE, 1); g.fillRect(78, 26, 38, 8);               // crista
    g.fillStyle(PAL.threat, 1); g.fillRect(80, 42, 10, 5); g.fillRect(104, 42, 10, 5);
    // braço da lança: esticado, sempre do lado do jogador
    g.fillStyle(PAL.mass, 1); g.fillRect(136, 74, 26, 60);
    g.fillStyle(PAL.bone, 1); g.fillRect(140, 128, 22, 14);
    // pernas juntas: ele não muda de x (§6.5)
    g.fillStyle(PAL.ink, 1); g.fillRect(68, 152, 26, 34); g.fillRect(102, 152, 26, 34);
    g.fillStyle(PAL.stone, 1); g.fillRect(70, 176, 30, 10); g.fillRect(100, 176, 30, 10);
  });

  // `ATK-14` a lança: 96×16, comprida e fina, para o voo de 900 ms ser visível (§5.3)
  tex('spear', 96, 16, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(0, 4, 96, 10);
    g.fillStyle(0x8a7a5c, 1); g.fillRect(2, 6, 74, 6);              // haste
    g.fillStyle(PAL.bone, 1); g.fillRect(76, 3, 14, 12);            // ponta
    g.fillStyle(PAL.ink, 1); g.fillRect(90, 6, 6, 6);
    g.fillStyle(NOITE, 1); g.fillRect(30, 6, 8, 6);                 // atilho da Vigília
  });

  // `CEN-104` ameia: a muralha vista de fora. Oito blocos com a seteira em negativo.
  tex('merlon', 64, 96, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(4, 8, 56, 88);
    g.fillStyle(NOITE_ESCURO, 1); g.fillRect(8, 12, 48, 84);
    g.fillStyle(PAL.stone, 1); g.fillRect(8, 12, 48, 8);            // o remate
    g.fillStyle(PAL.ink, 1); g.fillRect(24, 34, 16, 26);            // seteira
    g.fillStyle(NOITE, 0.6); g.fillRect(28, 38, 8, 18);
    g.fillStyle(PAL.ink, 1); g.fillRect(8, 68, 48, 3);
  });

  // `CEN-102` estandarte **negro**: luto oficial permanente (§4.3). A largura é por tile;
  // o de L14-03 é desenhado duas vezes lado a lado pela cena (`width: 2`).
  tex('black_banner', 64, 128, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(6, 6, 52, 10);              // mastro horizontal
    g.fillStyle(PAL.ink, 1); g.fillRect(10, 14, 44, 110);
    g.fillStyle(0x14131d, 1); g.fillRect(13, 18, 38, 102);          // o pano, mais escuro que tudo
    g.fillStyle(NOITE, 0.35); g.fillRect(13, 18, 38, 6);            // a luz que resta
    g.fillStyle(PAL.bone, 0.18); g.fillRect(30, 44, 6, 40);         // o brasão apagado
    g.fillStyle(PAL.ink, 1); g.fillRect(13, 108, 38, 14);           // barra de luto
  });

  // `CEN-103` fechadura: ferro, duas linguetas, e um espaço vazio do tamanho de uma chave
  tex('key_lock', 64, 64, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(6, 6, 52, 52);
    g.fillStyle(PAL.stone, 1); g.fillRect(10, 10, 44, 44);
    g.fillStyle(PAL.mass, 1); g.fillRect(14, 14, 36, 36);
    g.fillStyle(PAL.ink, 1); g.fillRect(28, 20, 8, 24);             // o buraco da chave
    g.fillStyle(PAL.gold, 0.9); g.fillRect(30, 24, 4, 16);
    g.fillStyle(PAL.ink, 1); g.fillRect(20, 36, 24, 4);             // lingueta
  });

  // `CEN-100` o disco do eclipse: a lua na frente do sol. A cena anima o resto.
  tex('eclipse_disc', 128, 128, (g) => {
    g.fillStyle(PAL.bone, 1); g.fillCircle(64, 64, 56);
    g.fillStyle(PAL.ink, 1); g.fillCircle(64, 64, 56);
    g.fillStyle(NOITE, 0.55); g.fillCircle(64, 64, 52);             // o aro de luz
    g.fillStyle(PAL.ink, 1); g.fillCircle(72, 60, 46);              // a lua cobrindo o sol
    g.fillStyle(PAL.bone, 0.85); g.fillRect(12, 60, 8, 8);          // a coroa
    g.fillStyle(PAL.gold, 0.7); g.fillRect(104, 54, 6, 6);
  });
}
