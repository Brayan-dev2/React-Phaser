// >>> VERSÃO REACT + VITE desta aula. <<<
// É o mesmo código de src/scenes/Jogo.js da versão sem instalação, com duas
// diferenças pequenas (é assim que se usa Phaser dentro de um projeto React):
//   1) importar o Phaser como módulo (no lugar do <script> global)
//   2) 'export' na frente da classe, para o React poder importá-la.
// A cena é ligada ao React em src/PhaserGame.jsx.
import * as Phaser from 'phaser'

/* =====================================================================
   🎮 AULA 01 - PLANO DE FUNDO
   ---------------------------------------------------------------------
   OBJETIVO: colocar uma imagem de fundo na tela do jogo.

   Todo jogo com Phaser tem 3 momentos. Decore estes nomes, porque eles
   aparecem em TODAS as aulas:

     1) preload()  -> CARREGAR: buscar as imagens e sons antes de jogar.
     2) create()   -> CRIAR: montar a tela e colocar os objetos no lugar.
     3) update()   -> ATUALIZAR: roda cerca de 60 vezes por segundo.
                      É aqui que as coisas se movem (só usamos na aula 03).

   Nesta aula usamos só o preload() e o create().
   ===================================================================== */

export class Jogo extends Phaser.Scene {

    /* O "construtor" dá um NOME para a cena.
       Esse nome ('Jogo') é usado no arquivo src/main.js. */
    constructor() {
        super('Jogo');
    }

    /* ---------------------------------------------------------------
       1) PRELOAD - carrega os arquivos que vamos usar
       --------------------------------------------------------------- */
    preload() {
        // load.image('apelido', 'caminho/do/arquivo.png')
        //   'apelido' = um nome curto que VOCÊ inventa para usar depois.
        //   O arquivo ceu.png está na pasta assets/ desta aula.
        this.load.image('ceu', 'assets/ceu.png');
    }

    /* ---------------------------------------------------------------
       2) CREATE - monta a tela do jogo
       --------------------------------------------------------------- */
    create() {

        // add.image(x, y, 'apelido') desenha a imagem carregada.
        // Atenção: no Phaser, o ponto (0, 0) é o CANTO SUPERIOR ESQUERDO
        // da tela, e não o centro!
        //
        // setOrigin(0, 0) = "o desenho começa no meu canto de cima à esquerda".
        // Por padrão, o Phaser centraliza o desenho na posição (0.5, 0.5).
        this.add.image(0, 0, 'ceu').setOrigin(0, 0);

        // -------------------------------------------------------------
        // TEXTOS na tela (vamos usar bastante para explicar as aulas)
        // -------------------------------------------------------------
        // add.text(x, y, 'texto', { opções de estilo })
        this.add.text(40, 28, 'AULA 01 - PLANO DE FUNDO', {
            fontFamily: 'Trebuchet MS, Arial',
            fontSize: '40px',
            color: '#ffffff',
            stroke: '#1e2233',   // contorno do texto = fica legível em qualquer fundo
            strokeThickness: 8,
        });

        this.add.text(40, 84, 'A tela do jogo tem 1280 x 720 pixels. O céu é uma imagem.', {
            fontFamily: 'Trebuchet MS, Arial',
            fontSize: '24px',
            color: '#123',
            stroke: '#eaf6ff',
            strokeThickness: 6,
        });

        // Uma "moldura" desenhada com um retângulo só para mostrar
        // onde fica o canto (0, 0). Você pode apagar esta parte!
        this.add.rectangle(0, 0, 6, 6, 0xff0055).setOrigin(0, 0);

        // Avisa quem está fora do jogo que a cena começou.
        // Isso ajuda a depurar no console do navegador (tecla F12).
        console.log('Aula 01 pronta: o plano de fundo está na tela!');
    }
}

/* ---------------------------------------------------------------------
   🎯 TAREFAS DESTA AULA (faça uma de cada vez!)
   ---------------------------------------------------------------------
   1) Troque a imagem: no preload(), use 'assets/chao.png' em vez de
      'assets/ceu.png' e veja o que aparece.

   2) Mude a posição do desenho: troque a linha do add.image para
      this.add.image(0, 0, 'ceu').setOrigin(0.5, 0.5);
      e depois para ...setOrigin(1, 1);  O que muda?

   3) Mude o texto: escreva seu nome no lugar de "AULA 01 - ...".

   4) No arquivo src/main.js troque backgroundColor: '#0b1020' por
      '#123456' (ou outra cor) e recarregue a página.

   💡 DICA: se a imagem não aparecer, confira se o caminho começa com
   "assets/" e se o nome do arquivo é exatamente o mesmo (letras maiúsculas
   e minúsculas fazem diferença!).
--------------------------------------------------------------------- */
