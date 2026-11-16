# 3. Ambientação e Mundo

> [← Anterior: 2. Paleta, Tipografia e UI](02-paleta-tipografia-e-ui.md) · [Próximo: 4. Setores e Cenários →](04-setores-e-cenarios.md)

> Base: GDD §3.6 e Pilar **P4 — dark fantasy irreverente**. Tudo aqui é `[SUPOSIÇÃO]` de lore, a ser validado — lore é barata de mudar, mas cara de escrever duas vezes.

## 3.1 Premissa de mundo (`LOR-01`)

Uma Terra que **quebrou e continuou funcionando**. Não foi destruída por uma guerra nem por um cataclismo — foi *desgastada*, como uma roupa lavada demais. As estruturas ainda estão de pé e ainda fazem o que faziam; só ninguém lembra por quê. Monstros não invadem: eles **moram** ali, são os antigos zeladores que perderam o propósito.

O jogador é um **soldado da Vigília** — a última instituição que ainda tenta manter alguma coisa em ordem, e que na prática é um cara com uma espada e uma agenda. Ele não é o escolhido. Ele é o único que apareceu.

| Elemento | Definição |
|---|---|
| Mundo | Uma região contígua, 16 setores, todos fisicamente conectados |
| Escala | Uma cidadela/planalto cercado por tudo o que já foi território dela |
| Tempo | Passado industrial-mágico; tecnologia existe, mas quebrada |
| Tom | Sério na ambientação, **cômico no personagem** |
| Ponto de vista | 3ª pessoa lateral, sem narrador onisciente |

## 3.2 Regra de tom: sério vs. ridículo (`LOR-02`)

O humor nunca vem do mundo — vem da **reação** do Homem Macho a um mundo que não se importa com ele. Essa separação é a única coisa que mantém `P4` compatível com a classificação 12 anos.

| Camada | Tom | Exemplo |
|---|---|---|
| Ambiente (cenário, música, iluminação) | 100% sério, solene, decadente | uma catedral sem fiéis, ainda com velas acesas |
| Inimigos | solenes e absurdos ao mesmo tempo | um zelador de 3 m que ainda tenta varrer o chão |
| Homem Macho | bravateiro, exagerado, nunca "engraçadinho" | posa depois de matar um inimigo que não o ameaçava |
| Interface | neutra e legível | sem piadas em botões |

**Limites duros:** sem humor sexual, sem piada com violência real, sem quebra de "quarta parede" no MVP, sem sarcasmo dirigido ao jogador.

## 3.3 As três forças (`LOR-03`)

`[SUPOSIÇÃO]` Três facções dão coerência aos 16 setores. Nenhuma é "o exército do mal" genérico.

| ID | Facção | O que quer | Onde aparece |
|---|---|---|---|
| `LOR-03a` | **A Vigília** | restaurar a ordem por protocolo, mesmo sem ninguém para obedecer | LVL-01, 03, 10, 15 |
| `LOR-03b` | **Os Distorcidos** | continuar exercendo sua função original, distorcidamente | LVL-02, 04, 06, 09, 11 |
| `LOR-03c` | **O Caos** | não quer nada — é o atrito do mundo se desfazendo | LVL-08, 12, 14, 16 |

O jogador começa em `LOR-03a`, é atacado por `LOR-03b` e termina diante de `LOR-03c`. As chefes de área são sempre um Distorcido que ainda acredita estar trabalhando.

## 3.4 Estrutura narrativa em 4 atos (`LOR-04`)

`[SUPOSIÇÃO]` Mapeada sobre os 16 setores. O MVP cobre o Ato I inteiro.

| Ato | Setores | Pergunta dramática | Resposta ao final do ato |
|---|---|---|---|
| **I — O Turno** | LVL-01–03 | "por que ninguém mais veio?" | a Vigília está vazia há muito tempo |
| **II — A Ronda** | LVL-04–08 | "o que essas coisas ainda estão fazendo?" | estão cumprindo ordens que ninguém deu |
| **III — A Falha** | LVL-09–13 | "quem deu as ordens?" | ninguém: a ordem é a própria ruína |
| **IV — O Trono** | LVL-14–16 | "e agora, quem manda?" | ele — e é um trabalho de merda |

