/**
 * `UI-12` — **criação de personagem** (`docs/04` §4.2.2): o que o jogador escolhe antes da
 * primeira sala.
 *
 * Vive em `services/` porque três camadas precisam do mesmo contrato e nenhuma pode importar as
 * outras (`ADR-01`): o menu desenha a prévia, o `BootScene` desenha o herói em jogo, e o save
 * guarda a escolha. Sem uma definição única, a cor do cabelo no menu e a cor no jogo seriam
 * duas fontes de verdade — e divergiriam na primeira madrugada.
 *
 * **Nada aqui é arte.** São *parâmetros de arte*: identidades, rótulos e tons. Quando a arte
 * chegar, ela lê estes mesmos campos; nenhuma escolha do jogador se perde.
 *
 * Regra de normalização: como em `settings.ts`, **toda a escolha tem padrão** — um save antigo
 * (sem personagem), um `localStorage` adulterado ou um campo novo que ainda não existia
 * produzem um personagem válido, nunca um `undefined` a chegar ao desenho.
 */
export type CabeloId = 'curto' | 'moicano' | 'coque' | 'longo' | 'raspado' | 'franja' | 'cacheado';
export type CorCabeloId = 'preto' | 'castanho' | 'loiro' | 'ruivo' | 'grisalho' | 'branco' | 'azul';
export type RostoId = 'quadrado' | 'oval' | 'angular' | 'redondo';
export type ExpressaoId = 'serio' | 'furioso' | 'sorriso' | 'cansado' | 'grito';
export type MarcaId =
  | 'nenhuma' | 'cicatriz-olho' | 'cicatriz-boca' | 'tatuagem-braco' | 'tatuagem-peito' | 'pintura';
export type CorpoId = 'magro' | 'atletico' | 'forte' | 'maromba' | 'gordo';
export type PeleId = 'clara' | 'palida' | 'media' | 'morena' | 'parda' | 'escura' | 'retinta';
/**
 * **Presas de vampiro** — o único campo que o jogador não escolhe: nasce `normais` e só o easter
 * egg do `ALUCARD` o liga (§4.2.2). Fica no contrato, e não escondido no desenho, porque três
 * camadas o têm de ler (prévia, herói em jogo, save) e uma delas leria `undefined`.
 */
export type DentesId = 'normais' | 'vampiro';

export interface Personagem {
  /**
   * O **nome do herói**. Não é um campo cosmético: é onde vivem os easter eggs (`EASTER_EGGS`) e a
   * única escolha do ecrã que o jogador escreve em vez de percorrer.
   */
  nome: string;
  cabelo: CabeloId;
  corCabelo: CorCabeloId;
  rosto: RostoId;
  expressao: ExpressaoId;
  marca: MarcaId;
  /** Fora de `GRUPOS` de propósito: é do easter egg, não é uma linha do ecrã. */
  dentes: DentesId;
  corpo: CorpoId;
  pele: PeleId;
}

/**
 * Os grupos editáveis, **na ordem em que o jogador os percorre**. A ordem é do documento, não do
 * componente: cabelo antes da cor do cabelo, corpo antes do tom de pele (o corpo muda a
 * silhueta; a pele muda o preenchimento).
 */
export const GRUPOS = [
  'cabelo', 'corCabelo', 'rosto', 'expressao', 'marca', 'corpo', 'pele',
] as const;
export type Grupo = typeof GRUPOS[number];

/** Tom de pele: `base` preenche, `sombra` dá o volume (ombro, queixo) sem precisar de arte. */
export interface Tom { id: string; rotulo: string; base: string; sombra: string; linha: string }

export const PELES: readonly Tom[] = [
  { id: 'clara', rotulo: 'CLARA', base: '#E8C4A2', sombra: '#C99F7C', linha: 'Pele clara — a luz baixa do mundo deixa marcas depressa.' },
  { id: 'palida', rotulo: 'PÁLIDA', base: '#EFE4D6', sombra: '#CDBFAE', linha: 'Pálida como papel: não é bronzeado que falta, é sangue.' },
  { id: 'media', rotulo: 'MÉDIA', base: '#D9A97E', sombra: '#B8865C', linha: 'Pele média, o tom neutro do pacote de arte.' },
  { id: 'morena', rotulo: 'MORENA', base: '#B98154', sombra: '#96633C', linha: 'Pele morena, com o sol dos setores abertos.' },
  { id: 'parda', rotulo: 'PARDA', base: '#8E5C3A', sombra: '#6D4327', linha: 'Pele parda, quente, sem verniz.' },
  { id: 'escura', rotulo: 'ESCURA', base: '#5E3A26', sombra: '#452818', linha: 'Pele escura, contraste alto com o dourado do casaco.' },
  { id: 'retinta', rotulo: 'RETINTA', base: '#3B2418', sombra: '#29180F', linha: 'Pele retinta — no escuro, é a silhueta que se lê.' },
];

