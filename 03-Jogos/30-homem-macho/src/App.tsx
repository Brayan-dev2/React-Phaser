/**
 * `App` — a **porta de entrada** do jogo (`docs/04-interface-e-experiencia.md` §4.1).
 *
 * Quatro coisas que este ficheiro decide:
 *
 * 1. **O menu vem antes do jogo.** Os menus do `§4.4` são React; o canvas do Phaser só sobe
 *    quando o jogador escolhe entrar. Enquanto o menu está aberto não há `Phaser.Game` nenhum.
 * 2. **Os saves são três** (`DEC-027`): `CONTINUAR` mostra a lista e o jogador escolhe qual
 *    retomar; `JOGAR` ocupa o primeiro slot vazio (ou o mais antigo, e diz qual antes de
 *    confirmar). Retomar grava **no mesmo slot**.
 * 3. **A configuração é do jogador, não da sessão**: vive em `services/settings.ts`, é lida no
 *    boot, aplicada ao jogo por `ui:settings` e gravada a cada mudança.
 * 4. **Todo o caminho que não é "entrar" volta para o menu** — pausa (`UI-06`) e fim do recorte
 *    (`UI-10`). Antes de desmontar o canvas, o jogo grava (`ui:persist`): sair para o menu não
 *    pode custar a sala em que o jogador estava.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PhaserGame } from './game/PhaserGame';
import { Hud } from './ui/components/Hud';
import { Overlays } from './ui/components/Overlays';
import { MainMenu } from './ui/components/MainMenu';
import { Subtitles } from './ui/components/Subtitles';
import { TouchControls } from './ui/components/TouchControls';
import { UiProvider, useUi } from './store/uiStore';
import { useMenuSaves } from './ui/useMenuSaves';
import { EventBus } from './game/EventBus';
import { setPendingStart, type PendingStart } from './services/start';
import { listarSaves, slotParaNovaPartida } from './services/save';
import { loadConfig, saveConfig, type Config } from './services/settings';
import { normalizarPersonagem, type Personagem } from './services/character';
import { Historia } from './ui/components/Historia';
import { HISTORIA_INICIAL, type HistoriaState } from './services/historia';
import { DEFAULT_DIFFICULTY, MENU } from './game/data/tuning';
import type { Difficulty } from './core/types';

function Footer(): JSX.Element {
  const { state } = useUi();
  const { config } = useConfigBox();
  const dica = state.password
    ? 'Escolha os glifos na ordem das inscrições · MEC-006'
    : 'A/D mover · SHIFT correr · ESPAÇO pular · J atacar · K disparar · Q gancho · E interagir · I mochila';
  return (
    <footer className="foot">
      <span><b>{state.room.id.slice(0, 3)}</b> · {state.room.area} · <em>slice</em> 0.2</span>
      <span>{dica}</span>
      <span>CONTROLE: {config.tipoControle.toUpperCase()}</span>
    </footer>
  );
}

/** `?skip=menu` — o E2E entra direto. A mesma chave que o `PreloadScene` lê. */
function modoDireto(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('skip') === 'menu';
}

/**
 * A configuração vive no `Shell`, mas o rodapé e o HUD também precisam dela. Um contexto mínimo
 * evita passar `config` por cinco componentes que só querem saber o tipo de controle.
 */
import { createContext, useContext } from 'react';
const ConfigCtx = createContext<{ config: Config }>({ config: loadConfig() });
function useConfigBox(): { config: Config } { return useContext(ConfigCtx); }

