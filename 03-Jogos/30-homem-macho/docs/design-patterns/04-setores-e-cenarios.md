# 4. Setores e Cenários

> [← Anterior: 3. Ambientação e Mundo](03-ambientacao-e-mundo.md) · [Próximo: 5. Animação e VFX →](05-animacao-e-vfx.md)

> Mapa visual: [`assets/mapa-de-setores.svg`](assets/mapa-de-setores.svg)
> Nomes canônicos são os do GDD §3.4 — **não renomear aqui**. Novidade: `CEN-###` (set piece), `HAB-##` (habilidade de acesso).

## 4.1 Grafo do mundo

`[SUPOSIÇÃO]` A visão completa é um **circuito em serpentina**: o jogador sobe e desce o mundo três vezes, sempre reencontrando o que passou. O Trono do Caos fica **acima das Ruínas da Vigília** — o fim é literalmente em cima do começo, sem atalho até ele.

```
   [13]──[14]──[15]──[16]                    ATO IV
     │
   [12]──[11]──[10]──[09]──[08]──[07]         ATO III (parcial)
     │                  │
   [01]──[02]──[03]──[04]──[05]──[06]         ATO I + II
     └───────────┘  atalho
```

> **[16] é o fim, e o único setor sem porta de saída** (LVL-16 §4.6). O grafo tem 15 arestas de ida e uma de chegada sem volta.

### Conexões e travas (`LVL-##`)

| De → Para | Tipo de passagem | Trava | Setor que ensina |
|---|---|---|---|
| 01 → 02 | Portão aberto `[MVP]` | — | LVL-01 |
| 02 → 03 | Porta de senha `[MVP]` | `MEC-006` senha de 4 símbolos | LVL-02 |
| 02 → (rota lateral) | Rota opcional `[MVP]` | salto duplo (pista da senha) | LVL-02 |
| 03 → 04 | Portão `[MVP]` | conclusão do chefe | LVL-03 |
| 03 ↔ 10 | **Poço da Vigília** (`CEN-082`) — primeiro atalho **entre setores** do jogo | `HAB-03` escalada | pós |
| 04 → 05 | Portão natural | `HAB-01` salto duplo | pós |
| 05 → 06 | Elevador de engrenagem | `HAB-05` força | pós |
| 06 → 07 | Passagem inundada | `HAB-06` fôlego — **obtida em LVL-06** (`P-40`) | pós |
| 07 → 08 | Portão da catedral | **—** *(era "chefe de área" — ver `P-43`)* | pós |
| 08 → 09 | Grade quebrada | **chefe de área** — retorno após derrotá-lo; implementada na **grade da arena** (L08-04) | pós |
| 09 → 10 | Escada de serviço | `HAB-04` gancho — implementada no **canal de 8 tiles** de L09-05 | pós |
| 10 → 11 | **Alçapão do topo da torre** (`DEC-015`: abertura vertical em `y=0`) | `HAB-03` escalada | pós |
| 11 → 12 | **Chaminé** (`CEN-088`) — o vão de **13 tiles** de L11-04 é a trava | `HAB-07` planar | pós |
| 12 → 13 | **Poço de forja** — nenhuma trava: **a forja não tem porta** (`LVL-12` §8) | **—** | pós |
| 13 → 14 | **Travessia vertical** — corrente de ar `CEN-096` até alçapão | `HAB-07` + `CEN-096` | pós |
| 14 → 15 | **Portão fortificado** (`CEN-103`) | **`keys ≥ 2`** (`DEC-016` — contador, não item) | pós |
| 15 → 16 | **Portão do Trono** — sem fechadura: "a chave é o posto" | conclusão do guardião duplo (`ENT-007`) | pós |
| 01 ↔ 16 | — | **inexistente por design** — a varanda de L16-06 mostra o setor 01 e não desce | — |
| **16 → fim** | **Trono do Caos — não há porta de saída**: a parede leste é sólida e `MEC-012` encerra o jogo | **chefe final `ENT-008` — por baixa, não por 0 HP** | pós |

## 4.2 Habilidades de acesso (`HAB-##`)

Metroidvania só existe se a habilidade for **permanente e nunca cair na morte** (GDD `P3`, `MEC-005`).

| ID | Habilidade | Efeito de travessia | Setor de origem | Escopo |
|---|---|---|---|---|
| `HAB-01` | **Salto duplo** | altura 96 → 192 px | LVL-02 | `[MVP]` |
| `HAB-02` | Corrida | travessia horizontal longa (2,5 m de vão) | LVL-01 (inicial) | `[MVP]` |
| `HAB-03` | Escalada / agarrar parede `climbable` | **alçapão no teto** (`DEC-015`) — parede de ganchos do piso ao teto | LVL-10 | `[PÓS]` |
| `HAB-04` | Gancho | vãos de **8 tiles** com argola a ≤ 6 tiles (a trava é horizontal — ver `niveis/LVL-09.md` §6.1) | LVL-09 | `[PÓS]` |
| `HAB-05` | Força | mover blocos (e, depois, quebrar piso rachado) | LVL-05 | `[PÓS]` |
| `HAB-06` | Fôlego | travessia submersa | **LVL-06** ⚠️ *(era LVL-07 — ver `P-40`)* | `[PÓS]` |
| `HAB-07` | Planar (estandarte) | **vãos de 11–15 tiles** — 1.042 px medidos; **sem ganho de altura** — sobe só dentro de `CEN-096` (ver `niveis/LVL-11.md` §7.2 e `niveis/LVL-13.md` §6) | LVL-11 | `[PÓS]` |

> `[RISCO]` 7 habilidades × 16 setores = 112 combinações de alcance a validar. Não abra `HAB-03` antes de o grafo dos 3 setores do MVP estar jogado.

> 🟢 **RESOLVIDO em `DEC-015` — a altura voltou a ser trava, e de graça.** Nenhuma **plataforma** pode ser inalcançável (a mais alta que cabe na grade fica a 256 px e o duplo alcança 276 px, `niveis/LVL-09.md` §6.1), mas a **saída** não precisa ser lateral: um **alçapão em `y=0`, 2 tiles, dois sentidos** fica a **6 tiles (384 px)** do piso — **108 px além** do duplo. Regras: `DEC-015`, e **nenhuma plataforma sob o alçapão**. `HAB-07` planar travará por **vão horizontal**, que já tem régua. Ver `niveis/LVL-10.md` §6. ~~`P-50`~~ fechada.

> 🔴 **Correções pendentes neste capítulo:** `P-40` (`HAB-06` em LVL-06) e `P-43` (trava de 07 → 08 estava na linha errada; pertence a 08 → 09 — **confirmado por LVL-08**). Fichas completas: §4.8 LVL-04 · §4.9 LVL-05 · §4.10 LVL-06 · §4.11 LVL-07 · §4.12 LVL-08.

> 🔴 **Correção pendente de `P-40`:** `HAB-06` Fôlego estava atribuída a **LVL-07**, mas a conexão **06 → 07** exige exatamente essa habilidade — dependência circular, do mesmo tipo que `DEC-010` proíbe. A habilidade também não combina com a materialidade de LVL-07 (Catedral Oca: osso, vitral, vela, sem água). Movida para **LVL-06** (Mina Esquecida), onde há água, veio inundado e cristais. Ver [`niveis/LVL-06.md`](../niveis/LVL-06.md) §6.

