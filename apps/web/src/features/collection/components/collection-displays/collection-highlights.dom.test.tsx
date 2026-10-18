import { fireEvent, render, screen, within } from '@testing-library/react';
import { FileText } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import type { CollectionItem } from '../../shared';
import { CollectionHighlights } from './collection-highlights';

const DAY = 86_400_000;
const at = (daysAgo: number) =>
  new Date(Date.UTC(2026, 9, 10, 12) - daysAgo * DAY).toISOString();

function item(
  overrides: Partial<CollectionItem> & { id: string },
): CollectionItem {
  return {
    title: overrides.id,
    updatedAt: at(5),
    tags: [],
    pinned: false,
    ...overrides,
  };
}

const ITEMS: CollectionItem[] = [
  item({ id: 'Edited', updatedAt: at(2), subtitle: 'Changed two days ago' }),
  item({ id: 'Opened', updatedAt: at(9), lastViewedAt: at(1), pinned: true }),
  item({ id: 'Old', updatedAt: at(30) }),
  item({ id: 'Pinned old', updatedAt: at(40), pinned: true }),
];

// Not a real Synapcity resource: every word has to come from the props.
function renderHighlights(
  overrides: Partial<React.ComponentProps<typeof CollectionHighlights>> = {},
) {
  const props = {
    id: 'recipes',
    recentHeading: 'Recently cooked',
    pinnedHeading: 'Favourites',
    pinnedEmptyMessage: 'Pin a recipe to keep it here.',
    items: ITEMS,
    icon: FileText,
    singular: 'recipe',
    onItemAction: vi.fn(),
    ...overrides,
  };
  render(<CollectionHighlights {...props} />);
  return props;
}

const carouselTitles = () =>
  within(screen.getByRole('list', { name: 'Recently cooked' }))
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);

describe('CollectionHighlights', () => {
  it('orders the carousel by when each item was last in use', () => {
    renderHighlights();

    expect(carouselTitles()).toEqual(['Opened', 'Edited', 'Old', 'Pinned old']);
  });

  it('names its sections from the props it is given', () => {
    renderHighlights();

    expect(
      screen.getByRole('heading', { name: 'Recently cooked' }),
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Favourites' })).toBeTruthy();
  });

  it('lists only the pinned items in the pinned panel', () => {
    renderHighlights();
    const panel = screen.getByRole('region', { name: /Favourites/ });

    expect(
      within(panel)
        .getAllByRole('button', { name: /^(Opened|Pinned old)$/ })
        .map((button) => button.textContent),
    ).toEqual(['Opened', 'Pinned old']);
    expect(within(panel).queryByText('Edited')).toBeNull();
  });

  it('says so when nothing is pinned', () => {
    renderHighlights({
      items: ITEMS.map((entry) => ({ ...entry, pinned: false })),
    });

    expect(screen.getByText('Pin a recipe to keep it here.')).toBeTruthy();
  });

  it('gives the first card the whole row and the next ones less', () => {
    renderHighlights();
    const cards = within(
      screen.getByRole('list', { name: 'Recently cooked' }),
    ).getAllByRole('listitem');

    expect(cards[0]?.className).toContain('basis-11/12');
    expect(cards[1]?.className).toContain('basis-56');
    expect(cards[3]?.className).toContain('basis-40');
  });

  it('lets a single item fill the row and hides the scroll buttons', () => {
    renderHighlights({ items: [ITEMS[0]!] });
    const [card] = within(
      screen.getByRole('list', { name: 'Recently cooked' }),
    ).getAllByRole('listitem');

    expect(card?.className).toContain('basis-full');
    expect(screen.queryByRole('button', { name: /Scroll/ })).toBeNull();
  });

  it('can be scrolled from the keyboard and with buttons', () => {
    renderHighlights();
    const track = screen.getByRole('list', { name: 'Recently cooked' });
    track.scrollBy = vi.fn();
    window.matchMedia ??= (() => ({ matches: false })) as never;

    expect(track.getAttribute('tabindex')).toBe('0');
    fireEvent.click(
      screen.getByRole('button', { name: 'Scroll recently cooked forward' }),
    );
    expect(track.scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ left: expect.any(Number) }),
    );
  });

  it('says whether an item was opened or only changed', () => {
    renderHighlights();
    const [opened, edited] = within(
      screen.getByRole('list', { name: 'Recently cooked' }),
    ).getAllByRole('listitem');

    expect(opened?.textContent).toContain('Opened');
    expect(edited?.textContent).toContain('Updated');
  });

  it('opens an item through the action callback', () => {
    const { onItemAction } = renderHighlights();

    fireEvent.click(
      within(screen.getByRole('list', { name: 'Recently cooked' })).getByRole(
        'button',
        { name: 'Old' },
      ),
    );

    expect(onItemAction).toHaveBeenCalledWith(
      'open',
      expect.objectContaining({ id: 'Old' }),
    );
  });

  it('opens an item as a link when it has an address', () => {
    renderHighlights({
      items: [item({ id: 'Linked', href: '/u1/home/recipes/linked' })],
    });

    expect(
      screen
        .getAllByRole('link', { name: 'Linked' })
        .every(
          (link) => link.getAttribute('href') === '/u1/home/recipes/linked',
        ),
    ).toBe(true);
  });

  it('shows nothing without items', () => {
    const { container } = render(
      <CollectionHighlights
        id="x"
        recentHeading="R"
        pinnedHeading="P"
        pinnedEmptyMessage="none"
        items={[]}
        icon={FileText}
        singular="recipe"
        onItemAction={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
