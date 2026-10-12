# 📖 Glossário — Meu Primeiro Jogo

> Consulte esta página sempre que esbarrar numa palavra estranha.
> As palavras estão em **ordem alfabética**, com o termo em inglês entre
> parênteses (é o nome que você vai ver na documentação e nos tutoriais).

---

## A

**add (adicionar)** — `this.add.image()`, `this.add.sprite()`, `this.add.text()`:
tudo o que aparece no jogo começa com `this.add`.
👉 *"adicione na cena"*.

**alpha** — Transparência de um objeto. Vai de `0` (invisível) a `1` (opaco).

**animação (animation)** — Quadros trocados automaticamente, criando movimento
(como um flipbook). Criada com `this.anims.create()` e executada com
`play('nome')`.

**array / lista** — Uma coleção ordenada de valores, escrita entre colchetes:
`this.inimigos = []`. Acesse os itens com `.push()` (adiciona),
`.forEach()` (percorre) e `.length` (conta).

**assets** — A pasta onde ficam as imagens e os sons do jogo.
👉 *"os arquivos de arte e áudio"*.

**axis/eixo X, Y** — No Phaser: **X cresce para a direita**, **Y cresce para
baixo**. 🚨 O Y ao contrário é a maior pegadinha para quem está começando!

---

## B

**blocked (bloqueado)** — `body.blocked.down` responde *"tem algo me segurando
por baixo?"*. É o nosso teste de "estou no chão?".

**body (corpo)** — O corpo físico invisível de um objeto: uma caixa que sofre
gravidade e colide. O desenho é o que se vê; o **body** é o que o jogo usa
para calcular toques. Criado com `this.physics.add.existing(objeto)`.

---

## C

**callback** — Uma função que *outra* parte do sistema chama para você
(ex.: a função chamada pelo `overlap` quando dois objetos se tocam).

**camada (layer)** — Ordem de desenho: quem é desenhado depois fica na frente.
Também pode ser ajustada com `setDepth(número)`.

**colisão (collision)** — O contato entre dois corpos físicos.

**collider** — `physics.add.collider(A, B)`: **impede** que A e B se
atravessem (o chão segura o herói).

**constante** — Um valor com nome que não muda:
`const VEL_ANDAR = 260;`. Deixa o código compreensível e fácil de ajustar.

**create()** — As três fases de toda cena: ... este aqui é o 2º:
**monta** a cena (coloca os objetos no lugar). Roda uma vez, no início.

**cena (scene)** — Uma "tela" do jogo: o menu, a fase 1, a tela de game over.
Nossa cena se chama `'Jogo'`.

---

## D

**debug** — Modo de investigação. Com `debug: true` na física, o Phaser
desenha as **caixas de colisão**: um raio-X do jogo. 🩻

**destroy()** — Remove um objeto do jogo definitivamente (libera memória).

**depth (profundidade)** — Camada do objeto. `setDepth(1000)` = bem na frente
(usado no HUD).

---

## E

**ease (suavização)** — Como um movimento acelera e desacelera nos tweens:
`'Linear'`, `'Sine.inOut'`, `'Bounce.out'`...

**escala (scale)** — Tamanho do desenho. `setScale(1.5)` = 1,5 vez maior.

**evento (event)** — Um aviso de que algo aconteceu. Ex.:
`keyboard.on('keydown-R', ...)` = "quando a tecla R for apertada...".

---

## F

**física (physics)** — O sistema que simula gravidade, velocidade e choques.
No nosso jogo usamos o motor **Arcade**.

**FPS** — *Frames por segundo*: quantas vezes o jogo se atualiza por segundo.
O normal é por volta de 60.

**frame (quadro)** — Um dos desenhos de uma animação/spritesheet.

**frameRate** — Quantos quadros por segundo uma animação troca.

---

## G

**game feel / juice** — A **sensação** de jogar: tremor de tela, partículas,
som, quique... Os exageros que deixam o jogo gostoso. 🍋

**gravidade (gravity)** — Força que puxa tudo para baixo. Fica na
configuração do jogo: `gravity: { y: 1200 }`.

---

## H

**HUD** — *Heads-Up Display*: as informações fixas na tela (vidas, pontos,
tempo). É a "ponte" entre o jogo e o jogador.

---

## I

