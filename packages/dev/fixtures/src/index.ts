import { Faker, base, en } from '@faker-js/faker';
import { baseRecordSchema, type BaseRecord } from '@synapcity/domain-records';
import { spaceSchema, type SpaceEntity } from '@synapcity/domain-spaces';

/*
 * Seeded fake data for tests, stories and local development. Generic
 * primitives, plus a contract-backed factory for each owned record: a Space
 * (`space`, checked by `spaceSchema`) and the Document and Dashboard base
 * records (`documentRecord`, `dashboardRecord`, checked by `baseRecordSchema`).
 * Every call builds a fresh object with its own id, so records never alias,
 * and the result is parsed by the domain schema, so a fixture that breaks the
 * contract throws instead of reaching a test as a shape the app never sees.
 * Add a factory when another entity's contract is accepted.
 *
 * Each call to `createFixtures` builds its own `Faker` instance, so one
 * consumer cannot change another's sequence through shared global state. The
 * reference date is fixed so relative dates (`recent`) are reproducible.
 */
export const DEFAULT_SEED = 1;
const REFERENCE_DATE = new Date('2026-01-01T00:00:00.000Z');

/*
 * No password field, on purpose: committed seed JSON with a `password` key
 * trips the CI secret scan (gitleaks `generic-api-key`) however fake the value
 * is. Tests that need a password should set one inline, as an override.
 */
export type Person = {
  id: string;
  name: string;
  email: string;
};

/** Lucide identifiers (kebab-case strings, never components), as persisted. */
const ICON_NAMES = [
  'layout-dashboard',
  'file-text',
  'folder',
  'pen-line',
  'book-open',
  'user',
  'briefcase',
  'lightbulb',
];
const TAG_POOL = ['ideas', 'work', 'reading', 'draft', 'archive', 'personal'];

export type FixtureOwner = { ownerId: string };

export function createFixtures(seed: number = DEFAULT_SEED) {
  const faker = new Faker({ locale: [en, base] });
  faker.seed(seed);
  faker.setDefaultRefDate(REFERENCE_DATE);

  // One owner per Fixtures instance, so records built together belong together.
  // An override picks another owner.
  const defaultOwnerId = faker.string.uuid();

  function words(min: number, max: number): string {
    const text = faker.lorem.words({ min, max });
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /** The fields every owned record shares, fresh on each call. */
  function recordFields() {
    const createdAt = faker.date.past({ years: 1 });
    // Never before createdAt, never after the reference date.
    const updatedAt = faker.date.between({
      from: createdAt,
      to: REFERENCE_DATE,
    });
    return {
      id: faker.string.uuid(),
      ownerId: defaultOwnerId,
      name: words(2, 4),
      description: faker.lorem.sentence(),
      icon: faker.helpers.arrayElement(ICON_NAMES),
      tags: faker.helpers.arrayElements(TAG_POOL, { min: 0, max: 3 }),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  }

  function assertOrdered(record: { createdAt: string; updatedAt: string }) {
    if (Date.parse(record.createdAt) > Date.parse(record.updatedAt)) {
      throw new Error(
        'A fixture record cannot be updated before it was created.',
      );
    }
  }

  return {
    id: (): string => faker.string.uuid(),
    person: (overrides: Partial<Person> = {}): Person => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      // The reserved `.test` TLD: no fixture address can reach a real mailbox.
      email: `${faker.string.alphanumeric({ length: 10, casing: 'lower' })}@synapcity.test`,
      ...overrides,
    }),
    title: (): string => faker.lorem.words({ min: 2, max: 6 }),
    paragraph: (): string => faker.lorem.paragraph(),
    recent: (): Date => faker.date.recent({ days: 30 }),
    list: <T>(count: number, factory: () => T): T[] =>
      Array.from({ length: count }, () => factory()),
    space: (overrides: Partial<SpaceEntity> = {}): SpaceEntity => {
      const space = spaceSchema.parse({ ...recordFields(), ...overrides });
      assertOrdered(space);
      return space;
    },
    documentRecord: (overrides: Partial<BaseRecord> = {}): BaseRecord => {
      const record = baseRecordSchema.parse({
        ...recordFields(),
        ...overrides,
      });
      assertOrdered(record);
      return record;
    },
    dashboardRecord: (overrides: Partial<BaseRecord> = {}): BaseRecord => {
      const record = baseRecordSchema.parse({
        ...recordFields(),
        ...overrides,
      });
      assertOrdered(record);
      return record;
    },
  };
}

export type Fixtures = ReturnType<typeof createFixtures>;

/*
 * Stand-alone factories for a test that does not care about the seed. They
 * share one default instance, so successive calls give different ids; the
 * sequence is the same in every process that starts from the same call order.
 * `resetDefaultFixtures` restarts it.
 */
let defaults = createFixtures();

export function resetDefaultFixtures(seed: number = DEFAULT_SEED): void {
  defaults = createFixtures(seed);
}

export const createPerson = (overrides?: Partial<Person>): Person =>
  defaults.person(overrides);
export const createSpace = (overrides?: Partial<SpaceEntity>): SpaceEntity =>
  defaults.space(overrides);
export const createDocumentRecord = (
  overrides?: Partial<BaseRecord>,
): BaseRecord => defaults.documentRecord(overrides);
export const createDashboardRecord = (
  overrides?: Partial<BaseRecord>,
): BaseRecord => defaults.dashboardRecord(overrides);

export { createSpaceEntity } from './spaces';
