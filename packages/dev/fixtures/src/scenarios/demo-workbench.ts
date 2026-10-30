import { Faker, base, en } from '@faker-js/faker';
import { baseRecordSchema, type BaseRecord } from '@synapcity/domain-records';
import { spaceSchema, type SpaceEntity } from '@synapcity/domain-spaces';

import {
  item,
  membership,
  person,
  space,
  type Membership,
  type Scenario,
} from './scenario';

/*
 * One person with enough content to show how a workbench behaves: five Spaces
 * of different sizes (two large, one medium, one small, one empty), Documents
 * and Dashboards filed in them, a few items filed in more than one Space
 * (ADR-0013: zero, one or many), and a few filed nowhere. Item names are
 * curated so the sidebar reads like a real one; a seeded Faker only decides
 * what the names cannot: when each item was made and opened, which are pinned,
 * and which are also filed elsewhere. Ids come from names (`stableId`) and the
 * Faker seed is fixed, so the graph is identical on every run.
 *
 * This is not in the scenario registry on purpose: the registry's shared tests
 * require every name to appear in `supabase/seed.sql`, and this is presentation
 * data for stories and local development, not a mirror of the database sample.
 */

export const DEMO_WORKBENCH = 'demo-workbench';
const FAKER_SEED = 7;
const REFERENCE_DATE = new Date('2026-10-01T09:00:00.000Z');

type SpaceSpec = {
  key: string;
  name: string;
  description?: string;
  icon: string;
  tags: string[];
  documents: string[];
  dashboards: string[];
};

const SPACES: SpaceSpec[] = [
  {
    key: 'writing',
    name: 'Writing',
    description: 'Ideas, drafts, and reference material for writing.',
    icon: 'pen-line',
    tags: ['writing'],
    documents: [
      'Essay outline',
      'First draft',
      'Opening lines',
      'Character sketches',
      'Interview notes',
      'Style guide',
      'Revision checklist',
      'Pitch to editor',
      'Reading list',
      'Newsletter issue 12',
      'Newsletter issue 13',
      'Quotes worth keeping',
    ],
    dashboards: ['Writing progress', 'Submission tracker', 'Reading pace'],
  },
  {
    key: 'product-launch',
    name: 'Product launch',
    description: 'Everything for the autumn release, from scope to retro.',
    icon: 'rocket',
    tags: ['work', 'launch'],
    documents: [
      'Launch plan',
      'Scope and non-goals',
      'Release notes draft',
      'Messaging brief',
      'Pricing options',
      'Customer interview synthesis',
      'Q4 customer interview synthesis and follow-up questions for the pricing experiment',
      'Risk register',
      'Go/no-go checklist',
      'Support runbook',
      'Retro',
    ],
    dashboards: [
      'Launch readiness',
      'Signups this week',
      'Open blockers',
      'Support volume',
    ],
  },
  {
    key: 'research',
    name: 'Research',
    description: 'Papers, experiments, and half-formed hypotheses.',
    icon: 'flask-conical',
    tags: ['research'],
    documents: [
      'Hypotheses',
      'Experiment log',
      'Paper summary: attention',
      'Paper summary: retrieval',
      'Methods notes',
      'Open questions',
      'Reviewer comments',
      'Glossary',
    ],
    dashboards: ['Experiment results', 'Reading queue'],
  },
  {
    key: 'health',
    name: 'Health',
    description: 'Training, sleep, and the habits behind them.',
    icon: 'heart-pulse',
    tags: ['health', 'personal'],
    documents: ['Training plan', 'Meal ideas', 'Sleep notes'],
    dashboards: ['Weekly habits'],
  },
  {
    key: 'home',
    name: 'Home',
    description: 'Nothing filed here yet.',
    icon: 'house',
    tags: ['personal'],
    documents: [],
    dashboards: [],
  },
];

/** Documents and Dashboards that belong to no Space. */
const UNFILED_DOCUMENTS = ['Loose thought', 'Idea for later', 'Untitled'];
const UNFILED_DASHBOARDS = ['Scratch dashboard'];

