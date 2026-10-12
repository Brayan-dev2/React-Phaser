# 🥊 ARENA RELÂMPAGO — Quinto Jogo (luta 2D estilo clássico)

Um jogo de **luta 2D** feito para ser lido como um livro: 8 lutadores originais,
soco fraco e forte, chute alto, rasteira, bloqueio alto e baixo, agarrão,
especiais por **comando de direcional** (bola de energia, dragão, carga
para trás e para baixo), barra de **super**, combos com contador, dano de
raspão (*chip damage*) e uma **máquina que pensa com regras** — você pode
colocar dois CPU para brigar sozinhos e assistir.

> A ideia didática: **jogo de luta é o melhor laboratório de "dados e regras"
> que existe.** Cada golpe é uma linha de número (frames de *startup*, *ativo*
> e *recuperação*). Troque um número no `dados.js` e sinta a diferença na hora.

---

## 🎮 Jogue agora

### Jeito 1 — Sem instalar nada (mais rápido para a sala)
1. Dê **dois cliques** (ou arraste para o navegador) no arquivo `index.html` desta pasta;
2. pronto: título → escolha o lutador → lute.

Se o navegador bloquear algo por ser arquivo local, suba um servidorzinho:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

### Jeito 2 — React + Vite (o mesmo jogo dentro do React)
```bash
cd react
npm install
npm run dev      # abra a URL que aparecer no terminal
npm run build    # checa se tudo compila
```
O React **não** tem uma cópia do jogo: ele importa os arquivos de `src/jogo/`
(mesmo código, duas embalagens). Veja `react/src/PhaserGame.jsx`.

### Modos de ver o jogo "por dentro" (adicione na URL)
| endereço | o que muda |
| --- | --- |
| `?physics` | liga o depurador de física do Phaser (caixas vermelhas/verdes o tempo todo) |
| `?semzoom` | desliga o zoom dinâmico da câmera (útil em telas pequenas) |

Durante a luta, aperte **`V`** para ligar/desligar as caixas de colisão — é o
melhor botão do projeto para entender *hitbox* e *hurtbox*.

---

## 🕹️ Controles

| Ação | Jogador 1 | Jogador 2 |
| --- | --- | --- |
| Andar / olhar | `←` `→` | `H` `L` |
| Agachar / levantar | `↓` | `J` |
| Pular | `↑` | `K` |
| Soco (fraco/forte) | `A` (segure `E` = forte) | `Y` (segure `T`) |
| Chute (fraco/forte) | `D` (segure `E` = forte) | `U` (segure `T`) |
| Projeção (agarrão) | `A` + `D` juntos | `Y` + `U` juntos |
| Golpe supremo | barra cheia + `A` + `D` | barra cheia + `Y` + `U` |
| Bloquear | segurar a tecla de **trás** (em pé = alto, com `↓` = baixo) | idem |
| Corrida | toque duas vezes `→` | idem |

Teclas gerais: `P` pausa · `M` som · `V` caixas de colisão · `R` reinicia o round.
Gamepad no jogador 1: direcional + `A` (soco), `B`/`Y` (chute), `LB`/`RB` (forte).

Na tela de seleção: `←↑→↓` movem o cursor do P1, `Q`/`E` trocam de aba
(MODO, DIFICULDADE, CONTROLE, CAIXAS), `ESPAÇO`/`D` sobem o valor, `A` desce,
`ENTER` trava o P1. Com MODO = *P1 vs P2*, o P2 usa `H J K L` para andar na
grade e `B` para travar.

> Na **fita de comandos** (a barrinha que mostra suas setas em tempo real)
> `S` = soco, `C` = chute, `E` = forte. É a notação clássica dos fliperamas.

---

## 🎯 O que você aprende neste projeto

1. **Frame data** — golpe = `startup` + `ativo` + `recuperação` em frames de 1/60 s;
2. **Caixas** — *hitbox* (onde machuca) e *hurtbox* (onde você é atingido), com espelhamento quando o lutador vira para o outro lado;
3. **Buffer de entrada e detecção de comando** — uma fila de 160 ms que reconhece `→ ↓ ↘ →` mesmo se o aluno apertar meio torto (é o *input leniency* dos jogos reais);
4. **Golpes de carga** — outro jeito de detectar comando: segurar `←` por 900 ms (é o golpe do Guile!), com barra de carga desenhada no HUD;
5. **Máquina de estados da partida** — `intro → lutando → ko → fim`, com cronômetro, rounds e tela de resultado;
6. **IA por regras + fila de botões** — a CPU não "mexe no jogo": ela escreve `plano` de botões e o `Lutador` obedece (a mesma abstração que faz replay funcionar);
7. **Arte 100% por código** — nenhum PNG: `Graphics` + `generateTexture` montam poses, cabelo, roupa e efeitos (troque uma cor no elenco e todos os lutadores mudam);
8. **React ↔ Phaser** — o React empresta a página, o Phaser pede o `<div>` e cria o `<canvas>`; a limpeza no `useEffect` evita "dois jogos ao mesmo tempo".

