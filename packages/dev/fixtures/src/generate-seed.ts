import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  buildSeed,
  isSeedName,
  seedNames,
  seedPath,
  serializeSeed,
} from './seed.ts';

/*
 * `pnpm --filter @synapcity/dev-fixtures generate [name] [seed]` rewrites
 * seed/<name>.json, or every seed when no name is given. Run it after changing
 * a factory or a definition, then commit the result.
 */
const [nameArg, seedArg] = process.argv.slice(2);

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
