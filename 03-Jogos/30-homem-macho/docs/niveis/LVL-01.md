# LVL-01 — Ruínas da Vigília

> Setor 1 de 16 · **`[MVP]`** · Ato I — O Turno
> Versão: `0.2.0` · Data: `2026-11-13` · Autor: `AGT-02` (Designer de Level)
> Base: [GDD 3.4–3.5](../03-conteudo-do-jogo.md) · [Setores e Cenários §4.5](../design-patterns/04-setores-e-cenarios.md) · [Padrões de Level Design](../design-patterns/07-padroes-de-level-design.md)

**Status deste documento:** layout fechado. **Revisão `0.2.0` — o piloto de ampliação (`DEC-048`).**
As seis salas foram ampliadas de 160 para **365 tiles** de comprimento e o setor passou de 3 para
**8 inimigos comuns em três arquétipos**. O resto do documento (§5–§12) foi revisto onde a mudança
o obrigava; o que não mudou está dito como não mudado, e porquê.

---

## 1. Os 12 campos obrigatórios

| # | Campo | Definição |
|---|---|---|
| 1 | **ID e nome canônico** | `LVL-01` — Ruínas da Vigília |
| 2 | **Objetivo** | Aprender os controles e chegar ao quarto seguro antes de seguir para LVL-02. |
| 3 | **Duração e mortes** | **5–8 min** na primeira visita (medido: 109 s de travessia contínua sem combate) · **0–1 mortes esperadas** (2 aceitáveis desde `DEC-048`: há tiro agora) |
| 4 | **Acento e materiais** | `PAL-01` dourado-poeira `#F2C66D` · pedra clara, pano rasgado, poeira |
| 5 | **Sinais de ambientação** | `LOR` §3.7 → sinete da Vigília (1) · vela acesa sem ninguém (2) · marco de pedra (variação de 3) |
| 6 | **Habilidade de entrada / saída** | Entrada: nenhuma. Saída: nenhuma. **Salto duplo NÃO existe aqui** — é obtido em LVL-02 |
| 7 | **Salas** | 6 salas: **60×11 · 70×11 · 55×11 · 90×11 · 40×11 · 50×11** (eram 20·30·20·40·20·20) |
| 8 | **O que ensina** | `MEC-001` mover/pular · `MEC-002` atacar · `MEC-004` bolsa (só leitura) · `MEC-007` salvar |
| 9 | **Set pieces** | `CEN-001` espinhos · `CEN-002` vela · `CEN-003` sinete · `CEN-004` caixa de carga |
| 10 | **Inimigos** | `ENT-002` Sentinela ×4 (2 em L01-03, 2 em L01-04) · `ENT-010` Alicate de zaga ×3 (2 em L01-04, 1 em L01-06) · `ENT-011` Mariposa de turno ×1 (L01-04) — **8 corpos** |
| 11 | **Entradas e saídas** | L01-01 → L01-02 → L01-03 → L01-04 → L01-05 → L01-06 → **porta dourada** para LVL-02. Sem ramificações, sem travas |
| 12 | **Teste de rastreabilidade** | `TST-013` (percurso completo, inventário vazio) · `TST-001` (salto) · `TST-002` (combate) · `TST-014` (touch) · `TST-007` (save em L01-05) |

### Propriedades de design deste setor

- **Escopo de tutorial.** Não introduz nenhuma mecânica de perigo irreversível. A única fonte de dano (`CEN-001`) é evitável andando.
- **Config-agnóstico.** Foi validado nas duas configurações de salto que estavam em disputa — e a decisão `P-15` caiu na **B** (`DEC-014`). **Nenhum obstáculo exige salto duplo** — ver §7.
- **Sem soft lock.** Todas as quedas são reversíveis por degraus de 1 tile (`PAT-LD-06`).
- **Sem ramificação.** A primeira decisão de rota do jogo acontece em LVL-02, não aqui.

---

## 2. Fluxo das salas

