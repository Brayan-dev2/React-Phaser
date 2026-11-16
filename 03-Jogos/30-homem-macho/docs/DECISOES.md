# Registro de Decisões — Homem Macho

> Versão: `0.1.0` · Data: `2026-11-13` · Autor único: `AGT-08`
> Toda decisão aqui é vinculante. `[SUPOSIÇÃO]` só se torna decisão passando por este arquivo.

| ID | Data | Decisão | Quem decidiu | Alternativa descartada | IDs afetados |
|---|---|---|---|---|---|
| `DEC-001` | 2026-11-13 | **Direção de arte aprovada:** cartoon 2D *old school* (animação limitada, sombra chapada, traço de tinta) com gramática visual de mangá dramático (pose de atitude, holds, enquadramento de impacto, contraste alto). | Proprietário | Pixel art; 3D; realismo | `VIS-001`–`VIS-010`, `AST-001`–`008` |
| `DEC-002` | 2026-11-13 | **Inspiração sem cópia:** a referência de mangá dramático é usada apenas como *gramática* de quadrinhos. Proibido reproduzir personagem, marca, símbolo, logo, traço de autor, onomatopeia japonesa ou qualquer elemento identificável de obra existente. | Proprietário | "estilo parecido com" (risco de PI) | `VIS-009`, `RSK-07` |
| `DEC-003` | 2026-11-13 | **Documentação em duas camadas:** o GDD define *o que* o jogo é; `docs/design-patterns/` define *com que linguagem* ele é construído. GDD prevalece em conflito. | Proprietário | tudo no GDD; tudo em wikis separadas | `docs/design-patterns/*` |
| `DEC-004` | 2026-11-13 | **Agentes com escopo fechado:** nenhum agente de IA decide design; toda decisão precisa citar um ID (`MEC-`, `VIS-`, `PAT-`, `CEN-`, `TST-`). Sem ID, vira pendência. | Proprietário | agentes com liberdade criativa | `agents-ia/*` |
| `DEC-005` | 2026-11-13 | **Mapa do mundo em circuito em serpentina:** os 16 setores formam um circuito; o Trono do Caos fica acima das Ruínas da Vigília e **não** tem atalho a partir do início. | `AGT-02` | hub-and-spoke; mundo aberto | `LVL-01`–`16` |
| `DEC-006` | 2026-11-13 | **Sala padrão = 20×11 tiles** (uma tela lógica, sem rolagem). Todas as salas são múltiplas dessa grade. | `AGT-02` | salas de tamanho livre | `PAT-LD-01`, `CEN-*` |
| `DEC-007` | 2026-11-13 | **Convenção vertical de sala:** topo do piso sempre em `y=7`; toda abertura de passagem tem **3 tiles de altura** (`y=4–6`). Elimina a classe de bug "porta em altura incompatível" entre salas. | `AGT-02` | alturas variáveis por porta | `LVL-01`, `PAT-LD-01` |
| `DEC-008` | 2026-11-13 | **LVL-01 é config-agnóstico:** nenhum obstáculo do setor exige `HAB-01`, e todos os desníveis são de 1 tile. A decisão `P-15` (config A ou B) fica livre até LVL-02. | `AGT-02` | adiar o tutorial de salto duplo para LVL-01 | `LVL-01`, `P-15` |
| `DEC-009` | 2026-11-13 | **Gate do salto duplo é vertical, de 3 tiles.** Gates horizontais são inválidos porque a corrida (1,4×) os atravessa: na config B, um jogador correndo cruza 4 tiles com **um** salto. O gate vertical é imune à corrida. | `AGT-02` | vão horizontal de 4 tiles (quebrado pela corrida); vão + desnível (quebra em B correndo, inviável em A andando) | `LVL-02`, `MEC-001`, `P-15` |
| `DEC-010` | 2026-11-13 | **`HAB-01` é obtido antes de ser usado, nunca depois:** o fragmento de LVL-02 vem **antes** da rota alta. Nenhuma trava pode exigir a habilidade que ela própria concede. | `AGT-02` | fragmento após a rota lateral (dependência circular) | `LVL-02`, `MEC-005` |
| `DEC-011` | 2026-11-13 | **Queda em vão não mata:** em vãos de travessia, o jogador reaparece na entrada da sala, sem dano, com fade de 300 ms. | `AGT-02` | morte por queda (`MEC-004`), o que puniria o aprendizado do salto duplo | `LVL-02`, `PAT-LD-06` |
| `DEC-012` | 2026-11-13 | **A transição para arena de chefe é checkpoint.** O jogador revive na entrada da arena, com o chefe resetado e vida cheia. Sem isso, cada morte custa a re-traversia do corredor e `MEC-008` (3 mortes "no mesmo trecho") fica sem escopo. | `AGT-02` | respawn no último checkpoint externo (runback de ~20 s por morte) | `LVL-03`, `MEC-007`, `MEC-008` |
| `DEC-013` | 2026-11-13 | **Pilares de arena têm 2 tiles de altura**, não 3. O jogador precisa pular por cima deles; 3 tiles exigem 192 px de subida, o que tem margem zero na config A. | `AGT-02` | pilar de 3 tiles (decorativo na config A) | `LVL-03`, `CEN-021`, `P-15` |
| `DEC-014` | 2026-11-13 | **A config canônica de movimento é a B:** `impulso = 560 px/s`, `gravidade = 1100 px/s²` (GDD propunha 480 / 1200). Salto simples 138 px, duplo 276 px, ambos medidos a 60 Hz. A config A é **fisicamente inalcançável** no gate de 3 tiles (192 px): a integração de Euler perde 2–16 px conforme a taxa de quadros, então o gate falha a 240, 120, 60 e 30 Hz — e falha **mais** em hardware fraco. B passa com 74–91 px de folga em todas as taxas. | `Proprietário` | config A (margem teórica de 0 px, salto impossível dependente de hardware; exigiria gate de 2 tiles, que B pularia com um salto simples — violando `DEC-008`) | `BKL-002`, `BKL-012`, `MEC-001`, `MEC-002`, `LVL-02`, `LVL-03`, `CEN-021` |
| `DEC-015` | 2026-11-13 | **Passagem vertical (alçapão no teto).** Uma sala pode ter, além das portas laterais de `DEC-007`, um alçapão em **`y=0`, 2 tiles de largura**, dois sentidos, levando à sala de cima. O alçapão fica **6 tiles (384 px)** acima do piso e o salto duplo alcança **4,3 tiles (276 px)** — é a **única trava vertical possível** neste motor, e ela não exige sala mais alta nem rolagem de câmera. Regras: **nenhuma plataforma sob o alçapão** e **parede agitável contínua do piso ao teto** | `AGT-02` | sala de 12 linhas; câmera com rolagem vertical (`P-39`); plataforma em `y=2` como alvo (folga de cabeça zero, `P-49`) | `LVL-10`, `HAB-03`, `HAB-07`, `DEC-007`, `PAT-LD-01` |
| `DEC-016` | 2026-11-13 | **Chave de chefe é contador, não item.** Todo `MEC-009` bem-sucedido incrementa `keys`. O Portão Fortificado (`14 → 15`) exige **`keys ≥ 2`**; a UI exibe `keys / 2` e **não** cria slot para uma terceira. Como `03 → 04` e `08 → 09` fecham com chefe, o jogador **sempre** chega a LVL-14 com 2 — e a recompensa de LVL-12 (chefe opcional) é a **sobra** que não abre nada. Sem isso, o chefe de LVL-12 deixaria de ser opcional ou o portão daria soft lock | `AGT-02` | tratar cada recompensa de chefe como item de chave; exigir 3 chaves | `LVL-14`, `LVL-15`, `PAT-LD-06`, `P-61`, `P-47` |
| `DEC-017` | 2026-11-13 | **O chefe final não tem vida: tem postura, e a luta se vence por baixa.** `ENT-008` O Plantonista é `damageable=false`; `MEC-011` exige **quebrar a postura 3×** (100/125/150, golpe de 25 = 4/5/6 golpes) e **assinar 3 canais de 3.000 ms** no posto de guarda, dentro de atordoamentos de **4.500 ms** (300 de cambaleio + 3.000 de canal + 1.200 de folga). A grade da arena abre na **3ª baixa**, não em 0 HP; o piso é destrutível (`CEN-113`, **dano 0**, `DEC-011` na queda); **as baixas permanecem na morte** do jogador. LVL-16 é o único setor **sem atalho** e **sem saída leste**; `MEC-012` encerra o jogo. | `AGT-02` + `AGT-03` | sexto chefe com mais vida e três fases (seria o primeiro chefe de novo); matar o Plantonista (destruiria a licença do Ato IV — o quadro de LVL-15 — e a lógica de `LOR-03a`) | `PAT-LD-07`, `PAT-LD-08`, `PAT-LD-11`, `MEC-011`, `MEC-012`, `ENT-008`, `LVL-15`, `LVL-16` |
| `DEC-018` | 2026-11-13 | **`LOR-03c` O Caos nunca causa dano — ele tira opção.** Em LVL-08 o Caos é a areia e tira **velocidade**; em LVL-16 é o desgaste (`CEN-113`) e tira **piso**. Nenhuma mecânica de Caos, em nenhum setor, pode remover vida: se ela tirar vida, é armadilha; tirando opção, é relógio. Regra derivada de `LOR-03c` (*"não quer nada — é o atrito"*) e verificável em `TST-018`. | `AGT-02` | areia com dano em LVL-08 (seria só mais uma armadilha); desgaste com dano em LVL-16 (quebraria `DEC-011` e o chefe final teria duas fontes de dano) | `LOR-03c`, `CEN-113`, `LVL-08`, `LVL-16`, `DEC-011` |

---

## Modelo para novas decisões

| Campo | Conteúdo |
|---|---|
| ID | `DEC-###` sequencial |
| Data | `AAAA-MM-DD` |
| Decisão | uma frase afirmativa, no passado |
| Quem decidiu | pessoa (nunca "o agente") |
| Alternativa descartada | e por que |
| IDs afetados | `MEC-`, `REQ-`, `BKL-`, `TST-`, `VIS-`, `PAT-`… |
| Consequência | o que passa a ser obrigatório, e o que fica proibido |

## Decisões que ainda faltam (ver `PENDENCIAS.md`)

`P-14` backend no MVP · `P-16` pipeline de arte · `P-19` licença · `P-21` corrida consumindo poder · `P-22` moeda sem sumidouro · `P-24` tamanho do inventário.
