import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Renderizamos o App direto, sem <StrictMode>.
// Motivo: o StrictMode faz o useEffect rodar 2 vezes em dev,
// o que pode causar conflito com o Phaser (que não gosta
// de ser criado e destruído rapidamente).
createRoot(document.getElementById("root")!).render(<App />);
