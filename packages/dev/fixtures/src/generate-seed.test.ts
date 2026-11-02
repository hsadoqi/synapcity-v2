import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { describe, it } from 'vitest';
import {
  buildSeed,
  isSeedName,
  seedNames,
  seedPath,
  serializeSeed,
} from './seed.ts';

/*
 * `pnpm --filter @synapcity/dev-fixtures generate` rewrites every seed/<name>.json.
 * Narrow it with `SEED_NAME=users` and use another RNG seed with `SEED=7`. Run it
 * after changing a factory or a definition, then commit the result.
 *
 * It is a Vitest file, and skipped unless SEED_GENERATE is set, because the
 * factories import the domain packages' TypeScript source, which Vitest resolves
 * and plain `node` does not.
 */
const generate = process.env.SEED_GENERATE === '1';
const nameArg = process.env.SEED_NAME;
const seedArg = process.env.SEED;

describe.skipIf(!generate)('generate seed files', () => {
  it('writes the seed files', () => {
    if (nameArg !== undefined && !isSeedName(nameArg)) {
      throw new Error(
        `Unknown seed "${nameArg}". Known seeds: ${seedNames.join(', ')}`,
      );
    }
    const seed = seedArg === undefined ? undefined : Number(seedArg);
    if (seed !== undefined && !Number.isInteger(seed)) {
      throw new Error(`Seed must be an integer, received "${seedArg}"`);
    }
    for (const name of nameArg === undefined ? seedNames : [nameArg]) {
      const file = seedPath(name);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, serializeSeed(buildSeed(name, seed)));
      console.log(`Wrote ${file}`);
    }
  });
});
