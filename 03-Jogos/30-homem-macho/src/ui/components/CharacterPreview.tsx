/**
 * `UI-12` — a **prévia** do personagem (`docs/04` §4.2.2).
 *
 * **Isto não é a arte do jogo.** É uma silhueta-placeholder, desenhada em SVG a partir dos
 * mesmos parâmetros que a arte vai ler (`services/character.ts`): serve para o jogador ver que a
 * escolha dele **fez alguma coisa** e para o programador conseguir testar cada campo sem esperar
 * pelo pipeline de arte (`P-16`). Quando a arte chegar, este componente é trocado; o
 * `Personagem` que sai daqui já é o contrato final.
 *
 * Sem rosto genérico bonito: é uma figura de bloco, com proporções reais de ombro, cintura e
 * altura por tipo de corpo — é isso que distingue "magro" de "maromba" antes de qualquer detalhe.
 */
import {
  GRUPOS, descreverPersonagem, formaCorpo, rotuloValor, temPresas, tomCabelo, tomPele,
  type Grupo, type Personagem,
} from '../../services/character';

interface Props {
  personagem: Personagem;
  /** Grupo em foco — o contorno destaca o que está a ser mudado. */
  grupo?: Grupo | null;
  largura?: number;
}

const W = 220;
const H = 320;

export function CharacterPreview({ personagem, grupo = null, largura = 220 }: Props): JSX.Element {
  const pele = tomPele(personagem);
  const cabelo = tomCabelo(personagem);
  const corpo = formaCorpo(personagem);

  // --- geometria: tudo derivado do tipo de corpo, nada à mão ---
  const escala = (H / 320) * corpo.altura;
  const ombro = 54 * corpo.ombro;
  const tronco = 30 * corpo.tronco;
  const cintura = 22 * corpo.tronco * corpo.cintura;
  const centro = W / 2;
  const topo = 92;                       // fim do pescoço
  const alturaTronco = 96;
  const quadril = topo + alturaTronco;

  // --- cabeça: o rosto muda a forma, não o tamanho ---
  const raioRosto = personagem.rosto === 'redondo' ? 26
    : personagem.rosto === 'oval' ? 24
      : personagem.rosto === 'angular' ? 15
        : 13;                            // quadrado
  const larguraRosto = personagem.rosto === 'redondo' ? 44
    : personagem.rosto === 'oval' ? 38 : 42;
  const alturaRosto = personagem.rosto === 'redondo' ? 46
    : personagem.rosto === 'oval' ? 50 : 48;
  const rostoX = centro - larguraRosto / 2;
  const rostoY = 34;

  return (
    <svg className="previa" viewBox={`0 0 ${W} ${H}`} width={largura} height={largura * (H / W)}
      role="img" aria-label={`Prévia do personagem: ${descreverPersonagem(personagem)}`}
      data-pele={personagem.pele} data-cabelo={personagem.cabelo}
      data-corpo={personagem.corpo} data-rosto={personagem.rosto}
      data-dentes={personagem.dentes}>
      {/* moldura tracejada: diz "isto é um lugar reservado", não "isto é a arte final" */}
      <rect x="1" y="1" width={W - 2} height={H - 2} fill="rgba(42,36,51,.28)"
        stroke="#464052" strokeDasharray="5 5" />

      <g transform={`translate(0 ${(H - H * corpo.altura) / 2}) scale(1 ${escala})`}>
        {/* --- pernas --- */}
        <rect x={centro - cintura * 0.72} y={quadril} width={cintura * 0.62}
          height={76} fill="#2A2433" />
        <rect x={centro + cintura * 0.1} y={quadril} width={cintura * 0.62}
          height={76} fill="#2A2433" />
        <rect x={centro - cintura * 0.78} y={quadril + 70} width={cintura * 0.72}
          height={12} fill="#15131C" />
        <rect x={centro + cintura * 0.06} y={quadril + 70} width={cintura * 0.72}
          height={12} fill="#15131C" />

        {/* --- tronco: ombro → cintura → quadril (as três medidas do corpo) --- */}
        <path
          d={`M${centro - ombro} ${topo}
              L${centro + ombro} ${topo}
              L${centro + tronco * 0.9} ${topo + alturaTronco * 0.55}
              L${centro + cintura} ${quadril}
              L${centro - cintura} ${quadril}
              L${centro - tronco * 0.9} ${topo + alturaTronco * 0.55} Z`}
          fill={pele.base} stroke={pele.sombra} strokeWidth="2" />
        {/* faixa/marca do casaco: a mesma linguagem visual do sprite em jogo */}
        <rect x={centro - tronco * 0.92} y={topo + alturaTronco * 0.62}
          width={tronco * 1.84} height="7" fill="#C98A3E" opacity=".85" />

        {/* --- braços --- */}
        <rect x={centro - ombro - 6} y={topo + 6} width={13}
          height={alturaTronco * 0.86} rx="5" fill={pele.base} stroke={pele.sombra} strokeWidth="2" />
        <rect x={centro + ombro - 7} y={topo + 6} width={13}
          height={alturaTronco * 0.86} rx="5" fill={pele.base} stroke={pele.sombra} strokeWidth="2" />

        {/* --- pescoço + cabeça --- */}
        <rect x={centro - 9} y={topo - 18} width="18" height="22" fill={pele.base} />
        <rect x={rostoX} y={rostoY} width={larguraRosto} height={alturaRosto}
          rx={raioRosto} ry={raioRosto} fill={pele.base}
          stroke={pele.sombra} strokeWidth="2" />

        {/* --- expressão: olhos, sobrancelhas e boca --- */}
        <Rosto personagem={personagem} centro={centro} rostoY={rostoY} largura={larguraRosto} />

        {/* --- cabelo --- */}
        <Cabelo personagem={personagem} cor={cabelo.base} sombra={cabelo.sombra}
          centro={centro} rostoY={rostoY} largura={larguraRosto} altura={alturaRosto} />

        {/* --- marcas: cicatriz, tatuagem ou pintura --- */}
        <Marcas personagem={personagem} centro={centro} rostoY={rostoY}
          largura={larguraRosto} topo={topo} tronco={tronco} ombro={ombro} />
      </g>

      {/* o grupo em foco ganha uma etiqueta: o jogador sabe o que está a mudar */}
      {grupo && (
        <text x={W / 2} y={H - 10} textAnchor="middle" fill="#C98A3E"
          fontSize="9" letterSpacing="2">
          {rotuloValor(grupo, personagem)}
        </text>
      )}
    </svg>
  );
}

