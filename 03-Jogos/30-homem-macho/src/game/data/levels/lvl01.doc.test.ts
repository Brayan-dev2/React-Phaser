/**
 * Guarda-corpo de documentação: a grade de `lvl01.ts` tem que ser idêntica à de
 * `docs/niveis/LVL-01.md` §4. Sem isso, o código e o GDD divergem em silêncio —
 * foi assim que o glifo de item entrou num e não no outro.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LVL01 } from './lvl01';

const DOC = fileURLToPath(new URL('../../../../docs/niveis/LVL-01.md', import.meta.url));

/** Extrai, por sala, as linhas `y0 … y10` dos blocos de código do documento. */
function gridsDoDocumento(md: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const sections = md.split(/^### 4\.\d+ /m).slice(1);
  for (const section of sections) {
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

describe('lvl01.ts × docs/niveis/LVL-01.md', () => {
  const doc = gridsDoDocumento(readFileSync(DOC, 'utf8'));

  it('o documento tem as 6 salas', () => {
    expect(Object.keys(doc).sort()).toEqual(LVL01.map((r) => r.id).sort());
  });

  it('cada grade do código é idêntica à grade publicada', () => {
    for (const room of LVL01) {
      expect(doc[room.id], `sala ${room.id} ausente no documento`).toBeDefined();
      expect(room.grid, `grade divergente em ${room.id}`).toEqual(doc[room.id]);
    }
  });
});
