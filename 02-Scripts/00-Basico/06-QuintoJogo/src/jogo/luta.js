/* =====================================================================
   QUINTO JOGO — ARENA RELÂMPAGO
   ---------------------------------------------------------------------
   ARQUIVO 4 DE 4 — A CENA DA LUTA (lutador + arena + HUD + rounds)
   =====================================================================
   Este é o arquivo onde tudo se encontra: os números (dados.js), os
   desenhos (desenhos.js) e o cérebro da máquina (ia.js).

   Trilha didática — procure pelas ETAPAS:
     ETAPA 1  Lutador: o esqueleto (sprite + corpo físico + caixas)
     ETAPA 2  Entrada: teclado, gamepad e máquina viram a mesma coisa
     ETAPA 3  Direções: buffer de comandos e golpe de carga (charge)
     ETAPA 4  Botões: a "árvore de decisão" de soco, chute e S+C
     ETAPA 5  Movimento: andar, correr, pular, agachar e virar de lado
     ETAPA 6  Ataque: a linha do tempo preparo -> ativo -> recuperação
     ETAPA 7  Dano: acerto, bloqueio, rebote, combo, queda e projeção
     ETAPA 8  Projéteis: a bola de energia (movimento manual, sem mágica)
     ETAPA 9  A arena desenhada por código
     ETAPA 10 HUD, fita de comandos e a câmera que segue a luta
     ETAPA 11 Rounds, relógio, K.O. e fim de partida

   >> Curiosidade para o aluno: as caixas de um golpe usam MATEMÁTICA
      simples. Se o lutador olha para a esquerda, só espelhamos o eixo X:
            xNoMundo = xDoLutador - (xDoGolpe + larguraDoGolpe)
      Isso se chama "transformação de espaço local para espaço do mundo".
   ===================================================================== */

