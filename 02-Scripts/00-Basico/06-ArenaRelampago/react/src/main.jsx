/* =====================================================================
   QUINTO JOGO — ARENA RELÂMPAGO
   ---------------------------------------------------------------------
   ARQUIVO DO REACT — LIGAR O REACT E ENTREGAR A TELA PARA O PHASER
   =====================================================================
   A lição central deste repositório inteiro está nestas poucas linhas:

     • o REACT cuida da volta do jogo  (cabeçalho, rodapé, explicações);
     • o PHASER cuida do jogo em si    (loop, física, desenho, luta).

   E reparamos numa coisa: NÓS NÃO COPIAMOS O JOGO PARA DENTRO DE /react.
   Os mesmos arquivos de ../src/jogo são importados aqui. No index.html da
   raiz eles entram com <script>; aqui eles entram com <import>. Código
   igual, duas embalagens — isso é o que se chama de código "isomórfico"
   para fins didáticos (e o motivo de cada arquivo de jogo terminar com a
   pontezinha `if (typeof window !== 'undefined') ...`).
   ===================================================================== */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
