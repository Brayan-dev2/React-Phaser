# Homem Macho — Código

> Primeiro código do projeto: **esqueleto de pastas + dois setores jogáveis (LVL-01 completo e LVL-02 completo)**, em Phaser 3 + React 18 + TypeScript strict.
> O GDD continua sendo a fonte de verdade (`docs/`); este arquivo descreve **o que já está implementado** e como rodar.
> Atualizado em `2026-11-16` (tela inicial completa: abertura, saves, configurações, créditos).

---

## 1. Rodar

```bash
npm install          # Node 20+
npm run dev          # http://localhost:5173
npm run typecheck    # tsc -b --noEmit
npm test             # 609 testes (core puro, itens, senha, fôlego, areia, gancho, garra, planeio, documento, máquina do menu, configuração e saves)
npm run build        # build de produção
```

Smoke test no navegador (precisa do `npm run dev` no ar, noutro terminal):

```bash
npm run menu         # abertura → menu → dificuldade → personagem → jogo → pausa → saves → configurações → créditos → toque
npm run personagem   # UI-12: nome + sete escolhas, prévia, sorteio, easter egg, e a escolha a chegar ao jogo e ao save
npm run historia     # UI-13: a introdução (5 quadros), o `←`, o `S` e a partida a começar a seguir
npm run arte         # as medidas da arte: compara public/assets com src/game/data/arte.json (`--lista` mostra o que produzir)
npm run modelos      # gera os modelos base das folhas em public/assets/modelos (com guias) e sem guias em images/tilemaps
npm run smoke        # boot, MEC-001, pulo, combate, pausa, save, itens, transição
npm run mochila      # UI-07: I abre e pausa, 40 espaços na grelha, prender/soltar, ESC fecha
npm run bau          # UI-07: o baú da sala segura — existe na sala, guarda no save, é um só
npm run morte        # MEC-004: baú a salvo, preso a salvo, simples cai, 30 % das curas, moedas a zero
npm run bolsa        # MEC-004: a bolsa no chão, E recupera, a 2.ª morte destrói a 1.ª, tetos não regridem
npm run bau-ferramentas  # UI-07/DEC-040: mochila à esquerda e baú à direita, ordenar, quantidade, semelhantes, moedas no baú
npm run habilidades  # UI-14/DEC-042: H abre, dez níveis, só o conquistado tem preço, 100→140→196 (+40 %), FALTAM, o salto sobe mesmo, o save leva
npm run drop         # DEC-042: 11 chefes sem drop, a garantia ao 12.º entrega, o contador no save, o painel mostra a rara a nível 1 de 10
npm run mapa         # UI-22/DEC-043/DEC-045: M abre (em jogo e na pausa), a planta do setor, a fenda de L02-02 → L02-06, o que não se viu, o save
npm run porta-senha  # MEC-006/DEC-044: a porta de L02-07 barra, abre, fica aberta, vai para o save — o «loop» que o jogador viu
npm run tiro         # PAT-C-03/DEC-046: o tiro acerta o chefe e o chefe fica em cena — nos seis chefes, até à morte do Guardião
npm run play         # playthrough automático L01-01 → L01-06 ("FIM DO RECORTE")
npm run lvl02        # gate, ITM-003, morte, espinhos cíclicos, senha e vão
npm run lvl03        # chefe, pilares, MEC-009, oferta de MEC-008
npm run lvl04        # Ronda em formação, sumidouro, raiz one-way
npm run lvl05        # Força, bloco, contrapeso e os 3 vereditos do elevador
npm run lvl06        # água por ficha, Fôlego, afogamento sem dano, trava temporal
npm run lvl07        # catedral sem trava, arquitrave one-way, trifório de mão única
npm run lvl08        # areia 0,75×, relógio de âncoras, fases do chefe e grade leste
npm run lvl09        # gancho (puxar, pendurar, saltar), água sem dano e sumidouro
npm run lvl10        # alçapão (DEC-015), escalada 90 px/s, poço entre setores e corda
npm run lvl11        # planeio 120 px/s, vãos de 11/12/13 tiles, queda sem dano e conduto
npm run lvl12        # forja: arena sem trava, 260 HP, pilões defasados e `ITM-011` condicional
npm run lvl13        # abismo: corrente a 140, pano sem altura fora dela e queda longa sem dano
npm run lvl14        # fortaleza: chefe que não anda, eclipse de 8 s e portão de duas chaves
npm run lvl15        # ante-sala: dois corpos, revivificação infinita e suspensão de 800 ms
npm run lvl16        # trono: chefe **sem vida**, três baixas, desgaste e `MEC-012` (o fim)
npm run shots16      # capturas de LVL-16 em docs/capturas/
npm run shots        # capturas em docs/capturas/ (shots03–16: os dezesseis setores)
npm run campanha     # as 15 passagens de setor para setor, com o gesto real (`DEC-047`)
npm run piloto       # o censo do piloto de ampliação de LVL-01, medido no jogo (`DEC-048`)
```

### Controles (`docs/02-gameplay.md` §2.3)

| Tecla | Ação |
|---|---|
| `A` / `D` ou `←` / `→` | mover |
| `SHIFT` | correr (`1,4×`) |
| `ESPAÇO` / `W` | pular (coyote 100 ms + buffer 100 ms) |
| `J` ou clique | atacar |
| `K` | disparar |
| `E` | interagir (placa de lore / salvar no ponto de save) |
| `ESC` | pausar / continuar |

> `DEC-028`: estas teclas **não estão presas no código**. O menu lê `services/settings.ts` e a `GameScene` pergunta por *ações* (`isDown('atacar')`), não por teclas. Remapear em CONFIGURAÇÕES → ATALHOS muda o jogo a sério — e uma tecla pertence a uma ação só (a troca que deixaria outra ação sem tecla é recusada).

---

## 2. Mapa de pastas

Legenda: **[x]** implementado · **[ ]** reservado pelo GDD (§7.3), ainda vazio ou inexistente.

