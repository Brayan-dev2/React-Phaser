/* =====================================================================
   QUINTO JOGO — ARENA RELÂMPAGO
   ---------------------------------------------------------------------
   ARQUIVO 2 DE 3 — DESENHOS GERADOS POR CÓDIGO (pixel art sem PNG!)
   =====================================================================
   Aqui NÃO existe nenhum arquivo de imagem. Cada lutador é desenhado
   quadro a quadro com linhas, círculos e retângulos usando o objeto
   Phaser.Graphics. Depois o jogo "fotografa" esse desenho e o transforma
   em uma spritesheet de verdade (a função generateTexture).

   Por que fazer assim num curso para crianças?
     • Zero download de assets: o projeto funciona offline em qualquer PC.
     • Cada personagem cabe em 10 linhas de cores (a "paleta" em dados.js).
     • É mais fácil entender "desenhe um círculo na cabeça" do que abrir um
       editor de sprites.
     • Quando o aluno quiser usar PNG de verdade, é só trocar a textura:
       o resto do código continua funcionando (veja ATIVIDADES-DO-ALUNO.md).

   ÍNDICE
     ETAPA 9.1 — Medidas do corpo (a "planta baixa" do lutador)
     ETAPA 9.2 — Peças prontas (pernas, braços, tronco, cabeça, efeito)
     ETAPA 9.3 — As 14 poses de cada lutador
     ETAPA 9.4 — Montagem da spritesheet (1 frame por linha)
     ETAPA 9.5 — Texturas dos golpes (projéteis, faíscas, poeira, escudo)
   ===================================================================== */

