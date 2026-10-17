import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildSeed,
  isSeedName,
  seedNames,
  seedPath,
  serializeSeed,
} from './seed.ts';

describe.each(seedNames)('seed file "%s"', (name) => {
  it('matches what the generator produces', () => {
    expect(
      JSON.parse(readFileSync(seedPath(name), 'utf8')),
      'run `pnpm --filter @synapcity/dev-fixtures generate`',
    ).toEqual(JSON.parse(serializeSeed(buildSeed(name))));
  });

  it('changes with the seed', () => {
    expect(buildSeed(name, 2)).not.toEqual(buildSeed(name, 1));
  });
});

describe('isSeedName', () => {
  it('accepts defined names only', () => {
    expect(isSeedName('users')).toBe(true);
    expect(isSeedName('nope')).toBe(false);
    expect(isSeedName('toString')).toBe(false);
  });
});
