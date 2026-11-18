# Roteiro de playtest — recorte do MVP (LVL-01 a LVL-03)

Documento operacional. Responde às pendências `P-01` (o recorte é divertido?), `P-27` (o ritmo do
`CEN-001` é o certo?), `P-29` (o TTK de 22–35 s acontece de verdade?) e dá evidência para `P-30`
(`ATK-02` é legível?).

> **Regra de ouro:** o playtest não existe para provar que o jogo está bom. Ele existe para
> descobrir **onde o jogador para de entender**. Se ninguém se perder, o roteiro falhou.

---

## 1. O que já está medido (não desperdice a sessão com isso)

O jogo mede sozinho, desde a instrumentação de sessão (`src/core/metrics.ts`):

| Métrica | De onde sai | Já verificada por |
|---|---|---|
| tempo por sala e por setor | `enterRoom` a cada troca | `npm run lvl03` |
| mortes por setor e por sala | `addDeath` | `npm run lvl03` |
| tentativas e erros de senha | `addPasswordAttempt` | `npm run lvl02` |
| **TTK do chefe (média e melhor)** | `startFight`/`endFight` | `npm run lvl03` |
| itens coletados | `addItem` | `npm run lvl02`/`lvl03` |
| mudanças de dificuldade aceitas | `addDifficultyChange` | `npm run lvl03` |

O relatório aparece no painel **RELATÓRIO DA SESSÃO**, no fim do jogo e é copiável (botão `COPIAR JSON`); a última
sessão também fica em `localStorage['homem-macho/playtest/v1']`.

**O que a máquina não mede — e é o motivo desta sessão:** se o jogador entende o gate de LVL-02, se
acha o Guardião justo, se lê o telegraph de 800 ms, se o pilar vale o risco.

---

## 2. Preparação (5 min antes do participante)

1. `npm run dev` no ar; abrir em **1280×720**, zoom 100%.
2. DevTools fechado. Som ligado (áudio ainda é pós-MVP — avise que não há som, para não virar achado).
3. Gravação de tela ligada (o relatório dá os números; o vídeo dá o *porquê*).
4. Dificuldade: deixar **MÉDIO** (padrão). Não mencionar a oferta de `MEC-008`.
5. Abrir com `localStorage.clear()` para o relatório começar limpo.

---

## 3. Perfil mínimo da amostra

| Papel | Quantos | Por quê |
|---|---|---|
| Nunca jogou este build | 3 | o roteiro de LVL-02 depende de leitura, não de memória |
| Nunca jogou Metroidvania | 1 | mede a curva do gate de 3 tiles |
| Conhece o jogo (você ou outro agente) | 1 | controle negativo: se **ele** falhar, é bug, não é design |

Não misture os grupos na mesma análise. 5 sessões dão sinal qualitativo, **não** estatística —
diga isso no relatório final para não virar número falso.

---

## 4. Protocolo (30–40 min por pessoa)

**Fala inicial (leia igual para todos):** *"Isto é um recorte de um jogo em construção. Você vai
jogar três setores. Não existe jeito errado de jogar. Eu não vou ajudar nem dizer o que fazer —
se eu ficar quieto, é de propósito. Pense em voz alta: o que você está vendo, o que espera que
aconteça."*

- Moderador **não** aponta caminho, **não** explica mecânica, **não** defende o jogo.
- Se travar por **> 3 min** no mesmo ponto: uma pergunta neutra — *"o que você acha que esse
  elemento faz?"* — e anota o tempo de travamento.
- Se travar por **> 8 min**: encerra a tarefa, marca **abandono** e segue.
- Tempo máximo de sessão: **40 min**. Registrar onde parou.

### Tarefas (nesta ordem, sem revelar o que vem)

| # | Tarefa | Fala do moderador | O que observar |
|---|---|---|---|
| T1 | Atravessar LVL-01 | "Vá até onde o jogo permitir." | usa corrida? entende o coyote? pula a escada de L01-02 de primeira? |
| T2 | Pegar o fragmento e passar o gate (LVL-02) | "Continue." | descobre o beco e o backtracking? tenta o gate antes do fragmento? quantas tentativas? |
| T3 | Abrir a porta de senha | "A porta está fechada." | lê as pistas de L02-04/L02-06? quantas tentativas até acertar (relatório confirma)? |
| T4 | Lutar contra o Guardião | "O que você faria aqui?" | lê o telegraph de 800 ms? usa os pilares? morre por dano de contato ou por investida? |
| T5 | Sair da arena e concluir | (silêncio) | entende que a saída abriu? repara no painel de fim? |

