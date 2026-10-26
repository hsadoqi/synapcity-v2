import { describe, expect, expectTypeOf, it } from 'vitest';

import type { z } from 'zod';

import type { DashboardEntity, DashboardSummary } from '../types';
import { dashboardSchema } from './index';

const savedDashboard = {
  id: 'fixture-dashboard-weekly-review',
  ownerId: '11111111-1111-4111-8111-111111111111',
  name: 'Weekly review',
  icon: 'layout-dashboard',
  tags: ['planning'],
  createdAt: '2026-10-14T09:00:00Z',
  updatedAt: '2026-10-17T16:20:00Z',
  pinnedAt: null,
  lastViewedAt: '2026-10-16T08:00:00Z',
};

describe('dashboardSchema', () => {
  it('parses a saved dashboard record', () => {
    expect(dashboardSchema.parse(savedDashboard)).toEqual(savedDashboard);
  });

  it('rejects a record without a name or with an invalid timestamp', () => {
    expect(() =>
      dashboardSchema.parse({ ...savedDashboard, name: '' }),
    ).toThrow();
    expect(() =>
      dashboardSchema.parse({ ...savedDashboard, updatedAt: 'later' }),
    ).toThrow();
  });

  it('types the entity as exactly what the schema parses', () => {
    expectTypeOf<DashboardEntity>().toEqualTypeOf<
      z.infer<typeof dashboardSchema>
    >();
  });

  it('types the summary as the saved record plus its Space count', () => {
    expectTypeOf<DashboardSummary>().toEqualTypeOf<
      DashboardEntity & { spacesTotal: number }
    >();
  });
});