### A régua horizontal, fechada em LVL-11

| Obstáculo | px | tiles | Exige |
|---|---:|---:|---|
| salto simples correndo | 313 | 4,9 | nada |
| salto duplo correndo | **534** | **8,3** | `HAB-01` |
| gancho, argola a ≤ 6 tiles | 512 | 8,0 | `HAB-04` |
| **planeio + salto duplo** | **1.042** | **16,3** | `HAB-07` |

> 🔴 **O gancho (8,0) é mais curto que o salto duplo correndo (8,3).** Um vão de 8 tiles é atravessável **sem** `HAB-04` — o canal de L09-05 (512 px) tem 22 px de folga. Registrado em `P-59`, não corrigido em silêncio.

> 🟢 **O planeio não serve sozinho.** Planar num salto simples dá **529 px**, *menos* que o salto duplo correndo (**534 px**). O estandarte só existe quando há altura: ele converte 276 px de subida em 508 px de distância, porque a descida cai de 1.100 px/s² para 120 px/s. **Nenhum ganho de altura é permitido** — ver `niveis/LVL-11.md` §7.2.

> 🟢 **Resolvido em `P-57`/`CEN-096` — e a regra acima continua inteira.** A corrente de ar dá altura ao **jogador**, não ao estandarte: dentro de uma coluna `CEN-096` com o pano aberto ele sobe a **140 px/s**; fora dela, o pano continua descendo a 120 px/s e não ganha um pixel. `HAB-07` mantém a ficha de LVL-11 §7.1 ao pé da letra. Ver `niveis/LVL-13.md` §6.

## 4.3 Tabela de alcance — obrigatória para o level designer

`[DECIDIDO — DEC-014]` A configuração canônica é a **B** (impulso 560, gravidade 1100). O GDD (`2.11`) propunha 480 / 1200, que dá **96 px** de salto — o herói sobe menos que a própria altura (128 px). A config A foi descartada porque, integrada em passo fixo, **não alcança um muro de 3 tiles em nenhuma taxa de quadros** (−2 px a 240 Hz, −8 px a 60 Hz, −16 px a 30 Hz). Ver `docs/decisoes/P-15-tuning-de-movimento.md`.

| Config | Impulso | Gravidade | 1 salto (60 Hz) | 2 saltos (60 Hz) | Vão andando | Vão correndo |
|---|---:|---:|---:|---:|---:|---:|
| A — GDD atual | 480 | 1.200 | 92 px (1,4 tile) | **184 px (2,9 tiles)** | 172 px (2,7 tiles) | 241 px (3,8 tiles) |
| **B — canônica** | 560 | 1.100 | **138 px (2,2 tiles)** | **276 px (4,3 tiles)** | 224 px (3,5 tiles) | 313 px (4,9 tiles) |

> ⚠️ **Use sempre os valores a 60 Hz**, não a forma fechada `v²/2g`. A forma fechada dá 192 px em A, o que cria a ilusão de um gate possível; a integração real dá 184 px e o salto falha por 8 px. **A simulação é a autoridade** — o comparador em `ferramentas/comparador-de-salto.html` mostra os dois lado a lado.

**Regra de gating (com a config B):**

| Obstáculo | Acessível sem salto duplo? |
|---|---|
| Degrau de 1 tile (64 px) | Sim |
| Muro de 2 tiles (128 px) | Sim — 138 px de salto, 10 px de folga |
| Muro de 3 tiles (192 px) | **Não** — exige `HAB-01` (276 px de duplo, 84 px de folga) |
| Vão de 3 tiles (192 px) | Sim andando (224 px) — **não serve como trava** |
| Vão de 4 tiles (256 px) | Andando **não** (224 px) — mas **correndo atravessa** (313 px), então não é trava (`DEC-009`) |

**Consequência para o desenho:** com B, a fronteira da trava vertical sobe para **4 tiles**, e muros de 1–2 tiles ficam livres como decoração. O gate de LVL-02 já é o de 3 tiles e funciona com 84 px de folga — **nenhum retrabalho de layout é necessário**. Vãos horizontais continuam proibidos como trava (`DEC-009`): a corrida atravessa 4 tiles com um salto só.

## 4.4 Ficha resumida dos 16 setores

| ID | Setor | Função dramática | Bioma / materialidade | Acento | Chefe | Escopo |
|---|---|---|---|---|---|---|
| 01 | Ruínas da Vigília | tutorial, base | pedra clara, pano rasgado, poeira | `PAL-01` | — | `[MVP]` |
| 02 | Galeria Partida | primeira travessia | interior de pedra, vitral quebrado, água rasa | `PAL-02` | — | `[MVP]` |
| 03 | Portão do Guardião | primeiro confronto | pátio monumental, ferro, estandartes | `PAL-03` | ENT-003 | `[MVP]` |
| 04 | Bosque das Cinzas | respiro e amplitude | árvores mortas, cinza, raiz | `PAL-04` | — | `[PÓS]` |
| 05 | Cripta das Engrenagens | verticalidade mecânica | bronze, dente de engrenagem, óleo | `PAL-05` | — | `[PÓS]` |
| 06 | Mina Esquecida | descida, escuro | escora de madeira, cristal, escuro real | `PAL-06` | — | `[PÓS]` |
| 07 | Catedral Oca | escala e silêncio | osso, vitral inteiro, vela | `PAL-07` | — | `[PÓS]` |
| 08 | Pátio Rubro | arena aberta | tijolo, sol vermelho, areia | `PAL-08` | chefe médio | `[PÓS]` |
| 09 | Canais Sombrios | claustrofobia | tijolo molhado, água suja, argola | `PAL-09` | — | `[PÓS]` |
| 10 | Torre da Vigília | hub vertical | pedra alta, sino, quarto seguro | `PAL-10` | — | `[PÓS]` |
| 11 | Jardim Profanado | beleza errada | flora magenta, estátua sem rosto | `PAL-11` | — | `[PÓS]` |
| 12 | Forja Distorcida | indústria bruta | bigorna, fogo, corrente | `PAL-12` | chefe médio | `[PÓS]` |
| 13 | Abismo do Eco | vertigem | nada além de profundidade e eco | `PAL-13` | — | `[PÓS]` |
| 14 | Fortaleza do Eclipse | poder institucional | muralha, estandarte negro, eclipse | `PAL-14` | chefe alto | `[PÓS]` |
| 15 | Ante-sala do Fim | suspensão | corredor de portas, cinza-osso | `PAL-15` | guardião duplo | `[PÓS]` |
| 16 | Trono do Caos | conclusão | trono partido, vinho, vazio | `PAL-16` | `ENT-008` | `[PÓS]` |

> 📑 **Numeração desta seção:** os 16 setores ocupam **`§4.5`–`§4.20`** em ordem de ID; o **checklist é fixo em `§4.90`**, para não renumerar a cada setor novo. *(A faixa `§4.5`–`§4.89` do plano original nunca foi usada: os setores couberam em 16 seções, uma por setor.)*

