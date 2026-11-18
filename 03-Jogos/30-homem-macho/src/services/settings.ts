/**
 * `UI-02` · Configurações — o que o jogador pode mudar, e onde isso fica guardado.
 *
 * Sem `phaser`, sem `react` (`ADR-01`). Quem lê é o `GameScene` (atalhos, tipo de controlo),
 * a UI (legendas, som) e o menu (os valores que desenha).
 *
 * Três regras que este ficheiro garante:
 *
 * 1. **Toda a configuração tem padrão.** Um save antigo, um `localStorage` vazio ou um JSON
 *    adulterado produzem a mesma configuração válida — nunca um `undefined` no meio do jogo.
 * 2. **Uma tecla pertence a uma ação só.** O jogador que remapeia `K` para `atacar` perde o
 *    `K` de `disparar`; se essa remoção deixasse a ação sem tecla nenhuma, a troca é recusada
 *    com um aviso legível em vez de um controlo morto.
 * 3. **Os valores são limitados na entrada**, não na saída: volume fica em 0…1 e nunca há
 *    `NaN` a chegar a um `gain`.
 */
export type TipoControle = 'teclado' | 'teclado-rato' | 'toque';
export type Idioma = 'pt-BR' | 'en-US';

/** As ações que o jogo lê do teclado. Nomes de ação, não de tecla — é isso que permite remapear. */
export type AcaoJogo =
  | 'esquerda' | 'direita' | 'pular' | 'descer' | 'atacar' | 'disparar' | 'gancho' | 'interagir'
  | 'correr' | 'inventario' | 'habilidades' | 'mapa' | 'pausar';

export const ACOES: readonly AcaoJogo[] = [
  'esquerda', 'direita', 'pular', 'descer', 'atacar', 'disparar', 'gancho', 'interagir',
  'correr', 'inventario', 'habilidades', 'mapa', 'pausar',
];

/** Rótulo do jogador para cada ação (a UI não inventa texto a partir do `id`). */
export const ROTULO_ACAO: Record<AcaoJogo, string> = {
  esquerda: 'MOVER À ESQUERDA',
  direita: 'MOVER À DIREITA',
  pular: 'PULAR / NADAR PARA CIMA',
  descer: 'DESCER / NADAR PARA BAIXO',
  atacar: 'ATACAR',
  disparar: 'DISPARAR',
  gancho: 'GANCHO',
  interagir: 'INTERAGIR / SALVAR',
  correr: 'CORRER',
  // `UI-07`: a mochila é uma ação como as outras — remapeável, com tecla de padrão `I`
  inventario: 'ABRIR A MOCHILA',
  // `UI-14`: as habilidades também são uma ação — remapeável, com `H` de padrão
  habilidades: 'ABRIR AS HABILIDADES',
  // `UI-22`: o mapa é ação como as outras — remapeável, com `M` de padrão
  mapa: 'ABRIR O MAPA',
  pausar: 'PAUSAR',
};

/**
 * Teclas no vocabulário do Phaser (`addKeys`), que é o único sítio onde o nome importa.
 * `PULAR` fica com duas teclas de propósito: `ESPAÇO` e `W` fazem parte do controlo desde
 * `MEC-001`, e tirar o `W` seria mudar o jogo ao abrir as configurações.
 */
export const ATALHOS_PADRAO: Record<AcaoJogo, string[]> = {
  esquerda: ['A', 'LEFT'],
  direita: ['D', 'RIGHT'],
  pular: ['SPACE', 'W'],
  // `S`/`↓` descem na água, na parede de garra e soltam o gancho — é ação, não "tecla de baixo"
  descer: ['S', 'DOWN'],
  atacar: ['J'],
  disparar: ['K'],
  gancho: ['Q'],
  interagir: ['E'],
  correr: ['SHIFT'],
  /** `UI-07`: `I` de inventário — o padrão pedido, e o que o rodapé e a pausa anunciam. */
  inventario: ['I'],
  habilidades: ['H'],
  /// `UI-22` (`DEC-043`): `M` de mapa — a tecla que o jogador pediu
  mapa: ['M'],
  pausar: ['ESC'],
};

