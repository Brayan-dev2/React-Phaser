/* =====================================================================
   QUINTO JOGO — ARENA RELÂMPAGO
   ---------------------------------------------------------------------
   ARQUIVO 3 DE 4 — A INTELIGÊNCIA DA MÁQUINA (a "IA")
   =====================================================================
   É este arquivo que faz a CPU jogar sozinha. Ele é o coração dos modos
   "P1 vs CPU" e "CPU vs CPU" (a demonstração automática para a sala de aula).

   COMO PENSAR UMA IA DE LUTA SEM ENLOUQUECER
   ------------------------------------------
   A máquina NÃO controla nada diretamente. Ela só escreve uma FILA de
   "apertões de botão", como se fosse um rolo de piano:

       [ {direita: true} ] [ {} ] [ {direita: true, soco: true} ] ...

   A cada quadro ela entrega o próximo item da fila para o Lutador.
   O Lutador, coitado, acha que é um teclado de verdade. Isso tem um nome
   bonito: "abstração de entrada" — e é exatamente assim que jogos sérios
   gravam/repetem partidas (o "replay" nada mais é do que uma fila dessas!).

   As 12 perguntas que a máquina faz, nesta ordem (a primeira que valer,
   manda):

       0. a luta acabou?                -> fico parado
       1. estou caído/atordoado?         -> tento levantar
       2. ele vai me bater?              -> bloqueio (seguro para trás)
       3. veio bola de energia?          -> pulo por cima
       4. meu especial está pronto?      -> USO AGORA
       5. meu especial é de carga?       -> ando para trás CARREGANDO e emendo
       6. tenho barra de super cheia?    -> solto o supremo
       7. estou no ar e perto?           -> chute de entrada (jump-in)
       8. ele está longe?                -> CORRO até ele (duplo toque!)
       9. estamos colados?               -> projeção (S+C)
      10. estou na distância de bate-bate -> golpe normal do meu estilo
      11. sobra o ajuste fino de distância

   O BALANCEAMENTO (o quanto a máquina é rápida e burra) fica em
   dados.js, na ETAPA 5 — mude lá, não aqui.
   ===================================================================== */

