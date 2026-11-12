import { render, screen, within } from '@testing-library/react';
import { ChefHat, Soup } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import type { CollectionItem, CollectionKinds } from '../../types';
import { CompactItemList } from './compact-item-list';

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
