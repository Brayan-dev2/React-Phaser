/**
 * `LVL-16` §11 — as peças do Trono (`CEN-111` a `CEN-116`).
 *
 * `AST-023` (`tm_trono`, ~26 tiles) ainda não existe (`P-71`): aqui são silhuetas na paleta
 * `PAL-16`, como nos outros setores antes da arte. Seis peças, e **uma delas é o jogo inteiro**:
 *
 *   - `plantonista` — 128×192 (2×3 tiles, `AST-022`). Homem alto, casaco de guarda remendado,
 *     **lanterna numa vara**, apito no peito. **Sem arma**: ele carrega o equipamento do posto.
 *   - `posto` — `CEN-111` a cadeira em que ele está há trinta e um anos: baixa, de guarda, com
 *     o gancho da lanterna. É o **alvo** de `MEC-011` e é inalcançável enquanto ele está de pé.
 *   - `cracha` — `CEN-116`: **40 crachás em 41 pregos**, e o prego 41 está vazio desde antes do
 *     jogador chegar. O último prego não é um detalhe: é a vaga.
 *   - `trono` — `CEN-114`: trono **partido**. Mobília danificada que ninguém trocou.
 *   - `varanda` — `CEN-115`: a amurada de onde se vê as Ruínas da Vigília lá embaixo, e de onde
 *     **não se pode descer** (`DEC-005`).
 *   - `senha` — `CEN-112`: o distribuidor com `SENHA ATUAL: 000`. Não é bug de display: é o
 *     número de pessoas que se ofereceram em toda a história do lugar.
 */
import Phaser from 'phaser';
import { PAL } from '../data/palette';

const VINHO = PAL.accent16;
const VINHO_ESCURO = 0x4d1c30;