**input (entrada)** — Tudo o que o jogador faz: teclado, mouse, toque, gamepad.

---

## K

**key (tecla / chave)** — Tem dois sentidos!
1. Tecla do teclado (`this.cursors.space`);
2. **Nome** que você dá para uma animação, textura ou som
   (`'heroi-correndo'`). 👈 é o sentido mais comum aqui.

---

## M

**método (method)** — Uma "receita" com nome que pertence à cena:
`this.criarInimigo(x)`. Também chamado de **função**.

---

## O

**origin (origem)** — O ponto de encaixe do desenho:
`(0, 0)` = canto superior esquerdo · `(0.5, 0.5)` = centro (padrão) ·
**`(0.5, 1)` = base** (nosso truque para os pés ficarem no chão!).

**overlap** — `physics.add.overlap(A, B, função)`: detecta o toque **sem
impedir** a passagem, e chama a sua função (callback). Usado para coletar
moedas e levar dano.

---

## P

**parallax** — Ilusão de profundidade: o que está longe se move devagar, o
que está perto se move rápido.

**play()** — `sprite.play('nome')` manda o sprite executar uma animação.

**preload()** — 1ª fase de toda cena: **carrega** as imagens e sons antes do
jogo começar.

**pixel art** — Estilo de desenho com pixels grandes e visíveis. Usamos
`pixelArt: true` para os desenhos não ficarem borrados.

---

## R

**repeat** — Quantas vezes uma animação repete. `-1` = para sempre (loop);
`0` = uma vez só.

---

## S

**setOrigin / setSize / setOffset / setFlipX** — Ajustes do sprite:
ponto de encaixe · tamanho da caixa de colisão · posição dessa caixa ·
espelhar (virar) o desenho.

**sprite** — O desenho de um objeto do jogo que pode ter vários quadros.

**spritesheet** — Uma imagem com vários quadros lado a lado, "recortada"
pelo Phaser em quadradinhos (`frameWidth`/`frameHeight`).

**static (estático)** — Corpo físico que **não** se move sozinho: não sofre
gravidade. O chão e as plataformas são estáticos
(`physics.add.existing(corpo, true)`).

---

## T

**texture (textura)** — A imagem carregada na memória do jogo. Você se
refere a ela pelo "apelido" que deu no `load` (ex.: `'ceu'`).

**tile** — Cada "ladrilho" repetido por um `tileSprite`.

**tilePositionX** — Deslocamento horizontal do ladrilho dentro do tileSprite.
É o que usamos no parallax (`this.chao.tilePositionX += 3.5`).

**tileSprite** — Objeto que **repete** uma imagem até preencher uma área
(como azulejos). Ideal para chão e faixas de cenário.

**tween** — Animação calculada entre dois valores (A → B), com duração e
suavização: `this.tweens.add({ targets, y, duration, yoyo, repeat })`.

---

## U

**UI** — *User Interface*: a parte visual com que o jogador interage (HUD,
botões, telas).

**update()** — 3ª fase de toda cena: roda **~60 vezes por segundo**. É aqui
que as coisas se movem (o "cérebro" do jogo).

**UX** — *User Experience*: como é **jogar**. É claro? É justo? É gostoso?

---

## V

**velocidade (velocity)** — Quantos pixels o objeto anda por segundo, com
direção (sinal): `setVelocityX(260)` = 260 px/s para a direita;
`setVelocityX(-260)` = para a esquerda.

---

## 🔗 Truques para memorizar

| Pergunta | Resposta |
|---|---|
| As 3 fases de uma cena? | **preload → create → update** (carrega → monta → atualiza) |
| Onde fica o (0, 0)? | No **canto superior esquerdo**. X↗, Y↘ |
| Como faço os pés ficarem no chão? | `setOrigin(0.5, 1)` |
| Como pergunto "estou no chão?" | `this.jogador.body.blocked.down` |
| Por que o pulo é negativo? | Porque Y cresce para **baixo**. Ir para cima = número negativo |
| Diferença de collider e overlap? | **collider** barra a passagem; **overlap** só avisa |
| Como faço um objeto flutuar? | Tween com `yoyo: true` e `repeat: -1` |
| Como faço um item não cair? | `body.setAllowGravity(false)` |
| Como sei que meu código deu erro? | Aperte **F12** e olhe o **Console** |
