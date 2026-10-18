import { fireEvent, render, screen, within } from '@testing-library/react';
import { ChefHat, Pin, Soup } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import type { CollectionItem } from '../../shared';
import { CompactItemList } from './compact-item-list';
import { FeaturedItems } from './featured-items';
import { ItemChips } from './item-chips';
import type { CollectionKinds } from './item-kind';

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

describe('ItemChips', () => {
  it('lists each item as a button under an iconned heading', () => {
    const onOpen = vi.fn();
    render(
      <ItemChips
        id="saved-heading"
        heading="Saved"
        headingIcon={Pin}
        emptyMessage="Nothing saved."
        kinds={KINDS}
        items={[item('a'), item('b', { kind: 'unknown' })]}
        onOpen={onOpen}
      />,
    );

    const region = screen.getByRole('region', { name: 'Saved' });
    fireEvent.click(within(region).getByRole('button', { name: 'Title b' }));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
  });
});

describe('CompactItemList', () => {
  it('shows up to the limit, with each item’s group and age', () => {
    render(
      <CompactItemList
        id="recent-heading"
        {...section}
        heading="Recent"
        items={[item('a'), item('b'), item('c')]}
        limit={2}
      />,
    );

    const region = screen.getByRole('region', { name: 'Recent' });
    expect(within(region).getAllByRole('listitem')).toHaveLength(2);
    expect(within(region).getAllByText('Weeknights')).toHaveLength(2);
    expect(within(region).getAllByText('2h ago')).toHaveLength(2);
    // The kind is named for screen readers inside each tile.
    expect(within(region).getAllByText('Recipe')).toHaveLength(2);
  });
});
