# Agentes de IA — Homem Macho

> Versão: `0.1.0` · Data: `2026-11-13` · Status: **Rascunho**
> Base de conhecimento: [GDD](../docs/README.md) · [Design Patterns](../docs/design-patterns/README.md)

Um conjunto de 9 agentes especializados que transformam a documentação existente em trabalho executável **sem inventar design por conta própria**. Cada agente tem escopo fechado, guardrails numéricos, artefatos de saída e um contrato de handoff.

## Por que agentes com escopo fechado

O risco de usar IA num projeto solo não é ela escrever código ruim — é ela **escrever um jogo diferente do documentado**, tarefa por tarefa, até o projeto ter três estilos de arte e duas regras de dano. Estes arquivos existem para tornar isso impossível: cada agente é obrigado a citar o ID (`MEC-`, `VIS-`, `PAT-`, `TST-`) que autoriza a decisão. Sem ID, a decisão não existe.

## Os agentes

| ID | Agente | Arquivo | Fase principal |
|---|---|---|---|
| `AGT-00` | **Orquestrador** | [00-orquestrador.md](00-orquestrador.md) | todas |
| `AGT-01` | **Diretor de Arte** | [01-diretor-de-arte.md](01-diretor-de-arte.md) | 0, 2+ |
| `AGT-02` | **Designer de Level** | [02-designer-de-level.md](02-designer-de-level.md) | 0, 2+ |
| `AGT-03` | **Engenheiro de Gameplay** | [03-engenheiro-de-gameplay.md](03-engenheiro-de-gameplay.md) | 1+ |
| `AGT-04` | **Arquiteto Frontend** | [04-arquiteto-frontend.md](04-arquiteto-frontend.md) | 1+ |
| `AGT-05` | **UI/UX e Acessibilidade** | [05-ui-ux-e-acessibilidade.md](05-ui-ux-e-acessibilidade.md) | 1+ |
| `AGT-06` | **Backend e Save** | [06-backend-e-save.md](06-backend-e-save.md) | 2+ |
| `AGT-07` | **QA e Testes** | [07-qa-e-testes.md](07-qa-e-testes.md) | 1+ |
| `AGT-08` | **Guardião da Documentação** | [08-guardiao-da-documentacao.md](08-guardiao-da-documentacao.md) | todas |

## Pipeline (ordem obrigatória)

```
FASE 0 — DOCUMENTAÇÃO            AGT-08 → AGT-01 → AGT-02          ← você está aqui
FASE 1 — PROTÓTIPO CINZA         AGT-04 → AGT-03 → AGT-07
FASE 2 — VERTICAL SLICE          AGT-01 + 02 + 05 + 06 + 03
FASE 3 — ALPHA / BETA            todos
FASE 4 — RELEASE                 AGT-07 + AGT-08
```

**Nenhum agente começa a fase N+1 sem o critério de saída da fase N** (GDD 9.2).

| Fase | Critério de saída | Bloqueia |
|---|---|---|
| 0 | Documentos de arte, setores e padrões revisados; 12 campos de setor preenchidos para LVL-01–03 | tudo |
| 1 | Movimento + salto duplo + combate em caixas cinzas; `TST-001`, `TST-002`, `TST-011` verdes; decisão de game feel tomada | arte final |
| 2 | LVL-01–03 com arte e áudio representativos; fluxo completo; playtest de 5 pessoas | Alpha |
| 3 | Sem defeitos bloqueantes; matriz de dispositivos coberta | release |
| 4 | Checklist GDD 10.5 aprovado | publicação |

## Protocolo de tarefa (vale para todos os agentes)

Toda tarefa entra no formato de [`templates/tarefa.md`](templates/tarefa.md) e sai no formato de [`templates/relatorio-de-tarefa.md`](templates/relatorio-de-tarefa.md).

1. **Ler antes de escrever.** O agente lê os documentos listados em "Contexto obrigatório" do seu arquivo. Não opcional.
2. **Citar o ID.** Toda decisão técnica ou visual referencia `MEC-`, `VIS-`, `PAL-`, `PAT-`, `CEN-`, `AMB-`, `TST-` do GDD/design-patterns.
3. **Uma tarefa, um `BKL-###`.** Sem escopo expansivo.
4. **Parar em caso de conflito.** Se a documentação não cobre o caso, o agente **não improvisa**: registra em `docs/PENDENCIAS.md` e devolve ao `AGT-08`.
5. **Sem número mágico.** Todo valor numérico sai de `src/game/data/` (`PAT-C-04`).
6. **Toda entrega tem teste.** `BKL-###` sem `TST-###` associado é devolvida.
7. **Nunca copiar obra existente.** Ver "Regra de PI" abaixo.

## Regra de PI (inegociável)

Todo agente, ao produzir arte, texto ou código:

- ❌ Não reproduz personagens, marcas, símbolos, stands, logotipos, onomatopeias japonesas ou traços assinatura de autor de obra existente.
- ❌ Não usa assets de terceiros sem autor, licença e data registrados no inventário do apêndice C.
- ✅ Registra cada asset com: autor, ferramenta (incl. IA), licença, fonte, data.
- ✅ Prefere asset genérico comprado/licenciado a "parecido com".

## Como usar estes agentes

### Claude Code / agentes por subagent
Cada arquivo tem frontmatter compatível com *subagents*. Copie os arquivos `.md` para `.claude/agents/` na raiz do projeto — o nome do subagente vem do campo `name`.

```bash
mkdir -p .claude/agents && cp agents-ia/0*.md .claude/agents/
```

### Ferramenta com system prompt (ChatGPT, Gemini, Claude web, Cursor)
Copie o bloco **"Prompt operacional"** ao final do arquivo do agente. Ele é autossuficiente e inclui a lista de documentos a anexar.

### Fluxo recomendado
1. Abra sessão com o `AGT-00` e informe o `BKL-###` da vez.
2. O Orquestrador decide qual especialista executa e devolve a tarefa formatada.
3. Troque para o especialista, execute, e pede o relatório no template.
4. Feche com o `AGT-08` para atualizar a documentação e o rastreio.

## Arquivos de estado

Estes dois arquivos são o "cérebro" compartilhado. Mantenha-os atualizados ou os agentes perdem contexto:

| Arquivo | Quem escreve | Conteúdo |
|---|---|---|
| `docs/PENDENCIAS.md` | qualquer agente, revisado por `AGT-08` | dúvidas abertas, com ID, dono e bloqueia-o-quê |
| `docs/DECISOES.md` | `AGT-08` | decisões tomadas, data, impacto, IDs afetados |

`[PENDENTE]` Criar os dois na próxima tarefa (`BKL-001`).

## Convenção de nomes dos agentes

`AGT-##` + nome em kebab-case no frontmatter. Nunca criar agente novo sem registrar aqui e em `docs/DECISOES.md` — agentes duplicados com escopos sobrepostos são a principal causa de trabalho contraditório.

## Histórico

| Versão | Data | Mudanças |
|---|---|---|
| 0.1.0 | 2026-11-13 | Criação dos 9 agentes, pipeline e protocolo de tarefa. |
