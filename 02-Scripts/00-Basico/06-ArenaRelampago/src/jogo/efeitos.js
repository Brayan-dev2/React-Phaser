/* =====================================================================
   QUINTO JOGO — ARENA RELÂMPAGO
   ---------------------------------------------------------------------
   EFEITOS VISUAIS — faíscas, brilhos, relâmpagos, rastros e vinheta
   =====================================================================
   Tudo aqui é “enfeite”: NÃO mexe na regra da luta. Quem decide se um
   golpe acertou é o luta.js. Este arquivo só mostra na tela o que
   aconteceu. Assim a turma aprende uma ideia importante dos jogos:
   LÓGICA e APRESENTAÇÃO são coisas separadas.

   Técnicas usadas (para estudar):
     • texturas RADIAIS geradas por código com <canvas> (sem PNG);
     • emissor de partículas do Phaser com mistura ADD (a luz “soma”,
       por isso o brilho parece de verdade);
     • rastro “fantasma”: cópias do lutador que somem devagar;
     • relâmpago desenhado com uma linha quebrada aleatória;
     • vinheta: escurecimento nas bordas, para focar o centro da luta.

   ÍNDICE
     1. Texturas (brilho, vinheta)
     2. Faíscas e explosões (partículas)
     3. Rastros, anéis e aura de supremo
     4. Relâmpago, linhas de velocidade e vinheta
   ===================================================================== */

