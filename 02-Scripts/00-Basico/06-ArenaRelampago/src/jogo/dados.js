/* =====================================================================
   QUINTO JOGO — ARENA RELÂMPAGO: JOGO DE LUTA 2D ESTILO STREET FIGHTER
   ---------------------------------------------------------------------
   ARQUIVO 1 DE 3 — DADOS, BALANCEAMENTO E REGRAS DA LUTA
   =====================================================================
   Este arquivo é o "livro de regras" do jogo. Ele NÃO desenha nada na
   tela: aqui ficam apenas os NÚMEROS e as LISTAS que controlam como a
   luta funciona.

   Por que separar os números do resto do código?
   Porque é assim que os estúdios de verdade trabalham! Existe um cargo
   chamado "Game Designer" cuja missão é mexer nestes números até a luta
   ficar divertida. Faça o mesmo: mude um valor, salve, recarregue o
   navegador e veja a mágica (ou o desastre!).

   ÍNDICE DESTE ARQUIVO
     ETAPA 0 — Constantes da arena (tamanho do mundo, chão, gravidade)
     ETAPA 1 — Regras da luta (vida, tempo, rounds, super)
     ETAPA 2 — Golpes básicos (o repertório comum a todos)
     ETAPA 3 — Os 8 personagens do elenco (o "roster")
     ETAPA 4 — Como os comandos especiais são detectados
     ETAPA 5 — Cérebro da máquina (a IA que joga sozinha)
     ETAPA 6 — Som gerado por código (Web Audio, sem arquivos MP3)
     ETAPA 7 — Configuração do Phaser e exportação para os outros arquivos
   ===================================================================== */

