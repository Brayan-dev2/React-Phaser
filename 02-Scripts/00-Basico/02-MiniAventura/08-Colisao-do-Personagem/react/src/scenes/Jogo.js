// >>> VERSÃO REACT + VITE desta aula. <<<
// É o mesmo código de src/scenes/Jogo.js da versão sem instalação, com duas
// diferenças pequenas (é assim que se usa Phaser dentro de um projeto React):
//   1) importar o Phaser como módulo (no lugar do <script> global)
//   2) 'export' na frente da classe, para o React poder importá-la.
// A cena é ligada ao React em src/PhaserGame.jsx.
import * as Phaser from 'phaser'

/* =====================================================================
   🎮 AULA 08 - COLISÃO DO PERSONAGEM
   ---------------------------------------------------------------------
   OBJETIVO: o herói agora TOPA nas gosmas! E nós usamos esse "toque"
   para fazer algo acontecer: o Milo fica tonto e volta para o início.

   O QUE MUDOU NESTA AULA (em relação à Aula 07):
   - ⭐ Criamos a animação de DOR (heroi-dano) e conhecemos o playOnce.
   - ⭐ Usamos this.physics.add.overlap() pela primeira vez: "avise-me
     quando estes dois se encostarem" - e nós decidimos o que fazer!
   - ⭐ Criamos o método levarDano() com um pequeno "tempo de invencibilidade".
   - ⭐ Conhecemos this.cameras.main.shake() - a tela tremendo = impacto!

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
const VEL_GOSMA_MIN = 60;
const VEL_GOSMA_MAX = 130;

/* ⭐ Onde o herói renasce quando leva dano, e quanto tempo ele fica
   "invulnerável" (sem poder levar dano de novo). */