```mermaid
flowchart LR
  A["L01-01<br/>Abertura<br/>60x11"] --> B["L01-02<br/>Ensina mover<br/>70x11"]
  B --> C["L01-03<br/>Ensina atacar<br/>55x11"]
  C --> D["L01-04<br/>Ensina pular<br/>90x11"]
  D --> E["L01-05<br/>Quarto seguro<br/>40x11"]
  E --> F["L01-06<br/>Saída<br/>50x11"]
  F --> G(["Porta dourada<br/>LVL-02"])
  D -.->|morte| E
```

| Transição | Elevação | Tipo | Trava |
|---|---|---|---|
| L01-01 → L01-02 | linhas 4–6 | abertura de arco | — |
| L01-02 → L01-03 | linhas 4–6 | abertura de arco | — |
| L01-03 → L01-04 | linhas 4–6 | abertura de arco | — |
| L01-04 → L01-05 | linhas 4–6 | abertura de arco | — |
| L01-05 → L01-06 | linhas 4–6 | abertura de arco | — |
| L01-06 → LVL-02 | linhas 4–6 | **porta dourada** (`D`) | — |

**Convenção:** toda abertura de passagem tem **3 tiles de altura** (linhas 4–6). O topo do piso está na linha 7 em todas as salas. Isso elimina a classe de bug "o jogador chega na porta mas a altura não bate".

---

## 3. Legenda das grades

| Símbolo | Camada | Significado |
|---|---|---|
| `#` | `ground` + `collision` | sólido |
| `=` | `collision` (só topo) | plataforma atravessável *(one-way)* |
| `+` | — | abertura de passagem na parede |
| `.` | — | ar |
| `S` | `objects` | spawn do jogador (`ENT-001`) |
| `E` | `objects` | Sentinela distorcida (`ENT-002`) — persegue e investe |
| `T` | `objects` | **Alicate de zaga (`ENT-010`)** — fica longe e atira (`DEC-048`) |
| `V` | `objects` | **Mariposa de turno (`ENT-011`)** — voa e pica (`DEC-048`; nas outras salas `V` continua a ser estandarte/sumidouro/cristal/varanda) |
| `A` | `objects` | espinhos (`CEN-001`) |
| `P` | `objects` | ponto de salvamento (quarto seguro) |
| `D` | `objects` | porta dourada de saída de área |
| `k` | `decor` | caixa de carga (`CEN-004`, sem colisão) |
| `c` | `decor` | vela da Vigília (`CEN-002`) |
| `G` | `decor` | sinete da Vigília (`CEN-003`, na parede) |
| `N` | `objects` | marco de pedra / inscrição (lore) |
| `Q` | `objects` | quadro de aviso do quarto seguro |
| `h` | `objects` | item de cura (`ITM-001`, +20 de vida) |
| `s` | `objects` | item de escudo (`ITM-002`, +10 de escudo) |
| `j` | `objects` | item permanente (`ITM-003`, salto duplo) — **não usado em LVL-01** (`DEC-008`) |

Coordenadas: `x` cresce para a direita, `y` para baixo, `y0` é o teto. Âncora de todo objeto = **célula inferior esquerda**.

---

## 4. Salas

### 4.1 L01-01 — Abertura silenciosa · 60×11

```
    000000000011111111112222222222333333333344444444445555555555
    012345678901234567890123456789012345678901234567890123456789
y0  ############################################################
y1  #..........................................................#
y2  #..........................................................#
y3  #...............................................G..........#
y4  #..........................................................+
y5  #..........................................................+
y6  #.S.........c.........N.......k.........k..................+
y7  ############################################################
y8  ############################################################
y9  ############################################################
y10  ############################################################
```

| Objeto | Pos | Função |
|---|---|---|
| `S` spawn | (2,6) | jogador nasce aqui, virado para a direita |
| `c` vela | (12,6) | `CEN-002`, decoração animada |
| `N` marco | (22,6) | `LOR` — "TURNO 1 · NÃO ABANDONE O POSTO" |
| `k` caixote | (30,6) e (40,6) | `CEN-004`, decor com colisão leve |
| `G` sinete | (48,3) | `CEN-003`, marca de facção na parede |

