/* =====================================================================
   QUINTO JOGO — ARENA RELÂMPAGO
   ---------------------------------------------------------------------
   TRILHAS SONORAS DE FUNDO — troca de música por tela
   =====================================================================
   As trilhas são arquivos MP3 em assets/musica/ (gerados por
   ferramentas/gerar_musicas.py). Cada tela pede a sua:

       Título    -> titulo.mp3   (ambiente, chuva e trovão)
       Seleção   -> selecao.mp3  (groove funk)
       Luta      -> luta.mp3     (rápida e agressiva)
       Resultado -> titulo.mp3

   Didática: o Phaser toca a música pelo “gerenciador de som” (this.sound).
   Os efeitos sonoros (soco, bloqueio…) continuam sintetizados em dados.js.
   Se um arquivo não existir (ex.: versão React, cuja raiz é outra pasta),
   o jogo segue em silêncio de música — nada quebra.
   ===================================================================== */

const MUSICA = (function () {
    'use strict';

    const FAIXAS = {
        titulo: { chave: 'musica-titulo', arquivo: 'assets/musica/titulo.mp3', volume: 0.42 },
        selecao: { chave: 'musica-selecao', arquivo: 'assets/musica/selecao.mp3', volume: 0.40 },
        luta: { chave: 'musica-luta', arquivo: 'assets/musica/luta.mp3', volume: 0.34 }
    };

    let atual = null;      // objeto de som tocando agora
    let nomeAtual = null;  // 'titulo' | 'selecao' | 'luta'

    /** Pede para carregar as trilhas (chame no preload de uma cena). */
    function carregar(cena) {
        Object.keys(FAIXAS).forEach(function (nome) {
            const f = FAIXAS[nome];
            if (!cena.cache.audio.exists(f.chave)) cena.load.audio(f.chave, f.arquivo);
        });
    }

    /** Para a música que estiver tocando. */
    function parar() {
        if (atual) {
            atual.stop();
            atual.destroy();
        }
        atual = null;
        nomeAtual = null;
    }

    /** Toca a trilha pedida em loop. Se já estiver tocando a mesma, não recomeça. */
    function tocar(cena, nome) {
        if (nomeAtual === nome && atual) return;
        parar();
        const f = FAIXAS[nome];
        if (!f || !cena.cache.audio.exists(f.chave)) return;   // arquivo ausente: silêncio
        atual = cena.sound.add(f.chave, { loop: true, volume: f.volume });
        atual.play();
        nomeAtual = nome;
    }

    /** Pausa / continua a música (usado no menu de pausa). */
    function pausar(pausado) {
        if (!atual) return;
        if (pausado) atual.pause();
        else atual.resume();
    }

    /** Liga/desliga TODO o som do jogo (música inclusive). */
    function mudo(cena, ligado) {
        cena.sound.mute = ligado;
    }

    return { carregar: carregar, tocar: tocar, parar: parar, pausar: pausar, mudo: mudo };
})();

if (typeof window !== 'undefined') { window.MUSICA = MUSICA; }
