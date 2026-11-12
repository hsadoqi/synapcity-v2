import { fireEvent, render, screen, within } from '@testing-library/react';
import { ChefHat, Pin, Soup } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import type { CollectionItem, CollectionKinds } from '../../types';
import { ItemChips } from './item-chips';

// Invented kinds: the displays must take every resource word from props.
const KINDS: CollectionKinds = {
  recipe: { icon: Soup, label: 'Recipe' },
  menu: { icon: ChefHat, label: 'Menu' },
};

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