Arco do protagonista: de *"sou o soldado mais forte"* (bravata) para *"sou o único que apareceu"* (responsabilidade). Sem redenção, sem sacrifício, sem discurso — a última cena é ele **sentando** no trono e reclamando do assento.

## 3.5 Como a lore se entrega (sem cutscene)

`[MVP]` Nenhuma cutscene, nenhuma dublagem (GDD 3.6). Quatro veículos, todos opcionais:

| Veículo | Custo | Onde |
|---|---|---|
| **Placa / inscrição** no cenário, 1 linha | baixo | LVL-01, 02 |
| **Quadro de aviso** da Vigília, 2–3 linhas | baixo | quarto seguro de LVL-01 |
| **Fala única do chefe** ao entrar na arena | médio | LVL-03 (`VIS-007`, hold de 400 ms) |
| **Ambiente contando** (objeto que implica ação) | médio | todos |

> `[PENDENTE]` Textos de lore do MVP: 6 placas + 1 quadro + 1 fala de chefe. Orçamento: ≤ 25 palavras por placa, ≤ 90 por quadro.

Regra de escrita: **nenhuma placa explica o mundo.** Elas registram uma tarefa, um aviso de segurança ou uma reclamação burocrática. O mundo se explica pela soma.

## 3.6 Glossário do mundo

| Termo | Significado no jogo | Não confundir com |
|---|---|---|
| **Vigília** | instituição de guarda, hoje sem guardas | o ato de ficar acordado |
| **Turno** | unidade de tempo da Vigília; "primeiro turno" = era | progressão do jogador |
| **Distorcido** | ser que perdeu o propósito mas manteve a rotina | inimigo genérico |
| **Setor** | área conectada do mapa | "fase" ou "nível linear" |
| **Portão** | passagem chaveada por habilidade | a porta de senha (`MEC-006`) |
| **Bolsa** | equipamento não preso carregado | inventário preso (`MEC-004`) |
| **Manch's** | moeda paga, pós-MVP | moeda de jogo |

## 3.7 Sinais de ambientação obrigatórios por setor

Para o mundo parecer um só lugar, todo setor herda no mínimo 3 destes 8 sinais. `[MVP]` marcados.

| # | Sinal | Onde já existe |
|---|---|---|
| 1 | Marca da Vigília (sinete de guarda pintado/trancado) | `[MVP]` LVL-01, 02, 03 |
| 2 | Vela/lamparina **ainda acesa** sem ninguém | `[MVP]` LVL-01 |
| 3 | Objeto de trabalho abandonado no meio da tarefa | `[MVP]` LVL-02 |
| 4 | Raiz/ferrugem crescendo sobre metal | pós |
| 5 | Estátua com o rosto removido | pós |
| 6 | Sino/campainha quebrado | pós |
| 7 | Escada que não leva a nada | pós |
| 8 | Cadeira virada para a parede | pós |

## 3.8 Limites de conteúdo (trava de classificação)

`[MVP]` Reforço do GDD 1.8, aplicável à arte:

- Sangue: no máximo **1 acento** `--threat` e nunca em jato; impacto = faísca/poeira, não fluido.
- Corpos de inimigos derrotados: desmontam em peças/poeira, não em carne.
- Nenhuma figura humanoide com ferimento aberto visível.
- Nenhum conteúdo sexual, sugestivo ou romântico.
- Linguagem: sem palavrões no MVP; bravata sim, vulgaridade não.

---

[← Anterior](02-paleta-tipografia-e-ui.md) · [Índice](README.md) · [Próximo: 4. Setores e Cenários →](04-setores-e-cenarios.md)
