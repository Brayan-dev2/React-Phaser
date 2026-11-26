# 14. Arte: tilesets e spritesheets — tamanhos e medidas

> [← Anterior: 13. Apêndices](13-apendices.md) · [Interface](04-interface-e-experiencia.md) · [Direção visual](05-arte-e-direcao-visual.md)
>
> **Este documento é executável.** Os números vivem em `src/game/data/arte.json`, o teste
> `src/game/data/arte.test.ts` verifica-os contra o jogo e `npm run arte` compara-os com os PNG que
> estiverem em `public/assets/`. Se este texto e o jogo discordarem, o teste falha.

Resumo do que o jogo espera, em cinco linhas:

| Coisa | Medida | Onde é decidido |
|---|---|---|
| Tile do mundo | **64 × 64 px** | `TILE` em `src/game/data/tuning.ts` |
| Viewport lógico / altura de sala | **1280 × 704 px** = 20 × 11 tiles | `VIEW` em `tuning.ts` |
| Célula do herói | **96 × 128 px** (desenho de 112 de altura, centrado, pés no fundo) | `arte.json` · `AST-001` |
| Hurtbox do herói | **36 × 110 px** — é do `tuning.ts`, **não** da arte | `PLAYER.body` |
| Folha de sprites | grelha de células iguais, **≤ 2048 × 2048 px**, PNG com alfa | `§14.6` |

---

## 14.1 O mundo, em números

Tudo abaixo foi medido no código a correr, não estimado:

| Medida | Valor | Por quê |
|---|---|---|
| Tile | 64 px | `TILE`; divisor de tudo (chão, plataforma, espinho, porta) |
| Viewport | 1280 × 704 | 20 × 11 tiles. **A altura de uma sala é sempre 11 tiles** |
| Largura de sala | 20 / 30 / 40 tiles (1280 / 1920 / 2560 px) | as três larguras das grades de `levels/` |
| Câmara | `zoom` 1, sem escala | o mundo é 1:1 com o ecrã lógico — nada de arte "pequena que depois cresce" |
| Escala no ecrã | `FIT` + `CENTER_BOTH` | a 1280×720 a escala é **1.000**; em ecrãs outros o canvas estica (ver §14.7) |
| Canvas CSS em jogo | 1280 × 694 | o rodapé da UI come 26 px; o jogo continua lógico a 704 |
| Gravidade / salto | 1100 px/s² · impulso 560 | altura de salto ≈ **142 px** (2,2 tiles) — orçamento das poses de salto |
| Corrida | 220 px/s (308 com `SHIFT`) | 8 frames a 12 fps = um ciclo de passada em 0,66 s |
| Ataque | alcance 78 px · altura 74 px · ativo 140 ms | a célula tem de ter **folga lateral** para o golpe caber (é por isso que a célula é 96 e não 40) |
| Dano recebido (`iframes`) | 900 ms | a animação de dano pode repetir/piscar sem parecer bug |

Regra de ouro: **a arte não define a colisão.** A hurtbox vem do `tuning.ts`; o desenho tem de caber
por cima dela. Um chefe desenhado 20 % maior do que a hurtbox parece injusto (bate antes de tocar);
20 % menor parece quebrado (o golpe atravessa).

---

## 14.2 Tileset

### Especificação

| Item | Valor |
|---|---|
| Célula | **64 × 64 px**, exatamente |
| Margem / espaçamento | **0 px** (nem `padding`, nem `spacing`) |
| Colunas na folha | 8 (as duas folhas atuais; ver tabela) |
| Escala | **1:1**. Nunca desenhar a 32 e "esticar para 64" |
| Fundo | tiles de chão/parede **opacos** (sem alfa); decoração pode ter alfa |
| Formato | PNG-32 (RGB + alfa) ou PNG-8 com transparência — **sem entrelaçamento** |
| Costura | cada tile tem de **continuar** no vizinho: a borda de baixo do chão é a mesma da laje seguinte |

### As folhas

