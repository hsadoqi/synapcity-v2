import { spaceSchema } from '@synapcity/domain-spaces';
import type { SpaceEntity } from '@synapcity/domain-spaces';

/**
 * A Space record for tests and stories: a fresh, deterministic copy on each
 * call, validated like incoming data, so an override that breaks the contract
 * throws instead of producing a record the app would never see.
 */
export function createSpaceEntity(
  overrides: Partial<SpaceEntity> = {},
): SpaceEntity {
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