---

## 4.5 `[MVP]` LVL-01 — Ruínas da Vigília

**Objetivo (GDD):** aprender controles e acessar o quarto seguro. · **Duração-alvo:** 3–5 min · **Mortes esperadas:** 0–1.

> 📐 **Layout detalhado (sala por sala, coordenadas, `.tmj`):** [`docs/niveis/LVL-01.md`](../niveis/LVL-01.md)
**Materialidade:** pedra clara (`--stone` + `--bone`), pano rasgado, poeira dourada, chão plano.
**Sinal de ambientação:** sinete da Vigília (1), vela acesa sem ninguém (2).
**Ensina:** mover, pular, atacar, bolsa, salvar. **Não ensina:** salto duplo, senha, chefe.

| Sala | Tamanho | Função | Conteúdo | Perigo |
|---|---|---|---|---|
| L01-01 | 20×11 | abertura silenciosa | nada interativo por 90 px; só cenário e a vela | nenhum |
| L01-02 | 30×11 | ensina mover | 3 degraus de 1 tile, 2 caixas | queda de 2 tiles (sem dano) |
| L01-03 | 20×11 | ensina atacar | 1 Sentinela em pedestal, patrulhando de costas | `ENT-002` |
| L01-04 | 40×11 | ensina pular + combate | 2 Sentinelas, degrau de 1 tile, vão de 2 tiles | queda em espinhos `CEN-001` |
| L01-05 | 20×11 | **quarto seguro** | ponto de salvamento, quadro de aviso (`LOR-04`), placa | nenhum |
| L01-06 | 20×11 | saída | porta dourada para LVL-02, visível desde L01-04 | nenhum |

**Set pieces (`CEN-`):**
- `CEN-001` — Espinhos de ferro no chão, 1 tile, ativa/inativa em ciclo de 1,2 s. Telegraph por brilho `--threat`.
- `CEN-002` — Vela da Vigília: 1 chama, 6 partículas, apaga e reacende se o jogador passar. Ambientação, sem função.
- `CEN-003` — Sinete pintado na parede a 3 tiles de altura: marca de facção, aparece em todos os setores.

**Regra de design:** nenhuma morte obrigatória. A primeira queda (L01-02) tem 2 tiles e é reversível — o jogador aprende que cair custa tempo, não vida.

---

## 4.6 `[MVP]` LVL-02 — Galeria Partida

**Objetivo:** encontrar salto duplo, senha e armadilha. · **Duração-alvo:** 4–6 min · **Mortes esperadas:** 1–3.
**Materialidade:** interior de pedra, vitral quebrado projetando luz `PAL-02`, água rasa refletiva, piso irregular.
**Sinal de ambientação:** objeto de trabalho abandonado no meio da tarefa (3).
**Ensina:** salto duplo, pista ambiental, senha, armadilha. **Trava:** porta de 4 símbolos para LVL-03.

Estrutura em **laço com backtracking**: rota baixa até o fragmento, retorno, rota alta até a porta.

| Sala | Tamanho | Função | Conteúdo |
|---|---|---|---|
| L02-01 | 20×11 | transição | vitral partido ao fundo (`CEN-010`) |
| L02-02 | 30×11 | **bifurcação + gate** | plataforma one-way a **3 tiles** + fenda no teto; rota baixa à direita |
| L02-03 | 30×11 | armadilha | 2 pares de `CEN-001` **cíclicos, defasados 0,6 s** + 1 Sentinela |
| L02-04 | 20×11 | pista 1 | símbolos **1 e 3**; grade `CEN-013` mostra a porta ao longe |
| L02-05 | 30×11 | **fragmento** (`ITM-003`) | beco sem saída; 3 pares de espinhos + 1 Sentinela |
| L02-06 | 30×11 | rota alta | entrada por furo no piso; 3 vãos de **4 tiles**; símbolos **2 e 4** |
| L02-07 | 20×11 | **porta de senha** (`MEC-006`) | painel `CEN-012`; erro = porta fechada + som distinto |
| L02-08 | 20×11 | checkpoint | transição para LVL-03 |

> 📐 **Layout detalhado (sala por sala, coordenadas, validação de alcance):** [`docs/niveis/LVL-02.md`](../niveis/LVL-02.md)
> ✅ **O gate de L02-02 fechou `P-15`:** muro de 3 tiles, subível só com salto duplo — confiável na config B (impulso 560 / gravidade 1100), adotada em `DEC-014`. Ver §3 do documento do nível.

**Ponto crítico de design (`PAT-LD-03`):** o jogador **vê** a porta de senha antes de ver a rota lateral, e vê a rota lateral antes de poder subir. A frustração é o motor da exploração — mas a rota precisa estar a ≤ 5 s de caminhada para ser lembrada.

**Set pieces:**
- `CEN-010` — Vitral Partido: 3 feixes de luz `PAL-02`; o feixe se move 2 cm/s (parallax de fundo, sem colisão).
- `CEN-011` — Água rasa: 4 px de profundidade, respinga ao pisar (3 partículas), sem dano.
- `CEN-012` — Painel de símbolos: 4 glifos originais, 24×24 px cada, gravados em pedra. **Não** usar alfabetos reais.

---

## 4.7 `[MVP]` LVL-03 — Portão do Guardião

**Objetivo:** enfrentar o chefe e acessar a saída. · **Duração-alvo:** 3–5 min · **Mortes esperadas:** 2–5.

> 📐 **Layout e especificação de combate:** [`docs/niveis/LVL-03.md`](../niveis/LVL-03.md) — FSM do chefe, timings, TTK validado e regras de retry.
**Materialidade:** pátio monumental, ferro, estandartes rasgados, chão de laje grande, luz `PAL-03`.
**Função dramática:** primeira prova de que o jogador "é o Homem Macho".

| Sala | Tamanho | Função | Conteúdo |
|---|---|---|---|
| L03-01 | 20×11 | aproximação | corredor de estandartes; música muda ao cruzar |
| L03-02 | 24×11 | **arena do chefe** (`ENT-003`) | piso plano, 2 pilares quebráveis como cobertura |
| L03-03 | 20×11 | respiro pós-chefe (`PAT-LD-04`) | 6 s sem perigo; recompensa; salvamento automático |
| L03-04 | 20×11 | conclusão | saída dourada; tela de conclusão do recorte (`MEC-009`) |

**Regras da arena (`PAT-LD-07`):**
- Piso 100% plano, **sem** queda possível. Morrer é perder vida, não cair.
- Largura mínima de 24 tiles para o chefe investir (**investida de 5 tiles** — 320 px a 520 px/s; com 8 tiles a janela de punição desaparece).
- Nenhum coletável dentro da arena durante a luta.
- Entrada do chefe: `VIS-007` hold de 400 ms + nome na tela + fala única.
- Se o jogador morrer 3× no mesmo trecho, oferta de dificuldade (`MEC-008`).

