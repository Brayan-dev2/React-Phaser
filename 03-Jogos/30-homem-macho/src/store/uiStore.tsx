/** Estado de UI (não é fonte de verdade do jogo). Escuta o EventBus e re-renderiza. */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import type { Summary } from '../core/metrics';
import { EventBus, type GameEvents } from '../game/EventBus';
import type { PasswordSymbol } from '../core/password';
import type { SaveEnvelope } from '../services/save';
import type { ItemId } from '../core/items';
import type { Habilidade } from '../core/permanentes';

/** Emite a intenção de pausa para o jogo (EVT-005). */
function emitPause(paused: boolean): void { EventBus.emit('ui:pause', { paused }); }

export interface UiState {
  /**
   * `UI-02` — a tela inicial. Enquanto `true`, o jogo **não existe**: o `PhaserGame` nem é
   * montado (`§4.4`: menus são React; o canvas só sobe depois que o jogador decide entrar).
   * `title: false` é a escolha do jogador — o menu já está visível, ele está escolhendo.
   */
  menu: { open: boolean; title: boolean } | null;
  /** `MEC-007`: o save local, lido no boot. `null` = primeira partida. */
  hasSave: boolean;
  menuError: string | null;
  hp: number; shield: number; power: number;
  /** `EVT-003`: quantos itens ocupam espaço na mochila (o número do HUD). */
  items: number;
  /**
   * `UI-07` — o conteúdo da mochila, tal como a cena o tem. A UI **não** é a fonte de verdade:
   * prender e soltar são intenções (`ui:inventory-command`) e a resposta chega aqui.
   */
  bolsa: { itens: readonly ItemId[]; presos: readonly ItemId[] };
  /** `UI-07`: painel da mochila aberto. Pausa o jogo enquanto estiver (`game:inventario`). */
  inventario: boolean;
  /**
   * `UI-07` — o **baú das salas seguras**: um só para o jogo inteiro. `disponivel` é a única
   * coisa que muda com a posição do herói; o conteúdo é o mesmo em todas as salas seguras.
   */
  bau: { disponivel: boolean; itens: readonly ItemId[]; capacidade: number; moedas: number };
  /**
   * `MEC-004` (`DEC-037`): moedas de mobs e chefes. **Perdem-se todas na morte** — o número aqui é
   * o que o herói carrega agora, e a morte leva-o a zero.
   */
  moedas: number;
  /**
   * `MEC-004`: o que se perdeu na última morte, para o aviso. `null` quando não há nada a dizer.
   * Vive ~5 s e sai sozinho (o jogo já voltou a correr — não é um painel modal).
   */
  morte: {
    linhas: readonly string[]; moedasPerdidas: number; presoMantido: number;
    bolsa: string | null; bolsaDestruida: boolean;
  } | null;
  /**
   * `MEC-004` (`DEC-038`): a **bolsa da morte** — a única no mundo. `naSala` é o que faz o
   * marcador ficar dourado; `rotulo` já vem escrito (`BOLSA · L01-04 · 2 ITENS · 10 MOEDAS`).
   */
  bolsaMorte: { existe: boolean; naSala: boolean; rotulo: string | null; itens: number; moedas: number };
  /**
   * `UI-14` (`DEC-041`) — **as habilidades e os níveis**, prontos da cena: a UI não calcula preço
   * nem efeito. `custo` é `null` no máximo e em quem não a conquistou.
   */
  habilidades: {
    moedas: number;
    linhas: readonly {
      id: Habilidade; nome: string; nivel: number; max: number; conquistada: boolean;
      custo: number | null; texto: string;
    }[];
  };
  /** `UI-14`: o painel das habilidades está aberto (a cena está pausada enquanto estiver). */
  habilidadesPainel: boolean;
  /**
   * `UI-22` (`DEC-043`) — **o mapa**, pronto da cena: a planta do setor com o estado de cada sala,
   * as ligações e a coluna dos 16 setores. A UI não calcula topologia (a cena é que sabe onde o
   * herói está); ela desenha.
   */
  mapa: GameEvents['game:mapa'] | null;
  /** `UI-22`: o mapa está aberto (a cena está pausada enquanto estiver). */
  mapaPainel: boolean;
  room: { id: string; name: string; index: number; total: number; area: string };
  paused: boolean;
  /** `ENT-003`: barra de vida do chefe, quando há um na sala. */
  boss: { name: string; hp: number; max: number; phase: 1 | 2; defeated: boolean } | null;
  /**
   * `DEC-016` (`LVL-14` §8.2): `keys / 2`. É **contador**, não mochila: `3 / 2` é a sobra da
   * placa "DUAS CHAVES. UMA SOBRA." e a UI não cria um terceiro slot para ela.
   */
  keys: { keys: number; required: number } | null;
  /**
   * `LVL-16` §5.5 (`UI-20`): **postura**, não vida. `BAIXAS n/3` é o único progresso, e a
   * barra reenche depois de cada atordoamento porque o homem se recompõe.
   */
  posto: {
    baixas: number; baixasMax: number; poise: number; poiseMax: number;
    staggered: boolean; rendido: boolean;
  } | null;
  /** `MEC-012` §7.4: o fim — o crachá de 3 linhas e a última fala do jogo. */
  end: { badge: string[]; lastLine: string; badgeMs?: number } | null;
  /** `LVL-15` §5.3: selos do Guardião Duplo — `1 / 2` e `2 / 2`, e nada além disso. */
  seals: { seals: number; label: string; suspended?: boolean } | null;
  /** `HAB-06` (`LVL-06` §5): fôlego restante; só aparece quando submerso. */
  breath: { ms: number; max: number; submerged: boolean } | null;
  /** Relatório de sessão para playtest (`P-29`); `null` antes da primeira sala. */
  metrics: Summary | null;
  /** `MEC-008`: oferta recusável de dificuldade (aparece após 3 mortes na arena). */
  offer: { from: 'easy' | 'medium' | 'hard'; to: 'easy' | 'medium' | 'hard' } | null;
  /** `MEC-006`: painel da porta de senha aberto. */
  password: boolean;
  /** Feedback do painel: incompleto ou erro na posição `index`. */
  passwordHint: { kind: 'incomplete' | 'wrong'; index?: number } | null;
  text: string[] | null;
  toast: string | null;
  /**
   * `§4.6` — legenda do que só se ouviria. Vive na UI porque o jogo não a desenha, e é
   * **curta de propósito**: três segundos e sai, para não competir com o HUD.
   */
  subtitle: { text: string; kind: 'info' | 'perigo' | 'marco' } | null;
  completed: boolean;
  /**
   * `EVT-008` distingue **fim do recorte do MVP** (`scope: 'mvp'`, LVL-03) de **fim do jogo**
   * (`scope: 'campaign'`, `MEC-012` em LVL-16). Sem esta distinção o painel "FIM DO RECORTE"
   * aparecia por cima do crachá — e o último texto do jogo era um aviso de build.
   */
  /**
   * `DEC-047` — **só existe um fim**: a campanha. Havia `'mvp'`, que era o corte do recorte em
   * LVL-03; com os dezesseis setores na progressão, um «fim do MVP» a meio do jogo seria um ecrã a
   * dizer que acabou quando ainda faltam treze setores — e foi por isso que o valor saiu do tipo em
   * vez de ficar a apodrecer.
   */
  completedScope: 'campaign' | null;
  lastSave: { ok: boolean; revision?: number } | null;
}

