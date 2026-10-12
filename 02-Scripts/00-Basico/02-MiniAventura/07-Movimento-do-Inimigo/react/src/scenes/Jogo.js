// >>> VERSÃO REACT + VITE desta aula. <<<
// É o mesmo código de src/scenes/Jogo.js da versão sem instalação, com duas
// diferenças pequenas (é assim que se usa Phaser dentro de um projeto React):
//   1) importar o Phaser como módulo (no lugar do <script> global)
//   2) 'export' na frente da classe, para o React poder importá-la.
// A cena é ligada ao React em src/PhaserGame.jsx.
import * as Phaser from 'phaser'

/* =====================================================================
   🎮 AULA 07 - MOVIMENTO DO INIMIGO
   ---------------------------------------------------------------------
   OBJETIVO: as gosmas ganham vida! Elas andam sozinhas, viram ao bater
   nas bordas do mundo e cada uma tem a SUA própria velocidade.

   O QUE MUDOU NESTA AULA (em relação à Aula 06):
   - ⭐ Cada gosma ganhou um corpo físico e uma velocidade aleatória.
   - ⭐ Usamos o forEach para passar por TODAS as gosmas de uma vez.
   - ⭐ Conhecemos o Phaser.Math.Between(a, b): números aleatórios.
   - ⭐ Aprendemos a virar o inimigo quando ele bate na borda do mundo.

   ⭐ = linha nova nesta aula.
   ===================================================================== */

const LARGURA_TELA = 1280;
const ALTURA_TELA = 720;
const ALTURA_CHAO = 128;   // 💡 use múltiplos do tile (128, 256...) para o padrão repetir certinho
const TOPO_CHAO = ALTURA_TELA - ALTURA_CHAO;   // 592
const CENTRO_X = LARGURA_TELA / 2;

const VEL_NUVENS = 0.3;
const VEL_MONTANHAS_CLARAS = 0.8;
const VEL_MONTANHAS = 1.6;

const QUADRO_HEROI = 128;
const QUADRO_GOSMA_L = 104;
const QUADRO_GOSMA_A = 80;

const VEL_ANDAR = 260;
const FORCA_PULO = -650;

/* ⭐ Velocidades possíveis para as gosmas (pixels por segundo).
   Cada gosma sorteia uma entre VEL_GOSMA_MIN e VEL_GOSMA_MAX. */
const VEL_GOSMA_MIN = 60;
const VEL_GOSMA_MAX = 130;

export class Jogo extends Phaser.Scene {

    constructor() {
        super('Jogo');
    }

    preload() {
        this.load.image('ceu', 'assets/ceu.png');
        this.load.image('montanhas-claras', 'assets/montanhas-claras.png');
        this.load.image('montanhas', 'assets/montanhas.png');
        this.load.image('nuvens', 'assets/nuvens.png');
        this.load.image('chao', 'assets/chao.png');

        this.load.spritesheet('heroi-parado', 'assets/heroi-parado.png', {
            frameWidth: QUADRO_HEROI, frameHeight: QUADRO_HEROI,
        });
        this.load.spritesheet('heroi-correndo', 'assets/heroi-correndo.png', {
            frameWidth: QUADRO_HEROI, frameHeight: QUADRO_HEROI,
        });
        this.load.spritesheet('heroi-pulando', 'assets/heroi-pulando.png', {
            frameWidth: QUADRO_HEROI, frameHeight: QUADRO_HEROI,
        });
        this.load.spritesheet('gosma-andando', 'assets/gosma-andando.png', {
            frameWidth: QUADRO_GOSMA_L, frameHeight: QUADRO_GOSMA_A,
        });
    }

