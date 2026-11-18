/**
 * `UI-07` — ícones dos itens. SVG inline, `currentColor`, sem ficheiros: a paleta (`PAL-00`)
 * entra pelo `color` do contentor e nenhum ícone carrega uma cor própria.
 *
 * São **glifos de leitura**, não arte final: a arte dos itens entra com o *pipeline* (`P-16`).
 * A regra deles é uma só — o item tem de se distinguir a 24 px e sem cor (`§4.6`: nada depende
 * só de cor).
 */
import type { ItemId } from '../../core/items';

type Icone = JSX.Element;

function Svg({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square">
      {children}
    </svg>
  );
}

/** `ITM-001` — cruz de cura. */
function Cura(): Icone {
  return <Svg><path d="M10 3h4v6h6v4h-6v8h-4v-8H4V9h6z" fill="currentColor" stroke="none" /></Svg>;
}

/** `ITM-002` — escudo. */
function Escudo(): Icone {
  return <Svg><path d="M12 2l8 3v8c0 5-4 8-8 9-4-1-8-4-8-9V5z" /><path d="M12 7v10" opacity=".55" /></Svg>;
}

/** `ITM-003` — duas setas: o segundo pulo. */
function SaltoDuplo(): Icone {
  return <Svg><path d="M12 3l4 4h-3v6h-2V7H8z" /><path d="M12 12l4 4h-3v5h-2v-5H8z" opacity=".55" /></Svg>;
}

/** `ITM-004` — equipamento de teste: caixa com travessa. */
function Equipamento(): Icone {
  return <Svg><rect x="3" y="7" width="18" height="13" /><path d="M3 12h18M9 7V4h6v3" /></Svg>;
}

/** `ITM-005` — punho: a força. */
function Forca(): Icone {
  return <Svg><rect x="5" y="9" width="14" height="11" /><path d="M8 9V6M12 9V5M16 9V7" /></Svg>;
}

/** `ITM-006` — bolha: o fôlego. */
function Folego(): Icone {
  return <Svg><circle cx="9" cy="14" r="5" /><circle cx="17" cy="8" r="3" opacity=".55" /></Svg>;
}

/** `ITM-007` — faixa do espólio: o que ficou do chefe. */
function Espolio(): Icone {
  return <Svg><path d="M3 8l9-5 9 5-9 5z" /><path d="M6 11v6l6 3 6-3v-6" opacity=".55" /></Svg>;
}

/** `ITM-008` — gancho. */
function Gancho(): Icone {
  return <Svg><path d="M12 3v9a4 4 0 0 0 8 0" /><path d="M12 3l-2 3h4z" fill="currentColor" /></Svg>;
}

/** `ITM-009` — três unhas: a garra. */
function Garra(): Icone {
  return <Svg><path d="M5 4v12M11 4v12M17 4v12" /><path d="M3 18h16" /></Svg>;
}

/** `ITM-010` — pano ao vento: o estandarte. */
function Estandarte(): Icone {
  return <Svg><path d="M6 3v18" /><path d="M6 4h12l-3 5 3 5H6z" /></Svg>;
}

/** `ITM-011` — engrenagem partida: a peça do Forjador. */
function Peca(): Icone {
  return <Svg><path d="M12 4l2 3 4-1 1 4 3 2-3 2-1 4-4-1-2 3-2-3-4 1-1-4-3-2 3-2 1-4 4 1z" /></Svg>;
}

const ICONES: Record<ItemId, () => Icone> = {
  'ITM-001': Cura,
  'ITM-002': Escudo,
  'ITM-003': SaltoDuplo,
  'ITM-004': Equipamento,
  'ITM-005': Forca,
  'ITM-006': Folego,
  'ITM-007': Espolio,
  'ITM-008': Gancho,
  'ITM-009': Garra,
  'ITM-010': Estandarte,
  'ITM-011': Peca,
};

export function ItemIcon({ id }: { id: ItemId }): JSX.Element {
  const Desenho = ICONES[id] ?? Equipamento;
  return <Desenho />;
}

/** Baú: o cofre da sala segura (`UI-07`). Mesmo traço da mochila, com a fechadura. */
export function IconeBau(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square">
      <path d="M3 11a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v9H3z" />
      <path d="M3 12h18" opacity=".6" />
      <path d="M12 13v4" />
    </svg>
  );
}

/** Mochila fechada: o ícone do botão do HUD (`UI-07`). Desenhado aqui para ser o mesmo traço. */
export function IconeMochila(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square">
      <path d="M6 9a6 6 0 0 1 12 0v11H6z" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" />
      <path d="M6 14h12" opacity=".55" />
    </svg>
  );
}

/**
 * `UI-22` (`DEC-043`) — o ícone do botão **MAPA**: três salas ligadas por um corredor, que é
 * literalmente o que o painel desenha (e distingue-se do ícone da mochila em 16 px, `§4.6`).
 */
export function IconeMapa(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <rect x="1.5" y="2.5" width="5" height="4" />
      <rect x="9.5" y="2.5" width="5" height="4" />
      <rect x="5.5" y="9.5" width="5" height="4" />
      <path d="M6.5 4.5h3" />
      <path d="M8 9.5V6.6" />
    </svg>
  );
}

/**
 * `UI-14` (`DEC-041`) — o ícone do botão **HABILIDADES**: uma chama com degraus, que é o que o
 * painel mostra (a escada de níveis, `DEC-042` = dez). Desenhado aqui para ser o mesmo traço dos
 * outros ícones do HUD.
 */
export function IconeHabilidades(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8 1.5c1.8 2.2 2.8 3.6 2.8 5.1 0 1-.5 1.7-1.2 2.1.3-1.4-.2-2.4-1-3.1.2 1.6-.4 2.6-1.3 3.4-.6.6-1 1.2-1 2 0 1.4 1.2 2.5 2.7 2.5s2.9-1.2 2.9-3c0-1.2-.5-2.2-1.2-3.3"
        fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4.5 12.5h7" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 14.5h5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