export const CORES_CABELO: readonly Tom[] = [
  { id: 'preto', rotulo: 'PRETO', base: '#15131C', sombra: '#0B0A0F', linha: 'Preto: lê-se como um bloco escuro, mesmo em contraluz.' },
  { id: 'castanho', rotulo: 'CASTANHO', base: '#4A2E1C', sombra: '#331F13', linha: 'Castanho: o tom mais comum do mundo, e o mais fácil de sombrear.' },
  { id: 'loiro', rotulo: 'LOIRO', base: '#C9A15A', sombra: '#A47C3C', linha: 'Loiro: brilha no escuro e chama atenção indesejada.' },
  { id: 'ruivo', rotulo: 'RUIVO', base: '#A24A22', sombra: '#7C3517', linha: 'Ruivo: o único tom que o cenário não repete.' },
  { id: 'grisalho', rotulo: 'GRISALHO', base: '#8A8694', sombra: '#6A6676', linha: 'Grisalho: o jogo não te pergunta a idade — tu é que contas.' },
  { id: 'branco', rotulo: 'BRANCO', base: '#E2DED2', sombra: '#C2BEB2', linha: 'Branco: contraste máximo com o rosto.' },
  { id: 'azul', rotulo: 'AZUL', base: '#3C5C8E', sombra: '#2A4166', linha: 'Azul: não é cor natural. É escolha.' },
];

export interface Opcao { id: string; rotulo: string; linha: string }

export const CABELOS: readonly Opcao[] = [
  { id: 'curto', rotulo: 'CURTO', linha: 'Raspado nas laterais, curto em cima.' },
  { id: 'moicano', rotulo: 'MOICANO', linha: 'Crista alta. Não pede licença.' },
  { id: 'coque', rotulo: 'COQUE', linha: 'Preso atrás, fora do caminho da luta.' },
  { id: 'longo', rotulo: 'LONGO', linha: 'Até os ombros, preso numa mecha por cima.' },
  { id: 'raspado', rotulo: 'RASPADO', linha: 'Máquina zero. Cai a poeira, não o cabelo.' },
  { id: 'franja', rotulo: 'FRANJA', linha: 'Cortina sobre a testa.' },
  { id: 'cacheado', rotulo: 'CACHECADO', linha: 'Volume alto, do jeito que cresce.' },
];

export const ROSTOS: readonly Opcao[] = [
  { id: 'quadrado', rotulo: 'QUADRADO', linha: 'Mandíbula larga. Lê-se de longe.' },
  { id: 'oval', rotulo: 'OVAL', linha: 'Simétrico, sem exagero.' },
  { id: 'angular', rotulo: 'ANGULAR', linha: 'Maçãs do rosto marcadas, queixo afiado.' },
  { id: 'redondo', rotulo: 'REDONDO', linha: 'Cheio, sem aresta.' },
];

export const EXPRESSOES: readonly Opcao[] = [
  { id: 'serio', rotulo: 'SÉRIA', linha: 'O rosto de quem está a caminho.' },
  { id: 'furioso', rotulo: 'FURIOSA', linha: 'Sobrancelha baixa, dente à mostra.' },
  { id: 'sorriso', rotulo: 'SORRISO', linha: 'Canto da boca erguido. Otimismo suspeito.' },
  { id: 'cansado', rotulo: 'CANSADA', linha: 'Olheira e pálpebra caída.' },
  { id: 'grito', rotulo: 'GRITO', linha: 'Boca aberta, mandíbula solta.' },
];

/** Os dentes não têm linha no ecrã: existem para o desenho e para a descrição acessível. */
export const DENTES: readonly Opcao[] = [
  { id: 'normais', rotulo: 'NORMAIS', linha: 'Boca normal. Nada a assinalar.' },
  { id: 'vampiro', rotulo: 'PRESAS', linha: 'Duas presas caninas. Não aparecem em fotografias.' },
];

