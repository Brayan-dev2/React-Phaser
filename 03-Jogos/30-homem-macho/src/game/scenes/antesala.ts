/**
 * `LVL-15` §11 — as peças da ante-sala (`CEN-106` a `CEN-110`).
 *
 * `AST-021` (`tm_antesala`, ~20 tiles) ainda não existe (`P-68`): aqui são silhuetas na
 * paleta `PAL-15`, como nos outros setores antes da arte. Cinco peças, e **nenhuma tem som**:
 * a cinza é muda, a porta lacrada é muda, o lacre não estala (§7.3).
 *
 *   - `guardiao` — baixo, **sem rosto**, avental de arquivo e **um carimbo em cada mão**. Os
 *     dois corpos são **idênticos**: diferenciá-los por cor ou forma mataria a luta (§6.5).
 *   - `seal` — o carimbo arremessado (`ATK-17`): pequeno, lento e visível por 960 ms.
 *   - `sealed_door` — a porta lacrada (`CEN-107`): 6 no setor, todas iguais, todas mudas.
 *   - `service_door` — a única que abre (`CEN-106`), e dá para trás.
 *   - `bone_wall` — a parede de cinza-osso (`CEN-108`), a única textura do setor.
 */
import Phaser from 'phaser';
import { PAL } from '../data/palette';

/** `PAL-15` cinza-osso `#B9B2A8` (`LVL-15` §1). */
const OSSO = PAL.accent15;
const OSSO_ESCURO = 0x6f6a63;

export function makeAntesala(scene: Phaser.Scene, tex: (
  key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void,
) => void): void {
  // `ENT-007` — 128×128, 2×2 tiles, baixo, **sem rosto**, avental de arquivo, carimbo nas duas
  // mãos. Nada de olhos: os dois corpos não têm identidade, e é isso que os torna equivalentes.
  tex('guardiao', 128, 128, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRoundedRect(14, 10, 100, 116, 8);
    // avental de arquivo: cinza-osso, comprido, com a barra de luto
    g.fillStyle(OSSO_ESCURO, 1); g.fillRect(30, 46, 68, 70);
    g.fillStyle(OSSO, 1); g.fillRect(36, 52, 56, 54);
    g.fillStyle(PAL.ink, 1); g.fillRect(36, 74, 56, 3);           // o vinco do avental
    g.fillStyle(OSSO_ESCURO, 1); g.fillRect(36, 100, 56, 6);      // barra
    // cabeça: saco de arquivo, sem rosto nenhum
    g.fillStyle(OSSO, 1); g.fillRect(44, 16, 40, 30);
    g.fillStyle(PAL.ink, 1); g.fillRect(44, 40, 40, 6);
    g.fillStyle(OSSO_ESCURO, 1); g.fillRect(48, 20, 32, 4);       // a costura
    // braços com **carimbo** nas duas mãos (eles não carregam arma, carregam instrumento)
    g.fillStyle(OSSO_ESCURO, 1); g.fillRect(16, 52, 16, 46);
    g.fillStyle(OSSO_ESCURO, 1); g.fillRect(96, 52, 16, 46);
    g.fillStyle(PAL.ink, 1); g.fillRect(12, 92, 24, 18);          // carimbo esquerdo
    g.fillStyle(OSSO, 1); g.fillRect(16, 96, 16, 10);
    g.fillStyle(PAL.ink, 1); g.fillRect(92, 92, 24, 18);          // carimbo direito
    g.fillStyle(OSSO, 1); g.fillRect(96, 96, 16, 10);
    // pernas curtas e juntas: eles andam devagar e não perseguem
    g.fillStyle(PAL.ink, 1); g.fillRect(40, 116, 18, 10); g.fillRect(70, 116, 18, 10);
  });

  // `ATK-17` o selo: 24×24, lento, e por isso legível por 960 ms
  tex('seal', 24, 24, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(2, 2, 20, 20);
    g.fillStyle(OSSO, 1); g.fillRect(5, 5, 14, 14);
    g.fillStyle(OSSO_ESCURO, 1); g.fillRect(8, 8, 8, 8);
    g.fillStyle(PAL.ink, 1); g.fillRect(10, 10, 4, 4);
  });

  // `CEN-107` porta lacrada: 64×192 (3 tiles), ferro e **lacre**. Toda igual, toda muda.
  tex('sealed_door', 64, 192, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(4, 0, 56, 192);
    g.fillStyle(OSSO_ESCURO, 1); g.fillRect(8, 4, 48, 188);
    g.fillStyle(PAL.mass, 1); g.fillRect(12, 8, 40, 184);
    g.fillStyle(PAL.ink, 1); g.fillRect(12, 60, 40, 4);         // as duas faixas
    g.fillStyle(PAL.ink, 1); g.fillRect(12, 128, 40, 4);
    // o lacre: uma tira de osso atravessada, com a marca de cera
    g.fillStyle(OSSO, 1); g.fillRect(6, 86, 52, 16);
    g.fillStyle(PAL.threat, 0.9); g.fillRect(24, 88, 16, 12);
    g.fillStyle(PAL.ink, 1); g.fillRect(30, 92, 4, 4);
  });

  // `CEN-106` porta de serviço: a única que abre — e é a que dá para trás
  tex('service_door', 64, 128, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(6, 0, 52, 128);
    g.fillStyle(OSSO_ESCURO, 1); g.fillRect(10, 4, 44, 124);
    g.fillStyle(PAL.mass, 1); g.fillRect(14, 8, 36, 120);
    g.fillStyle(PAL.gold, 0.9); g.fillRect(14, 8, 36, 5);       // a soleira marcada
    g.fillStyle(OSSO, 1); g.fillRect(42, 62, 6, 10);            // maçaneta de osso
    g.fillStyle(PAL.ink, 1); g.fillRect(14, 96, 36, 3);
  });

  // `CEN-108` parede de cinza-osso: a única textura do setor, e ela é cinza
  tex('bone_wall', 64, 128, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(2, 4, 60, 124);
    g.fillStyle(OSSO_ESCURO, 1); g.fillRect(6, 8, 52, 120);
    g.fillStyle(OSSO_ESCURO, 1); g.fillRect(6, 8, 52, 8);
    g.fillStyle(PAL.ink, 0.5); g.fillRect(6, 44, 52, 3);        // as juntas do bloco
    g.fillStyle(PAL.ink, 0.5); g.fillRect(6, 84, 52, 3);
    g.fillStyle(OSSO, 0.25); g.fillRect(10, 14, 44, 4);         // o pó que sobra
  });
}
