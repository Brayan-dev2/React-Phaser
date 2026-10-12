import PhaserGame from './PhaserGame.jsx'

/* Componente principal da aula: um cabeçalho + a área do jogo.
   O React cuida do "site"; o Phaser cuida do jogo. Cada um na sua! */
export default function App() {
  return (
    <main className="page">
      <header className="hero">
        <p className="kicker">02 - Scripts / Meu Segundo Jogo</p>
        <h1>Segundo Jogo - Ação e Tiro (estilo Metal Slug)</h1>
        <p className="subtitle">
          Rode com <code>npm install</code> e depois <code>npm run dev</code>.
          O código da aula está em <code>src/scenes/Jogo.js</code>.
        </p>
      </header>

      <section className="game-shell" aria-label="Area do jogo">
        <PhaserGame />
      </section>
    </main>
  )
}
