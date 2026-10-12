# 🧑‍🏫 Material do Professor — Arena Relâmpago

## 💡 Princípios didáticos (8 a 16 anos)

1. **Diversão primeiro, rótulo depois.** A criança bloqueia um golpe e vê o
   "BLOQUEIO!" na tela *antes* de ouvir a palavra `blockstun`. Nomeie o
   fenômeno depois de ele ter acontecido três vezes.
2. **Números > código.** Quase toda melhoria de jogo aqui é mudar um número em
   `dados.js`. Isso dá vitória rápida a quem tem medo de editar código.
3. **Curtas sessões.** O projeto é dividido em arquivos com um assunto cada um
   (`dados`, `desenhos`, `ia`, `menus`, `luta`). Nunca peça para ler `luta.js`
   inteiro — peça a `ETAPA 3`.
4. **Deixe o aluno quebrar.** O modo **TREINO** (vida infinita, sem K.O.) existe
   para experimentar sem consequência. Se algo sumir do jogo, `R` reinicia o round e a
   tecla `P` pausa.
5. **Medir é programar.** O jogo expõe `danoCausado`, `maiorCombo`,
   `superCarga` e `frames`. Terminar uma aula com "quantos frames dura seu
   golpe?" é melhor do que terminar com "funciona?".

## 🛠️ Dúvidas frequentes (e a resposta curta)

### 1. "Abri o index.html e a tela está preta / nada acontece"
Na quase totalidade das vezes é **ordem ou caminho dos `<script>`** no
`index.html`: `lib/phaser.min.js` → `dados.js` → `desenhos.js` → `ia.js` →
`menus.js` → `luta.js` → `main.js`. Se `main.js` vier antes de `luta.js`, o
Phaser não encontra a cena. Abra o console (F12) e leia o primeiro erro.

### 2. "Meu especial não sai!"
Três causas, nesta ordem: (a) o botão apertado não é o que a ficha do
personagem pede (`I` mostra a ficha na tela); (b) o intervalo entre as setas foi
maior que `FLEXIVEL_MS` (220 ms); (c) o golpe é de **carga** e é preciso segurar
`←` (ou `↓`) por `CARGA_MS` (900 ms) — a barrinha amarela no HUD mostra o
progresso. Lembre o aluno: a *fita* de comandos (`/`) mostra exatamente o que o
jogo entendeu.

### 3. "A CPU está fácil/_impossível_ demais"
`dados.js → ETAPA 5`. `tempoReacao` é o cadenciador (quantos frames a máquina
espera antes de decidir de novo) e `erro` é a chance de ela apertar bobagem.
Para uma demo de sala, use **Normal** ou **Difícil**.

### 4. "A demonstração (CPU vs CPU) fica os dois se encarando"
Isso *já aconteceu de verdade* neste projeto e virou lição: a IA tinha uma regra
de "andar para trás para carregar o golpe" colocada **antes** das regras de
ataque, e as duas máquinas fugiam até a parede. A correção está comentada no
código (`ia.js`, regras 5 e 0.5 - a "regra do ringue"). Se um aluno inserir uma
regra nova acima das de ataque e o dano cair a zero, mostre essa história.

### 5. "Como troco os desenhos por PNG meus?"
Pode! Em `luta.js → ETAPA 9` (criação das texturas) dá para trocar
`gerarSpritesheet` por `this.load.spritesheet('kiro', 'assets/kiro.png',
{ frameWidth: 96, frameHeight: 176 })`. **Mantenha o tamanho do frame e o pé na
linha de baixo** (o `PE = 170` em `desenhos.js`), senão todo lutador flutua ou
afunda.

### 6. "No React aparecem DOIS jogos quando eu salvo o arquivo"
Falta o `return` de limpeza no `useEffect` de `react/src/PhaserGame.jsx`
(`game.destroy(true)`). Sem ele, o hot reload monta um Phaser novo por cima do
antigo. Vale a pena mostrar isso de propósito: é o bug mais comum de React +
canvas.

## 🧪 Como eu testo rápido sem abrir o navegador

Este jogo foi escrito e ajustado com um "laboratório" que roda o jogo no Node
(sem Phaser de verdade: um Phaser de brinquedo com 90 linhas). Se você quiser
fazer o mesmo com a turma: escreva um stub mínimo de `Phaser` e rode
`cena.update()` em um laço, medindo `danoCausado`. É a melhor forma de provar a
um aluno que **"testes" são só uma luta com botão apertado por robô**.

Métricas que valem ouro em qualquer ajuste de IA (uma por *par* de lutadores):
dano causado dos dois lados, rounds vencidos, se alguém fica preso na parede e
quantos frames houve projétil no ar.

## 🏆 Avaliação formativa (checklist simples)

| Critério | Insuficiente | Bom | Excelente |
| --- | --- | --- | --- |
| Entendeu frame data | não sabe o que é `ativo` | explica os 3 tempos | ajusta um golpe e justifica |
| Dados vs código | mudou código para mudar dano | mudou `dados.js` | criou um lutador só com dados |
| Detecção de comando | não entende o buffer | explica `→ ↓ ↘ →` | explica a *leniência* e a carga |
| IA | acha que a CPU "pensa" | lê a escada de regras | adiciona uma regra e mede o efeito |
| React + Phaser | confunde os dois papéis | sabe quem desenha o quê | explica o cleanup do `useEffect` |

## 📎 Combinados de sala

- Teclado: **um aluno por partida**; quem está olhando anota os números que vir.
- Ao final de cada aula, 3 minutos de "mostre a sua versão do jogo" — jogo de
  luta é feito para ser exibido, e isso rende mais motivação que qualquer nota.