function Shell(): JSX.Element {
  const { state } = useUi();
  /** Incrementa quando o menu reabre: a lista de saves é relida (`MEC-007`). */
  const [tickMenu, setTickMenu] = useState(0);
  const saves = useMenuSaves(tickMenu, MENU.rotuloDificuldade);
  const [config, setConfig] = useState<Config>(() => loadConfig());
  /** `UI-12`: o personagem da partida em curso (ou o último criado) — base do próximo `JOGAR`. */
  const [ultimoPersonagem, setUltimoPersonagem] = useState<unknown>(null);
  /** O título só aparece no boot: quem volta do jogo já sabe onde está. */
  const [primeiraVez, setPrimeiraVez] = useState(true);
  const direto = useMemo(modoDireto, []);

  /**
   * `UI-13`: a introdução fica **entre** a criação do personagem e a primeira sala. Enquanto ela
   * está no ecrã não há `Phaser.Game` nenhum — a partida só começa quando o jogador chega ao fim
   * (ou salta). A intenção fica guardada aqui, intacta, até esse momento.
   */
  const [historia, setHistoria] = useState<{ estado: HistoriaState; intencao: PendingStart } | null>(null);

  const [montado, setMontado] = useState(true);
  const [menu, setMenu] = useState(!direto);
  const [erro, setErro] = useState<string | null>(null);

  // `?skip=menu`: sem menu, o `PreloadScene` segue sozinho para a sala
  useEffect(() => { if (direto) setMenu(false); }, [direto]);

  const estadoMenu = state.menu;
  useEffect(() => {
    if (!estadoMenu?.open) return;
    setMenu(true);
    setMontado(false);
  }, [estadoMenu?.open]);

  /**
   * Aplicar a configuração é **um** efeito, não cinco: o jogo recebe um evento `ui:settings`
   * com tudo o que ele usa, e a UI (legendas, toque) lê o estado do React.
   */
  useEffect(() => {
    saveConfig(config);
    EventBus.emit('ui:settings', {
      music: config.musica,
      sfx: config.efeitos,
      reducedMotion: config.movimentoReduzido,
      legendas: config.legendas,
      somGeral: config.somGeral,
    });
  }, [config]);

  const entrar = useCallback((intencao: PendingStart) => {
    setErro(null);
    setUltimoPersonagem(intencao.personagem ?? null);
    EventBus.emit('game:menu', null);
    setPendingStart(intencao);
    setMenu(false);
    setMontado(true);          // monta **depois** da intenção: o `PreloadScene` lê e entra
  }, []);

  /**
   * `JOGAR` já não monta o jogo: prepara a partida e mostra a **história** (`UI-13`). `CONTINUAR`
   * não passa por aqui — quem retoma já sabe de que jogo se trata e quer a sala onde parou.
   */
  const jogar = useCallback((dificuldade: Difficulty, personagem: Personagem) => {
    const slot = slotParaNovaPartida(listarSaves());
    const intencao: PendingStart = { mode: 'new', difficulty: dificuldade, slot, personagem };
    // o herói criado passa a ser a base do próximo `JOGAR`, mesmo que o jogador saia na introdução
    setUltimoPersonagem(personagem);
    setHistoria({ estado: HISTORIA_INICIAL, intencao });
  }, []);

  /**
   * Fim (ou salto) da introdução: só agora a partida começa.
   *
   * A ordem importa: **fecha-se a introdução e só depois** se entra. A primeira versão chamava
   * `entrar()` de dentro do `setHistoria(...)`, ou seja a atualizar um componente enquanto outro
   * desenhava — o React avisou e o canvas chegava a montar com a introdução ainda no ecrã.
   */
  const sairDaHistoria = useCallback((estado: HistoriaState) => {
    if (!historia) return;
    if (!estado.fim) { setHistoria({ ...historia, estado }); return; }
    const intencao = historia.intencao;
    setHistoria(null);
    entrar(intencao);
  }, [historia, entrar]);

  const continuar = useCallback((slot: number) => {
    const env = saves.envelope(slot);
    const p = env?.progress;
    if (!p) {
      setErro(`O SLOT ${slot} ESTÁ VAZIO.`);
      return;
    }
    entrar({
      mode: 'continue',
      // a dificuldade do save (`UI-04`); save antigo, sem o campo, cai no padrão do jogo
      difficulty: p.difficulty ?? DEFAULT_DIFFICULTY,
      slot,
      // `UI-12`: retomar devolve o herói que o jogador criou; save antigo cai no padrão
      personagem: normalizarPersonagem(p.personagem),
      // `UI-07`: o baú vive no save e volta com o CONTINUAR
      resume: {
        areaId: p.areaId, roomIndex: p.roomIndex, hp: p.hp, shield: p.shield,
        bau: p.bau, bauMoedas: p.bauMoedas, bolsaMorte: p.bolsaMorte,
        melhorias: p.melhorias, coletados: p.coletados, tentativasDrop: p.tentativasDrop,
        visitadas: p.visitadas, senhaAberta: p.senhaAberta,
      },
    });
  }, [entrar, saves]);

  /** Antes de desmontar o canvas: grava. `ui:persist` é lido pela `GameScene`. */
  const voltarAoMenu = useCallback(() => {
    EventBus.emit('ui:persist', {});
    setPrimeiraVez(false);
    setTickMenu((n) => n + 1);
    setMenu(true);
    setMontado(false);
  }, []);

  // quando o jogo grava, a lista do menu fica velha: `save:result` é o aviso (`EVT-007`)
  useEffect(() => {
    const off = EventBus.on('save:result', () => saves.recarregar());
    return () => { off(); };
  }, [saves]);

  if (historia) {
    return (
      <ConfigCtx.Provider value={{ config }}>
        <main className="shell shell--menu">
          <Historia estado={historia.estado} onMudar={sairDaHistoria} />
        </main>
      </ConfigCtx.Provider>
    );
  }

  if (menu) {
    return (
      <ConfigCtx.Provider value={{ config }}>
        <main className="shell shell--menu">
          {!saves.pronto ? (
            <div className="menu menu--carregando" role="status" aria-live="polite">
              <span className="menu__cena-etiqueta">CARREGANDO…</span>
            </div>
          ) : (
            <MainMenu
              mostrarTitulo={primeiraVez}
              vistas={saves.vistas}
              slots={saves.slots}
              slotNovaPartida={saves.slotNovaPartida}
              config={config}
              dificuldades={MENU.difficulties}
              // o último personagem criado é a base do próximo: quem só quer jogar não recria tudo
              personagemInicial={normalizarPersonagem(ultimoPersonagem)}
              erro={erro}
              onNovo={jogar}
              onContinuar={continuar}
              onConfig={setConfig}
            />
          )}
        </main>
      </ConfigCtx.Provider>
    );
  }

  return (
    <ConfigCtx.Provider value={{ config }}>
      <main className="shell">
        <div className="stage">
          {/* o canvas só existe em jogo (`§4.4`) */}
          {montado && <PhaserGame />}
          <Hud />
          <Subtitles />
          {config.tipoControle === 'toque' && <TouchControls />}
          <Overlays onVoltarAoMenu={voltarAoMenu} />
        </div>
        <Footer />
      </main>
    </ConfigCtx.Provider>
  );
}

export default function App(): JSX.Element {
  return (
    <UiProvider>
      <Shell />
    </UiProvider>
  );
}