export const MARCAS: readonly Opcao[] = [
  { id: 'nenhuma', rotulo: 'NENHUMA', linha: 'Pele limpa.' },
  { id: 'cicatriz-olho', rotulo: 'CICATRIZ NO OLHO', linha: 'Um risco sobre o olho direito.' },
  { id: 'cicatriz-boca', rotulo: 'CICATRIZ NA BOCA', linha: 'Corte no canto da boca.' },
  { id: 'tatuagem-braco', rotulo: 'TATUAGEM NO BRAÇO', linha: 'Faixa escura no braço esquerdo.' },
  { id: 'tatuagem-peito', rotulo: 'TATUAGEM NO PEITO', linha: 'Marca larga sobre o peito.' },
  { id: 'pintura', rotulo: 'PINTURA DE GUERRA', linha: 'Duas faixas atravessadas no rosto.' },
];

/**
 * Corpo: **não é só largura** — muda ombro, cintura e altura de quadril, que é o que faz a
 * silhueta ser lida como magra, forte ou pesada antes de qualquer detalhe.
 */
export interface Forma {
  id: string; rotulo: string; linha: string;
  ombro: number; tronco: number; cintura: number; altura: number;
}

export const CORPOS: readonly Forma[] = [
  { id: 'magro', rotulo: 'MAGRO', linha: 'Ombros estreitos, cintura fina. Passa por onde ninguém passa.', ombro: 0.74, tronco: 0.76, cintura: 0.62, altura: 1.02 },
  { id: 'atletico', rotulo: 'ATLÉTICO', linha: 'Proporção de quem corre todos os dias.', ombro: 0.94, tronco: 0.9, cintura: 0.74, altura: 1 },
  { id: 'forte', rotulo: 'FORTE', linha: 'Ombros largos, tronco cheio. Empurra o que precisa.', ombro: 1.08, tronco: 1.02, cintura: 0.84, altura: 0.99 },
  { id: 'maromba', rotulo: 'MAROMBA', linha: 'Exagero de propósito: ombro enorme, cintura estreita.', ombro: 1.24, tronco: 1.12, cintura: 0.78, altura: 0.98 },
  { id: 'gordo', rotulo: 'GORDO', linha: 'Tronco e cintura cheios, ombro arredondado.', ombro: 1.04, tronco: 1.18, cintura: 1.16, altura: 0.99 },
];

export const PERSONAGEM_PADRAO: Personagem = {
  nome: 'HERÓI',
  cabelo: 'curto',
  corCabelo: 'preto',
  rosto: 'quadrado',
  expressao: 'serio',
  marca: 'nenhuma',
  dentes: 'normais',
  corpo: 'atletico',
  pele: 'media',
};

/**
 * **Easter eggs do nome** — o nome é a única coisa que o jogador escreve à mão, por isso é onde
 * ficam as brincadeiras. Cada egg é um `preset`: os campos que ele **toca**, e mais nada (o que
 * não está no preset não é mexido — quem escreve `ALUCARD` não perde o rosto que já tinha).
 *
 * Duas regras sérias:
 *
 * 1. **Não passa por cima do que o jogador mexer depois** — o egg é aplicado quando o nome fica
 *    igual, e o jogador continua livre de mudar o resto (o ecrã não "puxa" os valores de volta).
 * 2. **A comparação ignora maiúsculas e acentos**: `alucard`, `Alucard` e `ALÚCARD` são o mesmo.
 */
export interface EasterEgg {
  nome: string;
  /** Só os campos que este nome muda. */
  preset: Partial<Personagem>;
  aviso: string;
}

export const EASTER_EGGS: readonly EasterEgg[] = [
  {
    nome: 'MACHO',
    preset: {
      cabelo: 'moicano',
      corCabelo: 'azul',
      expressao: 'furioso',
      corpo: 'maromba',
      pele: 'clara',
    },
    aviso: 'ELE JÁ ESTAVA AQUI. (EASTER EGG)',
  },
  {
    /*
     * `Alucard` — cabelo comprido branco, presas de vampiro, corpo magro e pele pálida. O rosto,
     * a marca e a expressão **não** entram: o pedido descreveu quatro coisas, e são essas quatro.
     */
    nome: 'ALUCARD',
    preset: {
      cabelo: 'longo',
      corCabelo: 'branco',
      dentes: 'vampiro',
      corpo: 'magro',
      pele: 'palida',
    },
    aviso: 'ELE NÃO APARECE NO ESPELHO. (EASTER EGG)',
  },
];

/** O primeiro egg (`MACHO`) — mantido com nome próprio porque é o do pedido original. */
export const EASTER_EGG = EASTER_EGGS[0];

/** O egg que este nome dispara, se algum. */
export function easterEggDe(nome: string): EasterEgg | null {
  return EASTER_EGGS.find((e) => mesmoNome(nome, e.nome)) ?? null;
}