**Marcos a cronometrar à mão** (o relatório não vê): primeiro pulo, primeiro uso de ataque,
primeira morte, primeiro uso do pilar, momento em que diz "entendi" e momento em que diz "travou".

---

## 5. Perguntas pós-sessão (1–5, e uma frase livre)

1. A dificuldade foi: **1 = fácil demais · 5 = injusta**.
2. O Guardião telegrafa o ataque de forma legível? **1 = nada · 5 = perfeitamente**.
3. O pilar foi descoberto como ferramenta, ou você só apanhou até acertar?
4. Em algum momento você **parou de saber para onde ir**? Onde, e por quanto tempo?
5. Os espinhos de LVL-02 têm ritmo previsível? (`P-27`)
6. O golpe de área da fase 2 (`ATK-02`) pareceu injusto ou só novo? (`P-30`)
7. Você jogaria mais 10 minutos? O que mais te interessou?
8. Frase livre: a coisa mais confusa da sessão.

---

## 6. Formulário de registro (um por sessão)

```text
Sessão #:            Data:            Participante:
Perfil:              [ ] novo  [ ] novo em Metroidvania  [ ] interno
Dificuldade final:   [ ] fácil  [ ] médio  [ ] difícil     (mudou? em que ponto?)
Término:             [ ] concluiu  [ ] abandonou em: ______   após ____ min

Tempos e números (colar o JSON do painel RELATÓRIO DA SESSÃO (no fim do jogo)):
  tempo total: ______   LVL-01: ______   LVL-02: ______   LVL-03: ______
  mortes: ______   senha: ____ tentativas / ____ erros
  TTK: ______ (alvo 22–35 s)   tentativas no chefe: ______
  dificuldade rebaixada: ______ vezes

Travas (tempo parado > 3 min): onde / quanto / o que tentou
  ______________________________________________
Falas marcantes (transcrever literalmente, sem corrigir):
  ______________________________________________
Notas 1–5: (1)__ (2)__ (5)__ (6)__
```

---

## 7. Como transformar os dados em decisão

| Se a média de TTK | Leitura | Ação no `tuning.ts` |
|---|---|---|
| < 22 s (5 sessões) | luta curta demais; a fase 2 mal aparece | subir `BOSS.hp` 200 → 240, **não** mexer na investida |
| 22–35 s | `P-29` responde **sim** | fechar `P-29` com o número no documento do setor |
| > 35 s | o jogador não acha a janela do pilar | investigar antes de mexer: metade morre sem usar pilar? então o problema é legibilidade, não HP |
| > 50% das mortes concentradas em 1 sala | parede, não dificuldade | revisar geometria daquela sala |

Regras fixas para não estragar a leitura:

- **Não mexa em duas variáveis na mesma rodada.** Se mudar HP e velocidade de investida juntos,
  o próximo teste não diz nada.
- **O sinal do pilar é qualitativo** (`P-29`): se a maioria descobre o pilar depois de morrer 3×,
  o problema é `VIS`/telegraph, não número.
- **`P-27` (espinhos)** só fecha com o item 5 do questionário — o relatório conta mortes, não tédio.
- **`P-30` (`ATK-02`)** fecha com o item 6: "injusto" recorrente = recuar telegraph de 1000 → 1200 ms;
  "só novo" = aprovado como criação, registrar em `DECISOES.md`.

---

## 8. Saída da sessão (o que fica no repositório)

1. `docs/playtest/sessoes/SESSAO-NN-em-branco.md` (5 cópias prontas) preenchido + o JSON colado, **cru**.
2. Uma linha em `docs/PENDENCIAS.md` por pendência fechada (`P-27`, `P-29`, `P-30`).
3. Se houve mudança de número: `DEC` nova em `docs/DECISOES.md` com o dado que a motivou.
4. Se houve mudança de código: teste que impede a regressão (`vitest` ou `tests/*.mjs`).

> Dados de sessão **não** saem da máquina: a telemetria é `localStorage` (`DEC-022`). Se um dia
> houver backend (`P-14`), este roteiro é o contrato do que seria enviado — e nada além disso.
