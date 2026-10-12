# 🚀 Atividades do Aluno — Desafios de Código

Regras do jogo de aprendizagem: **mude uma linha por vez**, jogue depois de cada
mudança e escreva o que você sentiu. Copiar a resposta pronta não conta — o
objetivo é você prever o que vai acontecer.

Para conferir quase tudo, use o console (F12) durante a luta:

```js
const luta = window.jogo.scene.getScene('Luta');
luta.lutadores[0].vida            // quanta vida o P1 tem
luta.lutadores[0].superCarga      // a barra do supremo
luta.lutadores[0].maiorCombo      // o melhor combo dele
luta.lutadores[0].danoCausado     // quanto ele já bateu
luta.lutadores[0].ataqueAtual     // o golpe em andamento (null se estiver livre)
```

---

## 🟢 Nível Faixa Branca (fácil)

### Desafio 1 — O dial da dificuldade
Abra `dados.js → ETAPA 5` (a tabela `DIFICULDADES`). Coloque `Impossível.tempoReacao` em `400` e jogue contra ele.
Depois coloque `Fácil.botaoChance` em `0.9`.
**Escreva:** qual dos dois números faz a máquina ser *rápida* e qual faz ela ser
*ofensiva*?

### Desafio 2 — Dia de pagamento no salão de beleza
Em `dados.js → ETAPA 3`, troque a `paleta` de um lutador (roupa, luva, cabelo,
aura) e o `cabelo` (`'curto'`, `'faixa'`, `'longo'`, `'moicano'`, `'rabicho'`,
`'careca'`).
**Meta:** seu lutador tem que ficar irreconhecível sem mudar nenhum número de dano.

### Desafio 3 — O super-poder é um número
Ache `VIDA_MAXIMA` e `SEGUNDOS_POR_ROUND` (em `dados.js → ETAPA 1`) e faça um
round de **99 segundos** com **300 de vida**.
**Cuidado:** a barra de vida é uma fração da vida máxima — ela continua certa?

---

## 🟡 Nível Faixa Azul (médio)

### Desafio 4 — Criar um 9º lutador
Copie o bloco de um personagem em `dados.js → ETAPA 3`, cole no fim do `ELENCO`
e mude só: `id`, `nome`, `titulo`, `frase`, `descricao`, `paleta`, `atributos`
e o `nome` do especial.
**Não precisa** escrever nenhuma linha de código novo: a grade de seleção, a
ficha de golpes e a IA se viram sozinhas (é isso que "dados dirigem o jogo"
quer dizer).
**Extra:** dê a ele um `especial` com `tipo: 'investida'` e descubra o que muda
no comportamento da CPU quando ela joga com você.

### Desafio 5 — A arbitragem do dano de raspão
O *chip damage* é aquele pouquinho de vida que escapa pelo bloqueio. O número
mestre está em `dados.js → ETAPA 1` (`REBOTE_DANO = 0.10`) e a linha que usa ele
está em `luta.js` (procure por `const raspao`). Faça o bloqueio custar **35%**
do dano em vez de 10%.
**Pergunta:** em que situação isso transforma o jogo num festival de medo?

### Desafio 6 — Golpe novo, linha nova
Adicione uma chave nova em `ATAQUES` (ex.: `chuteGirado: { nome: 'Giro', startup: 7, ativo: 5, recuperacao: 18, dano: 15, hitbox: [10, -110, 120, 70], frame: 10 }`)
e faça ele sair quando o aluno apertar `soco + baixo + turbo` juntos (a árvore de
decisão está em `luta.js → ETAPA 4`).
**Conferir:** com `V` ligado, veja a caixa vermelha aparecer no ar.

---

## 🔴 Nível Faixa Preta (avançado)

### Desafio 7 — Regra nova na cabeça da máquina
Em `ia.js → ETAPA 3` existe a escada numerada de 0 a 11. Escreva a **regra 6.5**:
*"se o oponente está no ar bem em cima de mim, faça um golpe anti-aéreo"*.
Você vai precisar de `outro.chao`, `distancia` e `this.comandoDoEspecial('especial')`.
**Teste:** jogue com Luana ou Nina (elas pulam muito) no CPU vs CPU e veja os
dois lados começarem a se punir no ar.

### Desafio 8 — Por que a CPU ficou parada? (aula de depuração!)
Este projeto já teve esse bug real: a máquina andava para trás para carregar o
golpe... e nunca mais voltava, e a partida terminava **0 x 0**. Descobrimos isso
imprimindo, a cada quadro, `distancia`, o `planoAtual` e `danoCausado` dos dois.
**Sua missão:** escreva no console um laço que grave `luta.frames`, a distância
e o `danoCausado` de 60 em 60 quadros durante um CPU vs CPU, e mostre para a
turma como se *lê* uma luta assim.
*(Dica: `setInterval(function(){ ... }, 1000)`.)*

### Desafio 9 — Replay de verdade
`ia.js` guarda na fila `this.fila` uma lista de "apertões". Faça o `Lutador`
gravar tudo o que o **jogador humano** aperta num array (`this.fita = []`) e,
no fim da partida, reproduza essa fita no outro lutador: a mesma luta, o mesmo
resultado.
**Isso é** como os jogos profissionais fazem replay: eles não gravam a tela,
gravam os botões.

### Desafio 10 — Balanceamento medido, não sentido
Rode o modo CPU vs CPU com as duplas (Ravi × Dara), (Kiro × Nina) e (Bento ×
Téo). Anote `danoCausado` dos dois lados. Se algum lado ficar abaixo de 30,
o par está *quebrado*: ajuste `atributos`, `especial` ou `estilo` até os dois
lados brigarem de verdade.
**Regra do projeto:** um jogo de luta só está balanceado quando **ninguém**
consegue vencer sem arriscar nada.
