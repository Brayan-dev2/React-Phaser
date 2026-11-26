/**
 * `UI-02` — a **máquina do menu inicial**, em função pura (`docs/04` §4.2, §4.6).
 *
 * O componente desenha; quem decide é este ficheiro. As regras do menu são regras de *jogo*
 * (quem começa, em que slot, com que dificuldade, com que teclas) e um menu que só se testa
 * clicando é um menu que se estraga em silêncio.
 *
 * Ecrãs e painéis:
 *
 * ```
 * titulo ──qualquer tecla──▶ principal ──▶ dificuldade ──▶ (nova partida)
 *                               │        └▶ saves ────────▶ (retoma no slot escolhido)
 *                               ├▶ config ─▶ atalhos
 *                               └▶ creditos
 * ```
 *
 * As invariantes (todas com teste em `menuMachine.test.ts`):
 *
 * 1. **Nada começa focado.** O primeiro `Enter`/`↓` escolhe, o segundo confirma. Quem aperta uma
 *    tecla só para dispensar o "PRESSIONE QUALQUER BOTÃO" não é lançado numa partida.
 * 2. **Uma tecla, uma consequência.** O gesto que dispensa o título nunca age no menu.
 * 3. **Entrar é só `Enter` num item em foco.** `←/→` ajustam valores e nunca entram no jogo.
 * 4. **Esc voltar é sempre local**: de um painel volta ao menu, do menu não faz nada (o menu
 *    inicial é a raiz).
 */
import type { Difficulty } from '../core/types';
import {
  ACOES, CONFIG_PADRAO, ajustarVolume, definirAtalho, PASSO_VOLUME,
  type AcaoJogo, type Config,
} from '../services/settings';
import {
  GRUPOS, NOME_MAX, PERSONAGEM_PADRAO, ciclar, comNome, digitarNome, mesmoNome,
  normalizarPersonagem,
  personagemAleatorio,
  type Grupo, type Personagem,
} from '../services/character';

/**
 * `UI-12` — as **linhas** do ecrã de criação: o nome (que se escreve) e depois os sete grupos
 * (que se percorrem com `←/→`). O nome vem primeiro porque é a única linha onde as teclas de
 * letras fazem outra coisa — e porque é o primeiro campo que um leitor de ecrã anuncia.
 */
export const LINHAS_PERSONAGEM = ['nome', ...GRUPOS] as const;
export type LinhaPersonagem = typeof LINHAS_PERSONAGEM[number];

export type Acao = 'continuar' | 'jogar' | 'config' | 'creditos';
export type Painel =
  | 'nenhum' | 'dificuldade' | 'personagem' | 'saves' | 'config' | 'atalhos' | 'creditos';
export type Tela = 'titulo' | 'principal';

/** As linhas do painel de configurações, na ordem em que o jogador as lê. */
export const LINHAS_CONFIG = [
  'tipoControle', 'atalhos', 'somGeral', 'musica', 'efeitos', 'legendas', 'movimentoReduzido',
  'idioma', 'restaurar',
] as const;
export type LinhaConfig = typeof LINHAS_CONFIG[number];

export interface MenuState {
  tela: Tela;
  /** `null` = nada escolhido ainda. É o estado inicial do menu principal, sempre. */
  foco: Acao | null;
  painel: Painel;
  /** Linha/slot escolhido dentro do painel aberto. */
  indice: number;
  dificuldade: Difficulty;
  /**
   * `UI-12`: o personagem em construção. Vive no estado do menu (e não num `useState` do
   * componente) porque é uma escolha de jogo: vai para o save e para o `BootScene`.
   */
  personagem: Personagem;
  /** `null` = não está à espera de uma tecla. Quando há ação, o próximo gesto remapeia-a. */
  capturando: AcaoJogo | null;
  /** Uma frase para o jogador: slot vazio, tecla recusada, atalho trocado. */
  aviso: string | null;
}

export interface SlotInfo { slot: number; ocupado: boolean; rotulo: string | null }

export interface MenuContext {
  slots: SlotInfo[];
  dificuldades: readonly Difficulty[];
  config: Config;
  /** Slot onde uma partida nova vai entrar — o menu diz qual é **antes** de o jogador confirmar. */
  slotNovaPartida: number;
}

export type Pedido =
  | { tipo: 'nenhum' }
  | { tipo: 'novo'; dificuldade: Difficulty; personagem: Personagem }
  | { tipo: 'continuar'; slot: number };

export interface Resultado { estado: MenuState; config: Config; pedido: Pedido }

const NADA: Pedido = { tipo: 'nenhum' };