/** Como o nome da tecla aparece ao jogador. O que não estiver aqui mostra-se como está. */
export const ROTULO_TECLA: Record<string, string> = {
  A: 'A', D: 'D', W: 'W', S: 'S', I: 'I', J: 'J', K: 'K', Q: 'Q', E: 'E', R: 'R', F: 'F',
  LEFT: '←', RIGHT: '→', UP: '↑', DOWN: '↓', SPACE: 'ESPAÇO', SHIFT: 'SHIFT',
  ESC: 'ESC', ENTER: 'ENTER', TAB: 'TAB', CTRL: 'CTRL', ALT: 'ALT',
};

export interface Config {
  /** 0…1. Onde existir áudio, estes três valores são os únicos que ele lê. */
  somGeral: number;
  musica: number;
  efeitos: number;
  /** `§4.6`: informação sonora relevante também em texto. */
  legendas: boolean;
  movimentoReduzido: boolean;
  idioma: Idioma;
  tipoControle: TipoControle;
  atalhos: Record<AcaoJogo, string[]>;
}

export const CONFIG_PADRAO: Config = {
  somGeral: 0.8,
  musica: 0.7,
  efeitos: 0.8,
  legendas: true,
  movimentoReduzido: false,
  idioma: 'pt-BR',
  tipoControle: 'teclado-rato',
  atalhos: ATALHOS_PADRAO,
};

/** `UI-02`: os passos de volume. ←/→ andam de 10 em 10, e 0 e 1 estão sempre ao alcance. */
export const PASSO_VOLUME = 0.1;

export const TIPOS_CONTROLE: readonly { id: TipoControle; rotulo: string; linha: string }[] = [
  { id: 'teclado', rotulo: 'TECLADO', linha: 'Só teclado. O clique não ataca.' },
  { id: 'teclado-rato', rotulo: 'TECLADO + RATO', linha: 'Teclado, e o clique esquerdo ataca.' },
  { id: 'toque', rotulo: 'TOQUE', linha: 'Botões na tela, para tablet e celular.' },
];

/** `§4.7`: PT-BR desde o MVP; EN-US entra quando houver textos traduzidos. */
export const IDIOMAS: readonly { id: Idioma; rotulo: string; disponivel: boolean }[] = [
  { id: 'pt-BR', rotulo: 'PORTUGUÊS (BR)', disponivel: true },
  { id: 'en-US', rotulo: 'ENGLISH (US)', disponivel: false },
];

const KEY = 'homem-macho/config/v1';

function limitar(v: unknown, padrao: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : padrao;
  return Math.min(1, Math.max(0, n));
}

/** Chaves válidas: maiúsculas, sem espaços. Uma tecla inventada cai no padrão da ação. */
function teclaValida(k: unknown): k is string {
  return typeof k === 'string' && /^[A-Z0-9]{1,12}$/.test(k);
}

/**
 * **Normaliza o que vier.** É a fronteira entre "dado que esteve num `localStorage`" e "config
 * em uso": depois desta função, todos os campos existem e têm tipo.
 */
export function normalizar(bruto: unknown): Config {
  const b = (typeof bruto === 'object' && bruto !== null ? bruto : {}) as Partial<Config>;
  const atalhos = { ...ATALHOS_PADRAO } as Record<AcaoJogo, string[]>;
  const origem = (typeof b.atalhos === 'object' && b.atalhos !== null ? b.atalhos : {}) as Record<string, unknown>;
  for (const acao of ACOES) {
    const lista = origem[acao];
    // maiúsculas primeiro: `z` é a mesma tecla que `Z`, e recusá-la seria punir o save, não o lixo
    const limpa = Array.isArray(lista)
      ? lista.map((t) => (typeof t === 'string' ? t.trim().toUpperCase() : t)).filter(teclaValida)
      : [];
    if (limpa.length) atalhos[acao] = [...new Set(limpa)];
  }
  return {
    somGeral: limitar(b.somGeral, CONFIG_PADRAO.somGeral),
    musica: limitar(b.musica, CONFIG_PADRAO.musica),
    efeitos: limitar(b.efeitos, CONFIG_PADRAO.efeitos),
    legendas: typeof b.legendas === 'boolean' ? b.legendas : CONFIG_PADRAO.legendas,
    movimentoReduzido: typeof b.movimentoReduzido === 'boolean'
      ? b.movimentoReduzido
      : CONFIG_PADRAO.movimentoReduzido,
    idioma: b.idioma === 'en-US' || b.idioma === 'pt-BR' ? b.idioma : CONFIG_PADRAO.idioma,
    tipoControle: b.tipoControle === 'teclado' || b.tipoControle === 'toque'
      ? b.tipoControle
      : CONFIG_PADRAO.tipoControle,
    atalhos,
  };
}