**Set pieces:**
- `CEN-020` — Estandarte rasgado da Vigília: anima a 8 fps, 3 frames de ondulação.
- `CEN-021` — Pilar quebrável, **2 tiles de altura**: 3 estados (inteiro / rachado / ruína), absorve 1 investida e atordoa o chefe por 1200 ms.

---

## 4.8 `[PÓS]` LVL-04 — Bosque das Cinzas

> ⚠️ **Fora do recorte do MVP.** Especificado completo para destravar o Ato II e o orçamento de arte, mas nome e conteúdo **não são canônicos** (`D-04`). Não codar antes de `BKL-012`.

**Objetivo:** atravessar o bosque e achar o caminho para o setor seguinte. · **Duração-alvo:** 6–9 min · **Mortes esperadas:** 1–3.

> 📐 **Layout (sala por sala, coordenadas, `.tmj`):** [`docs/niveis/LVL-04.md`](../niveis/LVL-04.md)
**Materialidade:** madeira morta, cinza caindo, raiz que cresceu sobre o caminho, musgo seco, luz `PAL-04`.
**Função dramática:** **respiro e amplitude.** O jogador acabou de vencer o Guardião; o jogo abre em vez de apertar.

| Sala | Tamanho | Função | Conteúdo |
|---|---|---|---|
| L04-01 | 30×11 | soleira | árvores mortas, cinza, insinuação da Ronda; **nenhum inimigo** |
| L04-02 | 40×11 | amplitude + verticalidade | raízes `=` em dois níveis, vão de 3 tiles com respawn sem dano |
| L04-03 | 40×11 | **a cena do Ato II** | 3 Sentinelas em formação sincronizada (`P-35`) |
| L04-04 | 20×11 | contraste / claustrofobia | **teto em `y=3`** — `HAB-01` fica bloqueado de propósito |
| L04-05 | 24×11 | **portão natural** | parede de raiz de 3 tiles: trava de saída por salto duplo |

**Regras do setor:**
- **Zero armadilhas.** Nem `CEN-001`, nem queda fatal. A única fonte de dano são 6 inimigos comuns, todos evitáveis. Hipótese registrada em `P-33`.
- **A trava de saída é vertical** (`DEC-009`): um vão horizontal seria atravessado correndo + duplo (384 px = 6 tiles).
- **O portão é simétrico** — quem está do outro lado sobe de volta com o mesmo salto. Sem beco sem saída.
- **A densidade de inimigos fica abaixo** do teto de `PAT-LD-10`: 6 em 154 tiles, porque o setor é respiro.

**Set pieces:**
- `CEN-030` — Árvore morta, 4 tiles de altura, sem copa. Camada `decor-back`: o jogador passa **na frente** do tronco.
- `CEN-031` — Cinza caindo: partícula de 2 px, 1,8 s de queda, 12 px de deriva, emissores defasados.
- `CEN-032` — Raiz que cresceu sobre o caminho: tileset `tm_bosque`; precisa cobrir parede de 2×3 (o portão).
- `CEN-033` — Lanterna apagada da Vigília: a mesma `CEN-002`, sem chama. Diz que alguém passou e não voltou.

---

## 4.9 `[PÓS]` LVL-05 — Cripta das Engrenagens

> ⚠️ **Fora do recorte do MVP.** Especificado completo para destravar o Ato II e o orçamento de arte, mas nome e conteúdo **não são canônicos** (`D-04`). Não codar antes de `BKL-012`.

**Objetivo:** obter `HAB-05` Força na oficina e usar o contrapeso para pôr o elevador de engrenagem a funcionar. · **Duração-alvo:** 8–12 min · **Mortes esperadas:** 2–4.

> 📐 **Layout (sala por sala, coordenadas, `.tmj`):** [`docs/niveis/LVL-05.md`](../niveis/LVL-05.md)
**Materialidade:** bronze fundido, dente de engrenagem, óleo, graxa nas paredes, luz `PAL-05`.
**Função dramática:** **o primeiro setor que entrega um verbo novo.** O jogador chega travado, explora, ganha Força e destrava o caminho por onde já passou.

| Sala | Tamanho | Função | Conteúdo |
|---|---|---|---|
| L05-01 | 20×11 | soleira | óleo, engrenagens girando sem carga; 1 inimigo |
| L05-02 | 30×11 | verticalidade + armadilha | 3 engrenagens-plataforma empilhadas; dentes de engrenagem no chão; **bloco que não cede** |
| L05-03 | 30×11 | **hub** | `P` único do setor; **elevador `U` visível e travado** |
| L05-04 | 24×11 | **aquisição** | `X` = `HAB-05` Força, sobre plataforma alta |
| L05-05 | 20×11 | **contrapeso** | corredor de 2 linhas de ar; empurrar bloco até a placa |

**Regras do setor:**
- **`DEC-010` é a espinha:** `HAB-05` é obtida em L05-04, **antes** de ser exigida. Nada antes dela pode exigir Força.
- **`PAT-LD-03` em 3 exposições:** bloco que não cede (L05-02) → elevador travado (L05-03) → solução (L05-05).
- **A trava de saída não é de salto:** o corredor de L05-05 tem `y0`–`y4` sólidos e o herói ocupa 2 linhas. Zero px de salto — é trava de espaço, não de altura.
- **O contrapeso é estado de mapa**, persistente no save. Se voltar a desengatar na morte, o setor dobra de duração.
- **`PAT-LD-08`:** o elevador ganha 2 paradas após a conclusão (`L05-03 ↔ L05-01`), servindo de atalho de retorno.

**Set pieces:**
- `CEN-040` — Engrenagem gigante: 2 rpm, 4 variantes de raio, camada `decor-back`, sem colisão.
- `CEN-041` — Poço de óleo: mancha com reflexo estático, sem partícula e sem dano.
- `CEN-042` — Dente de engrenagem no chão: a `CEN-001` com skin mecânica.
- `CEN-043` — Placa de contrapeso: 2 estados (vazia / engatada).

**Limite físico deste setor (e de todos os seguintes):** 11 linhas de tela, piso em `y=7`, plataforma mais alta em `y=2`. **A escada vertical máxima é 4 níveis.** Ver `niveis/LVL-05.md` §6 e `P-39`.

---

## 4.10 `[PÓS]` LVL-06 — Mina Esquecida

> ⚠️ **Fora do recorte do MVP.** Especificado completo para destravar o Ato II e o orçamento de arte, mas nome e conteúdo **não são canônicos** (`D-04`). Não codar antes de `BKL-012`.

**Objetivo:** descer pela mina, obter `HAB-06` Fôlego no veio afogado e atravessar a galeria inundada até LVL-07. · **Duração-alvo:** 9–13 min · **Mortes esperadas:** 2–4.

> 📐 **Layout (sala por sala, coordenadas, `.tmj`):** [`docs/niveis/LVL-06.md`](../niveis/LVL-06.md)
**Materialidade:** escora de madeira apodrecida, cristal violeta, rocha escura, água parada, luz `PAL-06`.
**Função dramática:** **a mina que se afogou sozinha.** O segundo setor que entrega habilidade — e o primeiro cuja trava não é espacial.

