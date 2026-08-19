// ============================================================
// ⚛️ Componente React - App
// ============================================================
// Cenário com React + Phaser contendo:
//   • Céu azul (backgroundColor)
//   • Chão verde (retângulo)
//   • ☀️ Sol = 1 círculo que BALANÇA (vai e volta)
//   • ☁️ Nuvem = 3 elipses que se MOVEM da esquerda pra direita
//   • 🌳 Árvore = tronco (retângulo) + folhagem (triângulo)
//
// 🧠 Conceito novo: o método update() roda em loop (60x por segundo).
//    É dentro dele que fazemos animações!
// ============================================================

import { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function App() {
  // useRef guarda a referência do jogo criado.
  const gameRef = useRef<Phaser.Game | null>(null);

  // useEffect roda 1x quando o componente aparece na tela.
  useEffect(() => {
    class MeuCenario extends Phaser.Scene {
      // Declaramos as propriedades aqui para o TypeScript saber que existem.
      // "!" significa "confie em mim, isso será definido no create()".
      sol!: Phaser.GameObjects.Arc;
      nuvem!: Phaser.GameObjects.Container;

      constructor() {
        super("MeuCenario");
      }

      // ----------------------------------------------------------
      // CREATE - monta o cenário (roda 1 vez)
      // ----------------------------------------------------------
      create() {
        const w = this.scale.width;
        const h = this.scale.height;

        // 🟢 CHÃO VERDE
        this.add.rectangle(w / 2, h - 40, w, 80, 0x2ecc71);

        // ==========================================================
        // ☀️ SOL - guardamos numa variável para animar depois
        // ==========================================================
        // this.add.circle() retorna o objeto criado. Guardamos em
        // "this.sol" para podermos mexer nele no update().
        this.sol = this.add.circle(680, 80, 40, 0xf1c40f);

        // ==========================================================
        // ☁️ NUVEM - guardamos o CONTAINER numa variável
        // ==========================================================
        // Importante: animamos o CONTAINER inteiro (não cada elipse).
        // Assim as 3 elipses se movem juntas!
        this.nuvem = this.add.container(-100, 90); // começa fora da tela (esquerda)
        this.nuvem.add(this.add.ellipse(0, 0, 50, 50, 0xffffff));
        this.nuvem.add(this.add.ellipse(35, 0, 75, 60, 0xffffff));
        this.nuvem.add(this.add.ellipse(70, 0, 50, 50, 0xffffff));

        // Segunda nuvem
        this.nuvem2 = this.add.container(-100, 50); // começa fora da tela (esquerda)
        this.nuvem2.add(this.add.ellipse(0, 0, 50, 50, 0xffffff));
        this.nuvem2.add(this.add.ellipse(35, 0, 75, 60, 0xffffff));
        this.nuvem2.add(this.add.ellipse(70, 0, 50, 50, 0xffffff));

        // 🌳 ÁRVORE
        // Tronco (retângulo marrom)
        this.add.rectangle(550, h - 120, 30, 80, 0x6e2c00);
        // Folhagem (triângulo verde-escuro)
        this.add.triangle(590, h - 150, 0, -50, -45, 30, 45, 30, 0x1b5e20);
        this.add.triangle(590, h - 180, 0, -50, -45, 30, 45, 30, 0x1b5e20);

        // 🌳 ÁRVORE 2
        // Tronco (retângulo marrom)
        this.add.rectangle(400, h - 120, 30, 80, 0x6e2c00);
        // Folhagem (triângulo verde-escuro)
        this.add.triangle(445, h - 150, 0, -50, -45, 30, 45, 30, 0x1b5e20);
        this.add.triangle(445, h - 180, 0, -50, -45, 30, 45, 30, 0x1b5e20);
      }

      // ----------------------------------------------------------
      // UPDATE - roda em loop (60x por segundo)
      // ----------------------------------------------------------
      // Este é o método da ANIMAÇÃO! Tudo que se move é aqui dentro.
      // "time" = tempo total do jogo (em milissegundos)
      // "delta" = quanto tempo passou desde o último frame
      update(time: number, delta: number) {

        // ==========================================================
        // ☀️ SOL BALANÇANDO (vai e volta suavemente)
        // ==========================================================
        // Usamos a função Math.sin() que gera uma "onda" que vai
        // de -1 até +1 e volta, repetidamente.
        //
        // Como funciona:
        //   • Math.sin(time / 1000) -> oscila entre -1 e +1
        //   • Multiplicamos por 15 -> o sol sobe/desce 15 pixels
        //   • Somamos ao Y inicial (80) para ele "balançar" em volta
        //     dessa posição.
        this.sol.y = 80 + Math.sin(time / 1000) * 15;

        // ==========================================================
        // ☁️ NUVEM ANDANDO DA ESQUERDA PRA DIREITA
        // ==========================================================
        // "delta" está em milissegundos (ex: 16ms por frame).
        // Dividimos por 16 para que a velocidade seja parecida em
        // qualquer computador (não importa se ele é mais lento/rápido).
        //
        // 0.08 = velocidade da nuvem (pode ajustar: maior = mais rápido)        
        this.nuvem.x += delta * 0.08;

        // Quando a nuvem sai pela direita, volta para a esquerda
        // e começa tudo de novo (loop infinito).
        // 870 = largura (800) + um pouco a mais para sumir antes de voltar
        if (this.nuvem.x > 870) {
          this.nuvem.x = -100;
        }

        this.nuvem2.x -= delta * 0.08;

        // Invertendo direção da nuvem
        if (this.nuvem2.x < -100) {
          this.nuvem2.x = 870;
        }
      }
    }

    // ----------------------------------------------------------
    // Configuração do jogo Phaser
    // ----------------------------------------------------------
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 450,
      backgroundColor: "#87CEEB", // 🔵 céu azul
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