const EFEITOS = (function () {
    'use strict';

    const LARGURA = 1280;
    const ALTURA = 720;

    /* -----------------------------------------------------------------
       1. TEXTURAS RADIAIS — um gradiente desenhado no <canvas>
       ----------------------------------------------------------------- */
    function texturaRadial(cena, chave, largura, altura, paradas, escalaElipse) {
        if (cena.textures.exists(chave)) return;
        const c = document.createElement('canvas');
        c.width = largura;
        c.height = altura;
        const ctx = c.getContext('2d');
        ctx.save();
        ctx.translate(largura / 2, altura / 2);
        ctx.scale(1, escalaElipse || 1);
        const raio = Math.max(largura, altura) / 2;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, raio);
        paradas.forEach(function (p) { grad.addColorStop(p[0], p[1]); });
        ctx.fillStyle = grad;
        ctx.fillRect(-largura, -altura, largura * 2, altura * 2);
        ctx.restore();
        cena.textures.addCanvas(chave, c);
    }

    /** Cria as texturas usadas pelos efeitos (uma vez só). */
    function preparar(cena) {
        // brilho macio: centro branco que some na borda (base de todas as partículas)
        texturaRadial(cena, 'brilho', 64, 64, [
            [0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,0.85)'],
            [0.55, 'rgba(255,255,255,0.22)'], [1, 'rgba(255,255,255,0)']
        ]);
        // vinheta: bordas escuras, centro transparente (elipse para caber na tela 16:9)
        texturaRadial(cena, 'vinheta', LARGURA, ALTURA, [
            [0, 'rgba(0,0,0,0)'], [0.58, 'rgba(0,0,0,0)'], [0.85, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0.92)']
        ], ALTURA / LARGURA);
    }

    /* -----------------------------------------------------------------
       2. FAÍSCAS — um “estouro” de partículas em todas as direções
       ----------------------------------------------------------------- */
    function faiscas(cena, x, y, cor, quantidade, forca, profundidade) {
        const intensidade = forca || 1;
        const emissor = cena.add.particles(x, y, 'brilho', {
            speed: { min: 140 * intensidade, max: 460 * intensidade },
            angle: { min: 0, max: 360 },
            lifespan: { min: 160, max: 380 },
            scale: { start: 0.42 * intensidade, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: cor || 0xffffff,
            blendMode: 'ADD',
            gravityY: 700,
            emitting: false
        });
        emissor.setDepth(profundidade || 40);
        emissor.explode(quantidade || 10, x, y);
        cena.time.delayedCall(650, function () { emissor.destroy(); });
    }

    /** Faíscas que sobem (aura, comemoração). */
    function faiscasSobem(cena, x, y, cor, quantidade) {
        const emissor = cena.add.particles(x, y, 'brilho', {
            speed: { min: 60, max: 180 },
            angle: { min: 250, max: 290 },
            lifespan: { min: 380, max: 620 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.9, end: 0 },
            tint: cor || 0xffffff,
            blendMode: 'ADD',
            gravityY: -120,
            emitting: false
        });
        emissor.setDepth(40);
        emissor.explode(quantidade || 6, x, y);
        cena.time.delayedCall(900, function () { emissor.destroy(); });
    }

    /* -----------------------------------------------------------------
       3. RASTROS, ANÉIS E AURA
       ----------------------------------------------------------------- */

    /** Cópia do lutador que some devagar (rastro de velocidade). */
    function fantasma(cena, sprite, cor, depthBase) {
        if (!sprite || !sprite.active) return;
        const copia = cena.add.image(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
            .setOrigin(sprite.originX, sprite.originY)
            .setScale(sprite.scaleX, sprite.scaleY)
            .setFlipX(sprite.flipX)
            .setRotation(sprite.rotation)
            .setTint(cor || 0x93c5fd)
            .setAlpha(0.42)
            .setDepth((depthBase || sprite.depth) - 1);
        cena.tweens.add({
            targets: copia, alpha: 0, duration: 240, ease: 'Quad.easeOut',
            onComplete: function () { copia.destroy(); }
        });
    }

    /** Anel que cresce e some (impacto, pouso, aura). */
    function anel(cena, x, y, cor, tamanho, duracao) {
        const a = cena.add.image(x, y, 'anel')
            .setDepth(28)
            .setTint(cor || 0xffffff)
            .setAlpha(0.9)
            .setScale(0.3);
        cena.tweens.add({
            targets: a, scale: tamanho || 1.6, alpha: 0, duration: duracao || 340,
            ease: 'Cubic.easeOut', onComplete: function () { a.destroy(); }
        });
    }

    /** Brilho pontual que encolhe (rastro de projétil, chispa). */
    function brilhoPontual(cena, x, y, cor, escala, duracao) {
        const b = cena.add.image(x, y, 'brilho')
            .setDepth(20)
            .setTint(cor || 0xffffff)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(escala || 0.5)
            .setAlpha(0.8);
        cena.tweens.add({
            targets: b, alpha: 0, scale: 0.05, duration: duracao || 220,
            onComplete: function () { b.destroy(); }
        });
    }

    /** Aura de supremo: anéis pulsando ao redor do lutador. */
    function auraDeSuper(cena, x, y, cor) {
        anel(cena, x, y, cor, 2.4, 520);
        faiscasSobem(cena, x + (Math.random() - 0.5) * 60, y + 30, cor, 2);
    }

    /* -----------------------------------------------------------------
       4. RELÂMPAGO, LINHAS DE VELOCIDADE E VINHETA
       ----------------------------------------------------------------- */

    /** Relâmpago: uma linha quebrada (com brilho) do céu até o chão + flash. */
    function relampago(cena, xInicial, yInicial, yFinal) {
        const g = cena.add.graphics().setDepth(4);
        const pontos = [{ x: xInicial, y: yInicial }];
        let x = xInicial;
        let y = yInicial;
        while (y < yFinal) {
            y += 18 + Math.random() * 26;
            x += (Math.random() - 0.5) * 70;
            pontos.push({ x: x, y: y });
        }
        function desenhar(largura, cor, alfa) {
            g.lineStyle(largura, cor, alfa);
            g.beginPath();
            g.moveTo(pontos[0].x, pontos[0].y);
            for (let i = 1; i < pontos.length; i++) g.lineTo(pontos[i].x, pontos[i].y);
            g.strokePath();
        }
        desenhar(16, 0x60a5fa, 0.35);   // halo azul
        desenhar(5, 0xe0f2fe, 0.95);    // núcleo branco
        // um galho curto, como nos raios de verdade
        const meio = pontos[Math.floor(pontos.length / 2)];
        g.lineStyle(3, 0xbae6fd, 0.8);
        g.beginPath();
        g.moveTo(meio.x, meio.y);
        g.lineTo(meio.x + 60, meio.y + 40);
        g.strokePath();

        // flash da tela inteira
        const cam = cena.cameras.main;
        const flash = cena.add.rectangle(LARGURA / 2, ALTURA / 2, LARGURA, ALTURA, 0xdbeafe, 0.22)
            .setScrollFactor(0).setDepth(118);
        cena.tweens.add({ targets: flash, alpha: 0, duration: 260, onComplete: function () { flash.destroy(); } });
        cena.tweens.add({ targets: g, alpha: 0, duration: 240, delay: 60, onComplete: function () { g.destroy(); } });
        void cam;
    }

    /** Relâmpago sorteado no céu da arena (chamado de tempos em tempos pelo luta.js). */
    function relampagoAleatorio(cena) {
        const v = cena.cameras.main.worldView;
        const x = v.x + v.width * (0.15 + Math.random() * 0.7);
        relampago(cena, x, v.y - 10, 430 + Math.random() * 120);
    }

    /** Linhas finas que correm pela tela (início de round, supremo). */
    function linhasDeVelocidade(cena, cor, quantidade) {
        const total = quantidade || 18;
        for (let i = 0; i < total; i++) {
            const y = 80 + Math.random() * (ALTURA - 160);
            const esquerda = i % 2 === 0;
            const largura = 120 + Math.random() * 260;
            const x0 = esquerda ? -largura : LARGURA + largura;
            const x1 = esquerda ? LARGURA + 80 : -80;
            const linha = cena.add.rectangle(x0, y, largura, 2 + Math.random() * 3, cor || 0xffffff, 0.8)
                .setScrollFactor(0).setDepth(125);
            cena.tweens.add({
                targets: linha, x: x1, alpha: 0, duration: 360 + Math.random() * 260,
                delay: Math.random() * 120, ease: 'Quad.easeIn',
                onComplete: function () { linha.destroy(); }
            });
        }
    }

    /** Vinheta fixa na tela (fica por cima da arena, abaixo do HUD). */
    function criarVinheta(cena) {
        return cena.add.image(LARGURA / 2, ALTURA / 2, 'vinheta')
            .setScrollFactor(0)
            .setDisplaySize(LARGURA, ALTURA)
            .setDepth(117)
            .setAlpha(0.85);
    }

    /** Pisca a vinheta em vermelho/branco quando algo grande acontece (K.O.). */
    function pulsoDeTela(cena, cor, alfa) {
        const flash = cena.add.rectangle(LARGURA / 2, ALTURA / 2, LARGURA, ALTURA, cor || 0xffffff, alfa || 0.35)
            .setScrollFactor(0).setDepth(119);
        cena.tweens.add({ targets: flash, alpha: 0, duration: 380, onComplete: function () { flash.destroy(); } });
    }

    return {
        preparar: preparar,
        faiscas: faiscas,
        faiscasSobem: faiscasSobem,
        fantasma: fantasma,
        anel: anel,
        brilhoPontual: brilhoPontual,
        auraDeSuper: auraDeSuper,
        relampago: relampago,
        relampagoAleatorio: relampagoAleatorio,
        linhasDeVelocidade: linhasDeVelocidade,
        criarVinheta: criarVinheta,
        pulsoDeTela: pulsoDeTela
    };
})();

if (typeof window !== 'undefined') { window.EFEITOS = EFEITOS; }
