# P-15 — Tuning de movimento: impulso e gravidade

**Status:** ✅ **DECIDIDO** em 2026-11-13 · registrado como `DEC-014`
**Decisão:** **CONFIG B** — `impulso = 560 px/s`, `gravidade = 1100 px/s²`
**Instrumento:** [`ferramentas/comparador-de-salto.html`](../../ferramentas/comparador-de-salto.html)
**Afeta:** `tuning.ts`, LVL-02 (gate de 3 tiles), LVL-03 (pilares e investida), todos os 16 setores futuros.

---

## 1. Por que esta pendência era um bloqueio

`P-15` não era um detalhe de *game feel*. Era uma **dependência de geometria**:
a altura do salto define qual desnível é subível, e portanto **quais salas são
jogáveis**. Enquanto a config não fechasse, cada nível desenhado carregava uma
aposta não paga — e LVL-02 já foi desenhado em cima de um gate de 3 tiles (192 px),
que é exatamente o valor que separa as duas configs.

A pendência estava aberta desde `P-15` na primeira versão de `PENDENCIAS.md`, e
`DEC-008` já proibia que o layout dependesse de configuração. Só que o gate de
LVL-02 dependia — em silêncio.

---

## 2. As duas configurações

| | Impulso | Gravidade | Origem |
|---|---|---|---|
| **A** | 480 px/s | 1200 px/s² | GDD §2 (valores originais) |
| **B** | 560 px/s | 1100 px/s² | hipótese de trabalho de LVL-02 |

Tudo o mais é idêntico: velocidade 220 px/s, corrida 1,4×, `JUMP_CUT = 0.7`
(variação de altura por soltura do botão), coyote 100 ms, buffer 100 ms,
tile de 64 px, herói de 128 px (2 tiles).

---

## 3. Evidência 1 — forma fechada (teoria contínua)

Altura máxima de um salto: `h = v₀² / 2g`. Salto duplo reinicia a velocidade no
ápice, então soma o mesmo `h` outra vez.

| Config | 1 salto | Salto duplo | Airtime | Alcance andando | Alcance correndo |
|---|---|---|---|---|---|
| **A** | 96 px (1,5 tile) | **192 px (3,0 tiles)** | 0,800 s | 176 px | 246 px |
| **B** | 143 px (2,2 tiles) | **285 px (4,5 tiles)** | 1,018 s | 224 px | 314 px |

Na teoria fechada, **A acerta o gate de 192 px com margem exata de 0 px**. É uma
coincidência matemática bonita e uma armadilha: margem zero não é folga, é o
limite. E o limite contínuo não é o que o jogo executa.

---

## 4. Evidência 2 — integração numérica (o que o jogador sente)

O Phaser integra em passo fixo. A integração de Euler **perde altura** em relação
à forma fechada, e a perda depende da taxa de quadros. Medido com o mesmo
integrador do comparador:

| Taxa | A · 1 salto | A · duplo | B · 1 salto | B · duplo | Gate 192 px em A | Gate 192 px em B |
|---|---|---|---|---|---|---|
| 240 Hz | 95 px | 190 px | 141 px | 283 px | **FALHA** (−2 px) | passa (+91 px) |
| 120 Hz | 94 px | 188 px | 140 px | 280 px | **FALHA** (−4 px) | passa (+88 px) |
| 60 Hz | 92 px | 184 px | 138 px | 276 px | **FALHA** (−8 px) | passa (+84 px) |
| 30 Hz | 88 px | 176 px | 133 px | 266 px | **FALHA** (−16 px) | passa (+74 px) |

**Leitura decisiva:** em A o gate de 3 tiles **falha em todas as taxas de
integração plausíveis** — não existe taxa de quadros em que ele passe. E a falha
**cresce** conforme o hardware enfraquece: 2 px a 240 Hz, 16 px a 30 Hz.

Isso é a pior categoria de bug possível: **um salto que é impossível e que fica
mais impossível no computador do jogador mais pobre**. Não é "difícil"; é
inatingível. E como o desvio é pequeno (4 px = 6% de um tile), ele não parece um
bug — parece que o jogador "errou o timing". Ele vai tentar de novo. Para sempre.

Em B, o gate passa com 74 a 91 px de folga em **todas** as taxas. A margem
absorve a variação de hardware com sobra de mais de um tile.

---

## 5. Evidência 3 — o que cada config permite ao level designer

