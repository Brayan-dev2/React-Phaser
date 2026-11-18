/**
 * Física pura de salto — a autoridade dos números de `DEC-014`.
 * Integração de Euler em passo fixo, igual à do Arcade Physics. Não usa forma fechada:
 * `v²/2g` mente, e foi exatamente essa mentira que fez a config A parecer viável.
 */

export interface JumpParams {
  readonly jumpImpulse: number; // px/s
  readonly gravity: number;     // px/s²
  readonly hz?: number;         // passos por segundo (padrão 60)
}

export interface JumpTrace {
  readonly apexPx: number;
  readonly airMs: number;
}

/** Altura máxima de um salto a partir do repouso, em px. */
export function jumpApex(params: JumpParams): JumpTrace {
  const hz = params.hz ?? 60;
  const dt = 1 / hz;
  let v = params.jumpImpulse;
  let y = 0;
  let apex = 0;
  let steps = 0;
  while (y >= 0 && steps < 600) {
    v -= params.gravity * dt;
    y += v * dt;
    if (y > apex) apex = y;
    steps++;
  }
  return { apexPx: apex, airMs: steps * dt * 1000 };
}

/** Altura acumulada de N saltos (o jogador só pode repetir depois de tocar o chão). */
export function jumpApexFor(jumps: number, params: JumpParams): number {
  return jumps * jumpApex(params).apexPx;
}
