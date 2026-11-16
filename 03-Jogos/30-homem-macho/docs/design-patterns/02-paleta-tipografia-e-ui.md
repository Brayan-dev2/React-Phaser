# 2. Paleta, Tipografia e UI

> [← Anterior: 1. Estilo e Identidade Visual](01-estilo-e-identidade-visual.md) · [Próximo: 3. Ambientação e Mundo →](03-ambientacao-e-mundo.md)

## 2.1 Paleta global (`PAL-00`)

Valores herdados do GDD 5.2 — **não alterar sem atualizar o GDD primeiro**.

| Token | Hex | Nome | Uso |
|---|---|---|---|
| `--ink` | `#0B0910` | Tinta | Contorno, V0 |
| `--bg` | `#15131F` | Vazio | Fundo, V1 |
| `--mass` | `#2A2433` | Massa | Volume escuro |
| `--stone` | `#464052` | Pedra | Plataforma, V3 |
| `--bone` | `#E6DFD2` | Osso | Luz, destaque |
| `--threat` | `#D95555` | Ameaça | Dano, perigo, vida |
| `--gold` | `#F2C66D` | Progresso | Ganho, XP, checkpoint, saída |
| `--text` | `#F8F7F2` | Texto | UI |

Semântica fixa — o jogador aprende uma vez e vale para o jogo inteiro:

| Cor | Sempre significa | Nunca significa |
|---|---|---|
| `--threat` | algo que machuca, ou vida perdida | decoração |
| `--gold` | avanço, recompensa, caminho novo | perigo |
| `--bone` | luz e superfície neutra | interativo |

## 2.2 Acento por setor (`PAL-01` … `PAL-16`)

`[SUPOSIÇÃO]` Cada setor tem **um** acento saturado (`VIS-004`). O acento tinge iluminação, partículas e a faixa de BGM visual; nunca a silhueta de inimigo (que é sempre `--threat`).

| ID | Setor (GDD 3.4) | Acento | Hex | Sensação pretendida |
|---|---|---|---|---|
| `PAL-01` | LVL-01 Ruínas da Vigília | dourado poeira | `#F2C66D` | abandono com esperança |
| `PAL-02` | LVL-02 Galeria Partida | água estagnada | `#7FD3C0` | umidade, segredo |
| `PAL-03` | LVL-03 Portão do Guardião | vermelho rito | `#D95555` | confronto |
| `PAL-04` | LVL-04 Bosque das Cinzas | oliva morto | `#A8B26B` | natureza errada |
| `PAL-05` | LVL-05 Cripta das Engrenagens | bronze | `#C98A3E` | máquina antiga |
| `PAL-06` | LVL-06 Mina Esquecida | violeta de cristal | `#8C7BC7` | profundidade |
| `PAL-07` | LVL-07 Catedral Oca | osso iluminado | `#E8E2D2` | silêncio grande |
| `PAL-08` | LVL-08 Pátio Rubro | terracota | `#E0563F` | exposição, calor |
| `PAL-09` | LVL-09 Canais Sombrios | ciano sujo | `#4FA3B8` | claustrofobia |
| `PAL-10` | LVL-10 Torre da Vigília | dourado alto | `#F2C66D` | retorno, domínio |
| `PAL-11` | LVL-11 Jardim Profanado | magenta | `#C76BA6` | beleza errada |
| `PAL-12` | LVL-12 Forja Distorcida | laranja forja | `#FF7A3D` | indústria bruta |
| `PAL-13` | LVL-13 Abismo do Eco | índigo | `#6B5AA6` | vertigem |
| `PAL-14` | LVL-14 Fortaleza do Eclipse | azul-noite | `#5A6BB0` | poder institucional |
| `PAL-15` | LVL-15 Ante-sala do Fim | cinza-osso | `#B9B2A8` | suspensão |
| `PAL-16` | LVL-16 Trono do Caos | vinho | `#7B2E4A` | fim |

`[MVP]` Apenas `PAL-01`, `PAL-02`, `PAL-03` precisam existir. As outras 13 são planejamento.

**Regra de contraste:** todo acento deve atingir ≥ 4,5:1 contra `--bg` quando usado em texto, e ≥ 3:1 quando usado em forma > 24 px. Verificar `PAL-13` e `PAL-16` (os mais escuros) antes de usar em HUD.

**Medido (2026-11-13, ao fechar LVL-16):**

| Acento | vs `--bg` `#15131F` | vs `--bone` `#E6DFD2` | Veredito |
|---|---:|---:|---|
| `PAL-13` índigo `#6B5AA6` | **3,18:1** | 4,36:1 | forma > 24 px ✓ · **texto ✗** |
| **`PAL-16` vinho `#7B2E4A`** | **2,04:1** | **6,80:1** | **reprova nos dois usos sobre `--bg`** |

