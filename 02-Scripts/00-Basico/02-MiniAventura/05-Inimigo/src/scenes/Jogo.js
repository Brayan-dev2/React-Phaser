/* =====================================================================
   🎮 AULA 05 - INIMIGO
   ---------------------------------------------------------------------
   OBJETIVO: colocar inimigos (as gosmas) no cenário e fazer um MÉTODO
   (uma função nossa) para criar vários com uma linha só.

   O QUE MUDOU NESTA AULA (em relação à Aula 04):
   - ⭐ Carregamos o spritesheet da gosma e criamos a animação dela.
   - ⭐ Escrevemos o nosso primeiro MÉTODO: criarInimigo(x) - uma receita
     que fabrica uma gosma na posição que pedirmos.
   - ⭐ Conhecemos a LISTA de inimigos (this.inimigos) para guardar todos.

   ⭐ = linha nova nesta aula.
   ===================================================================== */

const LARGURA_TELA = 1280;
const ALTURA_TELA = 720;
const ALTURA_CHAO = 128;   // 💡 use múltiplos do tile (128, 256...) para o padrão repetir certinho
const TOPO_CHAO = ALTURA_TELA - ALTURA_CHAO;   // 592 = a linha do chão
const CENTRO_X = LARGURA_TELA / 2;

const VEL_NUVENS = 0.3;
const VEL_MONTANHAS_CLARAS = 0.8;
const VEL_MONTANHAS = 1.6;

const QUADRO_HEROI = 128;     // o herói usa quadros de 128x128
const QUADRO_GOSMA_L = 104;   // ⭐ a gosma usa quadros de 104x80
const QUADRO_GOSMA_A = 80;    // ⭐

class Jogo extends Phaser.Scene {

    constructor() {
        super('Jogo');
    }

    /* ---------------------------------------------------------------
       1) PRELOAD
       --------------------------------------------------------------- */
    preload() {
        this.load.image('ceu', 'assets/ceu.png');
        this.load.image('montanhas-claras', 'assets/montanhas-claras.png');
        this.load.image('montanhas', 'assets/montanhas.png');
        this.load.image('nuvens', 'assets/nuvens.png');
        this.load.image('chao', 'assets/chao.png');

        this.load.spritesheet('heroi-parado', 'assets/heroi-parado.png', {
            frameWidth: QUADRO_HEROI, frameHeight: QUADRO_HEROI,
        });

        // ⭐ NOVO: o spritesheet da gosma (4 quadros de 104x80)
        this.load.spritesheet('gosma-andando', 'assets/gosma-andando.png', {
            frameWidth: QUADRO_GOSMA_L, frameHeight: QUADRO_GOSMA_A,
        });
    }

