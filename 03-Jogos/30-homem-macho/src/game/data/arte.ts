/**
 * **As medidas da arte** — `docs/14-arte-tilesets-e-spritesheets.md`.
 *
 * Os números vivem em `arte.json` e **só** aí: este ficheiro dá-lhes tipos e contas, o teste
 * verifica-os contra o jogo (tile, viewport, hurtboxes do `tuning.ts`) e o `npm run arte` compara-os
 * com os PNG que o artista entregar. Um número de arte duplicado na doc, no código e no ficheiro
 * do artista é um número que vai divergir — e o sintoma é um sprite esticado, que ninguém reporta
 * como bug.
 *
 * A regra que faz a arte encaixar sem code change:
 *
 * - o **frame** é a célula da folha (o que o `.png` mede);
 * - a **área útil** é onde o desenho pode viver dentro do frame (o resto é folga para o golpe,
 *   para o cabelo, para o efeito);
 * - a **hurtbox** é do `tuning.ts`, não da arte: a `Player` deriva o offset do corpo do tamanho
 *   do frame (`(width - body.width) / 2`, `height - body.height`), portanto **qualquer** frame
 *   serve desde que o desenho esteja centrado na horizontal e com os pés no fundo da célula.
 */
import dados from './arte.json';
import { PLAYER, SENTINEL, TILE, VIEW } from './tuning';

/**
 * `customizacao` = folha de **variantes** (um corpo por célula, um penteado por célula…) — não é
 * animação: os frames são alternativas, não uma sequência no tempo. `paleta` = amostras de cor.
 */
export type TipoPeca =
  | 'spritesheet' | 'tileset' | 'itens' | 'efeito' | 'fundo' | 'customizacao' | 'paleta';
export type Ancora = 'base-centro' | 'centro';

export interface Acao {
  nome: string;
  frames: number;
  fps: number;
  loop: boolean;
}

export interface Peca {
  id: string;
  chave: string;
  ficheiro: string;
  tipo: TipoPeca;
  entidade: string | null;
  onde: string;
  frame: { w: number; h: number };
  util: { w: number; h: number };
  hurtbox: { w: number; h: number } | null;
  ancora: Ancora;
  colunas: number;
  estado: 'pendente' | 'pronta';
  acoes: Acao[];
}

/** O catálogo da personalização — espelho de `services/character.ts`, com os ids e as cores de lá. */
export interface Catalogo {
  nota: string;
  corpos: Array<{ id: string; ombro: number; tronco: number; cintura: number; altura: number }>;
  cabelos: string[];
  rostos: string[];
  expressoes: string[];
  marcas: string[];
  /** Só as marcas que ficam abaixo do pescoço; a ordem é filtrada de `MARCAS`, não inventada. */
  marcasCorpo: string[];
  peles: Array<{ id: string; cor: string; sombra: string }>;
  coresCabelo: Array<{ id: string; cor: string; sombra: string }>;
  dentes: string[];
}

export interface Medidas {
  base: {
    tile: number;
    view: { w: number; h: number };
    salas: { linhas: number; largurasTiles: number[] };
    atlasMax: number;
    fpsMin: number;
    fpsMax: number;
    escalaMestre: number;
  };
  pastas: Record<string, string>;
  pecas: Peca[];
  customizacao: Catalogo;
}

export const CATALOGO: Catalogo = (dados as Medidas).customizacao;

export const ARTE = dados as Medidas;
export const PECAS = ARTE.pecas;
export const ATLAS_MAX = ARTE.base.atlasMax;

export function peca(chave: string): Peca {
  const p = PECAS.find((x) => x.chave === chave);
  if (!p) throw new Error(`peça de arte desconhecida: ${chave}`);
  return p;
}

/** Quantos frames a peça tem no total (soma das ações). */
export function totalDeFrames(p: Peca): number {
  return p.acoes.reduce((s, a) => s + a.frames, 0);
}

/** A folha que o artista tem de entregar: `colunas × linhas` de células `frame`. */
export function tamanhoDaFolha(p: Peca): { w: number; h: number; linhas: number } {
  const linhas = Math.ceil(totalDeFrames(p) / p.colunas);
  return { w: p.colunas * p.frame.w, h: linhas * p.frame.h, linhas };
}

/** Cabe no atlas alvo (2048²)? Alvo mobile do `§5.3`. */
export function cabeNoAtlas(p: Peca): boolean {
  const { w, h } = tamanhoDaFolha(p);
  return w <= ATLAS_MAX && h <= ATLAS_MAX;
}

