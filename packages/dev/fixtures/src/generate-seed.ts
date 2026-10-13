import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeed, serializeSeed } from './seed.ts';

/*
 * `pnpm --filter @synapcity/dev-fixtures generate [seed]` rewrites
 * seed/seed.json. Run it after changing a factory, then commit the result.
 */
export const SEED_FILE = fileURLToPath(
  new URL('../seed/seed.json', import.meta.url),
);

const arg = process.argv[2];
const seed = arg === undefined ? undefined : Number(arg);
if (seed !== undefined && !Number.isInteger(seed)) {
  throw new Error(`Seed must be an integer, received "${arg}"`);
}

mkdirSync(dirname(SEED_FILE), { recursive: true });
writeFileSync(SEED_FILE, serializeSeed(buildSeed(seed)));
console.log(`Wrote ${SEED_FILE}`);