function storage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export function loadConfig(): Config {
  const store = storage();
  if (!store) return normalizar(null);
  try {
    const raw = store.getItem(KEY);
    return normalizar(raw ? JSON.parse(raw) : null);
  } catch {
    return normalizar(null);
  }
}

export function saveConfig(config: Config): void {
  try { storage()?.setItem(KEY, JSON.stringify(config)); } catch { /* sem storage: vale o padrão */ }
}

export function resetConfig(): Config {
  const config = normalizar(null);
  saveConfig(config);
  return config;
}

/** Quantas teclas tem a ação — o menu mostra isto, e a regra 2 recusa deixar em zero. */
export function teclasDe(config: Config, acao: AcaoJogo): string[] {
  return config.atalhos[acao] ?? [];
}

/** O jogador vê `ESPAÇO`, não `SPACE`. */
export function rotuloTecla(tecla: string): string {
  return ROTULO_TECLA[tecla] ?? tecla;
}

export function rotuloAtalho(config: Config, acao: AcaoJogo): string {
  const lista = teclasDe(config, acao);
  return lista.length ? lista.map(rotuloTecla).join(' / ') : '—';
}

export interface ResultadoAtalho { ok: boolean; config: Config; aviso?: string }

/**
 * Remapeia `acao` para `tecla`. A tecla sai de qualquer outra ação em que estivesse (regra 2);
 * se essa remoção esvaziar a outra ação, **nada muda** e o menu explica por quê.
 *
 * A ação fica com **uma** tecla: a que o jogador escolheu. `PULAR` nasce com `ESPAÇO` e `W`
 * porque os dois fazem parte do controlo (`MEC-001`), mas quem remapeia assume a escolha.
 */
export function definirAtalho(config: Config, acao: AcaoJogo, tecla: string): ResultadoAtalho {
  if (!teclaValida(tecla)) {
    return { ok: false, config, aviso: 'TECLA INVÁLIDA.' };
  }
  if (config.atalhos[acao]?.length === 1 && config.atalhos[acao][0] === tecla) {
    return { ok: true, config };
  }
  const atalhos = { ...config.atalhos } as Record<AcaoJogo, string[]>;
  for (const outra of ACOES) {
    if (outra === acao) continue;
    if (!atalhos[outra].includes(tecla)) continue;
    const restante = atalhos[outra].filter((t) => t !== tecla);
    if (!restante.length) {
      return {
        ok: false,
        config,
        aviso: `${rotuloTecla(tecla)} é a única tecla de ${ROTULO_ACAO[outra]}.`,
      };
    }
    atalhos[outra] = restante;
  }
  // **substitui**, não acumula: o jogador escolheu *a* tecla da ação, não "mais uma"
  atalhos[acao] = [tecla];
  return { ok: true, config: { ...config, atalhos } };
}

/** A tecla que `acao` perde quando outra a toma — usado pelo menu para explicar a troca. */
export function donaDaTecla(config: Config, tecla: string, exceto: AcaoJogo): AcaoJogo | null {
  for (const acao of ACOES) {
    if (acao !== exceto && config.atalhos[acao].includes(tecla)) return acao;
  }
  return null;
}

/** Volumes com passo — `←/→` no painel andam exactamente isto. */
export function ajustarVolume(valor: number, passo: number): number {
  return Math.min(1, Math.max(0, Math.round((valor + passo) * 100) / 100));
}
