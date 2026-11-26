/**
 * **`ENT-010` — os arquétipos de inimigo comum.**
 *
 * O jogo tinha **um** inimigo comum em dezesseis setores: `ENT-002` Sentinela, com o mesmo ciclo
 * patrulha → telegrafa → investe → recupera em todas as 68 cópias. Um segundo inimigo não é uma
 * segunda entidade: é a mesma entidade com outro **nome de arquétipo**, e é por isso que este
 * módulo existe — para que a diferença entre eles esteja escrita num sítio só, em números, em vez
 * de espalhada por três ficheiros de cena.
 *
 * Regras que este ficheiro guarda (e que os testes cobram):
 *
 * 1. **O telegrafo é obrigatório.** Nenhum arquétipo ataca sem avisar (`PAT-LD-03`, `P2`). O
 *    `telegraphMs` é sempre **maior** que o `recoverMs` do mesmo arquétipo? Não — o que importa é
 *    que seja **maior que o tempo de reação**: `REACAO_MINIMA_MS`. Abaixo disso, o ataque não é
 *    legível e o inimigo é injusto.
 * 2. **Quem atira não investe, e quem investe não atira.** É a diferença que o jogador lê no
 *    corpo: um chega, o outro fica. Um arquétipo com os dois seria só mais difícil de ler.
 * 3. **O corpo não muda de tamanho por arquétipo** — o jogador não deve descobrir por tentativa
 *    se um corpo é ou não sólido. Altura e largura vivem em `tuning.ts` e são as mesmas.
 * 4. **Alcance é um número do jogo, nunca do ator** (`PAT-C-04`): o arquétipo diz *como*, o
 *    `tuning.ts` diz *quanto*, e o setor escolhe a variante.
 *
 * Não há `Phaser` aqui de propósito: o comportamento é testável a correr `vitest`, sem browser.
 */

/** Os três arquétipos do piloto. O id é o que a grade escreve. */
export type ArquetipoId =
  /** `ENT-002` — o que já existe: patrulha no chão e investe quando o jogador se aproxima. */
  | 'sentinela'
  /** `ENT-010` — fica longe, avisa e atira. Não anda para cima do jogador. */
  | 'atirador'
  /** `ENT-011` — voa em vaivém, ignora o piso e desce em picada. Não patrulha o chão. */
  | 'voador';

export type Ataque = 'investida' | 'projetil' | 'picada' | 'nenhum';

export interface Arquetipo {
  readonly id: ArquetipoId;
  /** O `ENT-###` do documento de conteúdo — o arquétipo é uma entidade, não um humor. */
  readonly ent: string;
  readonly nome: string;
  /** A letra da grade (`A` já é espinho, `E` já é a Sentinela — ver `LevelBuilder`). */
  readonly glifo: string;
  readonly ataque: Ataque;
  /** Distância (px) a que o arquétipo **decide** atacar. */
  readonly alcancePx: number;
  /** Janela vertical (px) em que ele vê o jogador. */
  readonly faixaPx: number;
  /** Aviso antes do ataque. Nunca abaixo de `REACAO_MINIMA_MS` (regra 1). */
  readonly telegraphMs: number;
  readonly recoverMs: number;
  /** Velocidade de patrulha/vaivém, px/s. */
  readonly velocidade: number;
  /** Só para quem atira: o que sai do corpo e a que velocidade. */
  readonly projetil?: { readonly velocidadePx: number; readonly dano: number };
  /** Uma frase para o HUD de depuração e para a documentação. */
  readonly leitura: string;
}

/**
 * `P2` — "combate legível". **300 ms** é o piso de reação que o desenho de `ENT-003` já usava
 * (`BOSS.telegraphMs = 800`) com folga; abaixo disto o aviso não chega a ser visto, e o arquétipo
 * reprova à nascença em vez de reprovar no playtest.
 */
export const REACAO_MINIMA_MS = 300;

/**
 * O arquétipo **não** tem vida, dano de contato nem tamanho de corpo: isso é do `tuning.ts`
 * (`SENTINEL`, `ARQUEIRO`, `VESPA`) porque são números de balanceamento e mudam com o setor.
 */
export const ARQUETIPOS: Readonly<Record<ArquetipoId, Arquetipo>> = {
  sentinela: {
    id: 'sentinela', ent: 'ENT-002', nome: 'Sentinela distorcida', glifo: 'E',
    ataque: 'investida', alcancePx: 130, faixaPx: 90,
    telegraphMs: 800, recoverMs: 1000, velocidade: 46,
    leitura: 'anda de um lado para o outro; quando te vê, avisa e investe',
  },
  atirador: {
    id: 'atirador', ent: 'ENT-010', nome: 'Alicate de zaga', glifo: 'T',
    ataque: 'projetil', alcancePx: 420, faixaPx: 120,
    telegraphMs: 700, recoverMs: 1400, velocidade: 30,
    projetil: { velocidadePx: 240, dano: 10 },
    leitura: 'não chega perto: avisa e atira de longe',
  },
  voador: {
    id: 'voador', ent: 'ENT-011', nome: 'Mariposa de turno', glifo: 'V',
    ataque: 'picada', alcancePx: 200, faixaPx: 160,
    telegraphMs: 500, recoverMs: 900, velocidade: 70,
    leitura: 'voa em vaivém no ar; quando passa por cima de ti, avisa e desce',
  },
};

