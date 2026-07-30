// ============================================================
// ⚛️ Componente React - App
// ============================================================
// Cenário com React + Phaser que muda o tempo com o passar do tempo:
//
// FASE 1 (0-3s):  ☀️  Céu azul, sol balançando
// FASE 2 (3-6s):  ☁️  Nuvens cinzas vão aparecendo e se acumulando
// FASE 3 (6-9s):  🌧️  Começa a chover! Muitas nuvens cinzas + gotas
// FASE 4 (9-12s): 🌤️  Nuvens vão embora, chuva para
// FASE 5 (12s+):  Volta para a FASE 1 (loop infinito)
//
// 🧠 Conceitos novos:
//   • this.time.addEvent() -> executa algo a cada X milissegundos
//   • Arrays para guardar várias nuvens/gotas
//   • this.add.rectangle() em loop para criar várias gotas
// ============================================================

import { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    class MeuCenario extends Phaser.Scene {
      sol!: Phaser.GameObjects.Arc;
      // Arrays para guardar várias nuvens cinzas e várias gotas de chuva
      nuvensCinzas: Phaser.GameObjects.Container[] = [];
      gotas: Phaser.GameObjects.Rectangle[] = [];

      // Variável que controla a "fase" do tempo
      // 1 = sol, 2 = nublando, 3 = chovendo, 4 = limpando
      fase = 1;
      // Contador de tempo dentro da fase atual
      tempoFase = 0;

      constructor() {
        super("MeuCenario");
      }

      create() {
        const w = this.scale.width;
        const h = this.scale.height;

        // 🟢 CHÃO VERDE
        this.add.rectangle(w / 2, h - 40, w, 80, 0x2ecc71);

        // ☀️ SOL (balança suavemente)
        this.sol = this.add.circle(680, 80, 40, 0xf1c40f);

        // 🌳 ÁRVORE
        this.add.rectangle(550, h - 90, 30, 80, 0x6e2c00);
        this.add.triangle(550, h - 170, 0, -50, -45, 30, 45, 30, 0x1b5e20);

        // ----------------------------------------------------------
        // ⏱️ CONTROLE DAS FASES DO TEMPO
        // ----------------------------------------------------------
        // A cada 3 segundos, mudamos de fase (1 -> 2 -> 3 -> 4 -> 1)
        // setInterval() executa a função repetidamente a cada X ms.
        this.time.addEvent({
          delay: 3000,        // 3000 ms = 3 segundos
          callback: () => this.mudarFase(),
          loop: true,         // fica repetindo para sempre
        });
      }

      // ----------------------------------------------------------
      // 🔄 mudarFase() - chamada a cada 3 segundos
      // ----------------------------------------------------------
      mudarFase() {
        // Avança para a próxima fase (1 -> 2 -> 3 -> 4 -> 1...)
        this.fase++;
        if (this.fase > 4) this.fase = 1;

        // ----- FASE 1: Limpar tudo (volta ao início) -----
        if (this.fase === 1) {
          this.limparNuvensCinzas();
          this.limparGotas();
        }

        // ----- FASE 2: Adicionar 2 nuvens cinzas -----
        if (this.fase === 2) {
          this.criarNuvemCinza(150, 80);
          this.criarNuvemCinza(500, 100);
        }

        // ----- FASE 3: Mais nuvens cinzas + começar a chover -----
        if (this.fase === 3) {
          this.criarNuvemCinza(300, 70);
          this.criarNuvemCinza(650, 90);
          this.criarGotasDeChuva();
        }

        // ----- FASE 4: Limpar nuvens cinzas e parar a chuva -----
        if (this.fase === 4) {
          this.limparNuvensCinzas();
          this.limparGotas();
        }
      }

      // ----------------------------------------------------------
      // ☁️ criarNuvemCinza() - cria 1 nuvem cinza em uma posição
      // ----------------------------------------------------------
      criarNuvemCinza(x: number, y: number) {
        // Criamos um container (igual à nuvem branca) mas cinza
        const nuvem = this.add.container(x, y);
        nuvem.add(this.add.ellipse(0, 0, 60, 50, 0x6c757d));   // cinza
        nuvem.add(this.add.ellipse(35, 0, 60, 50, 0x6c757d));
        nuvem.add(this.add.ellipse(70, 0, 60, 50, 0x6c757d));

        // Guardamos no array para poder limpar depois
        this.nuvensCinzas.push(nuvem);
      }

      // Remove TODAS as nuvens cinzas da tela
      limparNuvensCinzas() {
        this.nuvensCinzas.forEach((n) => n.destroy()); // destroy = apagar
        this.nuvensCinzas = []; // esvazia o array
      }

      // ----------------------------------------------------------
      // 💧 criarGotasDeChuva() - cria várias gotas caindo
      // ----------------------------------------------------------
      criarGotasDeChuva() {
        const w = this.scale.width;
        // Criamos 30 gotas espalhadas em posições X aleatórias
        // 0x3498db = azul (cor da água)
        for (let i = 0; i < 30; i++) {
          const x = Phaser.Math.Between(0, w);
          const y = Phaser.Math.Between(0, 150);
          const gota = this.add.rectangle(x, y, 3, 12, 0x3498db);
          this.gotas.push(gota);
        }
      }

      // Remove todas as gotas
      limparGotas() {
        this.gotas.forEach((g) => g.destroy());
        this.gotas = [];
      }

      // ----------------------------------------------------------
      // UPDATE - loop de animação (60x/segundo)
      // ----------------------------------------------------------
      update(time: number, delta: number) {
        // ☀️ Sol balançando
        this.sol.y = 80 + Math.sin(time / 1000) * 15;

        // 💧 Se tem gotas (fase 3), elas caem!
        if (this.gotas.length > 0) {
          // "delta * 0.3" = velocidade da queda (ajuste como quiser)
          this.gotas.forEach((gota) => {
            gota.y += delta * 0.3;

            // Se a gota passar do chão, volta para o topo
            // (assim a chuva nunca acaba!)
            if (gota.y > 350) {
              gota.y = -10;
              gota.x = Phaser.Math.Between(0, 800);
            }
          });
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 450,
      backgroundColor: "#87CEEB",
      parent: "phaser-game-container",
      scene: [MeuCenario],
    };

    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div id="phaser-game-container" />
    </div>
  );
}