- **Função:** abertura sem estímulo. **1.408 px** de cenário puro antes do primeiro objeto de leitura
  (eram 256 px). A sala é o dobro do ecrã: quem entra vê uma parede de pedra a perder de vista.
- **Ensina:** nada. É a respiração antes do tutorial — e continua a não ter inimigos (`PAT-LD-04`).
- **Aceite:** o jogador atravessa em ≤ 20 s sem apertar nenhum botão além de andar.
- **Nota do piloto:** era a sala que mais sofria com o tamanho antigo. Em 20 tiles, "abertura
  silenciosa" era um corredor de 2 s que o jogador atravessava antes de perceber que havia um
  jogo; em 60 tiles há **três** marcos de leitura (vela, inscrição, caixotes) e espaço para os
  encontrar sem os procurar.

---

### 4.2 L01-02 — Ensina mover · 70×11

```
    0000000000111111111122222222223333333333444444444455555555556666666666
    0123456789012345678901234567890123456789012345678901234567890123456789
y0  ######################################################################
y1  #....................................................................#
y2  #....................................................................#
y3  #...............................................................N....#
y4  +...............................................................==...+
y5  +............................................................==......+
y6  +.........k.....k.........................................==.........+
y7  ##############################.......#################################
y8  ##############################......##################################
y9  ######################################################################
y10  ######################################################################
```

| Elemento | Posição | Função |
|---|---|---|
| caixas `k` | (10,6) e (16,6) | `CEN-004` — decor interativo leve, ensina que o cenário reage |
| **bacia** | x = 30–36, piso em y=8 | descida de **2 tiles** (a saída é em dois degraus de 1) |
| degrau de saída | x = 36, topo y=7 | 1º degrau; o segundo é o piso normal |
| escada de prática | `=` em (58–59,6), (61–62,5), (64–65,4) | 3 degraus de 1 tile, 3 vãos de 1 tile |
| marco `N` | (64,3) | no topo da escada — recompensa de leitura |

- **Função:** ensinar a andar, cair e subir — sem consequência.
- **Ensina:** `MEC-001` nos tempos **1 (introduzir)** e **2 (praticar)** do `PAT-LD-02`.
- **Aceite:** o jogador entra na bacia, sai dela e sobe a escada sem morrer. A escada é **opcional** — isso é correto: prática não pode ser obrigatória.
- **Nota do piloto:** a sala cresceu de 30 para 70 tiles e a bacia mudou-se para x = 30, para o
  jogador só a encontrar **depois** de andar — antes estava a dois passos da porta e não havia
  viagem nenhuma, só um degrau.
- **Nota de design:** a bacia tem 2 tiles de profundidade porque a saída é feita em **dois degraus de 1 tile**. Se fosse um poço de parede reta, seria armadilha na config A (`P-15`).

---

### 4.3 L01-03 — Ensina atacar · 55×11

```
    0000000000111111111122222222223333333333444444444455555
    0123456789012345678901234567890123456789012345678901234
y0  #######################################################
y1  #.....................................................#
y2  #.....................................................#
y3  #............................................G........#
y4  +.....................................................+
y5  +..........E..........................................+
y6  +.........####................E.......................+
y7  #######################################################
y8  #######################################################
y9  #######################################################
y10  #######################################################
```

| Objeto | Pos | Função |
|---|---|---|
| pedestal | x = 10–13, topo y=6 | obstáculo de 1 tile no caminho |
| `E` Sentinela | (11,5) | **de costas** para a entrada, patrulha 3 tiles sobre o pedestal |
| `E` Sentinela | (30,6) | a segunda, de frente, no chão — a luta sem rede |
| `G` sinete | (45,3) | marca de facção |

- **Função:** primeiro combate, em condição controlada — e depois sem rede.
- **Ensina:** `MEC-002` no tempo **1 (introduzir)** com a de cima e no tempo **2 (praticar)** com a
  de baixo. A primeira está virada para o outro lado: o jogador tem a iniciativa e vê o telegraph
  antes de ser atacado. A segunda, 19 tiles depois, já não tem nada disso — e é essa a diferença
  entre introduzir e praticar que o setor antes não fazia (havia **uma** Sentinela em 20 tiles).