| Sala | Tamanho | Função | Conteúdo |
|---|---|---|---|
| L06-01 | 20×11 | soleira | escoras, primeiro cristal; 1 inimigo |
| L06-02 | 30×11 | verticalidade + estaca **cíclica** | 3 níveis de caixote de escora; 2 inimigos |
| L06-03 | 24×11 | **a sala mais escura** | cristais como única luz e única sinalização |
| L06-04 | 30×11 | **aquisição + 1º mergulho** | `X` = `HAB-06`, dentro de bolsão fechado sob a água |
| L06-05 | 20×11 | **travessia submersa** | 19 tiles de água sem ar; a saída para LVL-07 |

**Regras do setor:**
- **A trava da saída é temporal.** 19 tiles submersos = ~7,6 s contra 6 s de fôlego base. Não é geometria, é cronômetro.
- **Afogar não mata:** o jogador volta à última superfície respirada, com fôlego cheio e sem dano. Ainda assim a trava funciona — ele não atravessa mais que o próprio fôlego.
- **Natação é universal; só o fôlego é habilidade.** O primeiro mergulho acontece antes de `X`.
- **Rota estritamente linear.** Um caminho alternativo para L06-05 sem passar por L06-04 seria soft lock.
- **Escuro é arte, não mecânica.** Não há sistema de luz no projeto (`P-41`).

**Set pieces:**
- `CEN-050` — Cristal luminoso: 4 variantes de aglomerado. **A única fonte de luz do setor** e a sinalização do caminho.
- `CEN-051` — Escora de madeira: 3 estados (firme / vergada / tombada).
- `CEN-052` — Veio d'água: fio fino escorrendo pela rocha, a pista de que a mina inundou.
- `CEN-053` — Estaca: a `CEN-001` com skin de madeira quebrada.

---

## 4.11 `[PÓS]` LVL-07 — Catedral Oca

> ⚠️ **Fora do recorte do MVP.** Especificado completo para destravar o Ato II e o orçamento de arte, mas nome e conteúdo **não são canônicos** (`D-04`). Não codar antes de `BKL-012`.

**Objetivo:** atravessar a catedral e alcançar a rosácea, passagem para LVL-08. · **Duração-alvo:** 7–10 min · **Mortes esperadas:** 1–2.

> 📐 **Layout (sala por sala, coordenadas, `.tmj`):** [`docs/niveis/LVL-07.md`](../niveis/LVL-07.md)
**Materialidade:** osso, vitral inteiro, vela acesa sem ninguém, poeira suspensa; luz `PAL-07`.
**Função dramática:** **o silêncio antes do pico.** O único setor do jogo sem trava, sem habilidade e sem chefe.

| Sala | Tamanho | Função | Conteúdo |
|---|---|---|---|
| L07-01 | **40**×11 | a escala | 8 arcos cortados pelo teto, zero plataforma, o vitral visível do início |
| L07-02 | 30×11 | simetria | duas arquitraves idênticas com **vão de 8 tiles** entre elas; lascas de osso |
| L07-03 | 24×11 | coro | única escalada real do setor; `P` |
| L07-04 | 20×11 | **contraste de câmara** | sacristia pequena logo depois da nave — a comparação faz a escala |
| L07-05 | 20×11 | rosácea | o vitral do primeiro quadro, agora de perto; saída para LVL-08 |

**Regras do setor:**
- **Sem trava** (`P-43`). A rosácea está aberta; o chefe de área é em LVL-08, e a trava dele é 08 → 09.
- **Escala é leitura, não geometria:** repetição ritmada, transbordo do fundo (`overflow_top`), vazio negativo, contraste de câmara, marco visível de longe, ausência de gameplay no chão.
- **Silêncio é da trilha, não da informação:** `bgm=none` + `AMB-07`, mas **todo** cue de gameplay continua visual.
- **A menor densidade de inimigos do jogo:** 5 em 134 tiles.

**Set pieces:**
- `CEN-060` — Vitral inteiro: a única cor saturada do setor.
- `CEN-061` — Arco de costela: sobe de `y1` e **é cortado pelo teto** (`overflow_top=true`).
- `CEN-062` — Poeira suspensa: partícula sem gravidade, 0,3 px/s de deriva.
- `CEN-063` — Banco de catedral: vazio.

---

## 4.12 `[PÓS]` LVL-08 — Pátio Rubro

> ⚠️ **Fora do recorte do MVP.** Especificado completo porque é o **pico do Ato II** e o primeiro chefe não-MVP, mas nome e conteúdo **não são canônicos** (`D-04`). Não codar antes de `BKL-012`.

**Objetivo:** atravessar o pátio e **derrotar o Alferes da Ronda**, que tranca a grade para LVL-09. · **Duração-alvo:** 8–12 min · **Mortes esperadas:** 3–6.

> 📐 **Layout, ficha de combate e TTK:** [`docs/niveis/LVL-08.md`](../niveis/LVL-08.md)
**Materialidade:** tijolo, sol vermelho, areia; luz `PAL-08`; `AMB-08` vento quente + areia.
**Função dramática:** o pico do Ato II — **o único setor do jogo travado por um corpo**, e o único com as duas forças na mesma sala (`LOR-03b` no chefe, `LOR-03c` no ambiente).

| Sala | Tamanho | Função | Conteúdo |
|---|---|---|---|
| L08-01 | **30**×11 | tempo 1 da areia | 1 faixa de 2 tiles, **nada em volta**; sol vermelho encostado na muralha; monta-carga lacrado |
| L08-02 | 30×11 | tempo 2 (praticar) | 3 faixas de areia, 2 Sentinelas em alturas diferentes, arquibancadas com vão de 7 tiles |
| L08-03 | 20×11 | tempo 3 (combinar) | areia de 3 tiles **entre duas plataformas**; Sentinela **dentro** da areia — e o `P` na boca da arena |
| L08-04 | **24**×11 | tempo 4 (testar) | arena, **zero cobertura**, 4 âncoras de areia em relógio, `ENT-004` |
| L08-05 | 20×11 | respiro | recompensa `ITM-007`, save, monta-carga (atalho) |
| L08-06 | 20×11 | portão | saída para LVL-09; os primeiros estandartes que o vento move |

**Regras do setor:**
- **"Arena aberta" é ausência de cobertura, não tamanho.** 24×11 conforme `PAT-LD-07`; zero pilar, contra os dois quebráveis de LVL-03.
- **A areia não dá dano:** 0,75× no chão, nada no ar, e **zera na morte** (oposto do contrapeso de LVL-05).
- **Nenhum vão horizontal com decolagem em areia** — a 0,75× o salto de corrida cai de 313 para 235 px.
- **A fase 2 do chefe pune a lição da fase 1:** o eco nasce onde ele estava, então perseguir a recuperação passou a ser o erro.

**Set pieces:**
- `CEN-064` — Areia: sobreposição de piso, 3 estados (dormente / ativa / transição).
- `CEN-065` — Grade da arena: open / closed / broken. É a trava 08 → 09.
- `CEN-066` — Monta-carga de tijolo: 2 paradas após a conclusão (`PAT-LD-08`).
- `CEN-067` — Sol vermelho: disco fixo, **sem parallax** — é ele que projeta a sombra usada pelo eco.
- `CEN-068` — Corrente de pátio · `CEN-069` — Estandarte da Ronda (12 variantes, todas rasgadas no mesmo lugar).

