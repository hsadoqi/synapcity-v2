import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CollectionNavigationProvider } from '@synapcity/frontend-collection';

import { sampleSummaries } from '../../../testing';
import { DocumentsIndex } from './documents-index';

describe('DocumentsIndex', () => {
  it('lists each document under the home address it is given', () => {
    render(
      <CollectionNavigationProvider
        value={{ Link: (props) => <a {...props} />, push: vi.fn() }}
      >
        <DocumentsIndex
          documents={sampleSummaries.slice(0, 1)}
          homePath="/someone/home"
          now="2026-10-20T12:00:00Z"
          setDocumentPinned={vi.fn()}
        />
      </CollectionNavigationProvider>,
    );

    expect(
      screen
        .getAllByRole('link', { name: 'Launch plan' })
        .every(
          (link) =>
            link.getAttribute('href') ===
            '/someone/home/documents/fixture-document-launch-plan',
        ),
    ).toBe(true);
  });
});
