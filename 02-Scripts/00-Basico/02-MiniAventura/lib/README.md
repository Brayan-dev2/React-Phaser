# lib/ - biblioteca do Phaser (versão sem instalação)

Este arquivo `phaser.min.js` é a **biblioteca do Phaser 3.90.0** (versão compacta).

Por que ele está aqui, na pasta-mãe da trilha?
- Todos os exemplos "sem instalação" carregam este MESMO arquivo
  (`../lib/phaser.min.js`). Assim o repositório não fica gigante com a
  biblioteca copiada em cada aula.
- `min` significa *minificado*: é o mesmo código, mas sem espaços e com
  nomes curtos, para o arquivo ficar menor e o jogo abrir mais rápido.

## Rodar offline

Como o arquivo está aqui dentro do projeto, os exemplos abrem **sem internet**.
Se preferir usar o Phaser da internet (CDN), troque a linha no `index.html`:

```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"></script>
```

## Versões

- Exemplos **sem instalação** (`index.html` na raiz da aula): Phaser **3.90.0** (este arquivo).
- Exemplos **React + Vite** (`react/`): Phaser **4.x** instalado pelo npm.

O código das cenas é o mesmo nos dois formatos — a única diferença é a linha
`export` antes da classe (a versão React usa módulos ES).