const DESINHOS = (function () {
    'use strict';

    /* -----------------------------------------------------------------
       ETAPA 9.1 — MEDIDAS DO DESENHO
       Todo frame tem 96x176 px. O quadril do lutador fica exatamente no
       CENTRO do frame (x=48), porque é em volta dele que o corpo gira.
       Os pés tocam y=170 (a caixa de colisão tem 100 px de altura).
       ----------------------------------------------------------------- */
    /* O desenho das poses é feito numa "planta" de 96 x 176 unidades (DESENHO_L/A).
       O QUADRO do sprite agora tem 128 px de largura (QUADRO_L): cada unidade do
       desenho vira UNIDADE pixels da textura. Assim o lutador ganha detalhe sem
       mudar nenhuma coordenada das poses. */
    const DESENHO_L = 96;
    const DESENHO_A = 176;
    const QUADRO_L = 128;            // largura do quadro em pixels LÓGICOS
    const QUADRO_A = DESENHO_A * QUADRO_L / DESENHO_L;   // 234,67 (mesma proporção)
    const ESCALA = 3;                // pixels da textura por pixel lógico (alta resolução)
    const FRAME_TEX_L = QUADRO_L * ESCALA;               // 384 px na textura
    const FRAME_TEX_A = Math.round(QUADRO_A * ESCALA);   // 704 px na textura
    const UNIDADE = FRAME_TEX_L / DESENHO_L;             // 4 px de textura por unidade do desenho
    const CENTRO_X = 48;
    const PE_Y = 170;
    const QUADRIL_Y = 112;
    const TORSO_TOPO_Y = 68;
    const CABECA_Y = 50;
    const CABECA_R = 19;

    const POSES = [
        'parado-a', 'parado-b',       // 0,1  respiração (idle)
        'andando-a', 'andando-b', 'andando-c', // 2,3,4 caminhada
        'agachado',                    // 5
        'pulando',                     // 6
        'soco',                        // 7
        'chute',                       // 8
        'energia',                     // 9  (lança projétil)
        'ascendente',                  // 10 (soco que sobe)
        'girando',                     // 11 (rotação/chute girado)
        'levando-dano',                // 12
        'no-chao'                      // 13
    ];

    /* -----------------------------------------------------------------
       ETAPA 9.2 — PEÇAS PRONTAS
       Toda peça recebe um "deslocamento" (dx,dy) para que cada pose possa
       mover o braço ou a perna sem redesenhar o corpo inteiro.
       ----------------------------------------------------------------- */

    /** Retângulo com contorno grosso (o traço do desenho animado). */
    function bloco(g, x, y, largura, altura, cor, contorno) {
        if (contorno === undefined) contorno = true;
        if (contorno) {
            g.fillStyle(0x0b1120, 1);
            g.fillRect(x - 2, y - 2, largura + 4, altura + 4);
        }
        g.fillStyle(cor, 1);
        g.fillRect(x, y, largura, altura);
    }

    /** Perna: quadril -> joelho -> pé, desenhada como dois "ossos" grossos. */
    function perna(g, pa, quadrilX, quadrilY, joelhoX, joelhoY, peX, peY, corCalca, corPele, corPe, grossura) {
        const t = grossura || 13;
        ossada(g, quadrilX, quadrilY, joelhoX, joelhoY, corCalca, t + 2);
        ossada(g, joelhoX, joelhoY, peX, peY, corCalca, t);
        // pé
        g.fillStyle(0x0b1120, 1);
        g.fillRect(peX - 9, peY - 4, 22, 12);
        g.fillStyle(corPe, 1);
        g.fillRect(peX - 7, peY - 2, 18, 8);
        void pa;
    }

    /** Um "osso": linha grossa escura com linha fina colorida por cima. */
    function ossada(g, x1, y1, x2, y2, cor, espessura) {
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const len = Math.hypot(x2 - x1, y2 - y1);
        // contorno
        g.lineStyle(espessura + 5, 0x0b1120, 1);
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x1 + Math.cos(ang) * len, y1 + Math.sin(ang) * len);
        g.strokePath();
        // miolo
        g.lineStyle(espessura, cor, 1);
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x1 + Math.cos(ang) * len, y1 + Math.sin(ang) * len);
        g.strokePath();
    }

    /** Braço + luva. Se esticado for true, o braço vira um "reto de soco". */
    function braco(g, ombroX, ombroY, MaoX, MaoY, corManga, corLuva, grossura) {
        const t = grossura || 11;
        const cotoveloX = (ombroX + MaoX) / 2 + 3;
        const cotoveloY = (ombroY + MaoY) / 2 + 9;
        ossada(g, ombroX, ombroY, cotoveloX, cotoveloY, corManga, t);
        ossada(g, cotoveloX, cotoveloY, MaoX, MaoY, corManga, t - 2);
        // luva
        g.fillStyle(0x0b1120, 1);
        g.fillCircle(MaoX, MaoY, 9);
        g.fillStyle(corLuva, 1);
        g.fillCircle(MaoX, MaoY, 7);
    }

    /** Tronco + kimono/camiseta com a faixa na cintura. */
    function tronco(g, pa, inclinar) {
        const g_ = pa.g;
        const corpo = pa.corpo;
        const largura = corpo.largura + (inclinar ? 2 : 0);
        const topoY = TORSO_TOPO_Y + (inclinar || 0);
        // contorno do torso
        bloco(g_, CENTRO_X - largura / 2, topoY, largura, QUADRIL_Y - topoY + 6, pa.pal.roupa);
        // sombra lateral
        g_.fillStyle(pa.pal.roupaEscura, 1);
        g_.fillRect(CENTRO_X + largura / 2 - 7, topoY + 2, 5, QUADRIL_Y - topoY + 2);
        // gola em V (quimono)
        g_.fillStyle(pa.pal.pele, 1);
        g_.fillTriangle(CENTRO_X - 8, topoY + 1, CENTRO_X + 8, topoY + 1, CENTRO_X, topoY + 17);
        // faixa
        bloco(g_, CENTRO_X - largura / 2 - 1, QUADRIL_Y - 12, largura + 2, 10, pa.pal.detalhe);
        // nó da faixa
        g_.fillStyle(pa.pal.detalhe, 1);
        g_.fillTriangle(CENTRO_X - largura / 2 - 8, QUADRIL_Y - 10, CENTRO_X - largura / 2 - 1, QUADRIL_Y - 6, CENTRO_X - largura / 2 - 6, QUADRIL_Y + 6);
    }

    /** Cabeça, cabelo, faixa de cabeça e olhos. */
    function cabeca(g, pa, dx, dy, estilo) {
        const x = CENTRO_X + (dx || 0);
        const y = CABECA_Y + (dy || 0);
        const pal = pa.pal;
        // pescoço
        g.fillStyle(pal.peleEscura, 1);
        g.fillRect(x - 5, y + 12, 10, 10);
        // crânio
        g.fillStyle(0x0b1120, 1);
        g.fillCircle(x, y, CABECA_R + 3);
        g.fillStyle(pal.pele, 1);
        g.fillCircle(x, y, CABECA_R);
        // orelha
        g.fillStyle(pal.peleEscura, 1);
        g.fillCircle(x - 15, y + 2, 4);
        // cabelo
        g.fillStyle(pal.cabelo, 1);
        if (estilo === 'moicano') {
            for (let i = -2; i <= 2; i++) {
                g.fillRect(x + i * 5 - 2, y - CABECA_R - 8 - Math.abs(2 - Math.abs(i)) * 2, 5, 12);
            }
            g.fillRect(x - CABECA_R, y - 6, CABECA_R * 2, 6);
        } else if (estilo === 'rabicho') {
            g.fillCircle(x - 1, y - 6, CABECA_R - 3);
            g.fillRect(x - 34, y - 16, 20, 7);
            g.fillCircle(x - 34, y - 12, 6);
        } else if (estilo === 'careca') {
            g.fillRect(x - CABECA_R + 4, y - CABECA_R - 1, CABECA_R * 2 - 8, 4);
        } else if (estilo === 'longo') {
            g.fillCircle(x - 1, y - 5, CABECA_R - 1);
            g.fillRect(x - CABECA_R - 3, y - 4, 8, 30);
            g.fillRect(x + CABECA_R - 5, y - 4, 8, 26);
        } else {
            g.fillCircle(x - 1, y - 5, CABECA_R - 2);
        }
        // faixa de cabeça
        if (pa.pal.faixa) {
            bloco(g, x - CABECA_R - 4, y - 8, CABECA_R * 2 + 8, 6, pa.pal.faixa, false);
            g.fillRect(x - CABECA_R - 12, y - 7, 9, 4);
        }
        // sobrancelha e olho (olhando para a direita, que é o lado "verdadeiro")
        g.fillStyle(0x0b1120, 1);
        g.fillRect(x + 2, y - 1, 10, 3);
        g.fillStyle(0xffffff, 1);
        g.fillRect(x + 3, y + 2, 8, 4);
        g.fillStyle(0x0b1120, 1);
        g.fillRect(x + 7, y + 2, 4, 4);
        // boca
        g.fillRect(x + 4, y + 11, 6, 2);
    }

    /** Aura/brilho atrás do lutador (usado nos golpes especiais). */
    function brilho(g, x, y, raio, cor, alpha) {
        g.fillStyle(cor, alpha === undefined ? 0.25 : alpha);
        g.fillCircle(x, y, raio);
        g.fillStyle(cor, (alpha || 0.25) * 0.7);
        g.fillCircle(x, y, raio * 0.62);
    }

    /* -----------------------------------------------------------------
       ETAPA 9.3 — AS POSES
       Cada função desenha UM frame. O parâmetro `forca` deixa o braço
       mais esticado, `giro` gira o corpo, etc.
       ----------------------------------------------------------------- */
    const CORPOS = {
        normal: { largura: 34, altura: 1.0 },
        pesado: { largura: 44, altura: 0.95 },
        magro: { largura: 28, altura: 1.04 }
    };

    function desenharPose(g, pal, pose, corpo, cabelo) {
        const pa = {
            g: g,
            pal: Object.assign({ faixa: null }, pal),
            corpo: CORPOS[corpo] || CORPOS.normal,
            cabelo: cabelo || 'curto'
        };

        if (pal.faixa === undefined && (cabelo === 'faixa')) {
            pa.pal.faixa = pal.detalhe;
        }

        switch (pose) {
            case 'parado-a':
            case 'parado-b': {
                const bob = pose === 'parado-a' ? 0 : 2;
                pernasBase(g, pa, bob, 6);
                tronco(g, pa, bob);
                braco(g, CENTRO_X + 10, TORSO_TOPO_Y + 8 + bob, CENTRO_X + 24, TORSO_TOPO_Y + 26 + bob, pa.pal.roupa, pa.pal.luva);
                braco(g, CENTRO_X - 10, TORSO_TOPO_Y + 10 + bob, CENTRO_X + 12, TORSO_TOPO_Y + 40 + bob, pa.pal.roupaEscura, pa.pal.luvaEscura);
                cabeca(g, pa, 0, bob, pa.cabelo);
                break;
            }
            case 'andando-a':
            case 'andando-b':
            case 'andando-c': {
                const fase = pose === 'andando-a' ? -1 : (pose === 'andando-c' ? 1 : 0);
                // pernas alternadas
                perna(g, pa, CENTRO_X - 6, QUADRIL_Y + 4, CENTRO_X - 10 + fase * 12, PE_Y - 26, CENTRO_X - 12 + fase * 22, PE_Y, pa.pal.calcasEscura, pa.pal.pele, pa.pal.luvaEscura);
                perna(g, pa, CENTRO_X + 6, QUADRIL_Y + 4, CENTRO_X + 12 - fase * 12, PE_Y - 26, CENTRO_X + 14 - fase * 22, PE_Y, pa.pal.calcas, pa.pal.pele, pa.pal.luva);
                tronco(g, pa, 0);
                braco(g, CENTRO_X + 10, TORSO_TOPO_Y + 9, CENTRO_X + 22 + fase * 6, TORSO_TOPO_Y + 30, pa.pal.roupa, pa.pal.luva);
                braco(g, CENTRO_X - 10, TORSO_TOPO_Y + 9, CENTRO_X + 8 - fase * 10, TORSO_TOPO_Y + 36, pa.pal.roupaEscura, pa.pal.luvaEscura);
                cabeca(g, pa, fase * 2, 0, pa.cabelo);
                break;
            }
            case 'agachado': {
                // corpo inteiro 34 px mais baixo
                const dy = 34;
                perna(g, pa, CENTRO_X - 8, QUADRIL_Y + dy - 6, CENTRO_X - 24, QUADRIL_Y + dy + 16, CENTRO_X - 16, PE_Y, pa.pal.calcasEscura, pa.pal.pele, pa.pal.luvaEscura);
                perna(g, pa, CENTRO_X + 8, QUADRIL_Y + dy - 6, CENTRO_X + 26, QUADRIL_Y + dy + 16, CENTRO_X + 20, PE_Y, pa.pal.calcas, pa.pal.pele, pa.pal.luva);
                bloco(g, CENTRO_X - pa.corpo.largura / 2, TORSO_TOPO_Y + dy - 4, pa.corpo.largura, QUADRIL_Y - TORSO_TOPO_Y + 6, pa.pal.roupa);
                g.fillStyle(pa.pal.roupaEscura, 1);
                g.fillRect(CENTRO_X + pa.corpo.largura / 2 - 7, TORSO_TOPO_Y + dy - 2, 5, 30);
                braco(g, CENTRO_X + 10, TORSO_TOPO_Y + dy + 4, CENTRO_X + 26, TORSO_TOPO_Y + dy + 16, pa.pal.roupa, pa.pal.luva);
                braco(g, CENTRO_X - 10, TORSO_TOPO_Y + dy + 6, CENTRO_X + 14, TORSO_TOPO_Y + dy + 24, pa.pal.roupaEscura, pa.pal.luvaEscura);
                cabeca(g, pa, 2, dy - 4, pa.cabelo);
                break;
            }
            case 'pulando': {
                // pernas dobradas para dentro, braços acima da cabeça
                perna(g, pa, CENTRO_X - 6, QUADRIL_Y, CENTRO_X - 20, QUADRIL_Y + 16, CENTRO_X - 6, QUADRIL_Y + 30, pa.pal.calcasEscura, pa.pal.pele, pa.pal.luvaEscura);
                perna(g, pa, CENTRO_X + 6, QUADRIL_Y + 2, CENTRO_X + 22, QUADRIL_Y + 12, CENTRO_X + 10, QUADRIL_Y + 30, pa.pal.calcas, pa.pal.pele, pa.pal.luva);
                tronco(g, pa, -2);
                braco(g, CENTRO_X + 10, TORSO_TOPO_Y + 6, CENTRO_X + 24, TORSO_TOPO_Y - 14, pa.pal.roupa, pa.pal.luva);
                braco(g, CENTRO_X - 10, TORSO_TOPO_Y + 6, CENTRO_X - 20, TORSO_TOPO_Y - 10, pa.pal.roupaEscura, pa.pal.luvaEscura);
                cabeca(g, pa, 0, -2, pa.cabelo);
                break;
            }
            case 'soco': {
                pernasBase(g, pa, 0, 12);
                tronco(g, pa, 0);
                braco(g, CENTRO_X - 10, TORSO_TOPO_Y + 10, CENTRO_X - 6, TORSO_TOPO_Y + 28, pa.pal.roupaEscura, pa.pal.luvaEscura);
                braco(g, CENTRO_X + 8, TORSO_TOPO_Y + 8, CENTRO_X + 44, TORSO_TOPO_Y + 6, pa.pal.roupa, pa.pal.luva);
                // velocidades atrás do punho
                g.lineStyle(3, pa.pal.aura, 0.5);
                g.beginPath(); g.moveTo(CENTRO_X + 24, TORSO_TOPO_Y + 2); g.lineTo(CENTRO_X + 40, TORSO_TOPO_Y + 2); g.strokePath();
                cabeca(g, pa, 3, 0, pa.cabelo);
                break;
            }
            case 'chute': {
                // perna da frente esticada na horizontal
                perna(g, pa, CENTRO_X - 6, QUADRIL_Y + 2, CENTRO_X - 14, PE_Y - 22, CENTRO_X - 16, PE_Y, pa.pal.calcasEscura, pa.pal.pele, pa.pal.luvaEscura);
                perna(g, pa, CENTRO_X + 6, QUADRIL_Y - 2, CENTRO_X + 30, QUADRIL_Y - 16, CENTRO_X + 50, QUADRIL_Y - 26, pa.pal.calcas, pa.pal.pele, pa.pal.luva);
                bloco(g, CENTRO_X - pa.corpo.largura / 2 - 6, TORSO_TOPO_Y + 10, pa.corpo.largura, QUADRIL_Y - TORSO_TOPO_Y, pa.pal.roupa);
                braco(g, CENTRO_X - 4, TORSO_TOPO_Y + 22, CENTRO_X - 30, TORSO_TOPO_Y + 34, pa.pal.roupaEscura, pa.pal.luvaEscura);
                braco(g, CENTRO_X + 6, TORSO_TOPO_Y + 20, CENTRO_X - 12, TORSO_TOPO_Y + 2, pa.pal.roupa, pa.pal.luva);
                cabeca(g, pa, -6, 8, pa.cabelo);
                break;
            }
            case 'energia': {
                pernasBase(g, pa, 4, 16);
                tronco(g, pa, 2);
                // as duas mãos juntas na frente, lançando energia
                brilho(g, CENTRO_X + 34, TORSO_TOPO_Y + 22, 20, pa.pal.aura, 0.45);
                braco(g, CENTRO_X + 8, TORSO_TOPO_Y + 8, CENTRO_X + 32, TORSO_TOPO_Y + 22, pa.pal.roupa, pa.pal.luva);
                braco(g, CENTRO_X - 8, TORSO_TOPO_Y + 12, CENTRO_X + 28, TORSO_TOPO_Y + 26, pa.pal.roupaEscura, pa.pal.luvaEscura);
                cabeca(g, pa, 4, 2, pa.cabelo);
                break;
            }
            case 'ascendente': {
                // corpo inclinado, punho para o alto
                perna(g, pa, CENTRO_X - 6, QUADRIL_Y + 10, CENTRO_X - 14, PE_Y - 16, CENTRO_X - 18, PE_Y, pa.pal.calcasEscura, pa.pal.pele, pa.pal.luvaEscura);
                perna(g, pa, CENTRO_X + 8, QUADRIL_Y + 6, CENTRO_X + 16, PE_Y - 20, CENTRO_X + 22, PE_Y - 6, pa.pal.calcas, pa.pal.pele, pa.pal.luva);
                bloco(g, CENTRO_X - pa.corpo.largura / 2 + 4, TORSO_TOPO_Y - 4, pa.corpo.largura, QUADRIL_Y - TORSO_TOPO_Y, pa.pal.roupa);
                braco(g, CENTRO_X + 6, TORSO_TOPO_Y, CENTRO_X + 20, TORSO_TOPO_Y - 44, pa.pal.roupa, pa.pal.luva);
                braco(g, CENTRO_X - 6, TORSO_TOPO_Y + 16, CENTRO_X - 4, TORSO_TOPO_Y + 36, pa.pal.roupaEscura, pa.pal.luvaEscura);
                brilho(g, CENTRO_X + 22, TORSO_TOPO_Y - 50, 18, pa.pal.aura, 0.5);
                cabeca(g, pa, -2, -2, pa.cabelo);
                break;
            }
            case 'girando': {
                // os dois pés esticados para os lados = rotação
                g.lineStyle(4, pa.pal.aura, 0.35);
                g.beginPath(); g.strokeEllipse(CENTRO_X, QUADRIL_Y - 4, 86, 40); g.strokePath();
                perna(g, pa, CENTRO_X, QUADRIL_Y, CENTRO_X + 26, QUADRIL_Y - 12, CENTRO_X + 48, QUADRIL_Y - 20, pa.pal.calcas, pa.pal.pele, pa.pal.luva);
                perna(g, pa, CENTRO_X, QUADRIL_Y + 4, CENTRO_X - 26, QUADRIL_Y + 12, CENTRO_X - 46, QUADRIL_Y + 6, pa.pal.calcasEscura, pa.pal.pele, pa.pal.luvaEscura);
                bloco(g, CENTRO_X - pa.corpo.largura / 2, TORSO_TOPO_Y + 6, pa.corpo.largura, QUADRIL_Y - TORSO_TOPO_Y, pa.pal.roupa);
                braco(g, CENTRO_X + 8, TORSO_TOPO_Y + 16, CENTRO_X + 30, TORSO_TOPO_Y + 30, pa.pal.roupa, pa.pal.luva);
                braco(g, CENTRO_X - 8, TORSO_TOPO_Y + 16, CENTRO_X - 30, TORSO_TOPO_Y + 30, pa.pal.roupaEscura, pa.pal.luvaEscura);
                cabeca(g, pa, 0, 4, pa.cabelo);
                break;
            }
            case 'levando-dano': {
                pernasBase(g, pa, 6, -8);
                bloco(g, CENTRO_X - pa.corpo.largura / 2 - 4, TORSO_TOPO_Y + 6, pa.corpo.largura, QUADRIL_Y - TORSO_TOPO_Y, pa.pal.roupa);
                braco(g, CENTRO_X + 8, TORSO_TOPO_Y + 10, CENTRO_X - 8, TORSO_TOPO_Y - 8, pa.pal.roupa, pa.pal.luva);
                braco(g, CENTRO_X - 8, TORSO_TOPO_Y + 12, CENTRO_X - 24, TORSO_TOPO_Y - 4, pa.pal.roupaEscura, pa.pal.luvaEscura);
                cabeca(g, pa, -8, 4, pa.cabelo);
                // "olhos em X"
                g.lineStyle(2, 0x0b1120, 1);
                g.beginPath();
                g.moveTo(CENTRO_X, TORSO_TOPO_Y - 40); g.lineTo(CENTRO_X + 6, TORSO_TOPO_Y - 34);
                g.moveTo(CENTRO_X + 6, TORSO_TOPO_Y - 40); g.lineTo(CENTRO_X, TORSO_TOPO_Y - 34);
                g.strokePath();
                break;
            }
            case 'no-chao': {
                // deitado: tudo deitado no rodapé do frame
                bloco(g, CENTRO_X - 30, PE_Y - 26, 62, 22, pa.pal.roupa);
                perna(g, pa, CENTRO_X - 24, PE_Y - 16, CENTRO_X - 40, PE_Y - 10, CENTRO_X - 44, PE_Y - 4, pa.pal.calcas, pa.pal.pele, pa.pal.luva, 11);
                braco(g, CENTRO_X + 12, PE_Y - 22, CENTRO_X + 30, PE_Y - 34, pa.pal.roupaEscura, pa.pal.luvaEscura, 9);
                // cabeça deitada
                g.fillStyle(0x0b1120, 1);
                g.fillCircle(CENTRO_X + 24, PE_Y - 34, CABECA_R + 1);
                g.fillStyle(pa.pal.pele, 1);
                g.fillCircle(CENTRO_X + 24, PE_Y - 34, CABECA_R - 2);
                g.fillStyle(pa.pal.cabelo, 1);
                g.fillCircle(CENTRO_X + 18, PE_Y - 40, 10);
                break;
            }
            default: {
                pernasBase(g, pa, 0, 6);
                tronco(g, pa, 0);
                cabeca(g, pa, 0, 0, pa.cabelo);
            }
        }
        return pa;
    }

    /** Duas pernas "neutras" com afastamento `abertura`. */
    function pernasBase(g, pa, dy, abertura) {
        const a = abertura || 8;
        perna(g, pa, CENTRO_X - 7, QUADRIL_Y + dy, CENTRO_X - 10 - a / 2, PE_Y - 26, CENTRO_X - 12 - a, PE_Y - dy, pa.pal.calcasEscura, pa.pal.pele, pa.pal.luvaEscura);
        perna(g, pa, CENTRO_X + 7, QUADRIL_Y + dy, CENTRO_X + 10 + a / 2, PE_Y - 26, CENTRO_X + 12 + a, PE_Y - dy, pa.pal.calcas, pa.pal.pele, pa.pal.luva);
    }

    /* -----------------------------------------------------------------
       ETAPA 9.4 — MONTAGEM DA SPRITESHEET
       ----------------------------------------------------------------- */

    /**
     * "Desenhista" de Canvas 2D com a MESMA interface de Phaser.Graphics que
     * as poses usam (fillRect, fillCircle, lineStyle, strokePath...).
     * Assim o mesmo código de desenho serve para:
     *   - gerar a spritesheet em tempo de execução (fallback), e
     *   - exportar os PNGs de alta resolução (ferramentas/exportar-spritesheets.html).
     */
    function criarDesenhador(ctx) {
        let corPreench = 'rgba(0,0,0,1)';
        let corLinha = 'rgba(0,0,0,1)';
        let espessura = 1;
        const rgba = function (cor, alfa) {
            const a = alfa === undefined ? 1 : alfa;
            return 'rgba(' + ((cor >> 16) & 255) + ',' + ((cor >> 8) & 255) + ',' + (cor & 255) + ',' + a + ')';
        };
        const d = {
            fillStyle(cor, alfa) { corPreench = rgba(cor, alfa); return d; },
            lineStyle(larg, cor, alfa) { espessura = larg; corLinha = rgba(cor, alfa); return d; },
            fillRect(x, y, w, h) { ctx.fillStyle = corPreench; ctx.fillRect(x, y, w, h); return d; },
            fillCircle(x, y, r) { ctx.fillStyle = corPreench; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); return d; },
            fillTriangle(x1, y1, x2, y2, x3, y3) {
                ctx.fillStyle = corPreench; ctx.beginPath();
                ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill(); return d;
            },
            fillEllipse(x, y, w, h) { ctx.fillStyle = corPreench; ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill(); return d; },
            strokeEllipse(x, y, w, h) {
                ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
                ctx.strokeStyle = corLinha; ctx.lineWidth = espessura; ctx.stroke(); return d;
            },
            fillRoundedRect(x, y, w, h, r) { ctx.fillStyle = corPreench; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); return d; },
            strokeRoundedRect(x, y, w, h, r) {
                ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
                ctx.strokeStyle = corLinha; ctx.lineWidth = espessura; ctx.stroke(); return d;
            },
            beginPath() { ctx.beginPath(); return d; },
            moveTo(x, y) { ctx.moveTo(x, y); return d; },
            lineTo(x, y) { ctx.lineTo(x, y); return d; },
            strokePath() {
                ctx.strokeStyle = corLinha; ctx.lineWidth = espessura;
                ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                ctx.stroke(); return d;
            }
        };
        return d;
    }

    /**
     * Desenha as 14 poses em um canvas de alta resolução (ESCALA x).
     * Cada pose é recortada no seu próprio quadro (clip), então nenhuma
     * pose invade a vizinha.
     */
    function criarCanvasSpritesheet(personagem) {
        const canvas = document.createElement('canvas');
        canvas.width = FRAME_TEX_L * POSES.length;
        canvas.height = FRAME_TEX_A;
        const ctx = canvas.getContext('2d');
        const g = criarDesenhador(ctx);
        for (let i = 0; i < POSES.length; i++) {
            ctx.save();
            ctx.setTransform(UNIDADE, 0, 0, UNIDADE, i * FRAME_TEX_L, 0);
            ctx.beginPath();
            ctx.rect(0, 0, DESENHO_L, DESENHO_A);
            ctx.clip();
            desenharPose(g, personagem.paleta, POSES[i], personagem.corpo, personagem.cabelo);
            ctx.restore();
        }
        return canvas;
    }

    /** Pede ao Phaser que suavize a textura (ela é grande e é reduzida na tela). */
    function prepararTextura(cena, chave) {
        const textura = cena.textures.get(chave);
        if (textura && textura.setFilter && cena.sys.game.renderer.type !== Phaser.CANVAS) {
            textura.setFilter(Phaser.Textures.FilterMode.LINEAR);
        }
        return chave;
    }

    /** Fatia uma textura com a grade ESCALA x (14 quadros numerados 0..13). */
    function fatiar(cena, chave) {
        const textura = cena.textures.get(chave);
        for (let i = 0; i < POSES.length; i++) {
            if (!textura.has(i)) textura.add(i, 0, i * FRAME_TEX_L, 0, FRAME_TEX_L, FRAME_TEX_A);
        }
    }

    /** Pede para carregar os PNGs de assets/sprites/ (um por lutador). */
    function carregarSpritesheets(cena, elenco) {
        elenco.forEach(function (p) {
            const chave = 'lutador-' + p.id;
            if (cena.textures.exists(chave)) return;
            cena.load.spritesheet(chave, 'assets/sprites/' + p.id + '.png', {
                frameWidth: FRAME_TEX_L,
                frameHeight: FRAME_TEX_A
            });
        });
    }

    /**
     * Devolve a chave da textura do lutador. Usa o PNG carregado; se ele não
     * existir (arquivo ausente), gera a spritesheet pelo código como reserva.
     */
    function gerarSpritesheet(cena, personagem) {
        const chave = 'lutador-' + personagem.id;
        if (cena.textures.exists(chave)) {
            fatiar(cena, chave);
            return prepararTextura(cena, chave);
        }
        cena.textures.addCanvas(chave, criarCanvasSpritesheet(personagem));
        fatiar(cena, chave);
        return prepararTextura(cena, chave);
    }

    /* -----------------------------------------------------------------
       ETAPA 9.5 — TEXTURAS DOS GOLPES E FEITICEIROS VISUAIS
       ----------------------------------------------------------------- */
    function gerarEfeitos(cena) {
        let g = cena.make.graphics({ x: 0, y: 0, add: false });

        // Orbe de energia (usado por projéteis)
        g.fillStyle(0xffffff, 0.28);
        g.fillCircle(24, 24, 23);
        g.fillStyle(0xffffff, 0.5);
        g.fillCircle(24, 24, 15);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(24, 24, 9);
        g.generateTexture('orbe', 48, 48);
        g.clear();

        // Bola de fogo (com "cauda")
        g.fillStyle(0xffffff, 0.35);
        g.fillEllipse(26, 20, 46, 30);
        g.fillStyle(0xffffff, 0.8);
        g.fillEllipse(22, 20, 30, 22);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(24, 20, 9);
        g.generateTexture('bola-fogo', 52, 40);
        g.clear();

        // Estrela de impacto
        g.fillStyle(0xffffff, 1);
        for (let a = 0; a < 8; a++) {
            const ang = (a / 8) * Math.PI * 2;
            const r1 = a % 2 === 0 ? 20 : 8;
            g.fillTriangle(
                24 + Math.cos(ang) * r1, 24 + Math.sin(ang) * r1,
                24 + Math.cos(ang + 0.4) * (r1 * 0.4), 24 + Math.sin(ang + 0.4) * (r1 * 0.4),
                24 + Math.cos(ang - 0.4) * (r1 * 0.4), 24 + Math.sin(ang - 0.4) * (r1 * 0.4)
            );
        }
        g.generateTexture('impacto', 48, 48);
        g.clear();

        // Anel de choque (onda de energia no chão)
        g.lineStyle(7, 0xffffff, 0.9);
        g.strokeCircle(30, 30, 22);
        g.lineStyle(3, 0xffffff, 0.5);
        g.strokeCircle(30, 30, 28);
        g.generateTexture('anel', 60, 60);
        g.clear();

        // Poeira de aterrissagem
        g.fillStyle(0xffffff, 0.5);
        g.fillCircle(10, 12, 8);
        g.fillCircle(26, 9, 10);
        g.fillCircle(42, 13, 7);
        g.generateTexture('poeira', 54, 24);
        g.clear();

        // Escudo de bloqueio (hexágono simples)
        g.fillStyle(0xffffff, 0.30);
        g.fillRoundedRect(2, 2, 26, 52, 8);
        g.lineStyle(3, 0xffffff, 0.85);
        g.strokeRoundedRect(2, 2, 26, 52, 8);
        g.generateTexture('escudo', 30, 56);
        g.clear();

        // Sombra no chão
        g.fillStyle(0x000000, 0.28);
        g.fillEllipse(30, 10, 60, 18);
        g.generateTexture('sombra', 60, 20);
        g.destroy();
    }

    /** Retrato do personagem na tela de seleção (frame 0 ampliado). */
    function desenharRetrato(cena, x, y, personagem, escala) {
        const chave = 'lutador-' + personagem.id;
        const imagem = cena.add.image(x, y, chave, 0)
            .setOrigin(0.5, 0.92)
            .setScale(escala || 2.2);
        return imagem;
    }

    return {
        QUADRO_L, QUADRO_A, DESENHO_L, DESENHO_A, ESCALA, UNIDADE, PE_Y, POSES,
        desenharPose, criarCanvasSpritesheet, carregarSpritesheets, gerarSpritesheet, gerarEfeitos, desenharRetrato, CORPOS
    };
})();

if (typeof window !== 'undefined') { window.DESINHOS = DESINHOS; }
