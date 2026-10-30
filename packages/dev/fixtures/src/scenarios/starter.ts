import {
  item,
  membership,
  person,
  space,
  type Scenario,
  type ScenarioUser,
} from './scenario';

/**
 * What one person starts with: the three starter Spaces, four Documents (one
 * filed nowhere, to show an item that is not in any Space), two Dashboards, and
 * where they are filed. It mirrors the development sample in `supabase/seed.sql`
 * (Writing, Learning, Personal), which the local seeder replaces; the Personal
 * Space is empty on purpose.
 */
export function starterFor(scenario: string, owner: ScenarioUser) {
  const make = { scenario, owner };
  const writing = space({
    ...make,
    key: 'writing',
    name: 'Writing',
    description: 'Ideas, drafts, and reference material for writing.',
    icon: 'pen-line',
    tags: ['writing', 'ideas'],
    minute: 0,
  });
  const learning = space({
    ...make,
    key: 'learning',
    name: 'Learning',
    description: 'Notes and resources for things I want to understand.',
    icon: 'book-open',
    tags: ['learning'],
    minute: 1,
  });
  const personal = space({
    ...make,
    key: 'personal',
    name: 'Personal',
    icon: 'house',
    minute: 2,
  });

  const outline = item({
    ...make,
    kind: 'document',
    key: 'outline',
    name: 'Outline',
    description: 'The shape of the piece, one heading at a time.',
    icon: 'file-text',
    tags: ['writing'],
    minute: 10,
  });
  const draft = item({
    ...make,
    kind: 'document',
    key: 'first-draft',
    name: 'First draft',
    description: 'Rough pages to come back to.',
    icon: 'notebook-pen',
    tags: ['writing'],
    minute: 11,
  });
  const reading = item({
    ...make,
    kind: 'document',
    key: 'reading-notes',
    name: 'Reading notes',
    description: 'Quotes and ideas from what I am reading.',
    icon: 'book-open',
    tags: ['learning'],
    minute: 12,
  });
  const loose = item({
    ...make,
    kind: 'document',
    key: 'loose-thought',
    name: 'Loose thought',
    description: 'A note that is not in any Space yet.',
    icon: 'lightbulb',
    minute: 13,
  });

  const progress = item({
    ...make,
    kind: 'dashboard',
    key: 'writing-progress',
    name: 'Writing progress',
    description: 'Pages written and drafts finished.',
    icon: 'chart-line',
    tags: ['writing'],
    minute: 20,
  });
  const study = item({
    ...make,
    kind: 'dashboard',
    key: 'study-plan',
    name: 'Study plan',
    description: 'What to learn next, and how it is going.',
    icon: 'layout-dashboard',
    tags: ['learning'],
    minute: 21,
  });

  return {
    spaces: [writing, learning, personal],
    documents: [outline, draft, reading, loose],
    dashboards: [progress, study],
    memberships: [
      membership(owner, 'document', writing.id, outline.id),
      membership(owner, 'document', writing.id, draft.id),
      membership(owner, 'dashboard', writing.id, progress.id),
      membership(owner, 'document', learning.id, reading.id),
      membership(owner, 'dashboard', learning.id, study.id),
    ],
  };
}

/** Two people, each with the starter set. They never share a record or an edge. */
export function starter(): Scenario {
  const name = 'starter';
  const users = [
    person(name, 'a', 'Ada Example'),
    person(name, 'b', 'Grace Example'),
  ];
  const parts = users.map((user) => starterFor(name, user));
  return {
    name,
    users,
    spaces: parts.flatMap((p) => p.spaces),
    documents: parts.flatMap((p) => p.documents),
    dashboards: parts.flatMap((p) => p.dashboards),
    memberships: parts.flatMap((p) => p.memberships),
  };
}