- **Aceite:** o jogador derrota as duas (vida 20 / dano branco 20 = **1 golpe cada**, `TST-002`)
  **ou** contorna a primeira subindo no pedestal sem ser atingido.
- **Nota:** o pedestal de 1 tile obriga um pulo. É o único pulo obrigatório antes de L01-04.

---

### 4.4 L01-04 — Ensina pular + combate · 90×11

```
    000000000011111111112222222222333333333344444444445555555555666666666677777777778888888888
    012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
y0  ##########################################################################################
y1  #........................................................................................#
y2  #........................................................................................#
y3  #........................V..........................................................G....#
y4  +...............................................................................==.......+
y5  +...........................................................................==...........+
y6  +.......#####......AA.........h.........E...........T.........T.........E................+
y7  ##########################################################################################
y8  ##########################################################################################
y9  ##########################################################################################
y10  ##########################################################################################
```

| Objeto | Pos | Função |
|---|---|---|
| degrau | x = 8–12, topo y=6 | salto obrigatório de 1 tile |
| espinhos `A` | (19,6) e (20,6) | `CEN-001`, vão de **2 tiles** |
| `V` Mariposa (`ENT-011`) | (25,3) | **voador** — passa por cima do degrau e dos espinhos |
| `h` cura `ITM-001` | (30,6) | +20 de vida — recompensa **depois** da armadilha, nunca antes |
| `E` Sentinela | (40,6) | combate de chão |
| `T` Alicate (`ENT-010`) | (52,6) e (62,6) | **atiradores** — dois, longe um do outro |
| `E` Sentinela | (72,6) | o último combate de chão do setor |
| plataformas `=` | (76–77,5) e (80–81,4) | rota alta **opcional** — foge do chão, não substitui a passagem |
| `G` sinete | (84,3) | marca de facção |

- **Função:** teste do setor — e o **único sítio do jogo** onde os três arquétipos aparecem juntos.
  O degrau obriga a pular, os espinhos obrigam a medir, o voador aparece por cima enquanto o
  jogador está no ar, e os dois atiradores obrigam a **avançar em vez de recuar**.
- **Ensina:** `MEC-001` e `MEC-002` no tempo **4 (testar)**.
- **Densidade:** 5 corpos em 90 tiles = 1 por 18 tiles, dentro de `PAT-LD-10` na forma de
  **razão** (`DEC-048`), e com três arquétipos — a regra nova exige variedade, não só contagem.
- **A rota alta é opcional de propósito:** as duas plataformas dão uma saída do chão para quem
  quer fugir dos atiradores, mas não dão passagem. Quem não as usar não fica preso.
- **Aceite:** `TST-013` — o jogador atravessa sem morrer e sem ficar preso.
- **Nota:** o vão de espinhos tem **2 tiles (128 px)**, não 2,5 tiles. O dimensionamento nasceu da config A (alcance 176 px; 2,5 tiles deixaria 16 px de margem, ambíguo — `PAT-LD-09`). Com a config **B** (`DEC-014`) o alcance andando é 224 px e o vão continua confortável: a escolha é conservadora, não obsoleta.

---

### 4.5 L01-05 — Quarto seguro · 40×11

```
    0000000000111111111122222222223333333333
    0123456789012345678901234567890123456789
y0  ########################################
y1  #......................................#
y2  #......................................#
y3  #............Q................G........#
y4  +......................................+
y5  +......................................+
y6  +.....c.....P.....k.......s............+
y7  ########################################
y8  ########################################
y9  ########################################
y10  ########################################
```

| Objeto | Pos | Função |
|---|---|---|
| `c` vela | (6,6) | `CEN-002` |
| `P` salvamento | (12,6) | `MEC-007` — salvar por interação (`UI-09`) |
| `k` caixote | (18,6) | `CEN-004` |
| `Q` quadro de aviso | (13,3) | `LOR` — 2–3 linhas sobre a Vigília vazia (≤ 90 palavras) |
| `s` escudo `ITM-002` | (26,6) | +10 de escudo — repõe antes de sair (`DEC-019`) |
| `G` sinete | (30,3) | marca de facção |

