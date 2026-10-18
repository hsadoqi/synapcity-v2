import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EntityContent } from '@synapcity/frontend-ui/blocks/entity/entity-content';
import type { Space } from '@synapcity/frontend-ui/types/entity';

const createFixture = ({ ownerId }: { ownerId?: string }): Space => ({
  id: 's1',
  ownerId: ownerId ?? 'u1',
  name: 'Research',
  icon: 'folder',
  tags: [],
  kind: 'space',
  documents: [],
  dashboards: [],
  documentsTotal: 0,
  dashboardsTotal: 0,
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
});

describe('EntityContent', () => {
  it('renders the fixture entity with the page content', () => {
    render(
      <EntityContent
        userId="u1"
        createFixture={createFixture}
        getRecentItems={() => []}
      >
        <p>Page</p>
      </EntityContent>,
    );

    expect(screen.getByRole('heading', { name: 'Research' })).toBeTruthy();
    expect(screen.getByText('Page')).toBeTruthy();
  });

  it('passes the user id to the fixture as the owner', () => {
    const owners: Array<string | undefined> = [];
    render(
      <EntityContent
        userId="u9"
        createFixture={(args) => {
          owners.push(args.ownerId);
          return createFixture(args);
        }}
        getRecentItems={() => []}
      />,
    );

    expect(owners).toContain('u9');
  });

  it('renders no entity without a fixture', () => {
    render(
      <EntityContent userId="u1" getRecentItems={() => []}>
        <p>Page</p>
      </EntityContent>,
    );

    expect(screen.queryByText('Page')).toBeNull();
  });
});
