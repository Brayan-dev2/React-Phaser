# public/assets — onde a arte entra

| Pasta | O que entra | Prefixo |
|---|---|---|
| `images/` | spritesheets de personagens, itens, efeitos e fundos | `spr_`, `bg_` |
| `tilemaps/` | tilesets (células de 64 × 64) | `tm_` |
| `atlases/` | folhas empacotadas (≤ 2048 × 2048) e os seus `.json` | `spr_`, `tm_` |
| **`modelos/`** | **os modelos base com guias** — folha de trabalho, **não** vai para o jogo | `modelo_` |

## O que já está aqui (2026-11-13)

**`modelos/`** — o esqueleto de cada folha, gerado por `npm run modelos` (27 peças, incluindo as 15
folhas de personalização do `UI-12`: corpos, cabelos, rostos, expressões, marcas, dentes, troncos,
braços, mãos, pernas, pés, marcas no corpo, paletas de pele e cabelo, e três heróis completos de
exemplo — padrão, `MACHO` e `ALUCARD`):
grelha, linha dos pés, eixo central e número de cada frame. É por cima desta imagem que a arte se
desenha; nada disto é carregado pelo jogo.

**`images/` e `tilemaps/`** — as **mesmas figuras sem guias**, com o tamanho exato que o jogo
espera (`npm run arte` diz `OK`). Servem de referência de escala e de *fallback* até a arte final
chegar. As medidas de cada ficheiro estão em `src/game/data/arte.json` e explicadas em
[`docs/14-arte-tilesets-e-spritesheets.md`](../../docs/14-arte-tilesets-e-spritesheets.md).

```bash
npm run modelos          # (re)gera os modelos base e as folhas de referência
npm run modelos player   # só uma peça
npm run arte -- --lista  # o que produzir, com tamanhos
npm run arte             # diz OK / falta / ERRO por ficheiro
```

## Regras curtas

PNG com alfa · sem entrelaçamento · 1:1 com o jogo · folha = grelha de células iguais ·
≤ 2048 × 2048 · nomes em `snake_case` com o prefixo da pasta (o nome do ficheiro é a chave do
manifesto: `spr_player.png`, `tm_ruinas.png`, `bg_intro_veu.png`).

> **Ao substituir um modelo, mede antes de desenhar:** a célula é o que o PNG mede (herói 96 × 128,
> chefes 192 × 192, tiles 64 × 64). Os pés tocam o fundo da célula e o corpo está centrado — é assim
> que o `Player` calcula a hurtbox sem ninguém mexer em código.
