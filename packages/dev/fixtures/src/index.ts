import { Faker, base, en } from '@faker-js/faker';

/*
 * Seeded fake data for tests, stories and local development. Generic
 * primitives only: no Synapcity domain entity is modelled here, because the
 * data model is undecided (docs/architecture/decisions/README.md). Add a
 * named factory once an entity is accepted.
 *
 * Each call to `createFixtures` builds its own `Faker` instance, so one
 * consumer cannot change another's sequence through shared global state. The
 * reference date is fixed so relative dates (`recent`) are reproducible.
 */
export const DEFAULT_SEED = 1;
const REFERENCE_DATE = new Date('2026-01-01T00:00:00.000Z');

export type Person = {
  id: string;
  name: string;
  email: string;
  password: string; // optional for testing, but not in production
};

export function createFixtures(seed: number = DEFAULT_SEED) {
  const faker = new Faker({ locale: [en, base] });
  faker.seed(seed);
  faker.setDefaultRefDate(REFERENCE_DATE);

  return {
    id: (): string => faker.string.uuid(),
    person: (overrides: Partial<Person> = {}): Person => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: faker.internet.password(),
      ...overrides,
    }),
    title: (): string => faker.lorem.words({ min: 2, max: 6 }),
    paragraph: (): string => faker.lorem.paragraph(),
    recent: (): Date => faker.date.recent({ days: 30 }),
    list: <T>(count: number, factory: () => T): T[] =>
      Array.from({ length: count }, factory),
  };
}

export type Fixtures = ReturnType<typeof createFixtures>;