export function estadoInicial(
  ctx: MenuContext, comTitulo = true, personagem: Personagem = PERSONAGEM_PADRAO,
): MenuState {
  return {
    tela: comTitulo ? 'titulo' : 'principal',
    foco: null,
    painel: 'nenhum',
    indice: 0,
    dificuldade: ctx.dificuldades.includes('medium') ? 'medium' : (ctx.dificuldades[0] ?? 'medium'),
    personagem: normalizarPersonagem(personagem),
    capturando: null,
    aviso: null,
  };
}

/** `CONTINUAR` só existe quando há save: um botão que não pode fazer nada não é um botão. */
export function temSaves(ctx: MenuContext): boolean {
  return ctx.slots.some((s) => s.ocupado);
}

export function ordemPrincipal(ctx: MenuContext): Acao[] {
  return temSaves(ctx)
    ? ['continuar', 'jogar', 'config', 'creditos']
    : ['jogar', 'config', 'creditos'];
}

/** Quantas linhas tem o painel aberto — o menu usa isto para desenhar e para limitar o índice. */
export function linhasDe(painel: Painel, ctx: MenuContext): number {
  switch (painel) {
    case 'dificuldade': return ctx.dificuldades.length;
    case 'personagem': return LINHAS_PERSONAGEM.length;
    case 'saves': return ctx.slots.length;
    case 'config': return LINHAS_CONFIG.length;
    case 'atalhos': return ACOES.length;
    default: return 0;
  }
}

/**
 * `KeyboardEvent.key` → nome de tecla do Phaser. Só o painel de atalhos precisa disto, e vive
 * aqui para o componente React não ter uma tabela própria (e divergente).
 */
export function teclaPhaser(key: string): string | null {
  const mapa: Record<string, string> = {
    ' ': 'SPACE', Escape: 'ESC', Enter: 'ENTER', Tab: 'TAB',
    Shift: 'SHIFT', Control: 'CTRL', Alt: 'ALT',
    ArrowLeft: 'LEFT', ArrowRight: 'RIGHT', ArrowUp: 'UP', ArrowDown: 'DOWN',
  };
  if (mapa[key]) return mapa[key];
  if (/^[a-zA-Z0-9]$/.test(key)) return key.toUpperCase();
  return null;
}

function mover(indice: number, passo: number, total: number): number {
  if (total <= 0) return 0;
  return (indice + passo + total) % total;
}

function comAviso(estado: MenuState, aviso: string | null): MenuState {
  return { ...estado, aviso };
}

/** Ajusta a linha `linha` do painel de configurações em `passo` (+1/−1). */
function ajustar(
  estado: MenuState, ctx: MenuContext, passo: number,
): { estado: MenuState; config: Config } {
  const linha = LINHAS_CONFIG[estado.indice];
  const c = ctx.config;
  switch (linha) {
    case 'tipoControle': {
      const ordem: Config['tipoControle'][] = ['teclado', 'teclado-rato', 'toque'];
      const i = Math.max(0, ordem.indexOf(c.tipoControle));
      const tipoControle = ordem[(i + passo + ordem.length) % ordem.length];
      return { estado: comAviso(estado, null), config: { ...c, tipoControle } };
    }
    case 'somGeral':
      return { estado: comAviso(estado, null), config: { ...c, somGeral: ajustarVolume(c.somGeral, passo * PASSO_VOLUME) } };
    case 'musica':
      return { estado: comAviso(estado, null), config: { ...c, musica: ajustarVolume(c.musica, passo * PASSO_VOLUME) } };
    case 'efeitos':
      return { estado: comAviso(estado, null), config: { ...c, efeitos: ajustarVolume(c.efeitos, passo * PASSO_VOLUME) } };
    case 'legendas':
      return { estado: comAviso(estado, null), config: { ...c, legendas: !c.legendas } };
    case 'movimentoReduzido':
      return { estado: comAviso(estado, null), config: { ...c, movimentoReduzido: !c.movimentoReduzido } };
    case 'idioma':
      // `§4.7`: só PT-BR tem texto traduzido; trocar para EN-US mostraria a mesma coisa,
      // portanto o menu diz isso em vez de fingir que mudou.
      return { estado: comAviso(estado, 'SÓ PT-BR NESTA VERSÃO — ENTRARÁ COM OS TEXTOS.'), config: c };
    case 'restaurar':
      return { estado: estado, config: c };
    default:
      return { estado, config: c };
  }
}