```text
homem-macho/
├── docs/                          # GDD (01–13, DECISOES, PENDENCIAS, niveis/, design-patterns/, playtest/)
│   ├── capturas/                  # [x] telas do recorte geradas por `npm run shots`/`shots03`
│   └── playtest/                  # [x] ROTEIRO-MVP.md: protocolo, formulário e o que fazer com os dados
├── agents-ia/                     # [x] agentes de documentação (fase anterior)
├── ferramentas/                   # [x] comparador-de-salto.html
├── public/assets/                 # [ ] atlas, áudio, tilemaps, fontes — vazio hoje (texturas são geradas em código)
├── tests/                         # [x] E2E (Playwright): smoke, playthrough, lvl02–lvl10, shots, shots03–10
└── src/                           # 9.232 linhas TS/TSX (inclui os 34 arquivos de teste)
    ├── main.tsx                   # [x] ponto único de composição
    ├── App.tsx                    # [x] shell: palco + HUD + overlays + rodapé
    ├── vite-env.d.ts              # [x] tipos do Vite (`import.meta.env`)
    │
    ├── core/                      # [x] TS PURO — sem phaser, sem react, sem window (ADR-01)
    │   ├── types.ts               #     Resources, InputState, PlayerState, Difficulty, Room
    │   ├── movement.ts            #     integração de Euler em passo fixo + ápice de salto
    │   ├── combat.ts              #     escudo → vida → dificuldade → `died`
    │   ├── fsm.ts                 #     PLAYER_TRANSITIONS (idle/run/air/attack/shoot/hurt/dead)
    │   ├── items.ts               #     ITM-001/002/003: teto, sem reduzir, salto duplo
    │   ├── breathe.ts             #     HAB-06: 6 s → 20 s, nado 160/120, `canCross`, dica
    │   ├── password.ts            #     MEC-006: ordem dos 4 glifos, pistas, veredito
    │   ├── password.test.ts       #     senha certa, parcial, ordem trocada, pistas
    │   ├── items.test.ts          #     cura, escudo, teto, item desperdiçado
    │   ├── movement.test.ts       #     138 px / 276 px, taxa de quadros, caminho inválido
    │   ├── combat.test.ts         #     escudo antes da vida, multiplicadores 0,75/1,00/1,25
    │   ├── fsm.test.ts            #     caminhos válidos, `dead`, `hurt`
    │   ├── breathe.test.ts        #     consumo, recarga, afogamento, galeria com e sem HAB-06
    │   ├── glide.ts               #     HAB-07: descida 120, régua horizontal e `canGlide`
    │   ├── glide.test.ts          #     ficha, câmbio (0 px sem altura) e os três vãos
    │   ├── forge.ts               #     ENT-005 + CEN-092: FSM com `trabalhando`, 3 ataques e o metrônomo
    │   ├── forge.test.ts          #     fases, três respostas distintas e pilão defasado
    │   ├── updraft.ts             #     CEN-096 + CEN-095: quem sobe é a corrente, não o pano
    │   ├── updraft.test.ts        #     a conjunção da trava, os 2,74 s e o eco de 700 ms
    │   ├── eclipse.ts             #     CEN-100 + DEC-016: o céu manda, a chave é contador
    │   ├── eclipse.test.ts        #     5/3 → 3/5 sem acelerar, e o portão com 2 e com 3
    │   ├── comandante.ts          #     ENT-006: chefe fixo, um ataque por estado do céu
    │   ├── comandante.test.ts     #     a janela desarmada e a fase que não acelera
    │   ├── duo.ts                 #     ENT-007: um chefe, dois corpos, janela de 4 s
    │   └── duo.test.ts            #     `MEC-009` exige os dois, e a suspensão tem teto
    │   ├── drop.ts                #     DEC-042: chance + contador + garantia do drop raro de chefe
    │   ├── drop.test.ts           #     a garantia entrega ao 12.º, o contador não estoura, `rng` torto não dá prémio
    │   ├── mapa.ts                #     DEC-043: a planta do mapa (BFS sobre as saídas), atalhos, estados, save
    │   └── mapa.test.ts           #     nenhuma sala sobreposta, teto sobe/piso desce, órfãs, `conhecida` ≠ `visitada`
    │
    ├── game/                      # [x] Phaser
    │   ├── config.ts              #     createGameConfig — 1280×720, FIT, CENTER_BOTH, pixelArt
    │   ├── PhaserGame.tsx         #     PAT-C-06: 1 instância por montagem, destroy(true) no unmount
    │   ├── EventBus.ts            #     canal único React ↔ Phaser (só dados serializáveis)
    │   ├── data/
    │   │   ├── tuning.ts          #     TODO número de jogo (DEC-014): TILE 64, 220 px/s, 560, 1100…
    │   │   ├── palette.ts         #     PAL-00/PAL-01 — nenhuma cor fora daqui
    │   │   └── levels/
    │   │       ├── index.ts       #     registro de áreas + `nextArea()` (PAT-C-10)
    │   │       ├── lvl02.ts       #     [x] 8 salas (L02-01 … L02-08), grade do documento
    │   │       ├── lvl02.test.ts  #     gate, 3 vãos, beco, fragmento, senha, saídas
    │   │       ├── lvl02.doc.test.ts #  grade do código × grade publicada
│   │       ├── lvl03.ts         #     [x] 4 salas; L03-02 é a arena com `breakables`
│   │       ├── lvl03.test.ts    #     arena de 24, 1 chefe, 2 pilares de 2 tiles, saídas
│   │       ├── lvl03.doc.test.ts #  grade do código × grade publicada
│   │       ├── lvl04.ts         #     [x] campanha: 5 salas, glifos `= T v N V` e a Ronda
│   │       ├── lvl04.test.ts    #     5 salas, 6 inimigos (0·1·3·1·1), raízes, sumidouro
│   │       ├── lvl04.doc.test.ts #  grade do código × grade publicada
│   │       ├── lvl05.ts         #     [x] campanha: 5 salas, Força, bloco, placa e elevador
│   │       ├── lvl05.test.ts    #     7 inimigos, X em L05-04, trava de espaço, U único
│   │       ├── lvl05.doc.test.ts #  grade do código × grade publicada
│   │       ├── lvl06.ts         #     [x] campanha: 5 salas, água por ficha, Fôlego, cristais
│   │       ├── lvl06.test.ts    #     5 salas, 2 volumes de água, X = Fôlego, trava temporal
│   │       ├── lvl06.doc.test.ts #  grade do código × grade publicada
│   │       ├── lvl07.ts         #     [x] campanha: 5 salas, arcos, vitral, trifório, sem trava
│   │       ├── lvl07.test.ts    #     134 tiles, 5 Sentinelas, 0 trava, vão de 8 tiles
│   │       ├── lvl07.doc.test.ts #  grade do código × grade publicada
│   │       ├── lvl08.ts         #     [x] campanha: 6 salas, areia, âncoras e o Alferes
│   │       ├── lvl08.test.ts    #     144 tiles, 4 tempos de areia, arena plana, vão de 448 px
│   │       ├── lvl08.doc.test.ts #  grade do código × grade publicada
│   │       ├── lvl09.ts         #     [x] campanha: 6 salas, água, argolas — HAB-04 cai de chefe (`DEC-042`)
│   │       ├── lvl09.test.ts    #     140 tiles, zero plataformas, vão de 8 tiles, sem `X`: a rara cai de chefe
│   │       ├── lvl09.doc.test.ts #  grade do código × grade publicada
│   │       ├── lvl10.ts         #     [x] campanha: 5 salas, hub, alçapão — HAB-03 cai de chefe (`DEC-042`)
│   │       ├── lvl10.test.ts    #     110 tiles, zero plataformas, alçapão de 6 tiles, parede
│   │       ├── lvl10.doc.test.ts #  grade do código × grade publicada
│   │       ├── lvl11.ts         #     [x] campanha: 5 salas, três vãos, jardim — HAB-07 cai de chefe (`DEC-042`)
│   │       ├── lvl11.test.ts    #     140 tiles, vãos 11/12/13, zero plataforma e argola
│   │       ├── lvl11.doc.test.ts #  grade do código × grade publicada
│   │       ├── lvl12.ts         #     [x] campanha: 6 salas, forja, chefe opcional e pilões
│   │       ├── lvl12.test.ts    #     144 tiles, gate none, esteira, ITM-011 condicional
│   │       ├── lvl12.doc.test.ts #  grade do código × grade publicada
│   │       ├── lvl13.ts         #     [x] campanha: 6 salas, corrente, eco e queda longa
│   │       ├── lvl13.test.ts    #     150 tiles, conjunção da trava, dois alçapões
│   │       ├── lvl13.doc.test.ts #  grade do código × grade publicada
│   │       ├── lvl14.ts         #     [x] campanha: Ato IV, eclipse, chefe alto e portão
│   │       ├── lvl14.test.ts    #     144 tiles, drift 0, keys ≥ 2 e o eclipse que para
│   │       ├── lvl14.doc.test.ts #  grade do código × grade publicada
│   │       ├── lvl15.ts         #     [x] campanha: corredor de portas, o par e o silêncio
│   │       ├── lvl15.test.ts    #     160 tiles, 2 corpos, 6 lacres e `BGM-03`
│   │       ├── lvl15.doc.test.ts #  grade do código × grade publicada
│   │       ├── lvl16.ts         #     [x] campanha: **o último setor** — 134 tiles, o posto, o trono
│   │       ├── lvl16.test.ts    #     chefe **sem `hp`**, 3 baixas, 15 golpes, desgaste sem dano
│   │       ├── lvl16.doc.test.ts #  grade do código × grade publicada
    │   │       ├── lvl01.ts       #     [x] 6 salas em grid de texto (L01-01 … L01-06)
    │   │       ├── lvl01.test.ts  #     larguras, teto/piso, um único `S`, saídas, escada, itens
    │   │       └── lvl01.doc.test.ts #  grade do código × grade publicada em LVL-01.md
    │   ├── scenes/
    │   │   ├── BootScene.ts       #     [x] texturas procedurais (pedra, ator, props)
    │   │   ├── PreloadScene.ts    #     [x] ponte sem asset externo
    │   │   └── GameScene.ts       #     [x] a cena jogável: colisão, salas, save, HUD 10 Hz
    │   ├── entities/
    │   │   ├── Player.ts          #     [x] coyote/buffer/pulo variável, ataque, tiro com cooldown
    │   │   └── Sentinel.ts        #     [x] ENT-002: patrol → telegraph → lunge → recover
    │   ├── systems/
    │   │   ├── InputBuffer.ts     #     [x] janela de intenção (`has` não consome)
    │   │   └── LevelBuilder.ts    #     [x] grid de texto → tiles, atores, props, saídas
    │   │                          #     (`Y` = porta de senha: sólida até a senha ceder — `DEC-044`)
    │   ├── state-machines/        # [ ] a FSM do MVP vive em `core/fsm.ts`
    │   └── constants/             # [ ] consolidado em `data/tuning.ts`
    │
    ├── ui/                        # [x] React — não importa `game/`
    │   ├── components/
    │   │   ├── Hud.tsx            #     VIDA/ESCUDO/PODER + sala + botão de pausa
│   │   ├── BossBar.tsx        #     VIS-007: barra do chefe, `progressbar` + `aria-live` da fase 2
│   │   ├── BreathBar.tsx      #     HAB-06: barra de fôlego, só submerso, alerta < 34 %
│   │   ├── SessionReport.tsx  #     relatório de sessão + botão `COPIAR JSON` (playtest)
    │   │   ├── PasswordPanel.tsx  #     MEC-006: 4 glifos em SVG, sem limite de tentativas
    │   │   └── Overlays.tsx       #     pausa, lore, oferta de MEC-008, "FIM DO RECORTE"
    │   ├── screens/               # [ ] telas completas ficam para o Vertical Slice
    │   └── hooks/                 # [ ] nenhum hook próprio necessário ainda
    │
    ├── store/
    │   └── uiStore.tsx            # [x] Context + assinatura do EventBus + ESC de retorno
    │
    ├── services/
    │   ├── save.ts                # [x] localStorage `homem-macho/save/v1`, revisão monotônica
    │   ├── auth/  api/  i18n/     # [ ] fora do MVP
    │   └── (analytics)            # [ ] fora do MVP
    │
    ├── types/                     # [ ] vazio: tipos por camada vivem junto do código que os usa
    └── styles.css                 # [x] tokens da paleta + HUD/overlays
```

