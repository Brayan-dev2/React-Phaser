# 8. Padrões de Código

> [← Anterior: 7. Padrões de Level Design](07-padroes-de-level-design.md) · [Índice](README.md)

> Implementa o GDD §7. Todo padrão aqui existe para resolver um problema **real** do escopo — nada é arquitetura especulativa. IDs: `PAT-C-##`.

## 8.0 Direção de dependência (a regra que sustenta todas as outras)

```
core/        (TS puro — zero imports de phaser, react, dom)
  ↑
game/        (Phaser)      ui/ (React)
  ↑                          ↑
services/    (rede, save, i18n) — sem phaser, sem react
  ↑
main.tsx     (composição — único lugar que conhece tudo)
```

| Regra | Verificação |
|---|---|
| `core/` não importa `phaser`, `react` nem `window` | lint `no-restricted-imports` |
| `ui/` não importa de `game/` | lint + revisão |
| `game/` não importa de `ui/` | lint + revisão |
| `services/` não importa de `game/` nem `ui/` | lint |
| Comunicação cruzada só via `EventBus` | revisão |
| Todo payload de evento é serializável | teste de tipo |

**Isto é `ADR-01` do GDD materializado.** Se uma tarefa exige quebrar esta direção, a tarefa está mal desenhada — pare e reescopa.

---

## `PAT-C-01` — EventBus tipado (React ↔ Phaser)

GDD 7.5. O problema: duas árvores de runtime diferentes precisam conversar sem acoplamento e sem trafegar objetos vivos.

```ts
// src/game/EventBus.ts
export interface GameEvents {
  'game:hud': { hp: number; shield: number; power: number; xp: number; money: number };
  'game:inventory': { slotsUsed: number; pinnedCount: number };
  'game:death': { areaId: string; recoverable: boolean };
  'game:completed': { scope: 'mvp' | 'campaign' };
  'ui:pause': { paused: boolean };
  'ui:settings': { music: number; sfx: number; reducedMotion: boolean };
  'ui:inventory-command': { action: 'pin' | 'unpin' | 'recover'; itemId?: string };
  'save:result': { ok: boolean; revision?: number; errorCode?: string };
}

type Handler<K extends keyof GameEvents> = (p: GameEvents[K]) => void;

class TypedBus {
  private map = new Map<string, Set<Handler<never>>>();

  on<K extends keyof GameEvents>(event: K, fn: Handler<K>): () => void {
    const key = event as string;
    if (!this.map.has(key)) this.map.set(key, new Set());
    this.map.get(key)!.add(fn as Handler<never>);
    return () => this.map.get(key)?.delete(fn as Handler<never>); // retorna unsubscribe
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    this.map.get(event as string)?.forEach((fn) => (fn as Handler<K>)(payload));
  }
}

export const EventBus = new TypedBus();
```

**Regras:** todo `on` retorna `unsubscribe`, e o chamador **é obrigado** a guardá-lo e chamá-lo em `shutdown`/`unmount`. Payload nunca contém `GameObject`, `Sprite`, `Scene` ou `HTMLElement`.

**Anti-padrão:** emitir evento a cada frame. `game:hud` tem teto de 10 Hz (GDD 7.5).

---

## `PAT-C-02` — Máquina de estados finita (jogador e inimigos)

GDD 7.7 e §3.1–3.2. O problema: comportamento de ação com transições inválidas (atacar enquanto morre, pular durante dano).

```ts
// src/core/fsm.ts — puro, testável com Vitest
export type PlayerState =
  | 'idle' | 'run' | 'air' | 'attack' | 'shoot' | 'hurt' | 'dead';

export interface Transitions<S extends string> {
  readonly [from: string]: readonly S[];
}

export const PLAYER_TRANSITIONS: Transitions<PlayerState> = {
  idle:   ['run', 'air', 'attack', 'shoot', 'hurt'],
  run:    ['idle', 'air', 'attack', 'shoot', 'hurt'],
  air:    ['idle', 'attack', 'shoot', 'hurt'],
  attack: ['idle', 'hurt'],
  shoot:  ['idle', 'hurt'],
  hurt:   ['idle', 'dead'],
  dead:   ['idle'], // apenas via respawn explícito
};

export function canTransition<S extends string>(
  map: Transitions<S>, from: S, to: S,
): boolean {
  return map[from]?.includes(to) ?? false;
}
```

**Regras:** a tabela vive em `core/` (puro), a execução visual em `game/state-machines/`. Transição inválida **nunca** lança exceção em produção — registra e ignora. Um teste por transição proibida.

---

## `PAT-C-03` — Object pooling (projéteis, VFX)