/** Confirma a linha em foco do painel de configurações. */
function confirmarConfig(
  estado: MenuState, ctx: MenuContext,
): { estado: MenuState; config: Config; pedido: Pedido } {
  const linha = LINHAS_CONFIG[estado.indice];
  if (linha === 'atalhos') {
    return { estado: { ...estado, painel: 'atalhos', indice: 0, aviso: null }, config: ctx.config, pedido: NADA };
  }
  if (linha === 'restaurar') {
    return {
      estado: comAviso(estado, 'PADRÕES RESTAURADOS.'),
      config: { ...CONFIG_PADRAO, atalhos: { ...CONFIG_PADRAO.atalhos } },
      pedido: NADA,
    };
  }
  const r = ajustar(estado, ctx, +1);
  return { estado: r.estado, config: r.config, pedido: NADA };
}

/**
 * Uma tecla. `key` é o `KeyboardEvent.key` do DOM; em modo de captura de atalho, `teclaFisica`
 * já vem traduzida por `teclaPhaser` (ou `null`, para uma tecla que o jogo não sabe usar).
 */
export function tecla(
  estado: MenuState, key: string, ctx: MenuContext, teclaFisica?: string | null,
): Resultado {
  const semConfig = ctx.config;

  // 0. a captura de atalho **engole tudo**: é um modo, não uma tecla
  if (estado.capturando) {
    if (key === 'Escape') {
      return { estado: comAviso({ ...estado, capturando: null }, 'REMAPEAMENTO CANCELADO.'), config: semConfig, pedido: NADA };
    }
    if (key === 'Tab') return { estado, config: semConfig, pedido: NADA };
    const tecla = teclaFisica ?? teclaPhaser(key);
    if (!tecla) {
      return { estado: comAviso(estado, 'ESSA TECLA NÃO SERVE — ESCOLHA OUTRA.'), config: semConfig, pedido: NADA };
    }
    const r = definirAtalho(semConfig, estado.capturando, tecla);
    if (!r.ok) return { estado: comAviso({ ...estado, capturando: null }, r.aviso ?? 'TECLA RECUSADA.'), config: semConfig, pedido: NADA };
    const aplicada = estado.capturando;
    return {
      estado: comAviso({ ...estado, capturando: null }, `${tecla} → ${aplicada.toUpperCase()}.`),
      config: r.config,
      pedido: NADA,
    };
  }

  // 1. o título cede ao primeiro gesto — e esse gesto **não** age no menu
  if (estado.tela === 'titulo') {
    if (key === 'Tab') return { estado, config: semConfig, pedido: NADA };  // o Tab tem outro caminho
    return { estado: { ...estado, tela: 'principal', foco: null, aviso: null }, config: semConfig, pedido: NADA };
  }

  const total = linhasDe(estado.painel, ctx);

  /*
   * 1b. `UI-12` — a criação de personagem tem regras próprias: `R` sorteia, `←/→` mudam o valor
   * do grupo em foco e `Enter` começa a partida. Por isso é tratada **antes** das setas
   * genéricas, e não como mais um painel de lista.
   */
  if (estado.painel === 'personagem') {
    const linha = LINHAS_PERSONAGEM[Math.min(estado.indice, LINHAS_PERSONAGEM.length - 1)];
    /** Índice do grupo quando a linha é um grupo (a linha 0 é o nome). */
    const grupo = linha === 'nome' ? null : linha;

    // --- o nome: a única linha em que as letras escrevem ---
    if (grupo === null) {
      if (key === 'Backspace') {
        const r = digitarNome(estado.personagem, '', true);
        return { estado: { ...estado, personagem: r.personagem, aviso: null }, config: semConfig, pedido: NADA };
      }
      // uma letra, um dígito ou um espaço escrevem — inclusive o `R`, que fora do nome sorteia
      if (key.length === 1 && /^[\p{L}\p{N} ]$/u.test(key)) {
        const r = digitarNome(estado.personagem, key);
        return {
          estado: {
            ...estado,
            personagem: r.personagem,
            aviso: r.egg?.aviso ?? null,
          },
          config: semConfig,
          pedido: NADA,
        };
      }
      if (key === 'Escape') {
        return {
          estado: { ...estado, painel: 'dificuldade', indice: 0, aviso: null },
          config: semConfig, pedido: NADA,
        };
      }
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        const passo = key === 'ArrowDown' ? 1 : -1;
        return {
          estado: { ...estado, indice: mover(estado.indice, passo, LINHAS_PERSONAGEM.length), aviso: null },
          config: semConfig, pedido: NADA,
        };
      }
      if (key === 'Enter') {
        return {
          estado,
          config: semConfig,
          pedido: { tipo: 'novo', dificuldade: estado.dificuldade, personagem: estado.personagem },
        };
      }
      return { estado, config: semConfig, pedido: NADA };
    }

    if (key === 'Escape') {
      return {
        estado: { ...estado, painel: 'dificuldade', indice: 0, aviso: null },
        config: semConfig, pedido: NADA,
      };
    }
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      const passo = key === 'ArrowDown' ? 1 : -1;
      return {
        estado: { ...estado, indice: mover(estado.indice, passo, LINHAS_PERSONAGEM.length), aviso: null },
        config: semConfig, pedido: NADA,
      };
    }
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const passo = key === 'ArrowRight' ? 1 : -1;
      return {
        estado: { ...estado, personagem: ciclar(estado.personagem, grupo, passo), aviso: null },
        config: semConfig, pedido: NADA,
      };
    }
    // `R` sorteia o personagem inteiro: sete campos — quem não quer decidir não fica preso
    if (key === 'r' || key === 'R') {
      // o sorteio passa pelo mesmo caminho do botão: o nome escrito à mão fica
      return {
        estado: sortearPersonagem(estado),
        config: semConfig, pedido: NADA,
      };
    }
    if (key === 'Enter' || key === ' ') {
      return {
        estado,
        config: semConfig,
        pedido: { tipo: 'novo', dificuldade: estado.dificuldade, personagem: estado.personagem },
      };
    }
    return { estado, config: semConfig, pedido: NADA };
  }

  // 2. um painel aberto captura o teclado
  if (estado.painel !== 'nenhum') {
    if (key === 'Escape') {
      const destino: Painel = estado.painel === 'atalhos' ? 'config' : 'nenhum';
      return {
        estado: { ...estado, painel: destino, indice: destino === 'nenhum' ? 0 : estado.indice, foco: null, aviso: null },
        config: semConfig, pedido: NADA,
      };
    }
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      const passo = key === 'ArrowDown' ? 1 : -1;
      return { estado: { ...estado, indice: mover(estado.indice, passo, total), aviso: null }, config: semConfig, pedido: NADA };
    }
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const passo = key === 'ArrowRight' ? 1 : -1;
      if (estado.painel === 'dificuldade') {
        const i = mover(estado.indice, passo, ctx.dificuldades.length);
        return {
          estado: { ...estado, indice: i, dificuldade: ctx.dificuldades[i], aviso: null },
          config: semConfig, pedido: NADA,
        };
      }
      if (estado.painel === 'config') {
        const r = ajustar(estado, ctx, passo);
        return { estado: r.estado, config: r.config, pedido: NADA };
      }
      // `saves`, `atalhos` e `creditos` são listas: ←/→ não mudam nada
      return { estado, config: semConfig, pedido: NADA };
    }
    if (key === 'Enter' || key === ' ') {
      if (estado.painel === 'dificuldade') {
        // `UI-12`: a dificuldade já está escolhida — o passo seguinte é **quem** vai jogar
        return {
          estado: { ...estado, painel: 'personagem', indice: 0, aviso: null },
          config: semConfig, pedido: NADA,
        };
      }
      if (estado.painel === 'saves') {
        const alvo = ctx.slots[estado.indice];
        if (!alvo?.ocupado) {
          return { estado: comAviso(estado, `SLOT ${estado.indice + 1} VAZIO — COMECE POR JOGAR.`), config: semConfig, pedido: NADA };
        }
        return { estado, config: semConfig, pedido: { tipo: 'continuar', slot: alvo.slot } };
      }
      if (estado.painel === 'config') {
        return confirmarConfig(estado, ctx);
      }
      if (estado.painel === 'atalhos') {
        const acao = ACOES[estado.indice];
        return {
          estado: comAviso({ ...estado, capturando: acao ?? null }, `PRESSIONE A NOVA TECLA PARA ${acao?.toUpperCase() ?? ''}.`),
          config: semConfig, pedido: NADA,
        };
      }
      // `creditos`: só se sai com `Esc`
      return { estado, config: semConfig, pedido: NADA };
    }
    return { estado, config: semConfig, pedido: NADA };
  }

  // 3. menu principal
  const lista = ordemPrincipal(ctx);
  if (key === 'ArrowDown' || key === 'ArrowUp') {
    const passo = key === 'ArrowDown' ? 1 : -1;
    if (estado.foco === null) return { estado: { ...estado, foco: lista[0], aviso: null }, config: semConfig, pedido: NADA };
    const i = Math.max(0, lista.indexOf(estado.foco));
    return { estado: { ...estado, foco: lista[mover(i, passo, lista.length)], aviso: null }, config: semConfig, pedido: NADA };
  }
  if (key === 'Enter' || key === ' ') {
    if (estado.foco === null) return { estado: { ...estado, foco: lista[0] }, config: semConfig, pedido: NADA };
    switch (estado.foco) {
      case 'jogar':
        return { estado: { ...estado, painel: 'dificuldade', indice: Math.max(0, ctx.dificuldades.indexOf(estado.dificuldade)), aviso: null }, config: semConfig, pedido: NADA };
      case 'continuar':
        if (!temSaves(ctx)) return { estado: comAviso(estado, 'NÃO HÁ SAVE PARA CONTINUAR.'), config: semConfig, pedido: NADA };
        // o cursor entra no save mais recente: é o que a maioria dos jogadores quer
        return { estado: { ...estado, painel: 'saves', indice: Math.max(0, ctx.slots.findIndex((s) => s.ocupado)), aviso: null }, config: semConfig, pedido: NADA };
      case 'config':
        return { estado: { ...estado, painel: 'config', indice: 0, aviso: null }, config: semConfig, pedido: NADA };
      case 'creditos':
        return { estado: { ...estado, painel: 'creditos', indice: 0, aviso: null }, config: semConfig, pedido: NADA };
      default:
        return { estado, config: semConfig, pedido: NADA };
    }
  }
  return { estado, config: semConfig, pedido: NADA };
}