    /* ---------------------------------------------------------------
       2) CREATE
       --------------------------------------------------------------- */
    create() {

        // ---- O CENÁRIO ---------------------------------------------
        this.add.image(0, 0, 'ceu').setOrigin(0, 0);
        this.montanhasClaras = this.add.tileSprite(CENTRO_X, 560, LARGURA_TELA, 240, 'montanhas-claras');
        this.montanhas = this.add.tileSprite(CENTRO_X, 520, LARGURA_TELA, 320, 'montanhas');
        this.nuvens = this.add.tileSprite(CENTRO_X, 150, LARGURA_TELA, 300, 'nuvens');
        this.chao = this.add.tileSprite(CENTRO_X, TOPO_CHAO + ALTURA_CHAO / 2,
                                        LARGURA_TELA, ALTURA_CHAO, 'chao');

        // ---- O HERÓI -----------------------------------------------
        this.jogador = this.add.sprite(280, TOPO_CHAO, 'heroi-parado').setOrigin(0.5, 1);
        this.anims.create({
            key: 'heroi-parado',
            frames: this.anims.generateFrameNumbers('heroi-parado', { start: 0, end: 1 }),
            frameRate: 3,
            repeat: -1,
        });
        this.jogador.play('heroi-parado');

        // ---- ANIMAÇÃO DA GOSMA -------------------------------------
        // ⭐ A gosma tem 4 quadros de 104x80 (0, 1, 2 e 3) e pulsa rápido.
        //    frameRate 6 = 6 quadros por segundo: parece que ela respira
        //    e se mexe, mesmo paradinha.
        this.anims.create({
            key: 'gosma-andando',
            frames: this.anims.generateFrameNumbers('gosma-andando', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1,
        });

        // ---- OS INIMIGOS -------------------------------------------
        // ⭐ A lista (array) onde vamos guardar todas as gosmas.
        this.inimigos = [];
        this.criarInimigo(820);    // cria uma gosma em x=820
        this.criarInimigo(1000);
        this.criarInimigo(1160);

        // ---- TEXTOS de apoio ---------------------------------------
        this.add.text(40, 28, 'AULA 05 - INIMIGO', {
            fontFamily: 'Trebuchet MS, Arial',
            fontSize: '40px',
            color: '#ffffff',
            stroke: '#1e2233',
            strokeThickness: 8,
        });

        this.add.text(40, 84, 'Cada gosma é criada pelo nosso método criarInimigo(x).', {
            fontFamily: 'Trebuchet MS, Arial',
            fontSize: '24px',
            color: '#123',
            stroke: '#eaf6ff',
            strokeThickness: 6,
        });

        console.log('Aula 05 pronta: ' + this.inimigos.length + ' gosmas no cenário.');
    }

    /* ---------------------------------------------------------------
       ⭐ MÉTODO criarInimigo(x)
       ---------------------------------------------------------------
       Um MÉTODO é uma "receita": um pedaço de código com nome, que
       podemos chamar quantas vezes quisermos. Em vez de copiar e colar
       as mesmas 4 linhas para cada gosma, escrevemos a receita UMA vez.

       Recebe: x = a posição horizontal onde a gosma vai nascer.
       --------------------------------------------------------------- */
    criarInimigo(x) {
        // add.sprite(x, y, 'apelido') - igual ao herói
        const gosma = this.add.sprite(x, TOPO_CHAO, 'gosma-andando');

        // Pés da gosma no chão (mesmo truque do herói)
        gosma.setOrigin(0.5, 1);

        // Executa a animação de andar
        gosma.play('gosma-andando');

        // Guarda a gosma na lista, para usarmos depois
        // (na aula 07 elas vão andar; na 09, vão levar pisão!)
        this.inimigos.push(gosma);

        return gosma;   // devolve a gosma, caso quem chamou queira usar
    }

    /* ---------------------------------------------------------------
       3) UPDATE
       --------------------------------------------------------------- */
    update() {
        this.nuvens.tilePositionX += VEL_NUVENS;
        this.montanhasClaras.tilePositionX += VEL_MONTANHAS_CLARAS;
        this.montanhas.tilePositionX += VEL_MONTANHAS;

        // (Nesta aula os inimigos ainda estão parados. Paciência, gosmas!
        //  Na aula 07 elas ganham vida própria...)
    }
}

/* ---------------------------------------------------------------------
   🎯 TAREFAS DESTA AULA
   ---------------------------------------------------------------------
   1) Crie mais inimigos: adicione this.criarInimigo(500); no create().
      Quantas gosmas aparecem agora no console? (Olhe o console com F12!)

   2) Mude a velocidade da gosma: troque frameRate: 6 por 12. Ela fica
      mais assustadora ou mais engraçada?

   3) Faça uma gosma maior: dentro do criarInimigo(), coloque no fim:
          gosma.setScale(1.5);
      Os pés dela continuam no chão? Por que? (Spoiler: é o setOrigin!)

   4) DESAFIO - "gosma voadora": mude o this.criarInimigo(1000) para
      this.criarInimigo(1000) e faça uma versão que aceita também a
      altura:  criarInimigo(x, y)  e use  y = 300  para uma gosma no ar!

   5) PENSE: por que usamos uma LISTA (this.inimigos) em vez de criar
      variáveis gosma1, gosma2, gosma3...? (Dica: e se você quiser
      50 gosmas?)

   💡 OBSERVAÇÃO: repare que a gosma está "respirando" parada, sem andar.
   A animação só troca os desenhos; quem move objetos de verdade é a
   FÍSICA, que começa já na próxima aula!
--------------------------------------------------------------------- */
