// >>> VERSÃO REACT + VITE desta aula. <<<
// É o mesmo código de src/scenes/Jogo.js da versão sem instalação, com duas
// diferenças pequenas (é assim que se usa Phaser dentro de um projeto React):
//   1) importar o Phaser como módulo (no lugar do <script> global)
//   2) 'export' na frente da classe, para o React poder importá-la.
// A cena é ligada ao React em src/PhaserGame.jsx.
import * as Phaser from 'phaser'

/* =====================================================================
   🎮 AULA 06 - MOVIMENTO DO PERSONAGEM
   ---------------------------------------------------------------------
   OBJETIVO: dar vida ao Milo! Ele vai andar, correr, pular, virar para
   os dois lados e trocar de animação conforme a situação.

   ESTA É A AULA MAIS IMPORTANTE DA TRILHA. Leia com calma. 🐢

   O QUE MUDOU NESTA AULA (em relação à Aula 05):
   - ⭐ O jogo agora tem FÍSICA (gravity): tudo cai, se não estiver apoiado.
   - ⭐ O herói ganhou um CORPO FÍSICO (body).
   - ⭐ Lemos o TECLADO com createCursorKeys().
   - ⭐ O update() virou o "cérebro" do herói: decide direção, pulo e animação.

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

const QUADRO_HEROI = 128;
const QUADRO_GOSMA_L = 104;
const QUADRO_GOSMA_A = 80;

/* ---- Números do movimento (mexa neles e sinta a diferença!) ---- ⭐ */
const VEL_ANDAR = 260;          // velocidade lateral, em pixels por segundo
const FORCA_PULO = -650;        // negativo = para CIMA (o eixo Y cresce para baixo!)
const QUADRO_PULO = 620;        // até esta altura, o boneco mostra a pose de pulo

export class Jogo extends Phaser.Scene {

    constructor() {
        super('Jogo');
    }

