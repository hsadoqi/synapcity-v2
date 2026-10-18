import { fireEvent, render, screen, within } from '@testing-library/react';
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
      screen.getByRole('heading', { level: 2, name: 'Recipes' }),
    ).toBeTruthy();
    expect(screen.getByText('2 recipes')).toBeTruthy();
    expect(
      screen.getByRole('searchbox', { name: 'Search recipes' }),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'New recipe' })).toBeNull();
  });

  it('links to the full list in the toolbar when there is a user', () => {
    renderView({ userId: 'u1' });

    expect(
      screen
        .getByRole('link', { name: 'View all recipes' })
        .getAttribute('href'),
    ).toBe('/u1/home/recipes');
  });

  it('hides the link without a user', () => {
    renderView();
    expect(screen.queryByRole('link', { name: /View all/ })).toBeNull();
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

  describe('tags', () => {
    const tagged: CollectionItem[] = [
      { ...ITEMS[0]!, tags: ['writing', 'ideas'] },
      { ...ITEMS[1]!, tags: ['ideas'] },
    ];

    it('shows no tag chips without tag options', () => {
      renderView({ items: tagged });

      expect(screen.queryByRole('group', { name: 'Filter by tag' })).toBeNull();
    });

    it('offers the most used tags as toggles for the tag filter', () => {
      const { onFiltersChange } = renderView({
        items: tagged,
        tagOptions: ['ideas', 'writing'],
      });
      const group = screen.getByRole('group', { name: 'Filter by tag' });

      fireEvent.click(within(group).getByRole('button', { name: 'ideas' }));

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...EMPTY_FILTERS,
        tags: ['ideas'],
      });
    });

    it('shows a selected tag as pressed and removes it on a second press', () => {
      const { onFiltersChange } = renderView({
        items: tagged,
        tagOptions: ['ideas', 'writing'],
        filters: { ...EMPTY_FILTERS, tags: ['ideas'] },
      });
      const chip = within(
        screen.getByRole('group', { name: 'Filter by tag' }),
      ).getByRole('button', { name: 'ideas' });

      expect(chip.getAttribute('aria-pressed')).toBe('true');
      fireEvent.click(chip);
      expect(onFiltersChange).toHaveBeenCalledWith(EMPTY_FILTERS);
    });

    it('lists the tag filter among the active filters', () => {
      renderView({
        items: tagged,
        tagOptions: ['ideas'],
        filters: { ...EMPTY_FILTERS, tags: ['ideas'] },
      });

      expect(
        screen.getByRole('button', { name: 'Remove filter: Tag: ideas' }),
      ).toBeTruthy();
    });

    it('limits the chips and points to the filter menu for the rest', () => {
      const many = Array.from({ length: 11 }, (_, index) => `tag-${index}`);
      renderView({ items: tagged, tagOptions: many });
      const group = screen.getByRole('group', { name: 'Filter by tag' });

      expect(within(group).getAllByRole('button')).toHaveLength(8);
      expect(within(group).getByText('+3 more in Filter')).toBeTruthy();
    });
  });

  describe('items', () => {
    it('shows an item’s extra line of facts', () => {
      renderView({
        items: [{ ...ITEMS[0]!, detail: '8 documents · 1 dashboard' }],
      });

      expect(screen.getByText('8 documents · 1 dashboard')).toBeTruthy();
    });

    it('opens an item as a link when it has an address', () => {
      renderView({
        items: [{ ...ITEMS[0]!, href: '/u1/home/recipes/one' }],
      });

      expect(
        screen
          .getByRole('link', { name: 'Weekly review' })
          .getAttribute('href'),
      ).toBe('/u1/home/recipes/one');
    });

    it('offers only the allowed actions in an item’s menu', async () => {
      renderView({ actions: ['open', 'toggle-pin'] });

      fireEvent.click(
        screen.getAllByRole('button', { name: 'Actions for Weekly review' })[0]!,
      );

      expect(await screen.findByRole('menuitem', { name: 'Open' })).toBeTruthy();
      expect(screen.getByRole('menuitem', { name: 'Pin' })).toBeTruthy();
      expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBeNull();
      expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBeNull();
    });

    it('hides the menu when no action is allowed', () => {
      renderView({ actions: [] });

      expect(
        screen.queryByRole('button', { name: /^Actions for/ }),
      ).toBeNull();
    });
  });
});
