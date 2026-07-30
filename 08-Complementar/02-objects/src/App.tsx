// ============================================================
// ⚛️ Componente React - App
// ============================================================
// Este componente cria uma <div> vazia e coloca o jogo do Phaser
// dentro dela. O Phaser desenha: céu azul + chão verde + 4 formas
// geométricas (círculo, quadrado, triângulo e X) cada uma com sua cor.
// ============================================================

import { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function App() {
  // useRef guarda a referência do jogo criado.
  const gameRef = useRef<Phaser.Game | null>(null);

  // useEffect roda 1x quando o componente aparece na tela.
  useEffect(() => {
    // ----------------------------------------------------------
    // Definição da cena do Phaser
    // ----------------------------------------------------------
    class MeuCenario extends Phaser.Scene {
      constructor() {
        super("MeuCenario");
      }

      create() {
        // Pegamos a largura e a altura da tela do jogo
        const w = this.scale.width;
        const h = this.scale.height;

        // ==========================================================
        // 🟢 CHÃO VERDE (um retângulo na parte de baixo)
        // ==========================================================
        // this.add.rectangle(x, y, largura, altura, cor)
        // - x, y são o CENTRO do retângulo
        // - h - 40 -> fica 40px acima do final (centro do chão)
        // - 80 -> espessura do chão (80 pixels de altura)
        this.add.rectangle(w / 2, h - 40, w, 80, 0x2ecc71);

        // ==========================================================
        // 🔵 CÍRCULO - cor azul (#3498DB)
        // ==========================================================
        // this.add.circle(x, y, raio, cor)
        // - x=120, y=300 -> posição da forma na tela
        // - raio=35 -> tamanho do círculo
        this.add.circle(200, 335, 35, 0x3498db);

        // ==========================================================
        // 🟦 QUADRADO - cor amarela (#F1C40F)
        // ==========================================================
        // this.add.rectangle(x, y, largura, altura, cor)
        // Para virar um quadrado, largura = altura = 70
        this.add.rectangle(300, 335, 70, 70, 0xf1c40f);

        // ==========================================================
        // 🔺 TRIÂNGULO - cor vermelha (#E74C3C)
        // ==========================================================
        // O Phaser não tem "add.triangle" fácil, então usamos a fórmula:
        // this.add.triangle(x, y, x1, y1, x2, y2, x3, y3, cor)
        // (x, y) é o CENTRO do triângulo
        // Os outros 3 pontos são os 3 cantos (relativos ao centro)
        //   • topo:        (0, -40)
        //   • esquerda:    (-40, 30)
        //   • direita:     (40, 30)
        this.add.triangle(450, 375, 0, -40, -40, 30, 40, 30, 0xe74c3c);

        // ==========================================================
        // ❌ X - cor roxa (#9B59B6) - feito com 2 retângulos girados
        // ==========================================================
        // O Phaser não tem "X" nativo, então criamos com 2 retângulos
        // finos e rotacionados em 45° e -45°.
        // - setOrigin(0.5) -> gira em torno do centro
        // - setAngle(45)   -> gira 45 graus
        const x1 = this.add.rectangle(520, 335, 90, 14, 0x9b59b6);
        x1.setOrigin(0.5);
        x1.setAngle(45);

        const x2 = this.add.rectangle(520, 335, 90, 14, 0x9b59b6);
        x2.setOrigin(0.5);
        x2.setAngle(-45);
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
