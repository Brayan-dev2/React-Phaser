# Pendências Abertas — Homem Macho

> Versão: `0.1.0` · Data: `2026-11-13` · Mantido por `AGT-08`
> Regra: toda pendência tem ID, dono e **o que ela bloqueia**. Sem "bloqueia", não é pendência — é anotação.

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
| `P-22` | Moeda sem sumidouro no MVP (5 por inimigo, sem loja): ou sai do HUD ou ganha uso | Proprietário | `BKL-004` |
| `P-23` | Corrigir `02-gameplay.md` §2.9: multiplicador de dificuldade deve aplicar **antes** do escudo, não depois | `AGT-08` | `BKL-004` |
| `P-24` | Inventário de 40 slots / 20 presos para um MVP com 1 item dropável: reduzir para 8–12 e sem "prender" | Proprietário | `BKL-005` |
| `P-26` | Inimigos derrotados respawnam ao fazer backtracking? Assumido **não** em LVL-02 (senão o retorno sobe de 22 s para ~40 s) | Proprietário | `BKL-011` |
| `P-28` | Regra de misericórdia: bolsa de morte em arena de chefe cai na **entrada da arena**, não no ponto da morte | Proprietário | `BKL-005` |
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
| `P-65` | 🔴 **Ratificar `DEC-016`.** Aprovar: `keys` como contador, portão em `≥ 2`, UI `x / 2` sem terceiro slot. **A segunda metade está resolvida:** a terceira chave **não faz nada** e o Trono **não tem fechadura** ([`LVL-16.md`](niveis/LVL-16.md) §7.1) — `keys` chega a 3, o HUD continua `2/2` e `ITM-011` fica na bolsa. Depende de `P-47` | `Proprietário` | LVL-15, LVL-16, `P-47`, `P-61` |
| `P-66` | **Ficha de `ENT-006` O Comandante.** Aprovar: 320 HP, fase em 160, `ATK-13` estocada 6 tiles/26 só na luz, `ATK-14` lança 7 tiles/24 só na sombra, **desarmado 1.200 ms**, `mobile=false`, `gate=arena`. Faltam `AST-018`, `AST-019` (`tm_fortaleza`), `UI-18` | `Proprietário` | `BKL-001`, `BKL-009`, `BKL-012`, LVL-14 |
| `P-67` | **Luz de contorno na sombra.** O estado `shadow` do `CEN-100` precisa de regra de arte não-ambígua (espessura, cor, distância) para manter **≥ 3:1**. Sem ela, `TST-014` reprova e o setor fica ilegível para parte dos jogadores | `AGT-01` | `VIS-004`, `VIS-009`, LVL-14 |
| `P-68` | **Ficha de `ENT-007` O Guardião Duplo.** Aprovar: **1 entidade, 2 corpos**, 180 HP cada, janela de morte simultânea **4.000 ms**, revivificação infinita com 50%, interrupção a **30 de dano**, `ATK-16` lanterna 4 tiles/20, `ATK-17` selo 6 tiles/12, suspensão **800 ms** com 2 selos. Faltam `AST-020`, `AST-021` (`tm_antesala`), `UI-19` (barra dupla) | `Proprietário` | `BKL-001`, `BKL-010`, `BKL-012`, LVL-15 |
| `P-69` | 🔴 **Ratificar os dois desvios de `PAT-LD-07`.** (a) arena de **30×11** em vez de 24×11; (b) **dois corpos** para um chefe. Se a regra for mantida ao pé da letra, o guardião duplo precisa de outra solução e a luta de equilíbrio desaparece | `Proprietário` | `PAT-LD-07`, LVL-15, LVL-16 |
| `P-70` | **Suspensão: 800 ms é o teto de perda de controle do jogo.** Confirmar o teto, o HUD contável (1/2–2/2) e o comportamento em `reduce_motion`. É o primeiro estado de perda de controle do projeto e vira precedente | `AGT-07` | `VIS-009`, `TST-014`, LVL-15 |
| `P-71` | **Ficha de `ENT-008` O Plantonista.** Aprovar: `damageable=false`, postura **100/125/150** (golpe = 25), **3 baixas**, canal de **3.000 ms** em atordoamento de **4.500 ms** (300 + 3.000 + 1.200), `ATK-19` ronda 18 com zona de 2 tiles, `ATK-20` apito (máx. 2 Sentinelas), `ATK-21` protocolo 22 na janela de 1.400 ms, `leash_x=13`. Faltam `AST-022` (128×192), `AST-023` (`tm_trono`, ~26 tiles), `UI-20` (postura + `BAIXAS n/3`), `VFX-011` (o desgaste) | `Proprietário` | `BKL-001`, `BKL-010`, `BKL-012`, LVL-16 |
| `P-72` | 🔴 **Ratificar `PAT-LD-07` para o chefe final.** Quatro desvios de uma vez: (a) chefe **sem vida** (`damageable=false`); (b) a arena abre por **baixa**, não por 0 HP; (c) **piso destrutível** (`CEN-113`, nunca 3 buracos contíguos, queda com dano 0); (d) **as baixas permanecem na morte** do jogador. Se a regra for mantida ao pé da letra, o sexto chefe não existe | `Proprietário` | `PAT-LD-07`, `MEC-011`, LVL-16 |
| `P-73` | **O fim é terminal?** Confirmar que `MEC-012` **encerra** o jogo: sem `newGamePlus`, sem seleção de capítulo, sem retorno ao mapa. Definir a acessibilidade dos créditos (pausa, velocidade 1×/2×, `reduce_motion`) e se o save final permite rever o fim | `Proprietário` | `MEC-012`, `PAT-C-07`, LVL-16 |

