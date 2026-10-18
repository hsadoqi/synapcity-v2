import { fireEvent, render, screen } from '@testing-library/react';
import { FileText } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { EMPTY_FILTERS, type CollectionItem } from '../../shared';
import { CollectionView, type CollectionViewProps } from './collection-view';

const NOW = new Date('2026-10-10T12:00:00Z');

const ITEMS: CollectionItem[] = [
  {
    id: 'one',
    title: 'Weekly review',
    updatedAt: NOW.toISOString(),
    group: 'Weeknight dinners',
    tags: [],
    pinned: false,
  },
  {
    id: 'two',
    title: 'Reading notes',
    updatedAt: NOW.toISOString(),
    group: 'Baking',
    tags: [],
    pinned: false,
  },
];

// Deliberately not a real Synapcity resource: the view must take every
// resource-specific word from its props.
function renderView(overrides: Partial<CollectionViewProps> = {}) {
  const props: CollectionViewProps = {
    labels: { singular: 'recipe', plural: 'Recipes' },
    icon: FileText,
    emptyState: { title: 'No recipes yet', description: 'Add your first.' },
    items: ITEMS,
    state: 'populated',
    query: '',
    onQueryChange: vi.fn(),
    filters: EMPTY_FILTERS,
    onFiltersChange: vi.fn(),
    sort: { field: 'updated', direction: 'desc' },
    onSortChange: vi.fn(),
    layout: 'grid',
    onLayoutChange: vi.fn(),
    onCreate: vi.fn(),
    now: NOW,
    ...overrides,
  };
  render(<CollectionView {...props} />);
  return props;
}

describe('CollectionView', () => {
  it('names everything with the labels it is given', () => {
    renderView();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Recipes' }),
    ).toBeTruthy();
    expect(screen.getByText('2 recipes')).toBeTruthy();
    expect(
      screen.getByRole('searchbox', { name: 'Search recipes' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New recipe' })).toBeTruthy();
  });

  it('shows the context above the title and in the search placeholder', () => {
    renderView({ context: 'Weeknight dinners' });

    expect(
      screen.getByText('Weeknight dinners', { selector: 'p' }),
    ).toBeTruthy();
    expect(screen.getByRole('searchbox').getAttribute('placeholder')).toBe(
      'Search recipes in Weeknight dinners…',
    );
  });

  it('hides each item’s group without grouping', () => {
    renderView();
    expect(screen.queryByText('Baking')).toBeNull();
  });

  it('shows each item’s group when grouping is on', () => {
    renderView({
      grouping: { label: 'Space', options: ['Weeknight dinners', 'Baking'] },
    });
    expect(screen.getByText('Baking')).toBeTruthy();
  });

  it('renders the empty state from the copy it is given', () => {
    const { onCreate } = renderView({ items: [], state: 'empty' });

    expect(screen.getByText('No recipes yet')).toBeTruthy();
    expect(screen.getByText('Add your first.')).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole('button', { name: /New recipe/ }).at(-1)!,
    );
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it('offers to clear the search when nothing matches it', () => {
    const { onQueryChange } = renderView({
      items: [],
      state: 'no-results',
      query: 'saffron',
    });

    expect(screen.getByText('Nothing matches “saffron”')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onQueryChange).toHaveBeenCalledWith('');
  });

  it('announces loading instead of a count', () => {
    renderView({ items: [], state: 'loading' });

    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
    expect(screen.queryByText(/\d+ recipes?/)).toBeNull();
  });
});
