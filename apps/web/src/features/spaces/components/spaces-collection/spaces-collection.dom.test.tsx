import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  setSpacePinned: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('../../server/actions/space-state-actions', () => ({
  setSpacePinned: mocks.setSpacePinned,
}));

import { SPACE_FIXTURES } from '../../lib/fixtures';
import type { SpaceSummary } from '../../shared/types';
import { SpacesCollection } from './spaces-collection';
import { SpacesCollectionSkeleton } from './spaces-collection-skeleton';

const summarise = (index: number, extra: Partial<SpaceSummary> = {}) => ({
  ...SPACE_FIXTURES[index]!,
  documentsTotal: 8,
  dashboardsTotal: 1,
  ...extra,
});

// Writing (pinned, viewed Oct 3), Learning (viewed Oct 5), Personal (never viewed).
const SPACES: SpaceSummary[] = [0, 1, 2].map((index) => summarise(index));

const carousel = () => screen.getByRole('list', { name: 'Recently viewed' });
const carouselTitles = () =>
  within(carousel())
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.setSpacePinned.mockResolvedValue({
    ok: true,
    pinnedAt: '2026-10-18T12:00:00Z',
  });
});

describe('SpacesCollectionSkeleton', () => {
  it('keeps the page heading and announces that spaces are loading', () => {
    render(<SpacesCollectionSkeleton />);

    expect(screen.getByRole('heading', { name: 'Spaces' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Loading spaces');
  });
});

describe('SpacesCollection', () => {
  it('names the page and counts the spaces', () => {
    render(<SpacesCollection spaces={SPACES} userId="u1" />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Spaces' }),
    ).toBeTruthy();
    expect(screen.getByText('3 spaces')).toBeTruthy();
  });

  it('puts the space opened last first in the carousel', () => {
    render(<SpacesCollection spaces={SPACES} userId="u1" />);

    // Learning was opened Oct 5, Writing Oct 3, Personal never (changed Oct 5, 08:00).
    expect(carouselTitles()).toEqual(['Learning', 'Personal', 'Writing']);
  });

  it('links each space to its page under the owner', () => {
    render(<SpacesCollection spaces={[SPACES[0]!]} userId="u1" />);

    expect(
      screen
        .getAllByRole('link', { name: 'Writing' })
        .every(
          (link) =>
            link.getAttribute('href') === `/u1/home/spaces/${SPACES[0]!.id}`,
        ),
    ).toBe(true);
  });

  it('shows what each space holds', () => {
    render(<SpacesCollection spaces={[SPACES[0]!]} userId="u1" />);

    expect(
      screen.getAllByText('8 documents · 1 dashboard').length,
    ).toBeGreaterThan(0);
  });

  it('lists the pinned space in the pinned panel', () => {
    render(<SpacesCollection spaces={SPACES} userId="u1" />);
    const panel = screen.getByRole('region', { name: /Pinned/ });

    expect(within(panel).getByRole('link', { name: 'Writing' })).toBeTruthy();
    expect(within(panel).queryByRole('link', { name: 'Learning' })).toBeNull();
  });

  it('offers only open and pin in a space’s menu', async () => {
    render(<SpacesCollection spaces={SPACES} userId="u1" />);

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Actions for Learning' })[0]!,
    );

    expect(await screen.findByRole('menuitem', { name: 'Open' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Pin' })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBeNull();
  });

  it('pins at once and saves in the background', async () => {
    render(<SpacesCollection spaces={SPACES} userId="u1" />);

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Actions for Learning' })[0]!,
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Pin' }));

    const panel = screen.getByRole('region', { name: /Pinned/ });
    await waitFor(() =>
      expect(
        within(panel).getByRole('link', { name: 'Learning' }),
      ).toBeTruthy(),
    );
    expect(mocks.setSpacePinned).toHaveBeenCalledWith(SPACES[1]!.id, true);
  });

  it('puts the pin back and says so when saving fails', async () => {
    mocks.setSpacePinned.mockResolvedValue({
      ok: false,
      error: 'Could not save your changes. Try again.',
    });
    render(<SpacesCollection spaces={SPACES} userId="u1" />);

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Actions for Learning' })[0]!,
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Pin' }));

    expect(
      await screen.findByText('Could not save your changes. Try again.'),
    ).toBeTruthy();
    const panel = screen.getByRole('region', { name: /Pinned/ });
    expect(within(panel).queryByRole('link', { name: 'Learning' })).toBeNull();
  });

  it('opens a space from its menu', async () => {
    render(<SpacesCollection spaces={SPACES} userId="u1" />);

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Actions for Learning' })[0]!,
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Open' }));

    expect(mocks.push).toHaveBeenCalledWith(`/u1/home/spaces/${SPACES[1]!.id}`);
  });

  it('searches, and hides the highlights while it does', () => {
    render(<SpacesCollection spaces={SPACES} userId="u1" />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search spaces' }), {
      target: { value: 'writ' },
    });

    expect(screen.queryByRole('list', { name: 'Recently viewed' })).toBeNull();
    expect(screen.getByText('1 space')).toBeTruthy();
    expect(screen.queryByText('Learning')).toBeNull();
  });

  it('filters by tag from the chips', () => {
    render(<SpacesCollection spaces={SPACES} userId="u1" />);

    fireEvent.click(
      within(screen.getByRole('group', { name: 'Filter by tag' })).getByRole(
        'button',
        { name: 'learning' },
      ),
    );

    expect(screen.getByText('1 space')).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Recently viewed' })).toBeNull();
  });

  it('says so when nothing matches', () => {
    render(<SpacesCollection spaces={SPACES} userId="u1" />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search spaces' }), {
      target: { value: 'zzz' },
    });

    expect(screen.getByText('Nothing matches “zzz”')).toBeTruthy();
  });

  it('starts as a list and switches to tiles and back', () => {
    const { container } = render(
      <SpacesCollection spaces={SPACES} userId="u1" />,
    );
    const grid = () => container.querySelector('ul.grid-cols-1');
    const listButton = screen.getByRole('button', { name: 'List view' });
    const gridButton = screen.getByRole('button', { name: 'Grid view' });

    expect(listButton.getAttribute('aria-pressed')).toBe('true');
    expect(grid()).toBeNull();

    fireEvent.click(gridButton);
    expect(gridButton.getAttribute('aria-pressed')).toBe('true');
    expect(grid()).not.toBeNull();

    fireEvent.click(listButton);
    expect(grid()).toBeNull();
  });

  it('offers no view-all link', () => {
    render(<SpacesCollection spaces={SPACES} userId="u1" />);

    expect(screen.queryByRole('link', { name: /View all/ })).toBeNull();
  });

  it('shows the empty state when there are no spaces', () => {
    render(<SpacesCollection spaces={[]} userId="u1" />);

    expect(screen.getByText('No spaces yet')).toBeTruthy();
    // Creating a space does not exist yet, so nothing pretends to offer it.
    expect(screen.queryByRole('button', { name: /New space/ })).toBeNull();
    expect(screen.queryByRole('list', { name: 'Recently viewed' })).toBeNull();
  });
});