export const ARQUETIPO_IDS = Object.keys(ARQUETIPOS) as readonly ArquetipoId[];

/** O arquétipo de uma letra da grade, ou `null` se a letra não é um inimigo comum. */
export function arquetipoDoGlifo(glifo: string): Arquetipo | null {
  for (const id of ARQUETIPO_IDS) {
    if (ARQUETIPOS[id].glifo === glifo) return ARQUETIPOS[id];
  }
  return null;
}

/**
 * Uma variante é o arquétipo **nesta sala**: a vida e o dano vêm do setor, os tempos do arquétipo.
 * Um setor pode subir a vida de um voador sem lhe estragar a leitura — e não pode baixar o
 * telegrafo abaixo do piso (é o que `varianteValida` recusa).
 */
export interface Variante {
  readonly arquetipo: ArquetipoId;
  readonly hp: number;
  readonly dano: number;
  readonly telegraphMs?: number;
  readonly velocidade?: number;
}

export const VARIANTES: Readonly<Record<string, Variante>> = {
  /** LVL-01 — os três, com a vida que o tutorial aguenta (1 golpe branco mata). */
  'L01-sentinela': { arquetipo: 'sentinela', hp: 20, dano: 20 },
  /**
   * O voador do tutorial **não causa dano de contato** (só a picada), e o corpo dele é intocável
   * para o jogador que ainda está a aprender a correr: 10 de dano é meio `ITM-001`.
   */
  'L01-voador': { arquetipo: 'voador', hp: 20, dano: 10, telegraphMs: 600 },
  'L01-atirador': { arquetipo: 'atirador', hp: 20, dano: 10, telegraphMs: 750 },
};

/** A variante resolvida: os números do setor sobre os tempos do arquétipo. */
export function resolverVariante(nome: string): (Arquetipo & { hp: number; dano: number }) | null {
  const v = VARIANTES[nome];
  if (!v) return null;
  const a = ARQUETIPOS[v.arquetipo];
  return {
    ...a,
    telegraphMs: v.telegraphMs ?? a.telegraphMs,
    velocidade: v.velocidade ?? a.velocidade,
    hp: v.hp,
    dano: v.dano,
  };
}

/**
 * Porque é que esta variante é inválida — `null` quando está tudo bem.
 * A tabela é parâmetro para o teste poder julgar uma variante que **não** deve entrar no jogo
 * (uma que avise rápido demais) sem reescrever a tabela congelada.
 */
export function varianteValida(nome: string): string | null {
  return varianteValidaEm(VARIANTES, nome);
}

export function varianteValidaEm(
  tabela: Readonly<Record<string, Variante>>, nome: string,
): string | null {
  const v = tabela[nome];
  if (!v) return `variante «${nome}» não existe`;
  const a = ARQUETIPOS[v.arquetipo];
  const tel = v.telegraphMs ?? a.telegraphMs;
  if (tel < REACAO_MINIMA_MS) return `«${nome}» avisa em ${tel} ms — abaixo do piso de ${REACAO_MINIMA_MS} ms`;
  if (v.hp <= 0) return `«${nome}» tem ${v.hp} de vida`;
  if (v.dano < 0) return `«${nome}» causa dano negativo`;
  if (a.ataque === 'projetil' && !a.projetil) return `«${nome}» atira sem projétil declarado`;
  if (a.ataque !== 'projetil' && a.projetil) return `«${nome}» declara projétil e não atira`;
  return null;
}

/* ------------------------------------------------------------------------------------------------
 * O ciclo de vida, em TS puro
 * ---------------------------------------------------------------------------------------------- */

export type EstadoComum =
  | 'patrulha'      // anda/voa de um lado para o outro
  | 'telegrafo'     // viu o jogador e avisa — **é aqui que o jogador pode reagir**
  | 'ataque'        // investida, projétil ou picada
  | 'recupera'      // a janela em que ele está indefeso
  | 'morto';

export interface CorpoComum {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  estado: EstadoComum;
  /** Instante (ms do jogo) em que o estado atual termina. */
  ate: number;
  hp: number;
  /** O que o corpo deixou para trás no sítio onde caiu (`MEC-004`: moeda). */
  morto: boolean;
}

export interface Contexto {
  readonly jogadorX: number;
  readonly jogadorY: number;
  /** Limites do vaivém do corpo, em px de mundo. */
  readonly minX: number;
  readonly maxX: number;
  /** Teto e chão do vaivém (só o voador usa o teto). */
  readonly minY: number;
  readonly maxY: number;
  readonly agora: number;
  /** A gravidade é zero para quem voa — o motor pergunta, não assume. */
  readonly deltaMs: number;
}