| ID | Ficheiro | Folha | Tiles | O que tem de estar lá |
|---|---|---|---|---|
| `AST-004` | `tm_ruinas.png` | **512 × 192** | 24 | chão (3 variações), parede, canto sup./inf. esq. e dir., plataforma, topo de parede, interior de parede, bloco quebrável |
| `AST-005` | `tm_armadilhas.png` | **512 × 64** | 8 | espinho estático, espinho cíclico (2 fases), base do espinho, porta, moldura da porta, placa de senha, 2 reservas |

Cada setor (`LVL-01`…`LVL-16`) acrescenta o seu tileset com a **mesma grelha**: um ficheiro novo no
manifesto, célula 64×64, 8 colunas. Nada no código depende de ordem de tiles: o significado vem do
glifo da grade (`#`, `=`, `^`…) que já está documentado em `levels/lvlNN.ts`, não do índice do PNG.

### Ordem de desenho (não é sugestão — é o que o código já faz)

| Camada | `depth` no jogo | O que entra |
|---|---|---|
| fundo de setor | 1 | `bg_setor` (parallax estático) |
| decoração de trás | 2 | árvore, vitral, sino, estátua, sol |
| cenário que o jogador atravessa | 3–4 | vidro, vinha, areia |
| chão e plataformas | 8 | tiles de colisão |
| objetos interativos | 10–14 | placa, elevador, alavanca, item |
| blocos quebráveis | 13 | pilar, bloco |
| **herói** | **20** | sempre à frente de tudo menos a UI |

---

## 14.3 Spritesheets

### A célula, a área útil e a hurtbox

Três retângulos por personagem. Confundi-los é o erro que faz o sprite "flutuar":

```
┌───────────────────────────┐  ← célula (o que o .png mede): 96×128
│                           │
│      (folga: golpe,       │
│       cabelo, efeito)     │
│   ┌───────────────────┐   │  ← área útil: onde o desenho pode viver
│   │                   │   │
│   │   desenho         │   │
│   └───────────────────┘   │
│   █████ hurtbox █████     │  ← hurtbox (tuning.ts), encostada ao fundo
└───────────────────────────┘
      âncora: base-centro
```

- **Âncora `base-centro`**: os pés do desenho tocam o **fundo** da célula e o corpo está centrado na
  horizontal. O `Player` calcula o offset do corpo a partir do tamanho do frame
  (`(width − 36) / 2`, `height − 110`) — qualquer célula funciona **se** esta regra for respeitada.
- **Nada de "saltar" entre frames**: o ponto de contacto dos pés é o mesmo em todos os frames da
  mesma folha; se variar, o herói treme a andar.
- **Folga à frente**: o ataque alcança 78 px para lá do corpo. Numa célula de 96 px, isso é o golpe
  caber na célula — na de 40 px que o placeholder usa hoje, não caberia.

### Tabela completa

| ID | Personagem | Ficheiro | Célula | Área útil | Hurtbox (jogo) | Cols | Frames | Folha |
|---|---|---|---|---:|---:|---:|---:|---|
| `AST-001` | **Herói** (o criado no menu) | `spr_player.png` | 96 × 128 | 96 × 112 | 36 × 110 | 8 | 32 | **768 × 512** |
| `AST-002` | **Sentinela** (`ENT-002`) | `spr_sentinel.png` | 96 × 128 | 48 × 80 | 44 × 78 | 8 | 20 | **768 × 384** |
| `AST-003` | Chefe `ENT-003` | `spr_ent003.png` | 192 × 192 | 192 × 176 | 160 × 176 | 6 | 32 | **1152 × 1152** |
| `AST-003b` | `ENT-004` Alferes | `spr_ent004.png` | 192 × 192 | 192 × 176 | 128 × 160 | 6 | 32 | **1152 × 1152** |
| `AST-003c` | `ENT-005` O Forjador | `spr_ent005.png` | 192 × 192 | 192 × 176 | 128 × 160 | 6 | 32 | **1152 × 1152** |
| `AST-003d` | `ENT-006` Comandante | `spr_ent006.png` | 192 × 192 | 192 × 176 | 128 × 160 | 6 | 32 | **1152 × 1152** |
| `AST-003e` | `ENT-007` Guardião Duplo | `spr_ent007.png` | 128 × 128 | 128 × 112 | 96 × 112 | 6 | 28 | **768 × 640** |
| `AST-003f` | `ENT-008` Plantonista | `spr_ent008.png` | 128 × 192 | 128 × 192 | 96 × 176 | 5 | 20 | **640 × 768** |