    create() {

        // ---- CENÁRIO -----------------------------------------------
        this.add.image(0, 0, 'ceu').setOrigin(0, 0);
        this.montanhasClaras = this.add.tileSprite(CENTRO_X, 560, LARGURA_TELA, 240, 'montanhas-claras');
        this.montanhas = this.add.tileSprite(CENTRO_X, 520, LARGURA_TELA, 320, 'montanhas');
        this.nuvens = this.add.tileSprite(CENTRO_X, 150, LARGURA_TELA, 300, 'nuvens');
        this.chao = this.add.tileSprite(CENTRO_X, TOPO_CHAO + ALTURA_CHAO / 2,
                                        LARGURA_TELA, ALTURA_CHAO, 'chao');

        // ---- FÍSICA DO MUNDO ---------------------------------------
        this.physics.world.setBounds(0, 0, LARGURA_TELA, ALTURA_TELA);
        this.chaoFisico = this.add.rectangle(CENTRO_X, TOPO_CHAO + ALTURA_CHAO / 2,
                                             LARGURA_TELA, ALTURA_CHAO, 0x000000, 0);
        this.physics.add.existing(this.chaoFisico, true);

        // ---- HERÓI -------------------------------------------------
        this.jogador = this.add.sprite(300, TOPO_CHAO - 200, 'heroi-parado').setOrigin(0.5, 1);
        this.physics.add.existing(this.jogador);
        this.jogador.body.setCollideWorldBounds(true);
        this.jogador.body.setSize(64, 108);
        this.jogador.body.setOffset(32, 20);
        this.physics.add.collider(this.jogador, this.chaoFisico);

        // ---- ANIMAÇÕES ---------------------------------------------
        this.anims.create({
            key: 'heroi-parado',
            frames: this.anims.generateFrameNumbers('heroi-parado', { start: 0, end: 1 }),
            frameRate: 3, repeat: -1,
        });
        this.anims.create({
            key: 'heroi-correndo',
            frames: this.anims.generateFrameNumbers('heroi-correndo', { start: 0, end: 3 }),
            frameRate: 10, repeat: -1,
        });
        this.anims.create({
            key: 'heroi-pulando',
            frames: this.anims.generateFrameNumbers('heroi-pulando', { start: 0, end: 0 }),
            frameRate: 1, repeat: -1,
        });
        this.anims.create({
            key: 'gosma-andando',
            frames: this.anims.generateFrameNumbers('gosma-andando', { start: 0, end: 3 }),
            frameRate: 6, repeat: -1,
        });

        // ---- INIMIGOS QUE ANDAM ------------------------------------
        this.inimigos = [];
        this.criarInimigo(700);
        this.criarInimigo(950);
        this.criarInimigo(1200);

        // ---- TECLADO ------------------------------------------------
        this.cursors = this.input.keyboard.createCursorKeys();
        this.teclas = this.input.keyboard.addKeys({
            esq: Phaser.Input.Keyboard.KeyCodes.A,
            dir: Phaser.Input.Keyboard.KeyCodes.D,
        });

        // ---- TEXTOS --------------------------------------------------
        this.add.text(40, 28, 'AULA 07 - MOVIMENTO DO INIMIGO', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '40px',
            color: '#ffffff', stroke: '#1e2233', strokeThickness: 8,
        });
        this.add.text(40, 84, 'As gosmas patrulham sozinhas e viram nas bordas do mapa.', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '24px',
            color: '#123', stroke: '#eaf6ff', strokeThickness: 6,
        });

        console.log('Aula 07 pronta: as gosmas estão patrulhando!');
    }

    /* ---------------------------------------------------------------
       criarInimigo(x) - agora com CORPO FÍSICO e VELOCIDADE ⭐
       --------------------------------------------------------------- */
    criarInimigo(x) {
        const gosma = this.add.sprite(x, TOPO_CHAO, 'gosma-andando').setOrigin(0.5, 1);
        gosma.play('gosma-andando');

        // ⭐ Corpo físico: agora a gosma pode andar e ser detectada
        this.physics.add.existing(gosma);

        // ⭐ Ela não pode sair do mundo (isso já faz ela virar nas bordas!)
        gosma.body.setCollideWorldBounds(true);
        gosma.body.setBounce(0, 0);         // nada de quicar, obrigado

        // ⭐ Caixa de colisão da gosma: um pouco menor que o desenho,
        //    para o toque ficar justo (não queremos injustiça no jogo!)
        gosma.body.setSize(72, 56);
        gosma.body.setOffset(16, 24);

        // ⭐ A gosma fica apoiada no chão físico
        this.physics.add.collider(gosma, this.chaoFisico);

        // ⭐ VELOCIDADE SORTEADA: cada gosma é única.
        //    Phaser.Math.Between(60, 130) devolve um número inteiro
        //    aleatório entre 60 e 130.
        //    Math.random() < 0.5 quer dizer "50% de chance": assim umas
        //    começam indo para a esquerda e outras para a direita.
        const velocidade = Phaser.Math.Between(VEL_GOSMA_MIN, VEL_GOSMA_MAX);
        const direcao = Math.random() < 0.5 ? -1 : 1;
        gosma.body.setVelocityX(velocidade * direcao);

        this.inimigos.push(gosma);
        return gosma;
    }

    /* ---------------------------------------------------------------
       3) UPDATE
       --------------------------------------------------------------- */
    update() {

        // ---- HERÓI: teclado (igualzinho à aula passada) ------------
        const apertouEsquerda = this.cursors.left.isDown || this.teclas.esq.isDown;
        const apertouDireita = this.cursors.right.isDown || this.teclas.dir.isDown;
        const apertouPulo = this.cursors.up.isDown || this.cursors.space.isDown;

        if (apertouEsquerda) {
            this.jogador.body.setVelocityX(-VEL_ANDAR);
            this.jogador.setFlipX(true);
        } else if (apertouDireita) {
            this.jogador.body.setVelocityX(VEL_ANDAR);
            this.jogador.setFlipX(false);
        } else {
            this.jogador.body.setVelocityX(0);
        }

        const estaNoChao = this.jogador.body.blocked.down;
        if (apertouPulo && estaNoChao) {
            this.jogador.body.setVelocityY(FORCA_PULO);
        }

        if (!estaNoChao) {
            this.jogador.anims.play('heroi-pulando', true);
        } else if (apertouEsquerda || apertouDireita) {
            this.jogador.anims.play('heroi-correndo', true);
        } else {
            this.jogador.anims.play('heroi-parado', true);
        }

        // ---- ⭐ INIMIGOS: virar nas bordas --------------------------
        // forEach = "para cada gosma da lista, faça isso".
        // Em vez de escrever o código 3 vezes, escrevemos 1 vez só.
        this.inimigos.forEach((gosma) => {

            // blocked.left = bateu na parede da esquerda?
            if (gosma.body.blocked.left) {
                gosma.body.setVelocityX(Phaser.Math.Between(VEL_GOSMA_MIN, VEL_GOSMA_MAX));
                gosma.setFlipX(false);
            }
            // blocked.right = bateu na parede da direita?
            else if (gosma.body.blocked.right) {
                gosma.body.setVelocityX(-Phaser.Math.Between(VEL_GOSMA_MIN, VEL_GOSMA_MAX));
                gosma.setFlipX(true);
            }
        });

        // ---- PARALLAX ------------------------------------------------
        this.nuvens.tilePositionX += VEL_NUVENS;
        this.montanhasClaras.tilePositionX += VEL_MONTANHAS_CLARAS;
        this.montanhas.tilePositionX += VEL_MONTANHAS;
    }
}

/* ---------------------------------------------------------------------
   🎯 TAREFAS DESTA AULA
   ---------------------------------------------------------------------
   1) Deixe UMA gosma gigante e lenta, e outra minúscula e rápida.
      (Dica: dentro do criarInimigo você pode usar Phaser.Math.Between
       também em setScale e nas velocidades.)

   2) Mude VEL_GOSMA_MAX para 300. O jogo ficou fácil ou difícil?
      Por quê?

   3) Faça as gosmas quicarem: troque setBounce(0, 0) por setBounce(1, 1)
      e depois suba a gravidade para 800. Que loucura! 🎈

   4) No flip: as gosmas estão viradas para o lado certo quando andam?
      Teste e, se estiver estranho, inverta os valores de setFlipX.

   5) DESAFIO - patrulha inteligente: faça a gosma virar quando ela
      passar de um ponto fixo (ex.: x > 1000). Você vai precisar de um
      if comparando gosma.x. 

   💡 PENSE: as gosmas estão todas com a MESMA velocidade? Como você
   pode provar isso jogando? (Dica: observe duas gosmas ao mesmo tempo.)
--------------------------------------------------------------------- */