GDD 7.7. O problema: criar objetos no `update` causa GC e *frame spikes*.

```ts
// src/game/systems/Pool.ts
export class Pool<T> {
  private free: T[] = [];
  private active: T[] = [];
  constructor(
    private readonly factory: () => T,
    private readonly reset: (o: T) => void,
    private readonly max: number,
  ) {}
  acquire(): T | null {
    if (this.active.length >= this.max) return null; // degrada, nunca cresce
    const o = this.free.pop() ?? this.factory();
    this.active.push(o);
    return o;
  }
  release(o: T): void { this.reset(o); this.active = this.active.filter(x => x !== o); this.free.push(o); }
  releaseAll(): void { this.active.forEach(o => this.release(o)); }
  get activeCount(): number { return this.active.length; }
}
```

**Limites do GDD 7.11:** projéteis 40, partículas 30, efeitos 20. `acquire()` retornando `null` é comportamento correto, não erro.

---

## `PAT-C-04` — Tuning data-driven

GDD 2.11 e 7.7. O problema: balancear exige mudar código, recompilar e testar de novo.

```ts
// src/game/data/tuning.ts
export interface Tuning {
  readonly moveSpeed: number;      // px/s
  readonly jumpImpulse: number;    // px/s
  readonly gravity: number;        // px/s²
  readonly coyoteMs: number;       // perdão pós-plataforma
  readonly jumpBufferMs: number;   // perdão pré-pouso
  readonly runMultiplier: number;
  readonly coyoteCornerPx: number; // correção de quina
}

export const DEFAULT_TUNING: Tuning = {
  moveSpeed: 220, jumpImpulse: 560, gravity: 1100,   // DEC-014
  coyoteMs: 100, jumpBufferMs: 100,
  runMultiplier: 1.4, coyoteCornerPx: 6,
};
```

**Regras:** nenhum número mágico em `game/` ou `core/`. Todo valor vem de `game/data/` e é imutável em runtime. Em `dev`, painel de debug permite ajustar e exportar o JSON resultante (GDD 7.14). Valores de produção entram por `import` estático — o painel é excluído do build.

---

## `PAT-C-05` — Buffer de input (o padrão que "conserta" o game feel)

Ver análise técnica: o GDD `MEC-001` não especifica coyote time nem buffer. **Este padrão é a diferença entre um platformer que parece quebrado e um que parece bom.**

```ts
// src/game/systems/InputBuffer.ts
export class InputBuffer {
  private pressAt = -Infinity;
  constructor(private readonly windowMs: number) {}
  press(nowMs: number): void { this.pressAt = nowMs; }
  consume(nowMs: number): boolean {
    if (nowMs - this.pressAt <= this.windowMs) { this.pressAt = -Infinity; return true; }
    return false;
  }
  clear(): void { this.pressAt = -Infinity; }
}
```

| Mecanismo | Janela | Efeito |
|---|---:|---|
| **Jump buffer** | 100 ms | apertar antes de pousar = pulo registrado |
| **Coyote time** | 100 ms | sair da borda ainda permite 1 pulo |
| **Corner correction** | 6 px | não trava em quina de bloco |
| **Altura variável** | — | soltar o botão corta o impulso vertical |

Cada um precisa de teste unitário em `core/` e de validação em jogo. Sem isso, `REQ-F-001` está tecnicamente cumprido e o jogo continua ruim.

---

## `PAT-C-06` — Ciclo de vida da cena (StrictMode e HMR)

GDD 7.7 (`[RISCO]` explícito). O problema: dois canvas, listeners duplicados, memória crescendo.

```tsx
// src/game/PhaserGame.tsx
useEffect(() => {
  const game = new Phaser.Game(config);
  const unsubs = [
    EventBus.on('ui:pause', ({ paused }) => { paused ? game.scene.pause('Game') : game.scene.resume('Game'); }),
    EventBus.on('ui:settings', (s) => applySettings(game, s)),
  ];
  return () => {
    unsubs.forEach((u) => u());
    game.destroy(true);       // (true) = remove o canvas do DOM
  };
}, []);
```

**Aceite (`TST-011`):** montar → desmontar → remontar 3× deixa exatamente **1** canvas e **0** listeners órfãos. Verificar com contagem em `document.querySelectorAll('canvas').length`.

---

## `PAT-C-07` — Save com revisão otimista (saga)

GDD 7.9. O problema: dois dispositivos, ou retry após queda de rede, sobrescrevem progresso.