/** O ponteiro move o foco **só quando se mexe** (`onPointerMove`, nunca `onPointerEnter`). */
export function apontar(estado: MenuState, alvo: Acao): MenuState {
  if (estado.tela === 'titulo' || estado.painel !== 'nenhum') return estado;
  return estado.foco === alvo ? estado : { ...estado, foco: alvo, aviso: null };
}

/** Clique num item do menu principal: mesma ordem do teclado, para o rato não ter regras próprias. */
export function clicar(estado: MenuState, alvo: Acao, ctx: MenuContext): Resultado {
  if (estado.tela === 'titulo') {
    return { estado: { ...estado, tela: 'principal', foco: null }, config: ctx.config, pedido: NADA };
  }
  if (estado.painel !== 'nenhum') return { estado, config: ctx.config, pedido: NADA };
  return tecla({ ...estado, foco: alvo }, 'Enter', ctx);
}

/**
 * `UI-12`: o rato escolhe um valor (o mesmo que `←/→` no grupo em foco) e pode sortear. Devolvem
 * **estado**, não `Resultado`: não mudam configuração nem começam partida, portanto o `App` não
 * tem nada a fazer com eles.
 */
export function escolherValor(estado: MenuState, grupo: Grupo, id: string): MenuState {
  if (estado.painel !== 'personagem') return estado;
  return {
    ...estado,
    personagem: normalizarPersonagem({ ...estado.personagem, [grupo]: id }),
    aviso: null,
  };
}

