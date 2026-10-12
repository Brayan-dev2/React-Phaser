import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/* O jogo em si mora UMA PASTA ACIMA (em ../src/jogo), porque o mesmo código
   precisa funcionar no index.html "sem instalar nada" e aqui no React.
   `fs.allow` diz ao servidor do Vite que ele pode servir arquivos do pai. */
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      jogo: path.resolve(__dirname, '../src/jogo'),
    },
  },
  server: {
    host: true,
    fs: { allow: [path.resolve(__dirname, '..')] },
  },
})