> A sentinela tem célula de 96×128 mas desenho de 48×80: a folga é para a **antecipação**
> (`telegraph` de 800 ms) e o recuo do golpe. O corpo dela continua a ser 44×78.

### Ações, frames e fps (o que cada folha contém)

| Personagem | Ações (frames @ fps) |
|---|---|
| Herói | `parado` 4@10 · `corrida` 8@12 · `salto` 2@10 · `queda` 2@10 · `ataque` 5@12 · `disparo` 3@12 · `dano` 2@10 · `morte` 6@8 |
| Sentinela | `ronda` 6@10 · `telegraph` 4@10 · `ataque` 4@12 · `dano` 2@10 · `morte` 4@8 |
| Chefes 192×192 | `parado` 4@8 · `andar` 6@10 · `telegraph` 6@10 · `ataque` 6@12 · `dano` 2@8 · `morte` 8@8 |
| Guardião Duplo | `parado` 4@8 · `andar` 6@10 · `telegraph` 4@10 · `ataque` 6@12 · `dano` 2@8 · `morte` 6@8 |
| Plantonista | `parado` 4@8 · `postura` 5@8 · `assinar` 5@8 · `morte` 6@8 |

Por que estes fps: `§5.3` fixa **8–12 fps**; abaixo de 8 lê-se como travado, acima de 12 não se
distingue do anterior. As ações de **ataque** ficam a 12 porque têm de casar com os números do
`tuning.ts` (golpe ativo 140 ms, `telegraph` 800 ms / 1000 ms de recuperação) — se a arte correr
mais devagar, o jogador apanha dano numa pose que ainda não começou.

### Como a folha é lida

```
colunas = 8   →   frames 0..7 na 1.ª linha, 8..15 na 2.ª, …
                  preencher da esquerda para a direita, de cima para baixo
                  células que sobram no fim ficam transparentes
```

No jogo, quando a arte chegar:

```ts
// PreloadScene
this.load.spritesheet('player', 'assets/images/spr_player.png',
  { frameWidth: 96, frameHeight: 128 });

// GameScene (uma vez, no create)
this.anims.create({ key: 'player:corrida', frames: this.anims.generateFrameNumbers('player',
  { start: 4, end: 11 }), frameRate: 12, repeat: -1 });
```

E **nada mais muda**: `Player` deriva o corpo do frame, a origem é `(0.5, 1)`, o `depth` é 20. O
desenho procedural de `game/scenes/personagem.ts` fica como *fallback* quando a folha não existe —
é o que mantém o jogo a correr durante a transição.

---

## 14.3.1 Modelos base entregues (`npm run modelos`)

`public/assets/modelos/` tem, desde já, **o esqueleto de todas as folhas** nas medidas deste
documento: 12 peças (herói, sentinela, 6 chefes, itens, projétil, 2 tilesets). Cada modelo traz
grelha, **linha dos pés**, eixo central e o número de cada frame — é a folha de trabalho por cima da
qual a arte se desenha.

As **mesmas figuras sem guias** ficaram em `images/` e `tilemaps/`, com o tamanho exato que o jogo
espera, para servir de referência de escala e de *fallback* enquanto a arte não chega
(`npm run arte` → 12 prontas, 9 a entregar).

Como foram geradas: `ferramentas/gerar-modelos.mjs`, sem dependências (escreve o PNG à mão com o
`zlib` do Node). As poses já variam por ação — `corrida` alterna as pernas, `salto` encolhe e
levanta os braços, `ataque` desenha o arco **dentro da folga lateral da célula**, `morte` cai —
portanto dá para avaliar se o número de frames de cada ação chega **antes** de desenhar o primeiro
traço.

> **Isto não é arte e não é carregado em jogo.** O que está no ecrã continua a ser o desenho
> procedural do `BootScene` (que respeita as escolhas do jogador: pele, cabelo, corpo). Trocar o
> herói pela folha agora seria um retrocesso — a cor escolhida no menu desaparecia.

