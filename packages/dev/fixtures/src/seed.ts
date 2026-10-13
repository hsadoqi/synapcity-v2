import { DEFAULT_SEED, createFixtures, type Person } from './index.ts';

/*
 * The seed file's content. Generic placeholders: the shape follows the
 * accepted data model once there is one, so this holds no domain entity yet.
 */
export type Seed = {
  seed: number;
  people: Person[];
};

export const PEOPLE_COUNT = 10;

export function buildSeed(seed: number = DEFAULT_SEED): Seed {
  const fx = createFixtures(seed);
  return { seed, people: fx.list(PEOPLE_COUNT, fx.person) };
}

export function serializeSeed(seed: Seed): string {
  return `${JSON.stringify(seed, null, 2)}\n`;
}
