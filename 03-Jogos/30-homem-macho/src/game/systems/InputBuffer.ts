/** PAT-C-05 — buffer de input + coyote time. O padrão que conserta o game feel. */
export class InputBuffer {
  private pressAt = -Infinity;
  constructor(private readonly windowMs: number) {}

  press(nowMs: number): void { this.pressAt = nowMs; }

  /** Há um aperto dentro da janela? (não consome) */
  has(nowMs: number): boolean { return nowMs - this.pressAt <= this.windowMs; }

  consume(nowMs: number): boolean {
    if (this.has(nowMs)) { this.pressAt = -Infinity; return true; }
    return false;
  }

  clear(): void { this.pressAt = -Infinity; }
}

/** Janela de perdão depois de sair da plataforma. */
export class Coyote {
  private leftAt = -Infinity;
  constructor(private readonly windowMs: number) {}

  onGround(nowMs: number): void { this.leftAt = nowMs; }
  onLeave(): void { /* o instante da saída já ficou registrado no último onGround */ }

  allows(nowMs: number): boolean { return nowMs - this.leftAt <= this.windowMs; }
  consume(): void { this.leftAt = -Infinity; }
}
