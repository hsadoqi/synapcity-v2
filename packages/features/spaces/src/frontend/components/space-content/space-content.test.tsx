import { render, screen, within } from '@testing-library/react';
import { createSpaceEntity } from '@synapcity/dev-fixtures';
import { describe, expect, it } from 'vitest';

import type { Space } from '../../../contracts';
import { SpaceContent } from './space-content';

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

const space = (extra: Partial<Space> = {}): Space => ({
  ...createSpaceEntity({ id: 's1' }),
  kind: 'space',
  documents: [],
  dashboards: [],
  documentsTotal: 0,
  dashboardsTotal: 0,
  ...extra,
});

describe('SpaceContent', () => {
  it('shows both empty states and no items for a space with nothing in it', () => {
    render(<SpaceContent homePath="/u1/home" space={space()} />);

    expect(screen.getByRole('heading', { name: 'Writing' })).toBeTruthy();
    expect(screen.getByText('No documents yet')).toBeTruthy();
    expect(screen.getByText('No dashboards yet')).toBeTruthy();
    expect(
      screen
        .queryAllByRole('link')
        .filter((link) =>
          /\/(documents|dashboards)\/\w/.test(link.getAttribute('href') ?? ''),
        ),
    ).toEqual([]);
  });

  it('links each item under the space', () => {
    render(
      <SpaceContent
        homePath="/u1/home"
        space={space({
          documents: [item('d1', 'Outline', 'document')],
          dashboards: [item('b1', 'Progress', 'dashboard')],
          documentsTotal: 1,
          dashboardsTotal: 1,
        })}
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

  it('links what changed last to the item routes nested in the space', () => {
    render(
      <SpaceContent
        homePath="/u1/home"
        space={space({
          documents: [item('d1', 'Outline', 'document')],
          documentsTotal: 1,
        })}
      />,
    );

    const recent = screen.getByRole('complementary', {
      name: 'Recently touched',
    });
    expect(
      within(recent)
        .getByRole('link', { name: /Outline/ })
        .getAttribute('href'),
    ).toBe('/u1/home/spaces/s1/documents/d1');
  });

  it('says the items could not be loaded instead of showing empty states', () => {
    render(
      <SpaceContent
        homePath="/u1/home"
        space={space({ itemsUnavailable: true })}
      />,
    );

    expect(screen.getByRole('alert').textContent).toContain(
      'could not be loaded',
    );
    expect(screen.queryByText('No documents yet')).toBeNull();
    expect(screen.queryByText('No dashboards yet')).toBeNull();
  });
});
