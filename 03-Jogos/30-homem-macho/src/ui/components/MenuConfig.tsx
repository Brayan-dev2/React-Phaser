/**
 * `UI-02` · **Configurações** — controles, atalhos, som, legendas e idioma (`docs/04` §4.4, §4.6).
 *
 * É um painel de **linhas**, não de abas: o jogador vê tudo o que pode mudar de uma vez e anda
 * com `↑↓`; `←→` muda o valor da linha em foco. Sem submenu escondido, sem botão "aplicar" — o
 * que se vê já está valendo (a configuração é gravada a cada mudança).
 *
 * **Nada de números soltos**: a lista de linhas é `LINHAS_CONFIG` (`menuMachine.ts`), a mesma que
 * a máquina percorre, e os rótulos vêm de `services/settings.ts`.
 */
import {
  ACOES, IDIOMAS, ROTULO_ACAO, TIPOS_CONTROLE, rotuloAtalho,
  type AcaoJogo, type Config,
} from '../../services/settings';
import { LINHAS_CONFIG, type LinhaConfig, type MenuState } from '../menuMachine';

interface Props {
  estado: MenuState;
  config: Config;
  onLinha: (indice: number) => void;
  /** Clique numa linha de ajuste: o menu confirma-a (o volume sobe um passo, o resto alterna). */
  onLinhaConfirmada: (indice: number) => void;
  onAcao: (acao: AcaoJogo) => void;
  onVoltar: () => void;
}

const TITULO: Record<LinhaConfig, string> = {
  tipoControle: 'TIPO DE CONTROLE',
  atalhos: 'ATALHOS',
  somGeral: 'SOM GERAL',
  musica: 'MÚSICA',
  efeitos: 'EFEITOS',
  legendas: 'LEGENDAS',
  movimentoReduzido: 'MOVIMENTO REDUZIDO',
  idioma: 'IDIOMA',
  restaurar: 'RESTAURAR PADRÕES',
};

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

/** A trilha de volume: cinco quadrados que se enchem — o valor em texto vem ao lado. */
function Trilha({ valor }: { valor: number }): JSX.Element {
  const cheios = Math.round(valor * 10);
  return (
    <span className="menu__trilha" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={i < cheios ? 'menu__trilha-pc menu__trilha-pc--on' : 'menu__trilha-pc'} />
      ))}
    </span>
  );
}

function valorDa(linha: LinhaConfig, config: Config): { texto: string; trilha?: number } {
  switch (linha) {
    case 'tipoControle': {
      const t = TIPOS_CONTROLE.find((x) => x.id === config.tipoControle);
      return { texto: t?.rotulo ?? config.tipoControle };
    }
    case 'atalhos': return { texto: 'VER E MUDAR' };
    case 'somGeral': return { texto: pct(config.somGeral), trilha: config.somGeral };
    case 'musica': return { texto: pct(config.musica), trilha: config.musica };
    case 'efeitos': return { texto: pct(config.efeitos), trilha: config.efeitos };
    case 'legendas': return { texto: config.legendas ? 'LIGADAS' : 'DESLIGADAS' };
    case 'movimentoReduzido': return { texto: config.movimentoReduzido ? 'LIGADO' : 'DESLIGADO' };
    case 'idioma': {
      const i = IDIOMAS.find((x) => x.id === config.idioma);
      return { texto: i?.rotulo ?? config.idioma };
    }
    case 'restaurar': return { texto: 'ENTER' };
    default: return { texto: '' };
  }
}

function explicacao(linha: LinhaConfig, config: Config): string {
  switch (linha) {
    case 'tipoControle':
      return TIPOS_CONTROLE.find((x) => x.id === config.tipoControle)?.linha ?? '';
    case 'atalhos':
      return 'Cada tecla pertence a uma ação só. Enter muda a tecla da ação escolhida.';
    case 'somGeral':
      return 'Vale para tudo. Música e efeitos ficam por cima deste valor.';
    case 'musica':
      return 'Ainda não há trilha gravada — a escolha fica guardada para a fase de som.';
    case 'efeitos':
      return 'Passos, golpes e avisos. A escolha fica guardada para a fase de som.';
    case 'legendas':
      return 'Põe em texto o que só se ouviria: dano, chefe e marcos.';
    case 'movimentoReduzido':
      return 'Tira tremor de câmara, flashes e a pulsação do título (§4.6).';
    case 'idioma':
      return 'PT-BR desde o MVP; os textos em EN-US entram quando houver tradução.';
    case 'restaurar':
      return 'Volta tudo ao padrão, incluindo as teclas. Não mexe nos saves.';
    default:
      return '';
  }
}

export function MenuConfig({
  estado, config, onLinha, onLinhaConfirmada, onAcao, onVoltar,
}: Props): JSX.Element {
  const emAtalhos = estado.painel === 'atalhos';

  if (emAtalhos) {
    return (
      <div className="menu__painel" role="dialog" aria-modal="true" aria-label="Atalhos">
        <p className="menu__painel-titulo">ATALHOS</p>
        <p className="menu__acao-detalhe">
          {estado.capturando
            ? `PRESSIONE A NOVA TECLA PARA ${ROTULO_ACAO[estado.capturando]} · ESC cancela`
            : 'Escolha a ação e aperte Enter. ESC volta às configurações.'}
        </p>
        <ul className="menu__lista" role="listbox" aria-label="Ações e teclas">
          {ACOES.map((acao, i) => (
            <li key={acao}>
              <button type="button" role="option"
                aria-selected={estado.indice === i}
                className={estado.indice === i ? 'menu__linha menu__linha--on' : 'menu__linha'}
                data-foco={estado.indice === i}
                onPointerMove={() => onLinha(i)}
                onClick={() => onAcao(acao)}>
                <span className="menu__linha-rotulo">{ROTULO_ACAO[acao]}</span>
                <span className="menu__linha-valor">
                  {estado.capturando === acao ? '…' : rotuloAtalho(config, acao)}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="menu__voltar" onClick={onVoltar}>VOLTAR (ESC)</button>
      </div>
    );
  }

  return (
    <div className="menu__painel" role="dialog" aria-modal="true" aria-label="Configurações">
      <p className="menu__painel-titulo">CONFIGURAÇÕES</p>
      <ul className="menu__lista" role="listbox" aria-label="Ajustes">
        {LINHAS_CONFIG.map((linha, i) => {
          const { texto, trilha } = valorDa(linha, config);
          const emFoco = estado.indice === i;
          return (
            <li key={linha}>
              <button type="button" role="option"
                aria-selected={emFoco}
                className={emFoco ? 'menu__linha menu__linha--on' : 'menu__linha'}
                data-foco={emFoco}
                onPointerMove={() => onLinha(i)}
                onClick={() => onLinhaConfirmada(i)}>
                <span className="menu__linha-rotulo">{TITULO[linha]}</span>
                <span className="menu__linha-valor">
                  {trilha !== undefined && <Trilha valor={trilha} />}
                  {texto}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="menu__dica" aria-live="polite">{explicacao(LINHAS_CONFIG[estado.indice], config)}</p>
      <button type="button" className="menu__voltar" onClick={onVoltar}>VOLTAR (ESC)</button>
    </div>
  );
}