export const NOME_MAX = 12;

/** `Macho`, `macho`, `MÁCHO` e `  Macho ` são o mesmo nome. */
export function mesmoNome(a: string, b: string): boolean {
  const limpa = (v: string): string => v
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toUpperCase();
  return limpa(a) === limpa(b);
}

/**
 * Aplica o easter egg do nome (se houver). Devolve **sempre** um personagem e diz se disparou —
 * quem chama decide se mostra o aviso.
 */
export function aplicarEasterEgg(
  p: Personagem,
): { personagem: Personagem; disparou: boolean; egg: EasterEgg | null } {
  const egg = easterEggDe(p.nome);
  if (!egg) return { personagem: p, disparou: false, egg: null };
  return { personagem: { ...p, ...egg.preset }, disparou: true, egg };
}

/**
 * O nome como fica no save: **maiúsculas** (como o resto da interface), sem espaços a mais, com
 * teto, e nunca vazio. Maiúsculas também tornam o easter egg indiferente a como se escreveu.
 */
export function normalizarNome(bruto: unknown): string {
  const s = typeof bruto === 'string' ? bruto.replace(/\s+/g, ' ').trim().toUpperCase() : '';
  const cortado = s.slice(0, NOME_MAX);
  return cortado.length ? cortado : PERSONAGEM_PADRAO.nome;
}

/** `true` enquanto o nome é o de fábrica — é um **espaço vazio com nome dentro**, não texto escrito. */
export function nomeDeFabrica(nome: string): boolean {
  return mesmoNome(nome, PERSONAGEM_PADRAO.nome);
}

/**
 * Uma tecla de texto no campo do nome. Se o nome ainda for o de fábrica (`HERÓI`), a primeira
 * letra **substitui-o** em vez de se colar ao fim: senão quem escreve `Macho` ficava com
 * `HERÓIMACHO` e o easter egg nunca disparava.
 */
export function digitarNome(
  p: Personagem, key: string, apagar = false,
): { personagem: Personagem; disparou: boolean; egg: EasterEgg | null } {
  const base = nomeDeFabrica(p.nome) ? '' : p.nome;
  const nome = apagar ? base.slice(0, -1) : (base + key).slice(0, NOME_MAX);
  return comNome(p, nome);
}

/** Digitar/apagar o nome. O easter egg é avaliado **a cada mudança**, como no pedido. */
export function comNome(
  p: Personagem, nome: string,
): { personagem: Personagem; disparou: boolean; egg: EasterEgg | null } {
  return aplicarEasterEgg({ ...p, nome: normalizarNome(nome) });
}

const TABELAS = {
  cabelo: CABELOS, rosto: ROSTOS, expressao: EXPRESSOES, marca: MARCAS,
  corpo: CORPOS, pele: PELES, corCabelo: CORES_CABELO,
} as const;

export function rotuloGrupo(grupo: Grupo): string {
  switch (grupo) {
    case 'cabelo': return 'CABELO';
    case 'corCabelo': return 'COR DO CABELO';
    case 'rosto': return 'ROSTO';
    case 'expressao': return 'EXPRESSÃO';
    case 'marca': return 'TATUAGEM / CICATRIZ';
    case 'corpo': return 'CORPO';
    case 'pele': return 'TOM DE PELE';
    default: return grupo;
  }
}

export function opcoesDe(grupo: Grupo): readonly Opcao[] {
  return TABELAS[grupo];
}

export function rotuloValor(grupo: Grupo, personagem: Personagem): string {
  const id = personagem[grupo];
  return TABELAS[grupo].find((o) => o.id === id)?.rotulo ?? String(id).toUpperCase();
}

export function linhaDe(grupo: Grupo, personagem: Personagem): string {
  const id = personagem[grupo];
  return TABELAS[grupo].find((o) => o.id === id)?.linha ?? '';
}

/** `true` quando o herói tem presas — o desenho e a descrição perguntam os dois por isto. */
export function temPresas(personagem: Personagem): boolean {
  return personagem.dentes === 'vampiro';
}

export function tomPele(personagem: Personagem): Tom {
  return PELES.find((t) => t.id === personagem.pele) ?? PELES[1];
}

export function tomCabelo(personagem: Personagem): Tom {
  return CORES_CABELO.find((t) => t.id === personagem.corCabelo) ?? CORES_CABELO[0];
}

export function formaCorpo(personagem: Personagem): Forma {
  return CORPOS.find((c) => c.id === personagem.corpo) ?? CORPOS[1];
}

