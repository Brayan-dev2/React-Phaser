# 📖 Glossário Gamer e Tech — Arena Relâmpago

Palavras que aparecem no código e na conversa de jogo de luta. Cada uma tem a
definição "de gente grande" e como ela aparece **neste projeto**.

---

### 🥊 Jogo de luta (fighting game / *versus*)
Gênero onde dois lutadores se enfrentam em uma arena fechada, com rounds e
escolha de personagem. Aqui: `luta.js`, com rounds, cronômetro e tela de
resultado (`menus.js`).

### ⏱️ Frame e frame data
Um frame = 1/60 de segundo. Todo golpe tem três tempos:
**startup** (preparo, ainda não machuca) → **ativo** (machuca) →
**recuperação** (você fica parado e vulnerável). No projeto: a tabela
`ATAQUES` em `dados.js → ETAPA 2`.

### 📐 Hitbox × Hurtbox
*Hitbox* é a caixa que machuca; *hurtbox* é a caixa que é machucada. Um golpe só
acerta se as duas se cruzarem **enquanto** o golpe está no período ativo.
No projeto: `caixaDeGolpe` e `caixaDeFerimento`; aperte `V` para ver as duas.

### 🛡️ Blockstun / Hitstun
*Hitstun* é o tempo em que quem apanhou não consegue nada. *Blockstun* é o tempo
em quem bloqueou fica "travado" só segurando o escudo. Quem sai do atordoamento
primeiro tem **vantagem de frame** (pode atacar antes). No projeto: `hitstun`,
`blockstun` e o pequeno empurrão de `rebote`.

### 🩸 Chip damage (dano de raspão)
É a vida que passa pelo bloqueio em golpes especiais. Impede que "só segurar
para trás" vença o jogo. No projeto: `REBOTE_DANO` (10% do dano).

### 🫰 Whiff × Punish (castigo)
*Whiff* é errar o golpe (ele continua te travando na recuperação!). *Punish* é
bater justo nesses frames de recuperação. Ensinar isso é ensinar a ler frame data.

### 🤼 Projeção / Agarrão (throw)
Golpe que **vence o bloqueio**: você chega perto e arremessa. No projeto:
soco + chute juntos, com alcance curto (`ATAQUES.THROW.alcance`) e alvo caído é
invencível (`estaInvencivel`) - por isso não dá para arremessar quem está no chão.

### 🔗 Combo, cancel e contador
*Combo* é acertar enquanto o outro não consegue se recuperar. *Cancel* é
encurtar a recuperação do soco emendando um especial/supremo. No projeto:
`maiorCombo`, `podeCancelar` (só vale se o golpe **acertou** ou foi bloqueado).

### 🎯 Neutral, spacing e *footsies*
A briga pelo "espaço certo": quem consegue bater sem ser batido. É por isso que
a IA do projeto mede `distancia` antes de qualquer decisão (`ZONA` em `dados.js`:
`encostado`, `curto`, `medio`, `longo`).

### 🕹️ Buffer de entrada e *leniência*
O jogo lembra as últimas teclas apertadas (`160 ms` aqui) e aceita o comando se
ele "parecer" com o desenho, mesmo apertado meio fora de ordem. Isso se chama
**input leniency** e é o motivo de a criança conseguir soltar um Hadouken no
primeiro dia.

### 🌀 Comando de direcional (motion input)
`→ ↓ ↘ →` (quarter-circle) é a bola de energia; `↓ ↘ →` (dragon punch) sobe;
`←← →` (charge-back-forward) e `↓↓ ↑` (charge-down-up) são golpes de **carga**.
No projeto: `comando` + `carga` na ficha de cada lutador, e a fita na tela mostra
o que o jogo entendeu.

### 🔋 Barra de super (meter)
Enche batendo, apanhando e bloqueando. Cheia, libera o golpe supremo (com
cortina, zoom e câmera lenta). No projeto: `superCarga`, `SUPER_MAXIMO`,
`cameraDeSuper`.

### 🧠 Máquina de regras (a "IA" do projeto)
Não é inteligência artificial de verdade: é uma escada de perguntas, da mais
urgente para a menos urgente, mais um pouco de sorte (`azar()`). A máquina só
escreve `plano` (quais botões estão apertados) - quem executa é o `Lutador`.

### 🎹 Fila de botões (e por que replay funciona)
A CPU guarda as próximas pressões numa fila (`this.fila`) e entrega uma por
quadro. Como jogador humano e CPU viram exatamente a mesma lista, dá para
gravar e reproduzir uma partida inteira só gravando botões.

### 🏃 Corrida (dash) e *edge trigger*
Dois toques rápidos para frente = corrida. *Edge trigger* é "só vale no instante
em que o botão **apareceu**" (`novo()`), sem isso o boneco pula sem parar enquanto
você segura `↑`.

### 🧍‍♂️ Okizeme ("pressão de levanta")
A arte de já estar com o golpe pronto quando o outro levanta do chão. No
projeto: `knockdown`, o tempo de levantar e o pulo com chute de entrada.

### 🎨 Arte procedural e `generateTexture`
Desenhar a sprite com código (`Graphics`) e converter em textura, sem nenhum
PNG. Aqui: `desenhos.js`, com o pé do boneco na linha `PE = 170` de um frame
`96 × 176`.

### ⚛️ React × Phaser (ponte)
O React monta a página e entrega um `<div>`; o Phaser cria um `<canvas>` dentro
e assume o resto. `useEffect` liga o jogo e o `return` do mesmo `useEffect`
desliga - sem isso, o hot reload do Vite deixa dois jogos rodando juntos.
