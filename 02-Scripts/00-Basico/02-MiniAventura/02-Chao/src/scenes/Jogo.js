/* =====================================================================
   🎮 AULA 02 - CHÃO
   ---------------------------------------------------------------------
   OBJETIVO: construir o chão do cenário e conhecer o "tileSprite"
   (a ferramenta que faz uma imagem pequenina virar uma área gigante).

   O QUE MUDOU NESTA AULA (em relação à Aula 01):
   - Criamos CONSTANTES (valores fixos com nome) para não repetir números.
   - Adicionamos o chão com this.add.tileSprite().

   ⭐ = linha nova nesta aula.
   ===================================================================== */

/* ---------------------------------------------------------------------
   CONSTANTES - valores que NÃO mudam durante o jogo.

   Por que usar? Se você escrever 720 no meio do código, daqui a pouco
   ninguém sabe o que esse número significa. Dando um NOME, tudo fica
   mais fácil de ler e de mudar: altere aqui e o jogo inteiro atualiza.
--------------------------------------------------------------------- */
const LARGURA_TELA = 1280;                    // largura da tela, em pixels
const ALTURA_TELA = 720;                      // altura da tela, em pixels
const ALTURA_CHAO = 128;   // 💡 use múltiplos do tile (128, 256...) para o padrão repetir certinho                      // quanto o chão ocupa (embaixo)
const TOPO_CHAO = ALTURA_TELA - ALTURA_CHAO;  // a "linha do chão" = 592 ⭐
const CENTRO_X = LARGURA_TELA / 2;            // 640 (o meio da tela)     ⭐

class Jogo extends Phaser.Scene {

    constructor() {
        super('Jogo');
    }

    /* ---------------------------------------------------------------
       1) PRELOAD
       --------------------------------------------------------------- */
    preload() {
        this.load.image('ceu', 'assets/ceu.png');
        this.load.image('chao', 'assets/chao.png');   // ⭐ NOVO
    }

    /* ---------------------------------------------------------------
       2) CREATE
       --------------------------------------------------------------- */
    create() {

        // ---- O CÉU (fundo) -----------------------------------------
        // Desenhado PRIMEIRO... e por isso fica ATRÁS de tudo.
        // No Phaser, a ordem dos desenhos é a ordem das linhas:
        // quem vem depois fica na frente ("camadas", como em Photoshop).
        this.add.image(0, 0, 'ceu').setOrigin(0, 0);

        // ---- O CHÃO ------------------------------------------------
        // ⭐ NOVO: tileSprite = azulejo!
        // Uma imagem pequena (64x64) é repetida até preencher o tamanho
        // que você pedir. Igual ladrilho de banheiro. :)
        //
        //   add.tileSprite(posiçãoX, posiçãoY, largura, altura, 'apelido')
        //
        // Aqui: um chão de 1280 de largura x 120 de altura, no centro
        // horizontal (640) e na parte de baixo da tela.
        this.chao = this.add.tileSprite(CENTRO_X, TOPO_CHAO + ALTURA_CHAO / 2,
                                        LARGURA_TELA, ALTURA_CHAO, 'chao');

        // Guardamos na variável "this.chao" para usar depois.
        // Na próxima aula vamos MEXER nele para dar sensação de movimento!

        // ---- TEXTOS de apoio ---------------------------------------
        this.add.text(40, 28, 'AULA 02 - CHÃO', {
            fontFamily: 'Trebuchet MS, Arial',
            fontSize: '40px',
            color: '#ffffff',
            stroke: '#1e2233',
            strokeThickness: 8,
        });

        this.add.text(40, 84, 'O chão é um tileSprite: uma imagem pequena que se repete.', {
            fontFamily: 'Trebuchet MS, Arial',
            fontSize: '24px',
            color: '#123',
            stroke: '#eaf6ff',
            strokeThickness: 6,
        });

        console.log('Aula 02 pronta: chão construído de ' + ALTURA_CHAO + ' pixels de altura.');
    }
}

/* ---------------------------------------------------------------------
   🎯 TAREFAS DESTA AULA
   ---------------------------------------------------------------------
   1) Mude ALTURA_CHAO para 60 e depois para 240. O que acontece com o
      cenário? (Repare que o chão continua "grudado" embaixo.)

   2) Troque a altura do chão no código por 200 (sem mexer na constante).
      Por que o chão "flutua" no meio da tela? Descubra lendo o comentário
      do add.tileSprite.

   3) Faça o chão "escorregar" só uma vez: dentro do create(), depois de
      criar o chão, escreva:
          this.chao.tilePositionX = 200;
      (tilePositionX = quanto a imagem do azulejo está deslocada na horizontal)

   4) Deixe o chão menor na tela: adicione .setTileScale(2, 2) no fim da
      linha do chão. Depois teste (0.5, 0.5). O que muda?

   5) DESAFIO: crie um SEGUNDO chão, mais escuro, logo ABAIXO do primeiro
      (dica: use uma posição Y maior). Ele fica na frente ou atrás do
      chão original? Por quê?

   💡 DICA: depois de cada mudança, salve o arquivo e recarregue a página
   (tecla F5).
--------------------------------------------------------------------- */