const DOCUMENT_ICONS = [
  'file-text',
  'notebook-pen',
  'book-open',
  'scroll-text',
];
const DASHBOARD_ICONS = ['layout-dashboard', 'chart-line', 'gauge'];

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function demoWorkbench(): Scenario {
  const faker = new Faker({ locale: [en, base] });
  faker.seed(FAKER_SEED);
  faker.setDefaultRefDate(REFERENCE_DATE);

  const owner = person(DEMO_WORKBENCH, 'a', 'Ada Example');
  const make = { scenario: DEMO_WORKBENCH, owner };

  /** When a record was made, last changed, pinned and opened; always ordered. */
  function lifecycle() {
    const created = faker.date.recent({ days: 120, refDate: REFERENCE_DATE });
    const updated = faker.date.between({ from: created, to: REFERENCE_DATE });
    const opened = faker.helpers.maybe(
      () => faker.date.between({ from: updated, to: REFERENCE_DATE }),
      { probability: 0.65 },
    );
    const pinned = faker.helpers.maybe(() => updated, { probability: 0.15 });
    return {
      createdAt: created.toISOString(),
      updatedAt: updated.toISOString(),
      lastViewedAt: opened ? opened.toISOString() : null,
      pinnedAt: pinned ? pinned.toISOString() : null,
    };
  }

  function document(name: string, tags: string[]): BaseRecord {
    const record = item({
      ...make,
      kind: 'document',
      key: slug(name),
      name,
      icon: faker.helpers.arrayElement(DOCUMENT_ICONS),
      tags,
      minute: 0,
    });
    return baseRecordSchema.parse({ ...record, ...lifecycle() });
  }

  function dashboard(name: string, tags: string[]): BaseRecord {
    const record = item({
      ...make,
      kind: 'dashboard',
      key: slug(name),
      name,
      icon: faker.helpers.arrayElement(DASHBOARD_ICONS),
      tags,
      minute: 0,
    });
    return baseRecordSchema.parse({ ...record, ...lifecycle() });
  }

  const spaces: SpaceEntity[] = [];
  const documents: BaseRecord[] = [];
  const dashboards: BaseRecord[] = [];
  const memberships: Membership[] = [];

  SPACES.forEach((spec, index) => {
    const created = space({
      ...make,
      key: spec.key,
      name: spec.name,
      ...(spec.description !== undefined && { description: spec.description }),
      icon: spec.icon,
      tags: spec.tags,
      minute: index,
    });
    spaces.push(spaceSchema.parse({ ...created, ...lifecycle() }));

    for (const name of spec.documents) {
      const doc = document(name, spec.tags);
      documents.push(doc);
      memberships.push(membership(owner, 'document', created.id, doc.id));
    }
    for (const name of spec.dashboards) {
      const dash = dashboard(name, spec.tags);
      dashboards.push(dash);
      memberships.push(membership(owner, 'dashboard', created.id, dash.id));
    }
  });

  // A few items are also filed in a second Space, so "many" is visible: the
  // same Document shows up under both, and removing it from one keeps the other.
  // Only Spaces that already hold something qualify, so the empty one stays empty.
  const spaceIds = [...new Set(memberships.map((m) => m.spaceId))];
  const homeOf = new Map(memberships.map((m) => [m.itemId, m.spaceId]));
  for (const [kind, records] of [
    ['document', documents],
    ['dashboard', dashboards],
  ] as const) {
    for (const record of records) {
      const home = homeOf.get(record.id)!;
      const other = faker.helpers.maybe(
        () => faker.helpers.arrayElement(spaceIds.filter((id) => id !== home)),
        { probability: 0.12 },
      );
      if (other) memberships.push(membership(owner, kind, other, record.id));
    }
  }

  for (const name of UNFILED_DOCUMENTS) documents.push(document(name, []));
  for (const name of UNFILED_DASHBOARDS) dashboards.push(dashboard(name, []));

  return {
    name: DEMO_WORKBENCH,
    users: [owner],
    spaces,
    documents,
    dashboards,
    memberships,
  };
}
