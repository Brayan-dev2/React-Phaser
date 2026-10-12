// >>> VERSÃO REACT + VITE desta aula. <<<
// É o mesmo código de src/scenes/Jogo.js da versão sem instalação, com duas
// diferenças pequenas (é assim que se usa Phaser dentro de um projeto React):
//   1) importar o Phaser como módulo (no lugar do <script> global)
//   2) 'export' na frente da classe, para o React poder importá-la.
// A cena é ligada ao React em src/PhaserGame.jsx.
import * as Phaser from 'phaser'

/* =====================================================================
   🎮 AULA 11 - NOVAS PLATAFORMAS
   ---------------------------------------------------------------------
   OBJETIVO: construir plataformas onde o herói pode pular e subir até
   pegar a ESTRELA DOURADA (o grande prêmio do nível!).

   O QUE MUDOU NESTA AULA (em relação à Aula 10):
   - ⭐ Carregamos o tile da plataforma e a estrela.
   - ⭐ Criamos o método criarPlataforma(centroX, topoY, largura) que
     desenha a plataforma E cria o corpo físico dela.
   - ⭐ O herói agora pode colidir com VÁRIAS plataformas.
   - ⭐ A estrela dourada: item especial que vale 500 pontos.

   ⭐ = linha nova nesta aula.
   ===================================================================== */

const LARGURA_TELA = 1280;
const ALTURA_TELA = 720;
const ALTURA_CHAO = 128;   // 💡 múltiplo do tile (128, 256...) repete certinho
const TOPO_CHAO = ALTURA_TELA - ALTURA_CHAO;   // 592
const CENTRO_X = LARGURA_TELA / 2;

const VEL_NUVENS = 0.3;
const VEL_MONTANHAS_CLARAS = 0.8;
const VEL_MONTANHAS = 1.6;

const QUADRO_HEROI = 128;
const QUADRO_GOSMA_L = 104;
const QUADRO_GOSMA_A = 80;
const QUADRO_MOEDA = 64;

const VEL_ANDAR = 260;
const FORCA_PULO = -650;
const FORCA_QUIQUE = -420;
const VEL_GOSMA_MIN = 60;
const VEL_GOSMA_MAX = 130;

const X_INICIO = 300;
const TEMPO_INVENCIVEL = 1000;

