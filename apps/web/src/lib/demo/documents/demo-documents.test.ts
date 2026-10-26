import { describe, expect, it } from 'vitest';
import { findEntityIcon } from '@synapcity/frontend-collection';

import { documentSchema } from '@synapcity/domain-documents';

import { DEMO_DOCUMENTS } from './demo-documents';

describe('demo documents', () => {
  it('provides valid sample records with distinct IDs', () => {
    expect(new Set(DEMO_DOCUMENTS.map((record) => record.id)).size).toBe(
      DEMO_DOCUMENTS.length,
    );
    for (const record of DEMO_DOCUMENTS) {
      expect(documentSchema.parse(record)).toMatchObject({ id: record.id });
    }
  });

  it('uses icons from the fixed entity icon set', () => {
    for (const record of DEMO_DOCUMENTS) {
      expect(findEntityIcon(record.icon)?.name).toBe(record.icon);
    }
  });

  it('has enough records to show the carousel, with pinned and unpinned ones', () => {
    expect(DEMO_DOCUMENTS.length).toBeGreaterThan(6);
    expect(DEMO_DOCUMENTS.some((record) => record.pinnedAt !== null)).toBe(
      true,
    );
    expect(DEMO_DOCUMENTS.some((record) => record.pinnedAt === null)).toBe(
      true,
    );
  });
});