    /* ---------------------------------------------------------------
       1) PRELOAD - carrega as 3 folhas de animação do herói
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
        // ⭐ NOVO: a folha de quadros de CORRIDA (4 quadros de 128x128)
        this.load.spritesheet('heroi-correndo', 'assets/heroi-correndo.png', {
            frameWidth: QUADRO_HEROI, frameHeight: QUADRO_HEROI,
        });
        // ⭐ NOVO: a pose de PULO (1 único quadro)
        this.load.spritesheet('heroi-pulando', 'assets/heroi-pulando.png', {
            frameWidth: QUADRO_HEROI, frameHeight: QUADRO_HEROI,
        });

        this.load.spritesheet('gosma-andando', 'assets/gosma-andando.png', {
            frameWidth: QUADRO_GOSMA_L, frameHeight: QUADRO_GOSMA_A,
        });
    }

    /* ---------------------------------------------------------------
       2) CREATE
       --------------------------------------------------------------- */
    create() {

        // ---- CENÁRIO -----------------------------------------------
        this.add.image(0, 0, 'ceu').setOrigin(0, 0);
        this.montanhasClaras = this.add.tileSprite(CENTRO_X, 560, LARGURA_TELA, 240, 'montanhas-claras');
        this.montanhas = this.add.tileSprite(CENTRO_X, 520, LARGURA_TELA, 320, 'montanhas');
        this.nuvens = this.add.tileSprite(CENTRO_X, 150, LARGURA_TELA, 300, 'nuvens');
        this.chao = this.add.tileSprite(CENTRO_X, TOPO_CHAO + ALTURA_CHAO / 2,
                                        LARGURA_TELA, ALTURA_CHAO, 'chao');

        // ⭐⭐ NOVO E MUITO IMPORTANTE: os limites do "mundo".
        //    Nada pode sair da tela por engano nem cair para sempre.
        this.physics.world.setBounds(0, 0, LARGURA_TELA, ALTURA_TELA);

        // ⭐⭐ NOVO: o CHÃO DE VERDADE da física.
        //    Até agora o chão era só um desenho bonito. A física não sabe
        //    que ele existe! Criamos um "corpo invisível" (static) com a
        //    mesma posição e tamanho do desenho. É nele que o herói vai pisar.
        this.chaoFisico = this.add.rectangle(CENTRO_X, TOPO_CHAO + ALTURA_CHAO / 2,
                                             LARGURA_TELA, ALTURA_CHAO, 0x000000, 0);
        this.physics.add.existing(this.chaoFisico, true);   // true = corpo estático

        // ---- HERÓI -------------------------------------------------
        this.jogador = this.add.sprite(300, TOPO_CHAO - 200, 'heroi-parado').setOrigin(0.5, 1);

        // ⭐ NOVO: dando um CORPO FÍSICO ao herói.
        //    A partir daqui ele sofre gravidade e pode colidir com o chão.
        this.physics.add.existing(this.jogador);

        // ⭐ Configurando o corpo:
        this.jogador.body.setCollideWorldBounds(true);   // não passa das bordas
        this.jogador.body.setGravityY(0);                // usa a gravidade do jogo
        this.jogador.body.setSize(64, 108);              // caixa de colisão (larg, alt)
        this.jogador.body.setOffset(32, 20);             // posição da caixa no desenho
        // (a caixa é um pouquinho menor que o desenho: fica mais justo e justo é bom!)

        // ⭐⭐ A COLISÃO COM O CHÃO. Sem isso, o Milo atravessa o cenário!
        //    collider(A, B) avisa: "quando A e B se tocarem, impeça a passagem".
        this.physics.add.collider(this.jogador, this.chaoFisico);

        // ---- ANIMAÇÕES DO HERÓI ------------------------------------
        // ⭐ Agora são TRÊS animações. O código decide qual tocar.
        this.anims.create({
            key: 'heroi-parado',
            frames: this.anims.generateFrameNumbers('heroi-parado', { start: 0, end: 1 }),
            frameRate: 3,
            repeat: -1,
        });
        this.anims.create({
            key: 'heroi-correndo',
            frames: this.anims.generateFrameNumbers('heroi-correndo', { start: 0, end: 3 }),
            frameRate: 10,        // 10 quadros por segundo = passos rápidos
            repeat: -1,
        });
        this.anims.create({
            key: 'heroi-pulando',
            frames: this.anims.generateFrameNumbers('heroi-pulando', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1,           // é um quadro só: fica parado no ar
        });

        // ---- INIMIGOS ----------------------------------------------
        this.inimigos = [];
        this.criarInimigo(820);
        this.criarInimigo(1000);
        this.criarInimigo(1160);

        // ---- TECLADO ------------------------------------------------
        // ⭐⭐ NOVO: createCursorKeys() cria os 4 "botões" das setas:
        //     cursors.left, cursors.right, cursors.up, cursors.down
        //     e também cursors.space (a barra de espaço).
        //     Cada um vira um objeto com a propriedade .isDown:
        //     true = está sendo apertado agora; false = solto.
        this.cursors = this.input.keyboard.createCursorKeys();

        // Extra: também aceitamos A / D (padrão WASD, usado por muita gente)
        this.teclas = this.input.keyboard.addKeys({
            esq: Phaser.Input.Keyboard.KeyCodes.A,
            dir: Phaser.Input.Keyboard.KeyCodes.D,
        });

        // ---- TEXTOS de apoio ---------------------------------------
        this.add.text(40, 28, 'AULA 06 - MOVIMENTO DO PERSONAGEM', {
            fontFamily: 'Trebuchet MS, Arial',
            fontSize: '40px',
            color: '#ffffff',
            stroke: '#1e2233',
            strokeThickness: 8,
        });
        this.add.text(40, 84, 'Setas ou A/D para andar. Espaço ou ↑ para pular.', {
            fontFamily: 'Trebuchet MS, Arial',
            fontSize: '24px',
            color: '#123',
            stroke: '#eaf6ff',
            strokeThickness: 6,
        });

        console.log('Aula 06 pronta: aperte as setas e o espaço!');
    }

    /* ---------------------------------------------------------------
       criarInimigo(x) - a receita de gosma (da aula passada)
       --------------------------------------------------------------- */
    criarInimigo(x) {
        const gosma = this.add.sprite(x, TOPO_CHAO, 'gosma-andando').setOrigin(0.5, 1);
        gosma.play('gosma-andando');
        this.inimigos.push(gosma);
        return gosma;
    }

    /* ---------------------------------------------------------------
       3) UPDATE - o cérebro do herói 🧠
       ---------------------------------------------------------------
       Esta função roda ~60x por segundo. Ela:
         a) lê o teclado,
         b) decide a velocidade do herói,
         c) escolhe a animação certa,
         d) move o cenário (parallax).
       --------------------------------------------------------------- */
    update() {

        // ---- a) LER O TECLADO --------------------------------------
        // left.isDown é true quando a seta esquerda está apertada.
        const apertouEsquerda = this.cursors.left.isDown || this.teclas.esq.isDown;
        const apertouDireita = this.cursors.right.isDown || this.teclas.dir.isDown;
        const apertouPulo = this.cursors.up.isDown || this.cursors.space.isDown;

        // ---- b) MOVIMENTO HORIZONTAL -------------------------------
        if (apertouEsquerda) {
            this.jogador.body.setVelocityX(-VEL_ANDAR);   // anda para a esquerda
            this.jogador.setFlipX(true);                  // ⭐ vira o desenho!
        } else if (apertouDireita) {
            this.jogador.body.setVelocityX(VEL_ANDAR);    // anda para a direita
            this.jogador.setFlipX(false);
        } else {
            this.jogador.body.setVelocityX(0);            // solto = fica parado
        }

        // ---- c) PULO -----------------------------------------------
        // blocked.down = "tem algo me segurando por baixo?" = estou no chão.
        // ⭐ O pulo só pode acontecer se o herói ESTIVER no chão (senão ele
        //    ficaria voando como um beija-flor!).
        const estaNoChao = this.jogador.body.blocked.down;

        if (apertouPulo && estaNoChao) {
            this.jogador.body.setVelocityY(FORCA_PULO);
            // (A força do pulo é negativa porque, no Phaser, o Y cresce
            //  para BAIXO. Para subir, usamos um número negativo.)
        }

        // ---- d) QUAL ANIMAÇÃO TOCAR? -------------------------------
        if (!estaNoChao) {
            // está no ar: mostra a pose de pulo
            this.jogador.anims.play('heroi-pulando', true);
        } else if (apertouEsquerda || apertouDireita) {
            this.jogador.anims.play('heroi-correndo', true);
        } else {
            this.jogador.anims.play('heroi-parado', true);
        }
        // (o "true" no final significa: "não reinicie a animação se ela
        //  já estiver tocando" - evita que o desenho fique "tremendo")

        // ---- e) PARALLAX (o cenário anda junto) --------------------
        this.nuvens.tilePositionX += VEL_NUVENS;
        this.montanhasClaras.tilePositionX += VEL_MONTANHAS_CLARAS;
        this.montanhas.tilePositionX += VEL_MONTANHAS;
    }
}

/* =====================================================================
   🎁 EXTRA 1 - O PULO VARIÁVEL (pulo "inteligente")
   =====================================================================
   Problema: se o jogador só toca no botão de pulo, o Milo sobe ALTÍSSIMO.
   Solução: se ele SOLTAR o botão no meio do pulo, cortamos a subida.

   Cole estas linhas no update(), logo DEPOIS do bloco do pulo:

        // Se soltou o botão e ainda está subindo, freia o pulo:
        if (!apertouPulo && this.jogador.body.velocity.y < 0) {
            this.jogador.body.setVelocityY(this.jogador.body.velocity.y * 0.9);
        }

   Agora compare: um toquinho = pulinho; segurar = pulo alto. Muito melhor! 🎮
   ===================================================================== */

/* =====================================================================
   🎁 EXTRA 2 - PULO DUPLO (aquele que todo jogo de plataforma tem)
   =====================================================================
   1) No create(), crie um contador:

        this.pulosExtras = 0;

   2) Troque o bloco do pulo no update() por este:

        const podePular = estaNoChao || this.pulosExtras < 1;

        if (apertouPulo && podePular && !this.segurandoPulo) {
            this.segurandoPulo = true;              // trava: 1 pulo por toque
            this.jogador.body.setVelocityY(FORCA_PULO);
            if (!estaNoChao) this.pulosExtras++;    // gastou o pulo extra
        }
        if (!apertouPulo) this.segurandoPulo = false;   // soltou = destrava

  (O "segurandoPulo" evita que o pulo seja disparado 60 vezes por segundo
   enquanto o botão fica apertado. Isso se chama "flag de controle".)
   ===================================================================== */

/* =====================================================================
   🎁 EXTRA 3 - SOM DE PULO
   =====================================================================
   1) Carregue o som no preload() (quando você tiver o arquivo):

        this.load.audio('som-pulo', 'assets/som-pulo.mp3');

   2) Toque o som na hora de pular:

        this.sound.play('som-pulo');

   Nada de arquivo ainda? Sem problema: deixe o Extra 3 para depois
   da trilha de Sons (pasta 07-Sounds do repositório). 🎵
   ===================================================================== */
