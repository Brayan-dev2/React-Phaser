# 6. Áudio e Ambiência

> [← Anterior: 5. Animação e VFX](05-animacao-e-vfx.md) · [Próximo: 7. Padrões de Level Design →](07-padroes-de-level-design.md)

> Complementa o GDD §6 (SFX/BGM, mixagem, licenças). Aqui: **ambiência por setor** e camadas. Novos IDs: `AMB-##`.

## 6.1 Paleta sonora do jogo

`[SUPOSIÇÃO]` Instrumentação sintetizada old school (GDD 6.1) + 3 texturas acústicas de mundo:

| Textura | Descrição | Uso |
|---|---|---|
| **Pedra** | reverb longo, reflexão dura | setores 01, 03, 07, 10 |
| **Metal** | ressonância curta, ring modulation | setores 05, 09, 12 |
| **Ar** | ruído filtrado, sem reverb | setores 04, 13, 16 |

## 6.2 Ambiência por setor (`AMB-##`)

`[MVP]` apenas 01–03.

| ID | Setor | Ambiência (loop) | Elementos pontuais |
|---|---|---|---|
| `AMB-01` | Ruínas da Vigília | vento seco + estalo de vela | pano batendo, poeira |
| `AMB-02` | Galeria Partida | gotejamento + eco de vitral | água rasa, vidro rangendo |
| `AMB-03` | Portão do Guardião | vento em estandarte + ferro | correntes, passos pesados distantes |
| `AMB-04` | Bosque das Cinzas | folhas secas, galho | corvo (original) |
| `AMB-05` | Cripta das Engrenagens | engrenagem lenta + óleo | dente batendo |
| `AMB-06` | Mina Esquecida | pingo em poço, madeira sob carga | desmoronamento distante |
| `AMB-07` | Catedral Oca | reverb extremo, silêncio "cheio" | vela, sino sem badalo |
| `AMB-08` | Pátio Rubro | vento quente, areia | estandarte, correntes |
| `AMB-09` | Canais Sombrios | água em canal, tijolo úmido | respingo, rato (original) |
| `AMB-10` | Torre da Vigília | vento alto, sino | sino, madeira |
| `AMB-11` | Jardim Profanado | insetos, flora estalando | pétala, estátua |
| `AMB-12` | Forja Distorcida | fole, fogo, bigorna | martelo, brasa |
| `AMB-13` | Abismo do Eco | eco de tudo que o jogador faz | retorno atrasado 700 ms |
| `AMB-14` | Fortaleza do Eclipse | marcha distante, bandeira | porta pesada |
| `AMB-15` | Ante-sala do Fim | nada — silêncio absoluto | ~~batida de coração~~ — **descartada** em `LVL-15` §7.3: um coração é um som que o jogador não faz |
| `AMB-16` | Trono do Caos | **zumbido de vazio** — para de uma vez em `MEC-012` | **trono rangendo**: sem peso antes de sentar, sob o jogador depois |

**Regra de `AMB-13`:** o eco é um efeito de sistema, não um asset — o áudio do jogador é reenviado com atraso e volume reduzido. Implementar como efeito de bus, não como SFX duplicado.

## 6.3 Camadas dinâmicas

`[SUPOSIÇÃO]` Cada faixa tem 3 camadas mixadas em tempo real:

| Camada | Quando entra | Exemplo |
|---|---|---|
| **Base** | sempre | pad harmônico |
| **Ritmo** | quando há inimigo vivo na sala | percussão |
| **Tensão** | quando jogador < 30% de vida | corda aguda, sem ritmo |

Transição por *crossfade* de 1,5 s. Ducking de −20% durante sinais críticos (GDD 6.3).

| Faixa | Setores | Duração | Loop |
|---|---|---:|---|
| `BGM-01` Exploração | 01, 04, 06, 09, 11, 13 | 90 s | Sim |
| `BGM-02` Chefe | 03, 08, 12, 14, 16 | 60 s | Sim |
| `BGM-03` Quarto seguro `[SUPOSIÇÃO]` | 01, 10, 15 | 45 s | Sim |
| `BGM-04` Trono | 16 | 75 s | Sim |

> **`BGM-04` toca uma vez na vida, e `BGM-02` para na rendição.** Em LVL-16 as duas faixas entram em sequência: `BGM-02` na arena, **corte** em `MEC-011` (§5.7 de `niveis/LVL-16.md`), e `BGM-04` de L16-05 até `MEC-012`, quando faz fade out em 6 s e não volta. O setor inteiro é `bgm=none` — o precedente de LVL-07 — porque a trilha é **do posto**, não do lugar.
>
> **E é por isso que LVL-15 pôde recusar `BGM-02`:** o guardião duplo é um expediente, não um clímax (`LVL-15` §7.2). Se ele tivesse gasto a última faixa de chefe, LVL-16 chegaria sem clímax e sem de onde tirar `BGM-04`.
>
> **`AMB-16` é o único elemento de áudio do jogo desligado por ação do jogador:** o prêmio por assumir o posto é o silêncio de uma vaga fechada. O último som do jogo é o trono rangendo sob um corpo.

## 6.4 Regras técnicas

- `AudioContext` desbloqueado por gesto explícito em "Jogar" (GDD 6.3); opção "iniciar sem áudio".
- Buses separados: `master` → `music` / `sfx` / `ambience`. Persistidos por conta.
- Máximo de 8 vozes de SFX simultâneas, variação de pitch ±3%.
- Formato: OGG + fallback M4A/MP3. Sem assumir suporte universal.
- Silêncio total **nunca** é usado como feedback único — sempre há eco visual (GDD 4.6).

## 6.5 Créditos e licenças

Cada faixa e SFX entra no inventário do apêndice C com: autor, ferramenta (incl. IA), licença, fonte, atribuição e evidência de permissão comercial. `[PENDENTE]` — bloqueia publicação, não o protótipo.

---

[← Anterior](05-animacao-e-vfx.md) · [Índice](README.md) · [Próximo: 7. Padrões de Level Design →](07-padroes-de-level-design.md)
