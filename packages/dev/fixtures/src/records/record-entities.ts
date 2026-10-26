import { dashboardSchema } from '@synapcity/domain-dashboards';
import type { DashboardEntity } from '@synapcity/domain-dashboards';
import { documentSchema } from '@synapcity/domain-documents';
import type { DocumentEntity } from '@synapcity/domain-documents';

const OWNER_ID = '11111111-1111-4111-8111-111111111111';

/**
 * A document record for tests and stories: a fresh, deterministic copy on each
 * call, validated like incoming data, so an override that breaks the contract
 * throws instead of producing a record the app would never see.
 */
export function createDocumentEntity(
  overrides: Partial<DocumentEntity> = {},
): DocumentEntity {
  return documentSchema.parse({
    id: 'fixture-document-launch-plan',
    ownerId: OWNER_ID,
    name: 'Launch plan',
    icon: 'notebook',
    description: 'Steps, owners, and dates for the spring launch.',
    tags: ['work', 'planning'],
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-03T14:30:00Z',
    ...overrides,
  });
}

/** A dashboard record for tests and stories, made the same way. */
export function createDashboardEntity(
  overrides: Partial<DashboardEntity> = {},
): DashboardEntity {
  return dashboardSchema.parse({
    id: 'fixture-dashboard-weekly-review',
    ownerId: OWNER_ID,
    name: 'Weekly review',
    icon: 'layout-dashboard',
    description: 'What moved this week and what is next.',
    tags: ['planning'],
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-03T14:30:00Z',
    ...overrides,
  });
}
