# Design Patterns — Homem Macho

> Versão: `0.2.0` · Data: `2026-11-13` · Status: **Rascunho**
> Escopo: direção de arte, ambientação, cenários, padrões de level design e padrões de código.

Esta pasta complementa o [GDD](../README.md) e **não o substitui**. O GDD define *o que* o jogo é; aqui definimos *com que linguagem* ele é desenhado, construído e testado — e é destes arquivos que os agentes em [`agents-ia/`](../../agents-ia/) extraem contexto.

## Por que uma pasta separada

O GDD `05-arte-e-direcao-visual.md` diz o essencial em 38 linhas (estilo, paleta, resolução, lista `AST-`). Isso é suficiente para decidir, mas insuficiente para **produzir de forma consistente**. Uma equipe de agentes de IA sem uma referência densa vai inventar estilo a cada tarefa. Este conjunto de documentos é o *contrato visual e técnico* que impede essa deriva.

## Índice

| # | Documento | Conteúdo | IDs |
|---|---|---|---|
| 01 | [Estilo e Identidade Visual](01-estilo-e-identidade-visual.md) | Old school 2D, dramaturgia de pose, traço, sombra, enquadramento, anti-regras | `VIS-###` |
| 02 | [Paleta, Tipografia e UI](02-paleta-tipografia-e-ui.md) | Paleta global, acento por setor, tipografia, ícones, HUD | `PAL-##` |
| 03 | [Ambientação e Mundo](03-ambientacao-e-mundo.md) | Cosmologia, facções, tom, humor, glossário, arco narrativo | `LOR-##` |
| 04 | [Setores e Cenários](04-setores-e-cenarios.md) | 16 setores, mapa, conexões, set pieces, deep dive LVL-01–03 | `LVL-##`, `CEN-###` |
| 05 | [Animação e VFX](05-animacao-e-vfx.md) | Animação limitada, holds dramáticos, telegraph, onomatopeia, juice, limites | `VFX-###` |
| 06 | [Áudio e Ambiência](06-audio-e-ambiencia.md) | Paleta sonora por setor, camadas, ducking, acessibilidade sonora | `AMB-##` |
| 07 | [Padrões de Level Design](07-padroes-de-level-design.md) | Grade de sala, gating, ensino, ritmo, template de sala | `PAT-LD-##` |
| 08 | [Padrões de Código](08-padroes-de-codigo.md) | EventBus, FSM, pooling, tuning data-driven, save saga, ciclo de cena | `PAT-C-##` |
| 🖼 | [Mapa de Setores (SVG)](assets/mapa-de-setores.svg) | Grafo visual das 16 áreas e conexões | — |
| 📐 | [Layouts de Setor](../niveis/) | Salas em grade, coordenadas, conversão para Tiled | `LVL-##` |

## Como isso se liga ao GDD

| GDD | Este conjunto |
|---|---|
| `05-arte-e-direcao-visual.md` | 01, 02, 05 |
| `03-conteudo-do-jogo.md` (§3.4, §3.5) | 03, 04, 07 |
| `06-audio.md` | 06 |
| `07-arquitetura-tecnica.md` | 08 |
| `02-gameplay.md` (§2.5 física) | 07, 08 |

Nenhuma regra aqui pode contradizer o GDD. Se contradisser, **o GDD ganha** até que a mudança seja registrada lá primeiro e replicada aqui — ver `agents-ia/08-guardiao-da-documentacao.md`.

## Convenções de marcação

As mesmas do GDD, mais duas:

| Marca | Significado |
|---|---|
| `[SUPOSIÇÃO]` | Proposta de design não validada. |
| `[PENDENTE]` | Decisão necessária antes da etapa indicada. |
| `[RISCO]` | Risco conhecido com mitigação. |
| `[MVP]` | Obrigatório no recorte LVL-01–03. |
| `[PÓS]` | Só após validação do MVP. |

## Novos IDs introduzidos

`VIS-###` princípios visuais · `PAL-##` paletas · `LOR-##` elementos de mundo · `CEN-###` cenário/set piece · `VFX-###` efeito · `AMB-##` ambiência sonora · `HAB-##` habilidade de acesso · `PAT-LD-##` padrão de level design · `PAT-C-##` padrão de código · `AGT-##` agente.

`LVL-##`, `MEC-###`, `ENT-###`, `ITM-###`, `AST-###`, `EVT-###`, `REQ-*`, `BKL-###`, `TST-###` continuam sendo as fontes de verdade do GDD e não são redefinidos aqui.

## Nota de propriedade intelectual

A direção artística é inspirada na **gramática visual de mangá dramático** (pose de atitude, tinta de alto contraste, enquadramento de impacto). Essa gramática é um conjunto de convenções de quadrinhos amplamente usadas e não é protegível em si. **Não são copiáveis**: personagens, marcas, stands, símbolos gráficos assinatura, logotipos, a onomatopeia japonesa característica, traços faciais específicos de autor ou qualquer asset de obra existente. Ver `VIS-010` e `RSK-07` do GDD.

## Histórico

| Versão | Data | Mudanças |
|---|---|---|
| 0.2.0 | 2026-11-13 | Criação: estilo, paleta, ambientação, 16 setores, VFX, áudio, level design e padrões de código. |
