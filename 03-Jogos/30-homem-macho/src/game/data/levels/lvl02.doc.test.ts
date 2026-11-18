/** A grade de `lvl02.ts` tem que ser idêntica à publicada em `docs/niveis/LVL-02.md` §5. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LVL02 } from './lvl02';

const DOC = fileURLToPath(new URL('../../../../docs/niveis/LVL-02.md', import.meta.url));

function gridsDoDocumento(md: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const section of md.split(/^### 5\.\d+ /m).slice(1)) {
    const id = section.match(/^(L\d\d-\d\d)/)?.[1];
    if (!id) continue;
    const rows: string[] = [];
    for (const line of section.split('\n')) {
      const m = line.match(/^y(\d+)\s+(\S+)\s*$/);
      if (m) rows[Number(m[1])] = m[2];
    }
    if (rows.length) out[id] = rows;
  }
  return out;
}

describe('lvl02.ts × docs/niveis/LVL-02.md', () => {
  const doc = gridsDoDocumento(readFileSync(DOC, 'utf8'));

  it('o documento tem as 8 salas', () => {
    expect(Object.keys(doc).sort()).toEqual(LVL02.map((r) => r.id).sort());
  });

  it('cada grade do código é idêntica à grade publicada', () => {
    for (const room of LVL02) {
      expect(room.grid, `grade divergente em ${room.id}`).toEqual(doc[room.id]);
    }
  });
});
