import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CollectionNavigationProvider } from '@synapcity/frontend-collection';

import { sampleSummaries } from '../../../testing';
import { DashboardsIndex } from './dashboards-index';

describe('DashboardsIndex', () => {
  it('lists each dashboard under the home address it is given', () => {
    render(
      <CollectionNavigationProvider
        value={{ Link: (props) => <a {...props} />, push: vi.fn() }}
      >
        <DashboardsIndex
          dashboards={sampleSummaries.slice(0, 1)}
          homePath="/someone/home"
          now="2026-10-20T12:00:00Z"
          setDashboardPinned={vi.fn()}
        />
      </CollectionNavigationProvider>,
    );

    expect(
      screen
        .getAllByRole('link', { name: 'Project status' })
        .every(
          (link) =>
            link.getAttribute('href') ===
            '/someone/home/dashboards/fixture-dashboard-project-status',
        ),
    ).toBe(true);
  });
});
