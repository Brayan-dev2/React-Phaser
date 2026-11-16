# 7. Padrões de Level Design

> [← Anterior: 6. Áudio e Ambiência](06-audio-e-ambiencia.md) · [Próximo: 8. Padrões de Código →](08-padroes-de-codigo.md)

> Padrões reutilizáveis de construção de sala. Cada um é verificável e tem critério de aceite.

## 7.1 Grade e unidades

`[SUPOSIÇÃO]` Derivado do GDD 5.3 e 2.5.

| Unidade | Valor | Nota |
|---|---|---|
| Tile | 64 × 64 px | GDD 5.3 |
| Tela lógica | 1280 × 704 px | 720 − 16 px de margem de HUD |
| **Sala padrão** | **20 × 11 tiles** | múltiplo exato da tela; sem rolagem |
| Sala larga | 30×11 / 40×11 | rolagem horizontal, câmera com *follow* |
| Arena de chefe | 24 × 11 | `PAT-LD-07` |
| Altura de leitura | 3 tiles do chão | nada importante acima disso sem indicação |
| Corredor mínimo | 3 tiles de altura | herói tem 2 tiles |
| **Alçapão no teto** | 2 tiles de largura em `y=0` | `DEC-015` — passagem vertical; 6 tiles acima do piso |

**Regra:** toda sala tem dimensão múltipla de 20×11. Isso permite composição modular em `Tiled` e câmera previsível por sala.

## 7.2 `PAT-LD-01` — Sala de câmera única

Uma sala = uma tela = uma ideia. Se a sala precisa de rolagem, ela tem **duas ideias** e deve ser dividida.

- Aceite: o jogador entra, entende o objetivo em ≤ 3 s, e a câmera não se move.
- Exceção: salas de percurso (30/40 tiles) têm **um** objetivo de travessia só.

## 7.3 `PAT-LD-02` — Ensino em quatro tempos

Estrutura obrigatória de qualquer mecânica nova (GDD 2.9):

| Tempo | O que acontece | Exemplo (salto duplo) |
|---|---|---|
| 1. **Introduzir** | a mecânica aparece isolada e segura | plataforma a 3 tiles, sem perigo embaixo |
| 2. **Praticar** | repetição sem consequência | 3 plataformas em série |
| 3. **Combinar** | mecânica + mecânica antiga | salto duplo sobre armadilha |
| 4. **Testar** | consequência real | salto duplo sobre vão com morte |

Nunca pule do 1 para o 4. Nunca coloque "testar" na mesma sala de "introduzir".

## 7.4 `PAT-LD-03` — Porta visível antes da chave

Toda trava por habilidade tem **3 exposições** antes de ser resolvida:

1. O jogador **vê** o obstáculo (não alcança).
2. O jogador **entende** que é um obstáculo (não é decoração) — sinal visual distinto.
3. O jogador **reconhece** a solução ao obtê-la — feedback no momento da habilidade, não só na porta.

- Aceite: a ≤ 5 s de caminhada da rota principal, e visível de pelo menos 1 ponto de passagem.
- Anti-padrão: trava escondida em sala opcional sem pista — o jogador não sabe que existe.

## 7.5 `PAT-LD-04` — Respiro pós-clímax

Após todo chefe e toda sala de "testar", 6 s de sala sem perigo: sem inimigo, sem armadilha, com recompensa e salvamento. Serve para o corpo do jogador desacelerar.

## 7.6 `PAT-LD-05` — Checkpoint em transição, nunca em sala de desafio

Alinhado ao GDD `MEC-007`: salva ao atravessar transição elegível e ao usar o quarto seguro. Salas de desafio **não** têm checkpoint. Isso é o que dá peso à morte sem punir com repetição longa.

## 7.7 `PAT-LD-06` — Rota crítica independente de item não preso

`[MVP]` **Regra dura do Pilar P3.** A rota de LVL-01 → LVL-03 deve ser concluível com o kit básico, **sem** nenhum drop. Teste: `TST-013` com inventário vazio e bolsa perdida.

- Aceite: script de teste percorre a rota crítica com inventário limpo e conclui.
- Anti-padrão: porta que exige um item dropável (cria *soft lock*).

## 7.8 `PAT-LD-07` — Arena de chefe

| Regra | Valor |
|---|---|
| Tamanho | 24×11 tiles, piso contínuo |
| **Piso (exceção)** | **LVL-16**: o piso é destrutível (`CEN-113`) — **nunca 3 buracos contíguos** (192 px < 224 px do salto andando), e **queda com `damage=0`** (`DEC-011`) |
| Queda | nenhuma possível — **exceto LVL-16**, onde a queda devolve à entrada sem dano |
| Coletáveis durante a luta | nenhum |
| Cobertura | no máx. 2 elementos quebráveis |
| Entrada | hold 400 ms + nome + fala (`VIS-007`) |
| Saída | só após 0 HP processado 1× (`MEC-009`) |
| **Saída (exceção)** | **LVL-16**: o chefe final **não tem HP** — a grade abre na **3ª baixa** (`MEC-011`). Ver `P-72` |
| **Corpos** | 1 entidade; **LVL-15 usa 2 corpos** (registrado em `P-69`) |
| Oferta de dificuldade | após 3 mortes no mesmo trecho (`MEC-008`) |

