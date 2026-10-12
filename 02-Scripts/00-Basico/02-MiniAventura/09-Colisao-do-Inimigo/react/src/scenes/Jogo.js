// >>> VERSÃO REACT + VITE desta aula. <<<
// É o mesmo código de src/scenes/Jogo.js da versão sem instalação, com duas
// diferenças pequenas (é assim que se usa Phaser dentro de um projeto React):
//   1) importar o Phaser como módulo (no lugar do <script> global)
//   2) 'export' na frente da classe, para o React poder importá-la.
// A cena é ligada ao React em src/PhaserGame.jsx.
import * as Phaser from 'phaser'

/* =====================================================================
   🎮 AULA 09 - COLISÃO DO INIMIGO (O PISÃO!)
   ---------------------------------------------------------------------
   OBJETIVO: o clássico dos jogos de plataforma! Se o herói cair EM CIMA
   da gosma, ele derrota o inimigo e dá um pulinho de comemoração.
   Se encostar de lado, ele é que leva dano (como na aula passada).

   O QUE MUDOU NESTA AULA (em relação à Aula 08):
   - ⭐ Carregamos a animação de gosma derrotada (2 quadros).
   - ⭐ Dentro do overlap, olhamos para a DIREÇÃO em que o herói está indo:
       * descendo e acima do inimigo  -> PISÃO (vitória!)
       * caso contrário               -> dano (derrota!)
   - ⭐ Criamos o método derrotarInimigo() e removemos a gosma do jogo
     com destroy() - junto com o seu lugar na lista.

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
const FORCA_QUIQUE = -420;       // ⭐ o pulinho de comemoração após o pisão
const VEL_GOSMA_MIN = 60;
const VEL_GOSMA_MAX = 130;

const X_INICIO = 300;
const TEMPO_INVENCIVEL = 1000;

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
        this.load.spritesheet('heroi-dano', 'assets/heroi-dano.png', {
            frameWidth: QUADRO_HEROI, frameHeight: QUADRO_HEROI,
        });
        this.load.spritesheet('gosma-andando', 'assets/gosma-andando.png', {
            frameWidth: QUADRO_GOSMA_L, frameHeight: QUADRO_GOSMA_A,
        });
        // ⭐ NOVO: a gosma derrotada (2 quadros: a poça que vai sumindo)
        this.load.spritesheet('gosma-derrotada', 'assets/gosma-derrotada.png', {
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
        this.jogador = this.add.sprite(X_INICIO, TOPO_CHAO - 200, 'heroi-parado').setOrigin(0.5, 1);
        this.physics.add.existing(this.jogador);
        this.jogador.body.setCollideWorldBounds(true);
        this.jogador.body.setSize(64, 108);
        this.jogador.body.setOffset(32, 20);
        this.physics.add.collider(this.jogador, this.chaoFisico);

        this.invencivel = false;
        this.inimigosDerrotados = 0;    // ⭐ vamos contar para ver no console!

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
        // ⭐ NOVO: a animação da gosma derrotada. repeat: 0 = toca uma vez.
        this.anims.create({
            key: 'gosma-derrotada',
            frames: this.anims.generateFrameNumbers('gosma-derrotada', { start: 0, end: 1 }),
            frameRate: 8, repeat: 0,
        });

        // ---- INIMIGOS ----------------------------------------------
        this.inimigos = [];
        this.criarInimigo(700);
        this.criarInimigo(860);
        this.criarInimigo(1030);
        this.criarInimigo(1190);

        // ---- ⭐⭐ OVERLAP: agora com o PISÃO ------------------------
        this.physics.add.overlap(this.jogador, this.inimigos, this.aoTocarInimigo, null, this);

        // ---- TECLADO ------------------------------------------------
        this.cursors = this.input.keyboard.createCursorKeys();
        this.teclas = this.input.keyboard.addKeys({
            esq: Phaser.Input.Keyboard.KeyCodes.A,
            dir: Phaser.Input.Keyboard.KeyCodes.D,
        });

        // ---- TEXTOS --------------------------------------------------
        this.add.text(40, 28, 'AULA 09 - COLISÃO DO INIMIGO', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '40px',
            color: '#ffffff', stroke: '#1e2233', strokeThickness: 8,
        });
        this.add.text(40, 84, 'Pule EM CIMA da gosma para derrotá-la. De lado, você leva dano!', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '24px',
            color: '#123', stroke: '#eaf6ff', strokeThickness: 6,
        });

        console.log('Aula 09 pronta: cai pra cima das gosmas!');
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

        gosma.derrotada = false;    // ⭐ cada gosma "sabe" se já foi derrotada

        this.inimigos.push(gosma);
        return gosma;
    }

    /* ---------------------------------------------------------------
       ⭐ MÉTODO aoTocarInimigo() - o juiz da partida ⚖️
       ---------------------------------------------------------------
       É o overlap que chama este método, toda vez que herói e gosma
       se encostam. Nossa missão: decidir se foi PISÃO ou DANO.
       --------------------------------------------------------------- */
    aoTocarInimigo(jogador, inimigo) {

        // Gosma já derrotada? Então não acontece mais nada com ela.
        if (inimigo.derrotada) return;

        // ⭐⭐ A PERGUNTA MAIS IMPORTANTE DO JOGO:
        //    "o herói está CAINDO (velocidade Y positiva) e está com os
        //     PÉS ACIMA do centro da gosma?"
        const estaCaindo = jogador.body.velocity.y > 0;
        const peAbaixoDoTopo = jogador.body.bottom <= inimigo.body.top + 24;

        if (estaCaindo && peAbaixoDoTopo) {
            // ---- PISÃO! O herói ganhou. 🏆 ----
            this.derrotarInimigo(inimigo, jogador);
        } else {
            // ---- TOQUE DE LADO: o herói levou dano. 💥 ----
            this.levarDano(jogador, inimigo);
        }
    }

    /* ---------------------------------------------------------------
       ⭐ MÉTODO derrotarInimigo() - a comemoração do herói
       --------------------------------------------------------------- */
    derrotarInimigo(inimigo, jogador) {

        inimigo.derrotada = true;                  // marca: já era
        inimigo.body.setVelocityX(0);              // a gosma para de andar
        inimigo.body.enable = false;               // ⭐ desliga a colisão dela
        inimigo.anims.play('gosma-derrotada', true);  // a poça que desaparece

        // ⭐ Empurrãozinho de comemoração: o herói quica para cima
        jogador.body.setVelocityY(FORCA_QUIQUE);

        // ⭐ A tela dá uma "piscadinha" branca = sensação de acerto
        this.cameras.main.flash(120, 255, 255, 255);

        this.inimigosDerrotados++;
        console.log('Gosmas derrotadas: ' + this.inimigosDerrotados);

        // ⭐ Depois que a animação termina, a gosma sai do jogo de verdade.
        //    ONCE_ANIM = "quando a animação acabar, faça isso".
        inimigo.once('animationcomplete', () => {
            inimigo.destroy();                     // apaga a gosma da tela
        });
    }

    /* ---------------------------------------------------------------
       levarDano() - o método da aula passada (não mudou nada!)
       --------------------------------------------------------------- */
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
            // pose de dano está tocando: não muda
        } else if (!estaNoChao) {
            this.jogador.anims.play('heroi-pulando', true);
        } else if (apertouEsquerda || apertouDireita) {
            this.jogador.anims.play('heroi-correndo', true);
        } else {
            this.jogador.anims.play('heroi-parado', true);
        }

        // ---- INIMIGOS VIVOS: virar nas bordas ----------------------
        // Repare no if dentro do forEach: só os VIVOS são atualizados. ⭐
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

        // ---- PARALLAX ------------------------------------------------
        this.nuvens.tilePositionX += VEL_NUVENS;
        this.montanhasClaras.tilePositionX += VEL_MONTANHAS_CLARAS;
        this.montanhas.tilePositionX += VEL_MONTANHAS;
    }
}