/** Olhos, sobrancelhas e boca: cinco expressões, sem depender de uma única boca curva. */
function Rosto({ personagem, centro, rostoY }: {
  personagem: Personagem; centro: number; rostoY: number; largura: number;
}): JSX.Element {
  const olhoY = rostoY + 20;
  const dx = 9;
  const olho = (lado: -1 | 1): JSX.Element => {
    const x = centro + lado * dx;
    switch (personagem.expressao) {
      case 'furioso':
        return (
          <g key={lado}>
            <rect x={x - 5} y={olhoY - 5} width="10" height="9" fill="#15131C" />
            <rect x={x - 7} y={olhoY - 9} width="13" height="3" fill="#15131C"
              transform={`rotate(${lado * 12} ${x} ${olhoY})`} />
          </g>
        );
      case 'sorriso':
        return <path key={lado} d={`M${x - 5} ${olhoY} q5 -5 10 0`} stroke="#15131C"
          strokeWidth="3" fill="none" />;
      case 'cansado':
        return (
          <g key={lado}>
            <rect x={x - 5} y={olhoY - 2} width="10" height="4" fill="#15131C" />
            <rect x={x - 6} y={olhoY + 4} width="12" height="2" fill="#6D4327" opacity=".8" />
          </g>
        );
      case 'grito':
        return <rect key={lado} x={x - 4} y={olhoY - 6} width="9" height="10" fill="#15131C" />;
      default:
        return <rect key={lado} x={x - 4} y={olhoY - 3} width="9" height="6" fill="#15131C" />;
    }
  };
  const bocaY = rostoY + 34;
  const boca = personagem.expressao === 'grito'
    ? <ellipse cx={centro} cy={bocaY} rx="7" ry="9" fill="#15131C" />
    : personagem.expressao === 'sorriso'
      ? <path d={`M${centro - 8} ${bocaY - 2} q8 7 16 0`} stroke="#15131C" strokeWidth="3" fill="none" />
      : personagem.expressao === 'furioso'
        ? <path d={`M${centro - 8} ${bocaY + 2} q8 -6 16 0`} stroke="#15131C" strokeWidth="3" fill="none" />
        : <rect x={centro - 7} y={bocaY} width="14" height="3" fill="#15131C" opacity=".85" />;
  /*
   * As presas descem **da boca**, brancas contra o `#15131C`: é o único branco puro do rosto, e
   * por isso lê-se mesmo com a pele pálida por trás. Não substituem a expressão — acrescentam-se.
   */
  const presas = temPresas(personagem) ? (
    <g>
      {/* a boca escura primeiro: sobre pele pálida, presas brancas sem fundo não se veem */}
      <rect x={centro - 9} y={bocaY - 3} width="18" height="8" rx="3" fill="#15131C" />
      <g fill="#F4F0E6">
        <path d={`M${centro - 6} ${bocaY - 3} l3 0 l-1.5 8 z`} />
        <path d={`M${centro + 3} ${bocaY - 3} l3 0 l-1.5 8 z`} />
      </g>
    </g>
  ) : null;
  return <g>{[-1, 1].map((l) => olho(l as -1 | 1))}{boca}{presas}</g>;
}

