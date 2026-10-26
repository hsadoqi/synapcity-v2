import { describe, expect, it } from 'vitest';

import { createDocumentEntity } from '@synapcity/dev-fixtures';
import type { DocumentSummary } from '@synapcity/domain-documents';

import {
  describeSpaces,
  documentPath,
  toCollectionItem,
} from './collection-item';

const record: DocumentSummary = {
  ...createDocumentEntity({
    id: 'document-1',
    description: 'Steps.',
    icon: 'file-text',
    tags: ['work'],
  }),
  spacesTotal: 2,
};

describe('describeSpaces', () => {
  it.each([
    [0, 'Not in a space'],
    [1, 'In 1 space'],
    [3, 'In 3 spaces'],
  ])('describes %i spaces', (count, expected) => {
    expect(describeSpaces(count)).toBe(expected);
  });
});

describe('documentPath', () => {
  it('builds the page under the home address the host supplies', () => {
    expect(documentPath('/user-1/home', 'document-1')).toBe(
      '/user-1/home/documents/document-1',
    );
  });
});

describe('toCollectionItem', () => {
  it('maps a document onto the browse feature’s item, linked under the owner', () => {
    expect(toCollectionItem(record, '/user-1/home')).toMatchObject({
      id: 'document-1',
      title: 'Launch plan',
      subtitle: 'Steps.',
      icon: 'file-text',
      href: '/user-1/home/documents/document-1',
      detail: 'In 2 spaces',
      pinned: false,
    });
  });

  it('is pinned when it has a pinned time', () => {
    expect(
      toCollectionItem({ ...record, pinnedAt: '2026-10-04T09:00:00Z' }, '/u')
        .pinned,
    ).toBe(true);
  });
});
