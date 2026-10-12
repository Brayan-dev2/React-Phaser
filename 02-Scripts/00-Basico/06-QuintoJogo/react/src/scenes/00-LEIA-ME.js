/* =====================================================================
   POR QUE ESTA PASTA EXISTE?
   ---------------------------------------------------------------------
   Nos jogos deste repositório as cenas moram em src/jogo/. Aqui dentro o
   React precisa delas, mas NÃO queremos copiar o código (copia duplicada =
   bug duplicado). Então usamos o alias "jogo" do vite.config.js, que aponta
   para a pasta ../src/jogo. Se você criar uma cena nova, faça assim:

       // react/src/scenes/MinhaCena.js
       import 'jogo/dados.js'
       export default class MinhaCena extends Phaser.Scene { ... }

   ...e escreva o jogo de verdade em src/jogo/, onde os dois mundos enxergam.
   ===================================================================== */
