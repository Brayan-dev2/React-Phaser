// >>> VERSÃO REACT + VITE desta aula. <<<
// É o mesmo código de src/scenes/Jogo.js da versão sem instalação, com duas
// diferenças pequenas (é assim que se usa Phaser dentro de um projeto React):
//   1) importar o Phaser como módulo (no lugar do <script> global)
//   2) 'export' na frente da classe, para o React poder importá-la.
// A cena é ligada ao React em src/PhaserGame.jsx.
import * as Phaser from 'phaser'

/* =====================================================================
   🎮 AULA 12 - HUD / UI-UX
   ---------------------------------------------------------------------
   OBJETIVO: transformar o protótipo num JOGO DE VERDADE! Agora temos:
     - HUD com corações (vidas), pontos e objetivo;
     - Perder vida ao levar dano (3 vidas);
     - TELA DE GAME OVER com opção de jogar de novo.

   HUD = "Heads-Up Display": as informações que ficam na tela (vidas,
   pontos, tempo...). É a "interface" do jogo.

   UI = User Interface (a cara das informações).
   UX = User Experience (como é JOGAR: é fácil de entender? É justo?)

   O QUE MUDOU NESTA AULA (em relação à Aula 11):
   - ⭐ Carregamos o coração e montamos um HUD de verdade.
   - ⭐ Sistema de VIDAS: cada dano tira 1 coração.
   - ⭐ Tela de GAME OVER com reinício (this.scene.restart()).
   - ⭐ Dicas de UI/UX comentadas no código (leia com atenção!).

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
const QUADRO_CORACAO = 64;

const VEL_ANDAR = 260;
const FORCA_PULO = -650;
const FORCA_QUIQUE = -420;
const VEL_GOSMA_MIN = 60;
const VEL_GOSMA_MAX = 130;

const X_INICIO = 300;
const TEMPO_INVENCIVEL = 1000;

const PONTOS_MOEDA = 100;
const PONTOS_ESTRELA = 500;

const VIDAS_INICIAIS = 3;      // ⭐ quantos corações o herói tem

/* Cores do HUD, guardadas em constantes.
   💡 UI/UX: ter as cores em um lugar só deixa o visual CONSISTENTE
   (e fácil de mudar depois: mexa aqui e o HUD inteiro muda). */
