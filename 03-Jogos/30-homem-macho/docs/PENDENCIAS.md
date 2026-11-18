# Pendências Abertas — Homem Macho

> Versão: `0.1.0` · Data: `2026-11-13` · Mantido por `AGT-08`
> Regra: toda pendência tem ID, dono e **o que ela bloqueia**. Sem "bloqueia", não é pendência — é anotação.

## LVL-08 em código (2026-11-13)

O setor está implementado e testado — **nada aqui abre pendência nova**; as que existiam continuam abertas e agora têm prova do lado do código:

| ID | O que o código já resolveu | O que continua aberto |
|---|---|---|
| `P-46` | `ENT-004` existe como `entities/Alferes.ts` com FSM de 2 fases, `ATK-04` e `ATK-06` em `ALFERES` (`tuning.ts`) e barra de chefe no HUD (`BossBar`, `game:boss`) | **arte**: `AST-010`, sprite 192×192/20 frames, bestiário do Ato II (`P-42`) e a barra **não-final** |
| `P-47` | `ITM-007` é um item gated por `bossDefeated`, com textura `item_relic` e entrada em `ITEMS` | **o que ele é**: equipamento (duplica `ITM-004`?) ou chave narrativa (precisa entrar no grafo) |
| `P-48` | a areia usa `SAND.speedMultiplier = 0.75` num único ponto (`Player.speedMultiplier`) e o teste E2E mede o multiplicador no chão, no ar e fora da faixa | **o solver**: enquanto ele só comparar geometria de salto, todo piso lento dos setores 09–16 continua risco de soft lock |

> Nota de numeração: a §14 de [`niveis/LVL-08.md`](niveis/LVL-08.md) reaproveita `P-45` para "LVL-07 sem atalho", ID que esta tabela já fechou com o trifório. Mantido lá para não quebrar referências; a pendência viva é `P-46`–`P-48`.

## LVL-09 em código (2026-11-13)

O canal está implementado e testado. Nenhuma pendência nova; as três do setor agora têm prova do lado do código:

| ID | O que o código já resolveu | O que continua aberto |
|---|---|---|
| `P-51` | `HAB-04` existe: `core/hook.ts` (alcance, puxada, pendurado, salto), `Player.hook` como **estado** e tecla `Q` (`DEC-024`), `ITM-008` permanente | **catálogo**: `AST-012`, `UI-13`, o comportamento do gancho **em água** e a arte da argola gasta (`CEN-072`) |
| `P-52` | o setor evita a pergunta: L09-03 não tem inimigo e nenhuma luta acontece submersa | **regra de combate em água** — LVL-11 e LVL-13 vão encontrá-la |
| `P-59` | o teste mede o que o documento afirma: canal de **512 px** contra duplo de **378 px** (134 px de margem) e, no E2E, o herói cai e volta à entrada sem o gancho | **a folga de 22 px** de `LVL-11` §7.3 continua sem correção de layout |

> Achado de conta registado em [`niveis/LVL-09.md`](niveis/LVL-09.md) §11 (desvio 7): a queda do salto do gancho do §6.3 está subestimada em 12% (1,29 s → **1,43 s**, 490 px → **545 px**). A folga da travessia aumenta; nada de layout muda.

## LVL-10 em código (2026-11-13)

A torre está implementada e testada. `DEC-015` deixou de ser tese: o alçapão funciona no motor, e com ele `P-50` fecha de fato.

| ID | O que o código já resolveu | O que continua aberto |
|---|---|---|
| `P-53` | `DEC-015` **implementada**: alçapão de 2 tiles em `y=0`, dois sentidos, `sealed` sólido e `open` com `requires=HAB-03`; `HAB-03` existe em `core/climb.ts` (aderência 100 ms, subida 90, descida 240, pulo 420+560, só `climbable`) e `ITM-009` é permanente | ratificação formal de `DEC-015` pelo proprietário; `AST-013`, `UI-14` e a arte da parede de ganchos |
| `P-54` | o poço 10 ↔ 03 funciona de verdade: `Room.sink` com `requires` cruza **setor**, e o E2E chega a LVL-03 | **ficha do atalho**: nome, skin, tempo de transição, comportamento com bolsa e persistência em reload |
| `P-55` | o código assumiu **pista narrativa**: tocha acesa, arsenal guardado, cama feita, sino sem badalo e nenhum `SFX` de sino — a torre acesa é conteúdo, não inconsistência | decisão de arte (`AGT-01`/`P-16`) antes de desenhar o setor |

> Correção de conta registada em [`niveis/LVL-10.md`](niveis/LVL-10.md) §12 (desvio 7): o alçapão fica **sobre** a parede sólida, então o corpo não cabe dentro dele — quem sobe entra pelo topo da parede. Nenhuma linha de grade mudou.

## LVL-11 em código (2026-11-13)

O jardim está implementado e testado. `HAB-07` deixou de ser ficha: o pano existe no motor, e com ele `P-56` fecha **em código** (a arte continua aberta).

| ID | O que o código já resolveu | O que continua aberto |
|---|---|---|
| `P-56` | ficha de `HAB-07` **implementada**: `ITM-010`, descida 120 px/s (`setMaxVelocityY`, ver `DEC-026`), horizontal 308 px/s, **zero ganho de altura**, ativação por segurar o salto no ar, cancelável sem cooldown; `core/glide.ts` + `glide.test.ts` (8 testes) e `GLIDE` em `tuning.ts` | `AST-014` (`tm_jardim`, ~30 tiles), `UI-15` (ícone do estandarte) e a ratificação formal pelo proprietário |
| `P-57` | segue fechada por `CEN-096` em LVL-13: o pano **não** sobe sozinho em nenhum ponto do código | nada |
| `P-58` | a variante `pruning` entrou como **skin**: o código usa `ENT-002` sem ficha nova, e o E2E conta 4 Sentinelas | decidir `ENT-002` × 4 ou × 5 (`P-78`) e o orçamento de arte da skin |
| `P-59` | o canal de 8 tiles de LVL-09 continua atravessável por 22 px — **não foi tocado**; o teste de LVL-11 mede o que o documento afirma e não corrige o setor vizinho | decisão de layout em LVL-09 (alargar para 11 tiles ou aceitar o gancho como conveniência) |
| `P-78` | — | **`ENT-002` × 4 ou × 5 em LVL-11**: §1 campo 10 anuncia 5, as grades de §4 desenham 4 |
| `P-79` | `GLIDE.rangePx = 1.022`, medido (2 subidas + descida planejada) | publicar 1.042 no GDD **ou** corrigir §7.2; até lá vale o valor medido |

> Correção de conta registada em [`niveis/LVL-11.md`](niveis/LVL-11.md) §12 (desvios 8–12): o alcance é 1.022 px e não 1.042; o freio é `setMaxVelocityY` e não `setVelocityY`; o pano abre no próprio botão do pulo; e a saída para LVL-12 fica sem destino no build (`PAT-C-10`). Nenhuma linha de grade mudou.

## LVL-12 em código (2026-11-13)

A forja está implementada e testada. O setor **não entrega habilidade** — o kit fechou em LVL-11 — e é o primeiro que existe só para cobrar o que o jogador já tem.

