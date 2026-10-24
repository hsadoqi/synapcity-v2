import { fireEvent, render, screen, within } from '@testing-library/react';
import { ChefHat, Soup } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import type { CollectionItem, CollectionKinds } from '../../types';
import { FeaturedItems } from './featured-items';

// Invented kinds: the displays must take every resource word from props.
const KINDS: CollectionKinds = {
  recipe: { icon: Soup, label: 'Recipe' },
  menu: { icon: ChefHat, label: 'Menu' },
};
const NOW = new Date('2026-10-10T12:00:00Z');

const item = (
  id: string,
  overrides: Partial<CollectionItem> = {},
): CollectionItem => ({
  id,
  title: `Title ${id}`,
  kind: 'recipe',
  group: 'Weeknights',
  updatedAt: '2026-10-10T10:00:00Z',
  tags: [],
  pinned: false,
  ...overrides,
});

const section = {
  heading: 'Cook again',
  emptyMessage: 'Nothing cooked yet.',
  kinds: KINDS,
  now: NOW,
  timeZone: 'UTC',
};

describe('FeaturedItems', () => {
  it('shows the lead large and at most two more, each opening its item', () => {
    const onOpen = vi.fn();
    const items = [
      item('a', { kind: 'menu' }),
      item('b'),
      item('c'),
      item('d'),
    ];
    render(
      <FeaturedItems
        id="cook-heading"
        {...section}
        items={items}
        onOpen={onOpen}
      />,
    );

    const region = screen.getByRole('region', { name: 'Cook again' });
    expect(within(region).getByRole('heading', { level: 3 }).textContent).toBe(
      'Title a',
    );
    expect(within(region).getByText('Menu')).toBeTruthy();
    expect(within(region).queryByText('Title d')).toBeNull();

    fireEvent.click(
      within(region).getByRole('button', { name: /Open\s*Title a/ }),
    );
    fireEvent.click(within(region).getByRole('button', { name: /Title c/ }));
    expect(onOpen.mock.calls.map(([opened]) => opened.id)).toEqual(['a', 'c']);
  });

  it('labels edits with how long ago they were', () => {
    render(
      <FeaturedItems id="cook-heading" {...section} items={[item('a')]} />,
    );

    expect(screen.getByText('2h ago').getAttribute('datetime')).toBe(
      '2026-10-10T10:00:00Z',
    );
  });

  it('shows its empty message without items', () => {
    render(<FeaturedItems id="cook-heading" {...section} items={[]} />);

    expect(screen.getByText('Nothing cooked yet.')).toBeTruthy();
  });
});