const IA = (function () {
    'use strict';

    const D = window.DADOS;

    /* =================================================================
       ETAPA 1 — O "APERTÃO" (o único jeito que a máquina tem de agir)
       ================================================================= */
    /** Um "apertão": quais botões estão pressionados neste quadro. */
    function plano(botões) {
        return Object.assign({
            esquerda: false, direita: false, baixo: false, cima: false,
            soco: false, chute: false, turbo: false
        }, botões || {});
    }

    /* =================================================================
       ETAPA 2 — O CÉREBRO: memória, sorte e a fila de botões
       ================================================================= */
    class Cerebro {
        /**
         * @param { Lutador } eu       - o boneco controlado pela máquina
         * @param { Lutador } inimigo  - o alvo (a cena preenche depois)
         * @param { Object } dificuldade - um item de DADOS.DIFICULDADES
         */
        constructor(eu, inimigo, dificuldade, semente) {
            this.eu = eu;
            this.inimigo = inimigo;
            this.dif = dificuldade;
            this.planoAtual = plano();
            this.fila = [];                  // a "partitura" de botões
            this.proximaAcao = 0;
            this.ultimoPulo = -999;
            this.ultimaCarga = -999;
            this.ultimaBola = -999;
            this.semente = semente || Math.floor(Math.random() * 100000);
        }

        /* Um dado viciado só para a máquina: mesma semente = mesma luta.
           Assim o professor pode gravar a tela explicando UM CPU vs CPU e
           mostrar de novo depois com o MESMO resultado. */
        azar() {
            this.semente = (this.semente * 1103515245 + 12345) % 2147483648;
            return this.semente / 2147483648;
        }

        /** Distância horizontal real entre os dois lutadores. */
        get distancia() {
            return Math.abs(this.eu.sprite.x - this.inimigo.sprite.x);
        }

        /** O oponente está com um golpe "armado" que pode me pegar já já? */
        get ameacaProxima() {
            const alvo = this.inimigo;
            if (!alvo || !alvo.ataqueAtual) return false;
            const framesAteAcertar = alvo.framesDoAtaque - alvo.ataqueAtual.startup;
            return framesAteAcertar >= -6 && framesAteAcertar <= alvo.ataqueAtual.ativo + 4;
        }

        /** Tem energia voando na minha direção? */
        get projeteisPerto() {
            return this.eu.cena.projeteisDo(this.inimigo).length > 0;
        }

        /** Coloca uma sequência de apertões na fila e fica quieta enquanto toca. */
        executar(planos, pausaExtra) {
            this.fila = planos;
            this.proximaAcao = this.cena_frames + planos.length + (pausaExtra || 0);
            return this.planoAtual = this.fila.shift() || plano();
        }

        get cena_frames() { return this.eu.cena.frames; }

        /* =============================================================
           ETAPA 3 — AS REGRAS, EM ORDEM (o coração da IA)
           A primeira que valer manda no quadro. Leia como uma lista de
           prioridades: "antes de atacar, ele está me atacando?"
           ============================================================= */
        atualizar(tempo, framesDaLuta) {
            const eu = this.eu;
            const outro = this.inimigo;
            const dif = this.dif;
            const estilo = eu.personagem.estilo;
            const z = D.ZONA;

            // a fila ainda tem botões para apertar? então só entregue o próximo.
            if (this.fila.length > 0) return (this.planoAtual = this.fila.shift());
            if (framesDaLuta < this.proximaAcao) return this.planoAtual;

            if (!outro) return (this.planoAtual = plano());

            // ---- 0 e 1) situações em que não adianta fazer nada --------------
            if (eu.vida <= 0 || outro.vida <= 0 || eu.knockdown > 0 || eu.estaAgarrado || this.cenaBloqueada()) {
                return (this.planoAtual = plano(eu.knockdown > 4 ? { cima: true } : {}));
            }
            if (eu.hitstun > 0) return (this.planoAtual = plano());

            const distancia = this.distancia;

            // ---- 0.5) REgra DO RINGUE: se os dois estão longe demais, o jogo
            //        está morrendo. A máquina então anda até o centro até o
            //        confronto acontecer. (É a mesma regra que os jogos colocam
            //        na câmera: "eu nunca perco os dois lutadores de vista".)
            if (distancia > 380 && eu.chao) {
                return this.executar([plano({ [this.chaveParaFrente()]: true, segurar: 26 })], 0);
            }

            const encurralado = eu.sprite.x < 170 || eu.sprite.x > D.LARGURA_MUNDO - 170;

            // ---- 1.5) "MODO REVIDE": se estou levando pancada, me arrisco mais.
            //        Chama-se RUBBER BANDING (a mesma ideia dos cascos do Mario
            //        Kart: quem está atrás recebe uma ajudinha para a corrida
            //        continuar divertida até o fim).
            const levandoApanhado = eu.danoCausado + 30 < outro.danoCausado;
            const agressao = estilo.agressao * (levandoApanhado ? 1.35 : 1);
            const longeDemais = distancia > 250;

            // ---- 2) ELE VAI ME BATER? escudo! --------------------------------
            if ((this.ameacaProxima || this.projeteisPerto) && this.podeBloquear()) {
                const chanceDeVer = 1 - dif.erro;
                if (this.azar() < dif.defesa * chanceDeVer + 0.1) {
                    // golpe baixo só é bloqueado agachado (é a regra do jogo!)
                    const veioBaixo = outro.ataqueAtual && outro.ataqueAtual.agachado;
                    return this.executar([plano({ [this.chaveParaTras()]: true, baixo: !!veioBaixo })], 6);
                }
            }
            // contra-ataque (só a DARA tem): é um bloqueio que devolve porrada
            if (eu.personagem.contra && this.ameacaProxima && distancia < 175 && this.azar() < dif.defesa * 0.5) {
                return this.executar([
                    plano({ baixo: true }),
                    plano({ [this.chaveParaTras()]: true, baixo: true, chute: true })
                ], 24);
            }

            // ---- 3.5) VEIO ENERGIA E EU TENHO UM GOLPE QUE SOBE? REVERSÃO!
            //        Um golpe ascendente atravessa a bola de fogo (é a famosa
            //        "reversal"/DP). Quem só pula nunca aprende isso de propósito.
            if (this.projeteisPerto && eu.chao && eu.especialDisponivel &&
                eu.personagem.especial.melee && eu.personagem.especial.melee.paraCima &&
                distancia < 420 && this.azar() < 0.55 + dif.botaoChance * 0.3) {
                return this.executar([plano(this.comandoDoEspecial('especial'))], 20);
            }

            // ---- 3) VEIO ENERGIA? PULE POR CIMA ------------------------------
            if (this.projeteisPerto && eu.chao && distancia > z.curto && distancia < 400 &&
                framesDaLuta - this.ultimoPulo > 100 && this.azar() < 0.35 + dif.botaoChance * 0.3) {
                this.ultimoPulo = framesDaLuta;
                return this.executar([
                    plano({ [this.chaveParaFrente()]: true, cima: true }),
                    plano({ [this.chaveParaFrente()]: true }),
                    plano({ [this.chaveParaFrente()]: true })
                ], 22);
            }

            // ---- 4) ESPECIAL PRONTO NA MEDIDA CERTA? SOLTA O GOLPE -----------
            if (eu.especialDisponivel && this.serveParaOgolpe(eu.tipoDoEspecial, distancia)) {
                const eProjeteis = eu.tipoDoEspecial === 'projeteis';
                // bolas de energia precisam de INTERVALO: se a máquina enche a
                // tela de fogo, o outro lado nunca chega e a luta fica chata.
                if (eProjeteis && framesDaLuta - this.ultimaBola < 54) {
                    return this.executar([plano({ [this.chaveParaFrente()]: true })], 10);
                }
                if (this.azar() < dif.botaoChance * (0.4 + agressao * 0.5)) {
                    if (eProjeteis) this.ultimaBola = framesDaLuta;
                    return this.executar([plano(this.comandoDoEspecial('especial'))], 26);
                }
            }

            // ---- 5) GOLPE DE CARGA: carrego JÁ EMENDANDO com o golpe.
            //        Carregar e usar na MESMA sequência é obrigatório: quando a
            //        carga era uma regra separada, a máquina andava para trás o
            //        round inteiro, chegava longe demais e o golpe nunca saía.
            //        (carga 'd' = agachar, então dá para carregar até de longe)
            if (eu.especialPrecisaDeCarga() && !eu.especialDisponivel && !encurralado &&
                distancia < (eu.personagem.especial.carga === 'd' ? 320 : z.medio) &&
                distancia > z.encostado && framesDaLuta - this.ultimaCarga > 150) {
                this.ultimaCarga = framesDaLuta;
                const def = eu.personagem.especial;
                /* Quantos quadros? O suficiente para pasar CARGA_MS (em dados.js),
                   senão a máquina carrega... e o golpe nunca sai. Aconteceu! */
                const quadros = Math.ceil(D.CARGA_MS / (1000 / 60)) + 6;
                const teclaDeCarga = def.carga === 'd' ? 'baixo' : this.chaveParaTras();
                const carregar = [];
                for (let i = 0; i < quadros; i++) carregar.push(plano({ [teclaDeCarga]: true }));
                carregar.push(plano(this.comandoDoEspecial('especial')));
                return this.executar(carregar, 24);
            }

            // ---- 6) BARRA CHEIA? SUPREMO! ------------------------------------
            if (eu.superPronto && (eu.tipoDoEspecial === 'projeteis' ? distancia > z.curto : distancia < z.medio) &&
                this.azar() < dif.agressao * 0.85) {
                return this.executar([plano(this.comandoDoEspecial('super'))], 30);
            }

            // ---- 7) NO AR E PERTO? CHUTE DE ENTRADA ---------------------------
            if (!eu.chao && distancia < z.medio && distancia > z.encostado) {
                return this.executar([plano({ [this.chaveParaFrente()]: true, chute: true })], 8);
            }

            // ---- 8) ELE ESTÁ LONGE? CORRA ATÉ LÁ (dois toques = corrida) ------
            if (longeDemais) {
                if (this.azar() < 0.55) {
                    return this.executar([
                        plano({ [this.chaveParaFrente()]: true }),
                        plano({}),                                              // solta
                        plano({ [this.chaveParaFrente()]: true, segurar: 18 }),  // segurar = correr
                        plano({ [this.chaveParaFrente()]: true }),
                        plano({ [this.chaveParaFrente()]: true }),
                        plano({ [this.chaveParaFrente()]: true })
                    ], 4);
                }
                // às vezes entra pulando, para não virar alvo fácil
                if (!encurralado && distancia > 320 && framesDaLuta - this.ultimoPulo > 150 &&
                    this.azar() < 0.3 * agressao) {
                    this.ultimoPulo = framesDaLuta;
                    return this.executar([plano({ [this.chaveParaFrente()]: true, cima: true })], 24);
                }
                return this.executar([plano({ [this.chaveParaFrente()]: true })], 10);
            }

            // ---- 9) COLA-COLA: PROJEÇÃO (castigo para quem só bloqueia) ------
            if (distancia < z.encostado && this.azar() < 0.22 + dif.botaoChance * 0.2) {
                return this.executar([plano({ soco: true, chute: true })], 22);
            }

            // ---- 9.5) ELE ESTÁ SE ESCONDENDO ATRÁS DO ESCUDO? QUEBRE A GUARDA.
            //        Dois caminhos: agarrão (vence o bloqueio) ou golpe BAIXO
            //        (quem bloqueia em pé leva). É assim que se ganha de quem só
            //        aperta para trás — algo que todo aluno descobre sozinho.
            if (outro.bloqueando && distancia < z.medio) {
                if (distancia < 108 && this.azar() < 0.55) {
                    return this.executar([plano({ soco: true, chute: true })], 20);
                }
                if (this.azar() < 0.6) {
                    return this.executar([plano({ baixo: true, chute: true, turbo: true }), plano({}), plano({ baixo: true, chute: true })], 16);
                }
                // ou dou um passo para trás e ataco de novo (o tal do "mixup")
                return this.executar([plano({ [this.chaveParaTras()]: true }), plano({ [this.chaveParaFrente()]: true, soco: true, turbo: true })], 12);
            }

            // ---- 10) BATE-BATE: só ataco se estiver DENTRO do alcance real.
            //        (aprendi isso da pior maneira: a máquina chutando no vento
            //         a 200px parecia estar lutando, mas não tirava 1 de vida)
            if (distancia < z.curto && this.azar() < dif.agressao * (0.55 + agressao * 0.5)) {
                const golpe = this.escolherGolpe(distancia);
                if (golpe !== 'NADA') {
                    return this.executar([
                        plano(this.comandoDoGolpe(golpe)),
                        plano({}),
                        plano(this.comandoDoGolpe(golpe, true))
                    ], this.pausaEntreBotes(golpe, dif));
                }
            }

            // ---- 11) NÃO HÁ NADA A FAZER? ANDE ATÉ ELE. Nunca fique parado
            //        olhando: lutar de longe é escolher uma distância melhor.
            if (distancia > 120) {
                return this.executar([plano({ [this.chaveParaFrente()]: true, segurar: 8 })], 4);
            }
            // colado e sem golpe bom: um passinho para trás (e só às vezes)
            if (this.azar() < estilo.recuo * 0.35 && !encurralado) {
                return this.executar([plano({ [this.chaveParaTras()]: true })], 10);
            }
            return this.executar([plano({ [this.chaveParaFrente()]: true })], 6);
        }

        /** A cena está em intro/KO? aí não adianta nem pensar. */
        cenaBloqueada() {
            return this.eu.cena.semControle === true;
        }

        /* ---------------------------------------------------------------
           Tradução "frente/trás" -> tecla esquerda/direita.
           A máquina pensa em "para frente", mas o teclado não sabe de que
           lado o boneco está olhando. Esta é a única "mágica" aqui.
           --------------------------------------------------------------- */
        chaveParaFrente() { return this.eu.miraParaDireita ? 'direita' : 'esquerda'; }
        chaveParaTras() { return this.eu.miraParaDireita ? 'esquerda' : 'direita'; }

        podeBloquear() {
            return this.eu.chao && !this.eu.ataqueAtual && this.eu.hitstun <= 0;
        }

        /** Este tipo de golpe faz sentido nesta distância? */
        serveParaOgolpe(tipo, distancia) {
            const z = D.ZONA;
            const pulando = !this.inimigo.chao;
            if (tipo === 'projeteis') return distancia > z.curto;
            if (tipo === 'investida') return distancia > z.medio * 0.7;
            if (tipo === 'melee') return distancia < z.medio || pulando;
            return distancia < z.medio;
        }

        /** Quanto tempo a máquina espera entre um aperto e outro. */
        pausaEntreBotes(golpe, dif) {
            const base = golpe === 'THROW' ? 22 : 14;
            return base + Math.floor(this.azar() * dif.tempoReacao / 12) + (dif.erro > 0.3 ? 10 : 0);
        }

        /** Os golpes que a máquina gosta de usar, conforme a distância. */
        escolherGolpe(distancia) {
            const dif = this.dif;
            const preferido = this.eu.personagem.estilo.preferido;
            if (this.azar() < dif.erro * 0.55) {
                return this.azar() < 0.5 ? 'p.S' : 'k.S';         // erro: aperta qualquer coisa
            }
            if (distancia < 92) return preferido;
            if (distancia < 150) return this.azar() < 0.5 ? 'p.C' : 'k.S';
            if (distancia < 210) return this.azar() < 0.5 ? 'k.C' : 'k.B';
            return 'NADA';   // mais longe que isso: chutar no vento é o erro nº 1 de IA
        }

        /** Monta os botões de um especial. As setas do meio do caminho a própria
            máquina "digita" em lutador.simularCaminho (por isso é justo com o aluno:
            a CPU faz os MESMOS movimentos que você faria no teclado). */
        comandoDoEspecial(qual) {
            const eu = this.eu;
            const def = qual === 'super' ? eu.personagem.super : eu.personagem.especial;
            const comando = def && def.comando ? def.comando : ['f'];
            const teclas = { f: this.chaveParaFrente(), b: this.chaveParaTras(), d: 'baixo', u: 'cima' };
            const ultimo = comando[comando.length - 1];
            const saida = {};
            if (def && def.carga) {
                // golpe de carga: o último toque é SEMPRE para frente (ou para cima)
                saida[def.carga === 'd' ? 'cima' : this.chaveParaFrente()] = true;
            } else {
                saida[teclas[ultimo] || 'direita'] = true;
            }
            if (def) {
                if (def.botao === 'super') { saida.soco = true; saida.chute = true; }
                else if (def.botao === 'kick') saida.chute = true;
                else saida.soco = true;
            }
            if (!(def && def.carga)) eu.simularCaminho(comando.slice(0, -1));
            return saida;
        }

        comandoDoGolpe(golpe, forte) {
            const tecla = golpe.indexOf('p.') === 0 ? 'soco' : 'chute';
            const saida = {};
            if (golpe === 'k.B' || golpe === 'p.B') saida.baixo = true;
            if (golpe === 'THROW') { saida.soco = true; saida.chute = true; }
            else saida[tecla] = true;
            if (forte && golpe !== 'THROW') saida.turbo = true;
            return saida;
        }
    }

    return { Cerebro: Cerebro, plano: plano };
})();

if (typeof window !== 'undefined') { window.IA = IA; }
