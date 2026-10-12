// >>> VERSÃO REACT + VITE desta aula. <<<
// É o mesmo código de src/scenes/Jogo.js da versão sem instalação, com duas
// diferenças pequenas (é assim que se usa Phaser dentro de um projeto React):
//   1) importar o Phaser como módulo (no lugar do <script> global)
//   2) 'export' na frente da classe, para o React poder importá-la.
// A cena é ligada ao React em src/PhaserGame.jsx.
import * as Phaser from 'phaser'

/* =====================================================================
   🎮 AULA 03 - CENÁRIO COMPLETO
   ---------------------------------------------------------------------
   OBJETIVO: montar o cenário inteiro em CAMADAS (céu, nuvens, montanhas,
   chão) e fazer o cenário se mover com EFEITO PARALLAX.

   O QUE MUDOU NESTA AULA (em relação à Aula 02):
   - Carregamos 3 imagens novas de cenário.
   - Criamos as camadas na ordem certa (de trás para a frente).
   - ⭐ Usamos o update() pela primeira vez: é aqui que o mundo se mexe.
   - ⭐ Efeito PARALLAX: o que está longe anda devagar, o que está perto
     anda rápido. É assim que os desenhos animados enganam nossos olhos!
   ===================================================================== */

const LARGURA_TELA = 1280;
const ALTURA_TELA = 720;
const ALTURA_CHAO = 128;   // 💡 use múltiplos do tile (128, 256...) para o padrão repetir certinho
const TOPO_CHAO = ALTURA_TELA - ALTURA_CHAO;   // 600
const CENTRO_X = LARGURA_TELA / 2;             // 640

/* Velocidades do cenário (em pixels por quadro). ⭐
   Regra de ouro do parallax:  LONGE = DEVAGAR,  PERTO = RÁPIDO */
const VEL_NUVENS = 0.3;          // bem longe: quase parado
const VEL_MONTANHAS_CLARAS = 0.8;
const VEL_MONTANHAS = 1.6;
const VEL_CHAO = 3.5;            // bem perto: mais rápido

export class Jogo extends Phaser.Scene {

    constructor() {
        super('Jogo');
    }

    /* ---------------------------------------------------------------
       1) PRELOAD - carrega TUDO que vamos desenhar
       --------------------------------------------------------------- */
    preload() {
        // O cenário é montado como um teatro: cada camada é um "pano de fundo"
        this.load.image('ceu', 'assets/ceu.png');                          // camada 0
        this.load.image('montanhas-claras', 'assets/montanhas-claras.png'); // camada 1
        this.load.image('montanhas', 'assets/montanhas.png');               // camada 2
        this.load.image('nuvens', 'assets/nuvens.png');                     // camada 3
        this.load.image('chao', 'assets/chao.png');                         // camada 4
    }

    /* ---------------------------------------------------------------
       2) CREATE - monta o cenário, camada por camada
       --------------------------------------------------------------- */
    create() {

        // ---- CAMADA 0: o céu (fixo, não se move: ele é "infinito") ----
        this.add.image(0, 0, 'ceu').setOrigin(0, 0);

        // ---- CAMADA 1: montanhas bem distantes ----
        // Elas ficam lá em cima (y=592) e são clarinhas, para parecer longe.
        // Lembra: tileSprite(centroX, centroY, largura, altura, apelido)
        this.montanhasClaras = this.add.tileSprite(CENTRO_X, 560, LARGURA_TELA, 240,
                                                   'montanhas-claras');

        // ---- CAMADA 2: montanhas mais escuras (mais perto) ----
        this.montanhas = this.add.tileSprite(CENTRO_X, 520, LARGURA_TELA, 320, 'montanhas');

        // ---- CAMADA 3: nuvens ----
        this.nuvens = this.add.tileSprite(CENTRO_X, 150, LARGURA_TELA, 300, 'nuvens');

        // ---- CAMADA 4: o chão (o mais perto de tudo: desenhado por último) ----
        this.chao = this.add.tileSprite(CENTRO_X, TOPO_CHAO + ALTURA_CHAO / 2,
                                        LARGURA_TELA, ALTURA_CHAO, 'chao');

        // ---- TEXTOS de apoio ----
        this.add.text(40, 28, 'AULA 03 - CENÁRIO COMPLETO', {
            fontFamily: 'Trebuchet MS, Arial',
            fontSize: '40px',
            color: '#ffffff',
            stroke: '#1e2233',
            strokeThickness: 8,
        });

        this.add.text(40, 84, 'Parallax: o que está longe se move devagar. O chão pode correr!', {
            fontFamily: 'Trebuchet MS, Arial',
            fontSize: '24px',
            color: '#123',
            stroke: '#eaf6ff',
            strokeThickness: 6,
        });

        console.log('Aula 03 pronta: 5 camadas de cenário montadas.');
    }

    /* ---------------------------------------------------------------
       3) UPDATE - roda ~60 vezes por segundo (60 FPS)!
       ---------------------------------------------------------------
       Cada vez que o navegador desenha um quadro novo, esta função roda.
       É aqui que as coisas se mexem.  .tilePositionX += velocidade
       significa: "desloque a imagem do azulejo um pouquinho para o lado",
       dando a impressão de que o cenário está sendo arrastado.
       --------------------------------------------------------------- */
    update() {
        this.nuvens.tilePositionX += VEL_NUVENS;                       // bem devagar
        this.montanhasClaras.tilePositionX += VEL_MONTANHAS_CLARAS;
        this.montanhas.tilePositionX += VEL_MONTANHAS;
        this.chao.tilePositionX += VEL_CHAO;                           // mais rápido
    }
}

/* ---------------------------------------------------------------------
   🎯 TAREFAS DESTA AULA
   ---------------------------------------------------------------------
   1) Troque os valores das constantes de velocidade. O que deixa o
      cenário com "cara de corrida"? (dica: valores grandes)

   2) Inverta a regra: deixe o chão lento (0.5) e as nuvens rápidas (5).
      Ficou estranho? Explique por quê com suas palavras. 😄

   3) Apague a linha do chão dentro do update(). O que acontece?
      E se você apagar só a das nuvens?

   4) Mude a posição das camadas: coloque as montanhas claras em y = 500.
      Elas sobem ou descem na tela?

   5) DESAFIO: adicione uma velocidade que MUDA com o tempo, assim:
          this.chao.tilePositionX += VEL_CHAO + Math.sin(Date.now() / 800) * 2;
      (Math.sin devolve um número que vai e volta entre -1 e 1; ele cria
      um movimento de "acelera e freia" - ninguém mais pode te pegar!)

   💡 PERGUNTA PARA PENSAR: por que o céu não se move no parallax?
   Se você fosse o(a) desenhista do jogo, o que apareceria bem devagarzinho
   lá no fundo para dar ainda mais profundidade?
--------------------------------------------------------------------- */