---

## 4.13 `[PÓS]` LVL-09 — Canais Sombrios

> ⚠️ **Fora do recorte do MVP.** Especificado completo porque entrega `HAB-04` e destrava o Ato III, mas nome e conteúdo **não são canônicos** (`D-04`). Não codar antes de `BKL-012`.

**Objetivo:** atravessar o canal seco, obter o **gancho** e subir a escada de serviço para LVL-10. · **Duração-alvo:** 8–11 min · **Mortes esperadas:** 0–1.

> 📐 **Layout, ficha de `HAB-04` e o limite de verticalidade:** [`docs/niveis/LVL-09.md`](../niveis/LVL-09.md)
**Materialidade:** tijolo molhado, água suja, ferro, limo; luz `PAL-09`; `AMB-09` seco, **sem reverb**.
**Função dramática:** o **negativo fotográfico de LVL-07** — o mesmo motor, as mesmas 11 linhas, e a lição oposta.

| Sala | Tamanho | Função | Conteúdo |
|---|---|---|---|
| L09-01 | 20×11 | boca | vazamento raso, rato, a frase de tese; **0 inimigos** |
| L09-02 | **30**×11 | exposição 1 do gancho | poço de **8 tiles** com argola; alcova **opcional** com lore; `P` |
| L09-03 | 20×11 | **claustrofobia máxima** | teto em `y=2`, água até 1 tile do teto; **0 inimigos**, 0 plataformas |
| L09-04 | 20×11 | entrega `HAB-04` | `X` gancho, comporta travada, 2 Sentinelas |
| L09-05 | **30**×11 | **a trava** | argola de prática sobre piso firme + canal de **8 tiles** com argola |
| L09-06 | 20×11 | saída | corredor submerso com 2 argolas; `P`, sumidouro (atalho) |

**Regras do setor:**
- **Zero plataformas no setor inteiro.** Onde não há onde pular, o teto aparece.
- **A trava de `HAB-04` é horizontal, de 8 tiles**, porque o salto duplo (276 px) alcança toda plataforma que cabe na grade (256 px). Ver `P-50`.
- **O medo é não caber, não morrer:** queda devolve à entrada (`DEC-011`), água devolve à superfície (`P-40`), e nada no setor mata por ambiente.
- **Claustrofobia é encher, não reduzir:** o piso é sempre `y=7`; aperta-se derrubando o teto e inundando o volume.

**Set pieces:**
- `CEN-071` — Água de canal: volume declarado, 2 estados (vazamento raso / corredor cheio).
- `CEN-072` — Argola de ferro: 2 skins — nova e **gasta por mãos** (a pista de `PAT-LD-03`).
- `CEN-073` — Comporta travada · `CEN-074` — Arco de tijolo · `CEN-075` — Rato (vagueia 2 tiles, nunca ataca).
- `CEN-076` — Sumidouro gradeado: atalho de mão única por `interact`.

---

## 4.14 `[PÓS]` LVL-10 — Torre da Vigília

**Papel:** hub vertical · **Ato III — A Falha** · `PAL-10` pedra alta · entrega **`HAB-03`** · `BGM-01` (+`BGM-03` no quarto seguro)
**Escopo:** `[PÓS]` (`D-04`) — nome canônico (GDD §3.4), conteúdo não canônico. Detalhe em `niveis/LVL-10.md`.

| Sala | Tam. | Conteúdo | Inimigos |
|---|---|---|---|
| L10-01 Base | 20×11 | chegada de LVL-09 · **alçapão lacrado** (exposição 1) · **poço** `W` → LVL-03 · chegada da corda do sino | 1 |
| L10-02 Arsenal | 20×11 | **`X` `HAB-03` Escalada** (exposição 3) | 2 |
| L10-03 Sala do Sino | **30×11** | **o hub**: sino 3×3 **sem badalo** · `P` · **corda** → L10-01 (mão única) | 1 |
| L10-04 Quarto Seguro | 20×11 | `P` + `Q` · **`BGM-03`** · 0 inimigos | 0 |
| L10-05 Escada em Caracol | 20×11 | parede de ganchos 6 tiles · **alçapão aberto** → LVL-11 (exposição 2) | 1 |

**Totais:** 110 tiles · 5 inimigos (`ENT-002`) · 0–1 mortes · 6–9 min · **zero plataformas** · 6 set pieces (`CEN-077`–`082`).

**Regras que este setor estabelece:**

1. **`DEC-015` — abertura vertical em `y=0`.** A saída sobe para o teto em vez de a sala crescer: 384 px contra os 276 px do duplo, **108 px de margem**. Resolve `P-39` e **fecha `P-50`** (ver `niveis/LVL-10.md` §6).
2. **Nenhuma plataforma sob o alçapão** — senão o alçapão deixa de ser trava. É a regra mais fácil de quebrar em revisão de arte.
3. **O sino não emite som em nenhum estado** (`rings=false`). Se tocar, o Ato III perde a única coisa que o setor diz: a ordem é a própria ruína.
4. **O poço `10 ↔ 03` é o primeiro atalho entre setores.** É o que torna o backtracking viável em 16 setores em serpentina (`DEC-005`).

## 4.15 `[PÓS]` LVL-11 — Jardim Profanado

**Papel:** beleza errada · **Ato III — A Falha** · `PAL-11` magenta · entrega **`HAB-07`** · `BGM-01`
**Escopo:** `[PÓS]` (`D-04`) — nome canônico (GDD §3.4), conteúdo não canônico. Detalhe em `niveis/LVL-11.md`.

| Sala | Tam. | Conteúdo | Inimigos |
|---|---|---|---|
| L11-01 Orla do Jardim | 20×11 | chegada de LVL-10 · a primeira **estátua sem rosto** | 1 |
| L11-02 Estufa | **30×11** | **`X` `HAB-07` Estandarte** · `P` · **vão de 11 tiles** (introduzir) | 0 |
| L11-03 Corredor de Cipós | **30×11** | **vão de 12 tiles** (praticar + combinar) | 1 |
| L11-04 O Vão | **40×11** | **vão de 13 tiles = a trava 11 → 12** · `P` antes da linha | 2 |
| L11-05 Chaminé | 20×11 | `P` · saída → LVL-12 · **conduto** `V` → L11-01 (mão única) | 1 |

**Totais:** 140 tiles · 5 inimigos (`ENT-002` variante `pruning`) · **0 mortes** · 7–10 min · **zero plataformas** · **zero argolas** · 6 set pieces (`CEN-083`–`088`).

**Regras que este setor estabelece:**

1. **O planeio é um câmbio, não um voo.** Sem altura ele vale −5 px. Nenhum ganho de altura, nunca (§7.2).
2. **Nenhuma plataforma, em nenhuma sala** — uma plataforma sobre um vão encurta o vão e mata a trava (§8.3). Versão horizontal da regra do alçapão.
3. **A trepadeira (`CEN-085`) é sinalização de beirada**, não decoração. Todo vão tem cipó nas duas margens; nenhuma margem sólida tem.
4. **O setor não mata.** A moeda de LVL-11 é tempo (`DEC-011`), e é o respiro pós-clímax do Ato III (§5).
5. **Nenhuma argola** — o gancho alcança 8 tiles e os vãos são 11+ (§8.2).

