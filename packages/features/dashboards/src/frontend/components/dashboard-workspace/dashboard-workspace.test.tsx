import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DashboardStorage } from '../../../contracts';
import { memoryDashboardStorage } from '../../../testing';
import { SEED_NOW, SEED_OWNER, seededWorkspace } from '../../../testing';
import { DashboardWorkspace } from './index';

const DASH = 'dash-1';

async function seededStorage() {
  const storage = memoryDashboardStorage(SEED_OWNER);
  const { composition, records } = seededWorkspace();
  await storage.saveComposition(DASH, composition);
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
});
