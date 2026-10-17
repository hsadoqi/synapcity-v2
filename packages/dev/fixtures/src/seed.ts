import { fileURLToPath } from 'node:url';
import { createFixtures, type Fixtures } from './index.ts';

// The checked-in seed files use 42; generic fixture consumers keep their default.
const SEED_FILE_SEED = 42;

/*
 * One entry per seed file: the key is the file name (`seed/<name>.json`) and
 * the value builds its rows from a seeded `Fixtures`. To add a kind of seed,
 * add an entry and run `pnpm --filter @synapcity/dev-fixtures generate`.
 * Entries stay generic until the data model is accepted.
 */
export const seedDefinitions = {
  users: (fx: Fixtures) => fx.list(10, fx.person),
  workspaces: (fx: Fixtures) => fx.list(20, fx.workspace),
  documents: (fx: Fixtures) => fx.list(20, fx.document),
  dashboards: (fx: Fixtures) => fx.list(20, fx.dashboard),
} satisfies Record<string, (fx: Fixtures) => unknown[]>;

export type SeedName = keyof typeof seedDefinitions;

export const seedNames = Object.keys(seedDefinitions) as SeedName[];

export function isSeedName(name: string): name is SeedName {
  return Object.hasOwn(seedDefinitions, name);
}

export function buildSeed<N extends SeedName>(
  name: N,
  seed: number = SEED_FILE_SEED,
): ReturnType<(typeof seedDefinitions)[N]> {
  return seedDefinitions[name](createFixtures(seed)) as ReturnType<
    (typeof seedDefinitions)[N]
  >;
}

export function seedPath(name: SeedName): string {
  return fileURLToPath(new URL(`../seed/${name}.json`, import.meta.url));
}

export function serializeSeed(rows: unknown[]): string {
  return `${JSON.stringify(rows, null, 2)}\n`;
}