- **Função:** checkpoint manual e primeira entrega de lore do jogo.
- **Ensina:** `MEC-007` — salvar. O jogador **pode** ignorar; a porta de L01-06 salva automaticamente.
- **Aceite:** `TST-007` — interagir salva; erro de conexão mostra `UI-11` e permite retry sem perder a posição.
- **Nota:** sem inimigos, sem armadilha (`PAT-LD-04`, respiro).

---

### 4.6 L01-06 — Saída · 50×11

```
    00000000001111111111222222222233333333334444444444
    01234567890123456789012345678901234567890123456789
y0  ##################################################
y1  #................................................#
y2  #................................................#
y3  #.............G..................................#
y4  +................................................D
y5  +................................................D
y6  +.........N.......k.....T.....c..................D
y7  ##################################################
y8  ##################################################
y9  ##################################################
y10  ##################################################
```

| Objeto | Pos | Função |
|---|---|---|
| `N` marco | (10,6) | `LOR` — aviso de saída da área |
| `k` caixote | (18,6) | `CEN-004` |
| `T` Alicate (`ENT-010`) | (24,6) | **atirador à saída** — a última coisa que o setor ensina é recuar do tiro |
| `c` vela | (30,6) | `CEN-002` |
| `G` sinete | (14,3) | marca de facção |
| `D` porta dourada | (49, 4–6) | transição para LVL-02 + **save automático** |

- **Função:** saída e checkpoint automático de transição.
- **Aceite:** cruzar a porta dispara `MEC-007` e carrega LVL-02. `TST-007` verde.

---

## 5. Set pieces (`CEN-###`)

| ID | Nome | Comportamento | Frames | Dano | Desativável |
|---|---|---|---|---:|---|
| `CEN-001` | Espinhos de ferro | ciclo ativo/inativo de 1,2 s; telegraph por brilho `--threat` 300 ms antes de ativar | 4 | 20 HP | Não (é regra) |
| `CEN-002` | Vela da Vigília | chama animada, 6 partículas, apaga e reacende quando o jogador passa | 3 | 0 | Sim |
| `CEN-003` | Sinete da Vigília | marca pintada na parede, sempre em `y=3`, mesma posição relativa em todos os setores | 1 | 0 | Sim |
| `CEN-004` | Caixa de carga | decor com colisão leve; pode ser empurrada 1 tile; nunca bloqueia passagem | 2 | 0 | Não |

> `[MVP]` Neste setor `CEN-001` está **desativado** (sempre visível, sempre causando dano) para não introduzir ritmo de armadilha antes de o jogador saber pular. A versão cíclica entra em LVL-02.

---

## 6. Entidades e ensino

| Entidade | Qtd | Onde | Estado inicial | Vida | Dano |
|---|---:|---|---|---:|---:|
| `ENT-001` Homem Macho | 1 | L01-01 (2,6) | `idle` | 100 | 20 / 10 |
| `ENT-002` Sentinela | 1 | L01-03 (11,5) | patrulhando **de costas** | 20 | 20 |
| `ENT-002` Sentinela | 1 | L01-03 (30,6) | patrulhando, de frente | 20 | 20 |
| `ENT-002` Sentinela | 2 | L01-04 (40,6) e (72,6) | patrulhando | 20 | 20 |
| `ENT-010` Alicate de zaga | 2 | L01-04 (52,6) e (62,6) | parado, olhando a entrada | 20 | **10** (tiro) |
| `ENT-010` Alicate de zaga | 1 | L01-06 (24,6) | parado | 20 | **10** (tiro) |
| `ENT-011` Mariposa de turno | 1 | L01-04 (25,3) | vaivém no ar | 20 | **10** (picada) |

**Os três arquétipos, em uma linha cada** (`DEC-048`, `core/arquetipos.ts`):