---

## 3. Contratos entre camadas (`ADR-01`, `docs/design-patterns/08-padroes-de-codigo.md` §8.0)

| Regra | Como o código garante |
|---|---|
| `core/` não conhece Phaser nem React | só imports relativos entre arquivos de `core/`; coberto por tipos |
| `ui/` não importa `game/` | `ui/` importa apenas `store/uiStore`, que fala com `game/EventBus` |
| Comunicação só por `EventBus` serializável | payloads são objetos literais (números, strings, arrays) |
| `EVT-002` a ≤ 10 Hz | `GameScene.update` publica só quando `time - lastHudAt > 100` |
| Nenhum número mágico fora de `data/` | `TILE`, `MOVE`, `PLAYER`, `SENTINEL`, `SPIKE` vêm de `tuning.ts` |
| `PAT-C-06` (ciclo de vida) | `PhaserGame` cria 1 `Phaser.Game` por montagem e chama `destroy(true)` |
| Base 1280×720, DPR ≤ 2 | `config.ts` + `scale: FIT, CENTER_BOTH` |

### Eventos em uso — nomes do §7.5 (`DEC-019`)

| ID | Evento | Payload | Origem → destino |
|---|---|---|---|
| `EVT-001` | `scene:ready` | `{ key }` | `GameScene` ao montar a sala |
| `EVT-002` | `game:resources` | `{ hp, shield, power }` | `GameScene` a 10 Hz |
| `EVT-003` | `game:inventory` | `{ slotsUsed, pinnedCount }` | coleta de item permanente |
| `EVT-004` | `game:death` | `{ areaId, recoverable }` | morte |
| `EVT-005` | `ui:pause` | `{ paused }` | UI (`ESC`) ↔ `GameScene` |
| `EVT-006` | `ui:settings` | `{ music, sfx, reducedMotion }` | declarado, ainda sem emissor (áudio é pós-MVP) |
| `EVT-007` | `save:result` | `{ ok, revision?, errorCode? }` | `services/save.ts` |
| `EVT-008` | `game:completed` | `{ scope }` | fim do recorte |
| `EVT-009` | `ui:inventory-command` | `{ action, itemId? }` | declarado, mochila do MVP é só leitura |

**Extensões locais** (fora do §7.5, declaradas no `EventBus`): `game:room {id,name,index,total,area}` para rótulo/contador, `game:toast {text}` para aviso sem estado, `game:text {lines,hold} | null` para `LOR-04`, `game:password {open}` / `game:password-hint {kind,index}` / `ui:password {symbols}` para a porta de senha (`MEC-006`) e — desde LVL-03 — `game:boss {name,hp,max,phase,defeated} | null` (barra do chefe, `VIS-007`), `game:difficulty-offer {from,to} | null` e `ui:difficulty {difficulty}` (`MEC-008`), mais `game:metrics {…}` (relatório de sessão, `DEC-022`). Registradas em `DEC-019`/`DEC-022`; nenhuma substitui um `EVT`.

`game:completed` (`EVT-008`) sai **uma única vez** por partida: `finishSlice()` tem guarda de idempotência própria, além da guarda de `MEC-009` na morte do chefe.

---

## 4. O que já roda (recorte do MVP: LVL-01 a LVL-03)

- **Tela inicial (`UI-01` → abertura → `UI-02` → `UI-04`)** — `docs/04` §4.2.1:
  - **abertura**: área da arte em **parallax reservada** (ecrã inteiro, vazia) + "PRESSIONE QUALQUER BOTÃO", com **0 canvas** — o `Phaser.Game` só nasce quando se escolhe entrar;
  - **menu**: `JOGAR` · `CONTINUAR` (só com save) · `CONFIGURAÇÕES` · `CRÉDITOS`; **nada começa focado** (1.º `Enter`/`↓` escolhe, 2.º confirma) e um gesto tem uma só consequência;
  - **dificuldade** (`UI-04`) embutida, com a consequência escrita e gravada no save;
  - **criação de personagem** (`UI-12`, §4.2.2): **nome** escrito à mão (até 12 caracteres; escrever `Macho` aplica o easter egg — moicano · azul · furioso · maromba · pele clara — e `Alucard` outro — cabelo longo branco, presas de vampiro, corpo magro, pele pálida), cabelo (7), cor do cabelo (7), rosto (4), expressão (5), tatuagem/cicatriz (6), **corpo** (magro · atlético · forte · maromba · gordo) e **tom de pele** (7, com o `pálida`), com **prévia** em SVG (placeholder declarado), `R` para sortear e `Esc` a voltar à dificuldade sem perder a escolha. O personagem **vai para o jogo** (o `BootScene` desenha a textura `player` a partir dele) e **para o save** (`CONTINUAR` devolve o mesmo herói);
  - **três slots de save** (`DEC-027`): `CONTINUAR` lista os saves com *área · sala — nome · n/total · vida · escudo · dificuldade · data*; slot vazio não é escolhível; partida nova ocupa o primeiro vazio (ou o mais antigo, e o painel diz qual); **retomar grava no mesmo slot**;
  - **configurações** (`DEC-028`): tipo de controle (teclado / teclado+rato / **toque**), atalhos remapeáveis, som geral, música, efeitos, **legendas**, movimento reduzido, idioma (PT-BR; a linha avisa que EN-US entra com os textos) e restaurar padrões — tudo gravado em `localStorage` e aplicado na hora;
  - **créditos**: `DAVID CREATOR · DESENVOLVIMENTO`;
  - **saídas**: `UI-06` "SAIR PARA O MENU" e `UI-10` "VOLTAR AO MENU"; ambas **gravam antes de desmontar** o canvas (`ui:persist`);
  - **toque**: com o tipo `toque` ligado, oito botões HTML emitem `ui:input` e a cena os trata como teclas;
  - **legendas**: `game:subtitle` põe em texto dano, morte e checkpoint (§4.6);
  - **`?skip=menu`** continua a porta de serviço de todo o E2E;
  - medido por `npm run menu` em `docs/capturas/MENU-01`…`MENU-10`.

