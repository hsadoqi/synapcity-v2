import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { FileText } from 'lucide-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

import type { CollectionItem } from '../../shared';
import { CollectionIndex, type CollectionIndexProps } from './collection-index';

const NOW = '2026-10-10T12:00:00Z';

const item = (id: string, overrides: Partial<CollectionItem> = {}) => ({
  id,
  title: id,
  updatedAt: '2026-10-01T12:00:00Z',
  tags: [],
  pinned: false,
  href: `/things/${id}`,
  ...overrides,
});

// Deliberately not a real Synapcity resource: every word comes from the props.
function renderIndex(overrides: Partial<CollectionIndexProps> = {}) {
  const props: CollectionIndexProps = {
    items: ['a', 'b', 'c'].map((id) => item(id)),
    now: NOW,
    labels: { singular: 'recipe', plural: 'Recipes' },
    icon: FileText,
    heading: 'All recipes',
    recentHeading: 'Recently cooked',
    pinnedHeading: 'Favourites',
    pinnedEmptyMessage: 'Pin a recipe to keep it here.',
    emptyState: { title: 'No recipes yet', description: 'Add your first.' },
    actions: ['open', 'toggle-pin'],
    onSetPinned: vi.fn(() => Promise.resolve({ ok: true as const })),
    ...overrides,
  };
  render(<CollectionIndex {...props} />);
  return props;
}

beforeEach(() => vi.clearAllMocks());

describe('CollectionIndex', () => {
  it('names the list and counts the items from the labels it is given', () => {
    renderIndex();

    expect(
      screen.getByRole('heading', { level: 2, name: 'All recipes' }),
    ).toBeTruthy();
    expect(screen.getByText('3 recipes')).toBeTruthy();
  });

  it('shows the highlights only past its threshold', () => {
    const many = ['a', 'b', 'c', 'd'].map((id) => item(id));
    const { unmount } = render(
      <CollectionIndex
        {...({
          items: many,
          now: NOW,
          labels: { singular: 'recipe', plural: 'Recipes' },
          icon: FileText,
          heading: 'All recipes',
          recentHeading: 'Recently cooked',
          pinnedHeading: 'Favourites',
          pinnedEmptyMessage: 'none',
          emptyState: { title: 't', description: 'd' },
          actions: ['toggle-pin'],
          onSetPinned: vi.fn(),
          highlightsFrom: 3,
        } satisfies CollectionIndexProps)}
      />,
    );

    expect(screen.getByRole('list', { name: 'Recently cooked' })).toBeTruthy();
    expect(screen.getByRole('region', { name: /Favourites/ })).toBeTruthy();
    unmount();

    renderIndex({ items: many.slice(0, 3), highlightsFrom: 3 });
    expect(screen.queryByRole('list', { name: 'Recently cooked' })).toBeNull();
  });

  it('asks for the pin to be saved, and keeps it when the save works', async () => {
    const { onSetPinned } = renderIndex({ highlightsFrom: 0 });

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Actions for a' })[0]!,
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Pin' }));

    const panel = screen.getByRole('region', { name: /Favourites/ });
    await waitFor(() =>
      expect(within(panel).getByRole('link', { name: 'a' })).toBeTruthy(),
    );
    expect(onSetPinned).toHaveBeenCalledWith('a', true);
  });

  it('puts the pin back and shows the error when the save fails', async () => {
    renderIndex({
      highlightsFrom: 0,
      onSetPinned: vi.fn(() =>
        Promise.resolve({ ok: false as const, error: 'Not saved. Try again.' }),
      ),
    });

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Actions for a' })[0]!,
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Pin' }));

    expect(await screen.findByText('Not saved. Try again.')).toBeTruthy();
    const panel = screen.getByRole('region', { name: /Favourites/ });
    expect(within(panel).queryByRole('link', { name: 'a' })).toBeNull();
  });

  it('opens an item from its menu by going to its address', async () => {
    renderIndex();

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Actions for b' })[0]!,
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Open' }));

    expect(push).toHaveBeenCalledWith('/things/b');
  });

  it('shows the empty state from its props, with no create button', () => {
    renderIndex({ items: [] });

    expect(screen.getByText('No recipes yet')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /New recipe/ })).toBeNull();
  });
});