### O que muda quando a arte final substituir o modelo

| Passo | Onde | Detalhe |
|---|---|---|
| 1 | `PreloadScene` | `this.load.spritesheet('player', 'assets/images/spr_player.png', { frameWidth: 96, frameHeight: 128 })` |
| 2 | `GameScene.create` | uma animação por ação, na ordem do manifesto (`player:corrida` = frames 4…11) |
| 3 | `BootScene` | deixa de gerar a textura `player` **se** já existir (`this.textures.exists('player')`) |
| 4 | **customização** | o herói criado no menu tem pele/cabelo/corpo — a folha única tem de preservar isso (ver abaixo) |

**O ponto 4 é a decisão em aberto mais importante** e é anterior à arte, não posterior: uma folha
única não sabe que o jogador escolheu pele escura e moicano azul. Duas saídas possíveis, ambas
compatíveis com as medidas deste documento:

- **A. Tintura + camadas**: corpo base neutro (cinza) numa folha, cabelo numa folha separada, e o
  jogo pinta as duas com `setTint` a partir das escolhas. Uma folha a mais por cabelo (7 peças
  96 × 128 × frames) e a pele por tintura.
- **B. Variações desenhadas**: uma folha de herói por combinação de pele (7) — inviável com cabelo
  e corpo a variar.

Recomendação: **A**. Muda apenas a contagem de ficheiros (uma peça `spr_player_cabelo.png` por
penteado), não as células — portanto as medidas deste documento ficam válidas.

## 14.3.2 Folhas de personalização (`UI-12`)

O herói é configurado antes da partida (nome, cabelo, rosto, expressão, marca, corpo, pele —
`docs/04` §4.2.2). Para a arte poder substituir a prévia em SVG e o desenho procedural, cada
**grupo** precisa da sua folha de variantes, na mesma célula do herói.

| ID | Ficheiro | Célula | Variantes | Folha | O que tem de estar lá |
|---|---|---|---|---|---|
| `AST-012` | `spr_pers_corpos.png` | 96 × 128 | **5** | 480 × 128 | magro · atlético · forte · maromba · gordo (ombro/tronco/cintura/altura do `character.ts`) |
| `AST-013` | `spr_pers_cabelos.png` | 96 × 128 | **7** | 672 × 128 | curto · moicano · coque · longo · raspado · franja · cacheado |
| `AST-014` | `spr_pers_rostos.png` | 96 × 128 | **4** | 384 × 128 | quadrado · oval · angular · redondo |
| `AST-015` | `spr_pers_expressoes.png` | 96 × 128 | **5** | 480 × 128 | séria · furiosa · sorriso · cansada · grito |
| `AST-016` | `spr_pers_marcas.png` | 96 × 128 | **6** | 576 × 128 | nenhuma · cicatriz no olho · cicatriz na boca · tatuagem no braço · tatuagem no peito · pintura |
| `AST-017` | `spr_pers_dentes.png` | 96 × 128 | **2** | 192 × 128 | normais · presas de vampiro (`ALUCARD`) |
| `AST-018` | `spr_pers_peles.png` | 32 × 32 | **7** | 224 × 32 | paleta: amostra base + canto com a sombra |
| `AST-019` | `spr_pers_cores_cabelo.png` | 32 × 32 | **7** | 224 × 32 | paleta: preto · castanho · loiro · ruivo · grisalho · branco · azul |
| `AST-020` | `spr_pers_exemplos.png` | 96 × 128 | **3** | 288 × 128 | herói completo: **padrão · `MACHO` · `ALUCARD`** |

Regras destas folhas:

| Regra | Por quê |
|---|---|
| **A ordem das variantes é a de `services/character.ts`.** O teste compara id a id (`CATALOGO` × `GRUPOS`). | Quem desenha e quem escreve o catálogo não podem contar coisas diferentes. |
| **Célula 96 × 128, como o herói** — menos as paletas (32 × 32). | São peças do mesmo corpo: quando entrarem, encaixam no mesmo frame e na mesma hurtbox. |
| **Cabelo, rosto, expressão, marca e dentes em *close* de cabeça** nos modelos base. | Um penteado a 96 px de altura total não se distingue de outro. Na arte final, cada folha volta a ser o herói inteiro — o *close* é do modelo de conceito. |
| **Não animam.** São alternativas, não sequência: o fps não se aplica (o teste ignora-as na janela 8–12 fps). | Trocar de cabelo não é uma animação; tratá-la como tal daria um herói a "piscar" entre penteados. |

Modelos base já gerados: `npm run modelos` → `public/assets/modelos/modelo_spr_pers_*.png`
(com grelha e número da variante) e as mesmas folhas sem guias em `public/assets/images/`.

**Como a arte final encaixa no jogo** (e o que ainda falta decidir): as folhas acima são a matéria
prima. O herói desenhado no ecrã terá de **combinar** quatro escolhas ao mesmo tempo (corpo + cabelo
+ rosto + pele). As duas saídas continuam a ser as do §14.3.1 — **A)** corpo neutro numa folha e
cabelo noutra, com `setTint` a partir das escolhas; **B)** variações desenhadas. A diferença é que
agora a opção A tem a lista exata das folhas que precisa: 1 corpo ×5 variantes, 1 cabelo ×7, 1 rosto
×4, 1 expressão ×5, 1 marca ×6, 1 dentes ×2 — as paletas são dados (`character.ts`), não arte.

## 14.3.3 Restante do corpo — partes da mesma silhueta

Além do corpo completo e da cabeça, o pacote tem folhas de trabalho para as partes abaixo do
pescoço. **Isto não acrescenta escolhas ao menu.** O jogador continua a escolher um único `CORPO`;
essa escolha seleciona a mesma célula em todas as folhas: `0 = magro`, `1 = atlético`, `2 = forte`,
`3 = maromba`, `4 = gordo`. Não existe combinação independente de braço de maromba com perna de
magro.

| ID | Ficheiro | Célula | Variantes | Folha | Ampliação de leitura |
|---|---|---|---|---|---|
| `AST-021` | `spr_pers_torsos.png` | 96 × 128 | **5** | 480 × 128 | 1,55× — tronco + pescoço |
| `AST-022` | `spr_pers_bracos.png` | 96 × 128 | **5** | 480 × 128 | 1,35× — par, ombro ao pulso |
| `AST-023` | `spr_pers_maos.png` | 96 × 128 | **5** | 480 × 128 | 3,20× — par de mãos |
| `AST-024` | `spr_pers_pernas.png` | 96 × 128 | **5** | 480 × 128 | 1,25× — par, quadril ao tornozelo |
| `AST-025` | `spr_pers_pes.png` | 96 × 128 | **5** | 480 × 128 | 2,20× — par de pés |
| `AST-026` | `spr_pers_marcas_corpo.png` | 96 × 128 | **3** | 288 × 128 | 1,45× — nenhuma · braço · peito |

As contas partem de `H = 112 × altura` e dos valores de `CORPOS`, com o corpo atlético como
denominador. Estão implementadas uma única vez em `medidasForma()` no gerador:

| Medida do desenho | Conta |
|---|---|
| ombro | `H × 0,33 × (ombro / 0,94)` |
| peito | `H × 0,29 × (tronco / 0,90)` |
| cintura | `H × 0,23 × ((tronco × cintura) / (0,90 × 0,74))` |
| espessura do braço | `H × 0,075 × (ombro / 0,94)` |
| espessura da perna | `H × 0,085 × (ombro / 0,94)` |

A ampliação multiplica **todas** essas contas pelo mesmo fator dentro de uma folha. Nunca se ajusta
o zoom de uma variante para a fazer caber: isso apagaria a diferença entre os corpos. Na arte final
a 1×, as partes voltam às medidas de `H` acima e montam o herói na célula 96 × 128. As mãos e os pés
são apresentados como pares afastados apenas para leitura; a espessura e a escala continuam medidas.

