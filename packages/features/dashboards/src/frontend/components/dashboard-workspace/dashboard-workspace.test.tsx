import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DashboardStorage } from '../../../contracts';
import { memoryDashboardStorage } from '../../../testing';
import { SEED_NOW, SEED_OWNER, seededWorkspace } from '../../../testing';
import { DashboardWorkspace } from './index';

const DASH = 'dash-1';

async function seededStorage() {
  const storage = memoryDashboardStorage(SEED_OWNER);
  const { composition, records } = seededWorkspace();
  await storage.saveComposition(DASH, composition, 0);
  await storage.saveRecords(records);
  return storage;
}

function renderWorkspace(
  storage: DashboardStorage,
  breakpoint?: 'lg' | 'md' | 'sm',
) {
  return render(
    <DashboardWorkspace
      dashboardId={DASH}
      ownerId={SEED_OWNER}
      storage={storage}
      now={() => SEED_NOW}
      breakpoint={breakpoint}
    />,
  );
}

describe('DashboardWorkspace', () => {
  afterEach(() => vi.useRealTimers());

  it('shows a skeleton until the saved dashboard is read', async () => {
    let resolve!: (
      value: Awaited<ReturnType<DashboardStorage['load']>>,
    ) => void;
    const storage = memoryDashboardStorage(SEED_OWNER);
    const slow: DashboardStorage = {
      ...storage,
      load: () => new Promise((r) => (resolve = r)),
    };
    renderWorkspace(slow, 'lg');
    expect(
      screen.getByText('Loading dashboard…').closest('[aria-busy="true"]'),
    ).not.toBeNull();
    await act(async () => resolve({ composition: null, records: null }));
    expect(screen.queryByText('Loading dashboard…')).toBeNull();
  });

  it('opens an empty dashboard when nothing is saved', async () => {
    renderWorkspace(memoryDashboardStorage(SEED_OWNER), 'lg');
    expect(await screen.findByText('No widgets yet')).toBeDefined();
  });

  it('opens the saved dashboard', async () => {
    const { container } = renderWorkspace(await seededStorage(), 'lg');
    await screen.findAllByRole('region');
    expect(container.querySelectorAll('[data-slot="widget"]')).toHaveLength(8);
  });

  it('saves a change and shows it after the canvas is opened again', async () => {
    const storage = await seededStorage();
    const first = renderWorkspace(storage, 'lg');
    fireEvent.click(await screen.findByRole('button', { name: 'Edit layout' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Settings for Steps today' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Hide widget' }));
    first.unmount();
    renderWorkspace(storage, 'lg');
    await screen.findAllByRole('region');
    expect(screen.queryByRole('region', { name: 'Steps today' })).toBeNull();
    expect(
      screen.getByRole('region', { name: 'Workouts this week' }),
    ).toBeDefined();
  });

  it('toggles edit mode, which shows the widgets panel', async () => {
    renderWorkspace(await seededStorage(), 'lg');
    const toggle = await screen.findByRole('button', { name: 'Edit layout' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(
      screen.queryByRole('region', { name: 'Add to dashboard' }),
    ).toBeNull();
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(
      screen.getByRole('region', { name: 'Add to dashboard' }),
    ).toBeDefined();
  });

  it("starts at the viewport's breakpoint", async () => {
    vi.stubGlobal('innerWidth', 500);
    renderWorkspace(memoryDashboardStorage(SEED_OWNER));
    const mobile = await screen.findByRole('button', { name: 'Mobile layout' });
    expect(mobile.getAttribute('aria-pressed')).toBe('true');
    vi.unstubAllGlobals();
  });

  it('shows an error and never saves when the dashboard cannot be read', async () => {
    const storage = memoryDashboardStorage(SEED_OWNER);
    const saveComposition = vi.fn(storage.saveComposition);
    const failing: DashboardStorage = {
      ...storage,
      saveComposition,
      load: () => Promise.reject(new Error('offline')),
    };
    renderWorkspace(failing, 'lg');
    expect(
      await screen.findByText('This dashboard could not be loaded.'),
    ).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Edit layout' })).toBeNull();
    expect(saveComposition).not.toHaveBeenCalled();
  });

  it("shows time-based widgets at the workspace's clock, not the wall clock", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(Date.parse('2027-03-01T12:00:00Z'));
    renderWorkspace(await seededStorage(), 'lg');
    expect(await screen.findByText('Morning run')).toBeDefined();
    expect(screen.queryByText('Nothing scheduled this week.')).toBeNull();
  });

  it('reloads the canvas when the host replaces its storage adapter', async () => {
    const firstStorage = await seededStorage();
    const secondStorage = memoryDashboardStorage(SEED_OWNER);
    const result = renderWorkspace(firstStorage, 'lg');
    await screen.findAllByRole('region');

    result.rerender(
      <DashboardWorkspace
        dashboardId={DASH}
        ownerId={SEED_OWNER}
        storage={secondStorage}
        now={() => SEED_NOW}
        breakpoint="lg"
      />,
    );

    expect(await screen.findByText('No widgets yet')).toBeDefined();
    expect(screen.queryByRole('region', { name: 'Steps today' })).toBeNull();
  });

  it('does not restart clocks when rerendered with the default clock', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const storage = await seededStorage();
    const result = render(
      <DashboardWorkspace
        dashboardId={DASH}
        ownerId={SEED_OWNER}
        storage={storage}
        breakpoint="lg"
      />,
    );
    await screen.findAllByRole('region');
    const initialCalls = setIntervalSpy.mock.calls.length;

    result.rerender(
      <DashboardWorkspace
        dashboardId={DASH}
        ownerId={SEED_OWNER}
        storage={storage}
        breakpoint="lg"
      />,
    );

    expect(setIntervalSpy).toHaveBeenCalledTimes(initialCalls);
  });

  describe('read-only', () => {
    const renderReadOnly = (storage: DashboardStorage) =>
      render(
        <DashboardWorkspace
          dashboardId={DASH}
          ownerId={SEED_OWNER}
          storage={storage}
          now={() => SEED_NOW}
          breakpoint="lg"
          readOnly
        />,
      );

    it('shows the saved widgets with no editing controls', async () => {
      const { container } = renderReadOnly(await seededStorage());
      await screen.findAllByRole('region');
      expect(container.querySelectorAll('[data-slot="widget"]')).toHaveLength(
        8,
      );
      expect(screen.queryByRole('button', { name: 'Edit layout' })).toBeNull();
      expect(screen.queryByRole('group', { name: 'Layout breakpoint' })).toBe(
        null,
      );
      expect(screen.queryByText(/· \d+px/)).toBeNull();
    });

    it('never saves', async () => {
      const storage = await seededStorage();
      const saveComposition = vi.fn(storage.saveComposition);
      const saveRecords = vi.fn(storage.saveRecords);
      renderReadOnly({ ...storage, saveComposition, saveRecords });
      await screen.findAllByRole('region');
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(saveComposition).not.toHaveBeenCalled();
      expect(saveRecords).not.toHaveBeenCalled();
    });

    it('says editing is not available on an empty dashboard', async () => {
      renderReadOnly(memoryDashboardStorage(SEED_OWNER));
      expect(
        await screen.findByText('Editing dashboards is not available yet.'),
      ).toBeDefined();
    });
  });

  describe('editing a server-backed dashboard', () => {
    const LINK_ITEMS = [
      {
        id: 's1',
        kind: 'space' as const,
        name: 'Research',
        icon: 'folder',
        href: '/home/spaces/s1',
        pinnedAt: '2026-10-20T00:00:00Z',
        lastViewedAt: '2026-10-21T00:00:00Z',
      },
    ];

    function serverLike(
      overrides: Partial<DashboardStorage> = {},
      revision = 3,
    ) {
      const saveComposition = vi.fn<DashboardStorage['saveComposition']>(
        async (_id, _composition, base) => ({ ok: true, revision: base + 1 }),
      );
      const storage: DashboardStorage = {
        load: async () => ({ composition: null, records: null, revision }),
        saveComposition,
        saveRecords: async () => {},
        ...overrides,
      };
      return { storage, saveComposition };
    }

    function renderServerLike(storage: DashboardStorage) {
      return render(
        <DashboardWorkspace
          dashboardId={DASH}
          ownerId={SEED_OWNER}
          storage={storage}
          now={() => SEED_NOW}
          breakpoint="lg"
          items={LINK_ITEMS}
          widgetTypes={['pinned', 'last-opened', 'spaces']}
          persistsStatus={false}
        />,
      );
    }

    it('adds a widget from the empty state, offers only the allowed widgets and lists the items', async () => {
      const { storage } = serverLike();
      renderServerLike(storage);

      fireEvent.click(
        await screen.findByRole('button', { name: 'Add a widget' }),
      );
      const palette = screen.getByRole('region', { name: 'Add to dashboard' });
      expect(
        within(palette)
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual(['Pinned', 'Last opened', 'Spaces']);
      expect(screen.queryByRole('heading', { name: /Hidden/ })).toBeNull();

      fireEvent.click(within(palette).getByRole('button', { name: 'Spaces' }));
      expect(
        await screen.findByRole('link', { name: 'Research' }),
      ).toBeDefined();
      expect(screen.getByText('Spaces added')).toBeDefined();
    });

    it('saves against the revision it read, says Saved only after the server confirms, and then the next save builds on the answer', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const { storage, saveComposition } = serverLike();
      renderServerLike(storage);
      fireEvent.click(
        await screen.findByRole('button', { name: 'Add a widget' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Pinned' }));
      expect(screen.getByText('Unsaved changes')).toBeDefined();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });
      expect(saveComposition).toHaveBeenCalledWith(
        DASH,
        expect.objectContaining({ widgets: expect.any(Array) }),
        3,
      );
      expect(await screen.findByText('Saved')).toBeDefined();

      fireEvent.click(screen.getByRole('button', { name: 'Spaces' }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });
      expect(saveComposition.mock.calls[1]?.[2]).toBe(4);
    });

    it('shows Changed elsewhere with Reload after a conflict, and Reload reads the dashboard again', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const load = vi.fn(async () => ({
        composition: null,
        records: null,
        revision: 3,
      }));
      const { storage } = serverLike({
        load,
        saveComposition: async () => ({ ok: false, reason: 'conflict' }),
      });
      renderServerLike(storage);
      fireEvent.click(
        await screen.findByRole('button', { name: 'Add a widget' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Pinned' }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });
      expect(await screen.findByText(/Changed elsewhere/)).toBeDefined();

      fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
      await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    });

    it('removes a widget, can Undo it, and moves focus to the next widget', async () => {
      const { storage } = serverLike();
      renderServerLike(storage);
      fireEvent.click(
        await screen.findByRole('button', { name: 'Add a widget' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Pinned' }));
      fireEvent.click(screen.getByRole('button', { name: 'Spaces' }));

      fireEvent.click(
        screen.getByRole('button', { name: 'Settings for Pinned' }),
      );
      fireEvent.click(
        await screen.findByRole('button', { name: 'Remove widget' }),
      );

      expect(screen.queryByRole('region', { name: 'Pinned' })).toBeNull();
      await vi.waitFor(() =>
        expect(document.activeElement?.getAttribute('aria-label')).toBe(
          'Spaces',
        ),
      );
      expect(screen.getByText('Pinned removed')).toBeDefined();

      fireEvent.click(
        screen.getByRole('button', { name: 'Undo remove Pinned' }),
      );
      expect(screen.getByRole('region', { name: 'Pinned' })).toBeDefined();
      await vi.waitFor(() =>
        expect(document.activeElement?.getAttribute('aria-label')).toBe(
          'Pinned',
        ),
      );
    });

    it('offers no Hide or Archive when the host stores no widget status', async () => {
      const { storage } = serverLike();
      renderServerLike(storage);
      fireEvent.click(
        await screen.findByRole('button', { name: 'Add a widget' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Pinned' }));
      fireEvent.click(
        screen.getByRole('button', { name: 'Settings for Pinned' }),
      );
      await screen.findByRole('button', { name: 'Remove widget' });
      expect(screen.queryByRole('button', { name: 'Hide widget' })).toBeNull();
      expect(
        screen.queryByRole('button', { name: 'Archive widget' }),
      ).toBeNull();
    });
  });
});
