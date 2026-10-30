import { describe, expect, it } from 'vitest';
import { findEntityIcon } from '@synapcity/frontend-collection';

import { recordSummarySchema } from '@/lib/records/record-summary';

import { DOCUMENT_FIXTURES } from './documents';

describe('document fixtures', () => {
  it('provides valid sample records with distinct IDs', () => {
    expect(new Set(DOCUMENT_FIXTURES.map((record) => record.id)).size).toBe(
      DOCUMENT_FIXTURES.length,
    );
    for (const record of DOCUMENT_FIXTURES) {
      expect(recordSummarySchema.parse(record)).toEqual(record);
    }
  });

  it('uses icons from the fixed entity icon set', () => {
    for (const record of DOCUMENT_FIXTURES) {
      expect(findEntityIcon(record.icon)?.name).toBe(record.icon);
    }
  });

  it('has enough records to show the carousel, with pinned and unpinned ones', () => {
    expect(DOCUMENT_FIXTURES.length).toBeGreaterThan(6);
    expect(DOCUMENT_FIXTURES.some((record) => record.pinnedAt !== null)).toBe(
      true,
    );
    expect(DOCUMENT_FIXTURES.some((record) => record.pinnedAt === null)).toBe(
      true,
    );
  });
});