A folha `spr_pers_marcas_corpo` existe porque as duas tatuagens ficavam pequenas demais no *close*
de cabeça. Os seus três ids são filtrados de `MARCAS`: `nenhuma`, `tatuagem-braco` e
`tatuagem-peito`. Cicatrizes e pintura continuam na folha `spr_pers_marcas`.

**Montagem:** pernas/pés atrás; tronco; braços; mãos; pescoço/cabeça; marcas sobre a pele. Nenhuma
parte tem hurtbox própria — a física continua a ser apenas a caixa 36 × 110 do `tuning.ts`, com a
âncora base-centro do herói. Estas folhas são o inventário de camadas da opção **A** do §14.3.1,
não um segundo esqueleto nem um sistema novo de colisão.

## 14.4 Itens, efeitos e props

| ID | Ficheiro | Célula | Como é desenhado |
|---|---|---|---|
| `AST-009` | `spr_itens.png` | **32 × 34**, grelha 6 colunas (11 itens) | **1:1, sem escala** — meia tile de largura |
| `AST-010` | `spr_spark.png` | **14 × 14**, 4 frames @12 | projétil do disparo (pool de 10) |

Os itens não são esticados: o que medires é o que aparece. Hoje o código desenha-os entre 30×34 e
34×34 — 32×34 é a célula que normaliza todos sem mudar o tamanho que o jogador vê.

**Props de cenário** (vela, estandarte, sino, árvore, vitral…) já existem como textura procedural em
tamanhos medidos: `candle` 22×40, `banner` 40×120, `bell` 192×192, `tree` 96×256, `vine` 32×64,
`rope` 14×224, `statue` 64×128. A regra para os substituir por arte:

> **O que é esticado a N tiles tem de ser desenhado a N × 64 px.** Uma árvore que no jogo ocupa
> 1,5 × 4 tiles tem de vir a **96 × 256**; um vitral de 1 × 5 tiles, a **64 × 320**. Se vier a
> 100×250, o `setDisplaySize` estica-a e o desenho perde a proporção — é o defeito mais comum na
> entrega de arte e o mais difícil de ver num screenshot.

Lista de props e a sua altura em tiles está em `GameScene.buildDecor` (cada `setDisplaySize` diz a
conta). Quando a arte chegar, cada prop passa a ser uma peça do manifesto com a célula exata.

---

## 14.5 Fundos e ecrãs (fora do Phaser)

| ID | Ficheiro | Medida | Onde aparece |
|---|---|---|---|
| `AST-007a/b/c` | `bg_abertura_1..3.png` | **1280 × 720** ×3 camadas | ecrã de abertura (parallax lento → rápido) |
| `AST-008` | `bg_setor.png` | **1280 × 704** | fundo de setor no jogo (= viewport lógico, 20×11 tiles) |
| `AST-011a…e` | `bg_intro_{veu,queda,trevas,soldados,comeco}.png` | **704 × 640** (11 × 10 tiles) | introdução `UI-13`, caixa medida de **716 × 640** |

Os três primeiros são Phaser; os da introdução são HTML/React (uma `<img>` por quadro) — por isso
são ficheiros separados e não uma folha: 5 × 640 empilhados passariam o teto de 2048.

**Não é arte:** a prévia do personagem é SVG gerado das escolhas (`CharacterPreview.tsx`) e o HUD é
HTML/CSS. Nenhum dos dois precisa de PNG.

---

## 14.6 Exportação e ficheiros

| Regra | Valor |
|---|---|
| Formato | **PNG-32** (RGB + alfa) ou PNG-8 com transparência. Sem JPEG, sem WebP no primeiro passo |
| Entrelaçamento | **desligado** (o `IHDR` tem de dizer `interlace = 0`) |
| Escala | 1:1 com o jogo. Sem "2× para depois reduzir" no ficheiro entregue |
| Alfa | não pré-multiplicado (é o que o Phaser e o browser esperam) |
| Atlas | folha única por personagem, **≤ 2048 × 2048**; margem 0 dentro da folha |
| Extrusão | só se a folha for um atlas empacotado: **1 px** de repetição da borda à volta de cada célula |
| Pastas | sprites e fundos → `public/assets/images/` · tilesets → `public/assets/tilemaps/` · atlas empacotados → `public/assets/atlases/` |
| Nomes | `snake_case` com prefixo: `spr_` (personagem/item), `tm_` (tileset), `bg_` (fundo). **O nome do ficheiro é a chave do manifesto** |