O custo real de uma config de salto é **quantos desníveis o designer pode usar
como decoração sem criar parede**.

| Desnível | A (duplo 184 px) | B (duplo 276 px) |
|---|---|---|
| 1 tile (64 px) | sobe | sobe |
| 2 tiles (128 px) | **sobe raspando** (184 vs 128) | sobe com folga |
| 3 tiles (192 px) | **parede** | sobe com folga |
| 4 tiles (256 px) | parede | sobe raspando |

Em **A**, todo desnível de 3 tiles é parede definitiva — o designer precisa
memorizar "nunca empilhe 3 caixas" e o QA precisa auditar cada sala. Em **B**, a
fronteira sobe para 4 tiles, que é um número que o olho humano não produz por
acidente ao desenhar um cenário.

E há o efeito no salto **simples**, que é o que o jogador usa 90% do tempo:
A dá 1,5 tile. Isso significa que **um batente de 2 tiles bloqueia o pulo
normal** — e 2 tiles é a altura do próprio herói. Em B o pulo simples dá 2,2
tiles: qualquer coisa da altura do personagem é transponível.

---

## 6. Evidência 4 — proporção contra o corpo do personagem

O herói tem 128 px (2 tiles). Um salto é lido pelo jogador em **múltiplos do
próprio corpo** — é a régua de que ele dispõe.

- **A:** 92 px = **0,72×** a altura do corpo. O personagem não salta a própria altura.
- **B:** 138 px = **1,08×**. Salta só um pouco mais que o próprio corpo.

Um personagem desenhado em estilo *old school* com sprites de peso visual alto
(ver `PAT-LD` e a prancha de estilo) que não transpõe o próprio corpo lê como
"quebrado", não como "pesado". A diferença de 46 px aqui é a diferença entre
"herói" e "boneco travado".

---

## 7. Evidência 5 — janela de reação no combate

`P2 — combate legível` é pilar do projeto, e o Guardião (LVL-03) usa investida com
telegraph de 800 ms e **investida de 620 ms**. O jogador desvia **no ar**.

| Config | Airtime | Janela de desvio sobre a investida (620 ms) |
|---|---|---|
| **A** | 0,78 s | **163 ms** |
| **B** | 1,02 s | **397 ms** |

163 ms é abaixo do limiar confortável de reação-ação (≈250 ms). O jogador
precisaria prever a investida, não reagir a ela — o que transforma o chefe em
memorização em vez de leitura. B entrega 397 ms: dá para ver, decidir e executar.

Some-se `MEC-001` (coyote 100 ms) e o buffer de 100 ms: em A, coyote + buffer
consumiria praticamente toda a margem de ar. Em B eles são conforto, não salvação.

---

## 8. O contra-argumento, honestamente

A config **A é mais pesada**, e peso combina com o tom. Gravidade 1200 e impulso
480 produzem um arco mais curto e seco, mais próximo do Castlevania clássico.
Não é um argumento fraco — é o único argumento real a favor de A.

Ele perde para os cinco anteriores porque todos eles são **funcionais** e ele é
**estético**, e porque a diferença perceptual de peso entre 0,80 s e 1,02 s de
airtime é modesta. Se, jogando o comparador, o time concluir que B ficou "flutuante",
o ajuste correto é **subir a gravidade de B** (ex.: 1200 com impulso 585, que
preserva 285 px de duplo) — e **não** voltar para A. Voltar para A não devolve
peso: devolve o gate impossível.

---

## 9. O que a config A exigiria (custo de reversão)

Reverter para A **não** é trocar dois números. Exige:

1. Reduzir o gate de LVL-02 de 3 para **2 tiles** (128 px) — só que então **B o
   pularia com um salto simples** (138 > 128), e o layout voltaria a depender de
   configuração, violando `DEC-008`.
2. Reconferir as 18 salas de LVL-01/02/03 contra a nova altura.
3. Reescrever `LVL-02.md` §3, §5.2 e §8; `04-setores-e-cenarios.md` §4.3;
   `LVL-03.md` (pilares e janela de desvio do chefe).
4. Recalibrar a investida do Guardião: com 163 ms de janela, ou a investida
   encurta, ou o telegraph sobe para ~1100 ms.
5. Refazer as tabelas de alcançabilidade de todos os setores futuros.

Ou seja: a decisão **B** é a mais barata hoje e a mais cara de desfazer depois.
Por isso ela foi tomada antes de LVL-04 — e não depois.