/**
 * A célula `n` (0-based) da folha, em pixéis — é o que o `load.spritesheet` espera quando a folha
 * não é uma grelha completa (`frameWidth`/`frameHeight` + `endFrame` só servem para grelhas cheias).
 */
export function celulaDaFolha(p: Peca, n: number): { x: number; y: number; w: number; h: number } {
  const x = (n % p.colunas) * p.frame.w;
  const y = Math.floor(n / p.colunas) * p.frame.h;
  return { x, y, w: p.frame.w, h: p.frame.h };
}

/** Chaves `Phaser` da animação: `player:corrida`, `boss:telegraph`… (uma chave por ação). */
export function chaveDaAcao(p: Peca, a: Acao): string {
  return `${p.chave}:${a.nome}`;
}

/**
 * O que **tem** de ser verdade para o desenho não sair torto no jogo. Devolve os problemas
 * encontrados (vazio = encaixa). Usado pelo teste e pelo validador — a mesma régua para os dois.
 */
export function problemas(p: Peca): string[] {
  const erros: string[] = [];
  const { frame, util, hurtbox } = p;

  if (!p.ficheiro.endsWith('.png')) erros.push(`${p.chave}: a arte tem de ser .png`);
  if (!/^[a-z0-9_]+$/.test(p.chave)) erros.push(`${p.chave}: chave em snake_case`);
  if (p.colunas < 1) erros.push(`${p.chave}: colunas ≥ 1`);
  if (totalDeFrames(p) < 1) erros.push(`${p.chave}: sem frames`);
  if (!cabeNoAtlas(p)) erros.push(`${p.chave}: a folha ${tamanhoDaFolha(p).w}×${tamanhoDaFolha(p).h} passa o atlas de ${ATLAS_MAX}`);

  // a área útil vive dentro do frame, encostada ao fundo (pés)
  if (util.w > frame.w || util.h > frame.h) {
    erros.push(`${p.chave}: a área útil ${util.w}×${util.h} não cabe no frame ${frame.w}×${frame.h}`);
  }

  // a hurtbox é do jogo; a área útil tem de a conter, senão o desenho "não toca" onde dói
  if (hurtbox && (hurtbox.w > util.w || hurtbox.h > util.h)) {
    erros.push(`${p.chave}: a hurtbox ${hurtbox.w}×${hurtbox.h} não cabe na área útil ${util.w}×${util.h}`);
  }

  // tiles são a grelha: 64×64 e nada mais
  if (p.tipo === 'tileset' && (frame.w !== TILE || frame.h !== TILE)) {
    erros.push(`${p.chave}: tile tem de ser ${TILE}×${TILE} (é ${frame.w}×${frame.h})`);
  }
  // um fundo de setor é exatamente o viewport lógico
  if (p.tipo === 'fundo' && p.chave === 'bg_setor'
    && (frame.w !== VIEW.width || frame.h !== VIEW.height)) {
    erros.push(`${p.chave}: fundo de setor tem de ser ${VIEW.width}×${VIEW.height}`);
  }
  // animação fora de 8–12 fps lê-se como quebrada (`§5.3`) — mas uma folha de variantes não anima
  const ehVariante = p.tipo === 'customizacao' || p.tipo === 'paleta';
  for (const a of p.acoes) {
    if (!ehVariante && a.frames > 1 && (a.fps < ARTE.base.fpsMin || a.fps > ARTE.base.fpsMax)) {
      erros.push(`${p.chave}:${a.nome} a ${a.fps} fps — fora de ${ARTE.base.fpsMin}–${ARTE.base.fpsMax}`);
    }
  }
  return erros;
}

/** Quadro de resumo para o terminal / para a doc. */
export function resumo(): Array<{ id: string; chave: string; frame: string; frames: number; folha: string }> {
  return PECAS.map((p) => {
    const f = tamanhoDaFolha(p);
    return {
      id: p.id,
      chave: p.chave,
      frame: `${p.frame.w}×${p.frame.h}`,
      frames: totalDeFrames(p),
      folha: `${f.w}×${f.h}`,
    };
  });
}

/** O herói e a sentinela, à mão, porque são os dois que o `tuning.ts` aperta. */
export const HEROI = { ...peca('player'), hurtboxJogo: PLAYER.body } as const;
export const SENTINELA = { ...peca('sentinel'), hurtboxJogo: SENTINEL.body } as const;