## 7.9 `PAT-LD-08` — Atalho de retorno

Todo setor com 4+ salas tem um atalho que conecta o fim ao início. Reduz o custo de revisita — essencial em metroidvania com mapa de 16 setores.

`[DECIDIDO — 2026-11-13, ao fechar P-37 e P-45]` Há **duas implementações válidas**, e o setor escolhe pela materialidade:

| Forma | Como funciona | Onde | Trava |
|---|---|---|---|
| **(a) Máquina** | duas paradas, nos **dois** sentidos | `LVL-05` elevador · `LVL-08` monta-carga | destravada ao concluir |
| **(b) Queda de mão única** | passagem orgânica que só existe no **fim** do setor e termina em queda | `LVL-04` sumidouro · `LVL-07` trifório | **nenhuma** — destravada por posição |

**Regra:** uma passagem de **mão única** nunca pode ser usada para pular conteúdo, que é a única razão de a trava existir. Por isso ela não precisa de flag. Uma passagem de **dois sentidos** precisa, porque sem trava ela permitiria sair do fim e voltar ao início antes de terminar o setor.

> **Não coloquei máquina em floresta nem elevador em catedral.** O atalho é uma peça de cenário antes de ser uma conveniência de interface: se ele não pertence ao lugar, ele quebra o lugar.

### Forma (c) — porta de serviço

`[DECIDIDO — 2026-11-13, ao fechar LVL-15]`

Uma **porta de serviço**: transição bidirecional por `interact`, **sem veículo e sem altura**. É a forma mais barata das três e a única que serve a um setor plano.

| Forma | Como funciona | Onde |
|---|---|---|
| (a) **máquina** | duas paradas, nos dois sentidos; trava liberada ao concluir | LVL-05 elevador · LVL-08 monta-carga · LVL-14 monta-carga |
| (b) **queda de mão única** | passagem orgânica no fim do setor; sem trava | LVL-04 sumidouro · LVL-07 trifório · LVL-09 `V` · LVL-10 corda · LVL-11 conduto · LVL-12 calha · LVL-13 corrente A |
| **(c) porta de serviço** | **`interact`, dois sentidos, sem veículo, sem altura** | **LVL-15 `CEN-106`** |

> **Corolário:** um setor plano (sem desnível) só tem a forma (c) disponível. E num corredor de portas lacradas, a única porta que abre é a de serviço — o atalho passa a ser **a resposta temática** do setor, não só uma conveniência.

> **Exceção declarada — LVL-16 não tem atalho.** O padrão existe para pagar o custo de **revisitar**; o setor final não tem revisita (`MEC-012` encerra o jogo e a parede leste de L16-06 é sólida). A última porta do jogo que ainda dá para trás é a **porta de serviço de L15-06** — ou seja, o único atalho do Ato IV está no penúltimo setor, e não no último.

## 7.10 `PAT-LD-09` — Verticalidade calibrada

Usa a tabela de alcance (`04-setores` §4.3). Regra única:

> Se a altura do obstáculo é **ambígua** (parece alcançável e não é), o design está errado. Ambiguidade custa tentativa, e tentativa frustrada custa confiança.

Solução: toda plataforma-alvo tem um marcador (`--gold`, 1 tile) na borda superior.

> **A régua vertical não vale para a horizontal.** Altura e distância são medidas diferentes, e a segunda tem tabela própria:

| Alcance horizontal | px | tiles | Exige |
|---|---:|---:|---|
| salto simples correndo | 313 | 4,9 | nada |
| salto duplo correndo | **534** | **8,3** | `HAB-01` |
| gancho (argola a ≤ 6 tiles) | 512 | 8,0 | `HAB-04` |
| **planeio + salto duplo** | **1.042** | **16,3** | `HAB-07` |

> **Corolário para vãos:** **nenhuma plataforma sobre um vão**, e nenhum vão entre **9 e 10 tiles** (zona morta em que o salto duplo correndo chega perto demais). A faixa utilizável de `HAB-07` é **11 a 15 tiles**. Ver `niveis/LVL-11.md` §8.

> **Extensão por `DEC-015`:** **nenhuma plataforma pode existir sob um alçapão.** Uma plataforma a 4 tiles do piso põe o alçapão a 2 tiles dela, e o salto duplo alcança — a trava deixa de existir. O alçapão só é trava porque o chão é o único lugar de onde se tenta.

