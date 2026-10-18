import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SPACE_FIXTURES } from '../../lib/fixtures';
import { SpacesCollection } from './spaces-collection';
import { SpacesCollectionSkeleton } from './spaces-collection-skeleton';

describe('SpacesCollectionSkeleton', () => {
  it('keeps the page heading and announces that spaces are loading', () => {
    render(<SpacesCollectionSkeleton />);

    expect(screen.getByRole('heading', { name: 'Spaces' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Loading spaces');
  });
});

describe('SpacesCollection', () => {
  it('names the page and lists every space, not just the first few', () => {
    const spaces = [...SPACE_FIXTURES, ...SPACE_FIXTURES];
    render(<SpacesCollection spaces={spaces} userId="u1" />);

    expect(screen.getByRole('heading', { name: 'Spaces' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(spaces.length);
  });

  it('links each space to its show page under the owner', () => {
    const [first] = SPACE_FIXTURES;
    render(<SpacesCollection spaces={[first!]} userId="u1" />);

    expect(
      screen
        .getByRole('link', { name: new RegExp(first!.name) })
        .getAttribute('href'),
    ).toBe(`/u1/home/spaces/${first!.id}`);
  });

  it('lists the most recently updated space first', () => {
    const [older, newer] = [
      {
        ...SPACE_FIXTURES[0]!,
        id: 'older',
        name: 'Older',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        ...SPACE_FIXTURES[0]!,
        id: 'newer',
        name: 'Newer',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
    ];
    render(<SpacesCollection spaces={[older!, newer!]} userId="u1" />);

    const links = screen
      .getAllByRole('link')
      .map((l) => l.getAttribute('href'));
    expect(links.indexOf('/u1/home/spaces/newer')).toBeLessThan(
      links.indexOf('/u1/home/spaces/older'),
    );
  });

  it('offers no view-all link', () => {
    render(<SpacesCollection spaces={[...SPACE_FIXTURES]} userId="u1" />);

    expect(screen.queryByRole('button', { name: /View all/ })).toBeNull();
  });

  it('shows the empty state when there are no spaces', () => {
    render(<SpacesCollection spaces={[]} userId="u1" />);

    expect(screen.getByText('No spaces yet')).toBeTruthy();
    // Creating a space does not exist yet, so nothing pretends to offer it.
    expect(screen.queryByRole('button', { name: 'Create a space' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Create a space' })).toBeNull();
  });

  it('counts spaces in words for screen readers', () => {
    render(<SpacesCollection spaces={[SPACE_FIXTURES[0]!]} userId="u1" />);

    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'All spaces, 1 space',
    );
  });
});
