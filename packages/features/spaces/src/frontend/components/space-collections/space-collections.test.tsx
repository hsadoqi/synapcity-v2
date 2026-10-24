import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SpaceCollections } from './space-collections';

const item = <Kind extends 'document' | 'dashboard'>(
  id: string,
  name: string,
  kind: Kind,
) => ({
  id,
  name,
  icon: kind === 'document' ? 'file-text' : 'boxes',
  createdAt: '2026-10-04T08:00:00Z',
  updatedAt: '2026-10-05T08:00:00Z',
  kind,
});

describe('SpaceCollections', () => {
  it('links each item to its route nested in the space', () => {
    render(
      <SpaceCollections
        homePath="/u1/home"
        space={{
          id: 's1',
          documents: [item('d1', 'Outline', 'document')],
          dashboards: [item('b1', 'Progress', 'dashboard')],
          documentsTotal: 1,
          dashboardsTotal: 1,
        }}
      />,
    );

    const documents = screen.getByRole('region', { name: /Documents/ });
    const dashboards = screen.getByRole('region', { name: /Dashboards/ });
    expect(
      within(documents)
        .getAllByRole('link', { name: /Outline/ })
        .map((link) => link.getAttribute('href')),
    ).toContain('/u1/home/spaces/s1/documents/d1');
    expect(
      within(dashboards)
        .getAllByRole('link', { name: /Progress/ })
        .map((link) => link.getAttribute('href')),
    ).toContain('/u1/home/spaces/s1/dashboards/b1');
  });

  it('shows an empty state for each kind with nothing in it', () => {
    render(
      <SpaceCollections
        homePath="/u1/home"
        space={{
          id: 's1',
          documents: [],
          dashboards: [],
          documentsTotal: 0,
          dashboardsTotal: 0,
        }}
      />,
    );

    expect(screen.getByText('No documents yet')).toBeTruthy();
    expect(screen.getByText('No dashboards yet')).toBeTruthy();
  });
});
