// ============================================================
// ⚛️ Componente React - App
// ============================================================
// Este componente cria uma <div> vazia e coloca o jogo do Phaser
// dentro dela. Apenas isso - sem abas, sem explicações extras.
// ============================================================

import { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function App() {
  // useRef guarda a referência do jogo criado.
  const gameRef = useRef<Phaser.Game | null>(null);

  // useEffect roda 1x quando o componente aparece na tela.
  useEffect(() => {
    // Definição da cena: apenas céu azul (backgroundColor) e chão verde.
    class MeuCenario extends Phaser.Scene {
      constructor() {
        super("MeuCenario");
      }
      create() {
        const w = this.scale.width;
        const h = this.scale.height;
        // APENAS o chão verde
        this.add.rectangle(w / 2, h - 40, w, 80, 0x2ecc71);
      }
    }

    // Configuração do jogo
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 450,
      backgroundColor: "#87CEEB", // céu azul
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
