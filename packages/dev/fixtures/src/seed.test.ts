import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildSeed, serializeSeed } from './seed.ts';

describe('seed file', () => {
  it('matches what the generator produces', () => {
    const file = readFileSync(
      fileURLToPath(new URL('../seed/seed.json', import.meta.url)),
      'utf8',
    );
    expect(file, 'run `pnpm --filter @synapcity/dev-fixtures generate`').toBe(
      serializeSeed(buildSeed()),
    );
  });
});