| ID | O que o código já resolveu | O que continua aberto |
|---|---|---|
| `P-60` | ficha de `ENT-005` **implementada**: 260 HP, fase em 130, `ATK-10` (5 tiles/22/460 ms), `ATK-11` (18, 1 quique, altura do peito), `ATK-12` (20, só fase 2), `leash_x=21`, `engage` = 5 tiles **no piso**; estado `trabalhando` que **volta** quando o jogador sai; `core/forge.ts` + `forge.test.ts` (21 testes) e `FORJADOR` em `tuning.ts` | `AST-015` (sprite do Forjador), `AST-016` (`tm_forja`), `UI-16` e a ratificação formal pelo proprietário |
| `P-61` | **fechada por `DEC-016`** (chave = contador, `≥ 2`): `ITM-011` entrou como recompensa **condicional** e existe no código só depois de `MEC-009` — provado com o jogo a correr | ratificação virou `P-65` (segue aberta) |
| `P-62` | a esteira entrou como `decor-back` (`CEN-090`): 13 tiles em L12-03, **sem colisão e sem transporte**, com duas Sentinelas em cima — e o E2E prova que o jogador parado sobre ela não anda | canonização da origem dos Distorcidos com `LOR-03b` antes de `AGT-01` desenhar a esteira |
| `P-80` | — | **`ATK-12` desenha a faixa inteira e machuca pelo frente.** O dano segue o ponto que avança (`waveFrontX`, 6 tiles em 600 ms), mas o retângulo é desenhado de uma vez: o jogador vê a ameaça onde ela **vai estar** antes de ela chegar. Corrigir o desenho (ou aceitar como telegraph estendido) |
| `P-81` | — | **Na fase 2 o sprite do Forjador continua com o martelo na mão.** §5.5 diz que ele **atira o martelo fora** e pega a corrente com as duas mãos; a arte placeholder é um sprite só, então a troca não acontece |
| `P-82` | — | **Os elos da esteira não correm.** `CEN-090` anda sempre para a direita; o código só pulsa o alfa da imagem (o scroll contínuo pede `TileSprite` ou textura em tira). É a única coisa do setor que **se move sem se mover**, e a §4.3 depende de a esteira parecer ligada |

> **Verificado com o jogo a correr** (`tests/lvl12.mjs`, `tests/shots12.mjs`, 8 capturas): a arena atravessa-se em **4,45 s** com o chefe a 260 HP; os pilões batem defasados (0 / 3.000 ms), tiram **25** e **param** quando ele cai; a peça em brasa voa entre `piso−127` e `piso−17`; morrer na arena reinicia o chefe a **260**; `ITM-011` não existe com ele vivo; a calha volta a L12-01 **sem salvar**.

## LVL-13 em código (2026-11-13)

O abismo está implementado e testado — e ele fecha o **Ato III**. `P-57` deixa de ser só documentação: a corrente existe no motor, e com ela a única trava do jogo que exige **uma habilidade e um objeto de ambiente ao mesmo tempo**.

| ID | O que o código já resolveu | O que continua aberto |
|---|---|---|
| `P-63` | ficha de `CEN-096` **implementada**: coluna de 3×6 declarada na ficha da sala (retângulo, não glifo contado), subida **140 px/s** só com `HAB-07` **aberto**, do piso ao teto, saída pelo alçapão de `DEC-015`; `core/updraft.ts` + `updraft.test.ts` (12 testes) e `UPDRAFT` em `tuning.ts` | `AST-017` (`tm_abismo`, ~14 tiles — o menor do jogo), `UI-17`, e a ratificação formal pelo proprietário |
| `P-64` | a queda longa existe: **3.000 ms** (fade 600 + preto 1.800 + fade 600), **900 ms** em `reduce_motion`, dano 0, e salva **antes e depois** (`checkpointRoom` muda no destino). Medido com o jogo a correr: 2,47 s até a troca de sala, 0,65 s em movimento reduzido | playtest humano de `P-64` (3 s é vertigem ou espera?) |
| `P-57` | a invariante está no motor e no teste: **fora da corrente o pano não ganha um pixel** (`updraftVelocity(true, true, false) === 0`), e nenhuma sala fora de L13-04 declara corrente | nada |
| `P-83` | — | **O eco é só a silhueta, sem áudio.** `AMB-13` é efeito de bus: o código guarda o histórico de posição e desenha a cópia de 700 ms atrás com 30% de opacidade, mas **não há camada de áudio** no build (`SFX`/`BGM` são placeholders desde LVL-01). Quando o áudio entrar, o eco é o primeiro `bus` a montar — e não pode ser `SFX` duplicado |
| `P-84` | — | **As correntes são retângulos, não partículas.** `CEN-096` precisa de ar visível: o código desenha faixa, bordas e oito riscos a subir a 140 px/s, sem sistema de partículas. Funciona e lê a 12 tiles, mas `AST-017` deve substituir por emissor real |

> **Verificado com o jogo a correr** (`tests/lvl13.mjs`, `tests/shots13.mjs`, 8 capturas): sem o pano o jogador sobe os 70–84 px de um salto e volta ao piso (`updraft false`); com o pano a corrente sustenta **-140 px/s** com a gravidade desligada; fora da coluna o pano desce com `vy ≤ 120` e não sobe um pixel; o alçapão **B leva a L13-05** e o **A volta a L13-01** pela boca do poço; a queda troca de sala em **2,47 s** com **hp igual** e checkpoint no destino; em `reduce_motion` cai para **0,65 s**; o fantasma do eco fica **700 ms atrás**, com `alpha 0.3` e `depth 6`.

## LVL-14 em código (2026-11-13)

A fortaleza abre o **Ato IV** e resolve `P-61` no motor: as duas chaves que o jogador carrega desde LVL-03 e LVL-08 viram fechadura, e a terceira continua sem porta.

| ID | O que o código já resolveu | O que continua aberto |
|---|---|---|
| `P-65` | **`DEC-016` está no jogo**: `keys` é **derivado** dos itens de chefe (`core/eclipse.ts`), o portão de L14-06 exige `≥ 2`, o HUD mostra `CHAVES x / 2` e não há terceiro slot. Medido: `2/2` e `3/2` passam, `0/2` e `1/2` barram — e a coluna de (15,6) só desaparece a partir de 2 | ratificação formal de `DEC-016`, e a decisão sobre `ITM-011` em LVL-16 |
| `P-66` | **`ENT-006` implementado** (`core/comandante.ts` + `entities/Comandante.ts`): 320 HP, fase 2 em 160, estocada 6 tiles/26 **só na luz**, lança 7 tiles/24 **só na sombra**, desarmado 1.200 ms, `mobile: false`, `gate: 'arena'`. Medido: ele não muda de `x` nem com o jogador a correr | `AST-018`, `AST-019` (`tm_fortaleza`, ~30 tiles) e `UI-18` |
| `P-67` | **parcial**: o build separa céu e piso (`skyAlpha` 0,42 × `floorAlpha` 0,1) e a sombra do chefe usa luz de contorno por `setTint` — a arena não escurece | a regra publicada de espessura/cor/distância da luz de contorno |
| `P-85` | — | **O eclipse não tem som.** O cue de transição é um toast de texto; `AMB-14` não existe no build. Mesma dívida de `P-83` (o eco de LVL-13): quando o áudio entrar, os dois são os primeiros a montar |
| `P-86` | — | **A caixa da estocada é generosa** (6 tiles, ±0,5 tile de folga): acerta quem está no chão e quem pulou, como a §5.3 manda, mas o playtest de `TST-006` dirá se é justo |

> **Verificado com o jogo a correr** (`tests/lvl14.mjs`, `tests/shots14.mjs`, 9 capturas): 0 plataformas no setor, o céu vai a `sombra` sozinho em 5 s **sem chefe na sala**, os oito estados do ciclo aparecem em ordem, a fase 2 dispara em 160 HP, a grade quebra e o **eclipse congela** na morte dele.

## LVL-15 em código (2026-11-13)

O setor do silêncio está no motor, e ele é o único chefe do jogo que **não morre quando cai**: um corpo a 0 HP fica no chão, visível, e o outro larga o golpe para preencher o formulário.