> 🔴 **`PAL-16` não pode carregar informação.** 2,04:1 contra o fundo reprova o mínimo de 3:1 para forma e de 4,5:1 para texto — e o vinho é o acento do **último setor**, onde a leitura mais importa. Regra derivada: **o vinho só existe sobre superfície clara** (`--bone`, 6,80:1), como **luz e respingadura em pedra/osso**. Ele nunca vai para HUD, nunca é cor de texto e nunca é a única diferença entre duas coisas. Em LVL-16 a informação é carregada por `--bone`, `--gold` e `--threat`; o vinho é atmosfera. Ver `niveis/LVL-16.md` §13 desvio 7 e `P-67`.

## 2.3 Tipografia

`[SUPOSIÇÃO]` Duas famílias, ambas de licença permissiva (OFL), empacotadas localmente — **nunca** via CDN.

| Papel | Característica | Fallback | Uso |
|---|---|---|---|
| **Display** | condensada, pesada, com talho | `system-ui, sans-serif` | títulos, nome de chefe, onomatopeia |
| **UI** | humanista, alta legibilidade, x-height grande | `system-ui, sans-serif` | HUD, menus, diálogo |

Regras:
- Fonte do canvas é pré-carregada antes do primeiro texto (GDD 7.8).
- UI em HTML usa `rem`; escala do usuário respeitada (nunca `user-scalable=no`).
- Nenhum texto dentro de sprite (`VIS` anti-regra 8) — exceto onomatopeia, que é asset e não informação.
- Reservar ≥ 30% de expansão para EN-US (GDD 4.7).

## 2.4 Ícones e iconografia (`AST-006`)

Contorno de 2 px `--ink`, preenchimento `--bone` ou `--gold`, grade de 24 px, exportados a 64×64 (GDD 5.4).

| Ícone | Semântica | Cor permitida |
|---|---|---|
| Coração / gota | vida | `--threat` |
| Escudo | escudo | `--bone` |
| Raio | poder | `--gold` |
| Saco | bolsa recuperável | `--gold` (pulsante) |
| Prego / alfinete | item preso | `--bone` |
| Moeda | dinheiro | `--gold` |
| Porta | saída de área | `--gold` |
| Crânio | ameaça de morte | `--threat` |

Todo ícone tem `aria-label` e nunca é o **único** portador da informação (GDD 4.6).

## 2.5 HUD

`[SUPOSIÇÃO]` Confirmado do GDD 4.3, com detalhamento visual:

```
┌───────────────────────────────────────────────┐
│ ♥ 100  ◈ 50  ⚡ 100          ⛁ 0   ✦ 0   🎒 3 │  ← faixa superior, altura 56 px
│                                                │
│                                                │
│                    MUNDO                       │
│                                                │
│                        [ A ]  [ B ]            │  ← touch inferior (mobile)
└───────────────────────────────────────────────┘
```

| Regra | Valor |
|---|---|
| Altura da faixa | 56 px (lógica) / 64 px em touch |
| Escala de UI para leitura | 1,0 em 1280×720; nunca reduzir abaixo de 0,85 |
| Atualização das barras | teto de 10 Hz, com interpolação visual (`EVT` GDD 7.5) |
| Aviso de bolsa | pulso `--gold` 1 Hz por 6 s, depois estático |
| Perda de conexão | modal não bloqueante, não cobre vida nem ameaça |
| Safe-area | respeitar `env(safe-area-inset-*)` |

`[MVP]` HUD é React, não canvas (ADR-01). Barras em `<div>` com `role="progressbar"` e valores textuais para leitor de tela.

## 2.6 Preparação de cor por camada (parallax)

`AST-007` tem 3 camadas. Regra de atmosfera:

| Camada | Saturação | Contraste | Contorno | Deslocamento |
|---|---|---|---|---|
| Fundo (céu/abismo) | 70% | muito baixo | não | 0,1× |
| Médio (arquitetura) | 85% | baixo | não | 0,35× |
| Primeiro plano (props) | 100% | médio | sim | 1,0× |

A camada de fundo nunca usa o acento do setor em mais de 15% da área, para o acento continuar significando "interativo".

## 2.7 Estados visuais do jogador

| Estado | Cor de destaque | Tratamento |
|---|---|---|
| Normal | `--bone` | paleta do setor aplicada |
| Atingido | `--threat` | flash de 2 frames + contorno branco 1 frame |
| Escudo ativo | `--bone` translúcido | contorno fino, sem preenchimento |
| Correndo | `--gold` | rastro de 2 frames, 3 partículas |
| Morto | dessaturado 100% | 1 frame de contração, pose mantida |

---

[← Anterior](01-estilo-e-identidade-visual.md) · [Índice](README.md) · [Próximo: 3. Ambientação e Mundo →](03-ambientacao-e-mundo.md)
