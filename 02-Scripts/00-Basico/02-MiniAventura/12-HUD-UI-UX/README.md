# Aula 12 — HUD / UI-UX 🏁

> **Trilha:** Meu Primeiro Jogo (React + Phaser) · **Nível:** Básico · **Tempo:** ~50 min
> **Pré-requisito:** [Aula 11 — Novas Plataformas](../11-Novas-Plataformas/README.md)

## 🎉 Última aula da trilha — aqui o protótipo vira JOGO!

![Aula 12 — HUD UI UX](screenshot.png)

> 📷 *Print do exemplo rodando (capturado automaticamente do jogo de verdade).*

---

## 🎯 O que você vai aprender

* Montar um **HUD** (vidas, pontos, objetivo);
* Criar um sistema de **vidas** com corações;
* Fazer a tela de **GAME OVER** e permitir **jogar de novo**;
* Princípios de **UI/UX** para deixar o jogo claro e gostoso de jogar.

> 🧠 **O que é HUD?** *Heads-Up Display* — as informações fixas na tela,
> como vidas e pontos. O nome vem dos caças de combate, que mostram os
> dados importantes "na frente do piloto". No seu jogo, o HUD é a ponte
> entre o jogo e o jogador! 🌉

---

## 🚀 Como rodar

**Sem instalar nada:** dê dois cliques em `index.html`.
**Com React:** `cd react && npm install && npm run dev`.

**Objetivo completo:** derrote as gosmas, colete as moedas, pegue a
estrela — e cuidado: são **3 vidas**! Se acabar, aperte **R**.

---

## 🔍 O código explicado

### 1) Os princípios de UI/UX que aplicamos (leia devagar!)

| Princípio | Como aplicamos |
|---|---|
| **Informação importante nos cantos** | Corações à esquerda, pontos à direita. O **meio da tela** fica livre para o jogo. |
| **Contraste** | Todo texto tem contorno escuro (`stroke`), então funciona sobre o céu azul ou a terra. |
| **Hierarquia** | Textos do HUD são grandes, mas menores que o personagem: **o jogo é o protagonista**. |
| **Zona de leitura** | Uma faixa escura semitransparente atrás do HUD garante que o texto apareça, sem esconder o cenário. |
| **Feedback imediato** | Perdeu vida? O coração **some na hora**. O jogador entende sem ler nada. |
| **Consistência** | As cores do HUD estão em constantes (`COR_DESTAQUE`...). Mudou em um lugar, muda em todo o HUD. |
| **Convite à ação** | "Aperte R para jogar de novo" **pulsando** (tween de escala) atrai o olhar. |
| **Nunca travar o jogador** | A tela de game over explica o que aconteceu e **o que fazer agora**. |

> 💬 **Atividade em dupla:** abram 3 jogos (ou 3 sites) e respondam:
> *Onde eles colocam as informações importantes? Por que o botão principal
> costuma ser grande e colorido?* Anotem o que descobrirem — vocês estão
> fazendo **análise de UX**, uma profissão de verdade! 👩‍💻

### 2) O HUD na prática

```js
this.coracoes = [];
for (let i = 0; i < VIDAS_INICIAIS; i++) {
    const coracao = this.add.image(60 + i * 70, 62, 'coracao');
    this.coracoes.push(coracao);
}
```

* `for` = repetição. Para cada vida (0, 1, 2), criamos um coração.
* `60 + i * 70` posiciona cada um **70 pixels** à direita do anterior —
  a mesma ideia de "tamanho do coração + espaço de respiro".
* Mostrar as vidas depois de um dano é só ligar/desligar a **visibilidade**:

```js
atualizarCoracoes() {
    this.coracoes.forEach((coracao, indice) => {
        coracao.setVisible(indice < this.vidas);
    });
}
```

### 3) Pontos alinhados à direita (um truque importante)

```js
this.textoPontos = this.add.text(LARGURA_TELA - 40, 40, 'PONTOS: 0', {...})
                       .setOrigin(1, 0);
```

`setOrigin(1, 0)` = "cresça para a **esquerda**". Assim, quando os pontos
passam de 9.999.900, o texto **não sai da tela** — ele cresce para dentro.
Esse tipo de detalhe é o que separa um HUD amador de um profissional. 😎

### 4) Profundidade: o HUD sempre na frente

```js
obj.setDepth(1000);   // faixa do HUD = 999, textos e corações = 1000, game over = 2000
```

`setDepth(n)` organiza as **camadas**. Quanto maior o número, mais na frente.
Sem isso, uma moeda poderia passar por cima dos corações!

### 5) Vidas, game over e reinício

```js
this.vidas--;
this.atualizarCoracoes();
if (this.vidas <= 0) {
    this.time.delayedCall(600, () => this.gameOver());
    return;
}
```

