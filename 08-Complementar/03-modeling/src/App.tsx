// ============================================================
// ⚛️ Componente React - App
// ============================================================
// Cenário com React + Phaser contendo:
//   • Céu azul (backgroundColor)
//   • Chão verde (retângulo)
//   • ☀️ Sol = 1 círculo
//   • ☁️ Nuvem = 3 elipses agrupadas em um container
//   • 🌳 Árvore = tronco (retângulo marrom) + folhagem (triângulo)
// ============================================================

import { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function App() {
  // useRef guarda a referência do jogo criado.
  const gameRef = useRef<Phaser.Game | null>(null);

  // useEffect roda 1x quando o componente aparece na tela.
  useEffect(() => {
    class MeuCenario extends Phaser.Scene {
      constructor() {
        super("MeuCenario");
      }

      create() {
        const w = this.scale.width;
        const h = this.scale.height;

        // ==========================================================
        // 🟢 CHÃO VERDE (um retângulo na parte de baixo)
        // ==========================================================
        this.add.rectangle(w / 2, h - 10, w, 80, 0x2ecc71);

        // ==========================================================
        // ☀️ SOL = 1 círculo amarelo
        // ==========================================================
        // this.add.circle(x, y, raio, cor)
        // Posicionado no canto superior direito (céu).
        this.add.circle(680, 80, 40, 0xf1c40f);

        // ==========================================================
        // ☁️ NUVEM = 3 elipses brancas dentro de um container
        // ==========================================================
        // this.add.container(x, y) cria um "grupo" de objetos.
        // Tudo dentro do container se move junto como se fosse 1 só.
        const nuvem = this.add.container(200, 90);
        
        // Adicionamos 3 elipses (círculos alongados) ao container.
        // this.add.ellipse(x, y, largura, altura, cor)
        // - A elipse do meio é maior (mais "alta" que larga).
        // - As laterais são mais "arredondadas" para o lado.
        nuvem.add(this.add.ellipse(0, 0, 50, 50, 0xffffff));
        nuvem.add(this.add.ellipse(35, 0, 75, 50, 0xffffff));
        nuvem.add(this.add.ellipse(70, 0, 50, 50, 0xffffff));
        
        // ==========================================================
        // 🌳 ÁRVORE = tronco (retângulo) + folhagem (triângulo)
        // ==========================================================

        // ----- Tronco (retângulo marrom) -----
        // Posicionado em cima do chão verde.
        // y = h - 90 -> fica 90px acima do final da tela (encostado no chão)
        // largura = 30, altura = 80 -> tronco fino e alto
        this.add.rectangle(550, h - 90, 30, 80, 0x6e2c00);

        // ----- Folhagem (triângulo verde-escuro) -----
        // this.add.triangle(x, y, x1, y1, x2, y2, x3, y3, cor)
        // (x, y) é o centro do triângulo.
        // Os 3 pontos (relativos ao centro) formam o triângulo:
        //   • topo:        (0, -50)
        //   • esquerda:    (-45, 30)
        //   • direita:     (45, 30)
        // Posicionado acima do tronco.
        this.add.triangle(590, h - 120, 0, -50, -45, 30, 45, 30, 0x1b5e20);
        this.add.triangle(590, h - 100, 0, -50, -45, 30, 45, 30, 0x1b5e20);
        this.add.triangle(590, h - 90, 0, -50, -45, 30, 45, 30, 0x1b5e20);
      }
    }

    // ----------------------------------------------------------
    // Configuração do jogo Phaser
    // ----------------------------------------------------------
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 450,
      backgroundColor: "#87CEEB", // 🔵 céu azul (fundo da cena)
      parent: "phaser-game-container",
      scene: [MeuCenario],
    };

    // Cria o jogo apenas 1 vez
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(config);
    }

    // Limpeza quando o componente sai da tela
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      {/* Única div do jogo - o Phaser desenha aqui dentro */}
      <div id="phaser-game-container" />
    </div>
  );
}