const PONTOS_MOEDA = 100;
const PONTOS_ESTRELA = 500;     // ⭐ a estrela vale mais que tudo!

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
        // ⭐ NOVO: o pedaço de plataforma e a estrela dourada
        this.load.image('plataforma', 'assets/plataforma.png');
        this.load.image('estrela', 'assets/estrela.png');

        this.load.spritesheet('heroi-parado', 'assets/heroi-parado.png', {
            frameWidth: QUADRO_HEROI, frameHeight: QUADRO_HEROI,
        });
        this.load.spritesheet('heroi-correndo', 'assets/heroi-correndo.png', {
            frameWidth: QUADRO_HEROI, frameHeight: QUADRO_HEROI,
        });
        this.load.spritesheet('heroi-pulando', 'assets/heroi-pulando.png', {
            frameWidth: QUADRO_HEROI, frameHeight: QUADRO_HEROI,
        });
        this.load.spritesheet('heroi-dano', 'assets/heroi-dano.png', {
            frameWidth: QUADRO_HEROI, frameHeight: QUADRO_HEROI,
        });
        this.load.spritesheet('gosma-andando', 'assets/gosma-andando.png', {
            frameWidth: QUADRO_GOSMA_L, frameHeight: QUADRO_GOSMA_A,
        });
        this.load.spritesheet('gosma-derrotada', 'assets/gosma-derrotada.png', {
            frameWidth: QUADRO_GOSMA_L, frameHeight: QUADRO_GOSMA_A,
        });
        this.load.spritesheet('moeda', 'assets/moeda.png', {
            frameWidth: QUADRO_MOEDA, frameHeight: QUADRO_MOEDA,
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
        this.jogador = this.add.sprite(X_INICIO, TOPO_CHAO - 200, 'heroi-parado').setOrigin(0.5, 1);
        this.physics.add.existing(this.jogador);
        this.jogador.body.setCollideWorldBounds(true);
        this.jogador.body.setSize(64, 108);
        this.jogador.body.setOffset(32, 20);
        this.physics.add.collider(this.jogador, this.chaoFisico);

        this.invencivel = false;
        this.inimigosDerrotados = 0;
        this.pontos = 0;
        this.textoPontos = this.add.text(40, 40, 'PONTOS: 0', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '34px',
            color: '#ffe066', stroke: '#3a2a00', strokeThickness: 6,
        });

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
            key: 'heroi-dano',
            frames: this.anims.generateFrameNumbers('heroi-dano', { start: 0, end: 0 }),
            frameRate: 1, repeat: 0,
        });
        this.anims.create({
            key: 'gosma-andando',
            frames: this.anims.generateFrameNumbers('gosma-andando', { start: 0, end: 3 }),
            frameRate: 6, repeat: -1,
        });
        this.anims.create({
            key: 'gosma-derrotada',
            frames: this.anims.generateFrameNumbers('gosma-derrotada', { start: 0, end: 1 }),
            frameRate: 8, repeat: 0,
        });
        this.anims.create({
            key: 'moeda-girando',
            frames: this.anims.generateFrameNumbers('moeda', { start: 0, end: 3 }),
            frameRate: 10, repeat: -1,
        });

        // ---- ⭐ PLATAFORMAS ----------------------------------------
        // Uma "escadinha" no céu: comece pela de baixo!
        this.criarPlataforma(430, 450, 224);    // (centroX, topoY, largura)
        this.criarPlataforma(700, 360, 224);
        this.criarPlataforma(960, 270, 192);
        this.criarPlataforma(1180, 420, 192);   // plataforma "secreta" mais alta

        // ---- INIMIGOS (no chão, como sempre) -----------------------
        this.inimigos = [];
        this.criarInimigo(760);
        this.criarInimigo(1000);
        this.criarInimigo(1180);

        // ---- MOEDAS ------------------------------------------------
        this.moedas = [];
        this.criarMoeda(430, 390);      // em cima da 1ª plataforma
        this.criarMoeda(700, 300);      // em cima da 2ª
        this.criarMoeda(960, 210);      // em cima da 3ª
        this.criarMoeda(560, TOPO_CHAO - 50);
        this.criarMoeda(880, TOPO_CHAO - 50);

        // ---- ⭐ A ESTRELA DOURADA ----------------------------------
        // O prêmio final! Fica na plataforma mais alta.
        this.criarEstrela(960, 150);

        // ---- OVERLAPS ----------------------------------------------
        this.physics.add.overlap(this.jogador, this.inimigos, this.aoTocarInimigo, null, this);
        this.physics.add.overlap(this.jogador, this.moedas, this.coletarMoeda, null, this);

        // ---- TECLADO ------------------------------------------------
        this.cursors = this.input.keyboard.createCursorKeys();
        this.teclas = this.input.keyboard.addKeys({
            esq: Phaser.Input.Keyboard.KeyCodes.A,
            dir: Phaser.Input.Keyboard.KeyCodes.D,
        });

        // ---- TEXTOS --------------------------------------------------
        this.add.text(40, 92, 'AULA 11 - NOVAS PLATAFORMAS', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '40px',
            color: '#ffffff', stroke: '#1e2233', strokeThickness: 8,
        });
        this.add.text(40, 148, 'Suba pelas plataformas e pegue a estrela dourada!', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '24px',
            color: '#123', stroke: '#eaf6ff', strokeThickness: 6,
        });

        console.log('Aula 11 pronta: 4 plataformas e uma estrela esperando!');
    }

    /* ---------------------------------------------------------------
       ⭐ MÉTODO criarPlataforma(centroX, topoY, largura)
       ---------------------------------------------------------------
       Uma plataforma precisa de DUAS coisas:
         1) o DESENHO (o tileSprite que repete o pedacinho de terra)
         2) o CORPO FÍSICO (a caixa invisível em que o herói pisa)

       Aqui, o y que passamos é o TOPO da plataforma - que é justamente
       onde o herói vai pisar. :)
       --------------------------------------------------------------- */
    criarPlataforma(centroX, topoY, largura) {
        const altura = 64;   // as nossas plataformas têm 64 pixels de altura

        // 1) O DESENHO: um tileSprite que repete até ficar do tamanho pedido
        this.add.tileSprite(centroX, topoY + altura / 2, largura, altura, 'plataforma');

        // 2) O CORPO FÍSICO (invisível): um retângulo estático
        const corpo = this.add.rectangle(centroX, topoY + altura / 2, largura, altura, 0x000000, 0);
        this.physics.add.existing(corpo, true);   // true = estático (não cai!)

        // ⭐ COLISÃO: o herói não atravessa a plataforma.
        this.physics.add.collider(this.jogador, corpo);

        return corpo;
    }

    /* ---------------------------------------------------------------
       ⭐ MÉTODO criarEstrela(x, y) - o prêmio do nível
       --------------------------------------------------------------- */
    criarEstrela(x, y) {
        const estrela = this.add.image(x, y, 'estrela');

        // ⭐ Dá um "brilho" girando: o tween de ângulo (-10º a 10º)
        this.tweens.add({
            targets: estrela,
            angle: 12,
            duration: 900,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1,
        });
        // ⭐ E uma flutuação, igual à das moedas
        this.tweens.add({
            targets: estrela,
            y: y - 10,
            duration: 800,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1,
        });

        this.physics.add.existing(estrela);
        estrela.body.setAllowGravity(false);
        estrela.body.setImmovable(true);

        // Guardamos numa variável para usar no overlap.
        this.estrela = estrela;

        // ⭐ Overlap só com a estrela.
        this.physics.add.overlap(this.jogador, this.estrela, this.pegarEstrela, null, this);
    }

    /* ---------------------------------------------------------------
       ⭐ MÉTODO pegarEstrela() - O GRANDE MOMENTO! 🏆
       --------------------------------------------------------------- */
    pegarEstrela(jogador, estrela) {
        if (!estrela.active) return;
        estrela.body.enable = false;

        this.pontos += PONTOS_ESTRELA;
        this.textoPontos.setText('PONTOS: ' + this.pontos);

        // Um foguinho de comemoração: a tela pisca em dourado
        this.cameras.main.flash(400, 255, 220, 90);
        this.cameras.main.shake(200, 0.004);

        // Texto gigante de vitória que aparece e some
        const parabens = this.add.text(CENTRO_X, 260, 'VOCÊ PEGOU A ESTRELA!', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '58px',
            color: '#ffe066', stroke: '#3a2a00', strokeThickness: 12,
        }).setOrigin(0.5);

        this.tweens.add({
            targets: parabens,
            y: 200,
            alpha: 0,
            delay: 900,
            duration: 800,
            onComplete: () => parabens.destroy(),
        });

        // A estrela voa para o céu (para cima, girando e sumindo)
        this.tweens.add({
            targets: estrela,
            y: estrela.y - 200,
            angle: 360,
            alpha: 0,
            duration: 700,
            onComplete: () => estrela.destroy(),
        });

        console.log('ESTRELA CONQUISTADA! Pontos finais: ' + this.pontos);
    }

    criarMoeda(x, y) {
        const moeda = this.add.sprite(x, y, 'moeda');
        moeda.play('moeda-girando');
        this.physics.add.existing(moeda);
        moeda.body.setAllowGravity(false);
        moeda.body.setImmovable(true);
        this.tweens.add({
            targets: moeda, y: y - 14, duration: 700,
            ease: 'Sine.inOut', yoyo: true, repeat: -1,
        });
        this.moedas.push(moeda);
        return moeda;
    }

    coletarMoeda(jogador, moeda) {
        if (!moeda.active) return;
        moeda.body.enable = false;

        this.tweens.add({
            targets: moeda, scale: 1.8, alpha: 0, duration: 220,
            onComplete: () => moeda.destroy(),
        });

        const textoBonus = this.add.text(moeda.x, moeda.y - 30, '+' + PONTOS_MOEDA, {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '30px',
            color: '#ffe066', stroke: '#3a2a00', strokeThickness: 6,
        }).setOrigin(0.5);
        this.tweens.add({
            targets: textoBonus, y: textoBonus.y - 60, alpha: 0, duration: 600,
            onComplete: () => textoBonus.destroy(),
        });

        this.pontos += PONTOS_MOEDA;
        this.textoPontos.setText('PONTOS: ' + this.pontos);
    }

    criarInimigo(x) {
        const gosma = this.add.sprite(x, TOPO_CHAO, 'gosma-andando').setOrigin(0.5, 1);
        gosma.play('gosma-andando');
        this.physics.add.existing(gosma);
        gosma.body.setCollideWorldBounds(true);
        gosma.body.setBounce(0, 0);
        gosma.body.setSize(72, 56);
        gosma.body.setOffset(16, 24);
        this.physics.add.collider(gosma, this.chaoFisico);

        const velocidade = Phaser.Math.Between(VEL_GOSMA_MIN, VEL_GOSMA_MAX);
        const direcao = Math.random() < 0.5 ? -1 : 1;
        gosma.body.setVelocityX(velocidade * direcao);
        gosma.derrotada = false;

        this.inimigos.push(gosma);
        return gosma;
    }

    aoTocarInimigo(jogador, inimigo) {
        if (inimigo.derrotada) return;
        const estaCaindo = jogador.body.velocity.y > 0;
        const peAbaixoDoTopo = jogador.body.bottom <= inimigo.body.top + 24;
        if (estaCaindo && peAbaixoDoTopo) {
            this.derrotarInimigo(inimigo, jogador);
        } else {
            this.levarDano(jogador, inimigo);
        }
    }

    derrotarInimigo(inimigo, jogador) {
        inimigo.derrotada = true;
        inimigo.body.setVelocityX(0);
        inimigo.body.enable = false;
        inimigo.anims.play('gosma-derrotada', true);
        jogador.body.setVelocityY(FORCA_QUIQUE);
        this.cameras.main.flash(120, 255, 255, 255);
        this.inimigosDerrotados++;
        inimigo.once('animationcomplete', () => inimigo.destroy());
    }

    levarDano(jogador, inimigo) {
        if (this.invencivel) return;
        this.invencivel = true;
        this.cameras.main.shake(180, 0.008);
        this.jogador.setTint(0xff6b6b);
        this.time.delayedCall(300, () => this.jogador.clearTint());

        const direcao = jogador.x < inimigo.x ? -1 : 1;
        jogador.body.setVelocityX(220 * direcao);
        jogador.body.setVelocityY(-380);
        jogador.anims.play('heroi-dano', true);

        this.time.delayedCall(TEMPO_INVENCIVEL, () => {
            jogador.setPosition(X_INICIO, TOPO_CHAO - 100);
            jogador.body.setVelocity(0, 0);
            this.invencivel = false;
            jogador.anims.play('heroi-parado', true);
        });
    }

    update() {
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

        if (this.invencivel) {
            // pose de dano
        } else if (!estaNoChao) {
            this.jogador.anims.play('heroi-pulando', true);
        } else if (apertouEsquerda || apertouDireita) {
            this.jogador.anims.play('heroi-correndo', true);
        } else {
            this.jogador.anims.play('heroi-parado', true);
        }

        this.inimigos.forEach((gosma) => {
            if (!gosma.active || gosma.derrotada) return;
            if (gosma.body.blocked.left) {
                gosma.body.setVelocityX(Phaser.Math.Between(VEL_GOSMA_MIN, VEL_GOSMA_MAX));
                gosma.setFlipX(false);
            } else if (gosma.body.blocked.right) {
                gosma.body.setVelocityX(-Phaser.Math.Between(VEL_GOSMA_MIN, VEL_GOSMA_MAX));
                gosma.setFlipX(true);
            }
        });

        this.nuvens.tilePositionX += VEL_NUVENS;
        this.montanhasClaras.tilePositionX += VEL_MONTANHAS_CLARAS;
        this.montanhas.tilePositionX += VEL_MONTANHAS;
    }
}

/* ---------------------------------------------------------------------
   🎯 TAREFAS DESTA AULA
   ---------------------------------------------------------------------
   1) Deixe o pulo mais alto (FORCA_PULO = -780) e veja se dá para
      chegar na estrela SEM usar as plataformas do meio. Equilibrar o
      nível é trabalho de game designer! 😉

   2) Crie uma plataforma nova: this.criarPlataforma(200, 300, 192);
      Onde ela aparece? Dá para subir nela?

   3) Coloque uma moeda EM CIMA da estrela e veja qual dos dois o herói
      pega primeiro. Você consegue explicar por quê?

   4) Troque a estrela por um item diferente (use 'moeda') e mude o
      texto de vitória. Personalize o seu jogo!

   5) DESAFIO - plataforma que "pisca": adicione um tween na plataforma
      criada (no método criarPlataforma) com alpha indo de 1 a 0.5.
      (Cuidado: o DESENHO pisca, mas o CORPO FÍSICO continua lá! Isso
      pode confundir o jogador - é um bom assunto de UI/UX.)

   💡 PENSE: por que o telhado de cada plataforma é o valor topoY, e não
   o centro? Como você explicaria isso para alguém que nunca programou?
--------------------------------------------------------------------- */
