/**
 * `UI-22` (`DEC-043`) — **o mapa**, à maneira dos jogos de exploração: uma planta do setor, não
 * uma lista de salas.
 *
 * Três decisões que se vêem no ecrã:
 *
 * 1. **A planta é a topologia.** As salas ficam onde ficam (a posição vem da cena, derivada das
 *    saídas em `core/mapa.ts`) e os corredores desenham-se nos lados por onde se passa. É o que faz
 *    a fenda de L02-02 aparecer a **subir** para L02-06 em vez de a mandar para L02-03 — o bug que
 *    o jogador encontrou antes de o mapa existir, e que o mapa agora denuncia à primeira vista.
 * 2. **O que não se viu não se inventa.** Três estados e nada mais: `atual` (onde o herói está),
 *    `visitada` (já lá esteve) e `conhecida` (não entrou, mas viu a porta de uma sala visitada). O
 *    resto não é desenhado — um mapa completo no minuto 1 não é um mapa, é um spoiler.
 * 3. **A UI não calcula topologia** (`ADR-01`): recebe a planta montada e desenha. Toda a regra
 *    vive em `core/mapa.ts`, com testes.
 *
 * Fora da planta, a **coluna dos 16 setores** diz onde se está no mundo e quanto de cada setor já
 * se andou — o "mapa-múndi" que os jogos do género mostram ao lado do mapa da sala.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useUi, closeMapa, openMapa } from '../../store/uiStore';

/** Os nomes dos estados, na legenda e no `aria-label`. */
const ROTULO_ESTADO = {
  atual: 'você está aqui',
  visitada: 'visitada',
  conhecida: 'porta vista',
  desconhecida: 'não explorada',
} as const;