- **Dezesseis áreas jogáveis** em grid de texto, 90 salas, encadeadas por `nextArea()` — a porta dourada de L03-04 entra em LVL-04 e o jogo só acaba no trono de L16-06 (`DEC-047`).
- **LVL-03 · `ENT-003`**: chefe de 200 HP com FSM pura em `core/boss.ts` (entrada → idle → telegraph → investida → recuperação, mais `golpe-area`, `atordoado`, `transicao-fase` e `morte`). Telegraph 800 ms (600 na fase 2), investida de 5 tiles a 520 px/s, dano 20 antes da dificuldade, recuperação 1000 ms (800 na fase 2).
- **LVL-03 · `ATK-03` (pilares)**: dois pilares de 2 tiles em L03-02; a investida que os atinge **quebra o pilar e atordoa o chefe por 1200 ms** — a janela de perícia do setor.
- **LVL-03 · `MEC-009`**: a saída da arena fica trancada até o chefe cair; a morte do chefe abre a saída, avisa e salva **uma vez só** (`shouldProcessDeath`).
- **LVL-03 · `MEC-008`**: 3 mortes na arena → oferta recusável de um degrau mais fácil (difícil → médio → fácil); aceitar aplica 0,75× no dano.
- **LVL-03 · itens**: `ITM-004` em L03-03 vai para a bolsa da sessão (1 slot) — não entra no save (`P-28`).
- **Checkpoint da arena** (`DEC-012`): entrar em L03-02 grava o checkpoint; morrer devolve à arena com o chefe em 200 HP.
- **LVL-04 · Bosque das Cinzas** (Ato II, na campanha desde `DEC-047`): 5 salas (30·40·40·20·24), em `AREA_ORDER` logo depois de LVL-03 — a porta dourada de L03-04 é a entrada. Implementado: raiz one-way `=` (8 em L04-02), árvore morta `T` em `decor-back`, cinza caindo `v` (`CEN-031`), inscrições `N` (`LOR` do Ato II), **A Ronda** com 3 Sentinelas em formação (`patrol_sync`, `core/patrol.ts`) e o **sumidouro de cinza** `V` (`CEN-034`): `E` na grade de L04-05 volta para L04-01 (2,3), de mão única e sem salvar.
- **LVL-05 · Cripta das Engrenagens** (Ato II): 5 salas (20·30·30·24·20), na campanha — a saída é o **elevador de L05-03**, não a última sala. Implementado: engrenagem-plataforma `=` (one-way), dentes `A` (`CEN-001` reskin), engrenagem gigante `W` girando a 2 rpm, óleo `o` sem dano, **`HAB-05` Força** (`ITM-005`, permanente e reaplicada na remontagem — `TST-005`), **bloco pesado** que só cede com Força (1 tile por empurrão a 60 px/s), **placa de contrapeso** (`CEN-043`) que engata e não desengata (§8) e o **elevador de engrenagem** `U` com três vereditos: falta Força → falta contrapeso → sobe.
- **LVL-06 · Mina Esquecida** (Ato II): 5 salas (20·30·24·30·20), na campanha. Implementado: **água por retângulo da ficha da sala** (§3) com retângulos em depth 16/17, **natação universal** (160/120 px/s, gravidade desligada), **`HAB-06` Fôlego** (`ITM-006`, 6 s → 20 s, permanente e reaplicada na remontagem — `TST-005`), **afogamento sem dano** (fade de 300 ms e volta à entrada da sala), HUD de fôlego só submerso, cristais `V` animados como única luz, escora `t` em `decor-back`, estacas `A` **cíclicas** e o glifo `X` reinterpretado como item de Fôlego pela sala (`DEC-023`).
- **LVL-07 · Catedral Oca** (Ato II): 5 salas (40·30·24·20·20 = **134 tiles**), na campanha. É o único setor **sem trava, sem habilidade e sem chefe**: 5 Sentinelas, nenhuma armadilha obrigatória. Implementado: **arcos de costela** `R` (`CEN-061`) desenhados uma vez por grupo e sempre cortados pelo teto, **vitral** `v` (`CEN-060`) como peça única (a rosácea de L07-05 é 2×5 tiles), **bancos** `b` (`CEN-063`), velas `c`, arquitraves one-way `=`, lascas `A` cíclicas só em L07-02 e o **trifório** `T` (`CEN-070`): passagem de mão única que entra por contato (`mode: 'touch'`, nunca por `E`) e sai em L07-01 (3,4) — destino declarado na ficha da sala (`Room.sink`).
- **LVL-07 · o glifo é da sala**: `R` (arco), `v` (vitral) e `T` (trifório) são reinterpretados por `Room.glyphs` — os mesmos símbolos são item de Fôlego, cinza de LVL-04 e árvore morta noutros setores (`DEC-023`).
- **LVL-06 · a trava é um cronômetro**: a galeria de L06-05 tem 18 tiles de água (1.152 px): 7,2 s a 160 px/s contra 6 s base — o E2E afoga em 7,2 s e, com `HAB-06`, chega na porta com 12,58 s de 20 s.
- **Instrumentação de playtest** (`core/metrics.ts`, `DEC-022`): tempo por sala/setor, mortes, tentativas de senha, itens, mudanças de dificuldade e **TTK do chefe** — publicados por `game:metrics`, mostrados no painel `FIM DO RECORTE` com botão `COPIAR JSON` e guardados em `localStorage['homem-macho/playtest/v1']`. Nada sai da máquina.
- **LVL-02 · `MEC-005`**: o fragmento `ITM-003` de L02-05 dá o salto duplo, que **sobrevive à morte** (`TST-005`) e destrava o gate de 3 tiles de L02-02 e a fenda do teto.
- **LVL-02 · `MEC-006`**: porta de senha com painel de 4 glifos; erro não abre, não pune e não gasta tentativa; acerto destranca a saída leste.
- **LVL-02 · `CEN-001` cíclico**: 1,2 s ativo / 1,2 s inativo, com pares defasados em 0,6 s e telegraph de 300 ms.
- **Queda em vão** (`DEC-011`): volta para a entrada da sala com fade de 300 ms, sem dano.
- **Troca de sala in-place** (`mountRoom`): sem `scene.restart`, então o teclado e as assinaturas de evento sobrevivem à transição (`DEC-020`).
- **Movimento (`MEC-001`)**: 220 px/s, corrida 1,4×, salto de 138 px medidos, coyote 100 ms, buffer 100 ms, corte de salto variável.
- **Combate**: ataque corpo a corpo (20 de dano, 78 px) e tiro (10 de dano, 620 px/s, pool de 10); escudo antes da vida (`MEC-003`).
- **Sentinela (`ENT-002`)**: patrulha 3 tiles, telegraph 800 ms, avanço, recuperação 1.000 ms — o dano só existe no avanço.
- **Espinhos**: 20 de dano + respawn no checkpoint.
- **Itens**: `ITM-001` cura +20 em L01-04 e `ITM-002` escudo +10 em L01-05, com teto e sem reduzir recurso (`core/items.ts`). `ITM-003` (salto duplo) está implementado no jogador e no `LevelBuilder` (glifo `j`), mas **não entra em LVL-01** — `DEC-008`/`DEC-010` colocam o fragmento em LVL-02.
- **Save (`MEC-007`)**: quarto seguro em L01-05, `E` no ponto de save grava `localStorage` com revisão monotônica.
- **Pausa (`EVT-005`)**: `ESC` pausa a cena; `ESC`/`ENTER` ou o botão retomam.
- **UI**: HUD reativo, texto de lore, "FIM DO RECORTE" ao sair da última sala.

### Medições do smoke test (Chromium headless)

