# Homem Macho

> **GDD — Game Design Document**
> Versão: `0.1.0` · Data: `2026-11-04` · Status: **Rascunho**
> Autor(es): proprietário do projeto e assistente de design

![Status](https://img.shields.io/badge/status-rascunho-yellow)
![Versão](https://img.shields.io/badge/versão-0.1.0-blue)
![Plataforma](https://img.shields.io/badge/plataforma-web%20desktop%20%2B%20mobile-lightgrey)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Phaser%203%20%2B%20TypeScript-purple)

---

## Elevator Pitch

Em um mundo de fantasia sombria, um soldado iniciante explora áreas conectadas, luta contra monstros e conquista habilidades. Recupere seus equipamentos após a morte, derrote chefes e evolua até se tornar o Homem Macho mais forte de seu mundo.

## Sobre o projeto

Jogo de **ação e plataforma 2D para navegador**, com exploração não linear, progressão por habilidades, equipamentos obtidos de inimigos e desafios opcionais procedurais.

- **Gênero:** Ação/plataforma, metroidvania e elementos roguelike restritos a desafios opcionais
- **Plataforma:** Desktop web (teclado e mouse) e web mobile (touch horizontal)
- **Público pretendido:** pessoas a partir de 12 anos
- **Sessões-alvo:** 5–10 min; a campanha pode exigir várias sessões
- **Classificação indicativa prevista:** 12 anos (Brasil) — *a confirmar por avaliação do conteúdo final*

> **MVP:** recorte curto e online (LVL-01 a LVL-03), não a campanha inteira de 16 áreas. A visão completa prevê 16 áreas conectadas.

## Pilares de design

| ID | Pilar |
|---|---|
| **P1** | **Exploração com agência:** caminhos visíveis, novas possibilidades ao conquistar habilidades. |
| **P2** | **Combate legível:** ataques, ameaças e respostas claramente sinalizados. |
| **P3** | **Risco recuperável:** a morte cobra itens não presos, mas nunca habilidades de acesso. |
| **P4** | **Dark fantasy irreverente:** ambiente sombrio com humor exagerado compatível com o público pretendido. |

## Stack prevista

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript strict 5.x |
| UI | React 18+ |
| Jogo | Phaser 3.x (Arcade Physics) |
| Build | Vite |
| Testes | Vitest, Testing Library, Playwright |
| Backend | Serviço gerenciado de autenticação + banco, API HTTPS própria *[PENDENTE — fornecedor]* |
| Estilo | CSS Modules |

> Versões exatas serão fixadas no lockfile ao iniciar a implementação. Ver [07 — Arquitetura Técnica](docs/07-arquitetura-tecnica.md).

## Estrutura do repositório

```text
.
├── README.md                  # Este arquivo
└── docs/
    ├── README.md              # Índice da documentação
    ├── GDD.md                 # GDD completo (consolidado)
    ├── 01-visao-geral.md
    ├── 02-gameplay.md
    ├── 03-conteudo-do-jogo.md
    ├── 04-interface-e-experiencia.md
    ├── 05-arte-e-direcao-visual.md
    ├── 06-audio.md
    ├── 07-arquitetura-tecnica.md
    ├── 08-monetizacao-e-live-ops.md
    ├── 09-producao-e-gestao.md
    ├── 10-qualidade-testes-e-lancamento.md
    ├── 11-requisitos-consolidados.md
    ├── 12-premissas-riscos-e-perguntas-pendentes.md
    └── 13-apendices.md
```

## Documentação

O GDD está dividido em arquivos Markdown para facilitar revisão, diff e colaboração no GitHub. Comece pelo índice:

👉 **[docs/README.md — Índice do GDD](docs/README.md)**

| # | Seção | Arquivo |
|---|---|---|
| 1 | Visão Geral | [01-visao-geral.md](docs/01-visao-geral.md) |
| 2 | Gameplay | [02-gameplay.md](docs/02-gameplay.md) |
| 3 | Conteúdo do Jogo | [03-conteudo-do-jogo.md](docs/03-conteudo-do-jogo.md) |
| 4 | Interface e Experiência (UX/UI) | [04-interface-e-experiencia.md](docs/04-interface-e-experiencia.md) |
| 5 | Arte e Direção Visual | [05-arte-e-direcao-visual.md](docs/05-arte-e-direcao-visual.md) |
| 6 | Áudio | [06-audio.md](docs/06-audio.md) |
| 7 | Arquitetura Técnica (React + Phaser) | [07-arquitetura-tecnica.md](docs/07-arquitetura-tecnica.md) |
| 8 | Monetização e Live Ops | [08-monetizacao-e-live-ops.md](docs/08-monetizacao-e-live-ops.md) |
| 9 | Produção e Gestão | [09-producao-e-gestao.md](docs/09-producao-e-gestao.md) |
| 10 | Qualidade, Testes e Lançamento | [10-qualidade-testes-e-lancamento.md](docs/10-qualidade-testes-e-lancamento.md) |
| 11 | Requisitos Consolidados | [11-requisitos-consolidados.md](docs/11-requisitos-consolidados.md) |
| 12 | Premissas, Riscos Abertos e Perguntas Pendentes | [12-premissas-riscos-e-perguntas-pendentes.md](docs/12-premissas-riscos-e-perguntas-pendentes.md) |
| 13 | Apêndices | [13-apendices.md](docs/13-apendices.md) |

Documento completo consolidado: **[docs/GDD.md](docs/GDD.md)**

## Convenções do documento

| Marca | Significado |
|---|---|
| `[SUPOSIÇÃO]` | Valor ou decisão proposta, ainda não confirmada — sujeito a validação em protótipo/playtest. |
| `[PENDENTE]` | Item que precisa de decisão, pesquisa ou revisão antes da etapa indicada. |
| `[RISCO]` | Risco conhecido com mitigação proposta. |
| `MEC-###`, `REQ-F-###`, `TST-###`, `BKL-###`, `EVT-###`, `ADR-##`, `RSK-##` | IDs de rastreabilidade entre mecânicas, requisitos, tarefas e testes. Ver [11 — Requisitos Consolidados](docs/11-requisitos-consolidados.md). |

## Roadmap do MVP (resumo)

| Milestone | Semanas | Critério de saída |
|---|---|---|
| Protótipo | 1–4 | Movimento, salto duplo, combate básico e teste interno |
| Vertical Slice | 5–9 | Trecho com arte/áudio representativos, 1 inimigo e 1 chefe |
| Alpha | 10–15 | Fluxo completo do MVP, conta/save de staging, inventário e 2 línguas |
| Beta | 16–20 | Regressão, privacidade, compatibilidade e playtests |
| Release MVP | 21–24 | Checklist de lançamento aprovado e publicação segura |

> Planejamento indicativo: 24 semanas / 600 h (420 h planejadas + 180 h de reserva). Não é compromisso de prazo. Ver [09 — Produção e Gestão](docs/09-producao-e-gestao.md).

## Histórico de versões

| Versão | Data | Autor | Mudanças |
|---|---|---|---|
| 0.1.0 | 2026-11-04 | Proprietário do projeto e assistente | Primeira especificação após aprovação do Game Brief. Valores e decisões não informados são propostas identificadas. |

## Licença e direitos

Nenhum asset ou biblioteca de terceiros foi incorporado a este documento. Antes da distribuição, criar inventário de dependências e assets com autoria, versão, licença, fonte, atribuição e evidência de permissão comercial — incluindo ferramentas de IA e seus termos. Ver [13 — Apêndices](docs/13-apendices.md).

---

*Este repositório contém apenas documentação de design nesta etapa. Código, assets e infraestrutura serão adicionados conforme os milestones do GDD.*
