/* =====================================================================
   AULA 01 - Plano de Fundo
   Arquivo "main.js": é aqui que o jogo é LIGADO.
   Ele diz ao Phaser: qual tamanho, qual cor de fundo, qual cena usar.
   Você quase não precisa mexer neste arquivo. O conteúdo da aula está
   em: src/scenes/Jogo.js
   ===================================================================== */

const config = {
    type: Phaser.AUTO,          // AUTO = o navegador escolhe o melhor jeito de desenhar
    width: 1280,                // largura da tela do jogo, em pixels
    height: 720,                // altura da tela do jogo, em pixels
    parent: 'game-container',   // o nome da <div> onde o jogo vai aparecer
    backgroundColor: '#0b1020', // cor de fundo (antes das imagens carregarem)
    pixelArt: true,             // deixa a arte pixelada nítida, sem borrar
    scale: {
        mode: Phaser.Scale.FIT,             // ajusta o jogo ao tamanho da janela
        autoCenter: Phaser.Scale.CENTER_BOTH // e mantém centralizado
    },
    scene: [Jogo]               // a nossa cena (definida em src/scenes/Jogo.js)
};

// Guardamos o jogo numa variável e deixamos ele visível na página.
// Assim você pode explorar o jogo pelo console do navegador (tecla F12):
// experimente digitar  jogo.scene.getScene('Jogo')  e apertar Enter!
window.jogo = new Phaser.Game(config);