| Verificação | Resultado |
|---|---|
| erros de console / `pageerror` | **0** |
| deslocamento em 1 s de caminhada | **205–224 px** (= `MEC-001`; a amostragem varia com os ~9 FPS do headless) |
| ápice do salto | **138 px** (= teste unitário `movement`) |
| ataque + tiro | sem erro, estado volta a `idle` |
| `ESC` → painel → `ESC` | pausa e **retoma** |
| `E` no ponto de save | revisão **1 → 2**, 243 bytes no `localStorage` |
| transição L01-01 → L01-02 | HUD passa a `L01-02 · Ensina mover` |
| `ITM-001` (vida 55) | **75** — +20 e escudo intocado |
| `ITM-002` (escudo 20) | **30** — +10 e vida intocada |
| `ITM-003` (mesma sequência de teclas) | **128 px → 266 px** de ápice |
| playthrough automático | 6 salas de LVL-01 em **109 s** (eram 45 s antes de `DEC-048`), 7 pulos, 100 HP, **entrou em LVL-02** |
| LVL-02 · gate sem `HAB-01` | **110 px** de ápice — não alcança os 192 px da plataforma |
| LVL-02 · gate com `HAB-01` | **212 px** — passa (headless a ~9 FPS; a 60 Hz o duplo mede 276 px, folga de 84 px) |
| LVL-02 · `TST-005` | fragmento → `doubleJump=true`; morte → respawn em L02-01 **mantendo** a habilidade |
| LVL-02 · `TST-006` | ordem errada: porta fechada + aviso na posição 1; ordem certa: `eastOpen=true` |
| LVL-02 · vão de L02-06 | 100 HP antes e depois, volta ao spawn (x=90) |
| LVL-01 → LVL-02 | atravessar a porta dourada muda a área e o HUD para `L02-01 · Transição` |
| LVL-03 · chefe | 200 HP, 2 pilares × 4 zonas de colisão, barra `GUARDIÃO DA PASSAGEM — 100%` |
| LVL-03 · saída trancada | `eastOpen=false` na arena mesmo com `+` na coluna final |
| LVL-03 · dano no chefe | 3 golpes de 20 → **140 HP** (barra 70%) |
| LVL-03 · dano do chefe | investida acertando o jogador: 100 → **80** (20 × 1,00) |
| LVL-03 · pilar | investida no pilar → `atordoado`, **0/4 zonas vivas**, **1144–1333 ms** de aturdimento |
| LVL-03 · morte do chefe | `eastOpen=true`, barra some, `O GUARDIÃO CAIU` **1 vez** mesmo com 2 golpes extras |
| LVL-03 · `ITM-004` | coletado → `bag: ["ITM-004"]` |
| LVL-03 · `MEC-008` | 3 mortes → painel de oferta; aceitar → `difficulty: easy`, dano 20 → **15** |
| LVL-03 · conclusão | `game:completed {scope:'mvp'}` **1 vez** + painel `FIM DO RECORTE` |
| LVL-03 · relatório de sessão | `game:metrics` com `{attempts:1, wins:1, ttkMs:1681}` e painel `RELATÓRIO DA SESSÃO` renderizado |
| LVL-04 · glifos novos | L04-01: 1 sumidouro de chegada, 12 árvores, 4 emissores de cinza, 1 inscrição |
| LVL-04 · raiz `=` | 8 plataformas one-way; o jogador **pousa em `y=272`** e não cai para o piso (448) |
| LVL-04 · A Ronda | 3 Sentinelas, **mesma direção em 14 amostras** (formação preservada) |
| LVL-04 · sumidouro | `E` em L04-05 → L04-01 em `x=160`, cai 3 tiles, **0 de dano**, checkpoint 0 (não salva) |
| LVL-04 · `arrival_only` | pousar em (2,3) **não** teleporta de volta |
| LVL-04 · `PAT-C-10` | com a flag off, sair de L03-04 emite `game:completed` **1 vez** e não entra em LVL-04 |
| LVL-05 · bloco sem Força | coluna **não muda** (3 → 3) — exposição 1 de `PAT-LD-03` |
| LVL-05 · `ITM-005` + morte | `strength: false → true`; depois da morte **continua `true`** (`TST-005`) |
| LVL-05 · empurrar | **13 → 14 → 15 → 16 → 17**, contrapeso **engatado** na placa |
| LVL-05 · contrapeso | depois de morrer, **continua engatado** (estado de mapa, §8) |
| LVL-05 · elevador | sem Força → "FALTA FORÇA"; com Força sem contrapeso → "FALTA CONTRAPESO"; com os dois → "O ELEVADOR SOBE" |
| LVL-05 · dentes `A` | **20 de dano** (escudo antes da vida, `MEC-003`) |
| LVL-06 · água da ficha | L06-04 `{16..28, y3..y6}` e L06-05 `{1..18, y4..y6}`; L06-01–03 sem volume |
| LVL-06 · item de Fôlego | `X` em L06-04 → `ITM-006`; fôlego **6.000 → 20.000 ms** |
| LVL-06 · `ITM-006` + morte | depois da morte **continua** `breath: true` e máximo **20.000 ms** (`TST-005`) |
| LVL-06 · galeria com 6 s | **afoga em 7,2 s**, hp/shield **150 → 150** (sem dano) e volta à entrada da sala (`x≈90`) |
| LVL-06 · galeria com 20 s | **atravessa** e alcança a porta com **12.580 ms** de fôlego; não afoga |
| LVL-06 · fora d'água | fôlego volta a **6.000 ms** cheios e a barra some do HUD |
| LVL-07 · a nave | 9 arcos (8 no ritmo de 4 tiles), 1 vitral, 2 bancos, 1 Sentinela, **0 plataformas** |
| LVL-07 · arquitrave `=` | plataforma one-way: o herói pousa no topo (y=272 = topo + 16) e **não** cai para o piso |
| LVL-07 · lascas `A` | 2 células cíclicas, **40 de dano** no total (escudo antes da vida) |
| LVL-07 · rota reta | **0 sólidos** na linha de caminhada das 5 salas — nenhuma trava |
| LVL-07 · trifório ao passar | andar sob a boca **não teleporta** (fica em L07-05) |
| LVL-07 · trifório ao entrar | leva a **L07-01 (x=224)**, queda de 3 tiles, **hp 150 → 150** |
| LVL-07 · `arrival_only` | a chegada em (3,4) **não** devolve o jogador para L07-05 |
| LVL-08 · areia no chão | velocidade **0,75×** (132 px/s andando) e hp **150 → 150**: a areia atrasa, não fere |
| LVL-08 · areia no ar / fora dela | **1,00×** — o multiplicador só vale com os pés na areia |
| LVL-08 · monta-carga lacrado | antes da vitória a alavanca responde **"O CABO ESTÁ SEM CARGA."** e não troca de sala |
| LVL-08 · grade oeste | fecha quando o herói passa de **x ≥ 3 tiles**; andando 1,4 s para oeste ele para em **x≈82** e **não** atravessa |
| LVL-08 · relógio da areia | **1 âncora → 2 âncoras** (6 sprites de areia), teto de **4** em x=5·10·15·20 |
| LVL-08 · fases do Alferes | **240 → 120** entra em `transicao-fase` (fase 2) e só depois em `lunge`/`ATK-06` |
| LVL-08 · morte do chefe | **1 processamento** ao chegar a 0 HP (`MEC-009`), grade leste abre e a areia zera |
| LVL-08 · morte do herói na areia | âncoras **3 → 0** e o piso volta a **1,00×** (a areia não sobrevive à morte) |
| LVL-08 · `ITM-007` | existe na ficha, mas o objeto só aparece com `bossDefeated` |
| LVL-09 · água da galeria | submerso consome fôlego (`4358 ms` de 6000 em 0,6 s) e **afogar não dá dano**: hp **150 → 150** |
| LVL-09 · sem o gancho | o canal de 8 tiles devolve à entrada da sala (**x=680 → x=90**), sem dano e sem trocar de sala |
| LVL-09 · casa de bombas | `abilities.hook` **false → true** ao encostar no `ITM-008` |
| LVL-09 · puxar e pendurar | `Q` leva de **x=620** à argola em **x=928**, estado `pull → hang`, corpo **abaixo** dela (y=342) |
| LVL-09 · salto do gancho | de pendurado até **x=1355** (21 tiles): 380 px/s horizontal **+** impulso vertical (§6.3) |
| LVL-09 · sumidouro | `interact` em L09-06 devolve a **L09-01 em x=608** e o checkpoint **não muda** (§8.1) |
| LVL-09 · rato | vagueia 2 tiles e o hp do herói ao lado **não muda** (`CEN-075` não ataca) |
| LVL-09 · fôlego da escada | nadar 2,2 s consome **5592 → 3255 ms** e o herói avança para leste |
| LVL-10 · alçapão lacrado | tocando o teto por baixo, a **sala não muda** — o buraco existe no desenho e não na física |
| LVL-10 · poço sem a garra | responde **"O POÇO NÃO TEM ONDE SEGURAR. AINDA."** e o jogador continua em LVL-10 |
| LVL-10 · parede sem a garra | `climb === "none"`: parede comum e parede de ganchos só diferem para quem tem `ITM-009` |
| LVL-10 · arsenal | `abilities.climb` **false → true** ao encostar na garra |
| LVL-10 · a subida | aderência em **~100 ms**, 6 tiles a 90 px/s e o alçapão dispara a transição no teto |
| LVL-10 · alçapão sem a garra | **"O ALÇAPÃO ESTÁ FORA DE ALCANCE."** e a sala continua a mesma |
| LVL-10 · corda do sino | L10-03 → L10-01 em **x=1120**, checkpoint **0 → 0** (atalho não salva) |
| LVL-10 · poço com a garra | **cruza setores**: chega a **LVL-03** (o primeiro atalho de longa distância) |
| LVL-11 · a orla | **0 plataformas, 0 argolas**, 1 Sentinela, 2 flora, 1 estátua sem rosto, 1 flor e 1 trepadeira |
| LVL-11 · o estandarte | `abilities.glide` **false → true** em L11-02; o item fica em x=5 e o vão começa em x=9 (`DEC-010`) |
| LVL-11 · no chão | segurar o salto **não** abre o pano (`gliding false`) e andar continua **220 px/s** |
| LVL-11 · no ar | `gliding true`, `vy` nunca passa de **120** e o herói **não sobe um pixel** |
| LVL-11 · soltar | 120 → **505 px/s** no mesmo instante, sem cooldown |
| LVL-11 · vão de 11 t sem o pano | cai, respawn na entrada, **hp 150 → 150** (`DEC-011`) |
| LVL-11 · vão de 11 t com o pano | **pousa em x=1.327**, do outro lado dos 704 px |
| LVL-11 · a trava de 13 t | **pousa em x=1.724** — os 832 px do vão mais largo do jogo |
| LVL-11 · jogável | salto + duplo no ápice + pano cruza os vãos de 11 **e** de 13 tiles à primeira |
| LVL-11 · conduto | L11-05 → L11-01 em **x=96**, checkpoint **0 → 0** (atalho não salva) |
| LVL-12 · arena | **nenhuma grade**, 2 pilões em x=7/17, `ENT-005` a **260 HP** e a saída aberta (§8) |
| LVL-12 · travessia | (1,6) → x=**1.462** em **4,45 s** com o chefe **intacto** a 260 HP — o custo é vida, não permissão |
| LVL-12 · peça em brasa | voa entre `piso−127` e `piso−17`, desloca **400 px** e não segue o salto (`ATK-11`) |
| LVL-12 · pilões | defasagem **0 / 3.000 ms**, tiram **25** de uma vez e **sobem e ficam** quando o chefe morre |
| LVL-12 · morte na arena | jogador morre (`deaths 0 → 1`), respawn em L12-05 e o chefe volta a **260 HP** |
| LVL-12 · `ITM-011` | **ausente** com o chefe vivo, **presente** em L12-06 depois de `MEC-009` |
| LVL-12 · calha | L12-06 → L12-01 em **x=96**, checkpoint **0 → 0** (atalho não salva) |
| LVL-12 · esteira | 13 tiles em L12-03, **sem colisão**: o jogador parado em cima não anda (Δ = 0 px) |
| LVL-13 · sem o pano | dentro da coluna sobe os **70–84 px** de um salto e volta: `updraft false`, `gliding false` |
| LVL-13 · com o pano | a corrente sustenta **-140 px/s** com a gravidade desligada e `updraft true` |
| LVL-13 · fora da coluna | o pano desce com **vy ≤ 120** e **não sobe um pixel** — a régua de LVL-11 intacta |
| LVL-13 · alçapão B | L13-04 → **L13-05** em x=288: a beira alta, **a trava 13 → 14** |
| LVL-13 · alçapão A | L13-04 → **L13-01** em x=288: a boca do poço, e o checkpoint **não** muda |
| LVL-13 · queda longa | **2,47 s** até a troca de sala (3 s com o fade de volta), **hp 150 → 150**, checkpoint no destino |
| LVL-13 · `reduce_motion` | a mesma queda em **0,65 s** |
| LVL-13 · eco | fantasma **700 ms atrás**, `alpha 0.3`, `depth 6`, 7 marcas no setor |
| LVL-14 · o chefe | `drift 0`: ele **não muda de `x`** nem com o jogador a correr de um lado ao outro |
| LVL-14 · o céu sozinho | `luz` → `sombra` em 5 s **sem chefe na sala**: o relógio não é da FSM |
| LVL-14 · o chefe obedece | na sombra ele passa por `sombra`→`telegraph-lanca`→`lanca`→`desarmado`; na luz, `estocada` |
| LVL-14 · a fase 2 | dispara em **160 HP**, inverte o ciclo (3/5) e a grade quebra na morte |
| LVL-14 · o eclipse para | morto o chefe, o relógio congela onde estava — o céu não reinicia |
| LVL-14 · o portão | `0/2` e `1/2` barram (1 corpo na coluna 15); `2/2` e `3/2` passam |
| LVL-15 · dois corpos | os dois nascem com **180 HP** e a **10 tiles** um do outro, e a grade fecha |
| LVL-15 · um corpo só | o caído fica em `queda`, o outro canaliza e **a grade continua fechada** |
| LVL-15 · revivificação | a janela de 4 s devolve **90 HP**; **quatro** interrupções seguidas deixam o caído com 0 |
| LVL-15 · os dois | `MEC-009` processa, os dois corpos viram `morte` e a grade cede |
| LVL-15 · selos | **1 selo não suspende**; **2 suspendem 724 ms** (teto de 800 no `tuning`) |
| LVL-15 · porta de serviço | L15-06 → **L15-01**: a única porta que abre, e ela dá para trás |
| LVL-16 · o chefe | `'hp' in plantonista === false`: a postura vai **100 → 75 → 50 → 25 → 0** e ele **não morre** |
| LVL-16 · o atordoamento | 4 golpes → `atordoado`; passados 4.500 ms ele volta **inteiro (100)** e com **0 baixas** |
| LVL-16 · a baixa | segurar `E` 3.000 ms no posto assina **1 baixa** e a postura passa a **125** |
| LVL-16 · a morte | `onPlayerDeath()`: **baixas 1, postura 125** — o formulário não se desassina |
| LVL-16 · o protocolo | 3 golpes em ≤ 4 s abrem a janela de 1.400 ms; bater nela **não muda a postura** |
| LVL-16 · o desgaste | piso racha e cede, **nunca 3 contíguos**, e `hp 100 → 100` |
| LVL-16 · a rendição | 3ª baixa → `rendido`, grade abre, `MEC-009` **nunca** roda |
| LVL-16 · o fim | parede leste sólida, `MEC-012` processa **uma vez** e o crachá sai com 3 linhas |
| testes unitários | **477 em 53 arquivos** (`vitest run`) |
| build de produção | app **35,4 KB gzip** + React **45 KB** + Phaser **340 KB** em chunk separado (§7.11: JS inicial < 500 KB) |

