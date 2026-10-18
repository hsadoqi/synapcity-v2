import { spaceSchema } from '../../../shared/schema';
import type { Space } from '../../../shared/types';

/** Sample data for tests and previews; these are not saved workspace records. */
export const SPACE_FIXTURES: readonly Space[] = [
  {
    id: 'fixture-space-writing',
    ownerId: '11111111-1111-4111-8111-111111111111',
    name: 'Writing',
    icon: 'pen-line',
    description: 'Ideas, drafts, and reference material for writing.',
    tags: ['writing', 'ideas'],
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-03T14:30:00Z',
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
  },
  {
    id: 'fixture-space-personal',
    ownerId: '11111111-1111-4111-8111-111111111111',
    name: 'Personal',
    icon: 'house',
    tags: [],
    createdAt: '2026-10-05T08:00:00Z',
    updatedAt: '2026-10-05T08:00:00Z',
  },
];

/** A fresh deterministic record on each call, validated like incoming data. */
export function createSpaceFixture(overrides: Partial<Space> = {}): Space {
  return spaceSchema.parse({
    id: 'fixture-space-writing',
    ownerId: '11111111-1111-4111-8111-111111111111',
    name: 'Writing',
    icon: 'pen-line',
    description: 'Ideas, drafts, and reference material for writing.',
    tags: ['writing', 'ideas'],
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-03T14:30:00Z',
    ...overrides,
  });
}