export function sortearPersonagem(estado: MenuState): MenuState {
  if (estado.painel !== 'personagem') return estado;
  // o sorteio mantém o nome: é a única coisa que o jogador escreveu com as próprias mãos
  return {
    ...estado,
    personagem: { ...personagemAleatorio(), nome: estado.personagem.nome },
    aviso: 'PERSONAGEM SORTEADO.',
  };
}

/**
 * `UI-12`: escrever o nome pelo rato/teclado do sistema (o campo de texto do ecrã). Tem de dar
 * **exatamente** o mesmo que escrever tecla a tecla — easter egg incluído.
 */
export function escreverNome(estado: MenuState, nome: string): MenuState {
  if (estado.painel !== 'personagem') return estado;
  /*
   * O campo de texto do ecrã mostra `HERÓI` como espaço vazio. Se o jogador escrever no fim
   * desse texto, o browser manda `HERÓIM`, `HERÓIMA`… — e o nome nunca seria `MACHO`. Aqui o
   * de-fábrica é retirado antes de entrar, para o rato e o teclado darem o mesmo resultado.
   */
  const anterior = estado.personagem.nome;
  const semFabrica = mesmoNome(anterior, PERSONAGEM_PADRAO.nome)
    && nome.toUpperCase().startsWith(PERSONAGEM_PADRAO.nome.toUpperCase())
    ? nome.slice(PERSONAGEM_PADRAO.nome.length)
    : nome;
  const r = comNome(estado.personagem, semFabrica);
  return {
    ...estado,
    personagem: r.personagem,
    aviso: r.egg?.aviso ?? null,
  };
}

/** O clique directo numa linha de painel (save, dificuldade) — sem passar pelo cursor. */
export function clicarLinha(estado: MenuState, indice: number, ctx: MenuContext): Resultado {
  if (estado.painel === 'nenhum') return { estado, config: ctx.config, pedido: NADA };
  return tecla({ ...estado, indice }, 'Enter', ctx);
}
