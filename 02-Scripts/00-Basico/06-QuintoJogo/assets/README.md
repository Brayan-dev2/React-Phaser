# 🎨 Assets — por que esta pasta está (de propósito) vazia

Nos outros jogos deste repositório é aqui que moram os `.png`
(`sprites/`, `tiles/`). **Neste projeto não há nenhuma imagem**, e isso é uma
escolha didática, não um esquecimento.

## O que acontece em vez de carregar PNG

`src/jogo/desenhos.js` desenha tudo com código:

1. `Graphics` monta as partes do corpo (perna, tronco, braço, cabeça, cabelo)
   usando os números da ficha do personagem (`paleta`, `corpo`, `cabelo`);
2. `gerarSpritesheet()` escreve as **14 poses** de um lutador em frames de
   `96 × 176`, com o pé na linha `PE_Y = 170`;
3. `generateTexture('lutador-kiro', ...)` transforma o desenho numa textura do
   Phaser — exatamente o mesmo tipo de textura que um PNG carregado produziria;
4. `gerarEfeitos()` faz o resto: poeira, faísca de impacto, escudo de bloqueio,
   projéteis, onda de choque.

Por que isso é bom para aprender?

- o aluno **edita a arte em texto**: trocar `roupa: 0xe2e8f0` por outra cor muda
  o boneco inteiro, sem abrir um editor de imagem;
- dá para entender de onde vem cada linha de desenho (nada é "caixa preta");
- o jogo funciona offline, sem servidor de arquivos, e pesa zero;
- e a spritesheet continua sendo uma spritesheet: o `Lutador` só vê frames e
  `this.sprite.setFrame(n)`, do mesmo jeito que veria num PNG.

## Quero usar meus próprios desenhos!

Ótimo — é o caminho natural. Em `src/jogo/luta.js`, na criação das texturas,
troque a chamada de `gerarSpritesheet` por um carregamento clássico:

```js
// 1) no preload (ou com this.load antes de criar a cena):
this.load.spritesheet('kiro', 'assets/sprites/kiro.png', {
    frameWidth: 96,   // mantenha o MESMO tamanho de frame
    frameHeight: 176
});

// 2) e não chame mais DESINHOS.gerarSpritesheet para esse lutador.
```

Duas coisas que precisam continuar iguais, ou o boneco flutua/afunda:

- o frame faz `96 × 176` e o **pé** do lutador encosta na linha de baixo (aqui é
  o `PE_Y = 170`, usado como `origin` do sprite);
- as poses precisam continuar na mesma ordem. A lista `POSES` de `desenhos.js`
  é o mapa: `0`/`1` parado (respiração), `2`-`4` andando, `5` agachado, `6`
  pulando, `7` soco, `8` chute, `9` energia, `10` soco ascendente, `11` girando,
  `12` levando dano, `13` no chão.

Se você quiser gerar uma folha nova sem desenhar à mão, copie o padrão de
`desenhos.js`: desenhar em um `Graphics` invisível e chamar `generateTexture`.