const DADOS = (function () {
    'use strict';

    /* =================================================================
       ETAPA 0 — CONSTANTES DA ARENA
       O mundo é MAIOR que a tela. Assim a câmera pode passear entre os
       dois lutadores, igual nos jogos de luta profissionais.
       ================================================================= */
    const LARGURA_TELA = 1280;       // largura do que você vê
    const ALTURA_TELA = 720;         // altura do que você vê
    const LARGURA_MUNDO = 1600;      // largura real da arena (a câmera desliza nela)
    const ALTURA_MUNDO = 720;
    const CHAO_Y = 600;              // os pés dos lutadores ficam nesta altura
    const GRAVIDADE = 2200;          // quão forte a Terra puxa todo mundo para baixo
    const PULO_VELOCIDADE = 980;     // força do salto (maior = pula mais alto)

    /* =================================================================
       ETAPA 1 — REGRAS DA LUTA
       ================================================================= */
    const QUADROS_POR_SEGUNDO = 60;  // o jogo "pensa" 60 vezes por segundo

    const VIDA_MAXIMA = 100;         // tamanho da barra de vida
    const VIDA_TREINO = 999999;      // no modo treino a barra não acaba
    const SUPER_MAXIMO = 100;        // medidor do golpe supremo
    const SUPER_DANO_CAUSADO = 0.55; // super ganho ao bater
    const SUPER_DANO_RECEBIDO = 0.35;// super ganho ao apanhar (para poder reagir)

    const SEGUNDOS_POR_ROUND = 60;   // duração de cada round
    const ROUNDS_PARA_VENCER = 2;    // melhor de 3: quem ganha 2 rounds leva a taça
    const REBOTE_DANO = 0.10;        // "dano de raspão" mesmo quando o golpe é bloqueado

    const FLEXIVEL_MS = 220;         // tolerância entre um toque e outro do comando
    const CARGA_MS = 900;            // tempo segurando para "carregar" um golpe de carga
    const CARGA_JANELA_MS = 400;     // prazo para soltar a carga virando para frente

    const ANDAR_VELOCIDADE = 190;    // velocidade da caminhada
    const CORRIDA_MULT = 1.9;        // multiplicador ao dar dois toques para frente
    const EMPURRAO_DANO = 130;       // o quanto um golpe empurra quem apanhou
    const EMPURRAO_BLOQUEIO = 95;    // o quanto o bloqueio empurra os dois

    const NOMES_MODOS = ['P1 vs CPU', 'P1 vs P2', 'CPU vs CPU', 'TREINO'];
    const NOMES_DIFICULDADE = ['Fácil', 'Normal', 'Difícil', 'Impossível'];

    /* =================================================================
       ETAPA 2 — GOLPES BÁSICOS (o repertório comum)
       -----------------------------------------------------------------
       Todo jogo de luta usa uma "tabela de frames". Frame = 1/60 s.
       Cada golpe tem 3 tempos:

         STARTUP (preparo)   -> o lutador puxa o braço. AINDA NÃO machuca.
         ATIVO   (acerto)    -> a janela em que o punho corta o ar. MACHUCA!
         RECUPERACAO (volta) -> ele volta ao normal. Fica exposto.

       Se a RECUPERAÇÃO for grande, o golpe é arriscado: errou = levou o
       contragolpe. É exatamente assim que se decide quem é forte e quem
       é rápido nos jogos de luta de verdade.

       CAMPOS DE UM GOLPE
         nome        : como aparece na tela
         startup     : frames de preparo
         ativo       : frames em que acerta
         recuperacao : frames de recuperação
         dano        : vida tirada (multiplicado pela FORCA do personagem)
         alturaCaixa : 1 = bloqueia em pé | 0 = golpe baixo (só agachado) | 2 = aéreo
         canc        : frames após o acerto para já emendar outro golpe
         paraCima    : arremessa o oponente para o alto
         derruba     : joga o oponente no chão (knockdown)
         hitbox      : [x, y, largura, altura] relativo ao lutador olhando para a DIREITA
         frame       : qual desenho da spritesheet usar nesse golpe
       ================================================================= */
    const ATAQUES = {
        'p.S': {
            nome: 'Soco rápido', startup: 4, ativo: 3, recuperacao: 7,
            dano: 5, alturaCaixa: 1, canc: 8, frame: 8,
            hitbox: [26, -100, 48, 22]
        },
        'p.C': {
            nome: 'Soco forte', startup: 8, ativo: 4, recuperacao: 16,
            dano: 11, alturaCaixa: 1, canc: 14, frame: 8,
            hitbox: [30, -96, 66, 28]
        },
        'k.S': {
            nome: 'Chute rápido', startup: 5, ativo: 3, recuperacao: 9,
            dano: 6, alturaCaixa: 1, canc: 10, frame: 9,
            hitbox: [28, -76, 56, 24]
        },
        'k.C': {
            nome: 'Chute alto', startup: 9, ativo: 5, recuperacao: 19,
            dano: 12, alturaCaixa: 2, canc: 16, derruba: true, frame: 9,
            hitbox: [30, -116, 70, 32]
        },
        'p.B': {
            nome: 'Soco agachado', startup: 5, ativo: 3, recuperacao: 9,
            dano: 5, alturaCaixa: 0, baixo: true, canc: 9, frame: 6,
            hitbox: [24, -50, 50, 22]
        },
        'k.B': {
            nome: 'Varrura rasteira', startup: 7, ativo: 4, recuperacao: 17,
            dano: 8, alturaCaixa: 0, baixo: true, derruba: true, canc: 13, frame: 6,
            hitbox: [22, -26, 76, 24]
        },
        'a.S': {
            nome: 'Soco no ar', startup: 4, ativo: 8, recuperacao: 6,
            dano: 8, alturaCaixa: 2, frame: 8,
            hitbox: [22, -92, 54, 44]
        },
        'a.C': {
            nome: 'Chute no ar', startup: 6, ativo: 9, recuperacao: 6,
            dano: 11, alturaCaixa: 2, frame: 9,
            hitbox: [24, -76, 62, 46]
        },
        'THROW': {
            nome: 'Projeção', startup: 3, ativo: 4, recuperacao: 16,
            dano: 12, alturaCaixa: 1, agarrao: true, alcance: 46, frame: 8,
            hitbox: [16, -96, 48, 84]
        }
    };

    /* =================================================================
       ETAPA 3 — OS 8 PERSONAGENS (O ELENCO)
       -----------------------------------------------------------------
       Cada personagem tem:
         paleta    : as cores usadas no desenho (mexa aqui e troque o visual!)
         atributos : vida, velocidade, força e defesa
         especial  : o golpe assinatura + o desenho do comando
         super     : a versão SUPREMA do especial (gasta a barra de super)
         estilo    : como a máquina controla esse bonequinho

       Atributos explicados:
         vida       : tamanho da barra. Maior = tanque, aguenta mais porrada.
         velocidade : passo por segundo. Rápido chega perto e foge dele.
         forca      : multiplica o DANO de todos os golpes dele.
         defesa     : multiplica o dano que ele RECEBE (abaixo de 1 = resistente).
       ================================================================= */
    const PALETA_PADRAO = {
        pele: 0xf6c99a, peleEscura: 0xd99f6b,
        roupa: 0x2563eb, roupaEscura: 0x14377d,
        calcas: 0x1e293b, calcasEscura: 0x0f172a,
        luva: 0xdc2626, luvaEscura: 0x7f1d1d,
        cabelo: 0x111827, detalhe: 0xfacc15,
        aura: 0x38bdf8, contorno: 0x0b1120
    };

    function paleta(mudancas) {
        // Cria uma paleta completa a partir de algumas cores principais.
        return Object.assign({}, PALETA_PADRAO, mudancas);
    }

    const ELENCO = [
        {
            id: 'kiro', nome: 'KIRO', titulo: 'O Monge da Chama',
            frase: 'Acalme a respiração... e solte a esfera.',
            descricao: 'Equilibrado e justo. O campeão para quem está começando: aprende o golpe de fogo e já sabe jogar.',
            paleta: paleta({ roupa: 0xe2e8f0, roupaEscura: 0x94a3b8, luva: 0x38bdf8, luvaEscura: 0x075985, cabelo: 0x0f172a, detalhe: 0x38bdf8, aura: 0x60a5fa }),
            corpo: 'normal', cabelo: 'curto',
            atributos: { vida: 1.00, velocidade: 1.00, forca: 1.00, defesa: 1.00, alcance: 1.00 },
            especial: {
                nome: 'Esfera de Luz', tipo: 'projeteis',
                comando: ['f', 'd', 'df', 'f'], botao: 'punch',
                startup: 9, ativo: 8, recuperacao: 20, canc: 14, frame: 10,
                projeteis: [{ velocidade: 470, dano: 9, y: -84, cor: 0x60a5fa, nucleo: 0xe0f2fe, raio: 16, duracao: 2200 }]
            },
            super: {
                nome: 'Relâmpago do Dragão', tipo: 'projeteis',
                comando: ['f', 'd', 'df', 'f'], botao: 'super',
                startup: 6, ativo: 22, recuperacao: 26, frame: 10,
                projeteis: [
                    { velocidade: 400, dano: 8, y: -76, cor: 0x3b82f6, nucleo: 0xffffff, raio: 20, duracao: 2600 },
                    { velocidade: 480, dano: 9, y: -98, cor: 0x60a5fa, nucleo: 0xffffff, raio: 22, duracao: 2600 },
                    { velocidade: 560, dano: 10, y: -58, cor: 0x93c5fd, nucleo: 0xffffff, raio: 24, duracao: 2600 }
                ]
            },
            estilo: { forma: 'equilibrado', agressao: 0.55, defesaNivel: 0.55, recuo: 0.25, preferido: 'p.C' }
        },
        {
            id: 'jato', nome: 'JATO', titulo: 'O Punho de Aço',
            frase: 'Cheguei perto? Azar o seu.',
            descricao: 'Rushdown: cola no adversário com golpes velozes e um soco de carga que atravessa a tela.',
            paleta: paleta({ roupa: 0xdc2626, roupaEscura: 0x7f1d1d, luva: 0xfbbf24, luvaEscura: 0x92400e, cabelo: 0xf59e0b, detalhe: 0xfde68a, aura: 0xfb923c, calcas: 0x1f2937, calcasEscura: 0x0b1120 }),
            corpo: 'normal', cabelo: 'curto',
            atributos: { vida: 0.92, velocidade: 1.12, forca: 1.10, defesa: 1.06, alcance: 1.05 },
            especial: {
                nome: 'Soco Cometa', tipo: 'investida',
                comando: ['b', 'f'], botao: 'punch', carga: 'b',
                startup: 8, ativo: 14, recuperacao: 22, frame: 8,
                investida: { velocidade: 520, dano: 13, invencivel: 8, hitbox: [20, -104, 66, 54] }
            },
            super: {
                nome: 'Fúria Cometa', tipo: 'investida',
                comando: ['b', 'f'], botao: 'super', carga: 'b',
                startup: 5, ativo: 34, recuperacao: 28, frame: 8,
                investida: { velocidade: 660, sequencia: [10, 10, 12, 14], hitbox: [16, -110, 76, 62] }
            },
            estilo: { forma: 'rushdown', agressao: 0.82, defesaNivel: 0.35, recuo: 0.10, preferido: 'p.C' }
        },
        {
            id: 'teo', nome: 'TÉO', titulo: 'O Dragão Ascendente',
            frase: 'Pulou na minha frente? Errou, campeão.',
            descricao: 'Anti-aéreo: tem o famoso soco que sobe e derruba quem tenta pular. Fortíssimo de perto.',
            paleta: paleta({ roupa: 0xfef3c7, roupaEscura: 0xcbb06a, luva: 0x1f2937, luvaEscura: 0x030712, cabelo: 0x1f2937, detalhe: 0xf59e0b, aura: 0xfde047, calcas: 0xfef3c7, calcasEscura: 0xcbb06a }),
            corpo: 'normal', cabelo: 'faixa',
            atributos: { vida: 1.02, velocidade: 0.95, forca: 1.08, defesa: 0.96, alcance: 1.10 },
            especial: {
                nome: 'Dragão Ascendente', tipo: 'melee',
                comando: ['f', 'd', 'df', 'u'], botao: 'punch',
                startup: 3, ativo: 12, recuperacao: 24, frame: 11,
                melee: { dano: 14, paraCima: true, derruba: true, impulsoY: -520, invencivel: 6, hitbox: [10, -132, 56, 120] }
            },
            super: {
                nome: 'Tempestade de Dragões', tipo: 'melee',
                comando: ['f', 'd', 'df', 'u'], botao: 'super',
                startup: 2, ativo: 30, recuperacao: 30, frame: 11,
                melee: { sequencia: [11, 11, 13], paraCima: true, derruba: true, impulsoY: -640, hitbox: [8, -150, 68, 148] }
            },
            estilo: { forma: 'antiareo', agressao: 0.50, defesaNivel: 0.62, recuo: 0.30, preferido: 'k.C' }
        },
        {
            id: 'ravi', nome: 'RAVI', titulo: 'O Muralha',
            frase: 'Pode vir. Eu nem saio do lugar.',
            descricao: 'Tanque: muita vida, passos lentos, mas esmaga com um golpe carregado no chão (segure ↓ e solte ↑ + chute).',
            paleta: paleta({ roupa: 0x92400e, roupaEscura: 0x451a03, luva: 0xf8fafc, luvaEscura: 0x94a3b8, cabelo: 0x292524, detalhe: 0xfbbf24, aura: 0xf97316, calcas: 0x7c2d12, calcasEscura: 0x431402, pele: 0xc68642, peleEscura: 0x8d5524 }),
            corpo: 'pesado', cabelo: 'curto',
            atributos: { vida: 1.28, velocidade: 0.78, forca: 1.22, defesa: 0.80, alcance: 1.05 },
            especial: {
                nome: 'Martelo Sísmico', tipo: 'melee',
                comando: ['d'], botao: 'kick', carga: 'd',
                startup: 6, ativo: 8, recuperacao: 22, frame: 11,
                melee: { dano: 13, derruba: true, tremor: 12, hitbox: [16, -74, 118, 74] }
            },
            super: {
                nome: 'Terremoto Total', tipo: 'melee',
                comando: ['d'], botao: 'super', carga: 'd',
                startup: 5, ativo: 16, recuperacao: 30, frame: 11,
                melee: { dano: 26, derruba: true, tremor: 24, atravessaBloqueio: true, hitbox: [-110, -120, 330, 128] }
            },
            estilo: { forma: 'tanque', agressao: 0.45, defesaNivel: 0.72, recuo: 0.18, preferido: 'p.C' }
        },
        {
            id: 'nina', nome: 'NINA', titulo: 'A Bailarina do Trovão',
            frase: 'Girei, acertei, sorri. Simpática, né?',
            descricao: 'Acrobata: pula altíssimo, cai com um chute voador e roda no ar enchendo a barra de super.',
            paleta: paleta({ roupa: 0x22c55e, roupaEscura: 0x14532d, luva: 0xf0fdf4, luvaEscura: 0x86efac, cabelo: 0xfacc15, detalhe: 0xa3e635, aura: 0x4ade80, calcas: 0x166534, calcasEscura: 0x052e16, pele: 0xffd9b3, peleEscura: 0xd99f6b }),
            corpo: 'magro', cabelo: 'longo',
            atributos: { vida: 0.88, velocidade: 1.24, forca: 0.92, defesa: 1.02, alcance: 0.92 },
            especial: {
                nome: 'Roda do Trovão', tipo: 'melee',
                comando: ['d', 'u'], botao: 'kick', invencivel: 9,   // 9 frames = atravessa energia
                startup: 4, ativo: 14, recuperacao: 18, frame: 9,
                melee: { sequencia: [6, 6, 8], paraCima: true, gira: true, impulsoY: -360, hitbox: [-34, -112, 112, 78] }
            },
            super: {
                nome: 'Ciclone Celeste', tipo: 'melee',
                comando: ['d', 'u'], botao: 'super',
                startup: 3, ativo: 34, recuperacao: 24, frame: 9,
                melee: { sequencia: [5, 5, 6, 6, 8], paraCima: true, gira: true, derruba: true, impulsoY: -420, hitbox: [-44, -132, 136, 104] }
            },
            estilo: { forma: 'acrobata', agressao: 0.68, defesaNivel: 0.45, recuo: 0.42, preferido: 'k.S' }
        },
        {
            id: 'dara', nome: 'DARA', titulo: 'A Grua de Ferro',
            frase: 'Pode chutar. Eu já sei como vai terminar.',
            descricao: 'Zoner defensiva: energia carregada, pernas compridas e um contra-ataque que devolve o troco.',
            paleta: paleta({ roupa: 0x7c3aed, roupaEscura: 0x3b0764, luva: 0xfde68a, luvaEscura: 0x92400e, cabelo: 0x0f172a, detalhe: 0xfacc15, aura: 0xc084fc, calcas: 0x6d28d9, calcasEscura: 0x2e1065, pele: 0x8d5524, peleEscura: 0x5c3317 }),
            corpo: 'magro', cabelo: 'careca',
            atributos: { vida: 0.95, velocidade: 0.90, forca: 1.04, defesa: 0.98, alcance: 1.12 },
            especial: {
                nome: 'Lança de Energia', tipo: 'projeteis',
                comando: ['b'], botao: 'punch', carga: 'b',
                startup: 12, ativo: 8, recuperacao: 18, frame: 10,
                projeteis: [{ velocidade: 620, dano: 13, y: -92, cor: 0xc084fc, nucleo: 0xf5f3ff, raio: 18, duracao: 2400 }]
            },
            contra: {
                nome: 'Contra-Grua', tipo: 'contra',
                comando: ['b'], botao: 'kick', carga: 'd',
                startup: 2, ativo: 16, recuperacao: 16, frame: 12,
                contra: { dano: 14, alcance: 96, tremor: 8 }
            },
            super: {
                nome: 'Chuva de Mil Flores', tipo: 'projeteis',
                comando: ['b'], botao: 'super', carga: 'b',
                startup: 8, ativo: 20, recuperacao: 24, frame: 10,
                projeteis: [
                    { velocidade: 640, dano: 9, y: -106, cor: 0xe879f9, nucleo: 0xffffff, raio: 18, duracao: 2600 },
                    { velocidade: 640, dano: 9, y: -68, cor: 0xc084fc, nucleo: 0xffffff, raio: 18, duracao: 2600 }
                ]
            },
            estilo: { forma: 'zoner', agressao: 0.34, defesaNivel: 0.85, recuo: 0.35, preferido: 'k.C' }
        },
        {
            id: 'luana', nome: 'LUANA', titulo: 'A Faísca',
            frase: 'Piscou, eu já estou do outro lado!',
            descricao: 'Velocidade pura: bate pouco, mas anda como um raio e sobe com um chute elétrico de vários acertos.',
            paleta: paleta({ roupa: 0x06b6d4, roupaEscura: 0x164e63, luva: 0xf0f9ff, luvaEscura: 0x7dd3fc, cabelo: 0xfbbf24, detalhe: 0x22d3ee, aura: 0x67e8f9, calcas: 0x0e7490, calcasEscura: 0x083344 }),
            corpo: 'magro', cabelo: 'rabicho',
            atributos: { vida: 0.86, velocidade: 1.34, forca: 0.82, defesa: 1.06, alcance: 1.00 },
            especial: {
                nome: 'Subida Elétrica', tipo: 'melee',
                comando: ['d', 'u'], botao: 'punch',
                startup: 3, ativo: 14, recuperacao: 20, frame: 11,
                melee: { sequencia: [5, 5, 6, 7], paraCima: true, impulsoY: -420, hitbox: [6, -128, 64, 118] }
            },
            super: {
                nome: 'Tempestade Faísca', tipo: 'melee',
                comando: ['d', 'u'], botao: 'super',
                startup: 2, ativo: 32, recuperacao: 26, frame: 11,
                melee: { sequencia: [4, 4, 5, 5, 6, 8], paraCima: true, derruba: true, impulsoY: -520, hitbox: [2, -148, 80, 142] }
            },
            estilo: { forma: 'veloz', agressao: 0.74, defesaNivel: 0.40, recuo: 0.55, preferido: 'k.S' }
        },
        {
            id: 'bento', nome: 'BENTO', titulo: 'O Fera da Selva',
            frase: 'Grrr! (Isso significa "bom dia", normalmente.)',
            descricao: 'Selvagem: cospe fogo, avança em quatro patas e morde quem passar perto demais. Indomável!',
            paleta: paleta({ roupa: 0x16a34a, roupaEscura: 0x064e3b, luva: 0xfb923c, luvaEscura: 0x9a3412, cabelo: 0xf97316, detalhe: 0xfef08a, aura: 0x4ade80, calcas: 0x14532d, calcasEscura: 0x022c22, pele: 0x65a30d, peleEscura: 0x3f6212 }),
            corpo: 'pesado', cabelo: 'moicano',
            atributos: { vida: 1.06, velocidade: 1.06, forca: 1.04, defesa: 1.00, alcance: 1.20 },
            especial: {
                nome: 'Baforada de Fogo', tipo: 'projeteis',
                comando: ['d', 'u'], botao: 'punch',
                startup: 10, ativo: 10, recuperacao: 20, frame: 12,
                projeteis: [{ velocidade: 520, dano: 10, y: -104, cor: 0xf97316, nucleo: 0xfef08a, raio: 20, duracao: 1500, arco: 240, fogo: true }]
            },
            super: {
                nome: 'Fúria Selvagem', tipo: 'investida',
                comando: ['d', 'u'], botao: 'super',
                startup: 6, ativo: 26, recuperacao: 28, frame: 8,
                investida: { velocidade: 640, sequencia: [8, 8, 10, 10, 12], hitbox: [12, -118, 82, 78] }
            },
            estilo: { forma: 'selvagem', agressao: 0.78, defesaNivel: 0.30, recuo: 0.15, preferido: 'p.S' }
        }
    ];

    /* =================================================================
       ETAPA 4 — DETECTOR DE COMANDOS ESPECIAIS
       -----------------------------------------------------------------
       Aqui mora o segredo de todo jogo de luta: transformar uma SEQUÊNCIA
       de setas em um golpe especial.

       Explicado para uma criança de 8 anos:
         1. A cada quadro olhamos as setas e guardamos um "riscinho":
            f (frente), b (trás), d (baixo), u (cima), df, db.
            Nenhuma seta pressionada = 'n' (neutro, mãos no bolso).
         2. Quando um botão é apertado, pegamos a listinha dos últimos
            riscinhos e procuramos, DE TRÁS PARA FRENTE, o caminho do
            golpe. Exemplo do golpe de fogo: f -> d -> df -> f
         3. Para o jogo não ficar injusto, cada passo precisa acontecer
            dentro de FLEXIVEL_MS milissegundos do anterior, e entre um
            toque e outro o jogador pode (e deve) soltar as setas.

       Esse "puxadinho" tolerante se chama BUFFER de comandos. É o que faz
       o jogo parecer esperto mesmo quando você aperta os botões tortos.
       ================================================================= */
    const ACEITOS_PARA_FRENTE = ['d', 'df', 'f'];

    function normalizarPasso(passo) {
        // Aceitamos 'd' ou 'df' no lugar de 'f' em diagonais de baixo.
        return ACEITOS_PARA_FRENTE.indexOf(passo) >= 0 ? 'f' : passo;
    }

    /**
     * Procura a sequência `comando` dentro de `historico` (mais recente no fim).
     * @returns {boolean} true se o comando foi completado exatamente agora.
     */
    function comandoCompletado(historico, comando) {
        if (!comando || comando.length === 0) return false;
        if (!historico || historico.length === 0) return false;

        // O último passo do comando tem que ser o último toque feito.
        const ultimo = historico[historico.length - 1];
        if (normalizarPasso(ultimo.passo) !== normalizarPasso(comando[comando.length - 1])) {
            return false;
        }

        let alvo = comando.length - 1;
        let tempoLimite = Infinity;
        for (let i = historico.length - 1; i >= 0 && alvo >= 0; i--) {
            const item = historico[i];
            if (normalizarPasso(item.passo) === normalizarPasso(comando[alvo])) {
                if (alvo < comando.length - 1 && (tempoLimite - item.tempo) > FLEXIVEL_MS) {
                    return false; // demorou demais entre um toque e outro
                }
                tempoLimite = item.tempo;
                alvo--;
            }
        }
        return alvo < 0;
    }

    /** Símbolos bonitos para mostrar o comando na tela e no README. */
    const SIMBOLOS = {
        f: '→', b: '←', d: '↓', u: '↑', n: '·', df: '↘', db: '↙',
        punch: 'S', kick: 'C', super: 'S+C'
    };

    function comandoParaTexto(comando, botao) {
        const setas = comando.map(function (p) { return SIMBOLOS[p] || p; }).join(' ');
        return setas + ' + ' + (SIMBOLOS[botao] || botao);
    }

    /** Monta a "lista de golpes" exibida na tela de seleção e no fim da luta. */
    function golpesDoPersonagem(personagem) {
        const lista = [];
        const e = personagem.especial;
        if (e) lista.push({ nome: e.nome, texto: comandoParaTexto(e.comando, e.botao), tipo: 'especial' });
        if (personagem.contra) {
            const c = personagem.contra;
            lista.push({ nome: c.nome, texto: comandoParaTexto(c.comando, c.botao), tipo: 'contra' });
        }
        const s = personagem.super;
        if (s) lista.push({ nome: s.nome, texto: comandoParaTexto(s.comando, s.botao), tipo: 'super' });
        if (e && e.carga) lista.push({ nome: 'Carga', texto: 'segure ' + (e.carga === 'b' ? '←' : '↓') + ' por 1s', tipo: 'ajuda' });
        return lista;
    }

    /* =================================================================
       ETAPA 5 — O CÉREBRO DA MÁQUINA (IA)
       -----------------------------------------------------------------
       A IA é uma "máquina de estados simples": a cada quadro ela mede a
       DISTÂNCIA até o oponente e escolhe uma ação. Só três números mandam
       no jeito de lutar dela:

         agressao   : de 0 a 1. Quanto maior, mais ela ataca em vez de esperar.
         defesaNivel: de 0 a 1. Chance de bloquear quando você vai bater.
         recuo      : de 0 a 1. Chance de pular para trás quando apanha.

       A DIFICULDADE muda basicamente tempoReacao (milissegundos que a
       máquina "demora para enxergar") e a taxa de erros. Fácil = lenta e
       meio atrapalhada. Impossível = vê tudo e pune na hora. Simples, né?
       ================================================================= */
    const DIFICULDADES = [
        { nome: 'Fácil', tempoReacao: 340, agressao: 0.32, defesa: 0.20, erro: 0.42, botaoChance: 0.30 },
        { nome: 'Normal', tempoReacao: 190, agressao: 0.55, defesa: 0.48, erro: 0.22, botaoChance: 0.55 },
        { nome: 'Difícil', tempoReacao: 110, agressao: 0.74, defesa: 0.72, erro: 0.10, botaoChance: 0.74 },
        { nome: 'Impossível', tempoReacao: 45, agressao: 0.92, defesa: 0.92, erro: 0.02, botaoChance: 0.95 }
    ];

    // Distâncias (em pixels) que formam o "mapa mental" da máquina.
    const ZONA = {
        encostado: 96,   // cola-cola: é hora da projeção (96px = alcance real do agarrão)
        curto: 130,      // alcance dos socos
        medio: 240,      // alcance dos chutes
        longo: 460       // longe demais: dá para andar, carregar ou lançar energia
    };

    /* =================================================================
       ETAPA 6 — SOM GERADO POR CÓDIGO (sem nenhum arquivo de áudio)
       -----------------------------------------------------------------
       Usamos a Web Audio API do navegador (não tem nada a ver com Phaser).
       Cada efeito sonoro é um pedacinho de onda desenhado por nós mesmos:

         oscilar(frequencia, duracao, tipo, volume, descida) -> "beeep"/"vwoosh"
         bater(duracao, corte, volume)                       -> "puf" de impacto

       É a melhor porta de entrada para áudio em jogos: dá para OUVIR a
       matemática acontecendo. Aperte [M] durante a luta para calar tudo.
       ================================================================= */
    class AudioJogo {
        constructor() {
            this.ctx = null;
            this.mestre = null;
            this.mudo = false;
        }
        ligar() {
            if (this.ctx) return;
            if (typeof window === 'undefined') return;
            const Contexto = window.AudioContext || window.webkitAudioContext;
            if (!Contexto) return;
            try {
                this.ctx = new Contexto();
                this.mestre = this.ctx.createGain();
                this.mestre.gain.value = 0.35;
                this.mestre.connect(this.ctx.destination);
            } catch (erro) {
                this.ctx = null;
            }
        }
        alternarMudo() { this.mudo = !this.mudo; return this.mudo; }

        /** Um tom simples que sobe ou desce em frequência. */
        oscilar(frequencia, duracao, tipo, volume, descida) {
            if (this.mudo) return;
            this.ligar();
            if (!this.ctx) return;
            const agora = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const ganho = this.ctx.createGain();
            osc.type = tipo || 'sine';
            osc.frequency.setValueAtTime(frequencia, agora);
            if (descida) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(40, frequencia * descida), agora + duracao);
            }
            ganho.gain.setValueAtTime(0.0001, agora);
            ganho.gain.exponentialRampToValueAtTime(volume || 0.25, agora + 0.012);
            ganho.gain.exponentialRampToValueAtTime(0.0001, agora + duracao);
            osc.connect(ganho);
            ganho.connect(this.mestre);
            osc.start(agora);
            osc.stop(agora + duracao + 0.03);
        }

        /** Ruído branco filtrado: serve de "impacto". */
        bater(duracao, corte, volume) {
            if (this.mudo) return;
            this.ligar();
            if (!this.ctx) return;
            const agora = this.ctx.currentTime;
            const amostras = Math.max(1, Math.floor(this.ctx.sampleRate * duracao));
            const buffer = this.ctx.createBuffer(1, amostras, this.ctx.sampleRate);
            const dados = buffer.getChannelData(0);
            for (let i = 0; i < amostras; i++) {
                dados[i] = (Math.random() * 2 - 1) * (1 - i / amostras);
            }
            const fonte = this.ctx.createBufferSource();
            fonte.buffer = buffer;
            const filtro = this.ctx.createBiquadFilter();
            filtro.type = 'lowpass';
            filtro.frequency.value = corte || 900;
            const ganho = this.ctx.createGain();
            ganho.gain.value = volume || 0.5;
            fonte.connect(filtro);
            filtro.connect(ganho);
            ganho.connect(this.mestre);
            fonte.start(agora);
        }

        /* Efeitos prontos com nomes que a criança entende: */
        soco() { this.oscilar(215, 0.11, 'square', 0.15, 0.5); this.bater(0.09, 700, 0.40); }
        chute() { this.oscilar(150, 0.15, 'sawtooth', 0.15, 0.45); this.bater(0.13, 520, 0.48); }
        bloqueio() { this.oscilar(880, 0.06, 'square', 0.10, 0.7); this.bater(0.05, 2400, 0.16); }
        vento() { this.oscilar(520, 0.10, 'triangle', 0.07, 0.6); }
        energia() { this.oscilar(660, 0.28, 'sine', 0.14, 1.9); }
        pulo() { this.oscilar(330, 0.14, 'triangle', 0.09, 2.1); }
        cair() { this.bater(0.20, 320, 0.55); }
        ko() { this.oscilar(160, 0.70, 'sawtooth', 0.20, 0.25); this.bater(0.40, 400, 0.65); }
        super() { this.oscilar(300, 0.50, 'square', 0.12, 3.2); this.oscilar(150, 0.75, 'sawtooth', 0.13, 0.4); }
        menu() { this.oscilar(760, 0.055, 'square', 0.10); }
        confirmar() { this.oscilar(520, 0.09, 'square', 0.12); this.oscilar(790, 0.17, 'square', 0.09); }
        apito() { this.oscilar(1250, 0.12, 'sine', 0.15); this.oscilar(1580, 0.10, 'sine', 0.11); }

        /* ----- efeitos novos (v2) ----- */
        // golpe pesado: um baque grave, com o ruído logo depois do tom
        golpePesado() { this.oscilar(96, 0.22, 'sine', 0.35, 0.5); this.bater(0.18, 420, 0.75); }
        // pegada leve (corrida / pouso rápido)
        passo() { this.bater(0.05, 320, 0.22); }
        // agarrão: clec curto e seco
        agarrao() { this.oscilar(140, 0.18, 'square', 0.14, 0.5); this.bater(0.10, 600, 0.55); }
        // projétil saindo: assobio que desce
        projetil() { this.oscilar(1100, 0.22, 'sawtooth', 0.05, 0.25); this.bater(0.20, 2200, 0.12); }
        // explosão de projétil: ruído grave + estalo
        explosao() { this.bater(0.45, 1100, 0.6); this.oscilar(210, 0.35, 'square', 0.10, 0.2); }
        // trovão: rugido grave e longo (usado pelo relâmpago do fundo)
        trovao() { this.bater(1.8, 200, 0.9); this.oscilar(52, 1.4, 'sine', 0.22, 0.7); }
        // supremo pronto: três notas subindo
        superPronto() {
            this.oscilar(523, 0.12, 'triangle', 0.14);
            setTimeout(() => this.oscilar(659, 0.12, 'triangle', 0.14), 90);
            setTimeout(() => this.oscilar(1046, 0.30, 'triangle', 0.16), 180);
        }
        // sino de início de round
        sino() { this.oscilar(880, 0.9, 'sine', 0.25, 0.97); this.oscilar(1320, 0.7, 'sine', 0.12, 0.98); }
        // fanfarra de vitória: arpejo maior
        vitoria() {
            [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.oscilar(f, 0.22, 'square', 0.12), i * 130));
            setTimeout(() => this.oscilar(1046, 0.6, 'triangle', 0.18), 560);
        }
    }

    const audio = new AudioJogo();

    /* =================================================================
       ETAPA 7 — CONFIGURAÇÃO DO PHASER + EXPORTAÇÃO
       -----------------------------------------------------------------
       Tanto o index.html (modo "abrir e jogar") quanto o React usam a
       MESMA configuração. É o princípio DRY: "Don't Repeat Yourself"
       (não repita a si mesmo) — escrevemos uma vez e usamos em dois lugares.

       Truques de URL para o professor:
         ?physics   mostra as caixas de colisão (hitbox/hurtbox) em verde e vermelho
         ?semzoom   desliga o zoom dinâmico da câmera
       ================================================================= */
    function criarConfiguracao(parent, extra) {
        const busca = (typeof window !== 'undefined') ? new URLSearchParams(window.location.search) : null;
        const config = {
            type: Phaser.AUTO,
            width: LARGURA_TELA,
            height: ALTURA_TELA,
            parent: parent,
            backgroundColor: '#0b1120',
            pixelArt: true,
            scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: GRAVIDADE },
                    debug: !!(busca && busca.has('physics'))
                }
            },
            // As cenas entram nesta ordem: título -> seleção -> luta -> resultado.
            // (o Phaser só mostra uma por vez; as outras ficam "dormindo")
            scene: [window.MENUS.Titulo, window.MENUS.Selecao, window.CENAS.Luta, window.MENUS.Resultado]
        };
        // o React (e o aluno) pode acrescentar opções sem copiar este bloco todo
        if (typeof extra !== 'undefined' && extra) Object.assign(config, extra);
        return config;
    }

    return {
        LARGURA_TELA, ALTURA_TELA, LARGURA_MUNDO, ALTURA_MUNDO, CHAO_Y, GRAVIDADE, PULO_VELOCIDADE,
        QUADROS_POR_SEGUNDO, VIDA_MAXIMA, VIDA_TREINO, SUPER_MAXIMO, SUPER_DANO_CAUSADO, SUPER_DANO_RECEBIDO,
        SEGUNDOS_POR_ROUND, ROUNDS_PARA_VENCER, REBOTE_DANO,
        FLEXIVEL_MS, CARGA_MS, CARGA_JANELA_MS,
        ANDAR_VELOCIDADE, CORRIDA_MULT, EMPURRAO_DANO, EMPURRAO_BLOQUEIO,
        NOMES_MODOS, NOMES_DIFICULDADE,
        ATAQUES, ELENCO, DIFICULDADES, ZONA, SIMBOLOS,
        comandoCompletado, comandoParaTexto, golpesDoPersonagem,
        audio, criarConfiguracao
    };
})();

/* A linha abaixo é a "ponte" que faz o mesmo arquivo funcionar no React. */
if (typeof window !== 'undefined') { window.DADOS = DADOS; }