| Arquétipo | O que faz | Como se lê | O que obriga o jogador a fazer |
|---|---|---|---|
| `sentinela` | patrulha e investe | para, fica vermelho, salta para a frente | sair da linha ou aparar |
| `atirador` | fica, avisa e atira | para, fica vermelho, o tubo aponta | **avançar** (recuar não resolve) |
| `voador` | vaivém no ar, desce a picar | para no ar, fica vermelho, desce | olhar para cima; o chão não protege |

O **telegrafo é o mesmo contrato para os três** e nunca desce de 300 ms (`REACAO_MINIMA_MS`):
800 ms na Sentinela, 750 no Alicate, 600 na Mariposa. Estes números são **da variante do setor**,
não do arquétipo — um LVL-14 pode ter um Alicate que avisa em 500 ms.

### Sequência de ensino (`PAT-LD-02`)

| Momento | Sala | Mecânica | Tempo |
|---|---|---|---|
| t = 0–20 s | L01-01, L01-02 | andar | **1 introduzir** |
| t = 20–60 s | L01-02 | cair / subir degrau | **1 introduzir** |
| t = 60–90 s | L01-02 (escada) | pular | **2 praticar** |
| t = 60–110 s | L01-03 | atacar | **1 introduzir** |
| t = 110–150 s | L01-03 (2ª Sentinela) | atacar | **2 praticar** |
| t = 150–250 s | L01-04 | pular + combate + armadilha + **três arquétipos** | **4 testar** |
| t = 250–290 s | L01-05 | salvar | **1 introduzir** |
| t = 290–320 s | L01-06 | recuar do tiro | **2 praticar** |

**Meta do GDD 2.9:** mover, pular e atacar compreendidos em **≤ 90 s**. Este layout entrega
atacar por volta dos **60 s** (a segunda sala ficou mais longa, mas a primeira Sentinela está
mais perto da porta do que estava). Se o playtest mostrar atraso, a correção é **encurtar L01-02**
e **não** antecipar o inimigo — a regra não mudou.

---

## 7. Validação de alcançabilidade

Calculada a partir de `02-gameplay.md` §2.11 (`[SUPOSIÇÃO]`) e conferida contra as duas configurações que estavam em disputa — a canônica hoje é a **B** (`DEC-014`).

| Config | Impulso | Gravidade | Altura 1 salto | Altura 2 saltos | Vão horizontal |
|---|---:|---:|---:|---:|---:|
| **A** (GDD atual) | 480 | 1.200 | 96 px (1,5 tile) | 192 px | 176 px (2,75 tiles) |
| **B** (recomendada) | 560 | 1.100 | 142 px (2,2 tiles) | 284 px | 226 px (3,5 tiles) |

| Obstáculo | Tipo | Subida | Vão | Config A | Config B |
|---|---|---:|---:|---|---|
| L01-02 · bacia: descida de 2 tiles | descida | 128 px | 0 px | OK | OK |
| L01-02 · saída da bacia: degrau x=17 | subida | 64 px | 64 px | OK | OK |
| L01-02 · escada: plataforma y=6 | subida | 64 px | 0 px | OK | OK |
| L01-02 · escada: y=6 → y=5 | subida | 64 px | 64 px | OK | OK |
| L01-02 · escada: y=5 → y=4 | subida | 64 px | 64 px | OK | OK |
| L01-03 · pedestal do Sentinela | subida | 64 px | 0 px | OK | OK |
| L01-04 · degrau de 1 tile | subida | 64 px | 0 px | OK | OK |
| L01-04 · vão de espinhos | vão | 0 px | 128 px | OK | OK |
| L01-04 · plataformas da rota alta (76→77, 80→81) | subida | 64 px | 192 px | OK | OK |

**Resultado: 0 falhas.** As duas linhas novas são da rota **opcional** (`DEC-048`): nenhuma delas
é necessária para atravessar a sala, e o vão de 192 px fica dentro do alcance andando (224 px) e
largamente dentro do alcance a correr. LVL-01 é completável nas configs A e B e **não** depende de `HAB-01` (salto duplo). Este setor foi desenhado para ser config-agnóstico (`DEC-008`) — e essa propriedade se mantém útil depois de `P-15`: com a config **B** adotada (`DEC-014`), todas as folgas de LVL-01 ficaram **maiores**, nunca menores.