/** Sete penteados: o mesmo bloco de cabelo, em posições diferentes. */
function Cabelo({ personagem, cor, sombra, centro, rostoY, largura, altura }: {
  personagem: Personagem; cor: string; sombra: string;
  centro: number; rostoY: number; largura: number; altura: number;
}): JSX.Element {
  const esq = centro - largura / 2;
  const dir = centro + largura / 2;
  switch (personagem.cabelo) {
    case 'raspado':
      return <rect x={esq + 3} y={rostoY + 2} width={largura - 6} height="10" rx="5"
        fill={sombra} opacity=".75" />;
    case 'moicano':
      return (
        <g>
          <rect x={esq + 2} y={rostoY + 2} width={largura - 4} height="8" rx="4" fill={sombra} />
          <rect x={centro - 6} y={rostoY - 22} width="12" height="28" rx="5" fill={cor} />
        </g>
      );
    case 'coque':
      return (
        <g>
          <rect x={esq + 1} y={rostoY - 2} width={largura - 2} height="16" rx="7" fill={cor} />
          <circle cx={dir - 2} cy={rostoY - 8} r="9" fill={cor} stroke={sombra} strokeWidth="2" />
        </g>
      );
    case 'longo':
      /*
       * O cabelo é desenhado **depois** do rosto, por isso o comprido não pode ser um bloco: seria
       * uma cortina a tapar a cara. São três peças — a franja em cima e duas mechas nos lados — e
       * o rosto fica à vista no meio. É o penteado do `ALUCARD`, e o único que dá para ler assim.
       */
      return (
        <g stroke={sombra} strokeWidth="1.5">
          <rect x={esq - 2} y={rostoY - 6} width={largura + 4} height="16" rx="8" fill={cor} />
          <rect x={esq - 5} y={rostoY - 2} width="9" height={altura + 40} rx="4" fill={cor} />
          <rect x={dir - 4} y={rostoY - 2} width="9" height={altura + 40} rx="4" fill={cor} />
          <rect x={esq - 5} y={rostoY + altura + 34} width={largura + 10} height="6" rx="3"
            fill={sombra} opacity=".7" />
        </g>
      );
    case 'franja':
      return (
        <g>
          <rect x={esq} y={rostoY - 4} width={largura} height="22" rx="7" fill={cor} />
          <rect x={esq + 2} y={rostoY + 14} width={largura - 4} height="4" fill={cor} />
        </g>
      );
    case 'cacheado':
      return (
        <g>
          {[-14, -6, 2, 10].map((dx2) => (
            <circle key={dx2} cx={centro + dx2} cy={rostoY - 2} r="9" fill={cor} />
          ))}
          <rect x={esq + 4} y={rostoY + 2} width={largura - 8} height="9" rx="4" fill={cor} />
        </g>
      );
    default: // curto
      return (
        <g>
          <rect x={esq} y={rostoY - 3} width={largura} height="16" rx="6" fill={cor} />
          <rect x={esq} y={rostoY + 10} width="7" height="12" rx="3" fill={cor} />
          <rect x={dir - 7} y={rostoY + 10} width="7" height="12" rx="3" fill={cor} />
        </g>
      );
  }
}

/** Seis marcas, desenhadas no sítio onde a arte as vai pôr. */
function Marcas({ personagem, centro, rostoY, largura, topo, tronco, ombro }: {
  personagem: Personagem; centro: number; rostoY: number; largura: number;
  topo: number; tronco: number; ombro: number;
}): JSX.Element | null {
  switch (personagem.marca) {
    case 'cicatriz-olho':
      return <rect x={centro + 4} y={rostoY + 12} width="3" height="22" fill="#7B2E4A"
        transform={`rotate(9 ${centro + 4} ${rostoY + 12})`} />;
    case 'cicatriz-boca':
      return <rect x={centro + 8} y={rostoY + 30} width="3" height="12" fill="#7B2E4A"
        transform={`rotate(-14 ${centro + 8} ${rostoY + 30})`} />;
    case 'tatuagem-braco':
      return (
        <g fill="#3B2418" opacity=".8">
          <rect x={centro - ombro - 4} y={topo + 26} width="9" height="4" />
          <rect x={centro - ombro - 4} y={topo + 34} width="9" height="4" />
          <rect x={centro - ombro - 4} y={topo + 42} width="9" height="4" />
        </g>
      );
    case 'tatuagem-peito':
      return <path d={`M${centro - tronco * 0.6} ${topo + 18} q${tronco * 0.6} 14 ${tronco * 1.2} 0`}
        stroke="#3B2418" strokeWidth="5" fill="none" opacity=".75" />;
    case 'pintura':
      return (
        <g fill="#7B2E4A" opacity=".8">
          <rect x={centro - largura / 2 + 2} y={rostoY + 16} width={largura - 4} height="4" />
          <rect x={centro - largura / 2 + 2} y={rostoY + 26} width={largura - 4} height="4" />
        </g>
      );
    default:
      return null;
  }
}

/** A mesma lista de grupos que a máquina percorre — exportada para o ecrã não a repetir. */
export { GRUPOS };
