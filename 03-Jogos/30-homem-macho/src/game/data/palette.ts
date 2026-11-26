/** PAL-00 + PAL-01 — 02-paleta-tipografia-e-ui §2.1–2.2. Não inventar cor fora daqui. */
export const PAL = {
  ink: 0x0b0910,      // --ink  contorno, V0
  bg: 0x15131f,       // --bg   vazio, V1
  mass: 0x2a2433,     // --mass volume escuro
  stone: 0x464052,    // --stone pedra, V3
  bone: 0xe6dfd2,     // --bone luz, destaque
  threat: 0xd95555,   // --threat dano, perigo
  gold: 0xf2c66d,     // --gold progresso, checkpoint, saída
  text: 0xf8f7f2,     // --text UI
  accent01: 0xf2c66d, // PAL-01 dourado poeira (LVL-01)
  /** `PAL-11` magenta (`LVL-11` §1): **o único acento saturado desde `PAL-08`**. */
  accent11: 0xc76ba6,
  /** `PAL-13` índigo `#6B5AA6` (`LVL-13` §1): o acento do abismo — vento e eco, nada mais. */
  accent13: 0x6b5aa6,
  /** `PAL-14` azul-noite `#5A6BB0` (`LVL-14` §1): o eclipse e a fortaleza. */
  accent14: 0x5a6bb0,
  /** `PAL-15` cinza-osso `#B9B2A8` (`LVL-15` §1): a cinza e o lacre, nada mais. */
  accent15: 0xb9b2a8,
  /**
   * `PAL-16` vinho `#7B2E4A` (`LVL-16` §1) — o último acento do jogo. **Ele não pode carregar
   * informação** (§13, desvio 7): mede 2,04:1 contra `--bg` e só existe sobre `--bone`
   * (6,80:1). Luz em superfície clara — nunca texto nem HUD sobre fundo escuro.
   */
  accent16: 0x7b2e4a,
} as const;

export const CSS = {
  ink: '#0B0910', bg: '#15131F', mass: '#2A2433', stone: '#464052',
  bone: '#E6DFD2', threat: '#D95555', gold: '#F2C66D', text: '#F8F7F2',
} as const;