## 4.16 `[PÓS]` LVL-12 — Forja Distorcida

**Papel:** indústria bruta · **Ato III — A Falha** · `PAL-12` · **não entrega habilidade** · `BGM-01` (+`BGM-02` na luta)
**Escopo:** `[PÓS]` (`D-04`) — nome canônico (GDD §3.4), conteúdo não canônico. Detalhe em `niveis/LVL-12.md`.

| Sala | Tam. | Conteúdo | Inimigos |
|---|---|---|---|
| L12-01 Conduto | 20×11 | chegada de LVL-11 · boca da **calha** (atalho) | 1 |
| L12-02 Fundição | **30×11** | três fornos acesos, nenhum operário | 2 |
| L12-03 Esteira | **30×11** | **a esteira que monta Sentinelas** — a revelação de `P-62` | 2 |
| L12-04 Bigorna | 20×11 | `P` · **última sala segura** | 0 |
| L12-05 Arena | **24×11** | **`ENT-005` O Forjador (opcional)** · 2 pilões `CEN-092` | chefe |
| L12-06 Poço de Forja | 20×11 | `P` · `ITM-011` condicional · saída → LVL-13 · **calha** `V` → L12-01 | 0 |

**Totais:** 144 tiles · 5 inimigos + 1 chefe médio · 1–2 mortes · 6–12 min · **zero plataformas** · **zero vãos** · 6 set pieces (`CEN-089`–`094`).

**Regras que este setor estabelece:**

1. **O kit fecha em LVL-11.** `HAB-01`–`07` completas; LVL-12 e LVL-13 não dão nada. De LVL-12 em diante o jogo **para de dar e começa a pedir**.
2. **`gate=none`: o chefe não tranca a saída** (§8). A travessia custa **4,36 s** e no máximo um golpe. Um teste tem de **falhar** se alguém puser grade aqui.
3. **Os pilões não são da FSM do chefe** — relógio próprio, defasados em meio período, **param na morte dele**. A fábrica não morre com o operário.
4. **`ITM-011` é condicional** — só existe se `ENT-005` cair. É o preço da luta opcional (§8, `P-61`).
5. **A esteira (`CEN-090`) é a origem dos Distorcidos**: peças montadas com uma peça faltando, e elas andam. Sustenta `P-42` e `P-58` (`P-62`).

## 4.17 `[PÓS]` LVL-13 — Abismo do Eco

**Papel:** vertigem · **Ato III — A Falha (fecho)** · `PAL-13` índigo · **não entrega habilidade** · `BGM-01`, `AMB-13`
**Escopo:** `[PÓS]` (`D-04`) — nome canônico (GDD §3.4), conteúdo não canônico. Detalhe em `niveis/LVL-13.md`.

| Sala | Tam. | Conteúdo | Inimigos |
|---|---|---|---|
| L13-01 Beira do Abismo | 20×11 | chegada de LVL-12 · boca da corrente A (atalho) | 1 |
| L13-02 A Queda | **30×11** | a beirada acaba: **`V` queda longa de 3 s** → L13-03 | 2 |
| L13-03 Fundo do Poço | **30×11** | `P` · **o fundo ainda tem fundo** | 1 |
| L13-04 Boca do Vento | **30×11** | **duas correntes `CEN-096` + dois alçapões** — A volta (L13-01), B avança (L13-05) | 0 |
| L13-05 Beira Alta | 20×11 | `P` · respiro pós-subida | 0 |
| L13-06 Boca do Abismo | 20×11 | → LVL-14 · **fecho do Ato III** | 1 |

**Totais:** 150 tiles · 5 inimigos · **0 mortes por queda** · 6–9 min · **zero plataformas, zero vãos, zero armadilhas** · 5 set pieces (`CEN-095`–`099`) · **tileset de ~14 tiles** (o menor do jogo).

**Regras que este setor estabelece:**

1. **Quem sobe é a corrente, não o pano.** `CEN-096` é **objeto de ambiente**; `HAB-07` continua sem ganho de altura. Subida **140 px/s** contra descida **120 px/s** — 20 px/s de margem (`PAT-LD-09`). Fecha `P-57`.
2. **A profundidade mora na transição.** Queda de **3 s**, `damage=0` (`DEC-011`), `reduced_motion_ms=900` (`VIS-009`). A sala continua com 11 linhas.
3. **A trava `13 → 14` é uma conjunção**: o pano não sobe e a corrente não segura. Única trava do jogo que exige ambiente + habilidade (§7).
4. **O abismo não tem voz própria.** `AMB-13` devolve o áudio do jogador com **700 ms** de atraso, como **efeito de bus**. É a resposta do Ato III em forma de som (§5).
5. **`lethal_falls=false` em todo o mapa.** Um abismo que mata quebraria `DEC-011`.

## 4.18 `[PÓS]` LVL-14 — Fortaleza do Eclipse

**Papel:** poder institucional · **Ato IV — O Trono** · `PAL-14` azul-noite · **não entrega habilidade** · `BGM-01` (+`BGM-02` na luta)
**Escopo:** `[PÓS]` (`D-04`) — nome canônico (GDD §3.4), conteúdo não canônico. Detalhe em `niveis/LVL-14.md`.

| Sala | Tam. | Conteúdo | Inimigos |
|---|---|---|---|
| L14-01 Muralha | **30×11** | chegada de LVL-13 · **monta-carga** (atalho) | 2 |
| L14-02 Praça de Armas | **30×11** | `P` · **capacidade 600, presentes 0** | 2 |
| L14-03 Sala do Estandarte | 20×11 | o estandarte negro de 2 tiles | 1 |
| L14-04 Antessala do Comando | 20×11 | `P` · **"ESPERAR ORDEM"** | 0 |
| L14-05 Arena do Eclipse | **24×11** | **`ENT-006` O Comandante** · `CEN-100` eclipse · grade `CEN-065` | chefe |
| L14-06 Portão Fortificado | 20×11 | `P` · **2 fechaduras (`keys ≥ 2`)** · → LVL-15 | 0 |

**Totais:** 144 tiles · 5 inimigos + 1 chefe alto · 2–4 mortes · 7–10 min · **zero plataformas** · 6 set pieces (`CEN-100`–`105`).

**Regras que este setor estabelece:**

1. **`DEC-016` — chave de chefe é contador (`keys`), não item.** O portão exige `keys ≥ 2`; os dois chefes obrigatórios garantem 2; a sobra de LVL-12 **não tem fechadura**. Fecha `P-61` (§8).
2. **O chefe alto tranca a porta** (`PAT-LD-07`). LVL-12 foi a **exceção documentada**; LVL-14 é a regra (§13, desvio 2).
3. **O eclipse (`CEN-100`) é relógio do céu, não ataque.** Ciclo 8 s (5 luz / 3 sombra); a **fase 2 inverte** para 3/5 sem acelerar; ele **para** na morte do chefe (§7).
4. **A sombra escurece o céu, não a arena** — luz de contorno obrigatória (`P-67`, `VIS-004`).
5. **O Comandante não se desloca.** Fixo, gira, e é o eclipse que decide a distância — a única luta do jogo em que a arena muda de tamanho (§6.5).
6. **A primeira ordem do jogo com destinatário:** *"Você está de serviço. Assuma o posto."* — e o jogador responde lutando.

