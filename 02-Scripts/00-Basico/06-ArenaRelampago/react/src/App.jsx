import PhaserGame from './PhaserGame.jsx'

/* O componente de página: ele é só a Moldura. Nada de lógica de jogo aqui!
   (se você tentar fazer a barra de vida em JSX, vai sofrer: quem desenha a
   luta é o canvas do Phaser. O React é ótimo para o RESTO da interface.) */
export default function App() {
  return (
    <div className="pagina">
      <header className="cabecalho">
        <p className="etiqueta">02 — SCRIPTS / QUINTO JOGO</p>
        <h1>⚡ ARENA <span>RELÂMPAGO</span></h1>
        <p>Jogo de luta 2D clássico: 8 lutadores, golpes com frame data, especiais por comando e uma máquina que pensa com regras.</p>
      </header>

      {/* É AQUI dentro que o canvas do Phaser nasce. */}
      <section id="game-container" aria-label="Área do jogo">
        <PhaserGame />
      </section>

      <footer className="rodape">
        P1: setas · <kbd>A</kbd> soco · <kbd>D</kbd> chute · <kbd>E</kbd> forte · <kbd>A</kbd>+<kbd>D</kbd> projeção/supremo ·
        P2: <kbd>H</kbd><kbd>J</kbd><kbd>K</kbd><kbd>L</kbd> · <kbd>Y</kbd> <kbd>U</kbd> <kbd>T</kbd> · segurar para trás bloqueia · <kbd>V</kbd> caixas
      </footer>

      <section className="guia">
        <details>
          <summary>o que cada arquivo ensina (abra aqui!)</summary>
          <ul>
            <li><code>src/jogo/dados.js</code> — o BALANCEAMENTO: vida, dano, frames de cada golpe e o elenco. Mude números e veja o jogo mudar.</li>
            <li><code>src/jogo/desenhos.js</code> — a ARTE: os lutadores são desenhados por código (Graphics + generateTexture), sem PNG.</li>
            <li><code>src/jogo/ia.js</code> — o CÉREBRO da máquina: uma fila de “apertões de botão” e 12 regrinhas de decisão.</li>
            <li><code>src/jogo/menus.js</code> — as cenas de TÍTULO, SELEÇÃO e RESULTADO.</li>
            <li><code>src/jogo/luta.js</code> — a ARENA: entradas de comando, hitbox/hurtbox, bloqueio, combo, K.O., HUD e fita de comandos.</li>
          </ul>
          <p>Funciona também sem React: abra <code>../index.html</code> direto no navegador.</p>
        </details>
      </section>
    </div>
  )
}
