# 5. Arte e Direção Visual

> [← Anterior: 4. Interface e Experiência](04-interface-e-experiencia.md) · [Próxima: 6. Áudio →](06-audio.md)

## 5.1 Estilo, referências e moodboard (descrição)

Desenho animado 2D old school com fantasia sombria: ruínas, silhuetas de arquitetura decadente e monstros originais; humor principalmente por animação e expressão. Produção própria com apoio de IA, sem copiar designs de franquias.

## 5.2 Paleta de cores (hex) e tipografia

[SUPOSIÇÃO] Fundo `#15131F`, pedra `#464052`, vermelho de ameaça `#D95555`, dourado de progresso `#F2C66D`, texto `#F8F7F2`. Validar contraste em contexto real. Fonte de UI: fonte local de licença permissiva a escolher; fallback `system-ui`.

## 5.3 Especificações técnicas: resolução base, tamanho de tiles/sprites, FPS de animação, formato (PNG/WebP), atlas

[SUPOSIÇÃO] Resolução lógica 1280 × 704 px (11 × 64), `Scale.FIT` e `CENTER_BOTH`; tiles 64 × 64 px; personagem em caixa de 96 × 128 px; animação 8–12 frames/s. PNG para transparência; atlas até 2048 × 2048 px como alvo mobile.

> **As medidas exatas — célula, área útil, hurtbox, frames por ação e tamanho de folha de cada peça — estão em [`14-arte-tilesets-e-spritesheets.md`](14-arte-tilesets-e-spritesheets.md)** e são executáveis (`src/game/data/arte.json`, `npm run arte`). Esta secção é a intenção; o §14 é o contrato.

## 5.4 Lista de assets visuais (tabela com ID, nome, dimensões, frames, prioridade, status, origem/licença)

Dimensões e contagens são [SUPOSIÇÃO], devem ser revisadas antes de produzir; status de todos: pendente.

| ID | Nome | Dimensões por frame | Frames | Prioridade | Status | Origem/licença |
|---|---|---|---:|---|---|---|
| AST-001 | Herói: conjunto de ações | 96 × 128 px | 40 | Must | Pendente | Próprio/IA; verificar direitos |
| AST-002 | Sentinela | 96 × 128 px | 16 | Must | Pendente | Próprio/IA; verificar direitos |
| AST-003 | Guardião | 192 × 192 px | 20 | Must | Pendente | Próprio/IA; verificar direitos |
| AST-004 | Tiles ruínas | 64 × 64 px | 24 | Must | Pendente | Próprio/IA; verificar direitos |
| AST-005 | Armadilha e porta | 64 × 64 px | 8 | Must | Pendente | Próprio/IA; verificar direitos |
| AST-006 | Ícones inventário e HUD | 64 × 64 px | 12 | Must | Pendente | Próprio/IA; verificar direitos |
| AST-007 | Fundo com parallax | 1280 × 720 px | 3 | Should | Pendente | Próprio/IA; verificar direitos |
| AST-008 | Cosméticos e chefes futuros | Variável | A definir | Could | Pendente | Origem/licença a revisar antes do uso |

## 5.5 Animações e VFX

Usar poses de antecipação para ataques e sinal distinto para dano. Exportar animações para atlas; partículas de impacto são opcionais e desativáveis. Chefe e jogador têm estados coerentes com 3.1–3.2.

## 5.6 Convenções de nomenclatura e pastas

`snake_case`, prefixos `spr_`, `bgm_`, `sfx_`, `ui_`, `tm_`; exemplos `spr_player_run`, `tm_ruinas`. Guardar fontes editáveis fora do bundle e exportações em `public/assets/{images,atlases,audio,tilemaps,fonts}`.
