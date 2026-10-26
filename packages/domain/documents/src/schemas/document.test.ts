import { describe, expect, expectTypeOf, it } from 'vitest';

import type { DocumentEntity, DocumentSummary } from '../types';
import { documentSchema } from './index';

const savedDocument = {
  id: 'fixture-document-launch-plan',
  ownerId: '11111111-1111-4111-8111-111111111111',
  name: 'Launch plan',
  description: 'Steps, owners, and dates for the spring launch.',
  icon: 'notebook',
  tags: ['work', 'planning'],
  createdAt: '2026-10-14T09:00:00Z',
  updatedAt: '2026-10-17T16:20:00Z',
  pinnedAt: '2026-10-13T09:00:00Z',
  lastViewedAt: null,
};

describe('documentSchema', () => {
  it('parses a saved document', () => {
    expect(documentSchema.parse(savedDocument)).toEqual(savedDocument);
  });

  it('defaults the pinned and last-viewed times to null when absent', () => {
    const { pinnedAt, lastViewedAt, ...withoutState } = savedDocument;
    void pinnedAt;
    void lastViewedAt;

    expect(documentSchema.parse(withoutState)).toMatchObject({
      pinnedAt: null,
      lastViewedAt: null,
    });
  });

  it('rejects a document without a name or with an invalid timestamp', () => {
    expect(() =>
      documentSchema.parse({ ...savedDocument, name: '' }),
    ).toThrow();
    expect(() =>
      documentSchema.parse({ ...savedDocument, createdAt: 'yesterday' }),
    ).toThrow();
  });

  it('types the summary as the saved document plus its Space count', () => {
    expectTypeOf<DocumentSummary>().toEqualTypeOf<
      DocumentEntity & { spacesTotal: number }
    >();
  });
});
