# Documentação — Homem Macho (GDD)

> Versão: `0.1.0` · Data: `2026-11-04` · Status: **Rascunho**
> Autor(es): proprietário do projeto e assistente de design

Este diretório reúne o **Game Design Document (GDD)** do *Homem Macho*, dividido em arquivos Markdown por seção para facilitar leitura, revisão e colaboração no GitHub.

- **Documento completo consolidado:** [GDD.md](GDD.md)
- **README do projeto:** [../README.md](../README.md)

---

## Índice

| # | Seção | Arquivo | Conteúdo em destaque |
|---|---|---|---|
| 1 | [Visão Geral](01-visao-geral.md) | `01-visao-geral.md` | Pitch, conceito, pilares, escopo MoSCoW |
| 2 | [Gameplay](02-gameplay.md) | `02-gameplay.md` | Core loop, mecânicas MEC-001–010, balanceamento |
| 3 | [Conteúdo do Jogo](03-conteudo-do-jogo.md) | `03-conteudo-do-jogo.md` | Personagem, inimigos, itens, 16 áreas (LVL-01–16) |
| 4 | [Interface e Experiência (UX/UI)](04-interface-e-experiencia.md) | `04-interface-e-experiencia.md` | Fluxo de telas, HUD, acessibilidade, i18n |
| 5 | [Arte e Direção Visual](05-arte-e-direcao-visual.md) | `05-arte-e-direcao-visual.md` | Estilo, paleta, assets AST-001–008 |
| 6 | [Áudio](06-audio.md) | `06-audio.md` | SFX/BGM, mixagem, licenças |
| 7 | [Arquitetura Técnica (React + Phaser)](07-arquitetura-tecnica.md) | `07-arquitetura-tecnica.md` | EventBus EVT-001–009, save, backend, ADRs |
| 8 | [Monetização e Live Ops](08-monetizacao-e-live-ops.md) | `08-monetizacao-e-live-ops.md` | Cosméticos, Manch's (pós-MVP), ética |
| 9 | [Produção e Gestão](09-producao-e-gestao.md) | `09-producao-e-gestao.md` | Roadmap, backlog BKL-001–017, riscos RSK-01–08 |
| 10 | [Qualidade, Testes e Lançamento](10-qualidade-testes-e-lancamento.md) | `10-qualidade-testes-e-lancamento.md` | Casos TST-001–017, playtest, checklist |
| 11 | [Requisitos Consolidados](11-requisitos-consolidados.md) | `11-requisitos-consolidados.md` | REQ-F / REQ-NF e matriz de rastreabilidade |
| 12 | [Premissas, Riscos Abertos e Perguntas Pendentes](12-premissas-riscos-e-perguntas-pendentes.md) | `12-premissas-riscos-e-perguntas-pendentes.md` | Itens P-01–P-13 |
| 13 | [Apêndices](13-apendices.md) | `13-apendices.md` | Glossário, referências, auditoria do GDD |

## Como ler

1. Comece por [01 — Visão Geral](01-visao-geral.md) e [02 — Gameplay](02-gameplay.md) para entender o jogo.
2. Consulte [11 — Requisitos Consolidados](11-requisitos-consolidados.md) para a visão rastreável (mecânica ↔ requisito ↔ tarefa ↔ teste).
3. Verifique [12 — Premissas e Perguntas Pendentes](12-premissas-riscos-e-perguntas-pendentes.md) antes de tratar qualquer `[SUPOSIÇÃO]` como decisão final.

## Convenções

| Marca | Significado |
|---|---|
| `[SUPOSIÇÃO]` | Proposta ainda não confirmada; validar em protótipo/playtest. |
| `[PENDENTE]` | Decisão, pesquisa ou revisão necessária antes da etapa indicada. |
| `[RISCO]` | Risco conhecido com mitigação proposta. |

IDs utilizados: `MEC-###` (mecânicas), `ENT-###` (entidades), `ITM-###` (itens), `LVL-##` (áreas), `UI-##` (telas), `AST-###` (assets), `SFX-###`/`BGM-##` (áudio), `EVT-###` (eventos), `ADR-##` (decisões), `REQ-F-###`/`REQ-NF-###` (requisitos), `BKL-###` (backlog), `TST-###` (testes), `RSK-##` (riscos), `P-##` (premissas/pendências).

## Histórico de versões

| Versão | Data | Autor | Mudanças |
|---|---|---|---|
| 0.1.0 | 2026-11-04 | Proprietário do projeto e assistente | Primeira especificação após aprovação do Game Brief. Valores e decisões não informados são propostas identificadas. |
