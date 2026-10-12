/* =====================================================================
   QUINTO JOGO — ARENA RELÂMPAGO
   ---------------------------------------------------------------------
   ARQUIVO 5 — LIGAR O JOGO (modo "sem instalar nada")
   =====================================================================
   Este arquivo é minúsculo de propósito! Toda a configuração está dentro
   de dados.js, na função criarConfiguracao(), porque o React precisa da
   MESMA configuração. Escrever uma vez e usar em dois lugares tem nome:
   princípio DRY — "Don't Repeat Yourself" (não repita a si mesmo).

   Ordem das tags <script> no index.html (a ordem IMPORTA):
     1. lib/phaser.min.js   -> a biblioteca
     2. jogo/dados.js       -> números e regras       (window.DADOS)
     3. jogo/desenhos.js    -> desenhos por código    (window.DESINHOS)
     4. jogo/ia.js          -> cérebro da máquina     (window.IA)
     5. jogo/menus.js       -> título/seleção/resultado (window.MENUS)
     6. jogo/luta.js        -> a arena e os lutadores (window.CENAS.Luta)
     7. src/main.js         -> este arquivo: liga tudo!
   ===================================================================== */

/* A configuração é criada pela própria função que o React também usa. */
const config = window.DADOS.criarConfiguracao('game-container');

/* Guardamos o jogo numa variável global para que o aluno possa "espiar"
   o jogo vivo pelo console do navegador (tecla F12). Exemplo:
       window.jogo.scene.getScene('Luta').lutadores[0].vida
   É uma das maneiras mais divertidas de aprender a depurar! */
window.jogo = new Phaser.Game(config);

/* Um atalho carinhoso para a turma: `luta()` no console abre o jogo de novo. */
window.luta = function () {
    window.jogo.scene.getScene('Luta').scene.restart();
};