| ID | O que o código já resolveu | O que continua aberto |
|---|---|---|
| `P-68` | **`ENT-007` implementado** (`core/duo.ts` + `entities/Guardiao.ts`): **2 corpos × 180 HP**, `MEC-009` só com os dois, janela de 4.000 ms, revivificação infinita com 50%, interrupção a 30 de dano acumulado, lanterna de 4 tiles/20, selo de 6 tiles/12, suspensão de 800 ms com dois selos. Medido: as quatro interrupções seguidas mantêm o caído no chão | `AST-020`, `AST-021` (`tm_antesala`, ~20 tiles), `UI-19` |
| `P-69` | **Os dois desvios estão aplicados**: arena de **30×11** (não 24) e **dois corpos** para uma entidade. `PAT-LD-07` é verificado sobre a **entidade**: a grade só cede quando os dois caem | ratificação formal pelo proprietário |
| `P-70` | **`SUSPEND.maxMs = 800`** no `tuning` e `Player.suspend()` corta no teto, mesmo que alguém peça mais. HUD conta `1 / 2` e `2 / 2`, `aria-live` anuncia. Medido: 1 selo não segura; 2 seguram **724 ms** | confirmar o teto como precedente de projeto |
| `P-87` | — | **A barra do chefe é uma só** (360) com `1/2` no nome; a §5.4 pede **duas barras finas**. `game:boss` carrega um único `hp` — `UI-19` resolve quando existir |
| `P-88` | — | **A suspensão não tem efeito visual de arrasto** (a §5.3 pede um, desligável em `reduce_motion`). Hoje ela só trava a entrada: mais seguro, menos legível |
| `P-89` | — | **`AMB-15` não existe como áudio** (é a ausência dele). O setor é mudo porque não há camada de som no build — `P-83` (eco de LVL-13) e `P-85` (eclipse de LVL-14) são a mesma dívida, e esta é a que **não custa nada** quando o áudio entrar |

> **Verificado com o jogo a correr** (`tests/lvl15.mjs`, `tests/shots15.mjs`, 7 capturas): seis portas lacradas (três por corredor, `TTT` em cada), zero plataformas, **um corpo caído não encerra a luta**, a revivificação devolve 90 HP, os dois juntos processam `MEC-009`, a porta de serviço volta a L15-01 e a suspensão respeita o teto.

## Mapa e o bug de L02-02 (2026-11-13)

O dono pediu um mapa ao estilo metroid e, no mesmo pedido, trouxe um bug de jogo. O mapa pagou-se no primeiro minuto: foi ele que mostrou que a fenda do teto de L02-02 descia para a sala errada.

| ID | O que já está resolvido | O que continua aberto |
|---|---|---|
| — | **A fenda de L02-02 leva a L02-06** (`DEC-043`): `hatches: [{ from: 24, to: 25, destRoom: 5 }]` sobrepõe-se à regra geral de `DEC-015` («a sala seguinte»), que no meio do setor apontava para L02-03 — a sala que o jogador acabara de atravessar por baixo. Preso por `lvl02.test.ts`, `mapa.test.ts` e `npm run mapa` | ratificação do proprietário sobre `DEC-043` |
| `P-95` | **`UI-22` existe e pausa a cena**: `M` (remapeável) e ícone no HUD, planta do setor gerada das 90 fichas (`core/mapa.ts`), três estados (`atual`/`visitada`/`conhecida`), coluna dos 16 setores, `Progress.visitadas` no save. 863 testes de unidade + `npm run mapa` (33 verificações) | **as posições da planta não são arte**: são caixas em CSS. `AGT-01` tem de decidir se o mapa final é desenhado à mão por setor (bonito, 16 desenhos a manter) ou continua derivado (honesto, sempre igual) — a decisão de arte não muda a regra |
| `P-96` | — | **A planta não mostra o que fica dentro da sala** (inimigos, baús, portas trancadas). `LVL-09` §5.3 e `LVL-12` §5.1 pedem o contrário para o mapa do setor: uma sala com chefe tem de se distinguir de um corredor. Falta decidir se o `game:mapa` carrega ícones por sala |
| `P-97` | — | **O mapa não tem atalho de ecrã.** `UI-06` (pausa) e `UI-08` (morte) não têm botão «Mapa», e o ícone do HUD desaparece quando a cena está pausada. Numa gamepad/sem teclado, o mapa só se abre com o jogo a correr |
| `P-98` | — | **`Progress.visitadas` cresce sem teto de jogo** — o teto de 400 é sanitização de save corrompido, não desenho. Com 90 salas é folgado, mas o número não é um contrato: se o jogo ganhar salas, o teto tem de ser revisto |

> **Bug de timing corrigido no caminho:** cada `game:toast` agendava um temporizador que apagava o aviso **seguinte**. Com três avisos no mesmo segundo — o item, a habilidade e o drop raro de `DEC-042` — o último era apagado antes de ser lido, e o jogo parecia não avisar nada. O temporizador passou a pertencer ao aviso (geração no `uiStore`), e `npm run drop` deixa de depender da sorte do relógio.

## Porta de senha e mapa na mão do jogador (2026-11-13)

Duas queixas do dono, três bugs — e nenhum deles onde ele os viu. As duas primeiras linhas são o que ficou corrigido; o resto é o que continua aberto.

