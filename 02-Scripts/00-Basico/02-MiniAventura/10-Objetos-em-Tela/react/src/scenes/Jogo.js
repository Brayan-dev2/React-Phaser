// >>> VERSÃO REACT + VITE desta aula. <<<
// É o mesmo código de src/scenes/Jogo.js da versão sem instalação, com duas
// diferenças pequenas (é assim que se usa Phaser dentro de um projeto React):
//   1) importar o Phaser como módulo (no lugar do <script> global)
//   2) 'export' na frente da classe, para o React poder importá-la.
// A cena é ligada ao React em src/PhaserGame.jsx.
import * as Phaser from 'phaser'

/* =====================================================================
   🎮 AULA 10 - OBJETOS EM TELA (MOEDAS E COLETÁVEIS)
   ---------------------------------------------------------------------
   OBJETIVO: espalhar moedas pelo cenário, fazer elas flutuarem, girarem
   e serem coletadas - somando pontos para o herói!

   O QUE MUDOU NESTA AULA (em relação à Aula 09):
   - ⭐ Carregamos o spritesheet da moeda (4 quadros: ela gira!).
   - ⭐ Criamos o método criarMoeda(x, y) e a lista this.moedas.
   - ⭐ Usamos um TWEEN para fazer a moeda flutuar para cima e para baixo.
   - ⭐ Overlap com a lista inteira de moedas = coletar qualquer uma.
   - ⭐ Um "Textinho" na tela para mostrar os pontos (um HUD-mini!).

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
const QUADRO_MOEDA = 64;        // ⭐ as moedas têm quadros de 64x64

const VEL_ANDAR = 260;
const FORCA_PULO = -650;
const FORCA_QUIQUE = -420;
const VEL_GOSMA_MIN = 60;
const VEL_GOSMA_MAX = 130;

const X_INICIO = 300;
const TEMPO_INVENCIVEL = 1000;

const PONTOS_MOEDA = 100;       // ⭐ quanto vale cada moeda

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
        this.load.spritesheet('gosma-derrotada', 'assets/gosma-derrotada.png', {
            frameWidth: QUADRO_GOSMA_L, frameHeight: QUADRO_GOSMA_A,
        });
        // ⭐ NOVO: as moedas (4 quadros de 64x64 = a moeda girando)
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

        // ⭐ Pontos do jogador e o texto que mostra os pontos na tela.
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
        // ⭐ NOVO: a moeda girando (4 quadros, rápido!)
        this.anims.create({
            key: 'moeda-girando',
            frames: this.anims.generateFrameNumbers('moeda', { start: 0, end: 3 }),
            frameRate: 10, repeat: -1,
        });

        // ---- INIMIGOS ----------------------------------------------
        this.inimigos = [];
        this.criarInimigo(760);
        this.criarInimigo(960);
        this.criarInimigo(1150);

        // ---- ⭐ MOEDAS ---------------------------------------------
        // Uma lista (array) igual à dos inimigos.
        this.moedas = [];

        // Moedas no chão...
        this.criarMoeda(480, TOPO_CHAO - 50);
        this.criarMoeda(560, TOPO_CHAO - 50);
        // ...e moedas no ar (pegue pulando!):
        this.criarMoeda(660, 400);
        this.criarMoeda(820, 360);
        this.criarMoeda(1000, 400);
        this.criarMoeda(1160, 340);

        // ---- OVERLAPS ----------------------------------------------
        this.physics.add.overlap(this.jogador, this.inimigos, this.aoTocarInimigo, null, this);
        // ⭐ Passamos a LISTA inteira de moedas: o overlap avisa quando
        //    o herói tocar QUALQUER uma delas!
        this.physics.add.overlap(this.jogador, this.moedas, this.coletarMoeda, null, this);

        // ---- TECLADO ------------------------------------------------
        this.cursors = this.input.keyboard.createCursorKeys();
        this.teclas = this.input.keyboard.addKeys({
            esq: Phaser.Input.Keyboard.KeyCodes.A,
            dir: Phaser.Input.Keyboard.KeyCodes.D,
        });

        // ---- TEXTOS --------------------------------------------------
        this.add.text(40, 92, 'AULA 10 - OBJETOS EM TELA', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '40px',
            color: '#ffffff', stroke: '#1e2233', strokeThickness: 8,
        });
        this.add.text(40, 148, 'Colete as moedas: no chão e no ar. Cada uma vale ' + PONTOS_MOEDA + ' pontos!', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '24px',
            color: '#123', stroke: '#eaf6ff', strokeThickness: 6,
        });

        console.log('Aula 10 pronta: ' + this.moedas.length + ' moedas espalhadas!');
    }

    /* ---------------------------------------------------------------
       ⭐ MÉTODO criarMoeda(x, y)
       --------------------------------------------------------------- */
    criarMoeda(x, y) {
        const moeda = this.add.sprite(x, y, 'moeda');
        moeda.play('moeda-girando');

        // ⭐ Damos um corpo físico para poder usar o overlap...
        this.physics.add.existing(moeda);

        // ⭐ MAS queremos que ela fique FLUTUANDO no ar (sem cair!).
        moeda.body.setAllowGravity(false);   // não sofre gravidade
        moeda.body.setImmovable(true);       // nada pode empurrar a moeda

        /* 💡 SEGREDO IMPORTANTE (anote!):
           Se usássemos um corpo "estático" (true), a caixa de colisão
           NÃO acompanharia a moeda quando ela se movesse no tween.
           Por isso usamos um corpo DINÂMICO - mas sem gravidade.
           Assim a caixa de colisão segue a moeda para onde ela for. */

        // ⭐ TWEEN: faz a moeda flutuar de leve para cima e para baixo.
        //    yoyo: true = vai e volta; repeat: -1 = para sempre.
        this.tweens.add({
            targets: moeda,
            y: y - 14,            // vai 14 pixels para cima...
            duration: 700,
            ease: 'Sine.inOut',   // suave, começa e termina devagar
            yoyo: true,           // ...e volta para a posição original
            repeat: -1,
        });

        this.moedas.push(moeda);
        return moeda;
    }

    /* ---------------------------------------------------------------
       ⭐ MÉTODO coletarMoeda() - chamado pelo overlap
       --------------------------------------------------------------- */
    coletarMoeda(jogador, moeda) {

        // Se a moeda já foi coletada, ignora (para não contar duas vezes).
        if (!moeda.active) return;

        // ⭐ Desliga o corpo da moeda para ela não ser coletada de novo
        moeda.body.enable = false;

        // ⭐ Uma animação de coleta: cresce e desaparece
        this.tweens.add({
            targets: moeda,
            scale: 1.8,
            alpha: 0,
            duration: 220,
            onComplete: () => moeda.destroy(),   // depois, apaga de vez
        });

        // ⭐ Texto "+100" que sobe e some (isso se chama "juice"! 🍋)
        const textoBonus = this.add.text(moeda.x, moeda.y - 30, '+' + PONTOS_MOEDA, {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '30px',
            color: '#ffe066', stroke: '#3a2a00', strokeThickness: 6,
        }).setOrigin(0.5);

        this.tweens.add({
            targets: textoBonus,
            y: textoBonus.y - 60,
            alpha: 0,
            duration: 600,
            onComplete: () => textoBonus.destroy(),
        });

        // ⭐ Soma os pontos e ATUALIZA o texto na tela (setText)
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
   1) Coloque uma moeda que ninguém consegue pegar (x: 1240, y: 80) e
      observe. É bom ou ruim ter itens impossíveis num jogo? Converse
      com a turma sobre "level design".

   2) Mude PONTOS_MOEDA para 1000. O jogo ficou mais empolgante?

   3) Deixe a flutuação mais rápida: troque duration: 700 por 250.

   4) Faça a moeda NÃO flutuar: apague o bloco this.tweens.add({...}).
      Depois desfaça (Ctrl+Z).

   5) Crie um item especial: chame this.criarMoeda(300, 300) e dê o
      dobro de pontos. (Dica: você pode passar mais valores para o
      método, tipo criarMoeda(x, y, valor). Tente!)

   💡 PENSE: por que a moeda usa corpo DINÂMICO sem gravidade, e não
   um corpo ESTÁTICO como o chão? (Dica: releia o SEGREDO IMPORTANTE
   lá em cima. É uma das pegadinhas mais comuns do Phaser!)
--------------------------------------------------------------------- */