---

## 8. Salvamento e morte

| Evento | O que acontece | Regra |
|---|---|---|
| Interagir com `P` em L01-05 | salva | `MEC-007` |
| Cruzar `D` em L01-06 | salva automaticamente | `MEC-007` |
| Morrer em L01-04 | respawn no último checkpoint confirmado | `MEC-004` |
| Morrer com bolsa | bolsa fica no local; nova morte destrói a anterior | `MEC-004`, `TST-004` |
| Perda de conexão durante save | `UI-11`, operação pausada, retry | `PAT-C-07` |

Este setor **não** cria checkpoint em transição interna (L01-02 → L01-03 etc.). Só `P` e `D` salvam — coerente com `PAT-LD-05`.

---

## 9. Conversão para Tiled (`.tmj`)

| Item | Definição |
|---|---|
| Nome do arquivo | `public/assets/tilemaps/tm_lvl01_ruinas.tmj` |
| Tileset | `tm_ruinas` (`AST-004`), 24 tiles, 64×64 |
| Orientação | orthogonal, tile 64×64, 20–40 colunas × 11 linhas por sala |
| Camadas (ordem) | `decor-back` · `ground` · `collision` · `objects` · `decor-front` |
| `collision` | retângulos desenhados sobre o `ground`, **nunca** desalinhados |
| Propriedades do mapa | `lvl_id=LVL-01`, `pal=PAL-01`, `bgm=BGM-01`, `amb=AMB-01` |

### Propriedades dos objetos (camada `objects`)

| Tipo | Propriedades |
|---|---|
| `player_spawn` | `facing` = `right` |
| `enemy` | `ent=ENT-002`, `patrol_tiles`=3, `initial_facing`=`left` (L01-03) / `right`, `has_telegraph`=true |
| `trap_spikes` | `cen=CEN-001`, `mode`=`static` (`[MVP]`), `damage_key`=`spikes` |
| `save_point` | `ui=UI-09`, `checkpoint`=true |
| `door` | `to=LVL-02`, `style`=`gold`, `autosave`=true |
| `lore_marker` | `key`=`lore.lvl01.post`, `max_words`=25 |
| `lore_board` | `key`=`lore.lvl01.board`, `max_words`=90 |
| `decor` | `ast=CEN-002` / `CEN-003` / `CEN-004`, `collides`=false |

**Regra de ouro da conversão:** nenhum número de gameplay no `.tmj`. Dano, vida e tempos vêm de `src/game/data/tuning.ts` (`PAT-C-04`). O mapa aponta a **chave**, não o valor.

---

## 10. Checklist de aprovação (`07-padroes` §7.14)

- [x] Dimensões múltiplas de 20×11 — 60, 70, 55, 90, 40, 50 × 11 (`DEC-048`: todas mais largas que o ecrã, todas com rolagem)
- [x] Objetivo de cada sala compreensível em ≤ 3 s
- [x] Respeita a tabela de alcance (§7) — 0 falhas em A e B (config canônica: **B**, `DEC-014`)
- [x] Ensino segue `PAT-LD-02` nos 4 tempos
- [x] Sem travas de habilidade neste setor (nenhuma necessária)
- [x] Rota crítica funciona com inventário vazio (`PAT-LD-06`)
- [x] Densidade de inimigos conforme `PAT-LD-10` na forma de **razão**: 1 corpo por 20 tiles, com pelo menos dois arquétipos nas salas de combinação (`DEC-048`)
- [x] `collision` alinhada ao `ground` (validado pelo gerador de grade)
- [x] Nenhuma ameaça fora da tela — a sala mais larga (90 tiles) põe o primeiro corpo a 19 tiles da entrada, e o atirador de L01-06 só atira a 13 tiles, sempre depois de a câmara o mostrar
- [x] Paleta com um único acento (`PAL-01`)
- [x] Testes associados: `TST-001`, `TST-002`, `TST-004`, `TST-007`, `TST-013`, `TST-014`

---

## 11. Desvios registrados

