import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EntityShell } from './entity-shell';
import type { EntityItem } from '../../types';

const space: EntityItem = {
  id: 's1',
  name: 'Research',
  description: 'The workstream.',
  icon: 'folder',
  kind: 'space',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
};

const recent = [
  {
    id: 'doc-1',
    name: 'Launch plan',
    icon: 'file-text',
    kind: 'document' as const,
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-16T09:30:00.000Z',
  },
];

describe('EntityShell', () => {
  it('renders the header and the page content', () => {
    render(
      <EntityShell entity={space}>
        <p>Page</p>
      </EntityShell>,
    );

    expect(screen.getByRole('heading', { name: 'Research' })).toBeTruthy();
    expect(screen.getByText('Page')).toBeTruthy();
  });

  it('lists recent items when asked for them', () => {
    render(<EntityShell entity={space} recentItems={recent} />);

    expect(screen.getByText('Launch plan')).toBeTruthy();
  });

  it('shows no recent items by default', () => {
    render(<EntityShell entity={space} />);

    expect(screen.queryByText('Recent Items')).toBeNull();
  });
});
