import {
  fireEvent,
  render as renderInto,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  setDashboardPinned: vi.fn(),
}));

vi.mock('../../server/actions/dashboard-state-actions', () => ({
  setDashboardPinned: mocks.setDashboardPinned,
}));

import type { OwnedRecordSummary } from '@/lib/owned-records';

import { CollectionNavigationProvider } from '@synapcity/frontend-collection';
import { DASHBOARD_FIXTURES } from '../../lib/fixtures';
import { DashboardsCollection } from './dashboards-collection';
import { DashboardsCollectionSkeleton } from './dashboards-collection-skeleton';

/** The host's navigation: plain links, and a `push` this test can watch. */
function HostNavigation({ children }: { children: React.ReactNode }) {
  return (
    <CollectionNavigationProvider
      value={{ Link: (props) => <a {...props} />, push: mocks.push }}
    >
      {children}
    </CollectionNavigationProvider>
  );
}

const render = (ui: React.ReactElement) =>
  renderInto(ui, { wrapper: HostNavigation });

const MANY: OwnedRecordSummary[] = [...DASHBOARD_FIXTURES];
// Three of them: the first two pinned (see the fixtures), the third not.
const FEW = MANY.slice(0, 3);
const unpinned = MANY.find((record) => record.pinnedAt === null)!;

const carousel = () => screen.getByRole('list', { name: 'Recently used' });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.setDashboardPinned.mockResolvedValue({
    ok: true,
    pinnedAt: '2026-10-18T12:00:00Z',
  });
});

describe('DashboardsCollectionSkeleton', () => {
  it('keeps the page heading and announces that dashboards are loading', () => {
    render(<DashboardsCollectionSkeleton />);

    expect(screen.getByRole('heading', { name: 'Dashboards' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Loading dashboards');
  });
});

describe('DashboardsCollection', () => {
  it('names the page and the list, and counts the dashboards', () => {
    render(<DashboardsCollection dashboards={FEW} userId="u1" />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Dashboards' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'All dashboards' }),
    ).toBeTruthy();
    expect(screen.getByText('3 dashboards')).toBeTruthy();
  });

  it('links each dashboard to its page under the owner', () => {
    render(<DashboardsCollection dashboards={[FEW[0]!]} userId="u1" />);

    expect(
      screen
        .getAllByRole('link', { name: FEW[0]!.name })
        .every(
          (link) =>
            link.getAttribute('href') === `/u1/home/dashboards/${FEW[0]!.id}`,
        ),
    ).toBe(true);
  });

  it('says which spaces a dashboard is in', () => {
    render(
      <DashboardsCollection
        dashboards={[{ ...FEW[0]!, spacesTotal: 2 }]}
        userId="u1"
      />,
    );

    expect(screen.getAllByText('In 2 spaces').length).toBeGreaterThan(0);
  });

  describe('with a few dashboards', () => {
    it('shows just the list, with no carousel or pinned panel repeating it', () => {
      render(<DashboardsCollection dashboards={FEW} userId="u1" />);

      expect(screen.queryByRole('list', { name: 'Recently used' })).toBeNull();
      expect(screen.queryByRole('region', { name: /Pinned/ })).toBeNull();
    });

    it('marks the pinned ones in the list', () => {
      render(<DashboardsCollection dashboards={FEW} userId="u1" />);

      expect(screen.getAllByRole('img', { name: 'Pinned' }).length).toBe(
        FEW.filter((record) => record.pinnedAt !== null).length,
      );
    });
  });

  describe('with many dashboards', () => {
    it('shows the carousel and the pinned panel', () => {
      render(<DashboardsCollection dashboards={MANY} userId="u1" />);
      const panel = screen.getByRole('region', { name: /Pinned/ });

      expect(carousel()).toBeTruthy();
      for (const record of MANY.filter((entry) => entry.pinnedAt !== null)) {
        expect(
          within(panel).getByRole('link', { name: record.name }),
        ).toBeTruthy();
      }
      expect(
        within(panel).queryByRole('link', { name: unpinned.name }),
      ).toBeNull();
    });

    it('hides the highlights while searching', () => {
      render(<DashboardsCollection dashboards={MANY} userId="u1" />);

      fireEvent.change(
        screen.getByRole('searchbox', { name: 'Search dashboards' }),
        { target: { value: unpinned.name } },
      );

      expect(screen.queryByRole('list', { name: 'Recently used' })).toBeNull();
    });

    it('pins at once and saves in the background', async () => {
      render(<DashboardsCollection dashboards={MANY} userId="u1" />);

      fireEvent.click(
        screen.getAllByRole('button', {
          name: `Actions for ${unpinned.name}`,
        })[0]!,
      );
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Pin' }));

      const panel = screen.getByRole('region', { name: /Pinned/ });
      await waitFor(() =>
        expect(
          within(panel).getByRole('link', { name: unpinned.name }),
        ).toBeTruthy(),
      );
      expect(mocks.setDashboardPinned).toHaveBeenCalledWith(unpinned.id, true);
    });

    it('puts the pin back and says so when saving fails', async () => {
      mocks.setDashboardPinned.mockResolvedValue({
        ok: false,
        error: 'Could not save your changes. Try again.',
      });
      render(<DashboardsCollection dashboards={MANY} userId="u1" />);

      fireEvent.click(
        screen.getAllByRole('button', {
          name: `Actions for ${unpinned.name}`,
        })[0]!,
      );
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Pin' }));

      expect(
        await screen.findByText('Could not save your changes. Try again.'),
      ).toBeTruthy();
      const panel = screen.getByRole('region', { name: /Pinned/ });
      expect(
        within(panel).queryByRole('link', { name: unpinned.name }),
      ).toBeNull();
    });
  });

  it('offers only open and pin in a dashboard’s menu', async () => {
    render(<DashboardsCollection dashboards={FEW} userId="u1" />);

    fireEvent.click(
      screen.getAllByRole('button', {
        name: `Actions for ${FEW[0]!.name}`,
      })[0]!,
    );

    expect(await screen.findByRole('menuitem', { name: 'Open' })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBeNull();
  });

  it('opens a dashboard from its menu', async () => {
    render(<DashboardsCollection dashboards={FEW} userId="u1" />);

    fireEvent.click(
      screen.getAllByRole('button', {
        name: `Actions for ${FEW[0]!.name}`,
      })[0]!,
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Open' }));

    expect(mocks.push).toHaveBeenCalledWith(
      `/u1/home/dashboards/${FEW[0]!.id}`,
    );
  });

  it('shows the empty state, with no create button, when there are no dashboards', () => {
    render(<DashboardsCollection dashboards={[]} userId="u1" />);

    expect(screen.getByText('No dashboards yet')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /New dashboard/ })).toBeNull();
  });
});