### Limites conhecidos

- **Texturas procedurais**: são placeholder (`BootScene` desenha tudo em `Graphics`); o pipeline de arte (`public/assets/`) é fase posterior.
- **FPS**: não é medível com honestidade neste ambiente — o Chromium headless renderiza por software (~9 FPS) e o `TimeStep` do Phaser entra em cool-down. O smoke test zera `loop._coolDown` para medir velocidade. A meta de ≥ 55 FPS (§7.11) precisa de uma máquina com GPU.
- **Playthrough automático é um bot**, não playtest humano: ele anda e pula, não avalia ritmo, leitura de ameaça nem prazer. Aprovado como *atravessável*, não como *divertido*.
- **O bot só percorre LVL-01**: LVL-02 tem backtracking, gate e senha e LVL-03 tem chefe com telegraph — coisas que um bot de "andar e pular" não resolve. Os setores são validados por asserções por trecho (`npm run lvl02`, `npm run lvl03`), não por travessia contínua.
- **O TTK do E2E não é TTK de jogo**: o teste mata o chefe com 999 de dano para fechar a rota, então mede ~2 s. O número válido sai de sessão humana — por isso a instrumentação existe (`docs/playtest/ROTEIRO-MVP.md`).
- **O relatório não julga**: ele conta tempo, mortes e TTK. Se o jogador entendeu o gate, se o pilar foi descoberto, se a fase 2 pareceu injusta — só o moderador registra.
- **Medição do gate depende da taxa de quadros**: em headless (~9 FPS) o ápice amostrado é 212 px porque o segundo salto é apertado com atraso; a 60 Hz o valor canônico é 276 px (`core/movement.test.ts`).
- **Arte do chefe e dos pilares é procedural**: o sprite de `ENT-003` e o pilar em 2 estados são desenhados em `BootScene`; o pilar "rachado" do `CEN-021` depende da arte final (`P-16`).
- **O último chefe do jogo não tem vida, e isso está no tipo, não no comentário.** `Plantonista` não declara `hp`; `core/posto.ts` não devolve dano; não existe `takeHit` para ele. Quem "consertar" isso dando HP ao `ENT-008` reprova `core/posto.test.ts` e `lvl16.test.ts` de uma vez — e transforma o sexto chefe no primeiro outra vez (`TST-018`).
- **`MEC-011` e `CEN-113` brigavam por aritmética, e o desgaste perdeu.** O canal pede 3.000 ms parado; o chão abre um buraco em 2.000 ms. Enquanto o jogador **assina**, o desgaste não avança (desvio 8 de `LVL-16` §13). Sem isso a única janela que o jogador abre sozinho no jogo inteiro ficava fechada por soma.
- **`canSign` (começar) e `canHold` (continuar) são funções diferentes.** A folga de 1.200 ms decide **quando se pode começar** a assinar, não onde um canal em curso é cortado: quem começa aos 300 ms termina aos 3.300. Confundir as duas fez o primeiro canal do build nunca completar.
- **LVL-15 é o único chefe que fica *menos* agressivo ao perder.** Um corpo caído não é morte: o outro **recua** e preenche um formulário por 4 s. Se alguém acrescentar "fase 2 furiosa" aqui, a luta vira "mate um devagar" e perde o único ensinamento que tem — que é **não matar um de cada vez**. E o setor é o anti-eco de LVL-13: o abismo devolvia o som do jogador em 700 ms, a ante-sala não devolve nada.
- **LVL-14 é onde as chaves viram chaves, e onde a chave a mais não abre nada.** `DEC-016` no motor é uma linha de contagem (`KEY_ITEMS.filter(...)`), não um inventário novo — e a UI mostra `3 / 2` de propósito. O portão de duas fechaduras só é desenhável porque os dois chefes obrigatórios são obrigatórios: se um deles deixar de dar chave, o jogador que pulou LVL-12 fica preso (`PAT-LD-06`, `TST-015`).
- **LVL-13 fecha o Ato III e a invariante que o sustenta**: quem sobe é a corrente, não o pano. `HAB-07` continua descendo a 120 px/s e sem ganho de altura em todos os doze setores anteriores — `updraftVelocity(true, true, false) === 0` é testado em `updraft.test.ts` e em `lvl13.test.ts`, e o E2E mede `vy ≤ 120` fora da coluna com o pano aberto. Se alguém inverter isso, os vãos de LVL-11 passam a ser subidos de baixo para cima.
- **LVL-12 é o primeiro setor que não dá nada**: `LVL12_META.grants = null` e o kit fecha em LVL-11. Ele existe para cobrar combate, não geometria — e o chefe **não tranca a porta** (`FORJADOR.gate = 'none'`). Se alguém puser uma grade na arena, os testes `lvl12.test.ts` falham: o setor inteiro é a afirmação de que a forja não tem porta.
- **LVL-11 tem duas saídas e uma é um atalho**: a leste de L11-05 segue para LVL-12 (a progressão) e o conduto devolve a L11-01 (o atalho). O `npm run campanha` prova a primeira com `KeyD`; `lvl11.mjs` prova a segunda.
- **O planeio é um teto de queda, não um impulso**: `body.setMaxVelocityY(120)` e não `setVelocityY(120)` por frame — um teto por frame deixa a queda escapar para ~143 px/s em ecrãs lentos e o vão de 13 tiles deixa de fechar. Está em `DEC-026` e é o desvio 11 de `LVL-11` §12.
- **O pano abre no próprio botão do pulo**: segurar `ESPAÇO`/`W`/`↑` **no ar e na descida**. Subir é pulo, cair é pano — não há tecla nova (`DEC-026`).
- **A régua do planeio é 1.022 px e não os 1.042 do GDD**: a conta honesta inclui as duas subidas (`2 × 560/1100 + 276/120 = 3,32 s`). Nenhum dos três vãos muda de veredito, e a margem do vão de 13 cai de 210 para **190 px** (`P-79`).
- **LVL-10 tem duas portas e nenhuma é a leste**: o alçapão de L10-05 sobe para LVL-11 (a progressão, `HAB-03`/garra) e o poço desce para LVL-03 (o atalho de longa distância, ambos no jogo desde `DEC-047`). A sala final não tem saída leste de propósito.
- **O alçapão entra pela parede**: a grade publicada põe o buraco **sobre** a parede sólida, então o corpo não caberia dentro dele. Quem chega ao topo escalando entra pelo topo da parede — a correção está em `checkTransition` e nas notas de `LVL-10` §12.
- **`BGM-03` não é testável**: não há áudio no build. O quarto seguro é seguro por geometria (zero inimigo, zero armadilha, zero plataforma) e a trilha fica por fazer.
- **A leste de L09-06 cobra `HAB-04`**: sem o gancho a porta não abre — e é a única passagem do jogo que se atravessa **pendurado** (`npm run campanha` passa por ela com o `ITM-008` no kit).
- **Subir parede não é pular (`DEC-049`)**: pendurado numa parede de ganchos, `W`/`↑` **sobe**,
  `S`/`↓` desce e `ESPAÇO` salta da parede. Antes o vertical da escalada era o pulo, e o pulo
  agarrado é o salto de parede — o herói subia aos saltos e o dono chamou-lhe «uma parede». O
  contacto com a parede também passou a ter memória (160 ms), porque subir afasta o corpo dela e
  sem isso a garra largava a meio. **O teste de LVL-10 segurava o pulo e chamava-lhe subida** — é
  a razão de ter passado verde durante todo o bug; hoje mede o gesto e não o destino.
