# 🎨 Assets — spritesheets dos lutadores

Esta pasta contém os **PNGs de spritesheet** dos 8 lutadores, na subpasta `sprites/`.

## Como o jogo usa os PNGs

1. Na cena de título (`Titulo.preload` em `src/jogo/menus.js`) o jogo pede
   `assets/sprites/<id>.png` para cada lutador (`ARTE.carregarSpritesheets`).
2. Cada PNG é uma **tira horizontal de 14 quadros**, cada quadro com
   **384 × 704 px** (quadro lógico de 128 px de largura, em 3× de resolução).
3. Se um PNG não existir (por exemplo, na versão React, cuja raiz é a pasta
   `react/`), o jogo **gera a mesma spritesheet pelo código** — o mesmo
   desenho, em alta resolução — e segue normalmente.

## Trilhas sonoras (pasta `musica/`)

Os três loops de fundo (`titulo.mp3`, `selecao.mp3`, `luta.mp3`) são gerados por
`ferramentas/gerar_musicas.py` (`pip install numpy scipy lameenc`).

## Regenerar os PNGs

Abra `ferramentas/exportar-spritesheets.html` no navegador e clique em
**Baixar os 8 PNGs**, ou rode `exportarTudo()` no console. Ao editar cores
em `src/jogo/dados.js` (campo `paleta`), basta exportar de novo.

## Regras que não podem mudar

- O quadro tem **384 × 704 px** e a ordem dos quadros segue a lista `POSES`
  de `desenhos.js` (0–1 parado, 2–4 andando, 5 agachado, 6 pulando,
  7 soco, 8 chute, 9 energia, 10 soco ascendente, 11 girando, 12 dano, 13 no chão).
- O pé do lutador fica na mesma altura do quadro (`PE_Y = 170` na medida lógica),
  para que a origem do sprite faça ele pisar no chão.
- O desenho usa a "planta" de 96 × 176 unidades; a textura tem `UNIDADE` = 4 px por unidade.
  A escala do lutador é `LUTADOR_ESCALA / UNIDADE` (em `luta.js`), por isso trocar a
  resolução do PNG não muda o tamanho do boneco na arena nem as caixas de golpe.
