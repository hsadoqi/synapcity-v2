import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SPACE_FIXTURES } from '../../lib/fixtures';
import { SpacesCollection } from './spaces-collection';

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
    expect(screen.getByRole('button', { name: 'Create a space' })).toBeTruthy();
  });
});
