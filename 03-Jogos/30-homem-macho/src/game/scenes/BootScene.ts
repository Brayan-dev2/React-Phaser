/** Boot — gera as texturas placeholder em código (sem pipeline de arte ainda, P-16). */
import Phaser from 'phaser';
import { PAL } from '../data/palette';
import { makeFortaleza } from './fortaleza';
import { makeAntesala } from './antesala';
import { makeTrono } from './trono';
import { makePlayer } from './personagem';
import { peekPendingStart } from '../../services/start';
import { normalizarPersonagem } from '../../services/character';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create(): void {
    /*
     * `UI-12`: o herói é desenhado a partir da **escolha do jogador** — a intenção de partida já
     * está posta quando este `Boot` corre (o menu escolhe primeiro, o jogo monta depois). Sem
     * intenção (`?skip=menu` no E2E, recarregar a página), vale o personagem padrão.
     */
    const personagem = normalizarPersonagem(peekPendingStart()?.personagem);
    this.makeStone();
    this.makeActors();
    makePlayer(this, personagem, (k, w, h, d) => this.tex(k, w, h, d));
    this.makeProps();
    this.makeForge();
    this.makeAbyss();
    makeFortaleza(this, (k, w, h, d) => this.tex(k, w, h, d));
    makeAntesala(this, (k, w, h, d) => this.tex(k, w, h, d));
    makeTrono(this, (k, w, h, d) => this.tex(k, w, h, d));
    this.scene.start('Preload');
  }

  private tex(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makeStone(): void {
    this.tex('stone', 64, 64, (g) => {
      g.fillStyle(PAL.stone, 1); g.fillRect(0, 0, 64, 64);
      g.fillStyle(PAL.mass, 1); g.fillRect(0, 52, 64, 12);
      g.fillStyle(PAL.ink, 0.35); g.fillRect(0, 0, 64, 3); g.fillRect(0, 0, 3, 64);
    });
    this.tex('stone_top', 64, 64, (g) => {
      g.fillStyle(PAL.stone, 1); g.fillRect(0, 0, 64, 64);
      g.fillStyle(PAL.mass, 1); g.fillRect(0, 52, 64, 12);
      g.fillStyle(PAL.bone, 0.22); g.fillRect(0, 0, 64, 5);
      g.fillStyle(PAL.ink, 0.35); g.fillRect(0, 0, 3, 64);
    });
    this.tex('platform', 64, 22, (g) => {
      g.fillStyle(PAL.bone, 0.9); g.fillRect(0, 0, 64, 6);
      g.fillStyle(PAL.stone, 1); g.fillRect(0, 6, 64, 16);
      g.fillStyle(PAL.ink, 0.5); g.fillRect(0, 20, 64, 2);
    });
  }

  private makeActors(): void {
    this.tex('sentinel', 48, 80, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(2, 2, 44, 76);
      g.fillStyle(PAL.mass, 1); g.fillRect(5, 5, 38, 70);
      g.fillStyle(PAL.threat, 1); g.fillRect(28, 26, 12, 10);    // olho de ameaça
      g.fillStyle(PAL.ink, 1); g.fillRect(32, 29, 5, 5);
      g.fillStyle(PAL.stone, 1); g.fillRect(5, 66, 38, 9);
    });
    /*
     * `ENT-010` o atirador e `ENT-011` o voador (`DEC-048`) — **procedurais como o resto**
     * (`P-16`: a arte final é do dono). O que os distingue é o que o jogador tem de ler no corpo:
     * o atirador é **largo e baixo**, com o tubo apontado, porque não persegue; o voador é
     * **alto e fino**, com asas, porque passa por cima. Nenhum deles é um `sentinel` repintado:
     * a silhueta é a informação.
     */
    this.tex('enemy_shooter', 56, 72, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(2, 20, 52, 50);
      g.fillStyle(PAL.mass, 1); g.fillRect(6, 24, 44, 42);
      g.fillStyle(PAL.stone, 1); g.fillRect(6, 58, 44, 8);        // base
      g.fillStyle(PAL.threat, 1); g.fillRect(30, 32, 10, 8);      // olho
      g.fillStyle(PAL.ink, 1); g.fillRect(34, 34, 4, 4);
      g.fillStyle(PAL.stone, 1); g.fillRect(44, 38, 12, 8);       // tubo apontado à direita
      g.fillStyle(PAL.threat, 0.5); g.fillRect(56, 40, 0, 0);
    });
    this.tex('enemy_flyer', 44, 56, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(10, 8, 24, 40);
      g.fillStyle(PAL.mass, 1); g.fillRect(13, 11, 18, 34);
      g.fillStyle(PAL.stone, 0.85); g.fillRect(0, 12, 12, 10);    // asa esquerda
      g.fillStyle(PAL.stone, 0.85); g.fillRect(32, 12, 12, 10);   // asa direita
      g.fillStyle(PAL.threat, 1); g.fillRect(18, 20, 8, 8);       // olho
      g.fillStyle(PAL.ink, 1); g.fillRect(21, 23, 4, 4);
    });
    // ENT-003 — sprite 192×192 (3×3 tiles); a hurtbox de 160×176 é menor (anti-hitbox)
    this.tex('boss', 192, 192, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRoundedRect(14, 10, 164, 180, 10);
      g.fillStyle(PAL.mass, 1); g.fillRoundedRect(20, 16, 152, 168, 8);
      g.fillStyle(PAL.stone, 1); g.fillRect(30, 34, 132, 30);          // ombros
      g.fillStyle(PAL.ink, 1); g.fillRect(44, 70, 104, 64);            // tronco
      g.fillStyle(PAL.threat, 1); g.fillRect(62, 44, 28, 14);          // olho esquerdo
      g.fillStyle(PAL.threat, 1); g.fillRect(102, 44, 28, 14);         // olho direito
      g.fillStyle(PAL.ink, 1); g.fillRect(70, 48, 12, 6); g.fillRect(110, 48, 12, 6);
      g.fillStyle(PAL.accent01, 1); g.fillRect(44, 132, 104, 8);       // cinto rito
      g.fillStyle(PAL.stone, 1); g.fillRect(46, 140, 30, 40); g.fillRect(116, 140, 30, 40);
      g.fillStyle(PAL.ink, 1); g.fillRect(42, 176, 38, 8); g.fillRect(112, 176, 38, 8);
    });
    // CEN-021 — pilar de 2×2 tiles: capitel, fuste estreito e base, rachado
    this.tex('pillar', 128, 128, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(8, 0, 112, 128);
      g.fillStyle(PAL.stone, 1); g.fillRect(12, 4, 104, 120);
      // capitel
      g.fillStyle(PAL.mass, 1); g.fillRect(12, 4, 104, 18);
      g.fillStyle(PAL.bone, 0.22); g.fillRect(12, 4, 104, 4);
      // fuste (escuro, para o pilar não virar um bloco chapado)
      g.fillStyle(PAL.ink, 1); g.fillRect(32, 22, 64, 88);
      g.fillStyle(PAL.stone, 0.55); g.fillRect(40, 26, 10, 80);
      g.fillStyle(PAL.ink, 0.8); g.fillRect(32, 22, 6, 88); g.fillRect(90, 22, 6, 88);
      // rachaduras
      g.fillStyle(PAL.ink, 0.9);
      g.fillRect(52, 30, 4, 34); g.fillRect(52, 64, 26, 4); g.fillRect(74, 64, 4, 30);
      // base
      g.fillStyle(PAL.mass, 1); g.fillRect(12, 110, 104, 14);
      g.fillStyle(PAL.ink, 1); g.fillRect(12, 124, 104, 4);
    });
    // CEN-020 — estandarte rasgado
    this.tex('banner', 40, 120, (g) => {
      g.fillStyle(PAL.ink, 0.9); g.fillRect(4, 0, 32, 120);
      g.fillStyle(PAL.threat, 0.9); g.fillRect(7, 6, 26, 78);
      g.fillStyle(PAL.ink, 1); g.fillTriangle(7, 84, 20, 104, 33, 84);  // rasgo
      g.fillStyle(PAL.accent01, 1); g.fillRect(16, 16, 8, 22);          // sinete
    });
    // CEN-030 — árvore morta de 4 tiles, sem copa (LVL-04 §3: fica em decor-back)
    this.tex('tree', 96, 256, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(38, 40, 20, 216);           // tronco
      g.fillStyle(PAL.mass, 1); g.fillRect(42, 44, 12, 208);
      g.fillStyle(PAL.ink, 1);
      g.fillRect(20, 86, 22, 8); g.fillRect(56, 60, 22, 8);           // galhos secos
      g.fillRect(14, 120, 26, 6); g.fillRect(58, 132, 26, 6);
      g.fillRect(26, 40, 6, 40); g.fillRect(66, 26, 6, 44);
      g.fillStyle(PAL.stone, 0.5); g.fillRect(42, 44, 3, 208);        // aresta de luz
      g.fillStyle(PAL.ink, 1); g.fillRect(30, 240, 36, 16);           // base
    });
    // CEN-034 — grade do sumidouro de cinza
    this.tex('sink_grate', 64, 40, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 64, 40);
      g.fillStyle(PAL.stone, 1); g.fillRect(4, 4, 56, 32);
      g.fillStyle(PAL.ink, 1);
      for (let i = 0; i < 4; i++) g.fillRect(8 + i * 13, 6, 5, 28);   // barras
      g.fillStyle(PAL.mass, 1); g.fillRect(4, 4, 56, 4);
    });
    // HAB-05 Força (ITM-005) — punho de bronze, PAL-05
    this.tex('item_strength', 32, 34, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(2, 2, 28, 30);
      g.fillStyle(0xc98a3e, 1); g.fillRect(6, 6, 20, 22);          // bronze (PAL-05)
      g.fillStyle(PAL.ink, 1); g.fillRect(10, 10, 12, 6); g.fillRect(14, 16, 4, 8);
      g.fillStyle(0xf2c66d, 0.9); g.fillRect(6, 6, 20, 3);
    });
    // B — bloco pesado (`LVL-05` §5): 1 tile, bronze e graxa
    this.tex('block', 64, 64, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x6b4a26, 1); g.fillRect(4, 4, 56, 56);
      g.fillStyle(0xc98a3e, 1); g.fillRect(8, 8, 48, 48);
      g.fillStyle(PAL.ink, 1); g.fillRect(16, 16, 32, 32);
      g.fillStyle(0x8d6a3f, 1); g.fillRect(20, 20, 24, 24);
      g.fillStyle(PAL.ink, 0.8); g.fillRect(8, 44, 48, 4);
    });
    // C — placa de contrapeso (`CEN-043`)
    this.tex('plate', 64, 20, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 64, 20);
      g.fillStyle(0xc98a3e, 1); g.fillRect(4, 4, 56, 12);
      g.fillStyle(0x6b4a26, 1); g.fillRect(8, 8, 48, 4);
    });
    // U — elevador de engrenagem (`requires=HAB-05`)
    this.tex('elevator', 96, 96, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 96, 96);
      g.fillStyle(0x3a2a1a, 1); g.fillRect(8, 8, 80, 88);
      g.fillStyle(0xc98a3e, 1); g.fillRect(16, 16, 64, 64);      // gaiola
      g.fillStyle(0x6b4a26, 1); g.fillRect(24, 24, 48, 48);
      g.fillStyle(PAL.ink, 1);
      for (let i = 0; i < 4; i++) g.fillRect(16, 20 + i * 16, 64, 4);   // grades
      g.fillStyle(PAL.threat, 1); g.fillRect(44, 8, 8, 8);              // luz de trava
    });
    // ITM-006 Fôlego (HAB-06) — bolha de cristal, PAL-06
    this.tex('item_breath', 32, 34, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(2, 2, 28, 30);
      g.fillStyle(0x8c7bc7, 1); g.fillCircle(16, 17, 11);          // cristal violeta (PAL-06)
      g.fillStyle(0xd7cdf0, 0.9); g.fillCircle(13, 14, 4);
      g.fillStyle(PAL.ink, 1); g.fillCircle(16, 17, 3);
    });
    // CEN-050 — cristal luminoso (decor-back, a única luz do setor)
    this.tex('crystal', 72, 96, (g) => {
      g.fillStyle(0x2a2340, 0.9); g.fillEllipse(36, 90, 56, 14);
      g.fillStyle(0x8c7bc7, 1); g.fillTriangle(36, 6, 18, 70, 54, 70);
      g.fillStyle(0xb9a9e8, 0.95); g.fillTriangle(36, 14, 26, 62, 46, 62);
      g.fillStyle(0xe8e2ff, 0.8); g.fillTriangle(36, 22, 31, 52, 41, 52);
      g.fillStyle(0x8c7bc7, 0.5); g.fillRect(20, 70, 32, 6);
    });
    // CEN-040 — engrenagem gigante (decor-back, sem colisão)
    this.tex('gear', 160, 160, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillCircle(80, 80, 78);
      g.fillStyle(0x6b4a26, 1); g.fillCircle(80, 80, 70);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        g.fillStyle(PAL.ink, 1);
        g.fillRect(80 + Math.cos(a) * 66 - 7, 80 + Math.sin(a) * 66 - 7, 14, 14);  // dentes
      }
      g.fillStyle(0x3a2a1a, 1); g.fillCircle(80, 80, 34);          // cubo
      g.fillStyle(0xc98a3e, 1); g.fillCircle(80, 80, 12);
      g.fillStyle(0x6b4a26, 0.9); g.fillRect(70, 40, 20, 10);      // óleo
    });
    // CEN-041 — poço de óleo no chão (sem dano)
    this.tex('oil', 72, 16, (g) => {
      g.fillStyle(0x1d1a24, 1); g.fillEllipse(36, 8, 68, 14);
      g.fillStyle(0x2f2a38, 0.9); g.fillEllipse(30, 7, 34, 7);
      g.fillStyle(0xc98a3e, 0.25); g.fillEllipse(44, 9, 16, 4);
    });
    // ITM-004 — equipamento de teste (drop do chefe)
    this.tex('item_trophy', 32, 34, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(2, 2, 28, 30);
      g.fillStyle(PAL.stone, 1); g.fillRect(6, 6, 20, 22);
      g.fillStyle(PAL.accent01, 1); g.fillRect(12, 10, 8, 12);
      g.fillStyle(PAL.ink, 1); g.fillRect(14, 14, 4, 4);
    });
    /*
     * O tiro do `ENT-010` (`DEC-048`). É **vermelho-ameaça e comprido**, de propósito: o do
     * jogador é pequeno e claro, e um tiro que se confunde com o do jogador é um tiro injusto.
     */
    this.tex('proj_enemy', 18, 6, (g) => {
      g.fillStyle(PAL.threat, 1); g.fillRect(0, 1, 18, 4);
      g.fillStyle(PAL.bone, 0.8); g.fillRect(0, 2, 6, 2);
    });
    this.tex('spark', 14, 14, (g) => {
      g.fillStyle(PAL.gold, 1); g.fillCircle(7, 7, 6);
      g.fillStyle(PAL.ink, 1); g.fillCircle(7, 7, 2);
    });
  }

  private makeProps(): void {
    this.tex('spike', 64, 30, (g) => {
      g.fillStyle(PAL.threat, 1);
      for (let i = 0; i < 4; i++) g.fillTriangle(i * 16, 30, i * 16 + 8, 2, i * 16 + 16, 30);
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 28, 64, 2);
    });
    this.tex('save', 44, 62, (g) => {
      g.fillStyle(PAL.stone, 1); g.fillRect(4, 18, 36, 44);
      g.fillStyle(PAL.accent01, 1); g.fillRect(10, 6, 24, 16);
      g.fillStyle(PAL.ink, 1); g.fillRect(10, 6, 24, 3);
      g.fillStyle(PAL.bone, 0.85); g.fillRect(18, 26, 8, 26);
      g.fillStyle(PAL.ink, 0.4); g.fillRect(4, 58, 36, 4);
    });
    // `UI-07` — o baú da sala segura: baixo, largo e com a fechadura ao centro. Fica ao lado do
    // pilar de salvamento e é o alvo de `E` quando o herói está mais perto dele do que do pilar.
    this.tex('chest', 56, 40, (g) => {
      g.fillStyle(PAL.ink, 0.5); g.fillRect(2, 36, 52, 4);
      g.fillStyle(PAL.mass, 1); g.fillRect(2, 12, 52, 24);
      g.fillStyle(PAL.stone, 1); g.fillRect(2, 8, 52, 8);
      g.fillStyle(PAL.accent01, 1); g.fillRect(2, 14, 52, 3);
      g.fillStyle(PAL.ink, 1); g.fillRect(2, 8, 52, 2); g.fillRect(2, 34, 52, 2);
      // fechadura
      g.fillStyle(PAL.accent01, 1); g.fillRect(25, 16, 6, 9);
      g.fillStyle(PAL.ink, 1); g.fillRect(27, 19, 2, 4);
    });
    // `MEC-004` — a bolsa da morte: um saco no chão, com o nó no topo. Tem de se ler como
    // "apanha-me" à distância e não se confundir com o baú (que é baixo, largo e tem fechadura).
    this.tex('death_bag', 30, 26, (g) => {
      g.fillStyle(PAL.ink, 0.5); g.fillEllipse(15, 24, 28, 6);
      g.fillStyle(PAL.threat, 0.95); g.fillEllipse(15, 16, 22, 16);
      g.fillStyle(PAL.threat, 1); g.fillRect(6, 12, 18, 8);
      g.fillStyle(PAL.ink, 0.35); g.fillRect(10, 18, 10, 5);
      // nó
      g.fillStyle(PAL.bone, 0.9); g.fillRect(12, 6, 6, 5);
      g.fillStyle(PAL.bone, 0.9); g.fillRect(8, 8, 4, 3); g.fillRect(18, 8, 4, 3);
    });
    this.tex('door', 64, 192, (g) => {
      g.fillStyle(PAL.accent01, 1); g.fillRect(0, 0, 64, 192);
      g.fillStyle(PAL.ink, 1); g.fillRect(6, 8, 52, 184);
      g.fillStyle(PAL.accent01, 0.85); g.fillRect(12, 16, 40, 176);
      g.fillStyle(PAL.ink, 1); g.fillRect(30, 92, 6, 22);
    });
    // MEC-006 — porta de senha: 4 glifos gravados, apagados até a senha abrir
    this.tex('door_password', 64, 192, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 64, 192);
      g.fillStyle(PAL.stone, 1); g.fillRect(4, 4, 56, 184);
      g.fillStyle(PAL.mass, 1); g.fillRect(8, 8, 48, 176);
      const glyphs: Array<(cx: number, cy: number) => void> = [
        // mão aberta
        (cx, cy) => { g.fillStyle(PAL.bone, 0.85); g.fillRect(cx - 9, cy - 2, 18, 10); for (let i = 0; i < 4; i++) g.fillRect(cx - 9 + i * 5, cy - 10, 3, 9); },
        // engrenagem partida
        (cx, cy) => { g.fillStyle(PAL.bone, 0.85); g.fillCircle(cx, cy, 8); g.fillStyle(PAL.mass, 1); g.fillCircle(cx, cy, 3); g.fillStyle(PAL.bone, 0.85); g.fillRect(cx - 1, cy - 12, 3, 5); g.fillRect(cx - 1, cy + 8, 3, 5); },
        // três traços
        (cx, cy) => { g.fillStyle(PAL.bone, 0.85); for (let i = 0; i < 3; i++) g.fillRect(cx - 9, cy - 7 + i * 6, 18, 3); },
        // olho vazado
        (cx, cy) => { g.lineStyle(3, PAL.bone, 0.85); g.strokeCircle(cx, cy, 8); g.fillStyle(PAL.bone, 0.85); g.fillCircle(cx, cy, 2); },
      ];
      glyphs.forEach((draw, i) => draw(32, 34 + i * 42));
    });
    // CEN-013 — grade da galeria: vazada, deixa ver a sala seguinte ao longe
    this.tex('grate', 44, 92, (g) => {
      g.fillStyle(PAL.ink, 0.9); g.fillRect(0, 0, 44, 92);
      for (let i = 0; i < 5; i++) g.fillStyle(PAL.stone, 1).fillRect(3 + i * 9, 0, 4, 92);
      g.fillStyle(PAL.stone, 1); g.fillRect(0, 0, 44, 5); g.fillRect(0, 86, 44, 6);
    });
    this.tex('crate', 52, 52, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 52, 52);              // contorno
      g.fillStyle(PAL.mass, 1); g.fillRect(3, 3, 46, 46);             // caixote
      g.fillStyle(PAL.stone, 1); g.fillRect(3, 3, 46, 5);             // tampa
      g.fillStyle(PAL.stone, 1); g.fillRect(3, 44, 46, 5);            // base
      g.fillStyle(PAL.accent01, 0.55); g.fillRect(6, 24, 40, 3);      // cinta
      g.fillStyle(PAL.ink, 0.8); g.fillRect(23, 3, 5, 46);            // ripas
    });
    this.tex('candle', 22, 40, (g) => {
      g.fillStyle(PAL.bone, 1); g.fillRect(7, 16, 8, 22);
      g.fillStyle(PAL.accent01, 1); g.fillTriangle(11, 2, 5, 18, 11, 14);
      g.fillStyle(PAL.bone, 1); g.fillTriangle(11, 6, 8, 17, 11, 15);
    });
    // ITM-001 (cura) — âmbar; ITM-002 (escudo) — verde da paleta; ITM-003 (salto duplo) — dourado
    this.tex('item_heal', 30, 34, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRoundedRect(1, 1, 28, 32, 6);
      g.fillStyle(PAL.bone, 1); g.fillRoundedRect(4, 4, 22, 26, 5);
      g.fillStyle(PAL.threat, 1); g.fillRect(13, 8, 4, 18); g.fillRect(6, 15, 18, 4);
    });
    this.tex('item_shield', 30, 34, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillTriangle(15, 1, 29, 8, 15, 33);
      g.fillTriangle(15, 1, 1, 8, 15, 33);
      g.fillStyle(PAL.accent01, 1); g.fillTriangle(15, 5, 25, 10, 15, 29);
      g.fillTriangle(15, 5, 5, 10, 15, 29);
      g.fillStyle(PAL.ink, 0.8); g.fillRect(14, 10, 2, 16);
    });
    this.tex('item_jump', 30, 34, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillCircle(15, 17, 15);
      g.fillStyle(PAL.accent01, 1); g.fillCircle(15, 17, 12);
      g.fillStyle(PAL.ink, 1); g.fillTriangle(15, 6, 22, 17, 8, 17);
      g.fillTriangle(15, 28, 22, 18, 8, 18);
    });
    // ---------- LVL-07: catedral (`PAL-07` = osso iluminado, tudo em `bone`) ----------
    // CEN-061 — arco de costela: nasce no teto e é cortado por ele (`overflow_top`)
    this.tex('arc', 48, 192, (g) => {
      g.fillStyle(PAL.mass, 1); g.fillRect(8, 0, 32, 192);            // sombra do vão
      g.fillStyle(PAL.stone, 1); g.fillRect(2, 0, 10, 192);           // colunas
      g.fillStyle(PAL.stone, 1); g.fillRect(36, 0, 10, 192);
      g.fillStyle(PAL.bone, 0.95); g.fillRect(2, 0, 4, 192);          // face iluminada
      g.fillStyle(PAL.bone, 0.95); g.fillRect(36, 0, 4, 192);
      for (let i = 0; i < 6; i++) {                                   // costelas atravessando
        g.fillStyle(PAL.bone, 0.75); g.fillRect(2, 10 + i * 30, 44, 4);
      }
      g.fillStyle(PAL.bone, 0.95); g.fillRect(0, 182, 48, 10);        // base
    });
    // CEN-060 — vitral intacto: a única cor saturada do setor
    this.tex('stained', 64, 320, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 64, 320);
      g.fillStyle(0x2f4b6e, 1); g.fillRect(3, 3, 58, 314);           // azul profundo
      g.fillStyle(PAL.gold, 0.9); g.fillCircle(32, 108, 24);          // rosácea
      g.fillStyle(0x7a3b57, 1); g.fillCircle(32, 108, 16);
      g.fillStyle(PAL.bone, 0.9); g.fillCircle(32, 108, 7);
      g.fillStyle(0x2f4b6e, 1);
      g.fillTriangle(6, 150, 32, 210, 58, 150);                      // painéis
      g.fillStyle(PAL.gold, 0.55); g.fillTriangle(20, 160, 44, 160, 32, 196);
      g.fillStyle(PAL.bone, 0.75); g.fillRect(29, 3, 6, 314);        // montante
    });
    // CEN-063 — banco de catedral, vazio
    this.tex('pew', 96, 40, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 96, 40);
      g.fillStyle(PAL.mass, 1); g.fillRect(4, 10, 88, 26);
      g.fillStyle(PAL.stone, 1); g.fillRect(0, 4, 96, 8);            // assento
      g.fillStyle(PAL.bone, 0.55); g.fillRect(6, 0, 84, 4);          // encosto
    });
    // CEN-070 — boca do trifório: vão escuro no teto, sem grade
    this.tex('triforium', 64, 40, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 64, 40);
      g.fillStyle(PAL.mass, 1); g.fillRect(4, 6, 56, 34);
      g.fillStyle(PAL.stone, 1); g.fillRect(0, 0, 64, 6);
    });
    // ---------- LVL-08: pátio (`PAL-08` terracota) ----------
    // ENT-004 O Alferes da Ronda: 192×192, sabre curto, metade do tronco já é areia
    this.tex('alferes', 192, 192, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(66, 40, 60, 152);
      g.fillStyle(PAL.mass, 1); g.fillRect(70, 44, 52, 148);
      g.fillStyle(PAL.bone, 1); g.fillRect(76, 22, 40, 36);            // cabeça
      g.fillStyle(PAL.ink, 1); g.fillRect(80, 34, 10, 8); g.fillRect(102, 34, 10, 8);
      g.fillStyle(0xe0563f, 1); g.fillRect(70, 96, 26, 96);            // metade de areia
      g.fillStyle(0xf2c66d, 1); g.fillRect(70, 62, 52, 8);             // talim
      g.fillStyle(PAL.bone, 1); g.fillRect(126, 74, 8, 74);            // sabre
      g.fillStyle(0xe0563f, 1); g.fillRect(60, 150, 72, 10);           // faixa da Ronda
    });
    // CEN-064 areia: sobreposição de **piso** — uma faixa fina no pé do tile, não um volume
    this.tex('sand', 64, 18, (g) => {
      g.fillStyle(0xb4693f, 0.5); g.fillRect(0, 6, 64, 12);
      g.fillStyle(0xe0563f, 0.55);
      for (let i = 0; i < 5; i++) g.fillRect(4 + i * 12, 9 + (i % 2) * 5, 6, 2);
    });
    // CEN-065 grade da arena: barras verticais, estado fechado
    this.tex('arena_grate', 64, 192, (g) => {
      g.fillStyle(PAL.ink, 0.9); g.fillRect(0, 0, 64, 192);
      g.fillStyle(PAL.stone, 1);
      for (let i = 0; i < 5; i++) g.fillRect(6 + i * 13, 0, 6, 192);
      g.fillStyle(0xe0563f, 1); g.fillRect(0, 8, 64, 8); g.fillRect(0, 176, 64, 8);
    });
    // CEN-067 sol vermelho: disco fixo, sem parallax — é ele que projeta a sombra do eco
    this.tex('red_sun', 192, 192, (g) => {
      g.fillStyle(0xe0563f, 0.25); g.fillCircle(96, 96, 92);
      g.fillStyle(0xe0563f, 0.75); g.fillCircle(96, 96, 64);
      g.fillStyle(PAL.ink, 0.85); g.fillCircle(96, 96, 40);
    });
    // CEN-069 estandarte da Ronda: rasgado no mesmo lugar em todas as variantes
    this.tex('banner_ronda', 48, 128, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(6, 0, 36, 120);
      g.fillStyle(0xe0563f, 1); g.fillRect(10, 6, 28, 104);
      g.fillStyle(PAL.mass, 1); g.fillTriangle(10, 96, 38, 96, 24, 118);
      g.fillStyle(PAL.mass, 1); g.fillRect(16, 24, 3, 40);            // rasgo
    });
    // CEN-068 corrente de pátio, sem sino
    this.tex('chain', 40, 96, (g) => {
      g.lineStyle(4, PAL.stone, 1);
      for (let i = 0; i < 6; i++) g.strokeCircle(20, 10 + i * 14, 6);
      g.fillStyle(PAL.ink, 1); g.fillRect(16, 88, 8, 8);
    });
    // CEN-066 monta-carga: cabo sem carga quando travado
    this.tex('hoist', 56, 96, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 56, 96);
      g.fillStyle(PAL.stone, 1); g.fillRect(4, 4, 48, 12);            // viga
      g.fillStyle(0xe0563f, 1); g.fillRect(24, 16, 8, 60);            // cabo
      g.fillStyle(PAL.bone, 0.9); g.fillRect(12, 76, 32, 12);         // plataforma
    });
    // ITM-007 espólio do chefe (`P-47`: o que é, ainda não canonizado)
    this.tex('item_relic', 34, 34, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillTriangle(17, 1, 33, 17, 17, 33);
      g.fillTriangle(17, 1, 1, 17, 17, 33);
      g.fillStyle(0xe0563f, 1); g.fillTriangle(17, 6, 28, 17, 17, 28);
      g.fillTriangle(17, 6, 6, 17, 17, 28);
      g.fillStyle(PAL.bone, 0.95); g.fillCircle(17, 17, 4);
    });
    // CEN-001 reskin: lasca de areia (o mesmo dente, outra pele)
    this.tex('sand_shard', 24, 18, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillTriangle(2, 18, 12, 1, 22, 18);
      g.fillStyle(0xe0563f, 1); g.fillTriangle(5, 17, 12, 5, 19, 17);
    });
    // ---------- LVL-09 · Canais Sombrios (`PAL-09`: tijolo molhado, ferro, limo) ----------
    // `CEN-072` argola de ferro: 2 estados, e o gasto é a pista de `PAT-LD-03`
    this.tex('hook_ring', 56, 56, (g) => {
      g.lineStyle(9, 0x2b2b33, 1); g.strokeCircle(28, 28, 20);
      g.lineStyle(6, 0x7d8590, 1); g.strokeCircle(28, 28, 20);
      g.lineStyle(2, 0xa9b2bd, 0.85); g.beginPath(); g.arc(28, 28, 20, -1.1, 0.5);
      g.strokePath();
      g.fillStyle(0x2b2b33, 1); g.fillRect(24, 0, 8, 12);          // haste no teto
    });
    // `CEN-073` comporta travada: roda que um dia bombeou
    this.tex('sluice', 64, 96, (g) => {
      g.fillStyle(0x232732, 1); g.fillRect(6, 8, 52, 84);
      g.fillStyle(0x3d4450, 1); g.fillRect(12, 16, 40, 68);
      g.lineStyle(4, 0x7d8590, 1); g.strokeCircle(32, 50, 18);
      g.fillStyle(0xb4693f, 0.85); g.fillRect(30, 32, 4, 36);      // travessa: está travada
      g.fillStyle(0x7d8590, 1); g.fillRect(30, 30, 4, 4);
    });
    // `CEN-002` reskin: lâmpada de canal
    this.tex('lamp', 22, 34, (g) => {
      g.fillStyle(0x2b2b33, 1); g.fillRect(9, 0, 4, 8);
      g.fillStyle(0x3d4450, 1); g.fillRect(4, 8, 14, 22);
      g.fillStyle(0xa8c48f, 0.95); g.fillRect(7, 12, 8, 14);       // limo verde: é luz viva
    });
    // `CEN-075` rato — 2 tiles de vagueio, nunca ataca
    this.tex('rat', 28, 16, (g) => {
      g.fillStyle(0x2b2b33, 1); g.fillEllipse(15, 9, 22, 12);
      g.fillStyle(0x7d8590, 1); g.fillEllipse(15, 9, 18, 8);
      g.fillStyle(0x2b2b33, 1); g.fillCircle(5, 8, 5);             // cabeça
      g.fillStyle(0x2b2b33, 1); g.fillRect(24, 4, 3, 8);           // cauda
    });
    // `CEN-074` arco de tijolo: nasce do teto e corta o topo do quadro
    this.tex('brick_arch', 64, 64, (g) => {
      g.fillStyle(0x232732, 1); g.fillRect(0, 0, 64, 64);
      g.lineStyle(5, 0x4a3a35, 1);
      g.beginPath(); g.arc(32, 74, 26, Math.PI, Math.PI * 2); g.strokePath();
      g.fillStyle(0x2b2b33, 0.55); g.fillRect(0, 0, 6, 64);        // fiadas
      g.fillRect(58, 0, 6, 64);
    });
    // ITM-008 gancho (`HAB-04`, `P-51`)
    this.tex('item_hook', 34, 34, (g) => {
      g.fillStyle(0x2b2b33, 1); g.fillRect(15, 2, 5, 18);
      g.lineStyle(5, 0x7d8590, 1); g.beginPath(); g.arc(17, 22, 8, -0.4, Math.PI); g.strokePath();
      g.fillStyle(0xb4693f, 1); g.fillRect(14, 2, 7, 4);
    });
    // corda da puxada (`VIS-013`): 3 px, sem física
    this.tex('hook_rope', 4, 4, (g) => {
      g.fillStyle(0x7d8590, 0.9); g.fillRect(0, 0, 4, 4);
    });
    // ---------- LVL-10 · Torre da Vigília (`PAL-10`: pedra alta, ferro, corda) ----------
    // `CEN-077` sino rachado **sem badalo** — a ausência é o desenho
    this.tex('bell', 192, 192, (g) => {
      g.fillStyle(0x232732, 1); g.fillRect(84, 0, 24, 32);          // cabeçote
      g.fillStyle(0x8a7a5c, 1);
      g.beginPath(); g.arc(96, 120, 74, Math.PI, Math.PI * 2); g.fillPath();
      g.fillRect(22, 118, 148, 26);                                  // saia do sino
      g.fillStyle(0x6b5c42, 1); g.fillRect(22, 138, 148, 8);
      g.lineStyle(4, 0x232732, 1);                                   // a rachadura: é o assunto
      g.beginPath(); g.moveTo(96, 44); g.lineTo(88, 96); g.lineTo(100, 132); g.strokePath();
      // sem badalo: o vão interno fica vazio de propósito
    });
    // `CEN-079` escada em caracol **quebrada** (a quebra tem de ser legível a 3 tiles)
    this.tex('spiral', 64, 64, (g) => {
      g.lineStyle(5, 0x4a4a55, 1);
      for (let i = 0; i < 3; i++) {
        g.beginPath(); g.arc(32, 20 + i * 20, 18, 0.2, Math.PI - 0.2); g.strokePath();
      }
      g.fillStyle(0x232732, 1); g.fillRect(0, 52, 64, 12);            // o degrau que falta
      g.fillStyle(0x8a4a3f, 0.6); g.fillRect(8, 56, 12, 4);
    });
    /*
     * `CEN-080` parede de ganchos — e `DEC-049` mudou-a de **parede com ganchos** para
     * **escada de ganchos**.
     *
     * O dono olhou para a sala e disse «acabou virando uma parede». Estava a ver o glifo, não a
     * mecânica: o desenho tinha ganchos soltos num muro, e um muro não se sobe — é o que a cabeça
     * de quem joga vê primeiro. A silhueta passa a ser de escada: dois prumos verticais contínuos
     * e travessas regulares de 32 px, uma por cada meio tile, **fora** do meio da célula para que
     * o padrão se repita sem corte (uma travessa em `y=0` e outra em `y=32`). Quem vê, sobe.
     */
    this.tex('climb_wall', 64, 64, (g) => {
      g.fillStyle(0x1e2027, 1); g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x2b2b33, 1); g.fillRect(0, 0, 64, 64);
      // prumos: dois ferros verticais que atravessam a célula de cima a baixo
      g.fillStyle(0xa9b2bd, 1); g.fillRect(10, 0, 6, 64); g.fillRect(48, 0, 6, 64);
      g.fillStyle(0x6d7985, 1); g.fillRect(10, 0, 2, 64); g.fillRect(48, 0, 2, 64);
      // travessas: uma por meio tile, a repetir no tile seguinte
      for (const y of [0, 32]) {
        g.fillStyle(0xa9b2bd, 1); g.fillRect(10, y + 6, 44, 6);
        g.fillStyle(0x6d7985, 1); g.fillRect(10, y + 10, 44, 2);
        // o gancho na ponta direita: é o que diz que a escada é de ferro cravado
        g.lineStyle(3, 0xd6dde4, 0.95);
        g.beginPath(); g.moveTo(54, y + 9); g.lineTo(60, y + 9); g.lineTo(58, y + 3); g.strokePath();
      }
    });
    // `CEN-081` alçapão: 2 estados, e a diferença tem de ser visível de longe
    this.tex('hatch_sealed', 128, 64, (g) => {
      g.fillStyle(0x232732, 1); g.fillRect(0, 0, 128, 64);
      g.fillStyle(0x5a4a3a, 1); g.fillRect(4, 8, 120, 48);
      g.fillStyle(0x3d4450, 1); g.fillRect(4, 8, 120, 8);             // duas tábuas cruzadas
      g.fillStyle(0x8a4a3f, 1); g.fillRect(24, 20, 80, 10);
      g.fillStyle(0xa9b2bd, 1); g.fillRect(58, 30, 12, 18);            // o cadeado
    });
    this.tex('hatch_open', 128, 64, (g) => {
      g.fillStyle(0x14131a, 1); g.fillRect(0, 0, 128, 64);             // o escuro: é passagem
      g.fillStyle(0x3d4450, 1); g.fillRect(0, 0, 10, 64); g.fillRect(118, 0, 10, 64);
      g.lineStyle(3, 0x8a7a5c, 0.8); g.strokeRect(2, 2, 124, 60);
    });
    // `CEN-082` poço gradeado: desce para LVL-03
    this.tex('well', 64, 32, (g) => {
      g.fillStyle(0x14131a, 1); g.fillRect(0, 0, 64, 32);
      g.lineStyle(3, 0x7d8590, 1);
      for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, 32); g.strokePath(); }
      g.beginPath(); g.moveTo(0, 16); g.lineTo(64, 16); g.strokePath();
      g.fillStyle(0x3d4450, 1); g.fillRect(0, 28, 64, 4);
    });
    // `CEN-078` corda do sino: desce até o chão e sobe para o escuro
    this.tex('rope', 14, 224, (g) => {
      g.fillStyle(0x6b5c42, 1); g.fillRect(4, 0, 6, 224);
      g.fillStyle(0x8a7a5c, 0.9);
      for (let i = 0; i < 14; i++) g.fillRect(3, i * 16, 8, 3);
    });
    // tocha da Vigília (`CEN-002` reskin): **a torre está acesa**
    this.tex('torch', 24, 48, (g) => {
      g.fillStyle(0x2b2b33, 1); g.fillRect(9, 20, 6, 28);
      g.fillStyle(0x8a7a5c, 1); g.fillRect(6, 14, 12, 8);
      g.fillStyle(0xf2c66d, 1); g.fillTriangle(12, 0, 4, 16, 20, 16);
      g.fillStyle(0xffffff, 0.85); g.fillTriangle(12, 4, 8, 15, 16, 15);
    });
    // janela alta (`CEN-074` reskin): a luz de fora, sem ninguém dentro
    this.tex('window_tall', 64, 64, (g) => {
      g.fillStyle(0x232732, 1); g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x5b6c8a, 0.55); g.fillRect(10, 4, 44, 56);
      g.fillStyle(0x232732, 1); g.fillRect(30, 4, 4, 56); g.fillRect(10, 30, 44, 4);
    });
    // ITM-009 garra (`HAB-03`, `P-53`)
    this.tex('item_claw', 34, 34, (g) => {
      g.fillStyle(0x2b2b33, 1); g.fillRect(14, 18, 6, 14);
      g.lineStyle(4, 0xa9b2bd, 1);
      for (let i = -1; i <= 1; i++) {
        g.beginPath();
        g.moveTo(17 + i * 8, 18);
        g.lineTo(17 + i * 10, 6);
        g.strokePath();
      }
      g.fillStyle(0x8a4a3f, 1); g.fillRect(12, 28, 10, 5);
    });
    this.tex('sigil', 44, 44, (g) => {
      g.lineStyle(4, PAL.accent01, 0.9); g.strokeCircle(22, 22, 16);
      g.lineStyle(4, PAL.accent01, 0.9); g.lineBetween(22, 6, 22, 38);
      g.lineStyle(3, PAL.accent01, 0.7); g.strokeRect(14, 14, 16, 16);
    });
    this.tex('board', 68, 52, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 68, 52);               // moldura
      g.fillStyle(PAL.stone, 1); g.fillRect(2, 2, 64, 48);             // pedra
      g.fillStyle(PAL.bone, 1); g.fillRect(6, 6, 56, 40);              // placa clara
      g.fillStyle(PAL.ink, 1); g.fillRect(10, 11, 44, 3);              // título
      for (let i = 0; i < 3; i++) g.fillRect(10, 20 + i * 7, i === 2 ? 26 : 48, 2);
    });
    this.tex('plaque', 48, 32, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 48, 32);               // contorno
      g.fillStyle(PAL.bone, 0.95); g.fillRect(3, 3, 42, 26);           // face clara
      g.fillStyle(PAL.ink, 0.85); g.fillRect(7, 8, 30, 2);
      g.fillStyle(PAL.ink, 0.6); g.fillRect(7, 15, 22, 2);
      g.fillStyle(PAL.ink, 0.6); g.fillRect(7, 22, 26, 2);
    });

    // ---------- LVL-11 · Jardim Profanado (`PAL-11`: musgo, vidro de estufa, magenta) ----------
    // `CEN-083` flora magenta — **o único movimento vivo do setor** (`wind=low`): sem ela
    // o `AMB-11` (flora estalando) não tem fonte visível. Desenhada inclinada: ela balança.
    this.tex('flora', 48, 64, (g) => {
      g.fillStyle(0x3f5a44, 1); g.fillRect(20, 30, 6, 34);              // caule musgoso
      g.fillStyle(PAL.accent11, 1);
      g.fillTriangle(23, 8, 10, 34, 36, 34);                            // copa magenta
      g.fillStyle(PAL.accent11, 0.75); g.fillTriangle(23, 18, 15, 38, 31, 38);
      g.fillStyle(PAL.bone, 0.8); g.fillRect(21, 22, 4, 4);             // a flora estala aqui
      g.fillStyle(0x3f5a44, 1); g.fillRect(8, 44, 12, 4); g.fillRect(28, 50, 12, 4);
    });
    // `CEN-084` estátua sem rosto, 1×2: a trepadeira comeu a cara
    this.tex('statue', 64, 128, (g) => {
      g.fillStyle(PAL.mass, 1); g.fillRect(8, 96, 48, 32);              // plinto
      g.fillStyle(PAL.stone, 1); g.fillRect(18, 22, 28, 80);            // corpo
      g.fillStyle(PAL.stone, 1); g.fillCircle(32, 20, 18);              // cabeça — sem face
      g.fillStyle(PAL.mass, 1); g.fillRect(14, 8, 36, 16);              // a sombra onde havia rosto
      g.fillStyle(0x3f5a44, 1);                                         // trepadeira em vez de cara
      g.fillRect(20, 6, 4, 30); g.fillRect(34, 4, 4, 34); g.fillRect(44, 12, 4, 26);
      g.fillStyle(PAL.accent11, 0.9); g.fillRect(24, 28, 6, 5); g.fillRect(40, 22, 6, 5);
    });
    // vidro da estufa (`CEN-083` reskin): o telhado quebrado deixa passar `PAL-11`
    this.tex('glass', 64, 48, (g) => {
      g.fillStyle(0x3f5a44, 0.55); g.fillRect(0, 0, 64, 48);
      g.lineStyle(3, PAL.bone, 0.6);
      g.strokeRect(4, 4, 56, 40); g.lineBetween(32, 4, 32, 44); g.lineBetween(4, 24, 60, 24);
      g.fillStyle(0x0b0910, 0.9); g.fillTriangle(18, 8, 30, 4, 22, 20); // a fratura
    });
    // `CEN-085` trepadeira: **sinalização de beirada**, não ornamento (§3)
    this.tex('vine', 32, 64, (g) => {
      g.fillStyle(0x3f5a44, 1); g.fillRect(14, 0, 4, 64);
      g.fillStyle(0x4d7053, 1);
      for (let i = 0; i < 5; i++) {
        g.fillRect(i % 2 ? 4 : 18, 8 + i * 12, 10, 5);                  // folhas alternadas
      }
      g.fillStyle(PAL.accent11, 0.95); g.fillCircle(16, 6, 4);          // a flor do cipó
    });
    // `CEN-086` flor que estala: só som, zero gameplay (período 9 s)
    this.tex('flower', 32, 32, (g) => {
      g.fillStyle(0x3f5a44, 1); g.fillRect(15, 16, 3, 16);
      g.fillStyle(PAL.accent11, 1);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g.fillCircle(16 + Math.cos(a) * 7, 12 + Math.sin(a) * 7, 5);
      }
      g.fillStyle(PAL.bone, 1); g.fillCircle(16, 12, 4);                // o miolo que estala
    });
    // `CEN-087` estandarte rasgado da Vigília — a bandeira de LVL-03, apodrecida
    this.tex('banner_torn', 48, 64, (g) => {
      g.fillStyle(0x8a7a5c, 1); g.fillRect(4, 0, 40, 6);                // travessa
      g.fillStyle(PAL.threat, 0.85); g.fillRect(10, 6, 28, 40);         // pano
      g.fillStyle(PAL.threat, 0.55); g.fillRect(18, 10, 6, 30);         // dobra
      g.fillStyle(0x15131f, 1);                                         // rasgos: o pano está morto
      g.fillTriangle(10, 46, 22, 46, 12, 62);
      g.fillTriangle(24, 46, 38, 46, 30, 56);
      g.fillTriangle(32, 30, 38, 30, 38, 44);
    });
    // `ITM-010` estandarte — o objeto que dá `HAB-07`, hoje só pelo drop de chefe (`DEC-042`)
    this.tex('item_banner', 34, 34, (g) => {
      g.fillStyle(0x8a7a5c, 1); g.fillRect(6, 2, 22, 4);                // haste
      g.fillStyle(PAL.accent11, 1); g.fillRect(9, 6, 16, 20);           // pano magenta
      g.fillStyle(PAL.bone, 0.9); g.fillRect(14, 10, 6, 6);             // sigilo da Vigília
      g.fillStyle(0x15131f, 1); g.fillTriangle(9, 26, 17, 26, 9, 34);   // rasgo
      g.fillStyle(0x8a7a5c, 1); g.fillRect(4, 30, 26, 3);
    });
    // `CEN-088` conduto da chaminé: a boca que só desce (`interact`, `save=false`)
    this.tex('duct', 64, 48, (g) => {
      g.fillStyle(PAL.mass, 1); g.fillRect(0, 8, 64, 40);
      g.fillStyle(0x0b0910, 1); g.fillRect(8, 14, 48, 30);              // o vazio lá dentro
      g.fillStyle(PAL.stone, 1); g.fillRect(4, 4, 56, 8);               // borda de pedra
      g.fillStyle(0x3f5a44, 0.8); g.fillRect(12, 4, 6, 12); g.fillRect(46, 4, 6, 12);
      g.fillStyle(PAL.accent11, 0.7); g.fillRect(24, 32, 16, 3);        // o fundo não aparece
    });
  }
  /** `LVL-12` — a forja (`PAL-12`): ferro, brasa e escória. Nada aqui é vivo além do chefe. */
  private makeForge(): void {
    // `ENT-005` O Forjador — 192×192, curvado, avental de couro, metade de baixo do rosto
    // **ausente** (§5.1). O martelo é o que ele larga na fase 2, então fica à mão direita.
    this.tex('forjador', 192, 192, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRoundedRect(22, 8, 148, 184, 12);
      g.fillStyle(PAL.mass, 1); g.fillRoundedRect(28, 14, 136, 172, 10);   // tronco curvado
      // cabeça: o alto existe, a metade de baixo é sombra (§5.1)
      g.fillStyle(PAL.bone, 1); g.fillRect(66, 30, 60, 34);
      g.fillStyle(PAL.ink, 1); g.fillRect(66, 52, 60, 12);                 // onde havia boca
      g.fillStyle(PAL.ink, 1); g.fillRect(62, 22, 68, 12);                 // testa/cabelo
      g.fillStyle(PAL.threat, 1); g.fillRect(74, 40, 12, 6);               // olhos
      g.fillStyle(PAL.threat, 1); g.fillRect(106, 40, 12, 6);
      // avental de couro, com a marca de queimadura de 400 peças
      g.fillStyle(0x8a5033, 1); g.fillRect(58, 96, 78, 90);
      g.fillStyle(PAL.ink, 1); g.fillRect(58, 96, 4, 90); g.fillRect(132, 96, 4, 90);
      g.fillStyle(0x0b0910, 1); g.fillRect(84, 120, 26, 40);               // a queimadura
      // braços: um segura o martelo, o outro apoia na bigorna
      g.fillStyle(PAL.stone, 1); g.fillRect(30, 88, 26, 62);
      g.fillStyle(PAL.stone, 1); g.fillRect(138, 88, 26, 62);
      g.fillStyle(PAL.bone, 1); g.fillRect(32, 142, 22, 16); g.fillRect(140, 142, 22, 16);
      // martelo na mão direita
      g.fillStyle(0x8a7a5c, 1); g.fillRect(146, 108, 10, 62);              // cabo
      g.fillStyle(PAL.stone, 1); g.fillRect(126, 96, 46, 22);              // cabeça
      g.fillStyle(PAL.mass, 1); g.fillRect(126, 96, 46, 6);
      // pernas curtas: ele não anda (§5.1)
      g.fillStyle(PAL.ink, 1); g.fillRect(64, 172, 26, 16); g.fillRect(104, 172, 26, 16);
    });

    // `ATK-11` a peça em brasa: pequena, quente, e visível contra o ferro
    this.tex('forge_piece', 24, 24, (g) => {
      g.fillStyle(0x0b0910, 1); g.fillRect(2, 2, 20, 20);
      g.fillStyle(0xd95555, 1); g.fillRect(4, 4, 16, 16);
      g.fillStyle(0xf2c66d, 1); g.fillRect(8, 6, 8, 8);                    // o núcleo branco
      g.fillStyle(PAL.bone, 0.9); g.fillRect(10, 8, 4, 4);
    });

    // `CEN-092` o pilão: aríete de ferro pendurado numa guia (o desenho cai com ele)
    this.tex('hammer_ram', 96, 128, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(20, 0, 12, 70);                  // guia
      g.fillStyle(PAL.mass, 1); g.fillRect(22, 0, 8, 70);
      g.fillStyle(PAL.ink, 1); g.fillRect(4, 64, 88, 60);                  // aríete
      g.fillStyle(PAL.stone, 1); g.fillRect(8, 68, 80, 52);
                                          // (sem opacidade)
      g.fillStyle(PAL.bone, 0.25); g.fillRect(8, 68, 80, 6);               // face de cima
      g.fillStyle(0xd95555, 1); g.fillRect(8, 108, 80, 12);                // a face que bate
    });

    // `CEN-089` forno de 1×2: a boca é a única fonte de luz do setor
    this.tex('furnace', 96, 128, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 96, 128);
      g.fillStyle(PAL.mass, 1); g.fillRect(6, 6, 84, 122);
      g.fillStyle(PAL.stone, 1); g.fillRect(12, 12, 72, 30);               // chaminé
      g.fillStyle(0x0b0910, 1); g.fillRoundedRect(18, 52, 60, 62, 8);      // a boca
      g.fillStyle(0xd95555, 1); g.fillRect(24, 84, 48, 26);                // brasa
      g.fillStyle(0xf2c66d, 1); g.fillRect(32, 92, 32, 14);                // núcleo
      g.fillStyle(PAL.bone, 0.8); g.fillRect(40, 96, 16, 6);
      g.fillStyle(PAL.accent01, 0.5); g.fillRect(12, 118, 72, 4);          // escória no piso
    });

    // `CEN-090` esteira de montagem: 13 tiles de uma peça só (`displaySize` estica)
    this.tex('conveyor', 64, 20, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(0, 0, 64, 20);
      g.fillStyle(PAL.stone, 1); g.fillRect(0, 3, 64, 12);
      g.fillStyle(PAL.mass, 1);
      for (let x = 0; x < 64; x += 16) g.fillRect(x, 3, 8, 12);            // elos
      g.fillStyle(PAL.accent01, 0.35); g.fillRect(0, 3, 64, 2);            // brilho
    });

    // `CEN-091` bigorna: 1 tile de largura, a peça do setor
    this.tex('anvil', 80, 52, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(6, 16, 68, 20);                  // mesa
      g.fillStyle(PAL.stone, 1); g.fillRect(10, 20, 60, 12);
      g.fillTriangle(6, 22, 6, 38, 0, 30);
      g.fillStyle(PAL.ink, 1); g.fillRect(30, 36, 20, 10);                 // pescoço
      g.fillStyle(PAL.stone, 1); g.fillRect(32, 38, 16, 8);
      g.fillStyle(PAL.ink, 1); g.fillRect(18, 44, 44, 8);                  // base
      g.fillStyle(PAL.bone, 0.22); g.fillRect(10, 20, 60, 3);
    });

    // `CEN-093` calha de escória: a boca que só desce (`interact`, sem save)
    this.tex('slag_chute', 64, 56, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(2, 4, 60, 52);
      g.fillStyle(PAL.mass, 1); g.fillRect(6, 8, 52, 44);
      g.fillStyle(0x0b0910, 1); g.fillRect(12, 16, 40, 32);                // o poço
      g.fillStyle(0xd95555, 0.6); g.fillRect(16, 40, 32, 6);               // escória viva
      g.fillStyle(PAL.stone, 1); g.fillRect(8, 6, 48, 8);                  // borda
    });

    // `ITM-011` a peça que faltava: só existe se o Forjador cair (§5.6)
    this.tex('item_piece', 34, 34, (g) => {
      g.fillStyle(0x0b0910, 1); g.fillRect(4, 4, 26, 26);
      g.fillStyle(PAL.stone, 1); g.fillRect(7, 7, 20, 20);
      g.fillStyle(0xd95555, 1); g.fillRect(11, 11, 12, 12);                // ainda quente
      g.fillStyle(0xf2c66d, 1); g.fillRect(14, 14, 6, 6);
      g.fillStyle(PAL.accent01, 0.9); g.fillRect(7, 7, 20, 3);
    });
  }
  /** `LVL-13` — o abismo (`PAL-13`): **nada construído**. Rocha, estaca velha e vazio. */
  private makeAbyss(): void {
    // `CEN-098` a estaca de corda: madeira rachada, corda cortada, e a corda não vai a
    // lugar nenhum — é o que conta a história (§4.2)
    this.tex('stake', 40, 72, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillRect(14, 8, 12, 64);
      g.fillStyle(0x6b5a44, 1); g.fillRect(17, 10, 6, 60);                 // madeira
      g.fillStyle(PAL.ink, 1); g.fillRect(10, 8, 20, 6);                   // topo rachado
      g.fillStyle(0x8a7a5c, 0.9);                                          // corda cortada
      g.fillRect(20, 16, 14, 3); g.fillRect(28, 16, 3, 10);
      g.fillStyle(PAL.ink, 1); g.fillRect(12, 66, 16, 6);                  // base
      g.fillStyle(0x6b5a44, 1); g.fillRect(16, 40, 8, 3);
    });

    // `CEN-095` a marca de eco: um arco incompleto no piso — o som que volta
    this.tex('echo_mark', 64, 24, (g) => {
      g.lineStyle(3, PAL.accent13, 0.9);
      g.beginPath();
      g.arc(32, 20, 18, Math.PI * 1.15, Math.PI * 1.85, false);
      g.strokePath();
      g.beginPath();
      g.arc(32, 20, 10, Math.PI * 1.2, Math.PI * 1.8, false);
      g.strokePath();
      g.fillStyle(PAL.accent13, 0.5); g.fillRect(30, 16, 4, 6);
    });

    // `CEN-099` a boca do poço: um buraco com borda de rocha. O atalho chega por ela.
    this.tex('well_mouth', 72, 40, (g) => {
      g.fillStyle(PAL.ink, 1); g.fillEllipse(36, 24, 68, 32);
      g.fillStyle(PAL.mass, 1); g.fillEllipse(36, 22, 56, 24);
      g.fillStyle(0x050408, 1); g.fillEllipse(36, 22, 44, 18);             // o vazio
      g.fillStyle(PAL.stone, 1); g.fillRect(4, 30, 64, 8);                 // borda
      g.fillStyle(PAL.bone, 0.12); g.fillRect(8, 30, 56, 3);
    });
  }

}
