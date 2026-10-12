/* =====================================================================
   QUINTO JOGO — ARENA RELÂMPAGO
   ---------------------------------------------------------------------
   ARQUIVO 3 DE 4 — OS MENUS (TÍTULO, SELEÇÃO DE LUTADOR E RESULTADO)
   =====================================================================
   Num jogo de luta, a tela de escolha é quase tão importante quanto a
   arena: é ali que a criança entende O QUE PODE APERTAR. Por isso ela é
   cheia de avisos, e não um menu minimalista de adulto.

   O que este arquivo ensina:
     • como passar informações de uma cena para outra (window.ESTADO);
     • navegação por teclado em uma GRADE (linha e coluna);
     • cursores independentes para 2 jogadores no mesmo teclado;
     • uma tela de resultado com ESTATÍSTICAS da partida.
   ===================================================================== */

const MENUS = (function () {
    'use strict';

    const D = window.DADOS;
    const ARTE = window.DESINHOS;
    const FONTE = 'Trebuchet MS';

    /* =================================================================
       CENA 1 — TÍTULO
       ================================================================= */
    /* =================================================================
       ETAPA 1 — TÍTULO: a tela que dá vontade de apertar ENTER
       ================================================================= */
    class Titulo extends Phaser.Scene {
        constructor() { super('Titulo'); }

        create() {
            window.ESTADO = window.ESTADO || {};
            const cx = D.LARGURA_TELA / 2;
            const cy = D.ALTURA_TELA / 2;

            const fundo = this.add.graphics();
            fundo.fillGradientStyle(0x1e1b4b, 0x312e81, 0x020617, 0x0f172a, 1);
            fundo.fillRect(0, 0, D.LARGURA_TELA, D.ALTURA_TELA);
            for (let i = 0; i < 46; i++) {
                fundo.fillStyle([0xfbbf24, 0x38bdf8, 0xf87171][i % 3], 0.05 + Math.random() * 0.09);
                fundo.fillRect(Math.random() * D.LARGURA_TELA, Math.random() * D.ALTURA_TELA, 3, 40 + Math.random() * 200);
            }
            // raios relâmpago decorativos (linhas quebradas!)
            for (let i = 0; i < 4; i++) {
                const g = this.add.graphics();
                g.lineStyle(4, 0xfde047, 0.22);
                let x = 120 + Math.random() * (D.LARGURA_TELA - 240);
                let y = 0;
                g.beginPath();
                g.moveTo(x, y);
                while (y < D.ALTURA_TELA) {
                    x += (Math.random() - 0.5) * 130;
                    y += 40 + Math.random() * 60;
                    g.lineTo(x, y);
                }
                g.strokePath();
                this.tweens.add({ targets: g, alpha: 0.05, duration: 380 + i * 90, yoyo: true, repeat: -1 });
            }

            this.add.text(cx, cy - 186, 'ARENA RELÂMPAGO', {
                fontFamily: FONTE, fontSize: '74px', fontStyle: 'bold', color: '#fbbf24',
                stroke: '#7c2d12', strokeThickness: 12
            }).setOrigin(0.5);
            this.add.text(cx, cy - 116, '⚡ MEU QUINTO JOGO · LUTA 2D COM PHASER ⚡', {
                fontFamily: FONTE, fontSize: '20px', fontStyle: 'bold', color: '#38bdf8'
            }).setOrigin(0.5);
            this.add.text(cx, cy - 84, '8 lutadores · bola de fogo · projeção · bloqueio · golpe supremo · melhor de 3 rounds', {
                fontFamily: FONTE, fontSize: '16px', color: '#94a3b8'
            }).setOrigin(0.5);

            // três lutadores posing no título (aproveita o mesmo desenhista!)
            const mostrar = [0, 3, 6];
            D.ELENCO.forEach(function (p, i) {
                if (mostrar.indexOf(i) < 0) return;
                const chave = ARTE.gerarSpritesheet(this, p);
                const img = this.add.image(220 + mostrar.indexOf(i) * 420, cy + 150, chave, 0)
                    .setOrigin(0.5, 0.95).setScale(2.6).setAlpha(0.95);
                this.tweens.add({ targets: img, y: cy + 142, duration: 700 + i * 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
                this.tweens.add({ targets: img, frame: { from: 0, to: 1 }, duration: 420, yoyo: true, repeat: -1 });
            }, this);

            const alerta = this.add.text(cx, cy + 24, 'PRESSIONE  [ENTER]   OU   CLIQUE NA TELA', {
                fontFamily: FONTE, fontSize: '26px', fontStyle: 'bold', color: '#f8fafc',
                backgroundColor: '#0f172acc', padding: { x: 18, y: 12 }
            }).setOrigin(0.5);
            this.tweens.add({ targets: alerta, alpha: 0.3, duration: 520, yoyo: true, repeat: -1 });

            const ajuda = [
                ['P1', 'setas para andar · A = soco · D = chute · E = versão FORTE'],
                ['P2', 'H J K L para andar · Y = soco · U = chute · T = versão FORTE'],
                ['S + C', 'juntos: PROJEÇÃO (chegue perto) ou GOLPE SUPREMO (barra cheia)'],
                ['SEGURAR ←', 'bloqueia. Segurar ← ou ↓ por 1s CARREGA golpes especiais'],
                ['↓ ↘ → + A', 'a bola de energia! Cada lutador tem o SEU desenho de comando']
            ];
            ajuda.forEach(function (linha, i) {
                const t = this.add.text(cx, cy + 200 + i * 24, linha[0].toUpperCase().padEnd(12, ' ') + linha[1], {
                    fontFamily: 'monospace', fontSize: '16px', color: i % 2 ? '#cbd5e1' : '#7dd3fc'
                }).setOrigin(0.5);
                t.setAlpha(0);
                this.tweens.add({ targets: t, alpha: 1, delay: i * 90, duration: 240 });
            }, this);

            this.add.text(cx, D.ALTURA_TELA - 20, 'Gamepad ligado vira o P1 sozinho · [M] som · [P] pausa · [?] lista de golpes · adicione ?physics na URL para ver as caixas', {
                fontFamily: 'monospace', fontSize: '13px', color: '#64748b'
            }).setOrigin(0.5);

            this.enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
            this.input.on('pointerdown', () => this.entrar());
            this.cameras.main.fadeIn(400, 6, 6, 14);
        }

        entrar() {
            if (this.saindo) return;
            this.saindo = true;
            D.audio.confirmar();
            this.cameras.main.fadeOut(240, 6, 6, 14);
            this.time.delayedCall(250, () => this.scene.start('Selecao'));
        }

        update() {
            if (Phaser.Input.Keyboard.JustDown(this.enter)) { this.entrar(); return; }
            const pads = navigator.getGamepads ? navigator.getGamepads() : [];
            for (let i = 0; i < pads.length; i++) {
                const p = pads[i];
                if (p && p.buttons && p.buttons[0] && p.buttons[0].pressed) { this.entrar(); return; }
            }
        }
    }

    /* =================================================================
       CENA 2 — SELEÇÃO DE MODO, DIFICULDADE E LUTADOR
       ================================================================= */
    const COLUNAS = 4;
    function posicaoDoEstudo(i) {
        return { x: 132 + (i % COLUNAS) * 172, y: 208 + Math.floor(i / COLUNAS) * 168 };
    }

    /* =================================================================
       ETAPA 2 — SELEÇÃO: grade de personagens, abas de MODO/DIFICULDADE
       e o que vai dentro de window.ESTADO (a "mochila" do jogo).
       ================================================================= */
    class Selecao extends Phaser.Scene {
        constructor() { super('Selecao'); }

        create() {
            const e = window.ESTADO;
            this.modo = e.modo === undefined ? 0 : e.modo;
            this.dificuldade = e.dificuldade === undefined ? 1 : e.dificuldade;
            this.p1 = { i: e.p1Index === undefined ? 0 : e.p1Index, travado: false };
            this.p2 = { i: e.p2Index === undefined ? 7 : e.p2Index, travado: false };
            this.aba = 0;
            this.autoDemo = 0;
            this.cadencia = 0;
            this.controleP1 = 0;            // 0 = teclado, 1 = gamepad, 2 = máquina
            this.mostrarCaixas = e.mostrarCaixas || false;
            this.padAnt = {};

            this.desenharFundo();
            this.desenharGrade();
            this.desenharPainel();
            this.desenharCabecalho();

            this.t = {};
            ['LEFT', 'RIGHT', 'UP', 'DOWN', 'ENTER', 'SPACE', 'A', 'D', 'S', 'C', 'Q', 'E', 'F', 'G', 'H', 'V', 'B', 'Y', 'U'].forEach((k) => {
                this.t[k] = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[k]);
            });
            this.input.on('pointerdown', this.aohClicar, this);
            this.atualizarTudo();
        }

        desenharFundo() {
            const g = this.add.graphics();
            g.fillGradientStyle(0x1e293b, 0x0f172a, 0x020617, 0x0b1120, 1);
            g.fillRect(0, 0, D.LARGURA_TELA, D.ALTURA_TELA);
            g.lineStyle(1, 0x334155, 0.55);
            for (let x = 0; x <= D.LARGURA_TELA; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, D.ALTURA_TELA); g.strokePath(); }
            for (let y = 0; y <= D.ALTURA_TELA; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(D.LARGURA_TELA, y); g.strokePath(); }
        }

        desenharCabecalho() {
            this.add.text(430, 34, 'ESCOLHA SEU LUTADOR', {
                fontFamily: FONTE, fontSize: '34px', fontStyle: 'bold', color: '#fbbf24',
                stroke: '#0f172a', strokeThickness: 8
            }).setOrigin(0.5);
            this.txtModo = this.add.text(430, 78, '', { fontFamily: FONTE, fontSize: '18px', fontStyle: 'bold', color: '#38bdf8' }).setOrigin(0.5);
            this.txtSetup = this.add.text(40, 546, '', { fontFamily: 'monospace', fontSize: '17px', color: '#e2e8f0', lineSpacing: 9 });
            this.txtRodape = this.add.text(40, 700, '', { fontFamily: 'monospace', fontSize: '14px', color: '#7dd3fc' });
        }

        desenharGrade() {
            this.boxes = [];
            D.ELENCO.forEach((p, i) => {
                const pos = posicaoDoEstudo(i);
                const caixa = this.add.rectangle(pos.x, pos.y, 156, 150, 0x111c31, 1).setStrokeStyle(3, 0x334155).setInteractive({ cursor: 'pointer' });
                caixa.on('pointerdown', (ptr) => {
                    if (ptr.rightButtonDown()) { this.p2.i = i; this.p2.travado = false; }
                    else { this.p1.i = i; this.p1.travado = false; }
                    this.atualizarTudo();
                    D.audio.menu();
                });
                const chave = ARTE.gerarSpritesheet(this, p);
                const retrato = this.add.image(pos.x, pos.y + 40, chave, 0).setOrigin(0.5, 0.95).setScale(1.5);
                this.tweens.add({ targets: retrato, frame: { from: 0, to: 1 }, duration: 400 + i * 40, yoyo: true, repeat: -1 });
                this.add.text(pos.x, pos.y - 56, p.nome, { fontFamily: FONTE, fontSize: '18px', fontStyle: 'bold', color: '#e2e8f0' }).setOrigin(0.5);
                this.boxes.push({ caixa: caixa, retrato: retrato, i: i });
            });
            this.cur1 = this.add.rectangle(0, 0, 164, 158).setStrokeStyle(5, 0x38bdf8).setFillStyle(0x38bdf8, 0.16).setDepth(3);
            this.cur2 = this.add.rectangle(0, 0, 164, 158).setStrokeStyle(5, 0xf87171).setFillStyle(0xf87171, 0.12).setDepth(3);
            this.rot1 = this.add.text(0, 0, 'P1', { fontFamily: FONTE, fontSize: '15px', fontStyle: 'bold', color: '#38bdf8', backgroundColor: '#0b1120', padding: { x: 5, y: 2 } }).setDepth(4);
            this.rot2 = this.add.text(0, 0, 'P2', { fontFamily: FONTE, fontSize: '15px', fontStyle: 'bold', color: '#f87171', backgroundColor: '#0b1120', padding: { x: 5, y: 2 } }).setDepth(4);
        }

        desenharPainel() {
            const g = this.add.graphics();
            g.fillStyle(0x0b1120, 0.92);
            g.fillRoundedRectangle(812, 108, 440, 590, 16);
            g.lineStyle(2, 0x334155, 1);
            g.strokeRoundedRectangle(812, 108, 440, 590, 16);
            this.txtInfo = this.add.text(836, 280, '', { fontFamily: 'monospace', fontSize: '15px', color: '#e2e8f0', wordWrap: { width: 392 }, lineSpacing: 6 });
            this.txtGolpes = this.add.text(836, 480, '', { fontFamily: 'monospace', fontSize: '15px', color: '#fde047', lineSpacing: 6 });
            this.retrato = this.add.image(1032, 250, '__DEFAULT').setOrigin(0.5, 0.92).setScale(1.25);
            this.add.text(836, 460, 'GOLPES ESPECIAIS  (aprenda os desenhos!)', { fontFamily: FONTE, fontSize: '14px', color: '#38bdf8' });
            this.txtNome = this.add.text(1032, 128, '', { fontFamily: FONTE, fontSize: '26px', fontStyle: 'bold', color: '#fbbf24' }).setOrigin(0.5);
        }

        /** Muda tudo que aparece na tela. */
        atualizarTudo() {
            const p1 = posicaoDoEstudo(this.p1.i);
            const p2 = posicaoDoEstudo(this.p2.i);
            this.cur1.setPosition(p1.x, p1.y);
            this.cur2.setPosition(p2.x, p2.y).setVisible(this.modo === 1);
            this.rot1.setPosition(p1.x - 78, p1.y - 82);
            this.rot2.setPosition(p2.x + 42, p2.y + 62).setVisible(this.modo === 1);
            this.boxes.forEach(function (b) {
                const eP1 = b.i === this.p1.i;
                const eP2 = b.i === this.p2.i && this.modo === 1;
                b.caixa.setStrokeStyle(eP1 || eP2 ? 4 : 3, eP1 ? 0x38bdf8 : eP2 ? 0xf87171 : 0x334155);
                b.caixa.setFillStyle(b.i === this.p1.i ? 0x0d2a45 : 0x111c31, 1);
            }, this);

            const f = D.ELENCO[this.p1.i];
            this.txtNome.setText(f.nome + ' — ' + f.titulo);
            this.txtInfo.setText(
                '"' + f.frase + '"\n\n' + f.descricao + '\n\n' +
                'VIDA    ' + medidor(f.atributos.vida) + '\n' +
                'VELOC.  ' + medidor(f.atributos.velocidade) + '\n' +
                'FORÇA   ' + medidor(f.atributos.forca) + '\n' +
                'DEFESA  ' + medidor(2 - f.atributos.defesa) + '\n' +
                'ESTILO DA MÁQUINA: ' + f.estilo.forma.toUpperCase()
            );
            const linhas = D.golpesDoPersonagem(f).map(function (g) {
                return '· ' + g.nome.padEnd(20, ' ') + g.texto;
            });
            this.txtGolpes.setText(linhas.join('\n'));
            const chave = 'lutador-' + f.id;
            if (this.textures.exists(chave)) this.retrato.setTexture(chave, 0);

            this.txtModo.setText('MODO: ' + D.NOMES_MODOS[this.modo] + '   ·   CPU: ' + D.NOMES_DIFICULDADE[this.dificuldade]);
            const itens = [
                ['MODO', D.NOMES_MODOS[this.modo]],
                ['CPU', D.NOMES_DIFICULDADE[this.dificuldade]],
                ['P1 É', ['TECLADO', 'GAMEPAD', 'MÁQUINA (espectador)'][this.controleP1]],
                ['CAIXAS', this.mostrarCaixas ? 'MOSTRANDO hitbox/hurtbox' : 'escondidas']
            ];
            this.txtSetup.setText(itens.map(function (linha, i) {
                return (this.aba === i ? '▶ ' : '  ') + linha[0].padEnd(7, ' ') + linha[1];
            }, this).join('\n'));

            let dica;
            if (this.modo === 1 && !this.p1.travado) dica = 'P1: ENTER para travar sua escolha';
            else if (this.modo === 1) dica = 'P2: [B] para travar · [Y] soco · [U] chute';
            else if (this.modo === 2) dica = 'CPU vs CPU: aperte ENTER para lutar agora, ou espere ' + Math.ceil(Math.max(0, this.autoDemo) / 60) + 's';
            else dica = 'ENTER para começar';
            this.txtRodape.setText(
                'SETAS = escolher lutador · Q/E = trocar de aba · ESPAÇO ou D = mudar o valor · A = valor anterior\n' +
                'P2 humano: F G H J escolhem e [B] trava · ' + dica + '   |   TREINO = vida infinita e super enche rápido'
            );
        }

        /** Muda o VALOR da aba escolhida (modo, dificuldade, controle, caixas). */
        mudarValor(passo) {
            if (this.aba === 0) {
                this.modo = (this.modo + passo + 4) % 4;
                this.p1.travado = false; this.p2.travado = false;
                this.autoDemo = this.modo === 2 ? 300 : 0;
            } else if (this.aba === 1) {
                this.dificuldade = (this.dificuldade + passo + 4) % 4;
            } else if (this.aba === 2) {
                this.controleP1 = (this.controleP1 + passo + 3) % 3;
            } else {
                this.mostrarCaixas = !this.mostrarCaixas;
            }
            D.audio.menu();
            this.atualizarTudo();
        }

        /** Move o cursor de um jogador na grade 4x2. */
        mexerGrade(quem, dx, dy) {
            if (!quem || quem.travado) return;
            let i = quem.i + dx + dy * COLUNAS;
            if (i < 0) i += D.ELENCO.length;
            if (i >= D.ELENCO.length) i -= D.ELENCO.length;
            quem.i = i;
            D.audio.menu();
            this.atualizarTudo();
        }

        /** Gamepad no menu: se alguém apertou algo, o P1 vira jogador de controle. */
        lerGamepad() {
            const pads = navigator.getGamepads ? Array.prototype.slice.call(navigator.getGamepads()) : [];
            const pad = pads.filter(function (p) { return p && p.buttons && p.buttons.length > 5; })[0];
            if (!pad) return null;
            const apertado = function (i) { return !!(pad.buttons[i] && (pad.buttons[i].pressed || pad.buttons[i].value > 0.4)); };
            const eixoX = pad.axes[0] || 0;
            const eixoY = pad.axes[1] || 0;
            const agora = {
                esquerda: eixoX < -0.4 || apertado(14),
                direita: eixoX > 0.4 || apertado(15),
                cima: eixoY < -0.4 || apertado(12),
                baixo: eixoY > 0.4 || apertado(13),
                confirmar: apertado(0) || apertado(9)
            };
            const novo = {};
            for (const k in agora) { novo[k] = agora[k] && !this.padAnt[k]; }
            this.padAnt = agora;
            return novo;
        }

        aohClicar(ptr) {
            if (ptr.rightButtonDown()) return;
            const alvo = this.input.manager.hitTestPointer(ptr);
            if (alvo && alvo.length) return;   // clicou num lutador: já tratado
            this.travar(1);
        }

        travar(qual) {
            const quem = qual === 1 ? this.p1 : this.p2;
            if (this.modo === 1) {
                quem.travado = true;
                D.audio.confirmar();
                if (this.p1.travado && this.p2.travado) this.comecar();
                return;
            }
            this.p1.travado = true;
            this.p2.travado = true;
            D.audio.confirmar();
            this.comecar();
        }

        comecar() {
            if (this.saindo) return;
            this.saindo = true;
            if (this.modo === 2) {
                // demonstração: a máquina sorteia os dois lutadores
                this.p1.i = Math.floor(Math.random() * D.ELENCO.length);
                this.p2.i = (this.p1.i + 1 + Math.floor(Math.random() * (D.ELENCO.length - 1))) % D.ELENCO.length;
            }
            if (this.modo !== 1 && this.p2.i === this.p1.i) this.p2.i = (this.p1.i + 4) % D.ELENCO.length;
            const e = window.ESTADO;
            e.modo = this.modo;
            e.dificuldade = this.dificuldade;
            e.p1Index = this.p1.i;
            e.p2Index = this.p2.i;
            e.controleP1 = this.controleP1;
            e.mostrarCaixas = this.mostrarCaixas;
            e.p1 = D.ELENCO[this.p1.i];
            e.p2 = D.ELENCO[this.p2.i];
            this.txtModo.setText('BOA LUTA!');
            this.cameras.main.fadeOut(260, 6, 6, 14);
            this.time.delayedCall(270, () => this.scene.start('Luta'));
        }

        update() {
            const t = this.t;
            const J = Phaser.Input.Keyboard.JustDown;

            // grade: as SETAS sempre escolhem o lutador do P1 (nada de atalho escondido)
            if (J(t.LEFT)) this.mexerGrade(this.p1, -1, 0);
            if (J(t.RIGHT)) this.mexerGrade(this.p1, 1, 0);
            if (J(t.UP)) this.mexerGrade(this.p1, 0, -1);
            if (J(t.DOWN)) this.mexerGrade(this.p1, 0, 1);

            // abas de configuração e seus valores
            if (J(t.Q)) { this.aba = (this.aba + 3) % 4; D.audio.menu(); this.atualizarTudo(); }
            if (J(t.E)) { this.aba = (this.aba + 1) % 4; D.audio.menu(); this.atualizarTudo(); }
            if (J(t.SPACE) || J(t.D) && this.aba !== 0) this.mudarValor(1);
            if (J(t.A) && this.aba !== 0) this.mudarValor(-1);

            // P2 humano (modo 2 jogadores): F/G/H/J na grade, B trava
            if (this.modo === 1) {
                if (J(t.F)) this.mexerGrade(this.p2, -1, 0);
                if (J(t.G)) this.mexerGrade(this.p2, 1, 0);
                if (J(t.H)) this.mexerGrade(this.p2, 0, -1);
                if (J(t.V)) this.mexerGrade(this.p2, 0, 1);
                if (J(t.B)) this.travar(2);
            }
            if (J(t.ENTER)) this.travar(1);

            // gamepad no menu (vira o P1 automaticamente)
            const pad = this.lerGamepad();
            if (pad) {
                if (pad.esquerda) this.mexerGrade(this.p1, -1, 0);
                if (pad.direita) this.mexerGrade(this.p1, 1, 0);
                if (pad.cima) this.mexerGrade(this.p1, 0, -1);
                if (pad.baixo) this.mexerGrade(this.p1, 0, 1);
                if (pad.confirmar) { this.controleP1 = 1; this.travar(1); }
            }

            if (this.modo === 2) {
                this.cadencia++;
                if (this.autoDemo > 0) {
                    this.autoDemo--;
                    if (this.autoDemo % 30 === 0) this.atualizarTudo();
                    if (this.autoDemo <= 0) this.travar(1);
                }
            }
        }
    }

    function medidor(valor) {
        const total = 5;
        const cheio = Math.max(0, Math.min(total, Math.round(valor * total / 1.15)));
        return '▮'.repeat(cheio) + '▯'.repeat(total - cheio);
    }

    /* =================================================================
       CENA 3 — RESULTADO (com estatísticas para discutir em aula)
       ================================================================= */
    /* =================================================================
       ETAPA 3 — RESULTADO: placar, estatísticas e "jogar de novo"
       ================================================================= */
    class Resultado extends Phaser.Scene {
        constructor() { super('Resultado'); }

        create() {
            const r = (window.ESTADO && window.ESTADO.resultado) || {
                vencedorNome: 'KIRO — O Monge da Chama', venceuJogador: true, placar: '2 x 1',
                estatisticas: [], comando: '→ ↓ ↘ → + S', nomeGolpe: 'Esfera de Luz'
            };
            const cx = D.LARGURA_TELA / 2;

            const g = this.add.graphics();
            g.fillGradientStyle(0x0f172a, 0x1e293b, 0x020617, 0x0b1120, 1);
            g.fillRect(0, 0, D.LARGURA_TELA, D.ALTURA_TELA);
            for (let i = 0; i < 60; i++) {
                g.fillStyle(0xfbbf24, Math.random() * 0.25);
                g.fillRect(Math.random() * D.LARGURA_TELA, Math.random() * D.ALTURA_TELA, 2, 2);
            }

            this.add.text(cx, 90, r.venceuJogador ? 'VOCÊ VENCEU! 🏆' : 'FIM DE LUTA', {
                fontFamily: FONTE, fontSize: '64px', fontStyle: 'bold', color: r.venceuJogador ? '#22c55e' : '#f87171',
                stroke: '#0b1120', strokeThickness: 12
            }).setOrigin(0.5).setScale(0.5).setAlpha(0);
            this.tweens.add({ targets: this.children.list[this.children.list.length - 1], scale: 1, alpha: 1, duration: 420, ease: 'Back.easeOut' });
            this.add.text(cx, 150, r.vencedorNome + '   ·   placar ' + r.placar, {
                fontFamily: FONTE, fontSize: '24px', color: '#fde047'
            }).setOrigin(0.5);

            const colunas = ['MAIOR COMBO', 'DANO TOTAL', 'VIDA QUE SOBROU', 'QUEM CONTROLAVA'];
            r.estatisticas.forEach((est, i) => {
                const x = 250 + i * 620;
                this.add.text(x, 230, est.nome, { fontFamily: FONTE, fontSize: '30px', fontStyle: 'bold', color: '#e2e8f0' }).setOrigin(0.5);
                const linhas = [est.maiorCombo + ' hits', est.dano + ' de dano', est.vida + ' de vida', est.controle];
                linhas.forEach(function (txt, j) {
                    this.add.text(x, 290 + j * 34, colunas[j] + ':  ' + txt, { fontFamily: 'monospace', fontSize: '17px', color: '#94a3b8' }).setOrigin(0.5);
                }, this);
                const chave = 'lutador-' + D.ELENCO.find(function (p) { return p.nome === est.nome; }).id;
                if (this.textures.exists(chave)) {
                    const img = this.add.image(x, 560, chave, 0).setOrigin(0.5, 0.95).setScale(2.1);
                    this.tweens.add({ targets: img, frame: { from: 0, to: 1 }, duration: 400, yoyo: true, repeat: -1 });
                }
            });

            this.add.text(cx, 470, 'O golpe que decidiu a luta:  ' + r.nomeGolpe + '   →   ' + r.comando, {
                fontFamily: 'monospace', fontSize: '19px', color: '#fde047', backgroundColor: '#0b1120', padding: { x: 14, y: 8 }
            }).setOrigin(0.5);

            const botoes = [
                ['[R]', 'revanche com os mesmos lutadores'],
                ['[E]', 'trocar de lutador'],
                ['[T]', 'voltar para a tela inicial'],
                ['[C]', 'copiar a lista de golpes (aparece no console F12)']
            ];
            botoes.forEach(function (b, i) {
                this.add.text(cx, 540 + i * 30, b[0].padEnd(7, ' ') + b[1], { fontFamily: 'monospace', fontSize: '17px', color: i === 0 ? '#7dd3fc' : '#94a3b8' }).setOrigin(0.5);
            }, this);

            this.k = {};
            ['R', 'E', 'T', 'C'].forEach((nome) => { this.k[nome] = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[nome]); });
            this.add.text(cx, D.ALTURA_TELA - 26, 'Aprender jogando: cada número do jogo está em src/jogo/dados.js — mude e veja o que acontece!', {
                fontFamily: 'monospace', fontSize: '14px', color: '#475569'
            }).setOrigin(0.5);
            this.cameras.main.fadeIn(300, 6, 6, 14);
        }

        update() {
            const J = Phaser.Input.Keyboard.JustDown;
            if (J(this.k.R)) { D.audio.confirmar(); this.scene.start('Luta'); }
            if (J(this.k.E)) { D.audio.confirmar(); this.scene.start('Selecao'); }
            if (J(this.k.T)) { D.audio.menu(); this.scene.start('Titulo'); }
            if (J(this.k.C)) {
                const e = window.ESTADO;
                [e.p1, e.p2].forEach(function (p) {
                    if (!p) return;
                    console.log('=== ' + p.nome + ' ===');
                    D.golpesDoPersonagem(p).forEach(function (g) { console.log(g.nome + ': ' + g.texto); });
                });
                this.scene.key;
                alert('A lista de golpes foi impressa no console (tecla F12). Abra para ver!');
            }
        }
    }

    return { Titulo, Selecao, Resultado };
})();

if (typeof window !== 'undefined') { window.MENUS = MENUS; }
