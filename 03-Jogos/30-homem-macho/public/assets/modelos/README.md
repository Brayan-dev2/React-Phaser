# modelos/ — folhas de trabalho (com guias)

Não é arte e **não é carregado pelo jogo**. É a folha de esqueleto de cada spritesheet, nas medidas
de `src/game/data/arte.json`, para desenhar por cima.

Gerar de novo: `npm run modelos` (ou `npm run modelos spr_pers_cabelos`).

## O que cada marca significa

| Marca | Significado |
|---|---|
| **Moldura roxa** | o limite da **célula** — o teu PNG tem de ter exatamente `colunas × célula` |
| **Linha vermelha tracejada em baixo** | a **linha dos pés**: em todos os frames o contacto tem de estar aqui |
| **Eixo roxo tracejado ao centro** | centro horizontal: o corpo não sai deste eixo (é daqui que sai a hurtbox) |
| **Número dourado no canto** | o índice do frame/da variante na folha, na ordem em que o jogo os lê |

## Personagens animados — a ordem dos frames

As ações seguem-se na folha, da esquerda para a direita e de cima para baixo. O herói, por exemplo:

```
0-3   parado     4-11  corrida    12-13 salto
14-15 queda      16-20 ataque     21-23 disparo
24-25 dano       26-31 morte
```

## Personalização (`spr_pers_*`) — a ordem das variantes

Não são animações: cada célula é uma **alternativa**. A ordem é a de `src/services/character.ts`:

| Folha | Células (índice = variante) |
|---|---|
| `spr_pers_corpos` | 0 magro · 1 atlético · 2 forte · 3 maromba · 4 gordo |
| `spr_pers_cabelos` | 0 curto · 1 moicano · 2 coque · 3 longo · 4 raspado · 5 franja · 6 cacheado |
| `spr_pers_rostos` | 0 quadrado · 1 oval · 2 angular · 3 redondo |
| `spr_pers_expressoes` | 0 séria · 1 furiosa · 2 sorriso · 3 cansada · 4 grito |
| `spr_pers_marcas` | 0 nenhuma · 1 cicatriz no olho · 2 cicatriz na boca · 3 tatuagem no braço · 4 tatuagem no peito · 5 pintura |
| `spr_pers_dentes` | 0 normais · 1 presas de vampiro (`ALUCARD`) |
| `spr_pers_torsos` | 0–4: os cinco troncos com pescoço, na ordem de `CORPO` |
| `spr_pers_bracos` | 0–4: os cinco pares de braços, do ombro ao pulso |
| `spr_pers_maos` | 0–4: os cinco pares de mãos |
| `spr_pers_pernas` | 0–4: os cinco pares de pernas, do quadril ao tornozelo |
| `spr_pers_pes` | 0–4: os cinco pares de pés |
| `spr_pers_marcas_corpo` | 0 nenhuma · 1 tatuagem no braço · 2 tatuagem no peito |
| `spr_pers_peles` | 7 amostras de 32×32, com a sombra no canto |
| `spr_pers_cores_cabelo` | 7 amostras de 32×32 |
| `spr_pers_exemplos` | 0 padrão · 1 `MACHO` · 2 `ALUCARD` (herói completo, para conferir o conjunto) |

Nas folhas de cabelo, rosto, expressão, marca e dentes o modelo mostra a **cabeça ampliada**: a
96 px de altura total um penteado não se distingue de outro. Na arte final cada folha volta a ser o
herói inteiro — o *close* é do modelo de conceito.

O mesmo acontece nas partes do corpo: cada folha usa **um zoom comum às cinco variantes**, só para
as mãos, os pés e as tatuagens serem legíveis. As proporções vêm sempre de `CORPO`; nenhuma variante
é redimensionada individualmente para caber. Estas partes **não criam linhas novas no menu** —
`MAROMBA`, por exemplo, é sempre a célula **3** no corpo inteiro, tronco, braços, mãos, pernas e pés.
As contas e os fatores de leitura estão em `docs/14` §14.3.3.

## Como usar

1. Abre o `modelo_*.png` no editor e põe o desenho por cima da pose/variante correspondente.
2. Desenha **dentro da célula** e com os pés na linha vermelha (nos personagens).
3. Guarda sem as guias — a versão do jogo está um nível acima, em `../images/` (ou `../tilemaps/`
   para tiles), com o mesmo nome sem o prefixo `modelo_`.
4. Corre `npm run arte`: cada linha tem de dizer `OK`.

> Os ficheiros de `../images/` e `../tilemaps/` já contêm as mesmas figuras sem guias: são a
> referência de escala e o *fallback* enquanto a arte final não chega.