- **O gancho só existe em LVL-09**: `Q` sem `ITM-008` responde "NENHUMA ARGOLA NO ALCANCE." — e a argola não é o único alvo por acaso, é o único **tipo** de alvo (`LVL-09` §6.2).
- **O rato não é entidade**: é decor com tween de 2 tiles. Não colide, não foge, não ataca — é a única coisa viva do jogo que não ataca, e o código reflete isso.
- **A água da galeria não tem superfície seca**: afogar devolve à **entrada da sala** (que também está submersa) com fôlego cheio e sem dano. `P-40` está cumprido; o que não existe é "voltar à superfície" numa sala 90% água.
- **A leste de L08-06 só abre com o Alferes caído**: a porta cobra `boss_defeated`, não uma habilidade — é a única trava do jogo que se paga com uma luta.
- **O relógio da areia não tem emenda no HUD**: as âncoras são visíveis no mundo (`sand_spark`), não na barra — `P-46` decide se ganham indicador.
- **O Alferes é procedural e sem morte canônica**: `ENT-004` cai (`state: 'morte'`) e para, mas a animação de queda é um fade (`P-45` espera a arte).
- **O sol de `CEN-067` é um disco fixo**: não há ciclo, sombra nem calor — é decoração com a leitura certa ("o sol não se move"), não um sistema.
- **A rosácea de L07-05 é a porta leste** e leva a LVL-08; o trifório continua a ser o caminho de volta a L07-01.
- **O trifório não é testável por salto no E2E**: em headless o ápice amostrado é ~95 px (canônico 138 px), então o teste entra na boca por posicionamento e prova o "não dispara ao passar" andando sob ela (`P-77`).
- **A porta leste de L06-05 leva a LVL-07**; a água da galeria não tem superfície seca e o afogamento devolve à entrada da sala.
- **A galeria de L06-05 mede 18 tiles**, não os 19 do §8.2 (1.152 px, 7,2 s). O veredito falha/passa não muda; `P-75` decide o número.
- **A saída de LVL-05 é o elevador de L05-03**, não a última sala: com Força + contrapeso ele atravessa para LVL-06 (`DEC-047`). Sem os dois, continua a só **avisar** qual dos dois falta — e `npm run campanha` mede as duas metades.
- **O contrapeso não vai para o save**: `counterweight` sobrevive à morte e à troca de sala dentro da sessão, mas não ao reload (`P-74`).
- **LVL-03 → LVL-04 é a única passagem que já existia e não se atravessava**: a porta dourada de L03-04 mostrava «FIM DO RECORTE» e devolvia ao menu. Desde `DEC-047` ela **entra** em L04-01 — e o `npm run lvl03` agora mede isso (chegou a `LVL-04 · L04-01`, zero `game:completed`).
- **Os dezesseis setores entram no mesmo bundle**: os dados de nível são módulos estáticos (`AREAS`), e excluir bytes exigiria carregamento tardio por setor. O build inteiro mede 332 kB (89,6 kB gzip) fora o Phaser.
- **Bolsa (`P-28`) vive na sessão**: `ITM-004` não é gravado no save; ao reiniciar a partida a bolsa volta vazia.
- **O relatório de sessão mudou de sítio quando o recorte acabou**: ele vivia dentro do painel «FIM DO RECORTE» e teria desaparecido com ele. `DEC-022` continua de pé — `SessionReport` é agora renderizado pelo `EndScreen`, no trono, depois dos créditos. É por isso que `npm run lvl03` deixou de encontrar `.report` (e passou a dizer porquê) e `npm run campanha` o procura lá.
- **Não há mais feature flags de progressão**: as treze (`FLAGS.lvl04`…`lvl16`) foram removidas em `DEC-047`, e `AREA_ORDER` é a lista literal dos dezesseis. Sobraram em `FLAGS` só as de mecânica ainda não usada (`proceduralChallenges`, `onlineSave`) e as de movimento (`doubleJump`, `run`, `shoot`).