export function makeTrono(scene: Phaser.Scene, tex: (
  key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void,
) => void): void {
  // `ENT-008` — 128×192, 2×3 tiles, com a lanterna na vara acima da cabeça (`AST-022`)
  tex('plantonista', 128, 192, (g) => {
    // a vara da lanterna: 1 tile acima da cabeça, e é ela que faz o hurtbox de 176 px
    g.fillStyle(PAL.ink, 1); g.fillRect(20, 0, 5, 96);
    g.fillStyle(VINHO, 1); g.fillRect(10, 0, 24, 14);
    g.fillStyle(PAL.bone, 0.85); g.fillRect(14, 4, 16, 6);
    // casaco de guarda remendado: volume escuro, gola clara, remendo de vinho
    g.fillStyle(PAL.ink, 1); g.fillRoundedRect(26, 92, 76, 100, 8);
    g.fillStyle(PAL.mass, 1); g.fillRect(32, 108, 64, 74);
    g.fillStyle(PAL.stone, 1); g.fillRect(32, 108, 64, 10);          // a gola
    g.fillStyle(VINHO, 0.9); g.fillRect(38, 132, 20, 16);            // remendo
    g.fillStyle(VINHO, 0.9); g.fillRect(74, 150, 16, 18);            // remendo
    g.fillStyle(PAL.ink, 1); g.fillRect(62, 108, 4, 74);             // o abotoamento
    // cabeça: alta, queixo duro, sem expressão
    g.fillStyle(PAL.bone, 1); g.fillRect(44, 62, 40, 34);
    g.fillStyle(PAL.ink, 1); g.fillRect(44, 56, 40, 12);             // o boné
    g.fillStyle(VINHO, 1); g.fillRect(44, 66, 40, 4);                // a faixa do boné
    g.fillStyle(PAL.ink, 1); g.fillRect(52, 80, 6, 4); g.fillRect(70, 80, 6, 4);
    // apito no peito — ele não carrega arma: carrega o equipamento do posto
    g.fillStyle(PAL.gold, 1); g.fillRect(70, 120, 10, 8);
    g.fillStyle(PAL.ink, 1); g.fillRect(74, 124, 4, 4);
    // braço esquerdo solto, mão aberta: ele não fecha punho em 31 anos
    g.fillStyle(PAL.mass, 1); g.fillRect(20, 118, 12, 58);
    g.fillStyle(PAL.bone, 1); g.fillRect(20, 172, 12, 12);
    // pernas grossas, botas de guarda
    g.fillStyle(PAL.ink, 1); g.fillRect(40, 182, 20, 10); g.fillRect(70, 182, 20, 10);
  });

  // `CEN-111` o posto: cadeira baixa de guarda com o gancho da lanterna. É o alvo de `MEC-011`.
  tex('posto', 64, 96, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(6, 20, 52, 76);
    g.fillStyle(PAL.mass, 1); g.fillRect(10, 24, 44, 68);
    g.fillStyle(PAL.stone, 1); g.fillRect(10, 24, 44, 12);           // o encosto
    g.fillStyle(PAL.stone, 0.7); g.fillRect(14, 40, 36, 8);          // o assento
    g.fillStyle(VINHO, 1); g.fillRect(14, 40, 36, 3);                // o vinho do estofado
    g.fillStyle(PAL.gold, 0.9); g.fillRect(46, 52, 4, 14);           // o gancho da lanterna
    g.fillStyle(PAL.ink, 1); g.fillRect(14, 88, 8, 8); g.fillRect(42, 88, 8, 8);
    // a placa do posto: o número que ninguém leu
    g.fillStyle(PAL.bone, 0.8); g.fillRect(20, 30, 24, 8);
  });

  // `CEN-116` o quadro de crachás: 40 crachás em 41 pregos, e o último vazio (§4.5)
  tex('cracha', 192, 256, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 192, 256);
    g.fillStyle(VINHO_ESCURO, 1); g.fillRect(6, 6, 180, 244);        // o feltro do quadro
    // 8 colunas × 5 linhas = 40 crachás + o prego 41, sozinho, no canto
    for (let i = 0; i < 40; i++) {
      const cx = 14 + (i % 8) * 21;
      const cy = 16 + Math.floor(i / 8) * 30;
      g.fillStyle(PAL.ink, 1); g.fillRect(cx, cy, 17, 22);
      g.fillStyle(PAL.bone, 0.72); g.fillRect(cx + 2, cy + 3, 13, 16);
      g.fillStyle(PAL.ink, 0.6); g.fillRect(cx + 4, cy + 7, 9, 2);
      g.fillStyle(PAL.ink, 0.6); g.fillRect(cx + 4, cy + 11, 7, 2);
    }
    // o prego 41: **vazio**, e o vazio é o assunto
    g.fillStyle(PAL.ink, 1); g.fillRect(152, 172, 17, 22);
    g.fillStyle(VINHO, 0.5); g.fillRect(154, 175, 13, 16);
    g.fillStyle(PAL.bone, 1); g.fillRect(159, 176, 3, 3);            // o prego
    // e a moldura que ninguém limpou
    g.fillStyle(PAL.stone, 1); g.fillRect(6, 6, 180, 4); g.fillRect(6, 246, 180, 4);
  });

  // `CEN-114` o trono partido: mobília danificada que ninguém trocou (§4.6)
  tex('trono', 128, 160, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(8, 8, 112, 152);
    g.fillStyle(PAL.mass, 1); g.fillRect(14, 14, 100, 146);
    // o espaldar: alto, e partido na diagonal — a fratura é a informação
    g.fillStyle(PAL.stone, 1); g.fillRect(20, 16, 88, 78);
    g.fillStyle(PAL.bg, 1);
    g.fillTriangle(72, 16, 108, 16, 108, 54);
    g.fillTriangle(20, 62, 20, 94, 52, 94);
    g.fillStyle(VINHO, 0.85); g.fillRect(20, 16, 88, 5);             // a faixa do estofado
    // assento e braços
    g.fillStyle(PAL.stone, 1); g.fillRect(20, 96, 88, 16);
    g.fillStyle(VINHO, 0.6); g.fillRect(24, 96, 80, 5);
    g.fillStyle(PAL.stone, 1); g.fillRect(12, 96, 10, 36); g.fillRect(106, 96, 10, 36);
    // pés: um deles falta — o trono está partido desde antes do jogador
    g.fillStyle(PAL.ink, 1); g.fillRect(18, 148, 16, 12);
    g.fillStyle(PAL.ink, 1); g.fillRect(92, 140, 14, 10);
  });

  // `CEN-115` a varanda: amurada baixa, e além dela **nada a fazer** (§4.6, `DEC-005`)
  tex('varanda', 128, 160, (g) => {
    // o vão: o vazio do lado de fora, com a luz de LVL-01 muito longe embaixo
    g.fillStyle(PAL.bg, 1); g.fillRect(0, 0, 128, 160);
    g.fillStyle(PAL.stone, 0.35); g.fillRect(8, 116, 112, 10);
    g.fillStyle(PAL.gold, 0.22); g.fillRect(24, 104, 80, 12);        // a Vigília, 300 m abaixo
    // a amurada: baixa de propósito — dá para ver, não dá para pular
    g.fillStyle(PAL.ink, 1); g.fillRect(0, 118, 128, 22);
    g.fillStyle(PAL.stone, 1); g.fillRect(0, 114, 128, 10);
    g.fillStyle(VINHO, 0.7); g.fillRect(0, 114, 128, 3);
    g.fillStyle(PAL.ink, 0.7);
    for (let x = 10; x < 128; x += 22) g.fillRect(x, 124, 4, 14);
  });

  // `CEN-112` o distribuidor de senha: mostra `000`, e `000` é a resposta (§4.2)
  tex('senha', 64, 128, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(8, 8, 48, 120);
    g.fillStyle(PAL.mass, 1); g.fillRect(12, 12, 40, 112);
    g.fillStyle(PAL.bone, 0.9); g.fillRect(18, 22, 28, 16);          // o display
    g.fillStyle(PAL.ink, 1); g.fillRect(22, 26, 6, 8);               // 0
    g.fillRect(29, 26, 6, 8);                                        // 0
    g.fillRect(36, 26, 6, 8);                                        // 0
    g.fillStyle(VINHO, 0.9); g.fillRect(18, 44, 28, 3);
    g.fillStyle(PAL.stone, 1); g.fillRect(20, 56, 24, 8);            // a fenda do papel
    g.fillStyle(PAL.ink, 1); g.fillRect(24, 70, 16, 4);
  });

  // `LVL-16` §3 — `w` pedra nua: o último andar é despovoado, e a textura é o vazio
  tex('bare_wall', 64, 128, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(2, 4, 60, 124);
    g.fillStyle(PAL.mass, 1); g.fillRect(6, 8, 52, 120);
    g.fillStyle(PAL.stone, 0.5); g.fillRect(6, 8, 52, 6);
    g.fillStyle(PAL.ink, 0.4); g.fillRect(6, 52, 52, 3);
    g.fillStyle(PAL.ink, 0.4); g.fillRect(6, 96, 52, 3);
  });

  // `LVL-16` §3 — `c` cadeira vazia: seis desenhadas, quarenta implicadas (§4.2)
  tex('empty_chair', 48, 64, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(6, 4, 36, 60);
    g.fillStyle(PAL.mass, 1); g.fillRect(9, 7, 30, 54);
    g.fillStyle(PAL.stone, 0.8); g.fillRect(9, 7, 30, 22);           // encosto
    g.fillStyle(PAL.stone, 0.55); g.fillRect(12, 32, 24, 6);         // assento
    g.fillStyle(PAL.ink, 1); g.fillRect(12, 56, 5, 8); g.fillRect(31, 56, 5, 8);
  });

  // `LVL-16` §3 — `v` luz de vinho (`PAL-16`): vem de cima, do que está no fim do andar
  tex('wine_light', 96, 160, (g) => {
    g.fillStyle(VINHO, 0.16); g.fillRect(0, 0, 96, 160);
    g.fillStyle(VINHO, 0.28); g.fillTriangle(48, 0, 12, 160, 84, 160);
    g.fillStyle(PAL.bone, 0.2); g.fillRect(44, 0, 8, 160);
  });

  // `CEN-113` — o desgaste: rachadura (telegraph) e o tile que caiu (§5.6)
  tex('crack', 64, 64, (g) => {
    g.fillStyle(PAL.ink, 0.9);
    g.fillRect(28, 0, 5, 26); g.fillRect(31, 22, 4, 20); g.fillRect(20, 40, 26, 4);
    g.fillRect(22, 46, 4, 18);
  });
  tex('hole', 64, 64, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 64, 64);
    g.fillStyle(PAL.bg, 1); g.fillRect(4, 4, 56, 56);
    g.fillStyle(PAL.ink, 1); g.fillRect(2, 2, 60, 3);
  });

  // `MEC-012` §7.4 — o crachá final: 3 linhas, e o nome é o de quem lê
  tex('badge', 200, 128, (g) => {
    g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 200, 128);
    g.fillStyle(PAL.bone, 1); g.fillRect(4, 4, 192, 120);
    g.fillStyle(VINHO, 1); g.fillRect(4, 4, 192, 16);                // a faixa do posto
    g.fillStyle(PAL.ink, 0.75);
    g.fillRect(20, 40, 160, 6);                                      // POSTO: PREENCHIDO
    g.fillRect(20, 66, 96, 6);                                       // Nº: 041
    g.fillRect(20, 92, 130, 6);                                      // ASSINATURA: VOCÊ
    g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 200, 2); g.fillRect(0, 126, 200, 2);
  });
}