---

## 10. Parâmetros derivados para `tuning.ts`

```ts
// tuning.ts — única fonte de verdade numérica (DEC-005)
// Valores decididos em P-15 / DEC-014. Ver docs/decisoes/P-15-tuning-de-movimento.md.

export const TILE = 64;            // px
export const HERO_W = 40, HERO_H = 128;

export const MOVE = {
  speed: 220,                      // px/s — andar
  runMultiplier: 1.4,              // corrida (P-21: custo de poder ainda aberto)
  accelGround: 1800,               // px/s²
  accelAir: 900,
  frictionGround: 2200,
  frictionAir: 200,
} as const;

export const JUMP = {
  impulse: 560,                    // px/s   ← DEC-014 (era 480)
  gravity: 1100,                   // px/s²  ← DEC-014 (era 1200)
  cutMultiplier: 0.7,              // soltura do botão → 51% da altura máxima
  maxAirJumps: 1,                  // salto duplo
  coyoteMs: 100,                   // MEC-001
  bufferMs: 100,                   // MEC-002
} as const;

// Alturas de referência (verificadas a 60 Hz):
//   salto simples ....... 138 px (2,16 tiles)
//   salto duplo ......... 276 px (4,31 tiles)
//   salto mínimo (cut) ..  71 px
// Gate de 3 tiles (192 px): alcançável com duplo, margem 84 px.
// Ledges de 1 e 2 tiles: alcançáveis com salto simples.
```

**Nota sobre `cutMultiplier`:** `0.4` derrubava o salto mínimo para ~17% da altura,
o que não é "salto curto", é "queda" — e contrariava `DEC-006`. Com `0.7` o mínimo
é **51%**, que ainda dá controle preciso sobre plataformas pequenas.

**Nota sobre `maxAirJumps`:** o salto duplo é **necessidade de layout**, não
enfeite. Em B, o salto simples dá 138 px e o gate pede 192 px — a diferença de
54 px só é vencida pelo segundo salto. Isso torna o duplo obrigatório para
progredir, e portanto ele precisa ser ensinado explicitamente em LVL-01 (ver
`LVL-01.md`, sala de tutorial).

---

## 11. Protocolo de validação humana

O comparador existe para que esta decisão não seja fechada só no papel. Antes de
LVL-04, rode `ferramentas/comparador-de-salto.html` e faça os três testes:

| # | Ação | O que deve acontecer | O que confirma |
|---|---|---|---|
| 1 | Config **B**, subir no gate 3 | sobe, com folga visível | B cumpre o layout |
| 2 | Config **B**, gate 3 com um salto só | não sobe | o duplo é necessário, e o jogador percebe |
| 3 | Config **A**, gate 3 com salto duplo | **não sobe**, encosta e cai | reproduz o veredito na mão |

Se no teste 1 você sentir que o salto "flutua", **não** troque para A — suba a
gravidade de B para 1200 e o impulso para 585 (mantém 285 px de duplo com arco
mais seco) e reabra `P-15` com esse número medido.

---

## 12. O que esta decisão não resolve

| Pendência | Por que continua aberta |
|---|---|
| `P-21` | Corrida consumindo poder: muda o alcance horizontal, não a altura. Afeta travessia de vãos, não gates. |
| `P-28` | Posição da bolsa na entrada da arena do Guardião (design de sala). |
| `P-29` | TTK do Guardião (22–35 s) — depende de dano, não de salto. |
| `P-30` | `ATK-02` fora do GDD §3.2 — precisa de aval canônico. |

Com **B** fixado, esses quatro deixam de ter dependência cruzada com a física e
podem ser resolvidos em paralelo, dentro de seus próprios níveis.

---

## 13. Rastro

- Medição por simulação: integrador de passo fixo idêntico ao do comparador,
  rodado a 240 / 120 / 60 / 30 Hz (§4).
- Comparador jogável: `ferramentas/comparador-de-salto.html` — gates reais de
  LVL-01/02/03, coyote, buffer, altura variável, HUD com teórico **e** efetivo a 60 Hz.
- Registro: `DEC-014` em `docs/DECISOES.md`.
- Propagação: `P-15` → `## Fechadas` em `docs/PENDENCIAS.md`; menções em
  `LVL-02.md`, `LVL-03.md` e `04-setores-e-cenarios.md` §4.3 atualizadas de
  "pendente" para "decidido (B)".