/**
 * Um passo do corpo. Devolve o corpo novo (nunca o muta) para o teste poder comparar duas
 * execuções e a cena poder guardar o resultado no sprite física.
 *
 * A ordem das decisões é a ordem das perguntas do jogador: *estou a ver-te?* → *avisei?* →
 * *ataquei?* → *estou indefeso?* → *volto a andar*.
 */
export function passoComum(
  corpo: CorpoComum,
  arq: Arquetipo,
  ctx: Contexto,
): CorpoComum {
  if (corpo.estado === 'morto') return corpo;

  const dx = ctx.jogadorX - corpo.x;
  const dy = ctx.jogadorY - corpo.y;
  const ve = Math.abs(dx) <= arq.alcancePx && Math.abs(dy) <= arq.faixaPx;

  switch (corpo.estado) {
    case 'patrulha': {
      // o voador faz vaivém em **dois** eixos; o resto bate no limite e vira
      const proximo = corpo.x + corpo.facing * arq.velocidade * (ctx.deltaMs / 1000);
      let facing = corpo.facing;
      let x = proximo;
      if (proximo < ctx.minX) { facing = 1; x = ctx.minX; }
      if (proximo > ctx.maxX) { facing = -1; x = ctx.maxX; }
      const vy = arq.ataque === 'picada'
        ? Math.sin((ctx.agora / 1000) * 1.6) * 40 * (ctx.deltaMs / 1000) : 0;
      if (ve) {
        return { ...corpo, x, vx: facing * arq.velocidade, vy, facing, estado: 'telegrafo', ate: ctx.agora + arq.telegraphMs };
      }
      return { ...corpo, x, vx: facing * arq.velocidade, vy, facing };
    }

    case 'telegrafo': {
      // durante o aviso ninguém se mexe: o corpo fica parado para o aviso ser lido
      if (ctx.agora < corpo.ate) {
        return { ...corpo, vx: 0, vy: 0, facing: dx >= 0 ? 1 : -1 };
      }
      return { ...corpo, vx: 0, vy: 0, facing: dx >= 0 ? 1 : -1, estado: 'ataque', ate: ctx.agora + duracaoAtaque(arq) };
    }

    case 'ataque': {
      const corpoAtaque = arq.ataque === 'picada'
        ? { vx: 0, vy: 260 }
        : arq.ataque === 'projetil'
          ? { vx: 0, vy: 0 }                 // quem atira não se atira
          : { vx: corpo.facing * 140, vy: 0 };
      if (ctx.agora < corpo.ate) return { ...corpo, ...corpoAtaque };
      return { ...corpo, vx: 0, vy: 0, estado: 'recupera', ate: ctx.agora + arq.recoverMs };
    }

    case 'recupera': {
      if (ctx.agora < corpo.ate) return { ...corpo, vx: 0, vy: 0 };
      return { ...corpo, vx: 0, vy: 0, estado: 'patrulha' };
    }

    default:
      return corpo;
  }
}

/**
 * Quanto dura o ataque. **Não é tempo de telegrafo**: é a janela em que o corpo é perigoso.
 * O projétil é instantâneo do lado do corpo (o que viaja é o projétil, não ele), por isso 120 ms
 * chegam para o disparo sair uma vez.
 */
export function duracaoAtaque(arq: Arquetipo): number {
  switch (arq.ataque) {
    case 'investida': return 200;
    case 'picada': return 450;
    case 'projetil': return 120;
    default: return 0;
  }
}

/** Só causa dano de contacto durante o ataque — o aviso existe para ser lido. */
export function ePerigoso(corpo: CorpoComum): boolean {
  return corpo.estado === 'ataque';
}

/** Um golpe do jogador. Devolve o corpo; `matou` diz o que a cena tem de fazer. */
export function golpear(corpo: CorpoComum, dano: number): { corpo: CorpoComum; matou: boolean } {
  if (corpo.estado === 'morto') return { corpo, matou: false };
  const hp = corpo.hp - dano;
  if (hp <= 0) return { corpo: { ...corpo, hp: 0, estado: 'morto', vx: 0, vy: 0, morto: true }, matou: true };
  return { corpo: { ...corpo, hp }, matou: false };
}

/* ------------------------------------------------------------------------------------------------
 * O censo — quantos corpos, de que arquétipo, por sala
 * ---------------------------------------------------------------------------------------------- */

export interface Censo {
  readonly total: number;
  readonly porArquetipo: Readonly<Record<ArquetipoId, number>>;
}

/** Conta os inimigos de uma grade. `E`, `T` e `V` são inimigos; `A` é armadilha. */
export function censoDeGrade(linhas: readonly string[]): Censo {
  const por: Record<ArquetipoId, number> = { sentinela: 0, atirador: 0, voador: 0 };
  let total = 0;
  for (const linha of linhas) {
    for (const ch of linha) {
      const a = arquetipoDoGlifo(ch);
      if (!a) continue;
      por[a.id] += 1;
      total += 1;
    }
  }
  return { total, porArquetipo: por };
}
