import { baseRecordSchema } from '@synapcity/domain-records';
import type { BaseRecord, SpaceEntity } from '@synapcity/domain-records';

/*
 * Fixture-mode data (ADR-0006, development amendment; design Q6): what the demo
 * source answers with when there is no session or database. Never shown to a
 * real user. Tests and stories use `createSpaceEntity` from dev-fixtures instead.
 */

const DEMO_OWNER = '11111111-1111-4111-8111-111111111111';

/** The sample Spaces. */
export const DEMO_SPACES: readonly SpaceEntity[] = [
  {
    id: 'fixture-space-writing',
    ownerId: '11111111-1111-4111-8111-111111111111',
    name: 'Writing',
    icon: 'pen-line',
    description: 'Ideas, drafts, and reference material for writing.',
    tags: ['writing', 'ideas'],
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-03T14:30:00Z',
    pinnedAt: '2026-10-04T09:00:00Z',
    lastViewedAt: '2026-10-03T14:30:00Z',
  },
  {
    id: 'fixture-space-learning',
    ownerId: '11111111-1111-4111-8111-111111111111',
    name: 'Learning',
    icon: 'book-open',
    description: 'Notes and resources for things I want to understand.',
    tags: ['learning'],
    createdAt: '2026-10-02T10:00:00Z',
    updatedAt: '2026-10-04T11:00:00Z',
    pinnedAt: null,
    lastViewedAt: '2026-10-05T18:00:00Z',
  },
  {
    id: 'fixture-space-personal',
    ownerId: '11111111-1111-4111-8111-111111111111',
    name: 'Personal',
    icon: 'house',
    tags: [],
    createdAt: '2026-10-05T08:00:00Z',
    updatedAt: '2026-10-05T08:00:00Z',
    pinnedAt: null,
    lastViewedAt: null,
  },
  {
    id: 'fixture-space-client-work',
    ownerId: '11111111-1111-4111-8111-111111111111',
    name: 'Client work',
    icon: 'briefcase',
    description: 'Proposals, meeting notes, and status boards.',
    tags: ['work'],
    createdAt: '2026-09-20T09:00:00Z',
    updatedAt: '2026-10-01T16:00:00Z',
    pinnedAt: '2026-10-02T09:00:00Z',
    lastViewedAt: '2026-10-04T10:00:00Z',
  },
  {
    id: 'fixture-space-health',
    ownerId: '11111111-1111-4111-8111-111111111111',
    name: 'Health',
    icon: 'heart',
    description: 'Training log, appointments, and sleep notes.',
    tags: ['personal', 'tracking'],
    createdAt: '2026-09-15T07:00:00Z',
    updatedAt: '2026-09-28T07:30:00Z',
    pinnedAt: null,
    lastViewedAt: '2026-10-02T07:00:00Z',
  },
  {
    id: 'fixture-space-trips',
    ownerId: '11111111-1111-4111-8111-111111111111',
    name: 'Trips',
    icon: 'plane',
    tags: ['personal', 'planning'],
    createdAt: '2026-09-05T12:00:00Z',
    updatedAt: '2026-09-12T12:00:00Z',
    pinnedAt: null,
    lastViewedAt: null,
  },
  {
    id: 'fixture-space-recipes',
    ownerId: '11111111-1111-4111-8111-111111111111',
    name: 'Recipes',
    icon: 'coffee',
    description: 'Things worth cooking again, and what went wrong last time.',
    tags: ['personal'],
    createdAt: '2026-08-30T18:00:00Z',
    updatedAt: '2026-09-02T18:00:00Z',
    pinnedAt: null,
    lastViewedAt: null,
  },
];

/** A sample document or dashboard as the base record the source returns. */
const demoRecord = (
  id: string,
  name: string,
  icon: string,
  description?: string,
): BaseRecord =>
  baseRecordSchema.parse({
    id,
    ownerId: DEMO_OWNER,
    name,
    description,
    icon,
    tags: [],
    createdAt: '2026-10-05T08:00:00Z',
    updatedAt: '2026-10-05T08:00:00Z',
  });

/** Stand-ins for participation, so the detail page can be built and browsed. */
export const DEMO_DOCUMENTS: readonly BaseRecord[] = [
  demoRecord('doc1', 'Document 1', 'document', 'This is the first document.'),
  demoRecord('doc2', 'Document 2', 'document'),
];

export const DEMO_DASHBOARDS: readonly BaseRecord[] = [
  demoRecord('dash1', 'Dashboard 1', 'boxes', 'This is the first dashboard.'),
  demoRecord('dash2', 'Dashboard 2', 'boxes', 'This is the second dashboard.'),
];
