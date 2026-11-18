/**
 * PAT-C-01 — EventBus tipado (React ↔ Phaser). Payload sempre serializável;
 * nunca trafega `GameObject`, `Scene` ou `HTMLElement`. Teto de 10 Hz no HUD.
 */
import type { PasswordSymbol } from '../core/password';
import type { Summary } from '../core/metrics';
import type { AcaoJogo } from '../services/settings';
import type { ItemId } from '../core/items';
import type { Habilidade } from '../core/permanentes';

export interface GameEvents {
  /** EVT-001 — Phaser → React: a sala terminou de montar. */
  'scene:ready': { key: string };
  /**
   * `UI-02` (`04-interface` §4.1) — **a porta de entrada**. Phaser → React: o carregamento
   * acabou e o menu pode aparecer. `reason: 'boot'` é a primeira vez; `'pause'` é o jogador
   * saindo para o menu pelo pause (`UI-06`).
   */
  'game:menu': { open: boolean; reason: 'boot' | 'pause' } | null;
  /**
   * `UI-02` → Phaser: entrar no jogo. `newGame` zera o progresso; `continue` retoma o save
   * (`MEC-007`, 1 slot). A dificuldade só se escolhe em jogo novo (`UI-04`).
   */
  'ui:start': {
    mode: 'new' | 'continue';
    difficulty?: 'easy' | 'medium' | 'hard';
  };
  /** EVT-002 — Phaser → React, teto de 10 Hz (`MEC` do §7.5). */
  'game:resources': { hp: number; shield: number; power: number };
  /**
   * EVT-003 — Phaser → React: o **conteúdo** da mochila, não só o contador.
   *
   * `slotsUsed`/`pinnedCount` bastavam para o HUD dizer `ITENS 1`; o painel (`UI-07`) precisa de
   * saber *quais* para desenhar a grelha e o botão de prender. `itens` e `presos` são cópias —
   * a UI nunca mexe no estado da cena, manda intenções por `ui:inventory-command`.
   */
  'game:inventory': {
    slotsUsed: number;
    pinnedCount: number;
    /** Ordem de chegada; a posição na grelha é esta. */
    itens: readonly ItemId[];
    presos: readonly ItemId[];
  };
  /** EVT-004 — Phaser → React/serviço. */
  'game:death': { areaId: string; recoverable: boolean };
  /** EVT-005 — React → Phaser. */
  'ui:pause': { paused: boolean };
  /**
   * EVT-006 — React → Phaser. `reducedMotion` muda a queda e a silhueta (`VIS-009`); os volumes
   * viajam no mesmo evento para o dia em que houver áudio (`06-audio`), e `legendas` decide se
   * o jogo emite `game:subtitle`.
   */
  'ui:settings': {
    music: number; sfx: number; reducedMotion: boolean;
    legendas?: boolean; somGeral?: number;
  };
  /**
   * `DEC-027` — React → Phaser: **entrada virtual** dos controlos de toque (`tipoControle`).
   * O jogo trata-a como se fosse a tecla da ação; nada no motor sabe que veio de um botão HTML.
   */
  'ui:input': { acao: AcaoJogo; pressed: boolean };
  /** `DEC-027` — React → Phaser: grava agora, antes de a cena ser destruída (sair para o menu). */
  'ui:persist': Record<string, never>;
  /**
   * `§4.6` — Phaser → React: **legenda** do que só se ouviria (dano, telegraph do chefe, item,
   * checkpoint). Só o que é relevante para jogar; nada de narrar cada passo.
   */
  'game:subtitle': { text: string; kind: 'info' | 'perigo' | 'marco' } | null;
  /** EVT-007 — serviço → React/Phaser. */
  'save:result': { ok: boolean; revision?: number; errorCode?: string };
  /** EVT-008 — Phaser → React/serviço. */
  /**
   * `DEC-047` — o jogo tem **um** fim: a campanha. Havia `'mvp'`, o corte em LVL-03, e ele deixou
   * de existir quando os dezasseis setores entraram na progressão. Um valor de tipo que já ninguém
   * emite é uma armadilha para o próximo `switch`.
   */
  'game:completed': { scope: 'campaign' };
  /**
   * EVT-009 — React → Phaser: a **intenção** da mochila. `recover` é da bolsa da morte e fica
   * para a etapa seguinte; `pin`/`unpin` já mexem no estado da cena (`MEC-004`).
   */
  'ui:inventory-command': { action: 'pin' | 'unpin' | 'recover'; itemId?: ItemId };
  /**
   * `UI-07` — os dois sentidos da mochila aberta. Phaser emite `open: true` ao apanhar a tecla
   * `I` (e pausa-se, como na porta de senha); a UI emite `open: false` ao fechar, e a cena
   * retoma. É o mesmo par de eventos do painel de senha (`MEC-006`), para não haver dois
   * mecanismos de pausa diferentes no jogo.
   */
  'game:inventario': { open: boolean };
  /** `UI-07` — React → Phaser: o jogador quer abrir (ícone do HUD). Fecha por `game:inventario`. */
  'ui:inventario': { open: boolean };
  /**
   * `UI-07` — o **baú** das salas seguras. `disponivel` diz se o herói está ao alcance de um;
   * `itens` é o conteúdo do baú (o mesmo em todas as salas seguras, porque é uma lista só) e
   * `capacidade` é o número de espaços, para o painel escrever `n / 40`.
   */
  'game:bau': {
    disponivel: boolean;
    itens: readonly ItemId[];
    capacidade: number;
    /**
     * `DEC-040`: as **moedas guardadas no baú**. O baú é o único sítio do jogo onde elas estão a
     * salvo da morte — e é por isso que o painel as mostra do lado do baú, não do herói.
     */
    moedas: number;
  };
  /**
   * `UI-07`/`DEC-040` — React → Phaser: mexer no baú.
   *
   * `guardar`/`retirar` movem **uma** cópia (o clique na célula); `guardar-tudo`/`retirar-tudo`
   * movem o que couber (itens **e** moedas); `moedas-para-bau`/`moedas-do-bau` movem moedas, e
   * `quantidade` diz quantas (`undefined` = todas — o `TUDO` do botão).
   */
  /**
   * `UI-14` (`DEC-041`) — **as habilidades e os seus níveis**, para o painel. `linhas` já vem com o
   * que a UI mostra (nome, nível, máximo, custo e o texto do próximo nível): o painel não importa o
   * `tuning` para saber quanto custa, e o preço muda num sítio só.
   */
  'game:habilidades': {
    moedas: number;
    linhas: readonly {
      id: Habilidade;
      nome: string;
      nivel: number;
      max: number;
      conquistada: boolean;
      custo: number | null;
      texto: string;
    }[];
  };
  /** `UI-14` — React → Phaser: abrir/fechar o painel (pausa a cena, como a mochila). */
  'ui:habilidades': { open: boolean };
  /**
   * `UI-22` (`DEC-043`) — **o mapa**. A cena manda a planta já montada (salas, posições, estado de
   * cada uma, setores) para a UI não recalcular topologia nenhuma: a UI desenha o que recebe, e o
   * mapa que se vê é exactamente o que o motor pensa.
   */
  'game:mapa': {
    setor: string;
    setorNome: string;
    atual: string;
    salas: readonly {
      id: string; nome: string; x: number; y: number;
      estado: 'atual' | 'visitada' | 'conhecida' | 'desconhecida';
      portal?: string;
    }[];
    ligacoes: readonly {
      de: string; para: string;
      direcao: 'leste' | 'oeste' | 'teto' | 'piso' | 'portal';
      portal: boolean; atalho?: boolean;
    }[];
    setores: readonly {
      id: string; nome: string; ordem: number; naProgressao: boolean;
      visitadas: number; total: number; atual: boolean;
    }[];
    visitadas: number;
    total: number;
  };
  'ui:mapa': { open: boolean };
  'game:mapa-painel': { open: boolean };
  /** `UI-14` — Phaser → React: o painel abriu/fechou (estado autoritativo). */
  'game:habilidades-painel': { open: boolean };
  /** `UI-14` — React → Phaser: comprar o próximo nível de uma habilidade. */
  'ui:habilidade-command': { habilidade: Habilidade };
  'ui:bau-command': {
    action:
      | 'guardar' | 'retirar'
      | 'guardar-tudo' | 'retirar-tudo'
      | 'moedas-para-bau' | 'moedas-do-bau';
    itemId?: ItemId;
    quantidade?: number;
  };
  /**
   * `MEC-004` (`DEC-037`) — **moedas**. Só mobs e chefes as dão, e a morte apaga-as a 100 %; o
   * contador vive na cena (não no save) e a UI só o desenha.
   */
  'game:moedas': { moedas: number };
  /**
   * `MEC-004` (`DEC-037`) — **o que se perdeu na morte**. `linhas` já vem escrita para o painel
   * (nomes e moedas), `perdidos` é a lista para quem quiser contar por item, e `presoMantido` diz
   * quantos presos sobreviveram — a única boa notícia do aviso.
   */
  'game:morte': {
    perdidos: readonly ItemId[];
    moedasPerdidas: number;
    linhas: readonly string[];
    presoMantido: number;
    /** `DEC-038`: onde ficou a bolsa (`BOLSA · L01-04 · 2 ITENS`), ou `null` se nada se perdeu. */
    bolsa: string | null;
    /** `true` quando esta morte **destruiu** a bolsa anterior (itens e moedas perdidos). */
    bolsaDestruida: boolean;
  };
  /**
   * `MEC-004` (`DEC-038`) — a **bolsa da morte**: existe? está nesta sala? com quê? O HUD desenha
   * o marcador, e é a única forma de o jogador saber onde deixou as coisas.
   */
  'game:bolsa': {
    existe: boolean;
    naSala: boolean;
    rotulo: string | null;
    itens: number;
    moedas: number;
  };
  /** Extensão local (DEC-019): rótulo e contador da sala para o HUD. */
  'game:room': { id: string; name: string; index: number; total: number; area: string };
  /** Extensão local (DEC-019): aviso curto, sem estado. */
  'game:toast': { text: string };
  /** Extensão local (DEC-019): quadro de aviso / placa (`LOR-04`). */
  'game:text': { lines: string[]; hold: boolean } | null;
  /** Extensão local (DEC-019): painel da porta de senha (`MEC-006`). */
  'game:password': { open: boolean };
  /** Extensão local (DEC-019): resposta do painel ao erro/acerto parcial. */
  'game:password-hint': { kind: 'incomplete' | 'wrong'; index?: number };
  /** Extensão local (DEC-019): sequência de glifos escolhida na UI. */
  'ui:password': { symbols: PasswordSymbol[] };
  /** Extensão local (DEC-019): barra de vida do chefe (`VIS-007`, `ENT-003`). */
  'game:boss': { name: string; hp: number; max: number; phase: 1 | 2; defeated: boolean } | null;
  /**
   * `DEC-016` (`LVL-14` §8.2): as chaves são **contador, não item**, e a UI mostra `x / 2`
   * sem um terceiro slot. O `3 / 2` de quem lutou em LVL-12 é a sobra da placa — visível e
   * inútil de propósito (§8.3).
   */
  'game:boss-keys': { keys: number; required: number };
  /**
   * `LVL-15` §5.3 — os selos do Guardião Duplo. **Dois** suspendem; o HUD conta `1 / 2` e
   * `2 / 2` porque a mecânica precisa ser legível antes de tirar o controle do jogador.
   */
  'game:seals': { seals: number; label: string; suspended?: boolean };
  /**
   * `LVL-16` §5.5 (`UI-20`) — **o sexto chefe não tem barra de vida.** O HUD mostra
   * `BAIXAS n/3` e uma barra de **postura**, com `aria-label` "postura do ocupante". Não é
   * vida reciclada: é o tempo que ele aguenta de pé (`TST-018`).
   */
  'game:posto': {
    baixas: number; baixasMax: number; poise: number; poiseMax: number;
    staggered: boolean; rendido: boolean;
  } | null;
  /**
   * `MEC-012` (§7.2/§7.4) — **o fim**. O jogo termina numa tecla, o zumbido de `AMB-16` para
   * e a tela final é um **crachá** de 3 linhas: `POSTO: PREENCHIDO` / `Nº: 041` /
   * `ASSINATURA: VOCÊ`. Sem `newGamePlus` (`P-73`).
   */
  'game:end': { completed: true; badge: string[]; lastLine: string };
  /** `MEC-008`: oferta recusável de dificuldade depois de 3 mortes na arena. */
  'game:difficulty-offer': { from: 'easy' | 'medium' | 'hard'; to: 'easy' | 'medium' | 'hard' } | null;
  /** Resposta da UI à oferta de `MEC-008`. */
  'ui:difficulty': { difficulty: 'easy' | 'medium' | 'hard' };
  /** Extensão local (DEC-019): relatório de sessão para playtest (`P-29`). */
  'game:metrics': Summary;
  /** `HAB-06` / `LVL-06` §5: fôlego restante e se está submerso. */
  'game:breath': { ms: number; max: number; submerged: boolean };
}

type Handler<K extends keyof GameEvents> = (p: GameEvents[K]) => void;

class TypedBus {
  private map = new Map<string, Set<Handler<never>>>();

  on<K extends keyof GameEvents>(event: K, fn: Handler<K>): () => void {
    const key = event as string;
    if (!this.map.has(key)) this.map.set(key, new Set());
    this.map.get(key)!.add(fn as Handler<never>);
    return () => { this.map.get(key)?.delete(fn as Handler<never>); };
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    this.map.get(event as string)?.forEach((fn) => (fn as Handler<K>)(payload));
  }

  clear(): void { this.map.clear(); }
}

export const EventBus = new TypedBus();
