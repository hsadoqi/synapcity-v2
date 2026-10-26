import type { DocumentSummary } from '@synapcity/domain-documents';
import { createDocumentEntity } from '@synapcity/dev-fixtures';

/**
 * Test and story sample data, not part of the package's public interface.
 * Eight documents, enough for the index to show its carousel and pinned panel;
 * the first and third are pinned, the second is not.
 */
export const sampleSummaries: DocumentSummary[] = [
  {
    ...createDocumentEntity({
      createdAt: '2026-10-14T09:00:00Z',
      updatedAt: '2026-10-17T16:20:00Z',
      pinnedAt: '2026-10-13T09:00:00Z',
      lastViewedAt: '2026-10-12T09:00:00Z',
    }),
    spacesTotal: 2,
  },
  {
    ...createDocumentEntity({
      id: 'fixture-document-reading-notes',
      name: 'Reading notes',
      description: 'What stuck from the books on attention.',
      icon: 'book-open',
      tags: ['learning'],
      createdAt: '2026-10-10T20:00:00Z',
      updatedAt: '2026-10-16T21:10:00Z',
    }),
    spacesTotal: 1,
  },
  {
    ...createDocumentEntity({
      id: 'fixture-document-essay-draft',
      name: 'Essay draft: attention',
      description: 'Second pass; the opening still wanders.',
      icon: 'pen-line',
      tags: ['writing', 'ideas'],
      createdAt: '2026-10-08T08:00:00Z',
      updatedAt: '2026-10-15T18:00:00Z',
      pinnedAt: '2026-10-09T09:00:00Z',
      lastViewedAt: '2026-10-09T08:00:00Z',
    }),
    spacesTotal: 1,
  },
  {
    ...createDocumentEntity({
      id: 'fixture-document-packing-list',
      name: 'Packing list',
      description: undefined,
      icon: 'list-checks',
      tags: ['personal'],
      createdAt: '2026-10-05T12:00:00Z',
      updatedAt: '2026-10-05T12:00:00Z',
    }),
    spacesTotal: 0,
  },
  {
    ...createDocumentEntity({
      id: 'fixture-document-opening-lines',
      name: 'Opening lines',
      description: 'Sentences worth stealing from.',
      icon: 'quote',
      tags: ['writing'],
      createdAt: '2026-09-28T10:00:00Z',
      updatedAt: '2026-10-02T10:00:00Z',
    }),
    spacesTotal: 1,
  },
  {
    ...createDocumentEntity({
      id: 'fixture-document-meeting-notes',
      name: 'Client meeting notes',
      description: 'Decisions and follow-ups from the kickoff.',
      icon: 'file-text',
      tags: ['work'],
      createdAt: '2026-09-20T14:00:00Z',
      updatedAt: '2026-10-01T09:30:00Z',
    }),
    spacesTotal: 1,
  },
  {
    ...createDocumentEntity({
      id: 'fixture-document-gift-ideas',
      name: 'Gift ideas',
      description: undefined,
      icon: 'lightbulb',
      tags: ['personal'],
      createdAt: '2026-09-12T19:00:00Z',
      updatedAt: '2026-09-12T19:00:00Z',
    }),
    spacesTotal: 0,
  },
  {
    ...createDocumentEntity({
      id: 'fixture-document-bookmarks',
      name: 'Bookmarks',
      description: 'Links to come back to.',
      icon: 'bookmark',
      tags: [],
      createdAt: '2026-08-30T11:00:00Z',
      updatedAt: '2026-09-03T11:00:00Z',
    }),
    spacesTotal: 0,
  },
];
