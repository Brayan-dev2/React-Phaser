/* =====================================================================
   🎮 AULA 04 - PERSONAGEM
   ---------------------------------------------------------------------
   OBJETIVO: colocar o herói (Milo) em cima do chão e dar VIDA a ele
   com uma animação de "respirando".

   O QUE MUDOU NESTA AULA (em relação à Aula 03):
   - ⭐ Conhecemos o SPRITESHEET: uma imagem que contém VÁRIOS quadros.
   - ⭐ Criamos uma ANIMAÇÃO (quadros trocando sozinhos, feito desenho
     animado) e mandamos o herói executá-la com .play().
   - ⭐ Aprendemos o setOrigin(0.5, 1) - o truque para "esticar os pés"
     do personagem exatamente em cima da linha do chão.

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

/* Tamanho de UM quadro do herói dentro do spritesheet. ⭐
   A nossa arte tem quadros de 64 x 64 pixels. */
const QUADRO_LARGURA = 128;  // ⭐
const QUADRO_ALTURA = 128;   // ⭐

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

        // ⭐ NOVO: spritesheet!
        // load.spritesheet('apelido', 'arquivo.png', { frameWidth, frameHeight })
        //   Spritesheet = uma imagem larga com vários quadros lado a lado.
        //   O Phaser "corta" a imagem em quadradinhos de 128x128 automaticamente.
        //   Nós damos um nome para cada quadrado: quadro 0, quadro 1, ...
        this.load.spritesheet('heroi-parado', 'assets/heroi-parado.png', {
            frameWidth: QUADRO_LARGURA,
            frameHeight: QUADRO_ALTURA,
        });
    }

    /* ---------------------------------------------------------------
       2) CREATE
       --------------------------------------------------------------- */
    create() {

        // ---- O CENÁRIO (camadas da aula passada) -------------------
        this.add.image(0, 0, 'ceu').setOrigin(0, 0);
        this.montanhasClaras = this.add.tileSprite(CENTRO_X, 560, LARGURA_TELA, 240, 'montanhas-claras');
        this.montanhas = this.add.tileSprite(CENTRO_X, 520, LARGURA_TELA, 320, 'montanhas');
        this.nuvens = this.add.tileSprite(CENTRO_X, 150, LARGURA_TELA, 300, 'nuvens');
        this.chao = this.add.tileSprite(CENTRO_X, TOPO_CHAO + ALTURA_CHAO / 2,
                                        LARGURA_TELA, ALTURA_CHAO, 'chao');

        // ---- O HERÓI -----------------------------------------------
        // ⭐ add.sprite() é parecido com add.image(), mas aceita quadros
        //    e animações (é o tipo ideal para personagens).
        //
        // Posição: x = 280 (mais para a esquerda) e y = TOPO_CHAO (592),
        // que é a linha do chão.
        this.jogador = this.add.sprite(280, TOPO_CHAO, 'heroi-parado');

        // ⭐ O TRUQUE DOS PÉS NO CHÃO:
        //    setOrigin(0.5, 1) diz: "use o MEIO da largura e a BASE do
        //    desenho como ponto de encaixe". Assim, quando colocamos o
        //    herói em y=592, os PÉS ficam em y=592 - em cima da linha do chão.
        //    (Se usássemos o padrão (0.5, 0.5), o herói ficaria enterrado
        //     até a cintura no chão!)
        this.jogador.setOrigin(0.5, 1);

        // ---- ANIMAÇÕES --------------------------------------------
        // ⭐ this.anims.create() monta uma animação. É como editar um GIF:
        //    key:       o nome da animação (você escolhe)
        //    frames:    quais quadros usar e em que ordem (0 e 1, aqui)
        //    frameRate: quantos quadros por segundo (3 = bem devagar)
        //    repeat: -1 = repete para SEMPRE (nunca acaba, loop infinito)
        this.anims.create({
            key: 'heroi-parado',
            frames: this.anims.generateFrameNumbers('heroi-parado', { start: 0, end: 1 }),
            frameRate: 3,
            repeat: -1,
        });

        // ⭐ E agora mandamos o herói EXECUTAR (play) a animação:
        this.jogador.play('heroi-parado');

        // ---- TEXTOS de apoio ---------------------------------------
        this.add.text(40, 28, 'AULA 04 - PERSONAGEM', {
            fontFamily: 'Trebuchet MS, Arial',
            fontSize: '40px',
            color: '#ffffff',
            stroke: '#1e2233',
            strokeThickness: 8,
        });

        this.add.text(40, 84, 'Sprites têm quadros! A animação troca os quadros sozinha.', {
            fontFamily: 'Trebuchet MS, Arial',
            fontSize: '24px',
            color: '#123',
            stroke: '#eaf6ff',
            strokeThickness: 6,
        });

        console.log('Aula 04 pronta: o Milo apareceu e está respirando!');
    }

    /* ---------------------------------------------------------------
       3) UPDATE (o cenário continua se movendo)
       --------------------------------------------------------------- */
    update() {
        this.nuvens.tilePositionX += VEL_NUVENS;
        this.montanhasClaras.tilePositionX += VEL_MONTANHAS_CLARAS;
        this.montanhas.tilePositionX += VEL_MONTANHAS;
    }
}

/* ---------------------------------------------------------------------
   🎯 TAREFAS DESTA AULA
   ---------------------------------------------------------------------
   1) Troque frameRate: 3 por frameRate: 30. A respiração fica rápida
      ou devagar? Descubra! Depois volte para 3 (ou escolha seu ritmo).

   2) Troque start: 0, end: 1 por start: 1, end: 1. O que acontece com a
      animação? (Dica: você "recortou" a animação para um único quadro.)

   3) Mova o herói: troque 280 por 640 e depois por 1100. Ele continua
      com os pés no chão? Por que?

   4) Deixe o herói GIGANTE: adicione .setOrigin(0.5, 1) antes de
      .setScale(1.5) na linha do add.sprite. Repare numa coisa incrível:
      os pés CONTINUAM exatamente no chão! Por que isso acontece?
      (Dica: releia a explicação do setOrigin mais acima.)

   5) Crie uma SEGUNDA animação de teste usando os quadros do arquivo
      da aula 06 (ainda não temos ele nesta pasta, então use a sua
      criatividade): duplique o this.anims.create com key: 'outra' e use
      frameRate: 12, repeat: 0. Depois chame this.jogador.play('outra').
      O que o repeat: 0 faz?

   💡 CURIOSIDADE: no arquivo assets/heroi-parado.png existem 2 quadros
   de 128x128 = a imagem tem 256x128 pixels. Abra o arquivo e veja os
   dois desenhos lado a lado!
--------------------------------------------------------------------- */
