import { describe, expect, it } from 'vitest';
import { findEntityIcon } from '@synapcity/frontend-collection';

import { dashboardSchema } from '@synapcity/domain-dashboards';

import { DEMO_DASHBOARDS } from './demo-dashboards';

describe('demo dashboards', () => {
  it('provides valid sample records with distinct IDs', () => {
    expect(new Set(DEMO_DASHBOARDS.map((record) => record.id)).size).toBe(
      DEMO_DASHBOARDS.length,
    );
    for (const record of DEMO_DASHBOARDS) {
      expect(dashboardSchema.parse(record)).toMatchObject({ id: record.id });
    }
  });

  it('uses icons from the fixed entity icon set', () => {
    for (const record of DEMO_DASHBOARDS) {
      expect(findEntityIcon(record.icon)?.name).toBe(record.icon);
    }
  });

  it('has enough records to show the carousel, with pinned and unpinned ones', () => {
    expect(DEMO_DASHBOARDS.length).toBeGreaterThan(6);
    expect(DEMO_DASHBOARDS.some((record) => record.pinnedAt !== null)).toBe(
      true,
    );
    expect(DEMO_DASHBOARDS.some((record) => record.pinnedAt === null)).toBe(
      true,
    );
  });
});
