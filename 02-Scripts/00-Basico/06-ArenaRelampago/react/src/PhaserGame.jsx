import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'

/* =====================================================================
   A PONTE React -> Phaser (o arquivo mais importante de aprender!)
   ---------------------------------------------------------------------
   O que acontece aqui, em português:

   1) o React monta um <div> vazio e nos empresta a referência;
   2) nós entregamos ESSE div para o Phaser, que cria o <canvas> dentro;
   3) os arquivos do jogo são importados NA ORDEM (dados -> desenhos ->
      ia -> menus -> luta), exatamente como no index.html;
   4) quando o React desmonta o componente (mudança de página, hot
      reload), a gente DESTROI o jogo. Isso se chama "limpeza de efeito"
      e é o erro nº 1 de quem junta React com canvas: sem o return
      (cleanup), você ganha dois jogos rodando ao mesmo tempo.
   ===================================================================== */

/* A ordem abaixo NÃO é frescura: cada arquivo depende do anterior. */
const ORDEM_DOS_ARQUIVOS = [
  () => import('jogo/dados.js'),
  () => import('jogo/desenhos.js'),
  () => import('jogo/ia.js'),
  () => import('jogo/menus.js'),
  () => import('jogo/luta.js'),
]

export default function PhaserGame() {
  const containerRef = useRef(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let jogo = null
    let vivo = true

    /* Phaser é uma biblioteca antiga que procura por window.Phaser.
       No index.html isso acontece sozinho (a tag <script> cria o global);
       no React o import é um módulo, então criamos o global de propósito. */
    window.Phaser = Phaser

    ;(async () => {
      for (const importar of ORDEM_DOS_ARQUIVOS) await importar()
      if (!vivo || !containerRef.current) return

      // a MESMA função que o main.js usa: uma configuração para os dois mundos
      // criarConfiguracao() já traz as 4 cenas na ordem certa: é a MESMA
      // função que o src/main.js usa. Nada de copiar configuração aqui!
      jogo = new Phaser.Game(window.DADOS.criarConfiguracao(containerRef.current))
      window.jogo = jogo
    })().catch((e) => vivo && setErro(String(e && e.message ? e.message : e)))

    return () => {
      vivo = false
      if (jogo) jogo.destroy(true)
      if (window.jogo === jogo) delete window.jogo
    }
  }, [])

  if (erro) {
    return (
      <p style={{ color: '#f87171', padding: 16 }}>
        O Phaser não conseguiu iniciar: {erro}
      </p>
    )
  }
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