## 4.19 `[PÓS]` LVL-15 — Ante-sala do Fim

**Papel:** suspensão · **Ato IV — O Trono** · `PAL-15` cinza-osso · **não entrega habilidade** · `BGM-01` + **`BGM-03` no quarto e na arena**
**Escopo:** `[PÓS]` (`D-04`) — nome canônico (GDD §3.4), conteúdo não canônico. Detalhe em `niveis/LVL-15.md`.

| Sala | Tam. | Conteúdo | Inimigos |
|---|---|---|---|
| L15-01 Corredor de Portas | **40×11** | 3 portas lacradas · chegada de LVL-14 | 2 |
| L15-02 Corredor Cego | **30×11** | 3 portas lacradas | 2 |
| L15-03 Quarto de Turno | 20×11 | **quarto seguro** · `P` + **`Q` (o último quadro do jogo)** | 0 |
| L15-04 Cartório | 20×11 | `P` · **"DOIS CARIMBOS. NENHUM A MENOS."** | 1 |
| L15-05 Sala dos Dois | **30×11** | **`ENT-007` O Guardião Duplo — 1 chefe, 2 corpos** · grade | chefe |
| L15-06 Portão do Trono | 20×11 | `P` · **porta de serviço** (atalho) · → LVL-16 | 0 |

**Totais:** 160 tiles · 5 inimigos + 1 chefe de 2 corpos · 2–4 mortes · 8–12 min · **zero plataformas** · 5 set pieces (`CEN-106`–`110`).

**Regras que este setor estabelece:**

1. **`PAT-LD-08` ganha a forma (c) — porta de serviço:** bidirecional, `interact`, sem veículo e sem altura. É o único atalho possível num setor plano.
2. **`AMB-15` = silêncio absoluto, e é o anti-eco de LVL-13.** Nenhum `SFX` ambiente no setor — as portas lacradas e a cinza são **mudas**.
3. **A luta toca `BGM-03`, não `BGM-02`.** Os guardiões são um **expediente**, não um clímax: quando um cai, o outro **recua** para preencher o formulário.
4. **Um chefe, dois corpos:** `MEC-009` só dispara com os dois no chão dentro de **4 s**; a revivificação é **infinita** e interrompível a 30 de dano. Arena de **30×11** (`P-69`).
5. **Suspensão de 800 ms** — a única perda de controle do jogo: dois selos no jogador, HUD contável. Teto registrado em `P-70`.

## 4.20 `[PÓS]` LVL-16 — Trono do Caos

**Papel:** conclusão · **Ato IV — O Trono (fecho)** · `PAL-16` vinho · **não entrega habilidade** · `bgm=none` + `BGM-02` na luta + `BGM-04` no fim
**Escopo:** `[PÓS]` (`D-04`) — nome canônico (GDD §3.4), conteúdo não canônico. Detalhe em `niveis/LVL-16.md`.

| Sala | Tam. | Conteúdo | Inimigos |
|---|---|---|---|
| L16-01 Patamar | 20×11 | chegada de LVL-15 · a última placa de orientação | 1 |
| L16-02 A Fila | **30×11** | `CEN-112` distribuidor de senha (**`000`**) · quarenta cadeiras, seis desenhadas | 2 |
| L16-03 Antecâmara | 20×11 | `P` · **o formulário (`LOR-06`) que ensina `MEC-011`** | 0 |
| L16-04 O Posto | **24×11** | **`ENT-008` O Plantonista** · posto `CEN-111` · **`CEN-113` o desgaste** · grade | chefe |
| L16-05 Parede dos Crachás | 20×11 | `P` · `CEN-116` **40 crachás em 41 pregos** · `BGM-04` começa | 0 |
| L16-06 O Assento | 20×11 | **`CEN-114` trono partido** (`MEC-012`) · `CEN-115` varanda · **sem saída leste** | 0 |

**Totais:** 134 tiles *(o menor desde LVL-03)* · 3 inimigos + 1 chefe final · 2–4 mortes · 10–14 min · **zero plataformas** · 6 set pieces (`CEN-111`–`116`).

**Regras que este setor estabelece:**

1. **O chefe final não tem vida: tem postura.** `ENT-008` é `damageable=false`; a luta se vence **assinando três baixas** (`MEC-011`) num posto de guarda. `PAT-LD-07` ("saída só com 0 HP") não se aplica — `P-72`.
2. **`LOR-03c` nunca causa dano.** Em LVL-08 o Caos tirou **velocidade** (areia); aqui tira **piso** (`CEN-113`, 0 de dano, `DEC-011` na queda). A regra vale para os 16 setores: **o Caos tira opção, não vida**.
3. **É o único setor sem atalho de retorno** (`PAT-LD-08`): não há revisita depois do fim.
4. **Duas trilhas em sequência e nenhuma nos corredores** (§6.2 de `06-audio`): `bgm=none` → `BGM-02` na arena → `BGM-04` até o fim. `BGM-04` não toca em nenhum outro setor.
5. **As baixas assinadas não se desassinam na morte** — o oposto da revivificação de LVL-15.
6. **`PAL-16` não carrega informação:** 2,04:1 contra `--bg`. O vinho é luz sobre `--bone`, nunca HUD (ver `02-paleta` §2.2).

> 🟢 **O fim é onde o começo estava.** `DEC-005` põe o Trono acima das Ruínas da Vigília e proíbe atalho. `CEN-115` é o pagamento: a última sala mostra o setor 01 lá embaixo e **não tem escada**. O jogador vê de onde veio e não pode voltar — e a última coisa que ele faz no jogo é sentar e reclamar do assento.

## 4.90 Como especificar um setor novo (checklist do designer de level)

Todo setor, ao sair do papel para `Tiled`, precisa destes 12 campos preenchidos — sem eles o agente de level design **não** inicia:

1. `LVL-##` e nome canônico (GDD).
2. Objetivo em uma frase.
3. Duração-alvo e mortes esperadas.
4. Acento `PAL-##` e 3 materiais.
5. Sinal(ais) de ambientação (mínimo 1, §3.7).
6. Habilidade de entrada exigida e habilidade concedida.
7. Lista de salas com tamanho em tiles (múltiplos de 20×11).
8. O que a sala **ensina** (ou "nenhum").
9. Lista de `CEN-###` com comportamento.
10. Lista de `ENT-###` com quantidade.
11. Entradas e saídas com trava.
12. Teste de rastreabilidade: qual `TST-###` valida este setor.

---

[← Anterior](03-ambientacao-e-mundo.md) · [Índice](README.md) · [Próximo: 5. Animação e VFX →](05-animacao-e-vfx.md)
