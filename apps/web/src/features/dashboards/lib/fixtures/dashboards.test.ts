import { describe, expect, it } from 'vitest';
import { findEntityIcon } from '@synapcity/frontend-collection';

import { ownedRecordSchema } from '@/lib/owned-records';

import { DASHBOARD_FIXTURES } from './dashboards';

describe('dashboard fixtures', () => {
  it('provides valid sample records with distinct IDs', () => {
    expect(new Set(DASHBOARD_FIXTURES.map((record) => record.id)).size).toBe(
      DASHBOARD_FIXTURES.length,
    );
    for (const record of DASHBOARD_FIXTURES) {
      expect(ownedRecordSchema.parse(record)).toMatchObject({ id: record.id });
    }
  });

  it('uses icons from the fixed entity icon set', () => {
    for (const record of DASHBOARD_FIXTURES) {
      expect(findEntityIcon(record.icon)?.name).toBe(record.icon);
    }
  });

  it('has enough records to show the carousel, with pinned and unpinned ones', () => {
    expect(DASHBOARD_FIXTURES.length).toBeGreaterThan(6);
    expect(DASHBOARD_FIXTURES.some((record) => record.pinnedAt !== null)).toBe(
      true,
    );
    expect(DASHBOARD_FIXTURES.some((record) => record.pinnedAt === null)).toBe(
      true,
    );
  });
});
