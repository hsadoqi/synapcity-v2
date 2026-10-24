import type { SpaceSummary } from '@synapcity/domain-records';
import { createSpaceEntity } from '@synapcity/dev-fixtures';

import type { Space } from '../contracts';

/** Story-only sample data. Not part of the package's public interface. */

export const sampleSummaries: SpaceSummary[] = [
  {
    ...createSpaceEntity({ pinnedAt: '2026-10-04T09:00:00Z' }),
    documentsTotal: 8,
    dashboardsTotal: 1,
  },
  {
    ...createSpaceEntity({
      id: 'fixture-space-learning',
      name: 'Learning',
      icon: 'book-open',
      description: 'Notes and resources for things I want to understand.',
      tags: ['learning'],
      lastViewedAt: '2026-10-05T18:00:00Z',
    }),
    documentsTotal: 2,
    dashboardsTotal: 0,
  },
  {
    ...createSpaceEntity({
      id: 'fixture-space-personal',
      name: 'Personal',
      icon: 'house',
      description: undefined,
      tags: [],
    }),
    documentsTotal: 0,
    dashboardsTotal: 0,
  },
];

const item = (
  id: string,
  name: string,
  kind: 'document' | 'dashboard',
  updatedAt: string,
) => ({
  id,
  name,
  icon: kind === 'document' ? 'file-text' : 'boxes',
  createdAt: '2026-10-01T08:00:00Z',
  updatedAt,
  kind,
});

export const sampleSpace: Space = {
  ...createSpaceEntity({ id: 's1' }),
  kind: 'space',
  documents: [
    item('d1', 'Outline', 'document', '2026-10-05T08:00:00Z'),
    item('d2', 'Reading notes', 'document', '2026-10-03T08:00:00Z'),
  ],
  dashboards: [item('b1', 'Progress', 'dashboard', '2026-10-04T08:00:00Z')],
  documentsTotal: 2,
  dashboardsTotal: 1,
};

export const sampleEmptySpace: Space = {
  ...sampleSpace,
  documents: [],
  dashboards: [],
  documentsTotal: 0,
  dashboardsTotal: 0,
};
