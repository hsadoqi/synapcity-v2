import { addWidget, createComposition } from '@synapcity/domain-dashboards';
import { act, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand/vanilla';

import type { DashboardSnapshot, DashboardStorage } from '../../../contracts';
import { memoryDashboardStorage, SEED_OWNER } from '../../../testing';
import { seededWorkspace } from '../../../testing';
import {
  useDashboardStore,
  useDashboardStoreApi,
  type DashboardStore,
} from '../../store';
import { DashboardWorkspaceProvider } from './index';

const DASH = 'dash-1';
const OTHER = 'dash-2';

const { composition: seeded, records } = seededWorkspace();
const first = seeded.widgets[0]!;

function snapshotOf(
  composition = createComposition(),
  revision = 0,
): DashboardSnapshot {
  return { composition, records, revision };
}

/** Counts mounts and keeps local state, so a remount is visible. */
const mounts = { count: 0, stores: [] as StoreApi<DashboardStore>[] };
function Probe() {
  const [local, setLocal] = useState(0);
  const store = useDashboardStoreApi();
  const editMode = useDashboardStore((s) => s.editMode);
  const widgets = useDashboardStore((s) => s.composition.widgets.length);
  useEffect(() => {
    mounts.count += 1;
  }, []);
  mounts.stores.push(store);
  return (
    <div>
      <p data-testid="state">{`${local}|${editMode ? 'edit' : 'view'}|${widgets}`}</p>
      <button onClick={() => setLocal((n) => n + 1)}>bump</button>
      <button onClick={() => store.getState().toggleEditMode()}>edit</button>
    </div>
  );
}

function renderProvider(
  props: Partial<Parameters<typeof DashboardWorkspaceProvider>[0]> & {
    storage: DashboardStorage;
  },
) {
  const ui = (next: typeof props) => (
    <DashboardWorkspaceProvider
      dashboardId={DASH}
      ownerId={SEED_OWNER}
      breakpoint="lg"
      fallback={<p>loading</p>}
      failureFallback={<p>failed</p>}
      {...next}
    >
      <Probe />
    </DashboardWorkspaceProvider>
  );
  const result = render(ui(props));
  return {
    ...result,
    rerenderWith: (next: typeof props) => result.rerender(ui(next)),
  };
}

describe('DashboardWorkspaceProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
    mounts.count = 0;
    mounts.stores = [];
  });

  it('renders its children on the first render when given a snapshot, with no fallback', () => {
    const storage = memoryDashboardStorage(SEED_OWNER);
    const load = vi.spyOn(storage, 'load');
    renderProvider({ storage, snapshot: snapshotOf(seeded, 3) });
    expect(screen.queryByText('loading')).toBeNull();
    expect(screen.getByTestId('state').textContent).toBe(
      `0|view|${seeded.widgets.length}`,
    );
    expect(load).not.toHaveBeenCalled();
  });

  it('shows the fallback until storage.load resolves', async () => {
    let resolve!: (value: DashboardSnapshot) => void;
    const storage: DashboardStorage = {
      ...memoryDashboardStorage(SEED_OWNER),
      load: () => new Promise((r) => (resolve = r)),
    };
    renderProvider({ storage });
    expect(screen.getByText('loading')).toBeDefined();
    await act(async () => resolve(snapshotOf(seeded)));
    expect(screen.queryByText('loading')).toBeNull();
    expect(screen.getByTestId('state')).toBeDefined();
  });

  it('shows the failure fallback and never saves when the read fails', async () => {
    const saveComposition = vi.fn();
    const storage: DashboardStorage = {
      ...memoryDashboardStorage(SEED_OWNER),
      load: () => Promise.reject(new Error('unreadable')),
      saveComposition,
    };
    renderProvider({ storage });
    expect(await screen.findByText('failed')).toBeDefined();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(saveComposition).not.toHaveBeenCalled();
  });

  it('ignores a read that finishes after the dashboard changed', async () => {
    const resolvers = new Map<string, (value: DashboardSnapshot) => void>();
    const storage: DashboardStorage = {
      ...memoryDashboardStorage(SEED_OWNER),
      load: (id) => new Promise((r) => resolvers.set(id, r)),
    };
    const view = renderProvider({ storage });
    view.rerenderWith({ storage, dashboardId: OTHER });
    await act(async () => resolvers.get(OTHER)!(snapshotOf(seeded)));
    await act(async () =>
      resolvers.get(DASH)!(snapshotOf(createComposition())),
    );
    expect(screen.getByTestId('state').textContent).toBe(
      `0|view|${seeded.widgets.length}`,
    );
  });

  describe('replacing the snapshot', () => {
    it('keeps children mounted and hands them a new store with the new composition', () => {
      const storage = memoryDashboardStorage(SEED_OWNER);
      const view = renderProvider({ storage, snapshot: snapshotOf(seeded, 1) });
      act(() => screen.getByText('bump').click());
      const before = mounts.stores.at(-1)!;
      const fresh = addWidget(createComposition(), seeded.widgets[0]!);
      view.rerenderWith({ storage, snapshot: snapshotOf(fresh, 2) });
      expect(mounts.count).toBe(1);
      const after = mounts.stores.at(-1)!;
      expect(after).not.toBe(before);
      expect(after.getState().composition).toBe(fresh);
      // Local state survived: the same mounted component.
      expect(screen.getByTestId('state').textContent).toBe('1|view|1');
    });

    it('carries edit mode over and clears the selection and the undo offer', () => {
      const storage = memoryDashboardStorage(SEED_OWNER);
      const view = renderProvider({ storage, snapshot: snapshotOf(seeded, 1) });
      act(() => screen.getByText('edit').click());
      const old = mounts.stores.at(-1)!;
      act(() => old.getState().selectWidget(first.id));
      view.rerenderWith({ storage, snapshot: snapshotOf(seeded, 2) });
      const next = mounts.stores.at(-1)!;
      expect(next.getState().editMode).toBe(true);
      expect(next.getState().selectedWidgetId).toBeNull();
      expect(next.getState().removed).toBeNull();
      expect(next.getState().saveStatus).toBe('saved');
    });

    it('starts a different dashboard in view mode', () => {
      const storage = memoryDashboardStorage(SEED_OWNER);
      const view = renderProvider({ storage, snapshot: snapshotOf(seeded) });
      act(() => screen.getByText('edit').click());
      view.rerenderWith({
        storage,
        dashboardId: OTHER,
        snapshot: snapshotOf(seeded),
      });
      expect(mounts.stores.at(-1)!.getState().editMode).toBe(false);
    });

    it('saves the new store from the new revision, and stops saving for the old one', async () => {
      vi.useFakeTimers();
      const saveComposition = vi.fn(async () => ({
        ok: true as const,
        revision: 99,
      }));
      const storage: DashboardStorage = {
        ...memoryDashboardStorage(SEED_OWNER),
        saveComposition,
      };
      const view = renderProvider({ storage, snapshot: snapshotOf(seeded, 1) });
      const old = mounts.stores.at(-1)!;
      view.rerenderWith({ storage, snapshot: snapshotOf(seeded, 7) });
      const next = mounts.stores.at(-1)!;

      // A change to the abandoned store is not saved.
      act(() => old.getState().updateSettings({ columns: 3 }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(saveComposition).not.toHaveBeenCalled();

      act(() => next.getState().updateSettings({ columns: 2 }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(saveComposition).toHaveBeenCalledTimes(1);
      expect(saveComposition).toHaveBeenCalledWith(
        DASH,
        expect.objectContaining({
          settings: expect.objectContaining({ columns: 2 }),
        }),
        7,
      );
    });

    it('does not save the draft that conflicted once the person reloads', async () => {
      vi.useFakeTimers();
      const saveComposition = vi.fn(async () => ({
        ok: false as const,
        reason: 'conflict' as const,
      }));
      const storage: DashboardStorage = {
        ...memoryDashboardStorage(SEED_OWNER),
        saveComposition,
      };
      const view = renderProvider({ storage, snapshot: snapshotOf(seeded, 1) });
      const old = mounts.stores.at(-1)!;
      act(() => old.getState().updateSettings({ columns: 3 }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(old.getState().saveStatus).toBe('conflict');
      expect(saveComposition).toHaveBeenCalledTimes(1);

      // The person's explicit Reload hands the page a newer snapshot.
      view.rerenderWith({ storage, snapshot: snapshotOf(seeded, 2) });
      act(() => old.getState().updateSettings({ columns: 2 }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(saveComposition).toHaveBeenCalledTimes(1);
      expect(mounts.stores.at(-1)!.getState().saveStatus).toBe('saved');
    });

    it('a late save answer for the old store does not change the new store', async () => {
      vi.useFakeTimers();
      let answer!: (value: { ok: true; revision: number }) => void;
      const saveComposition = vi.fn(
        () => new Promise<{ ok: true; revision: number }>((r) => (answer = r)),
      );
      const storage: DashboardStorage = {
        ...memoryDashboardStorage(SEED_OWNER),
        saveComposition,
      };
      const view = renderProvider({ storage, snapshot: snapshotOf(seeded, 1) });
      const old = mounts.stores.at(-1)!;
      act(() => old.getState().updateSettings({ columns: 3 }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(old.getState().saveStatus).toBe('saving');
      view.rerenderWith({ storage, snapshot: snapshotOf(seeded, 2) });
      const next = mounts.stores.at(-1)!;
      act(() => next.getState().setSaveStatus('unsaved'));
      await act(async () => answer({ ok: true, revision: 2 }));
      expect(next.getState().saveStatus).toBe('unsaved');
    });
  });
});
