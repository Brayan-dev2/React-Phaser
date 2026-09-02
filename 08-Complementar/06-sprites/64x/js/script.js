// Configuração dimensional base do sprite
// A sprite sheet (art1.jpg) tem 1800px × 1200px
// Cada célula ocupa 200px de largura × 240px de altura
// A primeira coluna contém apenas os rótulos (IDLE, WALK, etc.), por isso firstFrameX começa em 200
const frameWidth = 200;       // largura de cada quadro da sprite
const frameHeight = 240;      // altura de cada quadro da sprite
const firstFrameX = 200;      // posição X inicial do primeiro frame útil (pula a coluna de rótulos)
const frameStepX = frameWidth;// distância horizontal entre quadros (igual à largura do quadro)
const animationSpeed = 180;   // tempo em milissegundos entre cada troca de quadro

// Mapeamento dos estados com base na sprite sheet
// Cada estado corresponde a uma linha da imagem
// 'rowY' indica a posição vertical (em px) onde começa a linha de animação (múltiplos de 240)
const animations = {
    idle:   { rowY: 0,    totalFrames: 6 },  // linha do personagem parado
    walk:   { rowY: 240,  totalFrames: 8 },  // linha do personagem andando
    run:    { rowY: 480,  totalFrames: 8 },  // linha do personagem correndo
    jump:   { rowY: 720,  totalFrames: 8 },  // linha do personagem pulando
    attack: { rowY: 960,  totalFrames: 4 }   // linha do personagem atacando
};

// Estado inicial do personagem
let currentState = 'idle';    // começa parado
let currentFrame = 0;         // começa no primeiro quadro
const spriteBox = document.getElementById('sprite-box'); // pega o elemento HTML que mostra o sprite
let animationInterval;        // variável para guardar o loop de animação

// Função que atualiza a animação a cada ciclo
function animate() {
    const anim = animations[currentState]; // pega os dados da animação atual

    // Calcula a posição X do quadro atual (negativo porque deslocamos a imagem para a esquerda)
    const positionX = -(firstFrameX + currentFrame * frameStepX);
    // Pega a posição Y fixa da linha correspondente (negativo porque deslocamos a imagem para cima)
    const positionY = -anim.rowY;

    // Aplica a posição no CSS para mostrar apenas o quadro correto da sprite sheet
    spriteBox.style.backgroundPosition = `${positionX}px ${positionY}px`;

    // Avança para o próximo quadro, voltando ao início quando chega no fim
    currentFrame = (currentFrame + 1) % anim.totalFrames;
}

// Função chamada pelos botões para trocar o estado atual da animação
function changeAnimation(newState) {
    if (animations[newState]) {   // só troca se o estado existir no mapeamento
        currentState = newState;  // muda para o novo estado
        currentFrame = 0;         // reinicia no primeiro quadro da nova animação
    }
}

// Inicia o loop contínuo da animação
animate(); // chama uma vez para desenhar o primeiro quadro imediatamente
animationInterval = setInterval(animate, animationSpeed); // repete a função animate a cada "animationSpeed" ms