## 7.11 `PAT-LD-10` — Densidade de inimigos

| Tipo de sala | Inimigos | Nota |
|---|---|---|
| Ensino (tempo 1–2) | 0–1 | nunca dois ao mesmo tempo |
| Prática | 1–2 | espaçados ≥ 6 tiles |
| Combinação | 2–3 | nunca encurralar |
| Teste | 2 + armadilha | máximo do MVP |
| Respiro | 0 | `PAT-LD-04` |
| Arena | 1 chefe | — |

## 7.12 Template de sala (copiar para o `.tmj`)

```
ID:        L__-__
Tamanho:   20 x 11 tiles
Função:    [ensino | prática | combinação | teste | respiro | arena | travessia]
Ensina:    [MEC-### | nenhum]
Entradas:  [esquerda/direita/topo/baixo + trava]
Saídas:    [esquerda/direita/topo/baixo + trava]
Inimigos:  [ENT-### x N]
Set piece: [CEN-### + comportamento]
Coletável: [ITM-### | nenhum]
Pista/placa: [texto ≤ 25 palavras | nenhuma]
Camadas:   ground | collision | objects | decor
Aceite:    [o que o jogador deve saber/sentir ao sair]
```

## 7.13 Camadas do tilemap (GDD 3.5)

| Camada | Conteúdo | Colisão |
|---|---|---|
| `ground` | piso e paredes visíveis | não |
| `collision` | retângulos de colisão, invisível | **sim** |
| `objects` | entidades, spawns, portas, checkpoints | por objeto |
| `decor` | props sem colisão, atrás ou à frente | não |

Regra: `collision` nunca coincide visualmente com `ground` por acidente — desalinhamento de colisão é o bug de plataforma nº 1.

## 7.14 Checklist de aprovação de sala

- [ ] Dimensão múltipla de 20×11
- [ ] Objetivo compreensível em ≤ 3 s
- [ ] Respeita a tabela de alcance (§4.3)
- [ ] Se ensina: segue `PAT-LD-02` nos 4 tempos
- [ ] Se trava: segue `PAT-LD-03` (3 exposições)
- [ ] Rota crítica funciona com inventário vazio (`PAT-LD-06`)
- [ ] Densidade de inimigos conforme `PAT-LD-10`
- [ ] `collision` alinhada ao `ground`
- [ ] Nenhuma ameaça fora da tela sem indicação
- [ ] Paleta com no máximo 1 acento (`VIS-004`)
- [ ] Teste `TST-###` associado registrado

## 7.15 `PAT-LD-11` — Setor final

`[DECIDIDO — 2026-11-13, ao fechar LVL-16]` *(numeração nova no fim do capítulo para não renumerar `§7.12`–`§7.14`, referenciados por 16 documentos)*

O último setor de um metroidvania não é um setor: é a **resposta** do jogo. Ele tem regras próprias, e nenhuma delas é "faça maior".

| Regra | LVL-16 | Por quê |
|---|---|---|
| **Nada novo é ensinado** | nenhuma mecânica de travessia, nenhuma habilidade | o kit fechou em LVL-11; o fim **cobra**, não ensina |
| **O chefe não é mais forte — é outro tipo de problema** | postura, 3 baixas, `damageable=false` | um sexto chefe com mais vida seria o primeiro chefe de novo |
| **A vitória não usa o vocabulário do jogo** | uma tecla (`MEC-012`), sem minigame e sem estado de falha | o jogador já provou tudo que o jogo pedia; o último ato não pode ser um teste |
| **Nenhuma saída para leste** | parede sólida em L16-06 | a única sala do mapa que não é corredor |
| **O último texto não é um aviso** | um crachá (`LOR-05`) | o jogo não tem mais o que afixar: tem o que **preencher** |
| **O áudio desliga por ação do jogador** | `AMB-16` para em `MEC-012` | a única recompensa sonora do jogo é o silêncio de uma vaga fechada |
| **Sem atalho, sem `newGamePlus`** | `PAT-LD-08` não se aplica | não há revisita |

- **Aceite:** o jogador termina o setor **sem aprender nada** e com a sensação de ter entendido o jogo inteiro. Se o setor final ensina uma mecânica nova, ele é um setor a mais — não um fim.
- **Anti-padrão:** chefão com três fases e mais vida que os anteriores. Vida é a única moeda que o jogador já sabe gastar; gastá-la no fim não diz nada.

> **Corolário de escopo:** o setor final é o **mais barato** de arte e o **mais caro** de escrita. LVL-16 tem 134 tiles (o menor desde LVL-03), 3 inimigos, 6 set pieces — e cinco textos que precisam estar certos (§4 e §7 de `niveis/LVL-16.md`).

---

[← Anterior](06-audio-e-ambiencia.md) · [Índice](README.md) · [Próximo: 8. Padrões de Código →](08-padroes-de-codigo.md)