---

## 🥋 O elenco (8 lutadores, todos jogáveis com o mesmo motor)

| Lutador | Corpo | Especial | Golpe supremo |
| --- | --- | --- | --- |
| **Kiro**, o Monge da Chama | equilibrado | Esfera de Luz `→ ↓ ↘ → + S` | Relâmpago do Dragão |
| **Jato**, o Punho de Aço | rushdown | Soco de Carga (carga `←`) | Perfuradora de Aço |
| **Téo**, o Dançarino | ágil | Meia-Lua Rodopiante | Tempestade de Leques |
| **Ravi**, o Muralha | tanque | Martelo Sísmico (carga `↓`) | Terremoto Total |
| **Nina**, a Bailarina do Trovão | rápida/curta | Roda do Trovão `↓ ↑ + C` | Ciclone Celeste |
| **Dara**, a Lança de Prata | zona + contra-ataque | Lança Prateada (carga `←`) | Chuva de Lanças |
| **Luana**, o Vento | pulo alto | Beija-Flor (aéreo) | Furacão Beija-Flor |
| **Bento**, o Fera da Selva | braços longos | Baforada de Fogo `↓ ↑ + S` | Fúria Selvagem |

Cada linha acima existe como **dado** em `dados.js` (ELENCO). Nada de código por
personagem: é o mesmo `Lutador` lendo tabelas diferentes.

---

## 📚 Trilha de aulas

`ROTEIRO-DE-AULAS.md` tem 8 aulas prontas (com o que mostrar, o que pedir e
onde está cada `ETAPA n` no código). Os exercícios estão em
`ATIVIDADES-DO-ALUNO.md`, e `MATERIAL-DO-PROFESSOR.md` traz as dúvidas que
sempre aparecem. Termos estranhos? `GLOSSARIO.md`.

---

## 🧱 Estrutura dos arquivos

```
06-QuintoJogo/
├── index.html              → abre o jogo sem instalar NADA (ordem dos <script> importa!)
├── index.css               → a moldura da página (o jogo desenha tudo sozinho)
├── lib/phaser.min.js       → o Phaser já vem junto, para funcionar offline
├── assets/README.md        → por que não há PNG neste projeto
├── src/
│   ├── main.js             → 3 linhas: pedir a configuração e ligar o jogo
│   └── jogo/
│       ├── dados.js        → ETAPAs 0-7: arena, vida, dano, frame data, elenco, comandos, IA, som
│       ├── desenhos.js     → ETAPAs 9.1-9.5: desenhar lutadores e efeitos por código
│       ├── ia.js           → ETAPAs 1-4: o cérebro da máquina (fila de botões + 12 regras)
│       ├── menus.js        → ETAPAs 1-3: cenas de título, seleção de personagem e resultado
│       └── luta.js         → ETAPAs 1-11: entrada, lutador, hitbox, rounds, HUD, câmera
└── react/                  → o MESMO jogo dentro do React + Vite
    ├── index.html · vite.config.js · package.json
    └── src/
        ├── main.jsx        → monta o <App/>
        ├── App.jsx         → cabeçalho, moldura, rodapé (só interface)
        ├── PhaserGame.jsx  → a ponte React -> Phaser (e a limpeza do canvas)
        └── scenes/00-LEIA-ME.js → como criar uma cena nova sem duplicar código
```

Cada arquivo de jogo termina com uma "pontezinha":

```js
if (typeof window !== 'undefined') { window.DADOS = DADOS; }
```

É ela que permite o `index.html` usar `<script src>` e o Vite usar `import`
sem mudar uma linha do jogo.

---

## ⚠️ Um aviso honesto sobre jogos de luta

Jogo de luta é o gênero mais *exigente com números*: 1 frame de diferença muda
o balanceamento. Se um golpe parecer injusto, não acrescente código — ajuste o
número em `dados.js` e teste de novo. É exatamente isso que um *game designer*
faz o dia inteiro.

Licença: MIT (como todo o repositório). Bons treinos! 🥋
