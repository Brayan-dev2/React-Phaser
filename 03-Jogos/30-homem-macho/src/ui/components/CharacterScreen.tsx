/**
 * `UI-12` — **criação de personagem** (`docs/04` §4.2.2), entre a dificuldade e a primeira sala.
 *
 * Sete escolhas, uma coluna, uma prévia ao lado:
 *
 * ```
 * CABELO ·················· CURTO      ┌────────────┐
 * COR DO CABELO ··········· PRETO      │            │
 * ROSTO ··················· QUADRADO   │   PRÉVIA    │
 * EXPRESSÃO ··············· SÉRIA      │  (placeholder)│
 * TATUAGEM / CICATRIZ ····· NENHUMA    │            │
 * CORPO ··················· ATLÉTICO   └────────────┘
 * TOM DE PELE ············· MÉDIA
 * ```
 *
 * `↑↓` escolhem o grupo, `←→` mudam o valor, `R` sorteia, `Enter` começa, `Esc` volta à
 * dificuldade. O estado e as regras vivem em `menuMachine.ts`; aqui só se desenha e se avisa o
 * `App` de que há uma escolha nova.
 *
 * A prévia é um **placeholder** (`CharacterPreview`): sem ela, o jogador escolheria sete campos
 * às cegas e não teria como saber que a escolha fez alguma coisa.
 */
import {
  GRUPOS, NOME_MAX, linhaDe, opcoesDe, rotuloGrupo, rotuloValor, tomCabelo, tomPele,
  type Grupo, type Personagem,
} from '../../services/character';
import { LINHAS_PERSONAGEM } from '../menuMachine';
import { CharacterPreview } from './CharacterPreview';

interface Props {
  personagem: Personagem;
  /** Grupo em foco (o destaque da lista e a etiqueta da prévia). */
  indice: number;
  onGrupo: (indice: number) => void;
  onValor: (grupo: Grupo, id: string) => void;
  /** `UI-12`: o nome é escrito, não percorrido — o campo de texto é o mesmo caminho das teclas. */
  onNome: (nome: string) => void;
  onConfirmar: () => void;
  onAleatorio: () => void;
  onVoltar: () => void;
}

/** `UI-12`: o ecrã não conhece o ea ster egg — só mostra o que o nome fez, se fez. */
function estadoAviso(_p: Personagem): null {
  return null;
}

/** Amostra de cor ao lado do valor: a mesma informação do nome, visível sem ler. */
function Amostra({ grupo, personagem }: { grupo: Grupo; personagem: Personagem }): JSX.Element | null {
  if (grupo === 'pele') {
    const t = tomPele(personagem);
    return <span className="pers__cor" style={{ background: t.base, borderColor: t.sombra }} aria-hidden="true" />;
  }
  if (grupo === 'corCabelo') {
    const t = tomCabelo(personagem);
    return <span className="pers__cor" style={{ background: t.base, borderColor: t.sombra }} aria-hidden="true" />;
  }
  return null;
}

export function CharacterScreen({
  personagem, indice, onGrupo, onValor, onNome, onConfirmar, onAleatorio, onVoltar,
}: Props): JSX.Element {
  const linha = LINHAS_PERSONAGEM[Math.min(indice, LINHAS_PERSONAGEM.length - 1)];
  const nomeEmFoco = linha === 'nome';
  const grupo: Grupo = nomeEmFoco ? 'cabelo' : linha;

  return (
    <div className="menu__painel pers" role="dialog" aria-modal="true"
      aria-label="Criação de personagem">
      <p className="menu__painel-titulo">CRIE O SEU PERSONAGEM</p>

      <div className="pers__corpo">
        {/* --- as sete escolhas --- */}
        <ul className="menu__lista pers__lista" role="listbox"
          aria-label="Características do personagem">
          {/* --- NOME: a única linha que se escreve --- */}
          <li>
            <div className={nomeEmFoco ? 'menu__linha menu__linha--on' : 'menu__linha'}
              data-foco={nomeEmFoco} data-grupo="nome"
              onPointerMove={() => onGrupo(0)}>
              <label className="menu__linha-rotulo" htmlFor="pers-nome">NOME</label>
              <input id="pers-nome" className="pers__nome" type="text" value={personagem.nome}
                maxLength={NOME_MAX} autoComplete="off" spellCheck={false}
                aria-label="Nome do personagem"
                onFocus={() => onGrupo(0)}
                onChange={(e) => onNome(e.target.value)} />
            </div>
          </li>

          {GRUPOS.map((g, i) => {
            const emFoco = i + 1 === indice;
            return (
              <li key={g}>
                <button type="button" role="option" aria-selected={emFoco}
                  className={emFoco ? 'menu__linha menu__linha--on' : 'menu__linha'}
                  data-foco={emFoco} data-grupo={g}
                  onPointerMove={() => onGrupo(i + 1)}
                  onClick={() => onGrupo(i + 1)}>
                  <span className="menu__linha-rotulo">{rotuloGrupo(g)}</span>
                  <span className="menu__linha-valor">
                    <Amostra grupo={g} personagem={personagem} />
                    {rotuloValor(g, personagem)}
                    {emFoco && <span className="pers__setas" aria-hidden="true">◀ ▶</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* --- a prévia: muda com cada escolha, e tem nome acessível --- */}
        <div className="pers__previa">
          <CharacterPreview personagem={personagem} grupo={grupo} largura={216} />
          <p className="pers__previa-rotulo" aria-hidden="true">PRÉVIA · PLACEHOLDER</p>
        </div>
      </div>

      <p className="menu__dica" aria-live="polite">
        {nomeEmFoco
          ? 'Escreva o nome: as letras entram direto. BACKSPACE apaga, ↓ desce para os detalhes.'
          : linhaDe(grupo, personagem)}
      </p>

      {/* atalhos de valor: existem para o rato, iguais aos do teclado */}
      <div className="pers__opcoes" role="group"
        aria-label={`Valores de ${rotuloGrupo(grupo)}`} hidden={nomeEmFoco}>
        {opcoesDe(grupo).map((o) => (
          <button key={o.id} type="button"
            className={personagem[grupo] === o.id ? 'menu__dif menu__dif--on' : 'menu__dif'}
            aria-pressed={personagem[grupo] === o.id}
            onClick={() => onValor(grupo, o.id)}>
            {o.rotulo}
          </button>
        ))}
      </div>

      {estadoAviso(personagem) && (
        <p className="menu__aviso" role="status">{estadoAviso(personagem)}</p>
      )}

      <div className="pers__acoes">
        <button type="button" className="menu__comecar" onClick={onConfirmar}>
          COMEÇAR (ENTER)
        </button>
        <button type="button" className="menu__voltar" onClick={onAleatorio}>
          ALEATÓRIO (R)
        </button>
        <button type="button" className="menu__voltar" onClick={onVoltar}>
          VOLTAR (ESC)
        </button>
      </div>
    </div>
  );
}
