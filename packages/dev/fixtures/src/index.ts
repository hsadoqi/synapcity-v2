import { Faker, base, en } from '@faker-js/faker';
import { LayoutDashboard, type LucideIcon } from 'lucide-react';
/*
 * Seeded fake data for tests, stories and local development. Generic
 * primitives, plus a named factory for each accepted domain contract: Space
 * (ADR-0012) has `createSpaceEntity`, built on `@synapcity/domain-records`.
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

export type CommonEntityProps = {
  id: string;
  title: string;
  icon: LucideIcon;
  ownerId: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export const defaultCommonEntityProps: CommonEntityProps = {
  id: '',
  title: 'Untitled',
  icon: LayoutDashboard,
  ownerId: '',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export type Workspace = CommonEntityProps & {
  category: string;
};

export const exampleCategories = [
  'Design',
  'Development',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Operations',
  'Support',
  'Legal',
  'IT',
];

export type Document = CommonEntityProps & {
  content?: string;
};

export type Dashboard = CommonEntityProps & {
  widgets: string[];
};

export function createFixtures(seed: number = DEFAULT_SEED) {
  const faker = new Faker({ locale: [en, base] });
  faker.seed(seed);
  faker.setDefaultRefDate(REFERENCE_DATE);

  const defaultFixtures = {
    id: faker.string.uuid(),
    ownerId: faker.string.uuid(),
    icon: LayoutDashboard,
    tags: faker.helpers.arrayElements(['tag1', 'tag2', 'tag3', 'tag4'], {
      min: 0,
      max: 3,
    }),
    title: faker.lorem.words({ min: 2, max: 6 }),
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 30 }),
    deletedAt: null,
  };
  return {
    id: (): string => faker.string.uuid(),
    person: (overrides: Partial<Person> = {}): Person => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      ...overrides,
    }),
    title: (): string => faker.lorem.words({ min: 2, max: 6 }),
    paragraph: (): string => faker.lorem.paragraph(),
    recent: (): Date => faker.date.recent({ days: 30 }),
    list: <T>(count: number, factory: () => T): T[] =>
      Array.from({ length: count }, factory),
    workspace: (overrides: Partial<Workspace> = {}): Workspace => ({
      ...defaultFixtures,
      category: faker.helpers.arrayElement(exampleCategories),
      ...overrides,
    }),
    document: (overrides: Partial<Document> = {}): Document => ({
      ...defaultFixtures,
      content: faker.lorem.paragraphs({ min: 1, max: 5 }),
      ...overrides,
    }),
    dashboard: (overrides: Partial<Dashboard> = {}): Dashboard => ({
      ...defaultFixtures,
      widgets: [],
      ...overrides,
    }),
  };
}

export type Fixtures = ReturnType<typeof createFixtures>;

export { createSpaceEntity } from './spaces';