| # | O que mudou | Por quê | IDs afetados |
|---|---|---|---|
| 1 | Vão de espinhos de **2,5 tiles → 2 tiles** | Na config A o alcance era 176 px; 2,5 tiles (160 px) deixaria 16 px de margem. A é hoje descartada (`DEC-014`), mas o vão de 2 tiles continua correto: é o valor que também funciona andando na config B | `04-setores` §4.5, `PAT-LD-09` |
| 2 | Aberturas passam a ter **3 tiles de altura (linhas 4–6)**, com piso sempre na linha 7 | Elimina a classe de bug "porta em altura incompatível" entre salas | `DEC-007` |
| 3 | `CEN-001` entra **estático** neste setor | Ritmo de armadilha antes de o jogador saber pular seria injusto | `05-animacao` §5.3 |
| 4 | A escada de L01-02 é **opcional** | `PAT-LD-02` define "praticar" como repetição sem consequência; obrigar prática contradiz o padrão | — |
| 5 | **As seis salas foram ampliadas** (20·30·20·40·20·20 → 60·70·55·90·40·50) | O piloto de `DEC-048`: a maior sala do setor (40 tiles) cabia **duas vezes** no ecrã de 1280 px, e uma sala que se vê toda não dá para esconder nada. Só a largura mudou; as 11 linhas e o piso na linha 7 são os mesmos | `PAT-LD-10`, `DEC-007`, `DEC-048` |
| 6 | **Três arquétipos comuns** em vez de um (`ENT-010` atirador, `ENT-011` voador) | O setor tinha **três** cópias da mesma Sentinela. Três Sentinelas em 90 tiles é a mesma luta três vezes; três arquétipos obrigam a três respostas diferentes (sair da linha, avançar, olhar para cima) | `ENT-002`, `PAT-LD-10`, `DEC-048` |
| 7 | A densidade deixa de ser **3 por sala** e passa a ser **1 por 20 tiles** | O teto antigo foi escrito quando a sala maior tinha 40 tiles. Aplicado a 90, ou enche-se a sala de corpos ou fica-se com uma sala vazia — nenhum dos dois é o que a regra queria dizer | `PAT-LD-10` |
| 8 | O `V` de L01-04 é **inimigo**; o `V` do resto do jogo continua a ser estandarte, sumidouro, cristal ou varanda | `DEC-023` aplicada a corpos: o significado do glifo é da sala. `Room.variantes` é quem o diz, e o teste reprova se a sala usar `T`/`V` sem declarar | `DEC-023`, `DEC-048` |

## 12. Pendências geradas

| ID | Item | Bloqueia |
|---|---|---|
| `P-102` | **O piloto ainda não foi jogado por uma pessoa.** Os 109 s de travessia e os 8 corpos estão medidos por bot; se a sala é divertida, se o atirador é injusto e se o voador se lê, só o playtest diz | Replicar aos outros 15 setores |
| `P-103` | **A arte dos dois arquétipos novos é procedural** (`enemy_shooter`, `enemy_flyer`) | `P-16` |
| `P-104` | **O contrapeso de LVL-05 não vai para o save** continua aberto (`P-74`) — não é do piloto, mas o piloto mexeu no mesmo ficheiro e vale lembrar | — |

Dependências externas: `P-15` **fechada** (`DEC-014 = B`; era irrelevante aqui de todo modo, ver §7). Ainda aberta: `P-16` (pipeline de arte, para `AST-004`).

---

## Handoff

**Para `AGT-01`** — produzir `AST-004` (tiles de ruína, 24 frames) e os set pieces `CEN-001`–`004`.
**Para `AGT-03`** — spawns, patrulha do `ENT-002`, `CEN-001` estático, `P` e `D` com autosave.

**O próximo agente precisa saber, em 3 linhas:**
1. Piso sempre em `y=7`, aberturas em `y=4–6`, nada de obstáculo acima de 1 tile neste setor.
2. `CEN-001` aqui é estático e não cíclico; o ciclo só existe a partir de LVL-02.
3. O `.tmj` guarda chaves, nunca valores — dano e tempos vivem em `tuning.ts`.