```ts
// src/services/save.ts — sem phaser, sem react
export interface SaveEnvelope {
  version: number; revision: number; updatedAt: string;
  profile: unknown; progress: unknown; inventory: unknown;
  recoveryBag: unknown; settings: unknown;
}

export async function save(envelope: SaveEnvelope): Promise<SaveResult> {
  // 1. operações críticas têm opId idempotente (morte, recuperação, perda de bolsa)
  // 2. servidor valida `revision`; se divergir → conflito, nunca overwrite silencioso
  // 3. cliente só avança `revision` local após confirmação
  const res = await api.put('/api/save', { ...envelope, ifRevision: envelope.revision });
  return res.status === 409
    ? { ok: false, errorCode: 'REVISION_CONFLICT' }
    : { ok: true, revision: envelope.revision + 1 };
}
```

**Regras:** morte, recuperação e perda de bolsa são **transações idempotentes** (`POST /api/inventory/operations` com `opId`). Nunca salvar estado otimista local como verdade. Conflito → UI de escolha, jamais *last write wins*.

> `[MVP local]` Se a decisão for salvar local primeiro (recomendado — ver análise), o mesmo envelope vai para IndexedDB com `revision` monotônica. O padrão não muda; muda o transporte. Isso mantém o caminho para a nuvem aberto.

---

## `PAT-C-08` — Passo de tempo

GDD 2.5. Duas verdades separadas:

| Camada | Modelo |
|---|---|
| Física (Phaser Arcade) | passos fixos da engine; **nunca** multiplicar por delta de novo |
| Regras puras (`core/`) | funções com tempo explícito em ms, sem `Date.now()` interno |
| Animações/VFX | `delta` normalizado |

Teste em `core/`: mesma sequência de inputs com deltas diferentes (16 ms, 33 ms, 8 ms) produz o **mesmo** resultado de regra (dano, slots, morte).

---

## `PAT-C-09` — Registro de assets com hash

GDD 7.8. Chave de cache por conteúdo, falha isolada por pacote.

```ts
export const ASSET_PACKS = {
  boot:   { images: ['ui_logo'], audio: [] },
  mvp:    { images: ['atl_player', 'atl_sentinela', 'atl_guarda'], audio: ['bgm_01', 'sfx_001'] },
} as const;
```

Falha de um pacote → `UI-11` + retry, nunca tela branca. Pré-carregar fonte antes do primeiro texto.

---

## `PAT-C-10` — Feature flags por milestone

O problema: código de pós-MVP entrando no MVP e quebrando o build.

```ts
// src/game/data/flags.ts
export const FLAGS = {
  doubleJump: true,      // HAB-01 — MVP
  proceduralChallenges: false, // MEC-010 — pós
  shop: false,           // REQ-F-013 — pós
  onlineSave: false,     // REQ-F-008 — decisão pendente
} as const;
```

Regra: flag `false` **não** pode deixar código morto acessível. Se desligada, o caminho não existe no bundle em produção (`import()` dinâmico + tree-shaking).

---

## 8.19 Anti-padrões proibidos neste projeto

| # | Anti-padrão | Por quê |
|---|---|---|
| 1 | `GameObject` em estado React | quebra reatividade e ciclo de vida |
| 2 | React dentro de `Scene` | viola `ADR-01` |
| 3 | Número mágico fora de `game/data/` | impossibilita balancear |
| 4 | `new` dentro de `update()` | GC, frame spike |
| 5 | Lógica de regra em `Scene` | intestável |
| 6 | Evento a cada frame | mata o HUD em mobile |
| 7 | `localStorage` para token | GDD 7.6 |
| 8 | Save "last write wins" | GDD 7.9 |
| 9 | `any` em fronteira de evento | anula o ganho do TS strict |
| 10 | Estado global mutável fora de `store/` | bugs de estado zumbi |

## 8.20 Testes por camada

| Camada | Ferramenta | Cobertura mínima |
|---|---|---|
| `core/` | Vitest | dano, escudo, slots, morte, transições, dificuldade — **≥ 90%** |
| `services/` | Vitest + mock HTTP | save, conflito, idempotência |
| `ui/` | Testing Library | fluxo de telas, acessibilidade, i18n |
| `game/` | Vitest (unidades) + Playwright (E2E) | lifecycle, input buffer |
| Ponta a ponta | Playwright | login → jogo → pausa → morte → recuperação |

Referência de casos: `TST-001`–`TST-018` (GDD 10.2). `TST-018` é o teste do **fim**: o chefe final não pode ser morto, a arena só abre na 3ª baixa e `MEC-012` processa uma vez.

---

[← Anterior](07-padroes-de-level-design.md) · [Índice](README.md) · [Agentes de IA →](../../agents-ia/README.md)
