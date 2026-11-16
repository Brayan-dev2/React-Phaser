# Como integrar no repositório `homem-macho`

> Gerado em 2026-11-13. Estes arquivos são **novos** — o GDD existente não foi copiado nem alterado.

## O que copiar para a raiz do repo

```
homem-macho/
├── docs/
│   ├── design-patterns/     → cole em docs/design-patterns/
│   ├── niveis/              → cole em docs/niveis/
│   ├── PENDENCIAS.md        → cole em docs/PENDENCIAS.md
│   └── DECISOES.md          → cole em docs/DECISOES.md
└── agents-ia/               → cole na raiz como agents-ia/
```

Opcional, para usar os agentes como *subagents* de ferramenta de código:

```bash
mkdir -p .claude/agents && cp agents-ia/0*.md .claude/agents/
```

## Patch sugerido em `docs/README.md`

Adicione ao índice existente:

```markdown
| ➕ | [Design Patterns](design-patterns/README.md) | `design-patterns/` | Estilo, ambientação, 16 setores, level design e padrões de código |
| ➕ | [Pendências Abertas](PENDENCIAS.md) | `PENDENCIAS.md` | Itens que bloqueiam o caminho crítico |
| ➕ | [Registro de Decisões](DECISOES.md) | `DECISOES.md` | Decisões vinculantes com ID e consequência |
```

## Patch sugerido no `README.md` da raiz

```markdown
| Agentes | [agents-ia/README.md](agents-ia/README.md) |
```

## Conteúdo

| Pasta | Arquivos | O que resolve |
|---|---|---|
| `docs/design-patterns/` | 8 documentos + 1 SVG + 1 prancha | Como o jogo é desenhado, ambientado e construído |
| `docs/niveis/` | `LVL-01.md`–`LVL-03.md` (**MVP**) + `LVL-04.md`–`LVL-16.md` (`[PÓS]`) — **os 16 setores** | Layout sala por sala, grade, coordenadas, combate e conversão para Tiled |
| `agents-ia/` | 9 agentes + 2 templates | Quem executa, com que escopo e com que guardrails |
| `docs/decisoes/` | `P-15-tuning-de-movimento.md` | **Como** cada decisão de game feel foi medida e por que venceu |
| `ferramentas/` | `comparador-de-salto.html` | Prova jogável do tuning: compare A e B com os gates reais do MVP |

## Ordem de leitura recomendada

1. [`docs/design-patterns/README.md`](docs/design-patterns/README.md) — o mapa
2. [`docs/design-patterns/01-estilo-e-identidade-visual.md`](docs/design-patterns/01-estilo-e-identidade-visual.md) — a bíblia visual
3. [`docs/design-patterns/04-setores-e-cenarios.md`](docs/design-patterns/04-setores-e-cenarios.md) — os 16 setores
4. [`docs/niveis/LVL-01.md`](docs/niveis/LVL-01.md) , [`LVL-02.md`](docs/niveis/LVL-02.md) e [`LVL-03.md`](docs/niveis/LVL-03.md) — o MVP inteiro em layout
5. [`docs/niveis/LVL-04.md`](docs/niveis/LVL-04.md) a [`LVL-08.md`](docs/niveis/LVL-08.md) — Ato II em **esboço `[PÓS]`** (não codar ainda). LVL-05 entrega `HAB-05`, LVL-06 entrega `HAB-06`, LVL-07 é o setor sem trava, e LVL-08 é o pico do Ato II: arena aberta, chefe médio `ENT-004` e a trava por corpo. `LVL-09` entrega `HAB-04` Gancho, é o único setor sem uma única plataforma, e documenta o limite que vale para todos: **o salto duplo alcança toda plataforma que cabe na grade**, então verticalidade nunca pode ser trava `LVL-10` é o hub do mundo e o **setor que destrava o Ato III**: entrega `HAB-03` Escalada e resolve o impasse de `P-50` com `DEC-015` — a saída sobe para o **teto** (alçapão a 6 tiles, contra os 4,3 do salto duplo), em vez de a sala crescer. `LVL-11` fecha a **régua horizontal** (salto 313 / duplo 534 / gancho 512 / planeio **1.042 px**) e prova que `HAB-07` não é voo: planar num salto simples rende 529 px, *menos* que o duplo sozinho. `LVL-12` é o **chefe que não tranca a porta** (`gate=none`): a forja não tem grade, atravessar a arena custa 4,36 s, e `ITM-011` só existe para quem escolhe lutar. `LVL-13` **fecha o Ato III**: as correntes de ar (`CEN-096`) viram objeto de ambiente — quem sobe é a corrente, não o estandarte — e a profundidade do abismo mora numa **transição de 3 s**, não na grade. `LVL-14` abre o Ato IV com o **chefe alto** `ENT-006`, o **eclipse** como relógio do céu e `DEC-016` (chave de chefe é contador, não item) — o que resolve `P-61` e mantém a luta de LVL-12 opcional. `LVL-15` é o setor do **silêncio absoluto**: o guardião duplo (1 chefe, 2 corpos) luta ao som de `BGM-03`, e o último quadro de aviso do jogo diz `ASSINATURA: —`. `LVL-16` **fecha o jogo**: o chefe final não tem vida — tem **postura**, e se vence **assinando três baixas** num posto de guarda (`MEC-011`), com o Caos existindo só como **chão que desaba** e sem causar um ponto de dano (`DEC-018`). É o único setor **sem atalho** e **sem porta de saída**: a parede leste de L16-06 é sólida, `BGM-04` toca uma vez na vida e a última coisa que se ouve é o trono rangendo sob um corpo.
6. [`docs/decisoes/P-15-tuning-de-movimento.md`](docs/decisoes/P-15-tuning-de-movimento.md) — a config canônica de movimento e a medição que a sustentou
7. [`agents-ia/README.md`](agents-ia/README.md) — o pipeline
8. [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md) — o que precisa ser decidido **antes** de codar

## Antes de qualquer linha de código

**`P-15` está fechada** (`DEC-014`): a config canônica é **B** — impulso 560, gravidade 1100. `BKL-002` está liberado, `tuning.ts` nasce já com esses valores e **sem** a alternativa A. A medição que sustenta a decisão está em [`docs/decisoes/P-15-tuning-de-movimento.md`](docs/decisoes/P-15-tuning-de-movimento.md) e pode ser reconferida jogando [`ferramentas/comparador-de-salto.html`](ferramentas/comparador-de-salto.html).

Resta **`P-14`** (backend online é obrigatório no MVP?), que bloqueia `BKL-005`, `008`, `009` e `012`. É decisão do proprietário, não dos agentes.