| ID | O que já está resolvido | O que continua aberto |
|---|---|---|
| — | **«A porta de senha não consigo passar, fica em loop»** (`DEC-044`): a porta fechada não tinha corpo (o `Y` desenhava e não colidia) e o herói atravessava-a para fora do mundo, caía e o respawn devolvia-o ao início — loop literal. Cada tile `Y` passa a ser zona sólida (`BuiltRoom.passwordLock`); a porta aberta fica aberta (`Progress.senhaAberta`, `enterArea` deixou de a apagar, a sala monta-se com ela aberta), e o `E` já não pede uma senha que ninguém pode resolver | ratificação do proprietário sobre `DEC-044` |
| — | **«O mapa não está carregando»** (`DEC-045`): `M` era lido no `update` e uma cena pausada não corre o `update` — com a pausa aberta a tecla morria; o `ui:mapa` podia calar-se atrás de um `return` de idempotência; e sem planta o painel devolvia `null` (ecrã vazio). Agora `M`/`H` funcionam na pausa (e há botões **MAPA**/**HABILIDADES**), a cena responde sempre, e o painel sem planta diz «a preparar…», pede outra vez e sai com `M`/`ESC` | **o mapa não é alcançável a partir da morte** (`UI-08`) nem do ecrã de conclusão — e não há tecla no telemóvel: o ícone do HUD está lá, mas `P-97` continua aberto |
| `P-99` | — | **A porta de L02-07 fica debaixo do HUD.** A porta ocupa a coluna `x=19` e a coluna de botões do HUD (`UI-05`) assenta por cima: ela barra, abre e funciona, mas **vê-se pouco** — o jogador vê um ícone, não uma porta. Três saídas possíveis: encolher/deslocar o HUD, mover a porta para `x=17` na grade, ou realçar a porta quando o herói se aproxima. Nenhuma é decisão de código |
| `P-100` | — | **A senha não tem animação de acerto nem de erro.** §5.7 pede «glifos sacodem» (`VFX`) no erro e «animação de abertura» + `SFX-004` no acerto; o build tem só o *toast* `A PORTA CEDE` e o realce do glifo errado no painel. A porta abre — o que falta é o que a torna legível sem ler |

> **A entrada passou a ter uma regra:** nenhum toque se perde (`DEC-044`, terceira parte). O `M`/`H`/`I` era lido só por `JustDown` no `update`, e um *tap* mais curto do que o frame seguinte caía na fissura — medido no sandbox a 4 fps, **4 de 6** aberturas falhavam; com o pulso do DOM, 6 de 6. O mesmo mecanismo serve o toque no telemóvel (`ui:input` já injetava um pulso, e agora ele não é descartado).

## O chefe que desaparecia ao levar um tiro (2026-11-13)

O relato do dono — «em L03-02, ao levar qualquer ataque ele some da tela, dessa forma não é possível derrotá-lo» — era exatamente o que acontecia, e a causa estava fora do chefe.

| ID | O que já está resolvido | O que continua aberto |
|---|---|---|
| — | **`DEC-046`**: os seis callbacks de «projétil × chefe» recebiam o **inimigo** no parâmetro do projétil (o Phaser entrega `(sprite, filhoDoGrupo)` em `overlap(grupo, sprite, cb)`) e desligavam-no — `active=false`, `visible=false`, corpo desligado, logo imune a tudo. Uma regra só (`projetilContra`/`projetilDe`) responde «qual dos dois está no pool?», e `despawnProjectile` recusa quem não é projétil. Coberto por `npm run tiro` (38 verificações nos seis chefes, incluindo a morte do Guardião e a abertura da arena) | ratificação do proprietário sobre `DEC-046` |
| `TST-020` | **`npm run tiro`** nasceu do bug e cobre os seis alvos: o tiro tira vida, o alvo **continua visível/ativo/com corpo**, o projétil é que desaparece, e o Guardião morre de tiro com a arena a abrir | os outros cinco chefes não têm um teste de **morte completa** (só o de LVL-03 tem) — a luta até ao fim de LVL-08/12/14/15/16 fica coberta pelos testes de setor, que usam o golpe branco |
| `TST-021` | **`npm run campanha`** atravessa as 15 passagens com o gesto real (porta leste, elevador, alçapão, portão) e verifica HP/escudo/kit em cada uma, os dois negativos (elevador sem Força, portão com uma chave) e o fim no trono | é o único teste que prova a **progressão**: os `lvlNN.mjs` provam cada setor por teleporte, e um setor perfeito pode não ter porta para o seguinte. Não substitui playtest: mede passagem, não diversão |
| `TST-022` | **`npm run piloto`** mede o piloto de ampliação ao vivo: censo por sala (corpos e arquétipos), corpo próprio de cada arquétipo, o tiro do atirador, a ausência de gravidade do voador, e a rolagem da câmara | os testes unitários provam a grade; este prova o **jogo**. Enquanto o `LevelBuilder` não lia `Room.variantes`, a grade tinha três arquétipos e a cena criava três Sentinelas — nenhum teste de dados apanhava isso |
| `TST-023` | **`npm run lvl10`** mede o gesto e não o destino: agarra, sobe 274 px **sem largar a garra**, e só então o alçapão dispara | a versão anterior segurava o pulo e chamava-lhe subida, e passava verde enquanto o dono não conseguia subir. «Chegou lá» e «chegou lá a escalar» não são a mesma asserção |
| `P-102` | **O piloto não foi jogado por uma pessoa.** 109 s de travessia e 8 corpos medidos por bot não dizem se é divertido, se o atirador é injusto, se o voador se lê | replicar a LVL-02..16 |
| `P-103` | **Arte dos dois arquétipos novos é procedural** (`enemy_shooter` 56×72, `enemy_flyer` 44×56) | `P-16` |
| `P-101` | — | **O mesmo padrão de ordem de argumentos não está auditado fora dos projéteis.** Os overlaps restantes (espinhos, itens, água) usam `(_p, outro)` de propósito e estão certos, mas não há uma regra escrita que impeça o próximo `overlap` de repetir o erro — hoje a defesa é `PAT-C-03` §«quem é o projétil?» e revisão |

> **Porque é que os testes de setor não apanharam isto:** todos matavam os chefes com o **golpe branco** (`J`), que passa por outro caminho (`makeSwordRect` → `takeHit`). O tiro (`K`) só era usado em `drop-raro`, contra um chefe cujo HP era lido por fora — e o HP caía de facto. Ninguém olhava para a visibilidade do alvo. A asserção que faltava era banal: *o inimigo continua no ecrã depois de levar um tiro?*

## Bloqueantes do caminho crítico

| ID | Item | Dono | Bloqueia | Origem |
|---|---|---|---|---|
| `P-14` | **Backend online é obrigatório no MVP?** Conta + conexão custam ~100 h de 420 h (24%) e trazem LGPD/menores/conflito antes da validação. Recomendação: save local em IndexedDB com o mesmo envelope (`PAT-C-07`), conta em v0.5. | Proprietário | `BKL-005`, `BKL-008`, `BKL-009`, Fase 2 | Análise técnica 2026-11-13 |
| `P-16` | **Pipeline de arte.** Ferramenta de sprite, quem opera, uso de IA e termos comerciais, onde ficam as fontes editáveis. Sem isso, ~120 frames de `AST-001`–`008` são retrabalho garantido. | Proprietário | `BKL-012`, vertical slice | Análise técnica 2026-11-13 |

## Fechadas

| ID | Item | Fechada em | Como |
|---|---|---|---|
| `P-15` | **Config de game feel A ou B** | 2026-11-13 | [`docs/decisoes/P-15-tuning-de-movimento.md`](decisoes/P-15-tuning-de-movimento.md) — **adotada B** (impulso 560 / gravidade 1100), `DEC-014`. A é inalcançável no gate de 192 px em todas as taxas de quadros (−2 a −16 px); B passa com 74–91 px de folga |
| `P-17` | Layout de LVL-01 nos 12 campos | 2026-11-13 | [`docs/niveis/LVL-01.md`](niveis/LVL-01.md) — 6 salas, grade validada, config-agnóstico |
| `P-31` | Layout de LVL-02 | 2026-11-13 | [`docs/niveis/LVL-02.md`](niveis/LVL-02.md) — 8 salas, laço com backtracking, gate validado por solver |
| `P-32` | Layout e combate de LVL-03 | 2026-11-13 | [`docs/niveis/LVL-03.md`](niveis/LVL-03.md) — arena, FSM do chefe, TTK validado · **MVP completo em layout** |
| `P-37` | **LVL-04 sem atalho de retorno** | 2026-11-13 | [`LVL-04.md`](niveis/LVL-04.md) §6 — **`CEN-034` sumidouro de cinza**, queda de mão única por `interact`. Fechada junto com `P-45`, e as duas geraram a **forma (b)** de `PAT-LD-08` (§7.9) |
| `P-45` | **LVL-07 sem atalho de retorno** | 2026-11-13 | [`LVL-07.md`](niveis/LVL-07.md) §5.1 — **`CEN-070` trifório**, queda de mão única, e a sétima técnica de escala do setor |
| `P-56` | **A ficha de `HAB-07` (em código)** | 2026-11-13 | **Fechada em código, arte pendente.** [`LVL-11.md`](niveis/LVL-11.md) §7.1 + §11-A — o pano é **câmbio**: descida 120, horizontal 308, nenhuma altura, ativação segurando o salto no ar. A régua medida é **1.022 px** (o §7.2 publica 1.042), e nenhum dos três vãos (11 · 12 · 13 tiles) é atravessável sem ele — provado com o jogo a correr. Gerou `P-79` |
| `P-50` | **As habilidades verticais não têm onde caber** | 2026-11-13 | **Fechada por `DEC-015`, não por sala mais alta.** [`LVL-10.md`](niveis/LVL-10.md) §6 — a **saída** sobe para o teto: alçapão em `y=0` fica a **6 tiles (384 px)** e o duplo chega a **4,3 tiles (276 px)** → **108 px de margem**. `HAB-03` trava pelo alçapão; `HAB-07` travará por vão horizontal. Sala mais alta **não** é a resposta — saída mais alta é. Gerou `P-53` |
| `P-61` | **Economia de `ITM-011`** | 2026-11-13 | **Fechada por `DEC-016`.** [`LVL-14.md`](niveis/LVL-14.md) §8 — chave de chefe é **contador** (`keys`), o portão exige `≥ 2`, e os dois chefes **obrigatórios** (LVL-03, LVL-08) garantem 2. A recompensa de LVL-12 é a **sobra sem fechadura**, e é o que mantém aquela luta opcional. Ratificação virou `P-65` |
| `P-57` | **Correntes de ar não têm setor** | 2026-11-13 | **Fechada por `CEN-096`, não por mudança em `HAB-07`.** [`LVL-13.md`](niveis/LVL-13.md) §6 — a corrente é **objeto de ambiente**: dentro da coluna com o pano aberto o jogador sobe a **140 px/s**; fora, `HAB-07` continua descendo a 120 px/s e **não ganha um pixel**. A régua de 1.042 px de LVL-11 segue intacta. Gerou `P-63` |

> **`LVL-04` e `LVL-05` não aparecem aqui porque nunca tiveram pendência de layout:** os dois estão fora do MVP e nasceram já especificados, em esboço `[PÓS]`, como pedido de `D-04`. [`LVL-04`](niveis/LVL-04.md) — 5 salas, 154 tiles, 0 falhas, gera `P-33`–`P-36`. [`LVL-05`](niveis/LVL-05.md) — 5 salas, 124 tiles, 0 falhas, entrega `HAB-05`, gera `P-37`–`P-39`. [`LVL-06`](niveis/LVL-06.md) — 5 salas, 124 tiles, 0 falhas secas, entrega `HAB-06`, gera `P-40`–`P-42`. [`LVL-07`](niveis/LVL-07.md) — 5 salas, 134 tiles, 0 falhas, **sem trava**, gera `P-43`–`P-44`. [`LVL-08`](niveis/LVL-08.md) — 6 salas, 144 tiles, 0 falhas, **trava por chefe**, ficha de combate `ENT-004`, gera `P-45`–`P-48`. [`LVL-09`](niveis/LVL-09.md) — 6 salas, 140 tiles, 0 falhas, **zero plataformas**, entrega `HAB-04`, gera `P-49`–`P-52`. [`LVL-10`](niveis/LVL-10.md) — 5 salas, 110 tiles, 0 falhas, **zero plataformas**, entrega `HAB-03`, **resolve `P-39`/`P-50` com `DEC-015`** (alçapão no teto), gera `P-53`–`P-55`. [`LVL-11`](niveis/LVL-11.md) — 5 salas, 140 tiles, 0 falhas, **zero plataformas, zero argolas, zero mortes**, entrega `HAB-07` e **fecha a régua horizontal** (1.042 px), gera `P-56`–`P-59`. [`LVL-12`](niveis/LVL-12.md) — 6 salas, 144 tiles, 0 falhas, **zero plataformas e zero vãos**, chefe médio `ENT-005` **opcional** (`gate=none`), gera `P-60`–`P-62`. [`LVL-13`](niveis/LVL-13.md) — 6 salas, 150 tiles, 0 falhas, **zero plataformas/vãos/armadilhas**, **fecha o Ato III**, resolve `P-57` com `CEN-096` (corrente de ar) e gera `P-63`–`P-64`. [`LVL-14`](niveis/LVL-14.md) — 6 salas, 144 tiles, 0 falhas, chefe alto `ENT-006`, **fecha `P-61` com `DEC-016`** (chave = contador), gera `P-65`–`P-67`. [`LVL-15`](niveis/LVL-15.md) — 6 salas, 160 tiles, 0 falhas, **guardião duplo** (1 chefe, 2 corpos), **silêncio absoluto** e `PAT-LD-08` forma (c), gera `P-68`–`P-70`. [`LVL-16`](niveis/LVL-16.md) — 6 salas, 134 tiles, 0 falhas, **chefe final sem vida** (postura + 3 baixas, `MEC-011`), **zero atalho**, **sem saída leste**, `BGM-02` na luta e `BGM-04` no fim, gera `P-71`–`P-73`. Os atalhos de retorno de LVL-04 e LVL-07 foram fechados (`P-37`, `P-45`). **Os 16 setores estão especificados.**

## Pendências herdadas do GDD (ainda abertas)

| ID | Item | Dono | Bloqueia |
|---|---|---|---|
| `P-02` | Regra de equipamento em uso na morte e kit básico permanente | Proprietário | `BKL-005` |
| `P-03` | Contador de 3 mortes: quando zera exatamente | Proprietário | `BKL-010` |
| `P-08` | Orçamento, provedor de conta/backend, custo mensal | Proprietário | Produção pública |
| `P-09` | Direitos do nome "Homem Macho", licenças de assets/IA, classificação final | Proprietário | Publicação / vertical slice (nome) |
| `P-10` | Preços, catálogo de cosméticos, mapa detalhado das 16 áreas | Proprietário | Pós-MVP |
| `P-11` | Modelos e versões de dispositivos da matriz de teste | `AGT-07` | Beta |
| `P-13` | Dias e horas reais de trabalho por semana; datas reais de início | Proprietário | Roadmap |

## Pendências técnicas abertas

| ID | Item | Dono | Bloqueia |
|---|---|---|---|
| `P-18` | Versão exata de Phaser a fixar; verificar se versão maior mudou `Scale`/`Arcade` | `AGT-04` | `BKL-001` |
| `P-19` | `LICENSE` do repositório não definido (público sem licença = todos os direitos reservados por padrão) | Proprietário | Publicação |
| `P-20` | Mecânicas de game feel ausentes do GDD (`MEC-001`): coyote time, jump buffer, altura variável, corner correction | `AGT-08` | `BKL-002` |
| `P-21` | Corrida consumindo Poder (10/s de 100, regen 15/s): punir mobilidade contradiz o Pilar P1 | Proprietário | `BKL-002` |
| `P-22` | ~~Moeda sem sumidouro no MVP (5 por inimigo, sem loja): ou sai do HUD ou ganha uso~~ — **fechada (2026-11-13):** a moeda ganhou risco antes de ganhar loja. 5 por inimigo, 25 por chefe, e **100 % perdida na morte** (`DEC-037`); o sumidouro é o risco de a carregar. *`DEC-042` subiu a fonte para **20 por mob e 200 por chefe**: o sumidouro passou a ser as melhorias das habilidades, que custam 4.915 a 18.679 moedas do 1 ao 10.* O preço na loja continua por decidir quando a loja existir | Proprietário | `BKL-004`, `MEC-004` |
| `P-23` | Corrigir `02-gameplay.md` §2.9: multiplicador de dificuldade deve aplicar **antes** do escudo, não depois | `AGT-08` | `BKL-004` |
| `P-24` | ~~Inventário de 40 slots / 20 presos para um MVP com 1 item dropável: reduzir para 8–12 e sem "prender"~~ — **fechada (2026-11-13):** o pedido do dono é a mochila de 40 espaços com "prender", e é isso que a `UI-07` entrega; o que é pequeno é o **conteúdo** (3 drops), não o contrato. Os números vivem em `INVENTARIO` (`tuning.ts`). Ver `DEC-035` | Proprietário | `BKL-005`, `UI-07` |
| `P-26` | Inimigos derrotados respawnam ao fazer backtracking? Assumido **não** em LVL-02 (senão o retorno sobe de 22 s para ~40 s) | Proprietário | `BKL-011` |
| `P-28` | ~~Regra de misericórdia: bolsa de morte em arena de chefe cai na **entrada da arena**, não no ponto da morte~~ — **implementada (2026-11-13):** `localDaBolsa()` põe a bolsa no ponto de entrada quando a sala tem chefe (`DEC-038`) | Proprietário | `BKL-005`, `MEC-004` |
| `P-29` | Validar em playtest se 200 HP + investida de 5 tiles produz TTK entre 22 e 35 s | `AGT-07` | `BKL-011` |
| `P-30` | `ATK-02` (golpe de área) é criação nova, não consta no GDD §3.2 — aprovar e registrar | Proprietário | `BKL-011` |
| `P-27` | `CEN-001` cíclico: 1,2 s ativo / 1,2 s inativo e defasagem de 0,6 s entre pares é o ritmo certo? | `AGT-02` | `BKL-012` |
| `P-25` | Nenhuma hora de arte no backlog (`AST-001`–`008` fora de qualquer `BKL`) | `AGT-00` | Planejamento real |
| `P-33` | **Um setor sem nenhuma armadilha segura a atenção por 6–9 min?** LVL-04 é respiro do Ato II: zero `CEN-001`, zero queda fatal, 6 inimigos em 154 tiles. Se o playtest mostrar tédio, adicionar **uma** armadilha em L04-02 — não distribuir pelo setor | `AGT-02` | `BKL-012`, Ato II |
| `P-34` | **`AST-005` é o tileset do bosque?** O bloco `AST-001`–`008` não tem catálogo por ID no repositório | `AGT-01` | `BKL-012`, `P-16` |
| `P-35` | **`patrol_sync` + `patrol_offset` entram no schema de objetos?** Sem elas a formação de L04-03 não existe e a cena do Ato II vira três inimigos aleatórios | `AGT-03` | `BKL-011`, L04-03 |
| `P-36` | **Textos de lore do Ato II** (4 inscrições em LVL-04, 39 palavras no total). São os primeiros textos que insinuam a resposta do Ato II | `Proprietário` | `BKL-013` |
| `P-38` | **`HAB-05` Força não tem ficha numérica.** `04-setores` §4.2 lista a habilidade mas não define velocidade de empurrão, alcance, nem se afeta combate. Faltam também os IDs `ITM-005`, `AST-006` e a UI `UI-12` no catálogo | `AGT-03` | `BKL-011`, `BKL-012` |
| `P-39` | **Confirmar que não existe rolagem vertical de câmera.** `07-padroes` §7.1 implica (20×11 = tela exata) mas nenhum documento afirma. Se a câmera **puder** rolar na vertical, LVL-05 deve ser refeito com poços de 20+ linhas **antes** de qualquer arte | `AGT-04` | `BKL-001`, LVL-05, setores 06–16 |
| `P-40` | 🔴 **Canonizar `HAB-06` Fôlego no LVL-06, não no LVL-07.** O grafo está circular: 06 → 07 exige `HAB-06`, e `HAB-06` nasceria em LVL-07. Somado a isso, Fôlego não combina com a Catedral Oca (osso, vitral, vela, sem água). Aprovar também a ficha: fôlego 6 s → 20 s, nado 160/120 px/s, afogamento sem dano, `ITM-006`, `AST-007`. **Se recusada, L06-05 é refeita seca** | `Proprietário` | `BKL-011`, `BKL-012`, LVL-06 |
| `P-41` | **"Escuro real" é arte ou mecânica?** LVL-06 pede escuridão real, mas não existe sistema de luz no projeto (cone, raio, oclusão). Tratado como direção de arte com piso de contraste. Se mecânica, é `BKL` novo e muda o orçamento de arte | `AGT-01` | `BKL-012`, `P-16` |
| `P-42` | **`ENT-002` numa mina abandonada** — reskin de cristal ou inimigo próprio? A lore do Ato II sustenta Sentinelas em qualquer lugar, mas o bestiário do Ato II nunca foi definido | `AGT-02` | `BKL-011`, `P-38` |
| `P-43` | 🔴 **Remover a trava "chefe de área" de 07 → 08.** Ela pertence a 08 → 09, onde já existe como "retorno após chefe". O chefe é do LVL-08 (arena aberta, chefe médio); LVL-07 não tem chefe na ficha; e um chefe não tranca a entrada da própria sala. **Se recusada, LVL-07 precisa de chefe próprio e é refeito** | `Proprietário` | `BKL-011`, LVL-07, LVL-08 |
| `P-44` | **O setor mais vazio do jogo se sustenta por 7–10 min?** LVL-07 tem 5 inimigos em 134 tiles, 0 armadilha obrigatória, 0 trava e 0 habilidade. Se o playtest reprovar, a saída é **uma** seção de plataforma no Coro — não encher a catedral. Inclui `AST-008` sem catálogo | `AGT-02` | `BKL-012`, Ato II |
| `P-46` | **`ENT-004` não tem catálogo.** Faltam `AST-010`, `tm_patio` (`AST-009`), o bestiário do Ato II (`P-42`), ficha de sprite (192×192, 20 frames) e UI de barra de vida para chefe não-final | `AGT-01` | `BKL-012`, LVL-08, LVL-12 |
| `P-47` | **O que é `ITM-007`?** Recompensa de chefe médio. Se for equipamento, duplica o papel de `ITM-004` (LVL-03) e precisa justificar a diferença; se for chave narrativa, precisa aparecer no grafo | `AGT-03` | `BKL-011`, LVL-08 |
| `P-48` | 🔴 **O solver de alcançabilidade não testa modificadores de velocidade.** Ele compara geometria de salto; areia, óleo, gelo ou vento mudam o alcance horizontal e podem tornar impossível um vão que o solver aprova. Enquanto não existir essa verificação, **toda mecânica de piso lento é risco de soft lock** | `AGT-07` | `PAT-LD-06`, `TST-013`, setores 09–16 |
| `P-49` | 🔴 **Teto em `y=0` × plataformas em `y=2`.** Uma plataforma em `y=2` deixa o corpo do herói (2 tiles) com **zero** folga de cabeça: linhas 1 e 2 são o corpo e a linha 0 é o teto sólido. LVL-05 (§4.2–§4.4) e LVL-07 (coro de L07-03) usam `y=2`. Decidir: (a) o ponto mais alto utilizável é `y=3` e essas plataformas sobem 1 tile a menos, ou (b) a sala tem 12 linhas com teto em `y=-1` | `AGT-04` | `PAT-LD-01`, LVL-05, LVL-07, LVL-10 |
| `P-51` | **`HAB-04` não tem catálogo.** Alcance 6 tiles, puxada 900 px/s, salto do gancho 380 px/s + 560 vertical, pendurado abaixo da argola; faltam `ITM-008`, `AST-012`, `UI-13` e o comportamento do gancho em água | `AGT-03` | `BKL-011`, `BKL-012`, LVL-09 |
| `P-52` | **Combate em água não tem regra.** Não existe ficha para inimigo submerso, arma branca submersa nem knockback em fluido. LVL-09 evita a pergunta (L09-03 sem inimigo), mas LVL-11 e LVL-13 vão encontrar | `AGT-03` | `BKL-011`, LVL-09, LVL-11 |
| `P-53` | **`DEC-015` e a ficha de `HAB-03`.** Ratificar a passagem vertical em `y=0` (2 tiles, dois sentidos, 6 tiles acima do piso) e aprovar a ficha: adesão 100 ms, subida 90 px/s, descida 240 px/s, pulo de parede 420+560, só `climbable=true`. Faltam `ITM-009`, `AST-013`, `UI-14` | `Proprietário` | `BKL-001`, `BKL-012`, `DEC-007`, LVL-10, LVL-11 |
| `P-54` | **O poço `10 ↔ 03` é o único atalho entre setores do jogo e não tem ficha.** Definir nome, skin, tempo de transição, se aceita ser usado com bolsa, e se sobrevive a reload. É `PAT-LD-08` fora do escopo original do padrão (que tratava de atalho **dentro** do setor) | `AGT-02` | `PAT-LD-08`, `DEC-005`, LVL-03, LVL-10 |
| `P-55` | 🔴 **A torre acesa é pista ou inconsistência?** Em 10 setores a luz vem de algo que ninguém mantém; em LVL-10 há tochas acesas, arsenal guardado e cama feita. Se for pista narrativa (alguém ainda sobe a torre), precisa entrar no `LOR`; se não, `AGT-01` refaz o setor | `Proprietário` | `BKL-012`, `CEN-077`–`082`, `P-16` |
| `P-56` | **Ficha de `HAB-07` e do estandarte.** Aprovar: descida 120 px/s, horizontal 308 px/s, sem ganho de altura, ativação por segurar no ar. Faltam `ITM-010`, `AST-014`, `UI-15`. A régua de **1.042 px** tem de entrar em `tuning.ts` como valor medido | `Proprietário` | `BKL-001`, `BKL-012`, LVL-11, LVL-12, LVL-13 |
| `P-58` | **Variante `pruning` de `ENT-002`.** É skin de uma Sentinela que poda em vez de patrulhar, ou `ENT-005` com ficha de combate própria? Muda o orçamento de arte de LVL-11 | `AGT-01` | `ENT-002`, LVL-11 |
| `P-59` | 🔴 **O canal de 8 tiles de LVL-09 é atravessável sem o gancho.** Solver: salto duplo correndo = **534 px (8,3 tiles)**; a trava `09 → 10` é um vão de **512 px**. Sobram 22 px. Opções: (a) alargar L09-05 para 11 tiles, (b) aceitar que o gancho ali é conveniência, (c) revisar o alinhamento da argola. **Não corrigido em silêncio** | `Proprietário` | `LVL-09`, `HAB-04`, `P-53` |
| `P-60` | **Ficha de `ENT-005` O Forjador.** Aprovar: 260 HP, fase em 130, `ATK-10` corrente 5 tiles/22, `ATK-11` peça 18 com 1 quique, `ATK-12` onda 20, `leash_x=21`, engaja a 5 tiles no piso. Faltam `AST-015`, `AST-016` (`tm_forja`), `UI-16` | `Proprietário` | `BKL-001`, `BKL-008`, `BKL-012`, LVL-12 |
| `P-62` | **Canonizar a origem dos Distorcidos.** LVL-12 §4.3 revela que eles são montados numa esteira **com uma peça faltando**. Explica `ENT-002` inteiro e sustenta `P-42`/`P-58`, mas é afirmação de lore forte: confirmar com `LOR-03b` antes de `AGT-01` desenhar a esteira | `Proprietário` | `LOR-03b`, `AGT-01`, `P-42`, `P-58` |
| `P-63` | **Ficha de `CEN-096` corrente de ar.** Aprovar: coluna 3×6, subida 140 px/s **só com `HAB-07` ativo**, do piso ao teto sem interrupção, saída por alçapão `DEC-015`. Faltam `AST-017` (`tm_abismo`, ~14 tiles) e `UI-17` | `Proprietário` | `BKL-001`, `BKL-012`, LVL-13 |
| `P-64` | **A queda longa de 3 s.** É a transição mais longa do jogo (todas as outras ≤ 600 ms). Precisa de playtest: 3 s é vertigem ou espera? Alternativas: 2 s, ou queda visível sem fade. Depende de `VIS-009` | `AGT-07` | `VIS-009`, LVL-13 |
| `P-65` | 🟡 **Ratificar `DEC-016` — a metade de código está fechada.** Aprovar: `keys` como contador, portão em `≥ 2`, UI `x / 2` sem terceiro slot. **Resolvido em código em `2026-11-13`:** `throneLocked()` devolve `false`, **nenhuma** sala de LVL-16 tem `locks` e a terceira chave não abre nada — `keys` chega a 3, o HUD continua `2/2` e `ITM-011` fica na bolsa ([`LVL-16.md`](niveis/LVL-16.md) §7.1). Falta só a ratificação. Depende de `P-47` | `Proprietário` | LVL-15, LVL-16, `P-47`, `P-61` |
| `P-66` | **Ficha de `ENT-006` O Comandante.** Aprovar: 320 HP, fase em 160, `ATK-13` estocada 6 tiles/26 só na luz, `ATK-14` lança 7 tiles/24 só na sombra, **desarmado 1.200 ms**, `mobile=false`, `gate=arena`. Faltam `AST-018`, `AST-019` (`tm_fortaleza`), `UI-18` | `Proprietário` | `BKL-001`, `BKL-009`, `BKL-012`, LVL-14 |
| `P-67` | **Luz de contorno na sombra.** O estado `shadow` do `CEN-100` precisa de regra de arte não-ambígua (espessura, cor, distância) para manter **≥ 3:1**. Sem ela, `TST-014` reprova e o setor fica ilegível para parte dos jogadores | `AGT-01` | `VIS-004`, `VIS-009`, LVL-14 |
| `P-68` | **Ficha de `ENT-007` O Guardião Duplo.** Aprovar: **1 entidade, 2 corpos**, 180 HP cada, janela de morte simultânea **4.000 ms**, revivificação infinita com 50%, interrupção a **30 de dano**, `ATK-16` lanterna 4 tiles/20, `ATK-17` selo 6 tiles/12, suspensão **800 ms** com 2 selos. Faltam `AST-020`, `AST-021` (`tm_antesala`), `UI-19` (barra dupla) | `Proprietário` | `BKL-001`, `BKL-010`, `BKL-012`, LVL-15 |
| `P-69` | 🔴 **Ratificar os dois desvios de `PAT-LD-07`.** (a) arena de **30×11** em vez de 24×11; (b) **dois corpos** para um chefe. Se a regra for mantida ao pé da letra, o guardião duplo precisa de outra solução e a luta de equilíbrio desaparece | `Proprietário` | `PAT-LD-07`, LVL-15, LVL-16 |
| `P-70` | **Suspensão: 800 ms é o teto de perda de controle do jogo.** Confirmar o teto, o HUD contável (1/2–2/2) e o comportamento em `reduce_motion`. É o primeiro estado de perda de controle do projeto e vira precedente | `AGT-07` | `VIS-009`, `TST-014`, LVL-15 |
| `P-71` | **Ficha de `ENT-008` O Plantonista.** Aprovar: `damageable=false`, postura **100/125/150** (golpe = 25), **3 baixas**, canal de **3.000 ms** em atordoamento de **4.500 ms** (300 + 3.000 + 1.200), `ATK-19` ronda 18 com zona de 2 tiles, `ATK-20` apito (máx. 2 Sentinelas), `ATK-21` protocolo 22 na janela de 1.400 ms, `leash_x=13`. Faltam `AST-022` (128×192), `AST-023` (`tm_trono`, ~26 tiles), `UI-20` (postura + `BAIXAS n/3`), `VFX-011` (o desgaste) | `Proprietário` | `BKL-001`, `BKL-010`, `BKL-012`, LVL-16 |
| `P-72` | 🔴 **Ratificar `PAT-LD-07` para o chefe final.** Quatro desvios de uma vez: (a) chefe **sem vida** (`damageable=false`); (b) a arena abre por **baixa**, não por 0 HP; (c) **piso destrutível** (`CEN-113`, nunca 3 buracos contíguos, queda com dano 0); (d) **as baixas permanecem na morte** do jogador. Se a regra for mantida ao pé da letra, o sexto chefe não existe | `Proprietário` | `PAT-LD-07`, `MEC-011`, LVL-16 |
| `P-74` | **Contrapeso de LVL-05 não vai para o save.** `LVL-05.md` §8 exige que o contrapeso engatado sobreviva a morte, reload e reentrada. O código mantém o estado na sessão (sobrevive à morte e à troca de sala), mas `MEC-007` não tem campo de mapa. Decidir se o save ganha um bloco `world_state` (e o que mais entra nele: pilares de LVL-03, sumidouro de LVL-04) ou se o contrapeso vira reengatável | `AGT-03` | `MEC-007`, `PAT-C-07`, LVL-05 §8, LVL-04 |
| `P-76` | **`PAL-07` e as outras 15 paletas de setor não existem no código.** A ficha de cada setor pede um acento (`PAL-04`…`PAL-16`), mas `src/game/data/palette.ts` só tem PAL-00/PAL-01 e os setores `[PÓS]` usam `bone`/`stone` emprestados. Decidir entre 16 paletas por setor e uma única com acentos | `AGT-08` | `BKL-012`, `PAT-C-04`, setores 04–16 |
| `P-77` | **O trifório de LVL-07 só é verificável por geometria no E2E.** Em headless (~9 FPS) o ápice amostrado do salto é ~95 px contra 138 px canônicos; o teste entra na boca por posicionamento e prova o "não dispara ao passar" por travessia real. A prova por salto depende de máquina com GPU | `AGT-07` | `TST-013`, `PAT-LD-08`, `P-39` |
| `P-75` | **A galeria de L06-05 tem 18 tiles ou 19?** A ficha da sala (§4, tabela da §8.2) define água em **x = 1–18** — 18 tiles, 1.152 px, 7,2 s a 160 px/s. As §§8.2/8.4 contam **19 tiles**, 1.216 px e 7,6 s. O código segue a ficha (medido no E2E: afogamento em 7,2 s com 6 s de base; chegada com 12,58 s de 20 s). O veredito falha/passa não muda, mas o número de validação está errado em algum dos dois lugares | `AGT-08` | `LVL-06` §4, §8.2, §8.4, `TST-013` |
| `P-73` | **O fim é terminal?** Confirmar que `MEC-012` **encerra** o jogo: sem `newGamePlus`, sem seleção de capítulo, sem retorno ao mapa. Definir a acessibilidade dos créditos (pausa, velocidade 1×/2×, `reduce_motion`) e se o save final permite rever o fim | `Proprietário` | `MEC-012`, `PAT-C-07`, LVL-16 |

### LVL-16 em código (2026-11-13) — o último setor

| ID | Item | Dono | Ação |
|---|---|---|---|
| `P-90` | **`MEC-011` não tem indicador de canal.** O jogador segura `E` por 3.000 ms e não há anel de progresso — só a dica `ATORDOADO · SEGURE E NO POSTO` na barra de postura. Legível, mas o canal é a coisa mais longa que o jogo pede. `UI-21` (anel de canal no mundo) | `AGT-01` | `UI-21`, `P-71`, LVL-16 §5.5 |
| `P-91` | **A suspensão do desgaste (desvio 8) é invisível.** Enquanto o jogador assina, o chão "para" — e ele não tem como saber. A correção é a rachadura **congelar** visivelmente: animação, não lógica | `AGT-01` | `CEN-113`, LVL-16 §13 |
| `P-92` | **`AMB-16` não existe como áudio**, como `AMB-15`. O zumbido, o estalo da rachadura e o trono rangendo são **nomes** no build; o setor é mudo. Mesma dívida de `P-83`/`P-85`/`P-89` — e a que mais custa, porque o último som do jogo é o único que ele promete explicitamente (§7.3) | `AGT-06` | `06-audio` §6.2, `AMB-16` |
| `P-93` | **`BGM-02`/`BGM-04` são toasts, não áudio.** O build anuncia as duas no HUD e nenhuma toca; o fade de 6 s de `MEC-012` e o *ducking* de −20% (§8.3) dependem da camada de som | `AGT-06` | `06-audio` §4, §6.3, LVL-16 §8 |
| `P-94` | **`TST-018` ficou em três ficheiros**: `core/posto.test.ts` (regra), `lvl16.test.ts` (geometria/números) e `tests/lvl16.mjs` (runtime). Falta o teste de `.tmj` que **reprove** grade cujo `opens_on` seja morte (`AGT-07` pediu isso em §11) — depende do pipeline de Tiled (`BKL-012`) | `AGT-07` | `TST-018`, `BKL-012` |
| `P-95` | **`ENT-008` nunca "morre", e o save não tem onde guardar isso.** `postoRendido`/`postoBaixas` vivem na sessão da cena, como o par de LVL-15. Se o jogador sair no meio da luta, a luta recomeça — coerente com `PAT-LD-05` (§10: a 3ª baixa salva ao cruzar a porta), mas é o **mesmo buraco** de `P-74`: `MEC-007` não tem bloco de estado de mundo | `AGT-03` | `MEC-007`, `P-74`, LVL-16 §10 |

> 🟢 **O que o código fechou nesta rodada:** `P-71` (ficha em `tuning.ts` + `core/posto.ts`, com
> `AST-022`/`AST-023` ainda placeholder), **`P-72`** e **`P-73`** nas metades de código, e
> **`P-65`** — a terceira chave **não abre nada** e o Trono **não tem fechadura**.
>
> 🟢 **E o setor 16 é o último:** `AREAS['LVL-17']` não existe, `lvl16.test.ts` afirma isso e
> `LVL-16.md` §4.6 publica a parede leste sólida. Não há próximo setor para abrir.

## Pendências documentais

| ID | Item | Dono | Ação |
|---|---|---|---|
| `D-01` | `docs/GDD.md` consolidado duplica as 13 seções e vai divergir | `AGT-08` | gerar por script ou remover |
| `D-02` | Datas inconsistentes (docs `2026-11-04` × commit `2026-11-11`) | `AGT-08` | normalizar |
| `D-03` | Parâmetros em três lugares (GDD §2.11, `tuning.ts`, design-patterns §4.3) | `AGT-08` | eleger fonte única |
| `D-06` | **`LOR-04` designa duas coisas:** "Estrutura narrativa em 4 atos" (`03-ambientacao` §3.4) e "quadro de aviso" (`04-setores` e os setores 01, 10 e 15). LVL-16 não usa `LOR-04`: usou `LOR-05` (crachá) e `LOR-06` (formulário) | `AGT-08` | renomear os quadros de aviso ou a estrutura de atos, e propagar nos 16 setores |
| `D-07` | **Numeração de `BGM` divergente.** `LVL-04`, `LVL-05` e `LVL-06` gravam `bgm=BGM-04/05/06` nos `.tmj`, mas `06-audio` §4 define **quatro** faixas por distribuição de setor (`BGM-04` é do Trono). Os setores 07–16 seguem a tabela | `AGT-08` | unificar: ou quatro faixas (tabela) ou uma por setor |
| `D-08` | ~~**Aprovação de escopo do Ato III/IV.**~~ **FECHADA em `2026-11-13`.** O proprietário pediu «cheguei ao fim do recorte, podemos prosseguir na construção do restante do jogo»: os treze setores foram postos na progressão (`DEC-047`) e as quinze passagens são medidas por `npm run campanha` (`TST-021`). Nenhum setor ficou de fora | `Proprietário` | — (fechada) |
| `D-05` | `docs/README.md` sem entrada para `design-patterns/` e `agents-ia/` | `AGT-08` | adicionar ao índice |

> 🟢 **`D-04` fechada em `2026-11-13` ao escrever `LVL-16`:** a ação era *marcar* os 13 setores `[PÓS]`, e os 13 estão marcados (`LVL-04` a `LVL-16`). O que resta é **aprovação**, que passou a ser `D-08`.

> 🟢 **`D-08` fechada em `2026-11-13`:** a aprovação veio como pedido de trabalho, não como carimbo — o dono quis o jogo inteiro. O resíduo real não era escopo, era prova: nenhum teste atravessava uma passagem de setor com o gesto do jogador. Isso é agora `TST-021`.

## Como fechar uma pendência

1. A decisão é tomada pelo dono (humano, salvo delegação explícita).
2. `AGT-08` registra em [`DECISOES.md`](DECISOES.md) com data, IDs afetados e consequência.
3. A pendência sai desta tabela e o número é marcado como `FECHADA` no histórico.
4. O documento afetado é atualizado **no mesmo commit**.
