/** A grade de `lvl04.ts` tem que ser idêntica à publicada em `docs/niveis/LVL-04.md` §4. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LVL04 } from './lvl04';

const DOC = fileURLToPath(new URL('../../../../docs/niveis/LVL-04.md', import.meta.url));

function gridsDoDocumento(md: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const secao of md.split(/^### 4\.\d+ /m).slice(1)) {
    const id = secao.match(/^(L04-\d\d)/)?.[1];
    if (!id) continue;
    const rows: string[] = [];
    for (const linha of secao.split('\n')) {
      const m = linha.match(/^y(\d+)\s+(\S+)\s*$/);
      if (m) rows[Number(m[1])] = m[2];
    }
    if (rows.length) out[id] = rows;
  }
  return out;
}

describe('lvl04.ts × docs/niveis/LVL-04.md', () => {
  const doc = gridsDoDocumento(readFileSync(DOC, 'utf8'));

  it('o documento tem as 5 salas', () => {
    expect(Object.keys(doc).sort()).toEqual(LVL04.map((r) => r.id).sort());
  });

  it('cada grade do código é idêntica à grade publicada', () => {
    for (const room of LVL04) expect(room.grid, `divergente em ${room.id}`).toEqual(doc[room.id]);
  });
});
