/**
 * **`ENT-010` / `ENT-011` — os arquétipos em corpo de Phaser.**
 *
 * `Sentinel.ts` era a única criatura comum e é, agora, uma das três. Este ficheiro desenha as
 * outras duas **sem duplicar comportamento**: o ciclo de vida (patrulha → aviso → ataque →
 * recuperação) é o mesmo `passoComum` de `core/arquetipos.ts` para todas, e o que muda é o
 * arquétipo que lhe é passado. Se um dia houver um quarto arquétipo, ele entra em `core/` e não
 * aqui — aqui só se desenham corpos.
 *
 * A separação é a mesma do chefe (`DEC-021`): a decisão é pura e testável, a cena só executa.
 */
import Phaser from 'phaser';
import { TILE } from '../data/tuning';
import { PAL } from '../data/palette';
import {
  duracaoAtaque, golpear, passoComum, resolverVariante,
  type ArquetipoId, type CorpoComum,
} from '../../core/arquetipos';

/** O que qualquer inimigo comum tem de saber fazer para a cena o tratar por igual. */
export interface CorpoComumCena {
  readonly arquetipo: ArquetipoId;
  readonly alive: boolean;
  readonly dangerous: boolean;
  readonly dano: number;
  hit(dano: number): void;
}

/**
 * Corpo genérico: um sprite de física que corre `passoComum` uma vez por frame e traduz o estado
 * puro para o que o Phaser sabe fazer (velocidade, tinta de aviso, gravidade).
 *
 * A gravidade **é do arquétipo**: quem voa não tem nenhuma. Isto está aqui e não no `tuning.ts`
 * porque não é balanceamento — é a diferença entre andar e voar.
 */
export class Comum extends Phaser.Physics.Arcade.Sprite implements CorpoComumCena {
  readonly arquetipo: ArquetipoId;
  readonly dano: number;
  /** A variante do setor, já resolvida: vida, tempos e velocidade. */
  readonly spec: ReturnType<typeof resolverSpec>;
  hp: number;
  onDeath?: () => void;
  /** A direção do corpo, escrita pelo `passoComum` a cada frame (a cena lê, não decide). */
  facing: 1 | -1 = -1;

  private puro: CorpoComum;
  private minX: number;
  private maxX: number;
  private minY: number;
  private maxY: number;
  /** `true` quando o ataque já disparou o projétil — para não disparar dois por ataque. */
  private jaDisparou = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    facing: 1 | -1,
    variante: string,
    /** Alcance do vaivém em tiles (a sala decide; o arquétipo diz como). */
    patrolTiles = 3,
  ) {
    const spec = resolverSpec(variante);
    super(scene, x, y, texturaDe(spec.id));
    this.arquetipo = spec.id;
    this.spec = spec;
    this.dano = spec.dano;
    this.hp = spec.hp;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(18);

    const voa = spec.id === 'voador';
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(!voa);
    body.setSize(spec.corpo.width, spec.corpo.height);
    body.setOffset((this.width - spec.corpo.width) / 2, this.height - spec.corpo.height);
    body.setMaxVelocityY(voa ? 400 : 900);

    this.minX = x - patrolTiles * TILE * 0.5;
    this.maxX = x + patrolTiles * TILE * 0.5;
    this.minY = voa ? y - TILE * 2 : y;
    this.maxY = voa ? y + TILE * 1.5 : y;

    this.puro = {
      x, y, vx: 0, vy: 0, facing, estado: 'patrulha', ate: 0, hp: spec.hp, morto: false,
    };
    this.setFlipX(facing === 1);
  }

  get alive(): boolean { return this.puro.estado !== 'morto'; }
  get dangerous(): boolean { return this.puro.estado === 'ataque'; }

  hit(dano: number): void {
    if (!this.alive) return;
    const { corpo, matou } = golpear(this.puro, dano);
    this.puro = corpo;
    this.hp = corpo.hp;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => { if (this.active) this.clearTint(); });
    if (matou) this.morrer();
  }

  private morrer(): void {
    this.onDeath?.();
    (this.body as Phaser.Physics.Arcade.Body).setEnable(false);
    this.scene.tweens.add({
      targets: this, alpha: 0, y: this.y + 10, duration: 260,
      onComplete: () => this.destroy(),
    });
  }

  update(time: number, player: Phaser.GameObjects.Sprite): void {
    if (!this.alive) return;
    const antes = this.puro.estado;
    this.puro = passoComum(this.puro, this.spec, {
      jogadorX: player.x,
      jogadorY: player.y - 40,
      minX: this.minX, maxX: this.maxX, minY: this.minY, maxY: this.maxY,
      agora: time, deltaMs: Math.min(32, this.scene.game.loop.delta || 16),
    });

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(this.puro.vx, this.puro.vy);
    this.facing = this.puro.facing;
    this.setFlipX(this.puro.facing === 1);

    // o aviso: tinta de ameaça enquanto o telegrafo corre (o corpo já não se mexe)
    if (this.puro.estado === 'telegrafo') this.setTint(PAL.threat);
    else if (antes === 'telegrafo') this.clearTint();

    if (this.puro.estado !== 'ataque') this.jaDisparou = false;
  }

  /** Consumido pela cena: `true` **uma vez** por ataque de quem atira. */
  deveAtirar(): boolean {
    if (this.spec.ataque !== 'projetil') return false;
    if (this.puro.estado !== 'ataque' || this.jaDisparou) return false;
    this.jaDisparou = true;
    return true;
  }

  /** O que sai do corpo: a direção é a do aviso, nunca a da posição atual (a leitura é honesta). */
  direcaoDoTiro(): { x: number; y: number } {
    return { x: this.puro.facing, y: 0 };
  }

  /** Duração do ataque em ms — a cena usa para agendar o fim da janela perigosa. */
  get duracaoAtaque(): number { return duracaoAtaque(this.spec); }

  get estado(): string { return this.puro.estado; }
}

/** O corpo é o mesmo para todas — regra 3 do ficheiro de arquétipos, e a razão de estar aqui. */
const CORPO = { width: 44, height: 78 } as const;

/**
 * Resolve a variante do setor (vida, dano, telegrafo, velocidade) e acrescenta-lhe o corpo.
 * Se o nome não existir, cai na Sentinela do tutorial em vez de rebentar: uma sala mal escrita
 * aparece como o inimigo de sempre, e o `arquetipos.test.ts` já reprova a variante inexistente.
 */
function resolverSpec(variante: string) {
  const v = resolverVariante(variante) ?? resolverVariante('L01-sentinela')!;
  return { ...v, corpo: CORPO };
}

function texturaDe(id: ArquetipoId): string {
  switch (id) {
    case 'atirador': return 'enemy_shooter';
    case 'voador': return 'enemy_flyer';
    default: return 'sentinel';
  }
}