---

## 4.1 O piloto de ampliação (`DEC-048`) — LVL-01 é o molde

O jogo tinha 90 salas de 20–40 tiles (a maior cabia num ecrã de 1280 px), **68 inimigos em 16
setores** e **um** arquétipo comum repetido 68 vezes. O experimento de ampliação ficou contido em
LVL-01 até estar provado — replicar uma receita má por 90 salas é o erro caro.

| | Antes | Depois |
|---|---:|---:|
| Largura das 6 salas | 20·30·20·40·20·20 = **160 tiles** | 60·70·55·90·40·50 = **365 tiles** |
| Corpos no setor | 3 (todas `ENT-002`) | **8**, em 3 arquétipos |
| Travessia contínua | 45 s | **109 s** |
| Arquétipos comuns no jogo | 1 | **3** (`sentinela`, `atirador`, `voador`) |
| Densidade | máx. 3 por sala | **1 por 20 tiles** (razão, não contagem) |

**O que decide o «é bom?»** — e ainda não está decidido: o piloto **não foi jogado por uma pessoa**
(`P-102`). O bot mede existência e distância, não diversão. Se o atirador for injusto em L01-04 ou
o voador não se ler, a correção é no piloto e não nos outros 15 setores.

**As três peças, e onde vivem:**

- `src/core/arquetipos.ts` — **puro**: os três arquétipos, o ciclo `patrulha → aviso → ataque →
  recuperação`, o piso de reação (`REACAO_MINIMA_MS = 300`), as variantes por setor e o censo de
  uma grade. 18 casos em `arquetipos.test.ts`, sem Phaser.
- `src/game/entities/Comum.ts` — o corpo genérico que corre o ciclo puro. A Sentinela **não** foi
  reescrita: ela tem `enableFormation` (`LVL-04` §5.2) e é a que o apito de `ENT-008` chama.
- `Room.variantes` — a sala declara **que letra é que inimigo**. `T` e `V` só são corpos onde a
  sala o diz; em LVL-15 `T` continua a ser porta lacrada e em LVL-16 `V` continua a ser a varanda
  (`DEC-023` aplicada a corpos).

**Contrato dos chefes, desenhado e não implementado:** `07-padroes` §7.11c (`PAT-LD-12`) fixa o
que distingue **mini-boss**, **chefe secreto** e **chefe de arena** — porta que fecha, se cura, se
repete, o que dá. Nenhum dos dois primeiros existe no código; o de arena existe seis vezes.

## 5. Estado da escada de L01-02 (calibração pedida)

Medida no grid, não a olho: os três degraus são **2 tiles de largura**, com **1 tile de vão (64 px)** e **1 tile de subida (64 px)** — `(26–27, y4)`, `(23–24, y5)`, `(20–21, y6)`. O alcance andando é 224 px e o salto sobe 138 px, então a folga é de ~160 px no vão e ~74 px na altura: **não precisa de ajuste**. O `~190 px` do relatório anterior era leitura errada da grade; virou teste (`lvl01.test.ts`) para não voltar.

## 6. Próximos passos

A **campanha está aberta no código** desde `DEC-047`: LVL-01 → LVL-16, **16 setores, 90 salas, 6 chefes**, terminando no trono de L16-06 com o crachá (`MEC-012`). Cada uma das **15 passagens** é medida com o gesto real por `npm run campanha` — sem teleporte e sem atalho de teste. O que ainda não tem prova é o que não é código: playtest humano (`P-01`, `P-27`, `P-29`), arte final (`P-16`) e áudio.

1. **Rodar o playtest** com `docs/playtest/ROTEIRO-MVP.md`: 5 sessões (3 novatos, 1 sem Metroidvania, 1 interno). A instrumentação já entrega tempo por setor, mortes e TTK; o roteiro diz o que perguntar e como transformar os números em decisão. É o caminho para `P-01`, `P-27`, `P-29` e `P-30`.
2. **`P-28`** (bolsa em arena) e **`P-30`** (`ATK-02` aprovado como criação nova) continuam abertas; a segunda trava a arte do `VFX-006`.
3. **Divergência de LVL-02 §7 aberta**: o documento cita 3 Sentinelas, a grade tem 2. Resolver no documento ou na grade, não no código.
4. **Ato II/III/IV — aberto em `DEC-047`**: os **treze** setores estão na progressão e as quinze passagens são medidas por `npm run campanha`. Os cinco moldes estão fechados — habilidade de máquina (`core/machines.ts`, `core/breathe.ts`), sem nada (`LVL-07`), **chefe médio** (`LVL-08`), **habilidade de movimento** (`LVL-09`: `core/hook.ts`) **passagem vertical + hub com atalho entre setores** (`LVL-10`: `core/climb.ts`) e **câmbio altura↔distância** (`LVL-11`: `core/glide.ts`) **chefe opcional + perigo de ambiente com relógio próprio** (`LVL-12`: `core/forge.ts`), **região de vento que dá altura sem tocar na habilidade** (`LVL-13`: `core/updraft.ts`) **um relógio de céu que decide qual arma o chefe tem** (`LVL-14`: `core/eclipse.ts` + `core/comandante.ts`) e **um chefe que são dois** (`LVL-15`: `core/duo.ts`) —; LVL-16 é o **último** e está fechado: o **Trono do Caos**, onde o jogador dá baixa no único chefe que não pode ser morto e **assume o posto** que o quadro de aviso deixou aberto. Depois dele não há setor 17 — `AREAS['LVL-17']` não existe, L16-06 não tem porta leste e `MEC-012` encerra o jogo.
5. `EVT-006`/`EVT-009` ganharem emissor quando existir áudio e mochila com slot.
6. Testes de componente da UI (Testing Library) e E2E formal no Playwright (`test.describe`) em vez dos scripts manuais. A **máquina do menu** (`menuMachine.test.ts`, 34 casos), a **configuração** (`settings.test.ts`) e os **saves** (`save.test.ts`) já são testados sem DOM — o que falta é o resto da UI.
7. **Áudio** (`06-audio`): os volumes já existem na configuração e viajam em `ui:settings`; falta o emissor. **EN-US**: as chaves de texto ainda estão no código (§4.7).

---

## 7. Commit sugerido

O workspace **não é um repositório git** e nada foi enviado ao GitHub. Sugestão de commit único, quando você pedir:

```bash
git checkout -b feat/codigo-mvp-lvl01-03
git add src/ tests/ package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts index.html .gitignore README-CODIGO.md docs/
git commit -m "feat: esqueleto do projeto e recorte jogavel de LVL-01 em Phaser

- arquitetura em camadas (core/game/ui/store/services) conforme ADR-01
- GameScene com 6 salas, movimento MEC-001, combate, ENT-002 e save MEC-007
- HUD e overlays em React falando apenas por EventBus
- itens ITM-001/002 no nivel e ITM-003 no motor
- eventos alinhados a EVT-001..009 (DEC-019) e troca de sala in-place (DEC-020)
- 28 testes (core, itens, dados de nivel e documento) + smoke e playthrough em testes/"
```

`node_modules/`, `dist/` e `tsconfig.tsbuildinfo` já estão no `.gitignore`.
