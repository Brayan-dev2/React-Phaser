/* Ponto de partida de qualquer site React: procura a <div id="root">
   e desenha o componente <App /> dentro dela. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