/** Passa para o valor seguinte (ou anterior) de um grupo, dando a volta. */
export function ciclar(
  personagem: Personagem, grupo: Grupo, passo: number,
): Personagem {
  const lista = opcoesDe(grupo);
  const i = Math.max(0, lista.findIndex((o) => o.id === personagem[grupo]));
  const proximo = lista[(i + passo + lista.length) % lista.length];
  return { ...personagem, [grupo]: proximo.id } as Personagem;
}

function daLista<T extends string>(lista: readonly { id: string }[], valor: unknown, padrao: T): T {
  return (lista.some((o) => o.id === valor) ? valor : padrao) as T;
}

/** **A fronteira**: depois desta função, todos os campos existem e são válidos. */
export function normalizarPersonagem(bruto: unknown): Personagem {
  const b = (typeof bruto === 'object' && bruto !== null ? bruto : {}) as Partial<Personagem>;
  return {
    nome: normalizarNome(b.nome),
    cabelo: daLista(CABELOS, b.cabelo, PERSONAGEM_PADRAO.cabelo),
    corCabelo: daLista(CORES_CABELO, b.corCabelo, PERSONAGEM_PADRAO.corCabelo),
    rosto: daLista(ROSTOS, b.rosto, PERSONAGEM_PADRAO.rosto),
    expressao: daLista(EXPRESSOES, b.expressao, PERSONAGEM_PADRAO.expressao),
    marca: daLista(MARCAS, b.marca, PERSONAGEM_PADRAO.marca),
    dentes: daLista(DENTES, b.dentes, PERSONAGEM_PADRAO.dentes),
    corpo: daLista(CORPOS, b.corpo, PERSONAGEM_PADRAO.corpo),
    pele: daLista(PELES, b.pele, PERSONAGEM_PADRAO.pele),
  };
}

/**
 * A descrição que o leitor de ecrã ouve e que o save mostra — em texto, não em `id`. Sem ela, a
 * prévia seria uma imagem sem nome (`§4.6`) e o `CONTINUAR` não diria de quem é a partida.
 */
export function descreverPersonagem(p: Personagem): string {
  return [
    p.nome,
    `cabelo ${rotuloValor('cabelo', p).toLowerCase()} ${rotuloValor('corCabelo', p).toLowerCase()}`,
    `rosto ${rotuloValor('rosto', p).toLowerCase()}`,
    `expressão ${rotuloValor('expressao', p).toLowerCase()}`,
    rotuloValor('marca', p) === 'NENHUMA' ? 'sem marcas' : rotuloValor('marca', p).toLowerCase(),
    ...(temPresas(p) ? ['presas de vampiro'] : []),
    `corpo ${rotuloValor('corpo', p).toLowerCase()}`,
    `pele ${rotuloValor('pele', p).toLowerCase()}`,
  ].join(' · ');
}

/** Sorteio uniforme — o botão `ALEATÓRIO` do ecrã. Existe para quem não quer decidir sete campos. */
export function personagemAleatorio(sorteio: () => number = Math.random): Personagem {
  const escolhe = <T extends string>(lista: readonly { id: string }[], atual: T): T => {
    const i = Math.min(lista.length - 1, Math.floor(sorteio() * lista.length));
    const id = lista[i].id as T;
    // nunca "sorteia" o mesmo valor duas vezes seguidas: parece que o botão não funcionou
    return id === atual && lista.length > 1
      ? (lista[(i + 1) % lista.length].id as T)
      : id;
  };
  return {
    // o sorteio **não** toca no nome: é a única coisa que o jogador escreveu com as próprias mãos
    nome: PERSONAGEM_PADRAO.nome,
    cabelo: escolhe(CABELOS, PERSONAGEM_PADRAO.cabelo),
    corCabelo: escolhe(CORES_CABELO, PERSONAGEM_PADRAO.corCabelo),
    rosto: escolhe(ROSTOS, PERSONAGEM_PADRAO.rosto),
    expressao: escolhe(EXPRESSOES, PERSONAGEM_PADRAO.expressao),
    marca: escolhe(MARCAS, PERSONAGEM_PADRAO.marca),
    // as presas não se sorteiam: são do easter egg, e um herói sorteado com presas seria só estranho
    dentes: PERSONAGEM_PADRAO.dentes,
    corpo: escolhe(CORPOS, PERSONAGEM_PADRAO.corpo),
    pele: escolhe(PELES, PERSONAGEM_PADRAO.pele),
  };
}
