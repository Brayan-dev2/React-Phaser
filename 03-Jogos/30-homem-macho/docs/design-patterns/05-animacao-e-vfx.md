# 5. Animação e VFX

> [← Anterior: 4. Setores e Cenários](04-setores-e-cenarios.md) · [Próximo: 6. Áudio e Ambiência →](06-audio-e-ambiencia.md)

## 5.1 Animação limitada (a regra central)

`[SUPOSIÇÃO]` Herança do GDD 5.3 (8–12 fps de animação). O ponto não é "ter poucos frames" — é **onde** colocar os frames.

| Tipo de trecho | Frames/s | Por quê |
|---|---:|---|
| Pose de impacto, contato | 12 | o olho precisa ver o contato |
| Antecipação (windup) | 8–10 | o exagero pede *holds* |
| Locomoção (correr, andar) | 10 | ciclo legível, não "liso" |
| Idle | 6–8 | respiração, quase estático |
| Morte, entrada de chefe | 8 com holds longos | dramaturgia |

**Regra de ouro:** nunca interpolar. Se um movimento parece "escorregadio", o erro é *mais* frames, não menos — adicione um *hold*.

## 5.2 Orçamento de frames por entidade

Consistente com `AST-001`–`AST-003` do GDD.

| Entidade | Frames totais | Distribuição |
|---|---:|---|
| `AST-001` Herói | 40 | idle 4 · correr 6 · subida 3 · queda 3 · ataque branco 7 · disparo 5 · dano 3 · morte 6 · pose vitoria 3 |
| `AST-002` Sentinela | 16 | idle 3 · andar 5 · windup 3 · golpe 3 · dano/morte 2 |
| `AST-003` Guardião | 20 | idle 4 · andar 4 · windup 4 · investida 3 · recuperação 2 · dano/morte 3 |

`[RISCO]` 76 frames só de entidade. Sem pipeline travada (`01-estilo` §1.8), é o item que mais atrasa o vertical slice.

## 5.3 Telegraph: anatomia do aviso

O Pilar `P2` (combate legível) é executado aqui. **Todo ataque inimigo tem 3 fases visuais distintas**, nunca duas.

| Fase | Duração (GDD 3.2) | Forma | Cor | Som |
|---|---:|---|---|---|
| **Windup** | 600 ms (Sentinela) / 800 ms (Guardião) | corpo encolhe e inclina; 3–5 linhas radiais de tinta (`VIS-009`) | contorno `--threat` pulsando a 2 Hz | nota curta ascendente |
| **Execução** | 1–2 frames | alongamento máximo + onomatopeia `VFX-001` | `--threat` sólido | impacto |
| **Recuperação** | 800 ms / 1.000 ms | corpo recolhe, contorno apaga | volta ao normal | nada (silêncio é o aviso) |

O silêncio na recuperação é intencional: dá ao jogador uma janela auditiva clara para atacar.

## 5.4 Catálogo de VFX (`VFX-###`)

`[SUPOSIÇÃO]` Teto de 30 partículas simultâneas (GDD 4.5). Cada efeito tem orçamento próprio.

| ID | Efeito | Partículas | Duração | Desativável |
|---|---|---:|---:|---|
| `VFX-001` | Onomatopeia de impacto ("PÁ!", "THUM") | 1 sprite | 400 ms | Sim |
| `VFX-002` | Faísca de arma branca | 6 | 250 ms | Sim |
| `VFX-003` | Rastro de projétil | 3 | 300 ms | Sim |
| `VFX-004` | Dano recebido (contorno branco 1 frame) | 1 | 100 ms | **Não** (regra) |
| `VFX-005` | Poeira de pouso | 5 | 200 ms | Sim |
| `VFX-006` | Linhas de tensão do windup | 5 | = windup | Sim (vira contorno) |
| `VFX-007` | Morte de inimigo (desmonta em peças) | 8 | 500 ms | Sim |
| `VFX-008` | Aura dourada de checkpoint | 10 | 800 ms | Sim |
| `VFX-009` | Bolsa recuperável (pulso `--gold`) | 4 | loop 1 Hz | Sim |
| `VFX-010` | Tremor de tela | — | 150 ms | Sim (Redução de movimento) |

## 5.5 Onomatopeia: regras de escrita

São **assets**, não texto de UI — portanto não entram no i18n, mas precisam de versão PT-BR e EN-US (GDD 4.7).

| Regra | Valor |
|---|---|
| Tamanho na tela | 96–160 px de largura |
| Máximo simultâneo | 3 |
| Posição | centrada no ponto de impacto, deslocada 12 px para cima |
| Fonte | Display do jogo (`02-paleta` §2.3) |
| Nunca | em UI, em HUD, em diálogo, cobrindo a barra de vida |
| Vocabulário PT-BR | PÁ · CRÉU · THUM · TCHAK · PLOC |
| Vocabulário EN-US | BAM · WHAM · THUD · CLANG · THWACK |

`[PENDENTE]` Não usar onomatopeia japonesa nem símbolos tipográficos de mangá — ver `VIS-009`/`VIS-010`.

## 5.6 Movimento e "juice" — o que entra no MVP

| Elemento | MVP? | Observação |
|---|---|---|
| Squash & stretch no pulo/pouso | Sim | desenhado à mão, não *tween* |
| Hold dramático em golpe pesado | Sim | `VIS-007` |
| Partículas de impacto | Sim | ≤ 30 simultâneas |
| Screen shake leve | Sim | desativável, ≤ 3 px |
| Hit-stop genérico | **Não** | GDD 4.5 — fora até ser testado |
| Câmera lenta na morte do chefe | Sim (`[SUPOSIÇÃO]`) | 0,3× por 800 ms, desativável |
| Blur / motion blur | Não | custa GPU, quebra old school |
| Rastro de imagem (*afterimage*) | Não no MVP | interessante pós-MVP para corrida |

## 5.7 Acessibilidade de VFX

Obrigatório (GDD 4.6), verificado por `TST-014`:

- "Redução de movimento" desliga `VFX-010`, holds de câmera e câmera lenta — **mantém** `VFX-004`, porque é informação de regra.
- Nenhum flash acima de 3/s. `VFX-004` é 1 frame, nunca em sequência.
- Todo VFX informativo tem equivalente sonoro **e** textual quando relevante (anúncio de chefe).
- Contraste dos efeitos sobre `--bg` ≥ 3:1.

## 5.8 Exportação e atlas

| Item | Regra |
|---|---|
| Formato | PNG-8 com transparência; WebP só se o pipeline validar em Safari iOS |
| Atlas | alvo 2048×2048, margem 2 px, sem rotação, sem trim agressivo |
| Pivot | herói e inimigos com pivô nos pés, centrado em X |
| Nomenclatura | `spr_<entidade>_<ação>_<frame>` (`01-estilo` §1.7) |
| Origem | fonte editável fora do bundle (`.gitignore`) |
| Registro | cada asset com autor, ferramenta, licença e data (anti-regra 10) |

---

[← Anterior](04-setores-e-cenarios.md) · [Índice](README.md) · [Próximo: 6. Áudio e Ambiência →](06-audio-e-ambiencia.md)
