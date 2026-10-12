# 📋 Roteiro de Aulas — Arena Relâmpago (8 encontros)

Cada aula tem: **o que mostrar** (arquivo + `ETAPA n`), **o que pedir** para o
aluno mexer, e **como conferir** que deu certo. Duração sugerida: 50 minutos
(10 de demonstração + 30 de mão na massa + 10 de "mostre para a turma").

> Regra de ouro da trilha: **primeiro o número, depois o código.** Quase todas
> as aulas acontecem dentro de `src/jogo/dados.js`, que é uma tabela gigante de
> regras. Só a partir da aula 5 o aluno escreve lógica de verdade.

---

## 📅 Aula 1 — Ligar, jogar e espiar por dentro
**Mostrar:** `index.html` (só 7 tags `<script>` e a *ordem* delas), jogar uma
partida no modo *P1 vs CPU*, apertar `V` (caixas), `I` (ficha de golpes),
`/` (fita de comandos) e abrir o jogo com `?physics`.
**Código:** `src/main.js` (3 linhas!) e `dados.js → ETAPA 0` (arena, chão, gravidade).
**Pedir:** descobrir sozinho o que acontece com `CHAO_Y` em `700` e com
`GRAVIDADE` em `900`. Anotar as duas frases que o aluno diria para um amigo.
**Conferir:** o jogo abre sem erro no console (F12) e o lutador pousa no chão.

---

## 📅 Aula 2 — O que é "frame data" (a aula mais importante)
**Mostrar:** `dados.js → ETAPA 2` — a tabela dos 9 golpes com `startup`,
`ativo`, `recuperação`, `dano`, `hitbox`. Fazer a conta na lousa:
`Soco rápido = 4 + 3 + 7` → 14 frames → **0,23 s** do começo ao fim.
**Pedir:** deixar o `p.C` (soco forte) com `startup: 3`. Perguntar: "isso deixa
o jogo melhor ou quebrado?". Depois deixar *justo* de novo.
**Conferir:** `window.jogo.scene.getScene('Luta').lutadores[0].ataqueAtual`
no console mostra o golpe em andamento e em que frame ele está.

---

## 📅 Aula 3 — Um lutador é uma ficha de dados
**Mostrar:** `dados.js → ETAPA 3` — `paleta`, `corpo`, `atributos`
(`vida`, `velocidade`, `forca`, `defesa`, `alcance`), `estilo`
(`agressao`, `recuo`, `preferido`) e os objetos `especial`/`super`.
**Pedir:** (a) mudar a cor da roupa e do cabelo de um personagem;
(b) deixar a Nina com `alcance: 1.3`; (c) **criar o 9º lutador** copiando um
bloco e trocando 5 linhas — ele aparece sozinho na grade de seleção.
**Conferir:** a seleção mostra 9 cards e o novo lutador consegue socar.

---

## 📅 Aula 4 — Arte sem PNG (desenhar com código)
**Mostrar:** `desenhos.js → ETAPA 9.1` (as medidas do corpo, o `PE = 170` e o
frame `96×176`), `ETAPA 9.3` (as 14 poses) e `ETAPA 9.4` (a montagem da
spritesheet com `generateTexture`). Explicar a "mágica" do `origin`:
o pé fica na origem, por isso `sprite.y` **é** a linha do chão.
**Pedir:** dar um chapéu (um `fillRect` a mais na pose) ou trocar o cabelo para
`'moicano'`/`'rabicho'`. Quem terminar rápido: desenhar um frame novo (ex.: pose
de vitória) e usá-lo no `frameDeRepouso`.
**Conferir:** nenhuma imagem nova foi baixada — tudo saiu de código.

---

## 📅 Aula 5 — Entrada: buffer, leniência e golpes de carga
**Mostrar:** `luta.js → ETAPA 2` (teclado, gamepad e CPU viram a MESMA lista de
botões) e `ETAPA 3` (o histórico de setas com janela de `160 ms`,
`FLEXIVEL_MS = 220` e a carga de `CARGA_MS = 900`).
Fazer a pergunta da aula: **"por que o jogo perdoa se eu apertar meio torto?"**
**Pedir:** apertar `→ ↓ ↘ → + S` devagar e ver a fita; depois procurar no
`dados.js` o número que controla a "generosidade" (`FLEXIVEL_MS`) e deixá-lo em
`80`. Sentir a diferença.
**Conferir:** `?physics` ligado + a fita mostrando as setas apertadas.

---

## 📅 Aula 6 — Combate de verdade: caixas, bloqueio e combo
**Mostrar:** `luta.js → ETAPA 6` (a linha do tempo do golpe), `ETAPA 7`
(dano, `hitstun`, `blockstun`, *chip damage*, rebote, queda, projeção) e
`ETAPA 8` (projéteis). Mostrar `caixaDeGolpe` × `caixaDeFerimento` com `V`.
**Pedir:** (a) fazer o bloqueio tirar `0` de vida (ou `5`); (b) aumentar o
`dano` da projeção; (c) explicar por que o agarrão vence o bloqueio.
**Conferir:** o contador de combo aparece na tela e o `maiorCombo` muda no console.

---

## 📅 Aula 7 — A máquina que pensa com regras
**Mostrar:** `ia.js → ETAPA 1` (a fila de "apertões"), `ETAPA 3` (as 12 regras
numeradas, uma por uma, com o dedo na lousa) e `dados.js → ETAPA 5`
(as 4 dificuldades: `tempoReacao`, `agressao`, `defesa`, `erro`).
Depois ligar o modo **CPU vs CPU** e deixar a demonstração rodar sozinha.
**Pedir:** escolher UMA regra e mudá-la (ex.: tirar o pulo por cima do
projétil) e prever o que acontece com o Bento contra a Nina.
**Conferir:** no console, `getScene('Luta').lutadores[0].danoCausado` — se um
lado causa `0` de dano, a IA está com medo demais (dica: é sempre uma regra que
ficou *acima* das de ataque e engoliu todas).

---

## 📅 Aula 8 — React: a mesma luta dentro de um `<div>`
**Mostrar:** `react/src/App.jsx` (só moldura), `react/src/PhaserGame.jsx`
(importa os mesmos arquivos na mesma ordem e **destrói** o jogo no cleanup) e
`vite.config.js` (o alias `jogo` que aponta para `../src/jogo`).
**Pedir:** escrever no React um contador de "vitórias" em `useState` lido do
jogo, ou trocar o texto do rodapé para o nome do seu lutador favorito.
**Conferir:** `npm run dev` sobe; `npm run build` termina sem erro; e o hot
reload não duplica o jogo (por causa do `return` do `useEffect`).

---

## 🧭 Se a turma for mais nova (8-11)
Faça as aulas 1, 2, 3, 5 e 8. Nas aulas 6 e 7, use o modo **TREINO**
(vida infinita) e deixe a IA no **Fácil** — a criança aprende o comando vendo a
fita, sem ser atropelada.

## 🧭 Se a turma for mais velha (12-16)
Entregue a aula 7 como *projeto*: cada dupla escreve UMA regra nova na escada
da IA (ex.: "se eu estou ganhando de vida, ganhe tempo"), testa no CPU vs CPU e
apresenta o que aconteceu com os números de `danoCausado` dos dois lados.