const LUTA = (function () {
    'use strict';

    const D = window.DADOS;
    const ARTE = window.DESINHOS;
    const P = window.IA;

    const FR = function (segundos) { return Math.max(1, Math.round(segundos * 60)); };
    const FONTE = 'Trebuchet MS';
    const PE = ARTE.QUADRO_A - 6;           // pés dentro do frame (origem do sprite)
    const BUFFER_MS = 160;                  // tolerância para "apertei quase junto"

    /* =================================================================
       ETAPA 2 — ENTRADA UNIFICADA (teclado + gamepad)
       -----------------------------------------------------------------
       O Lutador nunca lê "seta direita" diretamente. Ele pede:
       "quero saber se o jogador 1 está indo PARA FRENTE agora".
       Assim, trocar de teclado para gamepad não muda NADA no resto do jogo.
       ================================================================= */
    const MAPAS_TECLAS = {
        1: {
            esquerda: ['LEFT'], direita: ['RIGHT'], baixo: ['DOWN'], cima: ['UP'],
            soco: ['A', 'F'], chute: ['D', 'G'], turbo: ['E']
        },
        2: {
            esquerda: ['H'], direita: ['L'], baixo: ['J'], cima: ['K'],
            soco: ['Y'], chute: ['U'], turbo: ['T']
        }
    };
    const NOMES_BOTOES = ['esquerda', 'direita', 'baixo', 'cima', 'soco', 'chute', 'turbo'];
    const NOMES_GAMEPAD = { 12: 'cima', 13: 'baixo', 14: 'esquerda', 15: 'direita', 2: 'soco', 3: 'chute', 5: 'turbo', 4: 'turbo' };

    class LeitorDeEntrada {
        constructor(cena, numero) {
            const mapa = MAPAS_TECLAS[numero];
            this.cena = cena;
            this.numero = numero;
            this.teclas = {};
            this.memoria = {};
            this.buffer = {};
            NOMES_BOTOES.forEach(function (nome) {
                this.teclas[nome] = mapa[nome].map(function (tecla) {
                    return cena.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[tecla]);
                });
            }, this);
        }

        gamepadUsado() {
            const gerentes = this.cena.input.gamepad;
            let lista = [];
            if (gerentes && gerentes.getGMGamepads) {
                lista = gerentes.getGMGamepads() || [];
            } else if (navigator.getGamepads) {
                lista = Array.prototype.slice.call(navigator.getGamepads());
            }
            for (let i = 0; i < lista.length; i++) {
                const p = lista[i];
                if (p && p.buttons && p.buttons.length > 5) return p;
            }
            return null;
        }

        /** Lê tudo e devolve {esquerda, direita, baixo, cima, soco, chute, turbo}. */
        ler() {
            const agora = this.cena.time.now;
            const saida = {};
            NOMES_BOTOES.forEach(function (nome) {
                let pressionado = false;
                let novo = false;
                const lista = this.teclas[nome];
                for (let i = 0; i < lista.length; i++) {
                    if (lista[i].isDown) pressionado = true;
                    if (Phaser.Input.Keyboard.JustDown(lista[i])) novo = true;
                }
                if (novo) this.buffer[nome] = agora;
                const noBuffer = agora - (this.buffer[nome] || -999999) < BUFFER_MS;
                saida[nome] = pressionado || noBuffer;
                if (!pressionado && !noBuffer) this.buffer[nome] = -999999;
            }, this);

            const pad = this.gamepadUsado();
            if (pad) {
                const eixoX = pad.axes[0] || 0;
                const eixoY = pad.axes[1] || 0;
                const apertado = function (i) { return !!(pad.buttons[i] && (pad.buttons[i].pressed || pad.buttons[i].value > 0.4)); };
                if (eixoX < -0.35) saida.esquerda = true;
                if (eixoX > 0.35) saida.direita = true;
                if (eixoY > 0.35) saida.baixo = true;
                if (eixoY < -0.35) saida.cima = true;
                for (const indice in NOMES_GAMEPAD) {
                    const nome = NOMES_GAMEPAD[indice];
                    const agoraApertado = apertado(Number(indice));
                    if (agoraApertado && !this.memoria[nome]) this.buffer[nome] = agora;
                    if (agoraApertado) saida[nome] = true;
                    this.memoria[nome] = agoraApertado;
                }
            }
            return saida;
        }
    }

    /* =================================================================
       ETAPA 1 — O LUTADOR
       ================================================================= */
    class Lutador {
        constructor(cena, numero, cfg) {
            this.cena = cena;
            this.numero = numero;
            this.personagem = cfg.personagem;
            this.controle = cfg.controle || 'teclado';
            this.dificuldade = cfg.dificuldade;

            const textura = ARTE.gerarSpritesheet(cena, this.personagem);
            const xInicial = numero === 1 ? 620 : 980;
            this.sprite = cena.physics.add.sprite(xInicial, D.CHAO_Y, textura, 0);
            this.sprite.setOrigin(0.5, PE / ARTE.QUADRO_A);
            this.sprite.setScale(1.35);
            this.sprite.setDepth(10 + numero);
            this.sprite.dono = this;                     // quem manda neste sprite

            const corpo = this.sprite.body;
            corpo.setSize(48, 100, false);
            corpo.setOffset((ARTE.QUADRO_L - 48) / 2, ARTE.QUADRO_A - 100 - (ARTE.QUADRO_A - PE));
            corpo.setCollideWorldBounds(true);
            corpo.setBounce(0, 0);
            corpo.setAllowGravity(true);
            corpo.setDamping(true);
            corpo.setDrag(0, 7.5);
            corpo.setMaxVelocity(900, 1500);

            this.sombra = cena.add.image(xInicial, D.CHAO_Y + 8, 'sombra').setDepth(5).setScale(1.5);

            this.direita = numero === 1;                 // true = olhando para a direita
            this.forcaStat = this.personagem.atributos.forca;
            this.defesa = this.personagem.atributos.defesa;
            this.vidaMax = Math.round(D.VIDA_MAXIMA * this.personagem.atributos.vida);
            this.vida = cena.treino ? D.VIDA_TREINO : this.vidaMax;
            this.superCarga = 0;
            this.andar = D.ANDAR_VELOCIDADE * this.personagem.atributos.velocidade;

            this.cru = this.vazio();
            this.ant = this.vazio();
            this.historico = [];
            this.ultimaDirecao = 'n';
            this.cargas = { b: 0, d: 0 };
            this.cargaSoltou = { b: -999999, d: -999999 };
            this.simulado = [];

            this.ataqueAtual = null;
            this.framesDoAtaque = 0;
            this.comecouAtivo = false;
            this.jaAcertou = false;
            this.contadorDeAcertos = 0;
            this.invencivelAte = 0;
            this.estaInvencivel = false;
            this.emContra = false;
            this.lancado = false;
            this.hitstun = 0;
            this.blockstun = 0;
            this.knockdown = 0;
            this.estaAgarrado = false;
            this.agarrando = false;

            this.comboAtual = 0;
            this.comboDano = 0;
            this.comboAte = 0;
            this.maiorCombo = 0;
            this.danoCausado = 0;
            this.quadrosAndando = 0;
            this.correrAte = 0;
            this.toqueFrente = -999999;
            this.estavaNoAr = false;
            this.turbo = false;

            if (this.controle === 'cpu') {
                this.ia = new P.Cerebro(this, null, this.dificuldade, 1000 + numero * 991);
            } else {
                this.leitor = new LeitorDeEntrada(cena, numero);
            }
        }

        vazio() {
            const v = {};
            NOMES_BOTOES.forEach(function (n) { v[n] = false; });
            return v;
        }

        get inimigo() { return this.cena.lutadores[this.numero === 1 ? 1 : 0]; }
        get corpo() { return this.sprite.body; }
        // ETAPA 1: "estar no chão" = o PÉ (a origem do sprite) encostou a linha do chão.
        get chao() { return this.sprite.y >= D.CHAO_Y - 2 || this.corpo.blocked.down; }
        get noAr() { return !this.chao; }
        get sinal() { return this.direita ? 1 : -1; }
        /** Nome "amigável" usado pela IA (ia.js) para saber para onde este lutador olha. */
        get miraParaDireita() { return this.direita; }
        get semControle() {
            return this.hitstun > 0 || this.knockdown > 0 || this.estaAgarrado ||
                this.blockstun > 0 || this.cena.semControle;
        }
        get noAtivo() {
            const at = this.ataqueAtual;
            return !!at && this.framesDoAtaque > at.startup && this.framesDoAtaque <= at.startup + at.ativo;
        }

        /* ---------------------------------------------------------------
           ETAPA 3 — HISTÓRICO DE SETAS, BUFFER E CARGAS
           --------------------------------------------------------------- */
        atualizarDirecoes() {
            const r = this.cru;
            const frente = r[this.direita ? 'direita' : 'esquerda'];
            const tras = r[this.direita ? 'esquerda' : 'direita'];
            let token = 'n';
            if (r.baixo && frente) token = 'df';
            else if (r.baixo && tras) token = 'db';
            else if (r.cima && frente) token = 'uf';
            else if (r.cima && tras) token = 'ub';
            else if (r.cima) token = 'u';
            else if (r.baixo) token = 'd';
            else if (frente) token = 'f';
            else if (tras) token = 'b';

            if (token !== this.ultimaDirecao) {
                // a direção mudou: guardamos a NOVA e também o retorno ao neutro
                if (this.ultimaDirecao !== 'n' && token === 'n') this.registrar('n');
                this.registrar(token);
                this.ultimaDirecao = token;
            }

            const trasSegurada = r[this.direita ? 'esquerda' : 'direita'];
            const agora = this.cena.time.now;
            const umMs = 1000 / 60;
            if (trasSegurada && this.chao) this.cargas.b = Math.min(D.CARGA_MS + 600, this.cargas.b + umMs);
            else if (this.cargas.b > 0) { this.cargaSoltou.b = agora; this.cargas.b = 0; }
            if (r.baixo && this.chao) this.cargas.d = Math.min(D.CARGA_MS + 600, this.cargas.d + umMs);
            else if (this.cargas.d > 0) { this.cargaSoltou.d = agora; this.cargas.d = 0; }

            this.simulado = this.simulado.filter(function (item) { return agora - item.tempo < 400; });
        }

        registrar(token) {
            const agora = this.cena.time.now;
            const ultimo = this.historico[this.historico.length - 1];
            if (ultimo && ultimo.passo === token && agora - ultimo.tempo < 600) return;
            this.historico.push({ passo: token, tempo: agora });
            if (this.historico.length > 10) this.historico.shift();
        }

        /** Lista de comandos que o detector vai consultar (jogador + máquina).
            Os dois pedaços são misturados e ORGANIZADOS PELO TEMPO: sem isso,
            a seta "fingida" pela máquina chegava depois da seta real e o
            desenho ↓ ↑ nunca fechava (bug que só aparecia no CPU vs CPU!). */
        get comandosVisiveis() {
            return this.historico.concat(this.simulado)
                .sort(function (a, b) { return a.tempo - b.tempo; });
        }

        /** A máquina usa isto para "digitar" as setas do meio do caminho.
            Repare no `agora - ...`: ela registra o passado recentíssimo, porque
            o aperto do botão (o último passo) acontece NESTE mesmo quadro. */
        simularCaminho(passos) {
            const agora = this.cena.time.now;
            for (let i = 0; i < passos.length; i++) {
                this.simulado.push({ passo: passos[i], tempo: agora - (passos.length - i) * 12 });
            }
        }

        /** Golpe de carga: segurou tempo suficiente? */
        cargaPronta(nome) {
            const carregada = this.cargas[nome] >= D.CARGA_MS;
            const soltouHaPouco = this.cena.time.now - this.cargaSoltou[nome] < D.CARGA_JANELA_MS;
            return carregada || soltouHaPouco;
        }

        nivelDeCarga(nome) {
            return Math.min(1, Math.max(this.cargas[nome], this.cargaSoltou[nome] > this.cena.time.now - 120 ? D.CARGA_MS : 0) / D.CARGA_MS);
        }

        /* ---------------------------------------------------------------
           ETAPA 4 — A ÁRVORE DE DECISÃO DOS BOTÕES
           --------------------------------------------------------------- */
        novo(botao) { return !!(this.cru[botao] && !this.ant[botao]); }

        processarBotoes() {
            if (this.semControle) return;
            const socoNovo = this.novo('soco');
            const chuteNovo = this.novo('chute');
            if (!socoNovo && !chuteNovo) return;
            const doisJuntos = (socoNovo && chuteNovo) || (this.cru.soco && this.cru.chute);

            this.turbo = !!this.cru.turbo;

            /* REGrA DE OURO DOS JOGOS DE LUTA: quem está no meio de um golpe
               não pode começar outro. O ÚNICO corte permitido é o "cancelamento"
               (soco que acerta -> emenda especial/supremo), e é exatamente isso
               que `podeCancelar` mede. Sem esta linha, apertar S+C sem parar
               reiniciava o golpe a cada quadro e o lutador ficava travado
               para sempre — um bug que a gente só achou com o teste automático. */
            if (!this.podeCancelar) return;

            if (doisJuntos) {
                if (this.superCarga >= D.SUPER_MAXIMO && this.executarEspecial(this.personagem.super, true)) return;
                if (this.podeAgarrar) { this.usarGolpe('THROW', D.ATAQUES.THROW); this.cena.golpeNaTela(this, 'PROJEÇÃO!'); return; }
            }
            if (this.executarEspecial(this.personagem.especial, false)) return;
            if (this.executarContra()) return;
            if (doisJuntos) { this.usarGolpe(this.cru.baixo ? 'k.B' : 'p.C', D.ATAQUES[this.cru.baixo ? 'k.B' : 'p.C']); return; }

            this.usarGolpeNormal(socoNovo ? 'soco' : 'chute');
        }

        /** "Posso COMEÇAR uma projeção?" — exige estar livre. */
        get podeAgarrar() { return !this.ataqueAtual && this.chao && !this.noAr && this.estaAoAlcanceDeAgarrar; }

        /** "O alvo ainda está no alcance?" — usado durante os frames ativos. */
        get estaAoAlcanceDeAgarrar() {
            const alvo = this.inimigo;
            if (!alvo) return false;
            if (alvo.estaInvencivel || alvo.knockdown > 0 || alvo.estaAgarrado) return false;
            return Math.abs(alvo.sprite.x - this.sprite.x) < D.ATAQUES.THROW.alcance + 24;
        }

        usarGolpeNormal(qual) {
            if (this.ataqueAtual && !this.podeCancelar) return;
            const r = this.cru;
            const forte = this.turbo;
            let nome;
            if (this.noAr) nome = 'a.' + (qual === 'chute' ? 'C' : 'S');
            else if (r.baixo) nome = (qual === 'soco' ? 'p.B' : 'k.B');
            else nome = (qual === 'soco' ? 'p.' : 'k.') + (forte ? 'C' : 'S');
            this.usarGolpe(nome, D.ATAQUES[nome]);
        }

        /** Cancelamento: depois que o golpe ACERTA, dá para emendar outro.
            É assim que nascem os combos! Só especiais e super podem cancelar. */
        get podeCancelar() {
            const at = this.ataqueAtual;
            if (!at) return true;
            if (!at.canc) return false;
            return this.framesDoAtaque >= at.startup + at.ativo && (this.jaAcertou || this.bloqueado);
        }

        /** O especial deste lutador está "carregado"/pronto para sair agora? */
        get especialDisponivel() {
            const e = this.personagem.especial;
            if (!e || !this.podeCancelar || this.estaAgarrado) return false;
            if (this.noAr && !e.aereo) return false;
            return e.carga ? this.cargaPronta(e.carga) : true;
        }

        get tipoDoEspecial() { return this.personagem.especial ? this.personagem.especial.tipo : null; }

        /** O supremo pode ser usado? (barra cheia + corpo livre) */
        get superPronto() { return this.superCarga >= D.SUPER_MAXIMO && this.podeCancelar && !this.noAr; }

        podeLancarEspecial(tipo) {
            const def = this.personagem.especial;
            if (!def || def.tipo !== tipo) return false;
            if (this.noAr && !def.aereo) return false;
            return this.podeCancelar;
        }

        especialPrecisaDeCarga() {
            return !!(this.personagem.especial && this.personagem.especial.carga);
        }

        /** Testa se o jogador acaba de completar o desenho do golpe especial. */
        executarEspecial(def, eSuper) {
            if (!def || !this.podeCancelar) return false;
            const botaoCerto = def.botao === 'super'
                ? (this.cru.soco && this.cru.chute)
                : (def.botao === 'kick' ? this.cru.chute : this.cru.soco);
            if (!botaoCerto) return false;
            if (this.noAr && !def.aereo) return false;
            if (eSuper && this.superCarga < D.SUPER_MAXIMO) return false;

            const caminho = D.comandoCompletado(this.comandosVisiveis, def.comando);
            const carga = def.carga ? this.cargaPronta(def.carga) : false;
            if (!caminho && !carga) return false;

            if (eSuper) this.superCarga = 0;
            this.usarEspecial(def, eSuper);
            return true;
        }

        /** Contra-ataque da DARA: bloqueia o golpe e devolve com juros. */
        executarContra() {
            const c = this.personagem.contra;
            if (!c || this.noAr || this.ataqueAtual) return false;
            if (!this.cru.chute) return false;
            const caminho = D.comandoCompletado(this.comandosVisiveis, c.comando);
            const carga = c.carga ? this.cargaPronta(c.carga) : false;
            if (!(caminho || carga)) return false;
            this.usarEspecial(c, false);
            return true;
        }

        usarEspecial(def, eSuper) {
            const base = def.melee || def.investida || def.contra || {};
            const at = {
                nome: def.nome,
                tipo: def.tipo || 'contra',
                especial: true,
                eSuper: eSuper,
                startup: def.startup,
                ativo: def.ativo,
                recuperacao: def.recuperacao,
                canc: def.canc || 0,
                frame: def.frame === undefined ? 9 : def.frame,
                hitbox: base.hitbox,
                dano: base.dano,
                paraCima: base.paraCima,
                derruba: base.derruba,
                tremor: base.tremor,
                gira: base.gira,
                // `invencivel` vale tanto na ficha do golpe (def.invencivel) quanto
                // na parte corpo-a-corpo (base.invencivel): N frames intocáveis.
                // É o que transforma um golpe que sobe numa REVERSAL de bola de fogo.
                invencivel: base.invencivel || def.invencivel || 0,
                impulsoY: base.impulsoY,
                atravessaBloqueio: base.atravessaBloqueio,
                sequencia: base.sequencia,
                projeteis: def.projeteis,
                investida: def.investida,
                alcance: base.alcance
            };
            this.ataqueAtual = at;
            this.framesDoAtaque = 0;
            this.comecouAtivo = false;
            this.jaAcertou = false;
            this.bloqueado = false;
            this.contadorDeAcertos = 0;
            this.sprite.setFrame(at.frame);
            this.sprite.setRotation(0);
            this.cena.golpeNaTela(this, at.nome + (eSuper ? ' ⚡SUPREMO⚡' : ''), D.comandoParaTexto(def.comando, def.botao));
            if (eSuper) { this.cena.flashDeSuper(this); D.audio.super(); }
            else D.audio.vento();
            // MUITO IMPORTANTE: devolver true. Se devolver "undefined", o
            // processarBotoes acha que o especial NÃO aconteceu e troca por um
            // golpe normal. Esse bug é clássico de quem está aprendendo a return!
            return true;
        }

        usarGolpe(nome, def) {
            if (!def) return;
            this.ataqueAtual = Object.assign({ nome: def.nome || nome, chave: nome }, def);
            this.framesDoAtaque = 0;
            this.comecouAtivo = false;
            this.jaAcertou = false;
            this.bloqueado = false;
            this.contadorDeAcertos = 0;
            this.sprite.setFrame(def.frame === undefined ? 7 : def.frame);
            this.sprite.setRotation(0);
            D.audio.vento();
        }

        /* ---------------------------------------------------------------
           ETAPA 5 — MOVIMENTO
           --------------------------------------------------------------- */
        atualizarMovimento() {
            const r = this.cru;
            if (this.hitstun > 0 || this.knockdown > 0 || this.estaAgarrado) {
                this.andarAtual = 0;
                return;
            }
            if (this.ataqueAtual) {
                // No chão, durante o golpe, a gente trava os pés (como no original).
                if (this.chao) this.corpo.setVelocityX(0);
                this.andarAtual = 0;
                if (this.ataqueAtual.gira) this.corpo.setVelocityX(260 * this.sinal);
                if (this.ataqueAtual.investida && this.noAtivo) this.corpo.setVelocityX(this.ataqueAtual.investida.velocidade * this.sinal);
                return;
            }
            if (this.blockstun > 0) { this.andarAtual = 0; return; }

            const frente = r[this.direita ? 'direita' : 'esquerda'];
            const tras = r[this.direita ? 'esquerda' : 'direita'];
            this.agachado = !!r.baixo && this.chao;

            if (this.noAr) {
                // controle aéreo: pouco, porque pular já é uma aposta arriscada
                if (frente) this.corpo.setVelocityX(150 * this.sinal);
                else if (tras) this.corpo.setVelocityX(-110 * this.sinal);
                this.andarAtual = 0;
                return;
            }

            let velocidade = 0;
            if (this.correrAte > this.cena.frames) velocidade = this.andar * D.CORRIDA_MULT * this.sinal;
            else if (frente) velocidade = this.andar * this.sinal;
            else if (tras) velocidade = -this.andar * 0.8 * this.sinal;
            if (this.agachado) velocidade = 0;

            this.corpo.setVelocityX(velocidade);
            this.andarAtual = velocidade;
            this.quadrosAndando = velocidade !== 0 ? this.cena.frames : this.quadrosAndando;

            // duplo toque para frente = corrida (dash)
            if (frente && this.novo(this.direita ? 'direita' : 'esquerda')) {
                const agora = this.cena.time.now;
                if (agora - this.toqueFrente < 250) this.correrAte = this.cena.frames + 15;
                this.toqueFrente = agora;
            }

            // PULO: só no instante em que o botão APARECE (edge trigger).
            // Por quê? Se baste "segurar para cima", a criança (e a máquina!)
            // sai pulando de novo a cada pouso, sem querer. Gatilho de borda
            // = "apertou soltou apertou". É o mesmo truque usado para soco/chute.
            if (this.novo('cima') && this.chao) {
                const forca = D.PULO_VELOCIDADE * (0.92 + 0.10 * this.personagem.atributos.velocidade);
                // 35% da velocidade de caminhada, NO MESMO sentido do que a
                // pessoa está apertando (pulamos PARA FRENTE, não para trás!).
                this.corpo.setVelocity(velocidade * 0.35, -forca);
                this.sprite.setFrame(6);
                D.audio.pulo();
                this.cena.poeira(this.sprite.x, D.CHAO_Y);
            }
        }

        /* ---------------------------------------------------------------
           ETAPA 6 — A LINHA DO TEMPO DO GOLPE
           --------------------------------------------------------------- */
        atualizarAtaque() {
            const at = this.ataqueAtual;
            if (!at) {
                this.sprite.setFrame(this.frameDeRepouso());
                return;
            }
            this.framesDoAtaque++;

            // --- o momento exato em que o golpe "sai" ---
            if (this.framesDoAtaque === at.startup + 1) {
                this.comecouAtivo = true;
                if (at.invencivel) { this.estaInvencivel = true; this.invencivelAte = this.cena.frames + at.invencivel; }
                if (at.impulsoY && this.chao) this.corpo.setVelocityX(0);
                if (at.impulsoY) { this.corpo.setVelocityY(at.impulsoY); if (at.paraCima) this.lancado = true; }
                if (at.tipo === 'projeteis') this.lancarProjeteis(at);
                if (at.tremor && this.chao) { this.cena.ondaDeChoque(this.sprite.x, D.CHAO_Y, at.eSuper ? 3 : 1); this.cena.tremor(at.tremor); }
                if (at.gira) this.cena.poeira(this.sprite.x, D.CHAO_Y);
            }

            // --- contra-ataque fica ligado apenas durante o ativo ---
            this.emContra = at.tipo === 'contra' && this.noAtivo;

            // --- fim do golpe ---
            if (this.framesDoAtaque >= at.startup + at.ativo + at.recuperacao) {
                this.ataqueAtual = null;
                this.framesDoAtaque = 0;
                this.jaAcertou = false;
                this.contadorDeAcertos = 0;
                this.emContra = false;
                this.sprite.setRotation(0);
                this.sprite.setFrame(this.frameDeRepouso());
                if (at.eSuper) this.cena.cameraDeSuper(false);
            } else if (this.noAtivo && at.sequencia) {
                // golpes de vários acertos: libera um novo acerto a cada N frames
                const porHit = Math.max(3, Math.floor(at.ativo / at.sequencia.length));
                if (Math.floor((this.framesDoAtaque - at.startup) / porHit) !== this.contadorDeAcertos) {
                    this.contadorDeAcertos = Math.floor((this.framesDoAtaque - at.startup) / porHit);
                    this.jaAcertou = false;
                }
            }
            if (this.noAtivo && at.gira) this.sprite.rotation += 0.5;
            if (at.eSuper && this.noAtivo) this.cena.rastroDeSuper(this);
        }

        frameDeRepouso() {
            if (this.knockdown > 0 || (this.lancado && this.noAr)) return 13;
            if (this.hitstun > 0) return 12;
            if (this.noAr) return 6;
            if (this.agachado) return 5;
            if (this.andarAtual !== 0) return 2 + (Math.floor(this.cena.frames / 6) % 3);
            return Math.floor(this.cena.frames / 24) % 2;
        }

        /* ---------------------------------------------------------------
           ETAPA 7 — CAIXAS DE GOLPE E DE FERIMENTO
           --------------------------------------------------------------- */
        get caixaDeGolpe() {
            const at = this.ataqueAtual;
            if (!at || !this.noAtivo || !at.hitbox) return null;
            const dados = at.hitbox;
            const largura = dados[2];
            const x = this.sprite.x + (this.direita ? dados[0] : -dados[0] - largura);
            return new Phaser.Geom.Rectangle(x, this.sprite.y + dados[1], largura, dados[3]);
        }

        get caixaDeFerimento() {
            const x = this.sprite.x;
            const y = this.sprite.y;
            if (this.knockdown > 0) return new Phaser.Geom.Rectangle(x - 36, y - 26, 72, 26);
            if (this.agachado) return new Phaser.Geom.Rectangle(x - 28, y - 66, 56, 64);
            return new Phaser.Geom.Rectangle(x - 22, y - 98, 44, 98);
        }

        /** Só se bloqueia: no chão, com as mãos livres, segurando para TRÁS. */
        podeBloquear(ataque) {
            if (!this.chao || this.ataqueAtual || this.hitstun > 0 || this.knockdown > 0) return false;
            const tras = this.direita ? 'esquerda' : 'direita';
            if (!this.cru[tras]) return false;
            if (ataque && ataque.agarrao) return false;      // projeção fura o bloqueio
            const altura = !ataque || ataque.alturaCaixa === undefined ? 1 : ataque.alturaCaixa;
            if (altura === 2) return true;                    // aéreo: vale dos dois jeitos
            if (altura === 0) return !!this.cru.baixo;        // rasteiro: só agachado
            return !this.cru.baixo;                           // alto: só em pé
        }

        /* ---------------------------------------------------------------
           ETAPA 7 — LEVAR DANO / BLOQUEAR / COMBO
           --------------------------------------------------------------- */
        sofrerDano(danoBase, atacante, at, forcarQueda) {
            if (this.estaInvencivel || this.cena.semControle) return 'nada';
            if (this.vida <= 0) return 'nada';

            // A DARA tem um contra-ataque: se estiver com ele ligado, o golpe dela vence.
            if (this.emContra && !(at && at.tipo === 'contra')) {
                this.cena.contraAtaque(this, atacante, at);
                return 'contra';
            }
            if (at && at.tipo === 'contra') return 'nada';

            if (this.podeBloquear(at) && !(at && at.atravessaBloqueio)) {
                this.sofrerBloqueio(at, atacante);
                return 'bloqueio';
            }

            const multiplicador = (atacante.forcaStat || 1) / (0.55 + 0.45 * (this.defesa || 1));
            let dano = Math.max(1, Math.round(danoBase * multiplicador));
            if (this.cena.treino) dano = Math.round(danoBase);

            this.vida = Math.max(0, this.vida - dano);
            this.superCarga = Math.min(D.SUPER_MAXIMO, this.superCarga + dano * D.SUPER_DANO_RECEBIDO);
            atacante.superCarga = Math.min(D.SUPER_MAXIMO, atacante.superCarga + dano * D.SUPER_DANO_CAUSADO);
            atacante.danoCausado += dano;

            // combo: se eu estava atordoado, a contagem continua
            const emCombo = this.hitstun > 0;
            atacante.comboAtual = emCombo ? atacante.comboAtual + 1 : 1;
            atacante.comboDano = emCombo ? atacante.comboDano + dano : dano;
            atacante.comboAte = this.cena.frames + FR(1.2);
            if (atacante.comboAtual > atacante.maiorCombo) atacante.maiorCombo = atacante.comboAtual;

            this.ataqueAtual = null;
            this.framesDoAtaque = 0;
            this.emContra = false;
            this.hitstun = FR(0.22) + (at && at.paraCima ? FR(0.30) : 0);
            this.agachado = false;
            const empurra = (this.noAr ? 0.55 : 1) * D.EMPURRAO_DANO * (at && at.paraCima ? 0.7 : 1);
            this.corpo.setVelocity(empurra * (this.sprite.x >= atacante.sprite.x ? 1 : -1), at && at.paraCima ? (at.impulsoY ? at.impulsoY * 0.45 : -300) : (this.noAr ? -60 : 0));
            if (at && at.paraCima) this.lancado = true;
            if ((at && at.derruba) || forcarQueda) { this.knockdown = FR(0.55); this.hitstun = 6; this.lancado = false; }

            this.sprite.setFrame(12);
            this.sprite.setTintFill(0xffffff);
            this.cena.time.delayedCall(60, () => { if (this.sprite.active) this.sprite.clearTint(); });
            this.cena.impacto(this, dano, at);
            if (at && at.tremor) this.cena.tremor(at.tremor);
            D.audio[at && (at.tipo === 'melee' || at.tipo === 'investida') ? 'chute' : 'soco']();
            if (at && at.eSuper) this.cena.tremor(14);

            this.cena.verificarFimDeRound();
            return 'acerto';
        }

        sofrerBloqueio(at, atacante) {
            this.blockstun = FR(0.15);
            const raspao = this.cena.treino ? 0 : Math.max(0, Math.round((at && at.dano ? at.dano : 4) * D.REBOTE_DANO));
            this.vida = Math.max(1, this.vida - raspao);
            this.superCarga = Math.min(D.SUPER_MAXIMO, this.superCarga + 3);
            atacante.superCarga = Math.min(D.SUPER_MAXIMO, atacante.superCarga + 1.5);
            const longe = D.EMPURRAO_BLOQUEIO * (at && at.baixo ? 0.7 : 1);
            this.corpo.setVelocityX(-longe * this.sinal);
            atacante.sprite.dono.corpo.setVelocityX(longe * atacante.sinal * 0.6);
            this.cena.escudoDeBloqueio(this);
            atacante.bloqueado = true;      // "meu golpe foi bloqueado" -> já posso cancelar
            this.estaBloqueando = true;
            D.audio.bloqueio();
        }

        /* ---------------------------------------------------------------
           ETAPA 8 — PROJETEIS (lançar)
           --------------------------------------------------------------- */
        lancarProjeteis(at) {
            (at.projeteis || []).forEach(function (info, i) {
                this.cena.criarProjeteil(this, info, i);
            }, this);
        }

        /* ---------------------------------------------------------------
           FÍSICA DE BORDA, QUEDA E SEPARAÇÃO DOS CORPOS
           --------------------------------------------------------------- */
        aplicarFisica() {
            const corpo = this.corpo;
            if (this.chao && corpo.velocity.y > 0) corpo.setVelocityY(0);

            const agoraNoAr = !this.chao;
            if (this.estavaNoAr && !agoraNoAr) this.aoPousar();
            this.estavaNoAr = agoraNoAr;

            if (this.knockdown > 0) {
                this.sprite.setFrame(13);
                if (this.chao) corpo.setVelocityX(corpo.velocity.x * 0.75);
                this.knockdown--;
                if (this.knockdown === 0) {
                    this.estaInvencivel = true;
                    this.invencivelAte = this.cena.frames + FR(0.20);
                    this.lancado = false;
                }
            }
            if (this.estaInvencivel && this.cena.frames > this.invencivelAte) {
                this.estaInvencivel = false;
                this.sprite.setAlpha(1);
            }
            if (this.estaInvencivel && this.knockdown <= 0) this.sprite.setAlpha(this.cena.frames % 6 < 3 ? 0.45 : 1);
            else if (!this.estaInvencivel) this.sprite.setAlpha(1);

            if (this.hitstun > 0) this.hitstun--;
            if (this.blockstun > 0) this.blockstun--;
            if (this.comboAte && this.cena.frames > this.comboAte) { this.comboAtual = 0; this.comboDano = 0; }
            if (!this.ataqueAtual) { this.bloqueado = false; this.estaBloqueando = false; }

            // os dois corpos não podem virar um só
            const alvo = this.inimigo;
            if (alvo && this.chao && alvo.chao && !this.estaAgarrado && !alvo.estaAgarrado) {
                const dx = alvo.sprite.x - this.sprite.x;
                const minimo = 42;
                if (Math.abs(dx) < minimo) {
                    const correcao = (minimo - Math.abs(dx)) / 2;
                    const sinal = dx >= 0 ? 1 : -1;
                    this.sprite.x -= correcao * sinal;
                    alvo.sprite.x += correcao * sinal;
                }
            }
            this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 46, D.LARGURA_MUNDO - 46);
            // O CHÃO: em vez de um corpo invisível, cortamos a queda "na unha".
            // Assim o aluno vê exatamente ONDE a colisão com o chão acontece.
            if (this.sprite.y > D.CHAO_Y) {
                this.sprite.y = D.CHAO_Y;
                this.corpo.setVelocityX(this.corpo.velocity.x * 0.6);
                if (this.corpo.velocity.y > 0) this.corpo.setVelocityY(0);
            }
        }

        aoPousar() {
            this.cena.poeira(this.sprite.x, D.CHAO_Y);
            if (this.lancado || (this.hitstun > 0 && !this.ataqueAtual)) {
                this.lancado = false;
                this.knockdown = Math.max(this.knockdown, FR(0.45));
                this.hitstun = 4;
                this.corpo.setVelocityX(0);
                D.audio.cair();
                this.cena.tremor(this.vida <= 0 ? 12 : 5);
            }
        }

        atualizarVisual() {
            const alturaNoAr = D.CHAO_Y - this.sprite.y;
            const aperto = Phaser.Math.Clamp(1 - alturaNoAr / 260, 0.3, 1);
            this.sombra.setPosition(this.sprite.x, D.CHAO_Y + 10).setScale(1.6 * aperto, 0.9 * aperto);
            this.sombra.setAlpha(0.42 * aperto);
        }

        virarDeLado() {
            const alvo = this.inimigo;
            if (!alvo) return;
            const podeVirar = this.chao && !this.ataqueAtual && this.hitstun <= 0 && this.knockdown <= 0 && !this.estaAgarrado;
            if (!podeVirar) return;
            this.direita = alvo.sprite.x >= this.sprite.x;
            this.sprite.setFlipX(!this.direita);
        }

        atualizar(tempo, delta) {
            this.lerComandos();
            if (this.ia) this.ia.atualizar(tempo, this.cena.frames);
            this.atualizarDirecoes();
            this.virarDeLado();
            this.processarBotoes();
            this.atualizarMovimento();
            this.atualizarAtaque();
            this.aplicarFisica();
            this.atualizarVisual();
            this.desenharBarraDeCarga();
            this.ant = Object.assign({}, this.cru);
            void delta;
        }

        lerComandos() {
            if (this.controle === 'cpu') {
                const p = this.ia ? this.ia.planoAtual : null;
                const cru = this.vazio();
                if (p) NOMES_BOTOES.forEach(function (n) { cru[n] = !!p[n]; });
                this.cru = cru;
            } else {
                this.cru = this.leitor.ler();
            }
        }

        desenharBarraDeCarga() {
            const g = this.cena.hudG;
            const nivelB = this.nivelDeCarga('b');
            const nivelD = this.nivelDeCarga('d');
            if (nivelB < 0.03 && nivelD < 0.03) return;
            const lado = this.numero === 1 ? 40 : D.LARGURA_TELA - 40 - 120;
            g.fillStyle(0x0b1120, 0.9);
            g.fillRect(lado - 3, 158, 126, 16);
            g.fillStyle(0xfbbf24, nivelB >= 1 ? 1 : 0.75);
            g.fillRect(lado, 161, 56 * nivelB, 5);
            g.fillStyle(0x38bdf8, nivelD >= 1 ? 1 : 0.75);
            g.fillRect(lado + 64, 161, 56 * nivelD, 5);
            g.fillStyle(0xe2e8f0, 0.9);
            g.fillRect(lado, 168, 120, 1);
        }
    }

    /* =================================================================
       ETAPAS 9, 10 e 11 — A CENA DA LUTA
       ================================================================= */
    class CenaDeLuta extends Phaser.Scene {
        constructor() { super({ key: 'Luta', active: false, visible: false }); }

        init(dados) {
            this.config = dados || window.ESTADO || {};
            this.treino = this.config.modo === 3;
            this.modo = this.config.modo === undefined ? 0 : this.config.modo;
        }

        create() {
            this.frames = 0;
            this.congelado = false;
            this.semControle = true;
            this.estado = 'intro';
            this.tempoDeEspera = FR(2.6);
            this.round = 1;
            this.vitorias = [0, 0];
            this.projeteis = [];
            this.pausado = false;
            this.mostrarComandos = true;
            this.mostrarFita = true;
            this.mostrarCaixas = !!this.config.mostrarCaixas;
            this.zoomForcado = null;
            this.zoomEm = null;

            this.texturasBase();
            this.criarArena();

            const dif = D.DIFICULDADES[this.config.dificuldade === undefined ? 1 : this.config.dificuldade];
            // O CONTROLE é o que muda entre os 4 modos: quem aperta os botões?
            const p1EhMaquina = this.modo === 2 || this.config.controleP1 === 2;
            const p1 = new Lutador(this, 1, {
                personagem: this.config.p1 || D.ELENCO[0],
                controle: p1EhMaquina ? 'cpu' : 'teclado',
                dificuldade: dif
            });
            const p2 = new Lutador(this, 2, {
                personagem: this.config.p2 || D.ELENCO[7],
                controle: (this.modo === 0 || this.modo === 2 || this.treino) ? 'cpu' : 'teclado',
                dificuldade: dif
            });
            this.lutadores = [p1, p2];
            if (p1.ia) p1.ia.inimigo = p2;
            if (p2.ia) p2.ia.inimigo = p1;

            this.criarChao();
            this.criarHud();

            this.cameras.setBounds(0, 0, D.LARGURA_MUNDO, D.ALTURA_MUNDO);
            this.cameras.main.setBackgroundColor('#0b1120');
            this.zoomAtivo = !(this.config.semZoom || (typeof window !== 'undefined' && window.location.search.indexOf('semzoom') >= 0));
            this.cameras.main.setZoom(this.zoomAtivo ? 1.15 : 1);

            this.teclasGerais = {
                P: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
                ESC: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
                M: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M),
                I: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
                R: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
                V: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V),
                H2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SLASH)
            };

            this.mensagemDeBoasVindas();
            this.time.delayedCall(60, () => this.cameras.main.fadeIn(320, 8, 8, 16));
        }

        texturasBase() {
            ARTE.gerarEfeitos(this);
        }

        /* ---------------------------------------------------------------
           ETAPA 9 — A ARENA (tudo desenhado com linhas e retângulos)
           --------------------------------------------------------------- */
        criarArena() {
            const g = this.add.graphics().setDepth(0);
            const W = D.LARGURA_MUNDO;
            const H = D.ALTURA_MUNDO;

            // céu em degradê (Phaser aceita cor + alpha em cada canto)
            g.fillGradientStyle(0x1e1b4b, 0x312e81, 0x0b1120, 0x111827, 1);
            g.fillRect(0, 0, W, D.CHAO_Y);

            // sol/luar gigante atrás da arena
            g.fillStyle(0xf59e0b, 0.16);
            g.fillCircle(W / 2, D.CHAO_Y - 210, 200);
            g.fillStyle(0xfbbf24, 0.12);
            g.fillCircle(W / 2, D.CHAO_Y - 210, 150);

            // montanhas ao fundo (triângulos!)
            g.fillStyle(0x1e293b, 1);
            for (let i = 0; i < 7; i++) {
                const x = i * 260 - 40;
                g.fillTriangle(x, D.CHAO_Y - 150, x + 150, D.CHAO_Y - 330 - (i % 3) * 40, x + 320, D.CHAO_Y - 150);
            }
            g.fillStyle(0x334155, 1);
            for (let i = 0; i < 9; i++) {
                const x = i * 200 - 60;
                g.fillTriangle(x, D.CHAO_Y - 150, x + 110, D.CHAO_Y - 230 - (i % 2) * 30, x + 230, D.CHAO_Y - 150);
            }

            // plateia: milhares de pontinhos coloridos que piscam
            this.plateia = [];
            for (let i = 0; i < 220; i++) {
                const x = Math.random() * W;
                const y = D.CHAO_Y - 168 - Math.random() * 90;
                const cor = [0x64748b, 0xf87171, 0xfbbf24, 0x38bdf8, 0xa78bfa][Math.floor(Math.random() * 5)];
                const p = this.add.rectangle(x, y, 6, 9, cor, 0.75).setDepth(1);
                this.plateia.push(p);
            }
            g.fillStyle(0x0f172a, 0.9);
            g.fillRect(0, D.CHAO_Y - 150, W, 12);

            // arquibancada de concreto
            g.fillStyle(0x111c31, 1);
            g.fillRect(0, D.CHAO_Y - 138, W, 40);
            g.fillStyle(0x1e293b, 1);
            g.fillRect(0, D.CHAO_Y - 100, W, 8);

            // bandeiras das torcidas
            for (let i = 0; i < 8; i++) {
                const x = 100 + i * 200;
                g.fillStyle(0x0b1120, 1);
                g.fillRect(x - 3, D.CHAO_Y - 300, 6, 160);
                const cor = i % 2 ? 0x38bdf8 : 0xf87171;
                const bandeira = this.add.rectangle(x + 28, D.CHAO_Y - 286, 56, 34, cor, 0.9).setDepth(1);
                this.tweens.add({
                    targets: bandeira, angle: [-4, 5], scaleX: { from: 1, to: 0.86 },
                    duration: 1400 + i * 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }

            // tochas com fogo tremulante
            this.tochas = [];
            for (let i = 0; i < 4; i++) {
                const x = 160 + i * 430;
                const y = D.CHAO_Y - 210;
                g.fillStyle(0x334155, 1); g.fillRect(x - 6, y, 12, 74);
                g.fillStyle(0x7c2d12, 1); g.fillRect(x - 12, y - 10, 24, 12);
                const fogo = this.add.circle(x, y - 22, 13, 0xf97316, 0.95).setDepth(2);
                this.tweens.add({
                    targets: fogo, scaleY: { from: 1.4, to: 0.8 }, scaleX: { from: 0.9, to: 1.15 },
                    y: y - 26, alpha: { from: 0.95, to: 0.6 },
                    duration: 220 + i * 40, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
                this.tochas.push(fogo);
            }
        }

        criarChao() {
            const g = this.add.graphics().setDepth(2);
            const W = D.LARGURA_MUNDO;
            g.fillStyle(0x1f2937, 1);
            g.fillRect(0, D.CHAO_Y, W, D.ALTURA_MUNDO - D.CHAO_Y);
            g.fillStyle(0x334155, 1);
            g.fillRect(0, D.CHAO_Y, W, 10);
            g.fillStyle(0xfbbf24, 0.5);
            g.fillRect(0, D.CHAO_Y + 4, W, 3);
            // linhas de perspectiva do ringue
            g.lineStyle(2, 0x475569, 0.7);
            for (let x = 0; x < W; x += 80) {
                g.beginPath();
                g.moveTo(x, D.CHAO_Y + 12);
                g.lineTo(x + 40, D.ALTURA_MUNDO);
                g.strokePath();
            }
            g.lineStyle(3, 0x0ea5e9, 0.35);
            g.strokeRoundedRectangle(70, D.CHAO_Y + 26, W - 140, 150, 24);

        }

        /* ---------------------------------------------------------------
           ETAPA 10 — HUD: vida, super, tempo, nome, rodadas
           --------------------------------------------------------------- */
        criarHud() {
            this.vidaG = this.add.graphics().setScrollFactor(0).setDepth(120);
            this.hudG = this.add.graphics().setScrollFactor(0).setDepth(121);
            this.topoG = this.add.graphics().setScrollFactor(0).setDepth(122);

            const larguraBarra = 460;
            this.barra = { largura: larguraBarra, altura: 26, y: 46 };

            this.nomeTxt = [
                this.add.text(40, 20, '', { fontFamily: FONTE, fontSize: '21px', fontStyle: 'bold', color: '#f8fafc' }).setScrollFactor(0).setDepth(123),
                this.add.text(D.LARGURA_TELA - 40, 20, '', { fontFamily: FONTE, fontSize: '21px', fontStyle: 'bold', color: '#f8fafc' }).setOrigin(1, 0).setScrollFactor(0).setDepth(123)
            ];
            this.rodadasTxt = [
                this.add.text(520, 24, '', { fontFamily: FONTE, fontSize: '20px', color: '#fbbf24' }).setScrollFactor(0).setDepth(123),
                this.add.text(D.LARGURA_TELA - 520, 24, '', { fontFamily: FONTE, fontSize: '20px', color: '#fbbf24' }).setOrigin(1, 0).setScrollFactor(0).setDepth(123)
            ];
            this.tempoTxt = this.add.text(D.LARGURA_TELA / 2, 34, '60', {
                fontFamily: FONTE, fontSize: '54px', fontStyle: 'bold', color: '#fde047',
                stroke: '#1e293b', strokeThickness: 8
            }).setOrigin(0.5).setScrollFactor(0).setDepth(123);
            this.rotuloTxt = this.add.text(D.LARGURA_TELA / 2, 12, this.treino ? 'MODO TREINO — vida infinita' : 'ROUND ' + this.round + ' de ' + (2 * D.ROUNDS_PARA_VENCER - 1), {
                fontFamily: FONTE, fontSize: '15px', color: '#94a3b8'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(123);

            this.comboTxt = [
                this.add.text(60, 210, '', { fontFamily: FONTE, fontSize: '30px', fontStyle: 'bold', color: '#f97316', stroke: '#0b1120', strokeThickness: 6 }).setScrollFactor(0).setDepth(124),
                this.add.text(D.LARGURA_TELA - 60, 210, '', { fontFamily: FONTE, fontSize: '30px', fontStyle: 'bold', color: '#f97316', stroke: '#0b1120', strokeThickness: 6 }).setOrigin(1, 0).setScrollFactor(0).setDepth(124)
            ];

            this.fitaTxt = [
                this.add.text(40, D.ALTURA_TELA - 60, '', { fontFamily: 'monospace', fontSize: '26px', color: '#7dd3fc' }).setScrollFactor(0).setDepth(124),
                this.add.text(D.LARGURA_TELA - 40, D.ALTURA_TELA - 60, '', { fontFamily: 'monospace', fontSize: '26px', color: '#fca5a5' }).setOrigin(1, 0).setScrollFactor(0).setDepth(124)
            ];
            this.fitaRotulo = [
                this.add.text(40, D.ALTURA_TELA - 84, 'SEUS COMANDOS', { fontFamily: 'monospace', fontSize: '13px', color: '#475569' }).setScrollFactor(0).setDepth(124),
                this.add.text(D.LARGURA_TELA - 40, D.ALTURA_TELA - 84, 'COMANDOS DO RIVAL', { fontFamily: 'monospace', fontSize: '13px', color: '#475569' }).setOrigin(1, 0).setScrollFactor(0).setDepth(124)
            ];

            const p1 = this.lutadores[0];
            const p2 = this.lutadores[1];
            this.nomeTxt[0].setText(p1.personagem.nome + (p1.controle === 'cpu' ? ' (CPU)' : ''));
            this.nomeTxt[1].setText((p2.controle === 'cpu' ? '(CPU) ' : '') + p2.personagem.nome);

            const linhas = D.golpesDoPersonagem(p1.personagem).map(function (g) { return g.nome + '  ' + g.texto; });
            this.comandosTxt = this.add.text(D.LARGURA_TELA / 2, D.ALTURA_TELA - 30, linhas.join('     '), {
                fontFamily: 'monospace', fontSize: '17px', color: '#fde047', backgroundColor: '#0b1120cc', padding: { x: 12, y: 6 }
            }).setOrigin(0.5).setScrollFactor(0).setDepth(124);

            this.avisoTxt = this.add.text(D.LARGURA_TELA / 2, D.ALTURA_TELA / 2 - 60, '', {
                fontFamily: FONTE, fontSize: '92px', fontStyle: 'bold', color: '#fbbf24',
                stroke: '#7c2d12', strokeThickness: 12
            }).setOrigin(0.5).setScrollFactor(0).setDepth(130).setAlpha(0);
            this.subAvisoTxt = this.add.text(D.LARGURA_TELA / 2, D.ALTURA_TELA / 2 + 40, '', {
                fontFamily: FONTE, fontSize: '30px', color: '#e2e8f0', stroke: '#0b1120', strokeThickness: 6
            }).setOrigin(0.5).setScrollFactor(0).setDepth(130).setAlpha(0);

            this.cortina = this.add.rectangle(D.LARGURA_TELA / 2, D.ALTURA_TELA / 2, D.LARGURA_TELA, D.ALTURA_TELA, 0x000000, 0).setScrollFactor(0).setDepth(129);
            this.brilhoSuper = this.add.rectangle(D.LARGURA_TELA / 2, D.ALTURA_TELA / 2, D.LARGURA_TELA, D.ALTURA_TELA, 0xffffff, 0).setScrollFactor(0).setDepth(128);
        }

        mensagemDeBoasVindas() {
            const p1 = this.lutadores[0];
            const controleP1 = p1.controle === 'cpu' ? 'A máquina controla os dois lados! Aperte [I] para ver a ficha de golpes e [/] para a fita de comandos.' : 'Setas + A(soco) D(chute) E(turbo). A+D = projeção — e com barra cheia, o SUPREMO!';
            this.mostrarAviso('ROUND ' + this.round, controleP1, FR(2.2));
        }

        mostrarAviso(texto, subtexto, framesExibicao) {
            this.avisoTxt.setText(texto).setAlpha(1).setScale(1.6);
            this.subAvisoTxt.setText(subtexto || '').setAlpha(subtexto ? 1 : 0);
            this.tweens.add({ targets: this.avisoTxt, scale: 1, duration: 240, ease: 'Back.easeOut' });
            this.time.delayedCall(framesExibicao / 60 * 1000, () => {
                this.tweens.add({ targets: [this.avisoTxt, this.subAvisoTxt], alpha: 0, duration: 200 });
            });
        }

        /* ---------------------------------------------------------------
           ETAPA 10 — FITA DE COMANDOS (a janela para ver o próprio input)
           --------------------------------------------------------------- */
        desenharFitaDeComandos() {
            if (!this.mostrarFita) { this.fitaTxt[0].setText(''); this.fitaTxt[1].setText(''); return; }
            this.lutadores.forEach(function (lutador, i) {
                const itens = lutador.comandosVisiveis.slice(-9).map(function (item) {
                    return D.SIMBOLOS[item.passo] || item.passo;
                });
                this.fitaTxt[i].setText(itens.join(' '));
            }, this);
        }

        /* ---------------------------------------------------------------
           ETAPA 10 — HUD DESSENHADO A CADA QUADRO
           --------------------------------------------------------------- */
        desenharHud() {
            const g = this.vidaG;
            g.clear();
            const L = this.barra.largura;
            const A = this.barra.altura;
            const y = this.barra.y;
            const margem = 40;

            this.lutadores.forEach((lutador, i) => {
                if (lutador.vidaLag === undefined) lutador.vidaLag = lutador.vida;
                lutador.vidaLag = Math.max(lutador.vida, lutador.vidaLag - 0.55);

                const proporcao = Phaser.Math.Clamp(lutador.vida / lutador.vidaMax, 0, 1);
                const proporcaoLag = Phaser.Math.Clamp(lutador.vidaLag / lutador.vidaMax, 0, 1);
                const x = i === 0 ? margem : D.LARGURA_TELA - margem - L;

                g.fillStyle(0x0b1120, 0.92);
                g.fillRect(x - 4, y - 4, L + 8, A + 8);
                g.fillStyle(0x1e293b, 1);
                g.fillRect(x, y, L, A);
                // "fantasma" de dano (a parte amarela que desce devagar)
                const larguraLag = L * proporcaoLag;
                g.fillStyle(0xfbbf24, 0.85);
                if (i === 0) g.fillRect(x + L - larguraLag, y, larguraLag, A);
                else g.fillRect(x, y, larguraLag, A);
                // vida atual
                const largura = L * proporcao;
                const cor = proporcao > 0.5 ? 0x22c55e : proporcao > 0.22 ? 0xf59e0b : 0xef4444;
                g.fillStyle(cor, 1);
                if (i === 0) g.fillRect(x + L - largura, y, largura, A);
                else g.fillRect(x, y, largura, A);
                g.fillStyle(0xffffff, 0.18);
                if (i === 0) g.fillRect(x + L - largura, y, largura, 6);
                else g.fillRect(x, y, largura, 6);
                g.lineStyle(2, 0xe2e8f0, 0.25);
                g.strokeRect(x, y, L, A);

                // super
                const sy = y + A + 18;
                const proporcaoSuper = Phaser.Math.Clamp(lutador.superCarga / D.SUPER_MAXIMO, 0, 1);
                g.fillStyle(0x0b1120, 0.9);
                g.fillRect(x - 4, sy - 4, L + 8, 16);
                g.fillStyle(0x334155, 1);
                g.fillRect(x, sy, L, 8);
                const cheio = proporcaoSuper >= 1;
                g.fillStyle(cheio ? (this.frames % 20 < 10 ? 0xfde047 : 0xf97316) : 0x38bdf8, 1);
                const larguraSuper = L * proporcaoSuper;
                if (i === 0) g.fillRect(x + L - larguraSuper, sy, larguraSuper, 8);
                else g.fillRect(x, sy, larguraSuper, 8);
                if (!this.superTxt) {
                    this.superTxt = [
                        this.add.text(margem, y + A + 32, 'SUPREMO PRONTO!  aperte S+C', { fontFamily: FONTE, fontSize: '14px', fontStyle: 'bold', color: '#fde047' }).setScrollFactor(0).setDepth(123),
                        this.add.text(D.LARGURA_TELA - margem, y + A + 32, 'SUPREMO PRONTO!', { fontFamily: FONTE, fontSize: '14px', fontStyle: 'bold', color: '#fde047' }).setOrigin(1, 0).setScrollFactor(0).setDepth(123)
                    ];
                }
                this.superTxt[i].setVisible(cheio).setAlpha(this.frames % 24 < 12 ? 1 : 0.35);
            });

            // rodadas vencidas
            const est = (n) => '●'.repeat(n) + '○'.repeat(Math.max(0, D.ROUNDS_PARA_VENCER - n));
            this.rodadasTxt[0].setText(est(this.vitorias[0]));
            this.rodadasTxt[1].setText(est(this.vitorias[1]));

            // combos
            this.lutadores.forEach((lutador, i) => {
                if (lutador.comboAtual >= 2 && this.frames < lutador.comboAte) {
                    this.comboTxt[i].setText(lutador.comboAtual + ' HITS\n' + lutador.comboDano + ' de dano');
                } else {
                    this.comboTxt[i].setText('');
                }
            });
        }

        /* ---------------------------------------------------------------
           ETAPA 10 — A CÂMERA QUE SEGUE A LUTA
           -----------------------------------------------------------------
           A câmera fica no MEIO dos dois lutadores e dá zoom conforme a
           distância: perto = zoom grande (drama!), longe = zoom pequeno.
           --------------------------------------------------------------- */
        moverCamera() {
            const a = this.lutadores[0].sprite.x;
            const b = this.lutadores[1].sprite.x;
            let meio = (a + b) / 2;
            if (this.zoomEm) meio = this.zoomEm.x;
            const distancia = Math.abs(a - b);
            let alvoY = (this.lutadores[0].sprite.y + this.lutadores[1].sprite.y) / 2;
            if (this.zoomEm) alvoY = this.zoomEm.y - 60;
            const cam = this.cameras.main;
            let zoom = 1.15;
            if (this.zoomForcado) zoom = this.zoomForcado;
            else if (this.zoomAtivo) {
                zoom = Phaser.Math.Linear(1.7, 1.04, Phaser.Math.Clamp(distancia / 700, 0, 1));
                if (this.estado === 'ko') zoom = 1.85;
            }
            cam.setZoom(cam.zoom + (zoom - cam.zoom) * 0.12);

            const visivelW = D.LARGURA_TELA / cam.zoom;
            const visivelH = D.ALTURA_TELA / cam.zoom;
            let x = meio - visivelW / 2;
            x = Phaser.Math.Clamp(x, 0, Math.max(0, D.LARGURA_MUNDO - visivelW));
            let y = alvoY - D.ALTURA_TELA / cam.zoom * 0.62;
            y = Phaser.Math.Clamp(y, 0, Math.max(0, D.ALTURA_MUNDO - visivelH));
            cam.scrollX += (x - cam.scrollX) * 0.12;
            cam.scrollY += (y - cam.scrollY) * 0.12;
        }

        tremor(intensidade) {
            this.cameras.main.shake(Math.max(40, intensidade * 18), Phaser.Math.Clamp(intensidade / 900, 0.002, 0.014));
        }

        flashDeSuper(lutador) {
            this.brilhoSuper.setAlpha(0.8);
            this.tweens.add({ targets: this.brilhoSuper, alpha: 0, duration: 260 });
            this.tremor(16);
            this.congelar(FR(0.35));
            this.cameraDeSuper(true, lutador);
        }

        /** Cortina escura + zoom forçado: o "drama" do golpe supremo. */
        cameraDeSuper(ligar, lutador) {
            if (ligar) {
                this.cortina.setAlpha(0.5);
                this.zoomForcado = 1.55;
                this.zoomEm = lutador ? lutador.sprite : null;
            } else {
                this.cortina.setAlpha(0);
                this.zoomForcado = null;
                this.zoomEm = null;
            }
        }

        /** Rastro de energia enquanto o supremo está ativo (partícula feita "na mão"). */
        rastroDeSuper(lutador) {
            const x = lutador.sprite.x - 16 * lutador.sinal;
            const y = lutador.sprite.y - 40 - Math.random() * 70;
            const bolinha = this.add.circle(x, y, 5 + Math.random() * 11, lutador.personagem.paleta.aura, 0.6).setDepth(11);
            this.tweens.add({
                targets: bolinha, alpha: 0, scale: 0.15, x: x - 34 * lutador.sinal, y: y - 20,
                duration: 300, onComplete: () => bolinha.destroy()
            });
        }

        congelar(frames) {
            this.congelado = true;
            this.time.delayedCall(frames / 60 * 1000, () => { this.congelado = false; });
        }

        /* ---------------------------------------------------------------
           ETAPA 7 — EFEITOS VISUAIS DE IMPACTO
           --------------------------------------------------------------- */
        impacto(defensor, dano, at) {
            const x = defensor.sprite.x;
            const y = defensor.sprite.y - (defensor.agachado ? 40 : 70);
            const estrela = this.add.image(x, y, 'impacto')
                .setDepth(30)
                .setTint(at && at.eSuper ? 0xfde047 : 0xffffff)
                .setScale(0.4)
                .setAngle(Math.random() * 90);
            this.tweens.add({
                targets: estrela, scale: at && at.eSuper ? 2.2 : 1.5, alpha: 0, angle: 40,
                duration: 220, ease: 'Quad.easeOut', onComplete: () => estrela.destroy()
            });
            const numero = this.add.text(x, y - 26, String(dano), {
                fontFamily: FONTE, fontSize: (at && at.eSuper ? 34 : 26) + 'px', fontStyle: 'bold',
                color: '#fde047', stroke: '#0b1120', strokeThickness: 6
            }).setDepth(31).setOrigin(0.5);
            this.tweens.add({
                targets: numero, y: y - 76, alpha: 0, duration: 620, ease: 'Cubic.easeOut',
                onComplete: () => numero.destroy()
            });
        }

        escudoDeBloqueio(defensor) {
            const x = defensor.sprite.x + 24 * defensor.sinal;
            const escudo = this.add.image(x, defensor.sprite.y - 60, 'escudo').setDepth(29).setTint(0x93c5fd).setAlpha(0.9).setScale(0.8);
            this.tweens.add({ targets: escudo, alpha: 0, scaleX: 1.4, duration: 200, onComplete: () => escudo.destroy() });
        }

        poeira(x, y) {
            const p = this.add.image(x, y, 'poeira').setDepth(9).setTint(0x94a3b8).setAlpha(0.75).setScale(0.6);
            this.tweens.add({ targets: p, alpha: 0, y: y - 14, scaleX: 1.6, scaleY: 1.1, duration: 280, onComplete: () => p.destroy() });
        }

        ondaDeChoque(x, y, escala) {
            for (let i = 0; i < escala; i++) {
                const a = this.add.image(x, y, 'anel').setDepth(28).setTint(0xfbbf24).setAlpha(0.9).setScale(0.3);
                this.tweens.add({
                    targets: a, scaleX: 3 + i, scaleY: 1.6 + i * 0.5, alpha: 0,
                    duration: 420 + i * 120, delay: i * 70, onComplete: () => a.destroy()
                });
            }
        }

        golpeNaTela(lutador, nome, comando) {
            const x = lutador.numero === 1 ? 150 : D.LARGURA_TELA - 150;
            const txt = this.add.text(x, 250, comando ? nome + '\n' + comando : nome, {
                fontFamily: FONTE, fontSize: '22px', fontStyle: 'bold', color: '#f8fafc',
                backgroundColor: '#0b1120dd', align: 'center', padding: { x: 12, y: 6 }, stroke: '#0b1120', strokeThickness: 2
            }).setOrigin(0.5).setScrollFactor(0).setDepth(126).setScale(0.6);
            this.tweens.add({
                targets: txt, scale: 1, alpha: { from: 1, to: 0 }, y: 220, delay: 400, duration: 480,
                ease: 'Back.easeOut', onComplete: () => txt.destroy()
            });
        }

        /* ---------------------------------------------------------------
           ETAPA 7 — DETECÇÃO DE GOLPES (sem "overlap" pronto: nós fazemos!)
           -----------------------------------------------------------------
           A cada quadro pegamos a caixa de golpe de A e a caixa de ferimento
           de B e perguntamos ao Phaser: "esses dois retângulos se encostam?"
           É só isso que um jogo de luta faz. O resto é enfeite.
           --------------------------------------------------------------- */
        checarGolpes() {
            if (this.estado !== 'lutando') return;
            const duplo = [[this.lutadores[0], this.lutadores[1]], [this.lutadores[1], this.lutadores[0]]];
            for (const par of duplo) {
                const atacante = par[0];
                const defensor = par[1];
                const at = atacante.ataqueAtual;
                if (!at || !atacante.noAtivo) continue;
                if (atacante.jaAcertou && !at.sequencia) continue;
                if (at.sequencia && atacante.jaAcertou) continue;

                const alvo = at.agarrao ? null : atacante.caixaDeGolpe;
                if (at.agarrao) {
                    // atenção: aqui NÃO usamos `podeAgarrar`, porque o golpe JÁ está
                    // acontecendo (o próprio THROW bloquearia a checagem).
                    if (atacante.estaAoAlcanceDeAgarrar) this.executarProjecao(atacante, defensor, at);
                    else if (atacante.framesDoAtaque > at.startup + 2) { atacante.ataqueAtual = null; }
                    continue;
                }
                if (!alvo) continue;
                const ferimento = defensor.caixaDeFerimento;
                if (!Phaser.Geom.Intersects.RectangleToRectangle(alvo, ferimento)) continue;

                const resultado = defensor.sofrerDano(at.dano === undefined ? 8 : at.dano, atacante, at);
                if (resultado !== 'nada') {
                    atacante.jaAcertou = true;
                    if (at.paraCima || at.derruba) { }
                    this.congelar(at.eSuper ? FR(0.16) : FR(resultado === 'bloqueio' ? 0.05 : 0.1));
                }
            }
        }

        executarProjecao(atacante, defensor, at) {
            defensor.estaAgarrado = true;
            atacante.agarrando = true;
            defensor.ataqueAtual = null;
            defensor.hitstun = 0;
            defensor.blockstun = 0;
            const paraTras = atacante.direita ? -1 : 1;
            const x0 = defensor.sprite.x;
            const y0 = defensor.sprite.y;
            const x1 = atacante.sprite.x + paraTras * 70;
            const y1 = D.CHAO_Y - 150;
            const x2 = atacante.sprite.x + paraTras * 30;
            const y2 = D.CHAO_Y - 50;
            defensor.corpo.setVelocity(0, 0);
            defensor.corpo.setAllowGravity(false);      // senão o corpo cai enquanto o tween anima
            this.tweens.add({
                targets: defensor.sprite,
                keyframes: [
                    { x: atacante.sprite.x + paraTras * 10, y: y0 - 60, duration: 130 },
                    { x: x1, y: y1, duration: 170, ease: 'Cubic.easeOut' },
                    { x: x2, y: y2, duration: 150, ease: 'Cubic.easeIn' }
                ],
                onComplete: () => {
                    defensor.estaAgarrado = false;
                    atacante.agarrando = false;
                    defensor.corpo.setAllowGravity(true);
                    defensor.sprite.x = Phaser.Math.Clamp(x0, 46, D.LARGURA_MUNDO - 46);
                }
            });
            defensor.sprite.setFrame(6);
            this.tweens.add({ targets: defensor.sprite, angle: 360 * paraTras, duration: 450, onComplete: () => defensor.sprite.setAngle(0) });
            this.time.delayedCall(360, () => {
                const danoBase = at.dano;
                const dano = Math.max(1, Math.round(danoBase * (atacante.forcaStat || 1) / (0.55 + 0.45 * (defensor.defesa || 1))));
                defensor.vida = Math.max(0, defensor.vida - (this.treino ? 0 : dano));
                defensor.knockdown = FR(0.7);
                defensor.hitstun = 8;
                defensor.lancado = false;
                atacante.superCarga = Math.min(D.SUPER_MAXIMO, atacante.superCarga + 14);
                defensor.superCarga = Math.min(D.SUPER_MAXIMO, defensor.superCarga + 8);
                atacante.danoCausado += dano;
                this.impacto(defensor, dano, { derruba: true });
                this.poeira(defensor.sprite.x, D.CHAO_Y);
                this.tremor(12);
                D.audio.ko();
                this.verificarFimDeRound();
            });
            this.golpeNaTela(atacante, 'PROJEÇÃO!');
        }

        contraAtaque(dara, atacante, at) {
            void at;
            this.ondaDeChoque(dara.sprite.x, dara.sprite.y - 70, 2);
            this.tremor(14);
            D.audio.bloqueio();
            dara.superCarga = Math.min(D.SUPER_MAXIMO, dara.superCarga + 22);
            const c = dara.personagem.contra;
            const dano = (c && c.contra ? c.contra.dano : 14);
            dara.emContra = false;
            dara.ataqueAtual = null;
            dara.framesDoAtaque = 0;
            dara.sprite.setFrame(11);
            this.golpeNaTela(dara, 'CONTRA-ATAQUE!', D.comandoParaTexto(c.comando, c.botao));
            this.time.delayedCall(60, () => atacante.sofrerDano(dano, dara, { paraCima: true, derruba: true, impulsoY: -420 }));
        }

        /* ---------------------------------------------------------------
           ETAPA 8 — PROJÉTIS: criar e mover (na mão, para entender a física)
           --------------------------------------------------------------- */
        criarProjeteil(dono, info, indice) {
            const chave = info.fogo ? 'bola-fogo' : 'orbe';
            const x = dono.sprite.x + 40 * dono.sinal;
            const y = dono.sprite.y + (info.y === undefined ? -84 : info.y);
            const escala = (info.raio || 16) / 16;
            const sprite = this.add.image(x, y, chave)
                .setDepth(11)
                .setTint(info.cor || 0x38bdf8)
                .setScale(escala)
                .setFlipX(!dono.direita);
            sprite.dono = dono;
            sprite.info = info;
            // MOVIMENTO MANUAL: velocidade + gravidade, igualzinho na aula de física.
            // (poderíamos usar this.physics.add.existing — mas aí a matemática fica escondida)
            sprite.vx = info.velocidade * dono.sinal;
            /* ARCO = o projétil faz uma parábola. O truque didático: ele SAI
               de leve para cima e a "gravidade" dele puxa para baixo, então a
               bola descreve um U deitado e cai em cima do adversário.
               (antes o impulso inicial era grande demais e a bola passava POR
                CIMA da cabeça do alvo — um erro que só aparece quando os dois
                estão BEM longe, e que o teste de página inteira pegou.) */
            sprite.vy = info.arco ? -info.arco * 0.25 : 0;
            sprite.grav = info.arco ? info.arco : 0;
            sprite.vida = info.duracao || 2000;
            sprite.dano = info.dano || 8;
            sprite.x -= indice * 46 * dono.sinal;   // super com 3 bolas: uma atrás da outra
            this.projeteis.push(sprite);
            D.audio.energia();
        }

        projeteisDo(lutador) {
            return this.projeteis.filter(function (p) { return p.active && p.dono === lutador && p.alpha > 0.5; });
        }

        atualizarProjeteis(delta) {
            const dt = delta / 1000;
            for (let i = this.projeteis.length - 1; i >= 0; i--) {
                const p = this.projeteis[i];
                if (!p.active) { this.projeteis.splice(i, 1); continue; }
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += p.grav * dt;
                if (p.info.fogo) p.setScale((p.info.raio || 16) / 16 * (1 + Math.sin(this.frames / 3) * 0.12));
                else p.rotation += 0.24;
                p.vida -= delta;

                const alvo = p.dono.inimigo;
                const caixa = new Phaser.Geom.Rectangle(p.x - 14, p.y - 14, 28, 28);
                if (alvo && alvo.emContra && Phaser.Geom.Intersects.RectangleToRectangle(caixa, alvo.caixaDeFerimento)) {
                    this.contraAtaque(alvo, p.dono);
                    this.estourar(p);
                    continue;
                }
                if (alvo && alvo.vida > 0 && Phaser.Geom.Intersects.RectangleToRectangle(caixa, alvo.caixaDeFerimento)) {
                    const at = { dano: p.dano, tipo: 'projeteis', alturaCaixa: p.info.baixo ? 0 : 1, projeteis: true };
                    alvo.sofrerDano(p.dano, p.dono, at);
                    this.estourar(p);
                    continue;
                }
                if (p.x < -40 || p.x > D.LARGURA_MUNDO + 40 || p.y > D.CHAO_Y + 30 || p.vida <= 0) {
                    this.estourar(p, true);
                }
            }

            // energia contra energia: as duas se apagam no ar!
            for (let a = 0; a < this.projeteis.length; a++) {
                for (let b = a + 1; b < this.projeteis.length; b++) {
                    const p1 = this.projeteis[a];
                    const p2 = this.projeteis[b];
                    if (!p1.active || !p2.active || p1.dono === p2.dono) continue;
                    if (Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y) < 30) {
                        this.ondaDeChoque((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 1);
                        this.estourar(p1);
                        this.estourar(p2);
                        D.audio.bloqueio();
                    }
                }
            }
        }

        estourar(p, silencioso) {
            const e = this.add.image(p.x, p.y, 'impacto').setDepth(28).setTint(p.info.cor || 0x38bdf8).setScale(0.5);
            this.tweens.add({ targets: e, scale: 1.6, alpha: 0, duration: 180, onComplete: () => e.destroy() });
            if (!silencioso) D.audio.soco();
            p.destroy();
            const i = this.projeteis.indexOf(p);
            if (i >= 0) this.projeteis.splice(i, 1);
        }

        /* ---------------------------------------------------------------
           ETAPA 11 — ROUNDS, RELÓGIO, K.O.
           --------------------------------------------------------------- */
        verificarFimDeRound() {
            if (this.estado !== 'lutando' || this.treino) return;
            const a = this.lutadores[0];
            const b = this.lutadores[1];
            if (a.vida > 0 && b.vida > 0) return;
            if (this.koPendente) return;
            this.koPendente = true;
            this.semControle = true;                       // deixa a queda acontecer antes do letreiro
            const vencedor = (a.vida <= 0 && b.vida <= 0) ? -1 : (a.vida <= 0 ? 1 : 0);
            this.tremor(18);
            D.audio.ko();
            this.time.delayedCall(620, () => this.terminarRound(vencedor, 'K.O.!'));
        }

        terminarRound(vencedor, motivo) {
            this.estado = 'ko';
            this.semControle = true;
            const cam = this.cameras.main;
            cam.shake(500, 0.012);
            this.tweens.add({ targets: this.cortina, alpha: 0.35, duration: 400 });
            if (vencedor >= 0) {
                this.vitorias[vencedor]++;
                this.lutadores[vencedor].sprite.setFrame(7);
                this.mostrarAviso(motivo, this.lutadores[vencedor].personagem.nome + ' venceu o round ' + this.round, FR(2.0));
                const perdedor = this.lutadores[1 - vencedor];
                perdedor.knockdown = FR(3);
                perdedor.ataqueAtual = null;
            } else {
                this.mostrarAviso(motivo, 'EMPATE! Ninguém levou.', FR(2.0));
            }
            D.audio.ko();
            this.projeteis.slice().forEach((p) => this.estourar(p, true));

            this.time.delayedCall(2200, () => {
                const precisa = D.ROUNDS_PARA_VENCER;
                if (this.vitorias[0] >= precisa || this.vitorias[1] >= precisa) this.terminarPartida();
                else this.proximoRound();
            });
        }

        proximoRound() {
            this.round++;
            this.lutadores.forEach((l, i) => {
                l.vida = l.cena.treino ? D.VIDA_TREINO : l.vidaMax;
                l.vidaLag = l.vida;
                l.hitstun = 0; l.blockstun = 0; l.knockdown = 0;
                l.ataqueAtual = null; l.estaInvencivel = false; l.lancado = false;
                l.sprite.setAlpha(1); l.sprite.clearTint();
                l.sprite.x = i === 0 ? 620 : 980;
                l.sprite.y = D.CHAO_Y;   // os pés voltam para a linha do chão
                l.sprite.body.setVelocity(0, 0);
                l.comboAtual = 0;
                if (l.ia) l.ia.proximaAcao = 0;
            });
            this.cortina.setAlpha(0);
            this.koPendente = false;
            this.tempoRestante = D.SEGUNDOS_POR_ROUND;
            this.estado = 'intro';
            this.tempoDeEspera = FR(2.0);
            this.rotuloTxt.setText('ROUND ' + this.round + ' de ' + (2 * D.ROUNDS_PARA_VENCER - 1));
            this.mostrarAviso('ROUND ' + this.round, 'Lute!', FR(1.4));
        }

        terminarPartida() {
            this.estado = 'fim';
            const quem = this.vitorias[0] > this.vitorias[1] ? 0 : 1;
            const vencedor = this.lutadores[quem];
            const dados = {
                vencedorNome: vencedor.personagem.nome + ' — ' + vencedor.personagem.titulo,
                venceuJogador: quem === 0,
                placar: this.vitorias[0] + ' x ' + this.vitorias[1],
                estatisticas: this.lutadores.map(function (l) {
                    return {
                        nome: l.personagem.nome,
                        controle: l.controle === 'cpu' ? 'máquina' : 'jogador',
                        maiorCombo: l.maiorCombo,
                        dano: l.danoCausado,
                        vida: Math.max(0, Math.round(l.vida)),
                        golpes: [l.personagem.especial.nome, l.personagem.super.nome].join(', ')
                    };
                }),
                comando: D.comandoParaTexto(vencedor.personagem.especial.comando, vencedor.personagem.especial.botao),
                nomeGolpe: vencedor.personagem.especial.nome
            };
            // o Estado compartilhado também funciona se a cena for aberta sozinha
            // (React recarregando, teste automatizado, link direto...)
            window.ESTADO = window.ESTADO || {};
            window.ESTADO.resultado = dados;
            this.cameras.main.fadeOut(700, 5, 5, 12);
            this.time.delayedCall(720, () => {
                this.scene.stop();
                this.scene.start('Resultado');
            });
        }

        /* ---------------------------------------------------------------
           MODO TREINO: vida infinita e o boneco te perdoa
           --------------------------------------------------------------- */
        atualizarTreino() {
            const alvo = this.lutadores[1];
            if (alvo.vidaRegenera === undefined) alvo.vidaRegenera = 0;
            if (alvo.vida < alvo.vidaMax) {
                alvo.vidaRegenera++;
                if (alvo.vidaRegenera > FR(1.6)) {
                    alvo.vida = Math.min(alvo.vidaMax, alvo.vida + 0.6);
                    alvo.vidaLag = alvo.vida;
                }
            } else alvo.vidaRegenera = 0;
            if (this.frames % FR(0.4) === 0) {
                this.lutadores.forEach(function (l) { l.superCarga = Math.min(D.SUPER_MAXIMO, l.superCarga + 6); });
            }
        }

        desenharCaixasDeColisao() {
            this.topoG.clear();
            if (!this.mostrarCaixas && !this.treino) return;
            this.lutadores.forEach(function (l) {
                const golpe = l.caixaDeGolpe;
                const ferimento = l.caixaDeFerimento;
                if (ferimento) {
                    this.topoG.lineStyle(2, 0x22c55e, 1);
                    this.topoG.strokeRect(ferimento.x - this.cameras.main.scrollX, ferimento.y - this.cameras.main.scrollY, ferimento.width, ferimento.height);
                }
                if (golpe) {
                    this.topoG.lineStyle(2, 0xef4444, 1);
                    this.topoG.strokeRect(golpe.x - this.cameras.main.scrollX, golpe.y - this.cameras.main.scrollY, golpe.width, golpe.height);
                }
            }, this);
        }

        /* ---------------------------------------------------------------
           O LOOP DA CENA
           --------------------------------------------------------------- */
        update(tempo, delta) {
            if (this.pausado) {
                if (Phaser.Input.Keyboard.JustDown(this.teclasGerais.P) || Phaser.Input.Keyboard.JustDown(this.teclasGerais.ESC)) this.alternarPausa();
                return;
            }
            if (Phaser.Input.Keyboard.JustDown(this.teclasGerais.P) || Phaser.Input.Keyboard.JustDown(this.teclasGerais.ESC)) this.alternarPausa();
            if (Phaser.Input.Keyboard.JustDown(this.teclasGerais.M)) {
                const mudo = D.audio.alternarMudo();
                this.golpeNaTela(this.lutadores[0], mudo ? 'SOM DESLIGADO' : 'SOM LIGADO');
            }
            if (Phaser.Input.Keyboard.JustDown(this.teclasGerais.I)) this.mostrarComandos = !this.mostrarComandos;
            if (Phaser.Input.Keyboard.JustDown(this.teclasGerais.V)) {
                this.mostrarCaixas = !this.mostrarCaixas;
                this.golpeNaTela(this.lutadores[0], this.mostrarCaixas ? 'CAIXAS LIGADAS' : 'CAIXAS DESLIGADAS');
            }
            if (Phaser.Input.Keyboard.JustDown(this.teclasGerais.H2)) this.mostrarFita = !this.mostrarFita;
            this.comandosTxt.setVisible(this.mostrarComandos);

            this.frames++;

            if (this.estado === 'intro') {
                this.tempoDeEspera--;
                if (this.tempoDeEspera === FR(0.7)) {
                    this.mostrarAviso('LUTEM!', '', FR(0.65));
                    D.audio.apito();
                }
                if (this.tempoDeEspera <= 0) {
                    this.estado = 'lutando';
                    this.semControle = false;
                    this.tempoRestante = D.SEGUNDOS_POR_ROUND;
                }
            } else if (this.estado === 'lutando') {
                if (this.frames % 60 === 0) {
                    this.tempoRestante--;
                    if (this.tempoRestante <= 10 && this.tempoRestante > 0) D.audio.menu();
                    if (this.tempoRestante <= 0) {
                        const a = this.lutadores[0];
                        const b = this.lutadores[1];
                        const vencedor = a.vida === b.vida ? -1 : (a.vida > b.vida ? 0 : 1);
                        this.terminarRound(vencedor, 'TEMPO ESGOTADO');
                    }
                }
            }

            if (!this.congelado) {
                // o HUD dos lutadores (barras de carga) é redesenhado por eles:
                // a gente apaga o desenho ANTES, senão as barras velhas ficam
                // "fantasma" para sempre na tela.
                this.hudG.clear();
                this.lutadores.forEach(function (l) { l.atualizar(tempo, delta); });
                this.atualizarProjeteis(delta);
                this.checarGolpes();
                if (this.treino) this.atualizarTreino();
            }

            this.moverCamera();
            this.desenharHud();
            this.desenharFitaDeComandos();
            this.desenharCaixasDeColisao();
            if (this.plateia) {
                for (let i = 0; i < this.plateia.length; i += 7) {
                    const p = this.plateia[i];
                    p.y += Math.sin((this.frames + i) / 18) * 0.4;
                }
            }
            const t = Math.max(0, this.tempoRestante === undefined ? D.SEGUNDOS_POR_ROUND : this.tempoRestante);
            this.tempoTxt.setText(t < 10 ? '0' + t : String(t));
            this.tempoTxt.setColor(t <= 10 ? '#f87171' : '#fde047');
        }

        alternarPausa() {
            this.pausado = !this.pausado;
            if (this.pausado) {
                this.physics.world.pause();
                this.cortina.setAlpha(0.7);
                this.subAvisoTxt.setText('PAUSA  ·  [P] continuar   [I] ficha de golpes   [/] fita   [M] som   [R] reiniciar').setAlpha(1);
                this.avisoTxt.setText('⏸').setAlpha(1).setScale(1);
            } else {
                this.physics.world.resume();
                this.cortina.setAlpha(0);
                this.avisoTxt.setAlpha(0);
                this.subAvisoTxt.setAlpha(0);
            }
        }

    }

    return { Lutador: Lutador, CenaDeLuta: CenaDeLuta, LeitorDeEntrada: LeitorDeEntrada, MAPAS_TECLAS: MAPAS_TECLAS };
})();

if (typeof window !== 'undefined') {
    window.CENAS = window.CENAS || {};
    window.CENAS.Luta = LUTA.CenaDeLuta;
    window.LUTADOR = LUTA.Lutador;
}