```js
this.acabou = true;                                  // trava tudo
this.input.keyboard.on('keydown-R', () => {
    if (this.acabou) this.scene.restart();           // reinicia a cena
});
```

* `this.acabou` é uma **flag**: no `update()`, se o jogo acabou,
  `return` imediato — ninguém se mexe, nem o cenário. 🧊
* `keydown-R` é um **evento**: "quando apertar R...". Diferente do
  `isDown` (que é uma foto do agora), o `on` **avisa** quando a tecla for
  pressionada.
* `this.scene.restart()` **reinicia a cena inteira**: o `create()` roda de
  novo, tudo volta ao começo. Simples e poderoso!
* ⚠️ **Detalhe:** as animações são globais do Phaser. Com o `restart`, o
  `create()` rodaria de novo e tentaria criar as mesmas animações — gerando
  avisos. Por isso usamos `this.anims.exists(key)` antes de criar
  (o método `criarAnimacoes()`).

---

## 🧩 Palavras novas

| Palavra | Significado |
|---|---|
| **HUD** | Informações fixas na tela (vidas, pontos, tempo...). |
| **UI** | *User Interface*: a parte visual com que o jogador interage. |
| **UX** | *User Experience*: como é **jogar** — claro? justo? gostoso? |
| **setDepth** | Camada (profundidade) do objeto. |
| **setVisible** | Mostrar/esconder um objeto. |
| **evento** | Aviso de que algo aconteceu (`keydown-R`, cliques...). |
| **restart** | Reiniciar a cena do zero. |

---

## 🎯 Tarefas finais (agora você é o(a) game designer!)

1. Deixe o jogo mais fácil/amigável: `VIDAS_INICIAIS = 5` e
   `TEMPO_INVENCIVEL = 1500`.
2. **Recorde:** salve a maior pontuação em `localStorage` e mostre no HUD.
   (Pesquise "localStorage MDN" — é uma linha para salvar, uma para ler.)
3. **Condição de vitória:** se pegar a estrela **E** derrotar todas as
   gosmas, mostre "VOCÊ VENCEU!" em vez de GAME OVER.
   (Dica: escreva um método `vitoria()` parecido com `gameOver()`.)
4. **Cronômetro no HUD:**
   ```js
   this.time.addEvent({ delay: 1000, loop: true, callback: () => { ... } });
   ```
5. **Botão de verdade:** no game over, crie um retângulo com texto e:
   ```js
   botao.setInteractive();
   botao.on('pointerdown', () => this.scene.restart());
   ```
   Você acabou de criar um **botão de UI**! 🖱️
6. **Personalize!** Troque cores, posições, textos, tamanhos. O jogo é seu.

---

## ❓ Problemas comuns

| Sintoma | Solução |
|---|---|
| Aviso "animation key already exists" | Use o `this.anims.exists(key)` antes de criar (veja `criarAnimacoes`). |
| O jogo não reinicia | Confira se `this.acabou = true` foi definido e se o evento `keydown-R` está registrado. |
| O HUD aparece atrás do cenário | Faltou `setDepth`. |
| Um coração continua aparecendo | Confira se `atualizarCoracoes()` está sendo chamado depois de `this.vidas--`. |
| O texto dos pontos sai da tela | Use `setOrigin(1, 0)` e alinhe pela direita. |
| O herói continua andando depois do game over | Falta o `if (this.acabou) return;` no começo do `update()`. |

---

## ✅ Checklist final da trilha

- [ ] Meu jogo tem HUD com vidas, pontos e objetivo.
- [ ] Perder todas as vidas termina o jogo com uma tela clara.
- [ ] Dá para jogar de novo apertando R.
- [ ] Consigo explicar 3 princípios de UI/UX que usei (e por quê).
- [ ] Personalizei o jogo do meu jeito. 🎨

## 🏆 Parabéns!

Você começou com um `add.image` de fundo e terminou com um **jogo de
plataforma completo**: parallax, animações, física, colisões, pisão,
coletáveis, plataformas e HUD. Isso é **muito** mais do que a maioria das
pessoas que "queria aprender a fazer jogos" já fez. 🎉

**Para onde ir agora** (ainda no repositório React-Phaser):

| Quero... | Vá para |
|---|---|
| Mais cenários e parallax avançado | `02-Scripts/03-Cenarios` |
| Gravidade, atrito, molas, veículos | `02-Scripts/04-Fisica` |
| HUDs de RPG, corrida, luta... | `02-Scripts/05-HUD` |
| Efeitos visuais e partículas | `06-VFX` |
| Músicas e sons | `07-Sounds` |
| Jogos completos para estudar | `03-Jogos` e `04-Sprites` |
| Planejar o SEU jogo | `09-gdd` (Game Design Document) |

---

⬅️ **Aula anterior:** [11 — Novas Plataformas](../11-Novas-Plataformas/README.md)
🏠 **Voltar para o início da trilha:** [README da trilha](../README.md)
