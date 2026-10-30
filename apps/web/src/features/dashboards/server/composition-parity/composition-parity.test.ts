import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createComposition } from '@synapcity/domain-dashboards';
import { COMPOSITION_SCHEMA_VERSION } from '@synapcity/server-data';
import { describe, expect, it } from 'vitest';

/*
 * The database holds two facts about compositions that the application also
 * knows. Neither can be checked by the type system, so these tests read the
 * migration files and compare:
 *
 *   - the default document the trigger inserts for every new Dashboard must
 *     equal `createComposition()` (INV-5);
 *   - the document versions the database accepts must be exactly the one this
 *     code reads and writes.
 *
 * Migrations are immutable once merged, so a change on either side needs a new
 * migration; this test is what makes forgetting it fail.
 */
const MIGRATIONS = fileURLToPath(
  new URL('../../../../../../../supabase/migrations/', import.meta.url),
);

function migration(suffix: string): string {
  const matches = readdirSync(MIGRATIONS).filter((f) => f.endsWith(suffix));
  expect(matches, `exactly one migration ending ${suffix}`).toHaveLength(1);
  return readFileSync(join(MIGRATIONS, matches[0]!), 'utf8');
}

describe('the default composition in the database', () => {
  const initialization = migration('_composition_initialization.sql');

  it('is the same document in the trigger function and in the backfill', () => {
    const literals = [
      ...initialization.matchAll(/'(\{"settings":.*?\})'::jsonb/g),
    ].map((m) => m[1]);
    expect(literals).toHaveLength(2);
    expect(literals[0]).toBe(literals[1]);
  });

  it('equals createComposition()', () => {
    const literal = /'(\{"settings":.*?\})'::jsonb/.exec(initialization)?.[1];
    expect(literal).toBeDefined();
    expect(JSON.parse(literal!)).toEqual(createComposition());
  });
});

describe('the document versions the database accepts', () => {
  it('are exactly COMPOSITION_SCHEMA_VERSION', () => {
    const integrity = migration('_composition_integrity.sql');
    const versions = /check \(schema_version in \(([\d,\s]+)\)\)/.exec(
      integrity,
    )?.[1];
    expect(versions).toBeDefined();
    expect(versions!.split(',').map((v) => Number(v.trim()))).toEqual([
      COMPOSITION_SCHEMA_VERSION,
    ]);
  });
});