---

## 14.7 Pixel art ou ilustração? (decisão que muda as medidas)

O jogo está configurado com **`pixelArt: true`** e `roundPixels: true` (`src/game/config.ts`):
filtragem *nearest neighbour*, pixels alinhados. Isso é ótimo para pixel art e **destrói**
ilustração pintada (fica serrilhada e a tremer quando a câmara anda).

| Família | O que é | O que muda |
|---|---|---|
| **A. Pixel art a 1×** (recomendada para os tiles) | arte desenhada exatamente nos números deste documento | nada. `pixelArt: true` fica como está |
| **B. Ilustração / old school pintado** (para heróis e chefes, ao estilo do `§5.1`) | desenho a 2× (célula 192×256 para o herói) e o motor reduz para metade | `pixelArt: false`, `antialias: true`, e as células do manifesto a 2× (o `frame` dobra, a hurtbox **não**) |

Misturar as duas famílias é possível (tiles pixel + personagens pintados), mas num ecrã a 1:1 nota-se.
**Isto está por decidir** — é a única escolha deste documento que eu não fiz sozinho; qualquer das
duas encaixa, desde que seja a mesma em todos os sprites de personagem.

---

## 14.8 Como saber que encaixa

```bash
npm run arte -- --lista   # o que produzir, com medidas (não falha)
npm run arte              # compara public/assets com o manifesto
npm test                  # 13 casos de medidas (src/game/data/arte.test.ts)
```

O validador diz, ficheiro a ficheiro, `OK` / `falta` / `ERRO` com o tamanho esperado e o obtido, avisa
de PNG sem alfa, entrelaçado, folha acima de 2048 e de PNG que ninguém reivindica (nome trocado).
Sai com código 1 quando algum tamanho está errado — dá para pendurar num CI.

### Checklist antes de dizer "a arte está pronta"

1. A célula é a do manifesto (96×128 herói, 192×192 chefes, 64×64 tiles).
2. Os pés tocam o fundo da célula; o corpo está centrado.
3. A área útil contém a hurtbox com folga à frente, para o golpe.
4. A folha tem a largura = `colunas × célula` e a altura = `linhas × célula`.
5. O número de frames por ação é o da tabela, na ordem em que o jogo os lê.
6. O ponto de contacto dos pés não varia entre frames.
7. Tiles: opacos, sem costura, desenhados a 64×64 (nunca esticados).
8. Props esticados: desenhados a `N × 64`.
9. PNG com alfa, sem entrelaçamento, ≤ 2048².
10. `npm run arte` sem `ERRO`, e `npm test` verde.

---

## 14.9 Pendentes

| Pendente | Por quê |
|---|---|
| Família de arte (pixel ou pintado) — §14.7 | muda a célula dos personagens a 2× e duas linhas do `config.ts` |
| **Combinar as folhas de personalização** (corpo + cabelo + rosto + pele no mesmo frame) | as folhas existem separadas; o `setTint`/camadas do §14.3.1 é que as junta — e essa é a decisão A/B ainda aberta |
| Guardião Duplo: duas folhas ou uma com dois corpos | são dois corpos com vida própria (`ENT-007`); a folha de 128×128 pode servir os dois com tintura |
| Animações das habilidades (`HAB-03` escalar, `HAB-04` gancho, `HAB-07` planar, nadar) | hoje são estado, não animação; entram quando a folha do herói for desenhada |
| Tilesets dos setores 02…16 | um ficheiro por setor com a mesma grelha; hoje só ruínas e armadilhas estão especificados |
| Ícones de bolsa/HUD (`AST-006`, 12 × 64×64) | o HUD é HTML; só precisa de arte quando houver bolsa desenhada |
| Licença/referência de cada asset | `§5.4`: origem própria/IA, verificar direitos antes de publicar |

*Voltar ao [índice da documentação](README.md).*