const COR_TEXTO = '#ffffff';
const COR_CONTORNO = '#1e2233';
const COR_DESTAQUE = '#ffe066';

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
        this.load.image('plataforma', 'assets/plataforma.png');
        this.load.image('estrela', 'assets/estrela.png');
        this.load.image('coracao', 'assets/coracao.png');

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

        /* ⚠️ ATENÇÃO: como agora o jogo pode REINICIAR (this.scene.restart),
           o create() roda de novo - e as animações são globais do Phaser!
           Por isso só criamos uma animação se ela ainda não existir.
           (Sem esse "if", o console encheria de avisos de animação duplicada.) */
        this.criarAnimacoes();

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

        // ---- ⭐ ESTADO DO JOGO (as "anotações" da partida) ---------
        this.invencivel = false;
        this.inimigosDerrotados = 0;
        this.pontos = 0;
        this.vidas = VIDAS_INICIAIS;
        this.acabou = false;              // ⭐ true quando vidas = 0
        this.estrelaPega = false;         // ⭐ já pegou a estrela?

        // ---- PLATAFORMAS -------------------------------------------
        this.criarPlataforma(430, 450, 224);
        this.criarPlataforma(700, 360, 224);
        this.criarPlataforma(960, 270, 192);
        this.criarPlataforma(1180, 420, 192);

        // ---- INIMIGOS ----------------------------------------------
        this.inimigos = [];
        this.criarInimigo(760);
        this.criarInimigo(1000);
        this.criarInimigo(1180);

        // ---- MOEDAS ------------------------------------------------
        this.moedas = [];
        this.criarMoeda(430, 390);
        this.criarMoeda(700, 300);
        this.criarMoeda(960, 210);
        this.criarMoeda(560, TOPO_CHAO - 50);
        this.criarMoeda(880, TOPO_CHAO - 50);

        // ---- ESTRELA -----------------------------------------------
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
        // ⭐ Uma tecla especial: R reinicia o jogo (quando acabar).
        this.input.keyboard.on('keydown-R', () => {
            if (this.acabou) this.scene.restart();
        });

        // ---- ⭐⭐ O HUD! -------------------------------------------
        this.criarHUD();

        console.log('Aula 12 pronta: HUD montado, ' + this.vidas + ' vidas!');
    }

    /* ---------------------------------------------------------------
       criarAnimacoes() - com proteção contra duplicatas ⭐
       --------------------------------------------------------------- */
    criarAnimacoes() {
        const criar = (key, textura, inicio, fim, frameRate, repeat) => {
            // this.anims.exists(key) = "esta animação já foi criada?"
            if (this.anims.exists(key)) return;
            this.anims.create({
                key: key,
                frames: this.anims.generateFrameNumbers(textura, { start: inicio, end: fim }),
                frameRate: frameRate,
                repeat: repeat,
            });
        };

        criar('heroi-parado', 'heroi-parado', 0, 1, 3, -1);
        criar('heroi-correndo', 'heroi-correndo', 0, 3, 10, -1);
        criar('heroi-pulando', 'heroi-pulando', 0, 0, 1, -1);
        criar('heroi-dano', 'heroi-dano', 0, 0, 1, 0);
        criar('gosma-andando', 'gosma-andando', 0, 3, 6, -1);
        criar('gosma-derrotada', 'gosma-derrotada', 0, 1, 8, 0);
        criar('moeda-girando', 'moeda', 0, 3, 10, -1);
    }

    /* ---------------------------------------------------------------
       ⭐⭐ criarHUD() - a interface do jogo
       ---------------------------------------------------------------
       DICAS DE UI/UX que aplicamos aqui:
         1) INFORMAÇÃO IMPORTANTE NOS CANTOS: vidas à esquerda, pontos
            à direita. O meio da tela fica livre para o JOGO.
         2) CONTRASTE: todo texto tem contorno escuro (stroke), então
            fica legível sobre o céu azul ou sobre a terra.
         3) TAMANHO: textos do HUD são maiores que detalhes, mas nunca
            maiores que o personagem (o jogo é o protagonista!).
         4) FEEDBACK IMEDIATO: quando você perde vida, o coração SOME
            na hora - o jogador entende sem precisar ler nada.
       --------------------------------------------------------------- */
    criarHUD() {

        // Os corações: criamos um para cada vida, enfileirados.
        this.coracoes = [];
        for (let i = 0; i < VIDAS_INICIAIS; i++) {
            const coracao = this.add.image(60 + i * 70, 62, 'coracao');
            coracao.setScale(0.8);            // tamanho cômodo para o HUD
            this.coracoes.push(coracao);
        }

        // O placar de pontos, no canto DIREITO.
        this.textoPontos = this.add.text(LARGURA_TELA - 40, 40, 'PONTOS: 0', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '34px',
            color: COR_DESTAQUE, stroke: COR_CONTORNO, strokeThickness: 6,
        }).setOrigin(1, 0);                   // ⭐ origin (1, 0) = "cresça para a esquerda"
        // (assim o texto fica alinhado à direita mesmo quando o número cresce!)

        // O objetivo do jogador, no topo. Frase curta e clara!
        this.textoObjetivo = this.add.text(CENTRO_X, 30, 'Colete tudo e pegue a estrela!', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '26px',
            color: COR_TEXTO, stroke: COR_CONTORNO, strokeThickness: 6,
        }).setOrigin(0.5, 0);

        // ⭐ PROFUNDIDADE: garantimos que o HUD fica SEMPRE na frente.
        //    setDepth(1000) = camada bem alta. Nada do jogo tapa o HUD.
        [this.textoObjetivo, this.textoPontos, ...this.coracoes].forEach((obj) => {
            obj.setDepth(1000);
        });

        // A faixa escura atrás do HUD ajuda MUITO na leitura.
        // 💡 UI/UX: um retângulo semitransparente atrás de textos garante
        //    contraste sem esconder o cenário.
        const faixa = this.add.rectangle(CENTRO_X, 52, LARGURA_TELA, 104, 0x000000, 0.22)
            .setDepth(999);
        faixa.setOrigin(0.5, 0.5);
    }

    /* ---------------------------------------------------------------
       ⭐ MÉTODO atualizarCoracoes() - mostra as vidas certas na tela
       --------------------------------------------------------------- */
    atualizarCoracoes() {
        // Para cada coração da lista: se ainda tem vida, mostra; senão, esconde.
        this.coracoes.forEach((coracao, indice) => {
            coracao.setVisible(indice < this.vidas);
        });
    }

    /* ---------------------------------------------------------------
       ⭐ MÉTODO gameOver() - a tela de fim de jogo
       --------------------------------------------------------------- */
    gameOver() {
        this.acabou = true;                    // trava o controle do herói

        // Para o herói no lugar (nada de sair andando morto por aí 😄)
        this.jogador.body.setVelocity(0, 0);
        this.jogador.anims.play('heroi-dano', true);

        // ---- Painel escuro cobrindo a tela ----
        // 💡 UI/UX: escurecer o fundo "pausa" visualmente o jogo e diz
        //    ao jogador: "agora olhe para MIM".
        const painel = this.add.rectangle(CENTRO_X, ALTURA_TELA / 2, LARGURA_TELA, ALTURA_TELA,
                                          0x0b1020, 0.72).setDepth(2000);

        // ---- A mensagem ----
        this.add.text(CENTRO_X, 240, 'GAME OVER', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '86px',
            color: '#ff6b6b', stroke: '#2a0000', strokeThickness: 14,
        }).setOrigin(0.5).setDepth(2001);

        this.add.text(CENTRO_X, 350, 'Você fez ' + this.pontos + ' pontos', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '40px',
            color: COR_TEXTO, stroke: COR_CONTORNO, strokeThickness: 8,
        }).setOrigin(0.5).setDepth(2001);

        this.add.text(CENTRO_X, 430, 'Gosmas derrotadas: ' + this.inimigosDerrotados, {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '28px',
            color: '#c9d4ff', stroke: COR_CONTORNO, strokeThickness: 6,
        }).setOrigin(0.5).setDepth(2001);

        // ---- O convite para jogar de novo (com "respiração" no texto) ----
        const reiniciar = this.add.text(CENTRO_X, 540, 'Aperte R para jogar de novo', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '32px',
            color: COR_DESTAQUE, stroke: COR_CONTORNO, strokeThickness: 8,
        }).setOrigin(0.5).setDepth(2001);

        // 💡 UI/UX: um texto que "pulsa" chama mais atenção que um parado.
        this.tweens.add({
            targets: reiniciar,
            scale: 1.08,
            duration: 600,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1,
        });

        console.log('GAME OVER! Pontos: ' + this.pontos);
    }

    // =================================================================
    //  A PARTIR DAQUI: os métodos que já conhecemos das aulas anteriores
    //  (com UMA novidade: os danos agora gastam VIDAS!)
    // =================================================================

    criarPlataforma(centroX, topoY, largura) {
        const altura = 64;
        this.add.tileSprite(centroX, topoY + altura / 2, largura, altura, 'plataforma');
        const corpo = this.add.rectangle(centroX, topoY + altura / 2, largura, altura, 0x000000, 0);
        this.physics.add.existing(corpo, true);
        this.physics.add.collider(this.jogador, corpo);
        return corpo;
    }

    criarEstrela(x, y) {
        const estrela = this.add.image(x, y, 'estrela');
        this.tweens.add({
            targets: estrela, angle: 12, duration: 900,
            ease: 'Sine.inOut', yoyo: true, repeat: -1,
        });
        this.tweens.add({
            targets: estrela, y: y - 10, duration: 800,
            ease: 'Sine.inOut', yoyo: true, repeat: -1,
        });
        this.physics.add.existing(estrela);
        estrela.body.setAllowGravity(false);
        estrela.body.setImmovable(true);
        this.estrela = estrela;
        this.physics.add.overlap(this.jogador, this.estrela, this.pegarEstrela, null, this);
    }

    pegarEstrela(jogador, estrela) {
        if (!estrela.active || this.acabou) return;
        estrela.body.enable = false;
        this.estrelaPega = true;

        this.pontos += PONTOS_ESTRELA;
        this.textoPontos.setText('PONTOS: ' + this.pontos);

        this.cameras.main.flash(400, 255, 220, 90);
        this.cameras.main.shake(200, 0.004);

        // ⭐ Mensagem de vitória no HUD (em vez de um texto solto)
        this.textoObjetivo.setText('Você pegou a estrela! Agora derrote as gosmas!');
        this.textoObjetivo.setColor(COR_DESTAQUE);

        this.tweens.add({
            targets: estrela, y: estrela.y - 200, angle: 360, alpha: 0,
            duration: 700, onComplete: () => estrela.destroy(),
        });

        console.log('ESTRELA! Pontos: ' + this.pontos);
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
            color: COR_DESTAQUE, stroke: '#3a2a00', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(1000);
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
        if (inimigo.derrotada || this.acabou) return;
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
        // ⭐ Bônus: gosma derrotada também dá pontos (recompensa dupla!)
        this.pontos += 50;
        this.textoPontos.setText('PONTOS: ' + this.pontos);
        inimigo.once('animationcomplete', () => inimigo.destroy());
    }

    /* ---------------------------------------------------------------
       levarDano() - ⭐ agora gasta uma VIDA!
       --------------------------------------------------------------- */
    levarDano(jogador, inimigo) {
        if (this.invencivel || this.acabou) return;
        this.invencivel = true;

        // ⭐ Tira uma vida e atualiza os corações do HUD NA HORA.
        this.vidas--;
        this.atualizarCoracoes();

        this.cameras.main.shake(180, 0.008);
        this.jogador.setTint(0xff6b6b);
        this.time.delayedCall(300, () => this.jogador.clearTint());

        const direcao = jogador.x < inimigo.x ? -1 : 1;
        jogador.body.setVelocityX(220 * direcao);
        jogador.body.setVelocityY(-380);
        jogador.anims.play('heroi-dano', true);

        // ⭐ Sem vidas? Fim de jogo!
        if (this.vidas <= 0) {
            this.time.delayedCall(600, () => this.gameOver());
            return;
        }

        this.time.delayedCall(TEMPO_INVENCIVEL, () => {
            jogador.setPosition(X_INICIO, TOPO_CHAO - 100);
            jogador.body.setVelocity(0, 0);
            this.invencivel = false;
            jogador.anims.play('heroi-parado', true);
        });
    }

    update() {

        // ⭐ Se o jogo acabou, ninguém se mexe (nem o cenário!).
        if (this.acabou) return;

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

/* =====================================================================
   🏆 PARABÉNS! Você terminou a trilha "Meu Primeiro Jogo"!
   =====================================================================
   Você criou, do zero, um jogo de plataforma com:
     cenário em camadas com parallax, personagem animado, inimigos que
     patrulham, colisões, pisão, coleta de itens, plataformas e HUD.

   🎯 TAREFAS FINAIS (agora você é o(a) game designer!)
   ---------------------------------------------------------------------
   1) Deixe o jogo mais fácil: VIDAS_INICIAIS = 5 e TEMPO_INVENCIVEL = 1500.

   2) Mostre também o "recorde": crie this.recorde salvo em
      localStorage para o jogador tentar se superar! (Pesquise
      localStorage no MDN; é uma linha para salvar e uma para ler.)

   3) Adicione uma condição de VITÓRIA: se o jogador pegar a estrela E
      derrotar todas as gosmas, mostre "VOCÊ VENCEU!" em vez de GAME OVER.
      (Dica: crie um método vitoria() parecido com gameOver().)

   4) Coloque um cronômetro no HUD (um texto que aumenta a cada segundo):
         this.time.addEvent({ delay: 1000, loop: true, callback: ... });
      💡 UI/UX: mostre o tempo no canto esquerdo, junto dos corações.

   5) Melhore o game over: em vez de "Aperte R", coloque um BOTÃO
      desenhado (um retângulo com texto) que reinicia quando clicado:
         botao.setInteractive();
         botao.on('pointerdown', () => this.scene.restart());
      (Isso se chama "botão de UI" - você acabou de aprender o básico!)

   📚 PARA ONDE IR AGORA (no repositório React-Phaser):
     - 02-Scripts/03-Cenarios: mais cenários e parallax avançado
     - 02-Scripts/04-Fisica: gravidade, atrito, molas
     - 02-Scripts/05-HUD: HUDs de aventura, RPG, corrida...
     - 06-VFX: partículas e efeitos visuais
     - 07-Sounds: músicas e efeitos sonoros
     - 03-Jogos e 04-Sprites: jogos completos para estudar!

   Você é uma pessoa que programa jogos. Sinta-se orgulhoso(a)! 🐣➡️🐉
   ===================================================================== */
