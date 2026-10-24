import { render, screen, within } from '@testing-library/react';
import type { CollectionItem } from '@synapcity/frontend-collection';
import { describe, expect, it } from 'vitest';

import { SpacePreview } from './space-preview';

const item: CollectionItem = {
  id: 's1',
  title: 'Writing',
  subtitle: 'Drafts.',
  detail: '3 documents',
  tags: ['writing', 'ideas'],
  pinned: false,
  icon: 'pen-line',
  createdAt: '2026-10-01T09:00:00Z',
  updatedAt: '2026-10-03T14:30:00Z',
};

describe('SpacePreview', () => {
  it('shows the space’s title, description, contents and tags', () => {
    render(<SpacePreview item={item} />);

    expect(screen.getByText('Writing')).toBeTruthy();
    expect(screen.getByText('Drafts.')).toBeTruthy();
    expect(screen.getByText('3 documents')).toBeTruthy();
    const tags = screen.getByRole('list', { name: 'Tags' });
    expect(
      within(tags)
        .getAllByRole('listitem')
        .map((tag) => tag.textContent),
    ).toEqual(['writing', 'ideas']);
  });

  it('leaves out what the space does not have', () => {
    render(
      <SpacePreview
        item={{ ...item, subtitle: undefined, detail: undefined, tags: [] }}
      />,
    );

    expect(screen.queryByText('Drafts.')).toBeNull();
    expect(screen.queryByRole('list', { name: 'Tags' })).toBeNull();
  });
});
