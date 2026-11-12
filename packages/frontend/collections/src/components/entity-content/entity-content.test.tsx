import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EntityContent } from './entity-content';
import type { EntityItem } from '../../types';

const entity: EntityItem = {
  id: 's1',
  name: 'Research',
  icon: 'folder',
  kind: 'space',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
};

const recent: EntityItem = {
  id: 'd1',
  name: 'Launch plan',
  icon: 'file-text',
  kind: 'document',
  createdAt: '2026-10-02T12:00:00.000Z',
  updatedAt: '2026-10-15T09:30:00.000Z',
  href: '/u1/home/spaces/s1/documents/d1',
};

describe('EntityContent', () => {
  it('renders the entity it is given with the page content', () => {
    render(
      <EntityContent entity={entity} getRecentItems={() => []}>
        <p>Page</p>
      </EntityContent>,
    );

    expect(screen.getByRole('heading', { name: 'Research' })).toBeTruthy();
    expect(screen.getByText('Page')).toBeTruthy();
  });

  it('chooses the recent items from the entity and lists them', () => {
    const getRecentItems = vi.fn(() => [recent]);
    render(<EntityContent entity={entity} getRecentItems={getRecentItems} />);

    expect(getRecentItems).toHaveBeenCalledWith(entity);
    expect(screen.getByRole('link', { name: /Launch plan/ })).toBeTruthy();
  });
});