export function Mapa(): JSX.Element | null {
  const { state } = useUi();
  const aberta = state.mapaPainel;
  const mapa = state.mapa;
  const [sel, setSel] = useState<string | null>(null);
  const painel = useRef<HTMLDivElement>(null);

  // ao abrir, a seleção é a sala onde o herói está — é a pergunta que o jogador traz
  useEffect(() => {
    if (!aberta || !mapa) return;
    setSel(mapa.atual);
    painel.current?.focus();
  }, [aberta, mapa]);

  /*
   * **Aberto sem planta: volta a pedir — e desiste ao fim de um tempo.**
   *
   * Uma repetição só não chega: se ela cair na mesma janela má que perdeu a primeira planta, o
   * painel fica a dizer «a preparar…» para sempre. Uma repetição a cada 400 ms, no máximo dez
   * (quatro segundos de paciência), cura o caso normal e não se transforma num `poll` eterno — o
   * jogador tem sempre `M`/`ESC` para sair, e o jogo nunca fica com a cena pausada e o ecrã vazio.
   */
  useEffect(() => {
    if (!aberta || mapa) return;
    let tentativas = 0;
    const t = window.setInterval(() => {
      tentativas += 1;
      if (tentativas > 10) { window.clearInterval(t); return; }
      openMapa();
    }, 400);
    return () => window.clearInterval(t);
  }, [aberta, mapa]);

  useEffect(() => {
    if (!aberta) return;
    const onKey = (e: KeyboardEvent): void => {
      switch (e.key) {
        case 'm':
        case 'M':
        case 'Escape':
          e.preventDefault();
          closeMapa();
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault();
          if (!mapa || !sel) break;
          const aqui = mapa.salas.find((s) => s.id === sel);
          if (!aqui) break;
          const passo = e.key === 'ArrowLeft' ? { x: -1, y: 0 }
            : e.key === 'ArrowRight' ? { x: 1, y: 0 }
              : e.key === 'ArrowUp' ? { x: 0, y: -1 } : { x: 0, y: 1 };
          // anda uma casa **na planta** e só entre salas que o mapa mostra: a seleção não
          // atravessa paredes nem revela o que não se viu
          let x = aqui.x + passo.x;
          let y = aqui.y + passo.y;
          for (let i = 0; i < 8; i += 1) {
            const alvo = mapa.salas.find((s) => s.x === x && s.y === y
              && s.estado !== 'desconhecida');
            if (alvo) { setSel(alvo.id); break; }
            x += passo.x;
            y += passo.y;
          }
          break;
        }
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aberta, mapa, sel]);

  const grade = useMemo(() => {
    if (!mapa) return { colunas: 1, linhas: 1 };
    return {
      colunas: Math.max(...mapa.salas.map((s) => s.x)) + 1,
      linhas: Math.max(...mapa.salas.map((s) => s.y)) + 1,
    };
  }, [mapa]);

  /*
   * **Aberto e sem planta é um estado, não um nada.**
   *
   * Se o `game:mapa` se perder (cena a meio de uma transição, evento engolido), devolver `null`
   * deixava o jogador com a cena pausada e o ecrã sem nada — o pior desfecho possível, porque é
   * indistinguível de o jogo ter congelado. Em vez disso: diz que está a preparar, pede outra vez
   * e deixa sair com `M`/`ESC` (o `useEffect` acima já está armado).
   */
  if (aberta && !mapa) {
    return (
      <div className="panel panel--mapa" role="dialog" aria-modal="true" aria-label="Mapa">
        <div className="panel__inner mapa" tabIndex={-1} ref={painel}>
          <header className="mapa__topo">
            <span className="mapa__marca">MAPA</span>
            <span className="mapa__setor">a preparar…</span>
          </header>
          <p className="panel__muted">M ou ESC fechar</p>
        </div>
      </div>
    );
  }
  if (!aberta || !mapa) return null;

  const selecionada = mapa.salas.find((s) => s.id === sel) ?? mapa.salas.find((s) => s.id === mapa.atual);
  const visitadasNoSetor = mapa.salas.filter((s) => s.estado === 'atual' || s.estado === 'visitada').length;
  const porEstado = (estado: 'atual' | 'visitada' | 'conhecida'): number =>
    mapa.salas.filter((s) => s.estado === estado).length;

  return (
    <div className="panel panel--mapa" role="dialog" aria-modal="true" aria-label="Mapa">
      <div className="panel__inner mapa" tabIndex={-1} ref={painel}>
        <header className="mapa__topo">
          <span className="mapa__marca">MAPA</span>
          <span className="mapa__setor">
            {mapa.setor} · {mapa.setorNome}
          </span>
          <span className="mapa__contadores" aria-live="polite">
            {visitadasNoSetor} / {mapa.total} SALAS
          </span>
        </header>

        <div className="mapa__corpo">
          <div className="mapa__planta-area">
            <div
              className="mapa__planta"
              role="list"
              aria-label={`Planta de ${mapa.setorNome}`}
              style={{
                gridTemplateColumns: `repeat(${grade.colunas}, var(--mapa-cel))`,
                gridTemplateRows: `repeat(${grade.linhas}, var(--mapa-cel))`,
              }}
            >
              {mapa.salas.map((sala) => {
                const ligado = mapa.ligacoes.filter((l) => l.de === sala.id && !l.atalho);
                const tem = (d: string): boolean => ligado.some((l) => l.direcao === d);
                return (
                  <div
                    key={sala.id}
                    role="listitem"
                    className={[
                      'mapa__sala',
                      `mapa__sala--${sala.estado}`,
                      sel === sala.id ? 'mapa__sala--sel' : '',
                    ].filter(Boolean).join(' ')}
                    style={{ gridColumn: sala.x + 1, gridRow: sala.y + 1 }}
                    aria-label={`${sala.id} ${sala.nome} — ${ROTULO_ESTADO[sala.estado]}`}
                    onClick={() => setSel(sala.id)}
                    data-estado={sala.estado}
                  >
                    <span className="mapa__id">{sala.id.slice(1)}</span>
                    {tem('leste') && <span className="mapa__liga mapa__liga--leste" aria-hidden="true" />}
                    {tem('oeste') && <span className="mapa__liga mapa__liga--oeste" aria-hidden="true" />}
                    {tem('teto') && <span className="mapa__liga mapa__liga--teto" aria-hidden="true" />}
                    {tem('piso') && <span className="mapa__liga mapa__liga--piso" aria-hidden="true" />}
                    {sala.portal && (
                      <span className="mapa__portal" aria-hidden="true">▸</span>
                    )}
                  </div>
                );
              })}
            </div>

            <ul className="mapa__legenda" aria-label="Legenda do mapa">
              <li className="mapa__leg mapa__leg--atual">VOCÊ ESTÁ AQUI</li>
              <li className="mapa__leg mapa__leg--visitada">VISITADA {porEstado('visitada')}</li>
              <li className="mapa__leg mapa__leg--conhecida">PORTA VISTA {porEstado('conhecida')}</li>
              <li className="mapa__leg mapa__leg--portal">▸ OUTRO SETOR</li>
            </ul>
          </div>

          <nav className="mapa__setores" aria-label="Setores do jogo">
            <p className="mapa__setores-titulo">SETORES</p>
            <ul className="mapa__lista-setores">
              {mapa.setores.map((s) => (
                <li
                  key={s.id}
                  className={[
                    'mapa__setor-linha',
                    s.atual ? 'mapa__setor-linha--atual' : '',
                    s.visitadas === 0 ? 'mapa__setor-linha--vazio' : '',
                  ].filter(Boolean).join(' ')}
                  aria-label={`${s.id} ${s.nome}: ${s.visitadas} de ${s.total} salas${s.atual ? ' — atual' : ''}`}
                >
                  <span className="mapa__setor-id">{s.id.slice(4)}</span>
                  <span className="mapa__setor-nome">{s.nome}</span>
                  <span className="mapa__setor-conta">
                    {s.visitadas === 0 ? '—' : `${s.visitadas}/${s.total}`}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mapa__info" role="status">
          {selecionada
            ? `${selecionada.id} · ${selecionada.nome} — ${ROTULO_ESTADO[selecionada.estado].toUpperCase()}`
            : ''}
        </p>

        <footer className="mapa__pe">
          <span className="panel__muted">M OU ESC FECHAR · ↑ ↓ ← → PERCORRER A PLANTA</span>
        </footer>
      </div>
    </div>
  );
}