## Pendências documentais

| ID | Item | Dono | Ação |
|---|---|---|---|
| `D-01` | `docs/GDD.md` consolidado duplica as 13 seções e vai divergir | `AGT-08` | gerar por script ou remover |
| `D-02` | Datas inconsistentes (docs `2026-11-04` × commit `2026-11-11`) | `AGT-08` | normalizar |
| `D-03` | Parâmetros em três lugares (GDD §2.11, `tuning.ts`, design-patterns §4.3) | `AGT-08` | eleger fonte única |
| `D-06` | **`LOR-04` designa duas coisas:** "Estrutura narrativa em 4 atos" (`03-ambientacao` §3.4) e "quadro de aviso" (`04-setores` e os setores 01, 10 e 15). LVL-16 não usa `LOR-04`: usou `LOR-05` (crachá) e `LOR-06` (formulário) | `AGT-08` | renomear os quadros de aviso ou a estrutura de atos, e propagar nos 16 setores |
| `D-07` | **Numeração de `BGM` divergente.** `LVL-04`, `LVL-05` e `LVL-06` gravam `bgm=BGM-04/05/06` nos `.tmj`, mas `06-audio` §4 define **quatro** faixas por distribuição de setor (`BGM-04` é do Trono). Os setores 07–16 seguem a tabela | `AGT-08` | unificar: ou quatro faixas (tabela) ou uma por setor |
| `D-08` | **Aprovação de escopo do Ato III/IV.** Os **13 setores `[PÓS]`** estão marcados, mas **nenhum** tem aprovação do proprietário. É o resíduo de `D-04` | `Proprietário` | fechar antes de qualquer linha de código do Ato III/IV |
| `D-05` | `docs/README.md` sem entrada para `design-patterns/` e `agents-ia/` | `AGT-08` | adicionar ao índice |

> 🟢 **`D-04` fechada em `2026-11-13` ao escrever `LVL-16`:** a ação era *marcar* os 13 setores `[PÓS]`, e os 13 estão marcados (`LVL-04` a `LVL-16`). O que resta é **aprovação**, que passou a ser `D-08`.

## Como fechar uma pendência

1. A decisão é tomada pelo dono (humano, salvo delegação explícita).
2. `AGT-08` registra em [`DECISOES.md`](DECISOES.md) com data, IDs afetados e consequência.
3. A pendência sai desta tabela e o número é marcado como `FECHADA` no histórico.
4. O documento afetado é atualizado **no mesmo commit**.
