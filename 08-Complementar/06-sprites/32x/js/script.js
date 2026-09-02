// Configuração dimensional base do sprite
const frameWidth = 70;      // Área aproximada de cada quadro na folha 800x800
const frameHeight = 70;
const firstFrameX = 29;      // Primeiro quadro começa após o título da animação
const frameStepX = 75;       // Distância entre quadros consecutivos
const animationSpeed = 120; // Velocidade da troca de quadros (em milissegundos)

// Mapeamento dos estados com base na folha de imagem enviada
// 'rowY' é a posição vertical aproximada (em pixels) onde a linha do sprite começa na imagem
const animations = {
    idle:   { rowY: 73,  totalFrames: 4 },
    run:    { rowY: 160, totalFrames: 10 },
    jump:   { rowY: 247, totalFrames: 7 },
    attack: { rowY: 405, totalFrames: 7 },
    climb:  { rowY: 643, totalFrames: 7 }
};

// Estado inicial do personagem
let currentState = 'idle';
let currentFrame = 0;
const spriteBox = document.getElementById('sprite-box');
let animationInterval;

function animate() {
    const anim = animations[currentState];
    
    // Calcula a posição X (horizontal) correndo pelos frames da linha
    const positionX = -(firstFrameX + currentFrame * frameStepX);
    // Pega a posição Y (vertical) fixa daquela animação específica
    const positionY = -anim.rowY;
    
    // Aplica o deslocamento de fundo no CSS
    spriteBox.style.backgroundPosition = `${positionX}px ${positionY}px`;
    
    // Avança o frame e faz o loop voltar ao zero quando chega no fim
    currentFrame = (currentFrame + 1) % anim.totalFrames;
}

// Função chamada pelos botões para trocar o estado atual
function changeAnimation(newState) {
    if (animations[newState]) {
        currentState = newState;
        currentFrame = 0; // Reseta para o primeiro quadro da nova animação
    }
}

// Inicia o loop contínuo do jogo/apresentação
animate();
animationInterval = setInterval(animate, animationSpeed);