/* ---------------------------------------------------------------------
   🎯 TAREFAS DESTA AULA
   ---------------------------------------------------------------------
   1) Deixe o pisão mais generoso: troque + 24 por + 50 na linha do
      peAbaixoDoTopo. Ficou mais fácil acertar o pisão? Menos justo?

   2) Deixe o pisão mais difícil: troque por + 0.

   3) Troque o flash branco por um tremor de tela: substitua
      flash(120, 255, 255, 255) por shake(120, 0.01).

   4) Faça a gosma derrotada sumir rapidamente: troque o frameRate 8
      da animação 'gosma-derrotada' por 20.

   5) DESAFIO 1: faça o herói pular mais alto depois de um pisão
      (FORCA_QUIQUE mais negativo, ex.: -600).

   6) DESAFIO 2: dê pontos por gosma derrotada. Crie this.pontos = 0
      e, no derrotarInimigo, faça this.pontos += 100. Mostre no console.
      (No jogo de verdade, isso vai para o HUD da próxima aula!)

   💡 PERGUNTA PARA PENSAR: por que precisamos testar BOTH (as duas
   coisas): "está caindo" E "os pés estão acima"? Se testássemos só
   "está caindo", o que daria errado quando o herói pulasse ao lado
   da gosma?
--------------------------------------------------------------------- */
