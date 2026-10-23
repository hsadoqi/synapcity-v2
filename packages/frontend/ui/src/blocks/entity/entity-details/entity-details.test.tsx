import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EntityDetails } from '@synapcity/frontend-ui/blocks/entity/entity-details';
import type { DocumentItem } from '@synapcity/frontend-ui/types/entity';

const document: DocumentItem = {
  id: 'doc-1',
  name: 'Launch plan',
  description: 'Milestones and owners.',
  icon: 'file-text',
  kind: 'document',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
};

describe('EntityDetails', () => {
  it('shows the name, description and author', () => {
    render(<EntityDetails entity={document} user={{ name: 'Ada' }} />);

    expect(screen.getByRole('heading', { name: 'Launch plan' })).toBeTruthy();
    expect(screen.getByText('Milestones and owners.')).toBeTruthy();
    expect(screen.getByText('Created by')).toBeTruthy();
    expect(screen.getByText('Ada')).toBeTruthy();
  });

  it('omits the description when there is none', () => {
    render(<EntityDetails entity={{ ...document, description: undefined }} />);

    expect(screen.queryByText('Milestones and owners.')).toBeNull();
  });
});
