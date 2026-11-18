/**
 * Registro de áreas do build. `PAT-C-10`: o que não está aqui não entra no jogo.
 *
 * **Os dezesseis setores estão na progressão** (`DEC-047`). O recorte do MVP — que parava em
 * LVL-03 — foi jogado até ao fim e o dono pediu o resto; a progressão deixou de ser uma lista
 * condicionada por flags e passou a ser a lista, por ordem. `PAT-C-10` continua a valer para o que
 * ainda não existe: o que não está em `AREAS` não entra no jogo.
 */
import type { Room } from './lvl01';
import { LVL01 } from './lvl01';
import { LVL02 } from './lvl02';
import { LVL03 } from './lvl03';
import { LVL04 } from './lvl04';
import { LVL05 } from './lvl05';
import { LVL06 } from './lvl06';
import { LVL07 } from './lvl07';
import { LVL08 } from './lvl08';
import { LVL09 } from './lvl09';
import { LVL10 } from './lvl10';
import { LVL11 } from './lvl11';
import { LVL12 } from './lvl12';
import { LVL13 } from './lvl13';
import { LVL14 } from './lvl14';
import { LVL15 } from './lvl15';
import { LVL16 } from './lvl16';

export interface Area {
  readonly id: string;
  readonly name: string;
  readonly rooms: readonly Room[];
  /** CEN-001 é estático em LVL-01 e **cíclico** em LVL-02 (§6 do documento do setor). */
  readonly spikesCyclic: boolean;
  /** Só LVL-02 tem porta de senha (`MEC-006`). */
  readonly hasPasswordDoor: boolean;
}

export const AREAS: Readonly<Record<string, Area>> = {
  'LVL-01': { id: 'LVL-01', name: 'Ruínas da Vigília', rooms: LVL01, spikesCyclic: false, hasPasswordDoor: false },
  'LVL-02': { id: 'LVL-02', name: 'Galeria Partida', rooms: LVL02, spikesCyclic: true, hasPasswordDoor: true },
  'LVL-03': { id: 'LVL-03', name: 'Portão do Guardião', rooms: LVL03, spikesCyclic: false, hasPasswordDoor: false },
  'LVL-04': { id: 'LVL-04', name: 'Bosque das Cinzas', rooms: LVL04, spikesCyclic: false, hasPasswordDoor: false },
  'LVL-05': { id: 'LVL-05', name: 'Cripta das Engrenagens', rooms: LVL05, spikesCyclic: false, hasPasswordDoor: false },
  // `LVL-06` tem estacas **cíclicas** de 1,2 s (`LVL-06.md` §3)
  'LVL-06': { id: 'LVL-06', name: 'Mina Esquecida', rooms: LVL06, spikesCyclic: true, hasPasswordDoor: false },
  // `LVL-07` tem lascas **cíclicas** só em L07-02 (`LVL-07.md` §3)
  'LVL-07': { id: 'LVL-07', name: 'Catedral Oca', rooms: LVL07, spikesCyclic: true, hasPasswordDoor: false },
  // `LVL-08` não tem `A` na grade: as lascas de osso eram da catedral
  'LVL-08': { id: 'LVL-08', name: 'Pátio Rubro', rooms: LVL08, spikesCyclic: false, hasPasswordDoor: false },
  // `LVL-09` não tem `A` nem `=`: zero plataformas e zero armadilhas no setor inteiro (`LVL-09` §5)
  'LVL-09': { id: 'LVL-09', name: 'Canais Sombrios', rooms: LVL09, spikesCyclic: false, hasPasswordDoor: false },
  // `LVL-10` é o **hub**: zero plataformas, alçapão no teto (`DEC-015`) e quarto seguro (`BGM-03`)
  'LVL-10': { id: 'LVL-10', name: 'Torre da Vigília', rooms: LVL10, spikesCyclic: false, hasPasswordDoor: false },
  // `LVL-11` é o único setor que **não mata** (`DEC-011`): zero armadilha, zero plataforma, zero argola
  'LVL-11': { id: 'LVL-11', name: 'Jardim Profanado', rooms: LVL11, spikesCyclic: false, hasPasswordDoor: false },
  // `LVL-12` cobra o kit inteiro e **não dá nada** (`LVL-12` §1): zero plataforma, zero vão,
  // zero alçapão — a forja é sólida e o perigo é fogo e metal (`DEC-011`)
  'LVL-12': { id: 'LVL-12', name: 'Forja Distorcida', rooms: LVL12, spikesCyclic: false, hasPasswordDoor: false },
  // `LVL-13` fecha o Ato III e é o único setor **sem material próprio**: vazio e vento.
  // Zero plataformas, zero vãos, zero armadilhas e `lethal_falls = false` (§1, §10)
  'LVL-13': { id: 'LVL-13', name: 'Abismo do Eco', rooms: LVL13, spikesCyclic: false, hasPasswordDoor: false },
  // `LVL-14` abre o Ato IV: zero plataforma pelo sexto setor seguido, o único chefe que não
  // anda (`mobile: false`) e o portão de **duas** fechaduras para `keys >= 2` (`DEC-016`)
  'LVL-14': { id: 'LVL-14', name: 'Fortaleza do Eclipse', rooms: LVL14, spikesCyclic: false, hasPasswordDoor: false },
  // `LVL-15` é o setor do silêncio: **um chefe, dois corpos** (`ENT-007`), `BGM-03` na arena
  // e nenhum `SFX` ambiente (`AMB-15` = nada). Zero plataforma pelo sétimo setor seguido.
  'LVL-15': { id: 'LVL-15', name: 'Ante-sala do Fim', rooms: LVL15, spikesCyclic: false, hasPasswordDoor: false },
  // `LVL-16` é o **último setor do jogo**: zero plataforma pelo oitavo setor seguido, zero
  // armadilha, um chefe **sem vida** (`ENT-008`, postura e baixas) e nenhuma saída em L16-06.
  // `bgm='none'` nos corredores, `BGM-02` só na arena e `BGM-04` só de L16-05 ao fim.
  'LVL-16': { id: 'LVL-16', name: 'Trono do Caos', rooms: LVL16, spikesCyclic: false, hasPasswordDoor: false },
};

/**
 * `DEC-047` — **a progressão**: os dezesseis setores, por ordem, sem interruptores.
 *
 * Uma lista literal de propósito. Enquanto era `...(FLAGS.lvlXX ? [...] : [])`, a ordem do jogo
 * dependia de treze booleanos que ninguém lia; um erro de digitação numa delas desaparecia um
 * setor do mapa e não aparecia em teste nenhum. Aqui, a ordem é o que se lê.
 */
export const AREA_ORDER: readonly string[] = [
  'LVL-01', 'LVL-02', 'LVL-03', 'LVL-04', 'LVL-05', 'LVL-06', 'LVL-07', 'LVL-08',
  'LVL-09', 'LVL-10', 'LVL-11', 'LVL-12', 'LVL-13', 'LVL-14', 'LVL-15', 'LVL-16',
];

/** Próxima área do build, ou `null` quando a campanha acaba (fim de LVL-16). */
export function nextArea(id: string): Area | null {
  const i = AREA_ORDER.indexOf(id);
  const next = i >= 0 ? AREA_ORDER[i + 1] : undefined;
  return next ? AREAS[next] ?? null : null;
}

export type { Room };