const X_INICIO = 300;
const TEMPO_INVENCIVEL = 1000;   // em milissegundos (1 segundo)

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
        // ⭐ NOVO: a pose de DANO (o Milo tonto, com os olhinhos fechados)
        this.load.spritesheet('heroi-dano', 'assets/heroi-dano.png', {
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
        this.jogador = this.add.sprite(X_INICIO, TOPO_CHAO - 200, 'heroi-parado').setOrigin(0.5, 1);
        this.physics.add.existing(this.jogador);
        this.jogador.body.setCollideWorldBounds(true);
        this.jogador.body.setSize(64, 108);
        this.jogador.body.setOffset(32, 20);
        this.physics.add.collider(this.jogador, this.chaoFisico);

        // ⭐ "Estou invencível agora?" - usamos essa variável para não
        //    levar vários danos seguidos (senão seria injusto!).
        this.invencivel = false;

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
        // ⭐ NOVO: a animação de dano tem repeat: 0 = toca UMA vez e para.
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

        // ---- INIMIGOS ----------------------------------------------
        this.inimigos = [];
        this.criarInimigo(700);
        this.criarInimigo(860);
        this.criarInimigo(1030);
        this.criarInimigo(1190);
        // (são 4 gosmas: 4 velocidades diferentes e um caminho bem perigoso!)

        // ---- ⭐⭐ A COLISÃO COM OS INIMIGOS -------------------------
        // ATENÇÃO AO NOME: aqui usamos overlap (e não collider).
        //  - collider  = BARRA a passagem (o herói não atravessa o chão).
        //  - overlap   = não barra nada, só AVISA: "ei, eles se tocaram!"
        //    E quem decide o que acontece é a nossa função.
        //
        // A função levaDano é chamada a cada quadro em que houver toque.
        this.physics.add.overlap(this.jogador, this.inimigos, this.levarDano, null, this);
        //                                                                    ↑
        //              "this" = quem é o "eu" dentro da função levarDano

        // ---- TECLADO ------------------------------------------------
        this.cursors = this.input.keyboard.createCursorKeys();
        this.teclas = this.input.keyboard.addKeys({
            esq: Phaser.Input.Keyboard.KeyCodes.A,
            dir: Phaser.Input.Keyboard.KeyCodes.D,
        });

        // ---- TEXTOS --------------------------------------------------
        this.add.text(40, 28, 'AULA 08 - COLISÃO DO PERSONAGEM', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '40px',
            color: '#ffffff', stroke: '#1e2233', strokeThickness: 8,
        });
        this.add.text(40, 84, 'Encoste numa gosma: o Milo fica tonto e volta ao início!', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '24px',
            color: '#123', stroke: '#eaf6ff', strokeThickness: 6,
        });

        console.log('Aula 08 pronta: cuidado com as gosmas!');
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

        this.inimigos.push(gosma);
        return gosma;
    }

    /* ---------------------------------------------------------------
       ⭐ MÉTODO levarDano()
       ---------------------------------------------------------------
       Chamado automaticamente SEMPRE que o herói toca uma gosma.
       (Repare: não somos nós que chamamos! O overlap chama para nós.)

       Parâmetros: o Phaser nos entrega os dois objetos que se tocaram.
       --------------------------------------------------------------- */
    levarDano(jogador, inimigo) {

        // Se já estou invencível, ignoro este toque.
        // Sem isso, o dano seria aplicado ~60 vezes por segundo!
        if (this.invencivel) return;

        this.invencivel = true;         // liga a invencibilidade

        // ⭐ Tela tremendo!  shake(duração, intensidade)
        this.cameras.main.shake(180, 0.008);

        // ⭐ Pisca o herói (efeito visual de "levei dano")
        this.jogador.setTint(0xff6b6b);      // pinta o herói de vermelho
        this.time.delayedCall(300, () => {
            this.jogador.clearTint();        // volta ao normal depois
        });

        // ⭐ Empurra o herói para o lado oposto ao da gosma e o joga para cima
        const direcao = jogador.x < inimigo.x ? -1 : 1;
        jogador.body.setVelocityX(220 * direcao);
        jogador.body.setVelocityY(-380);

        // ⭐ A pose de dano (toca uma vez: repeat 0)
        jogador.anims.play('heroi-dano', true);

        // ⭐ Depois de um tempinho, o herói volta para o início
        this.time.delayedCall(TEMPO_INVENCIVEL, () => {
            jogador.setPosition(X_INICIO, TOPO_CHAO - 100);
            jogador.body.setVelocity(0, 0);
            this.invencivel = false;         // e fica vulnerável de novo
            jogador.anims.play('heroi-parado', true);
        });
    }

    update() {

        // ---- HERÓI -------------------------------------------------
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

        // ⭐ Enquanto estiver invencível (levando dano), NÃO trocamos a
        //    animação: deixamos a pose de dano aparecer.
        if (this.invencivel) {
            // não faz nada: a animação de dano está tocando
        } else if (!estaNoChao) {
            this.jogador.anims.play('heroi-pulando', true);
        } else if (apertouEsquerda || apertouDireita) {
            this.jogador.anims.play('heroi-correndo', true);
        } else {
            this.jogador.anims.play('heroi-parado', true);
        }

        // ---- INIMIGOS: virar nas bordas ----------------------------
        this.inimigos.forEach((gosma) => {
            if (gosma.body.blocked.left) {
                gosma.body.setVelocityX(Phaser.Math.Between(VEL_GOSMA_MIN, VEL_GOSMA_MAX));
                gosma.setFlipX(false);
            } else if (gosma.body.blocked.right) {
                gosma.body.setVelocityX(-Phaser.Math.Between(VEL_GOSMA_MIN, VEL_GOSMA_MAX));
                gosma.setFlipX(true);
            }
        });

        // ---- PARALLAX -----------------------------------------------
        this.nuvens.tilePositionX += VEL_NUVENS;
        this.montanhasClaras.tilePositionX += VEL_MONTANHAS_CLARAS;
        this.montanhas.tilePositionX += VEL_MONTANHAS;
    }
}

/* ---------------------------------------------------------------------
   🎯 TAREFAS DESTA AULA
   ---------------------------------------------------------------------
   1) Deixe o dano MAIS FORTE: troque o empurrão 220 por 400 e o -380
      por -700. O que muda no jogo?

   2) Tire o "tempo de invencibilidade": comente a linha
      this.invencivel = true; (use // na frente). Jogue e sinta o
      problema! Depois descomente.

   3) Mude o tremor da câmera: shake(180, 0.008) -> shake(500, 0.02).
      Muito exagerado? Encontre um valor que você gosta.

   4) Troque a cor do pisca: setTint(0xff6b6b) -> setTint(0x0000ff)
      (azul) e 0x00ff00 (verde).

   5) DESAFIO: em vez de voltar para o início, faça o herói perder uma
      vida (você vai precisar de uma variável this.vidas = 3 e de um
      texto no HUD... ah, mas HUD é a última aula da trilha! Faça assim
      mesmo com um console.log, ou espere até lá 😉).

   💡 IMPORTANTE: entenda a diferença entre collider e overlap. Escreva
   com suas palavras: quando eu usaria cada um?
--------------------------------------------------------------------- */