const initial: UiState = {
  hp: 100, shield: 50, power: 100, items: 0,
  bolsa: { itens: [], presos: [] }, inventario: false,
  bau: { disponivel: false, itens: [], capacidade: 40, moedas: 0 },
  habilidades: { moedas: 0, linhas: [] },
  habilidadesPainel: false,
  mapa: null,
  mapaPainel: false,
  moedas: 0, morte: null,
  bolsaMorte: { existe: false, naSala: false, rotulo: null, itens: 0, moedas: 0 },
  room: { id: 'L01-01', name: 'Abertura silenciosa', index: 0, total: 6, area: 'Ruínas da Vigília' },
  menu: null, hasSave: false, menuError: null,
  paused: false, boss: null, keys: null, seals: null, posto: null, end: null, offer: null, metrics: null, breath: null, password: false, passwordHint: null, text: null, toast: null, subtitle: null, completed: false, completedScope: null, lastSave: null,
};

const Ctx = createContext<{ state: UiState; setPaused: (p: boolean) => void }>({
  state: initial, setPaused: () => {},
});

/** Geração do aviso: cada `toast` novo invalida o temporizador do anterior (`DEC-043`). */
let toastGeracao = 0;

export function UiProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, setState] = useState<UiState>(initial);
  /** `MEC-004`: o temporizador do aviso da morte, para a morte seguinte o poder substituir. */
  const timerMorte = useRef<number | null>(null);

  useEffect(() => {
    const unsubs = [
      // `UI-02`: o menu abre **depois** do carregamento, com o save já lido
      EventBus.on('game:menu', (p) => setState((s) => (p?.open
        ? { ...s, menu: { open: true, title: true } }
        : { ...s, menu: null }))),
      EventBus.on('game:resources', (p) => setState((s) => ({ ...s, hp: p.hp, shield: p.shield, power: p.power }))),
      EventBus.on('game:inventory', (p) => setState((s) => ({
        ...s, items: p.slotsUsed, bolsa: { itens: p.itens, presos: p.presos },
      }))),
      EventBus.on('game:inventario', (p) => setState((s) => ({ ...s, inventario: p.open }))),
      EventBus.on('game:moedas', (p) => setState((s) => ({ ...s, moedas: p.moedas }))),
      EventBus.on('game:bolsa', (p) => setState((s) => ({ ...s, bolsaMorte: p }))),
      EventBus.on('game:morte', (p) => {
        setState((s) => ({
          ...s,
          morte: {
            linhas: p.linhas, moedasPerdidas: p.moedasPerdidas, presoMantido: p.presoMantido,
            bolsa: p.bolsa, bolsaDestruida: p.bolsaDestruida,
          },
        }));
        /*
         * Cada morte **substitui** o temporizador da anterior: duas mortes seguidas deixavam o
         * primeiro `setTimeout` a apagar um aviso que ainda não tinha sido lido.
         */
        if (timerMorte.current !== null) window.clearTimeout(timerMorte.current);
        timerMorte.current = window.setTimeout(() => {
          timerMorte.current = null;
          setState((s) => ({ ...s, morte: null }));
        }, 5000);
      }),
      EventBus.on('game:bau', (p) => setState((s) => ({
        ...s,
        bau: { disponivel: p.disponivel, itens: p.itens, capacidade: p.capacidade, moedas: p.moedas },
      }))),
      EventBus.on('game:habilidades', (p) => setState((s) => ({ ...s, habilidades: p }))),
      EventBus.on('game:mapa', (p) => setState((s) => ({ ...s, mapa: p }))),
      EventBus.on('game:mapa-painel', (p) => setState((s) => ({ ...s, mapaPainel: p.open }))),
      EventBus.on('game:habilidades-painel', (p) => setState((s) => ({
        ...s, habilidadesPainel: p.open,
      }))),
      EventBus.on('game:room', (p) => setState((s) => ({ ...s, room: p }))),
      EventBus.on('ui:pause', (p) => setState((s) => ({ ...s, paused: p.paused }))),
      EventBus.on('game:text', (p) => setState((s) => ({ ...s, text: p?.lines ?? null }))),
      /*
       * O aviso tem prazo, e o prazo é **do aviso** — não do primeiro que apareceu.
       *
       * Cada `game:toast` agendava um `setTimeout` que apagava `toast` sem perguntar qual estava
       * lá: dois avisos em menos de 1,6 s e o temporizador do primeiro apagava o segundo antes de
       * ele ser lido. Não se via num jogo calmo; via-se com um chefe a cair (três avisos no mesmo
       * segundo: o item, a habilidade e o drop raro) — e via-se como "o jogo não avisou nada".
       * O número de geração resolve-o: só o temporizador do aviso **atual** o pode apagar.
       */
      EventBus.on('game:toast', (p) => {
        const geracao = ++toastGeracao;
        setState((s) => ({ ...s, toast: p.text }));
        window.setTimeout(() => {
          if (toastGeracao === geracao) setState((s) => ({ ...s, toast: null }));
        }, 1600);
      }),
      EventBus.on('game:subtitle', (p) => {
        setState((s) => ({ ...s, subtitle: p }));
        if (p) window.setTimeout(() => setState((s) => (s.subtitle === p ? { ...s, subtitle: null } : s)), 3000);
      }),
      EventBus.on('game:boss', (p) => setState((s) => ({ ...s, boss: p }))),
      EventBus.on('game:boss-keys', (k) => setState((s) => ({ ...s, keys: k }))),
      // `UI-20`: a barra do ocupante **não** é `game:boss` — vida e postura são coisas
      // diferentes, e o HUD tem de dizer isso sem uma legenda (`TST-018`)
      EventBus.on('game:posto', (p) => setState((s) => ({ ...s, posto: p }))),
      EventBus.on('game:end', (p) => setState((s) => ({
        ...s, end: { badge: p.badge, lastLine: p.lastLine },
      }))),
      EventBus.on('game:seals', (v) => setState((s) => ({ ...s, seals: v.seals > 0 || v.suspended ? v : null }))),
      EventBus.on('game:breath', (b) => setState((s) => ({ ...s, breath: b }))),
      EventBus.on('game:metrics', (m) => {
        // guarda a última sessão para o playtester recuperar mesmo se fechar a aba
        try { localStorage.setItem('homem-macho/playtest/v1', JSON.stringify(m)); } catch { /* sem storage */ }
        setState((s) => ({ ...s, metrics: m }));
      }),
      EventBus.on('game:difficulty-offer', (p) => setState((s) => ({ ...s, offer: p }))),
      EventBus.on('game:password', (p) => setState((s) => ({ ...s, password: p.open, passwordHint: null }))),
      EventBus.on('game:password-hint', (p) => setState((s) => ({ ...s, passwordHint: p }))),
      EventBus.on('game:completed', (p) => setState((s) => ({
        ...s, completed: true, completedScope: p.scope,
      }))),
      EventBus.on('save:result', (p) => setState((s) => ({ ...s, lastSave: p }))),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const setPaused = useCallback((paused: boolean) => {
    setState((s) => ({ ...s, paused }));
    emitPause(paused);
  }, []);

  /*
   * `UI-07`: com a mochila aberta a `GameScene` está pausada, logo o teclado dela está desligado —
   * quem lê o `I`/`ESC` de fechar é a UI. `←`/`→`/`↑`/`↓` andam pelas células e `ENTER` (ou `P`)
   * prende/solta: o painel tem de ser jogável sem rato (`§4.6`).
   */
  useEffect(() => {
    if (!state.inventario) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === 'Escape' || k === 'i' || k === 'I') { e.preventDefault(); closeInventory(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.inventario]);

  // Com a GameScene pausada o teclado dela está desligado: o ESC de retorno é da UI.
  useEffect(() => {
    if (!state.paused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); setPaused(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.paused, setPaused]);

  const value = useMemo(() => ({ state, setPaused }), [state, setPaused]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUi(): { state: UiState; setPaused: (p: boolean) => void } {
  return useContext(Ctx);
}

/** Envia a sequência escolhida para o jogo (`MEC-006`). */
export function submitPassword(symbols: PasswordSymbol[]): void {
  EventBus.emit('ui:password', { symbols });
}

/** `MEC-008`: aceitar o degrau mais fácil; recusar apenas fecha a oferta. */
export function answerOffer(accept: boolean, to?: 'easy' | 'medium' | 'hard'): void {
  if (accept && to) EventBus.emit('ui:difficulty', { difficulty: to });
  EventBus.emit('game:difficulty-offer', null);
}

/** `UI-07`: abre a mochila. O ícone do HUD e a tecla `I` fazem a mesma coisa. */
export function openInventory(): void {
  EventBus.emit('ui:inventario', { open: true });
}

/** `UI-07`: fecha a mochila e devolve o controle ao jogo. */
export function closeInventory(): void {
  EventBus.emit('ui:inventario', { open: false });
}

/** `UI-07`: prende o item (deixa de cair na morte, `MEC-004`). */
export function pinItem(itemId: ItemId): void {
  EventBus.emit('ui:inventory-command', { action: 'pin', itemId });
}

/**
 * `UI-07`/`DEC-040` — os gestos do baú. Todos são **intenções**: quem corta no que existe e no que
 * cabe é a cena, com as regras puras de `core/storage.ts`. `quantidade` ausente = **tudo**.
 */
export function guardarNoBau(itemId: ItemId, quantidade?: number): void {
  EventBus.emit('ui:bau-command', { action: 'guardar', itemId, quantidade });
}

/** `UI-07`: tira o item do baú para a mochila (uma cópia, ou `quantidade`). */
export function tirarDoBau(itemId: ItemId, quantidade?: number): void {
  EventBus.emit('ui:bau-command', { action: 'retirar', itemId, quantidade });
}

/** `DEC-040`: `GUARDAR TUDO` — tudo o que couber no baú, itens e moedas. */
export function guardarTudoNoBau(): void {
  EventBus.emit('ui:bau-command', { action: 'guardar-tudo' });
}

/** `DEC-040`: `RETIRAR TUDO` — o baú devolve o que a mochila aceitar, itens e moedas. */
export function tirarTudoDoBau(): void {
  EventBus.emit('ui:bau-command', { action: 'retirar-tudo' });
}

/** `DEC-040`: carteira → baú. `quantidade` ausente = todas as moedas. */
export function moedasParaBau(quantidade?: number): void {
  EventBus.emit('ui:bau-command', { action: 'moedas-para-bau', quantidade });
}

/** `DEC-040`: baú → carteira. `quantidade` ausente = todas as moedas do baú. */
export function moedasDoBau(quantidade?: number): void {
  EventBus.emit('ui:bau-command', { action: 'moedas-do-bau', quantidade });
}

/** `UI-07`: volta a soltar o item. */
export function unpinItem(itemId: ItemId): void {
  EventBus.emit('ui:inventory-command', { action: 'unpin', itemId });
}

/**
 * `UI-22`: abre o mapa (o ícone do HUD e a tecla `M` fazem o mesmo). Fechar é o mesmo caminho ao
 * contrário — a cena devolve a pausa e a UI só obedece ao `game:mapa-painel`.
 */
export function openMapa(): void {
  EventBus.emit('ui:mapa', { open: true });
}
export function closeMapa(): void {
  EventBus.emit('ui:mapa', { open: false });
}

/** `UI-14`: abre o painel das habilidades (o ícone do HUD e a tecla `H` fazem o mesmo). */
export function openHabilidades(): void {
  EventBus.emit('ui:habilidades', { open: true });
}

/** `UI-14`: fecha o painel. */
export function closeHabilidades(): void {
  EventBus.emit('ui:habilidades', { open: false });
}

/** `UI-14`: compra o próximo nível — a cena cobra e aplica (`core/melhorias` decide). */
export function melhorarHabilidade(habilidade: Habilidade): void {
  EventBus.emit('ui:habilidade-command', { habilidade });
}

/** Fecha o painel sem tentar abrir (ESC / botão). */
export function closePassword(): void {
  EventBus.emit('game:password', { open: false });
}
