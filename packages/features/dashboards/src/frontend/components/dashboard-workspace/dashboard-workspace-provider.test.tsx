import {
  addWidget,
  createComposition,
  type DashboardComposition,
} from '@synapcity/domain-dashboards';
import { act, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand/vanilla';

import type { DashboardSnapshot, DashboardStorage } from '../../../contracts';
import { useDashboardConfig } from '../../config';
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
  const { onReload } = useDashboardConfig();
  useEffect(() => {
    mounts.count += 1;
  }, []);
  mounts.stores.push(store);
  return (
    <div>
      <p data-testid="state">{`${local}|${editMode ? 'edit' : 'view'}|${widgets}`}</p>
      <button onClick={() => setLocal((n) => n + 1)}>bump</button>
      <button onClick={() => store.getState().toggleEditMode()}>edit</button>
      <button onClick={() => onReload?.()}>reload</button>
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
      act(() => screen.getByRole('button', { name: 'reload' }).click());
      view.rerenderWith({ storage, snapshot: snapshotOf(seeded, 2) });
      expect(mounts.stores.at(-1)).not.toBe(old);
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
      // A read of the same dashboard keeps a saving store (see "server
      // refreshes"); moving to another dashboard abandons it.
      view.rerenderWith({
        storage,
        dashboardId: OTHER,
        snapshot: snapshotOf(seeded, 2),
      });
      const next = mounts.stores.at(-1)!;
      act(() => next.getState().setSaveStatus('unsaved'));
      await act(async () => answer({ ok: true, revision: 2 }));
      expect(next.getState().saveStatus).toBe('unsaved');
    });
  });

  /**
   * A host page refreshes for reasons of its own (a pin elsewhere revalidates
   * the layout, quick-create, an auth event, the link widgets asking for
   * records). Each refresh hands the provider the stored dashboard again as
   * new objects. Only a newer stored revision, an explicit Reload after a
   * conflict, or another dashboard may replace what the person is editing.
   */
  describe('server refreshes', () => {
    type Stored = { composition: DashboardComposition; revision: number };

    /** A stored dashboard that checks base revisions the way the database does. */
    function revisionedServer(initial: DashboardComposition = seeded) {
      let stored: Stored = { composition: initial, revision: 1 };
      const saves: string[] = [];
      let fail = false;
      let hold: Promise<void> | null = null;
      const saveComposition = vi.fn(
        async (
          _id: string,
          composition: DashboardComposition,
          base: number,
        ) => {
          if (fail) {
            saves.push(`failed@${base}`);
            return { ok: false as const, reason: 'failed' as const };
          }
          if (base !== stored.revision) {
            saves.push(`conflict@${base}`);
            return { ok: false as const, reason: 'conflict' as const };
          }
          // Committed at once; the answer may be held back, as a slow network does.
          stored = { composition, revision: base + 1 };
          saves.push(`ok@${base}->${base + 1}`);
          if (hold) await hold;
          return { ok: true as const, revision: base + 1 };
        },
      );
      const storage: DashboardStorage = {
        ...memoryDashboardStorage(SEED_OWNER),
        saveComposition,
      };
      return {
        storage,
        saves,
        saveComposition,
        /** What a refresh delivers: the stored values as new objects. */
        read: (): DashboardSnapshot => ({
          composition: structuredClone(stored.composition),
          records,
          revision: stored.revision,
        }),
        /** Another tab saves. */
        writeElsewhere: (composition: DashboardComposition) => {
          stored = { composition, revision: stored.revision + 1 };
        },
        failSaves: (value: boolean) => {
          fail = value;
        },
        holdAnswers: () => {
          let release!: () => void;
          hold = new Promise((r) => (release = r));
          return () => {
            hold = null;
            release();
          };
        },
      };
    }

    const live = () => mounts.stores.at(-1)!;
    const columns = () => live().getState().composition.settings.columns;
    async function wait(ms: number) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
      });
    }

    it('keeps a pending edit when a refresh delivers the same revision as new objects', async () => {
      vi.useFakeTimers();
      const server = revisionedServer();
      const view = renderProvider({
        storage: server.storage,
        snapshot: server.read(),
      });
      const store = live();
      act(() => store.getState().updateSettings({ columns: 4 }));
      await wait(100);

      view.rerenderWith({ storage: server.storage, snapshot: server.read() });
      expect(live()).toBe(store);
      expect(columns()).toBe(4);

      await wait(1000);
      act(() => live().getState().updateSettings({ columns: 2 }));
      await wait(1000);
      expect(server.saves).toEqual(['ok@1->2', 'ok@2->3']);
      expect(live().getState().saveStatus).toBe('saved');
      expect(columns()).toBe(2);
    });

    it('keeps the store, its selection and the undo offer when a refresh echoes the save', async () => {
      vi.useFakeTimers();
      const server = revisionedServer();
      const view = renderProvider({
        storage: server.storage,
        snapshot: server.read(),
      });
      const store = live();
      act(() => store.getState().toggleEditMode());
      act(() => store.getState().removeWidget(first.id));
      await wait(1000);
      expect(server.saves).toEqual(['ok@1->2']);
      act(() => store.getState().selectWidget(seeded.widgets[1]!.id));

      // The page refreshes after the save, with what was just saved.
      view.rerenderWith({ storage: server.storage, snapshot: server.read() });
      expect(live()).toBe(store);
      expect(store.getState().removed?.widgetId).toBe(first.id);
      expect(store.getState().selectedWidgetId).toBe(seeded.widgets[1]!.id);
      await wait(1000);
      expect(server.saveComposition).toHaveBeenCalledTimes(1);
      expect(store.getState().saveStatus).toBe('saved');
    });

    it('ignores a refresh that read an older revision than the store has saved', async () => {
      vi.useFakeTimers();
      const server = revisionedServer();
      const stale = server.read();
      const view = renderProvider({ storage: server.storage, snapshot: stale });
      const store = live();
      act(() => store.getState().updateSettings({ columns: 4 }));
      await wait(1000);
      expect(server.saves).toEqual(['ok@1->2']);

      view.rerenderWith({ storage: server.storage, snapshot: { ...stale } });
      expect(live()).toBe(store);
      expect(columns()).toBe(4);
    });

    it('adopts a newer stored revision when nothing is pending', async () => {
      vi.useFakeTimers();
      const server = revisionedServer();
      const view = renderProvider({
        storage: server.storage,
        snapshot: server.read(),
      });
      const store = live();
      const elsewhere = addWidget(createComposition(), first);
      server.writeElsewhere(elsewhere);

      view.rerenderWith({ storage: server.storage, snapshot: server.read() });
      expect(live()).not.toBe(store);
      expect(live().getState().composition).toEqual(elsewhere);

      act(() => live().getState().updateSettings({ columns: 2 }));
      await wait(1000);
      expect(server.saves).toEqual(['ok@2->3']);
    });

    it('keeps a pending edit over a newer revision, lets the save answer as a conflict, and Reload then replaces it', async () => {
      vi.useFakeTimers();
      const server = revisionedServer();
      const view = renderProvider({
        storage: server.storage,
        snapshot: server.read(),
      });
      const store = live();
      act(() => store.getState().updateSettings({ columns: 4 }));
      const elsewhere = addWidget(createComposition(), first);
      server.writeElsewhere(elsewhere);

      view.rerenderWith({ storage: server.storage, snapshot: server.read() });
      expect(live()).toBe(store);
      expect(columns()).toBe(4);
      await wait(1000);
      expect(server.saves).toEqual(['conflict@1']);
      expect(store.getState().saveStatus).toBe('conflict');

      // The person's Reload: the page reads again, the same revision as before.
      act(() => screen.getByRole('button', { name: 'reload' }).click());
      view.rerenderWith({ storage: server.storage, snapshot: server.read() });
      expect(live()).not.toBe(store);
      expect(live().getState().composition).toEqual(elsewhere);
      expect(live().getState().saveStatus).toBe('saved');
    });

    it('keeps a conflicted draft on screen through a background refresh until the person chooses Reload', async () => {
      vi.useFakeTimers();
      const server = revisionedServer();
      const view = renderProvider({
        storage: server.storage,
        snapshot: server.read(),
      });
      const store = live();
      server.writeElsewhere(addWidget(createComposition(), first));
      act(() => store.getState().updateSettings({ columns: 4 }));
      await wait(1000);
      expect(server.saves).toEqual(['conflict@1']);
      expect(store.getState().saveStatus).toBe('conflict');

      // Refreshes the host makes for its own reasons (pin revalidation, an
      // auth event) do not give the draft up, however many arrive.
      view.rerenderWith({ storage: server.storage, snapshot: server.read() });
      view.rerenderWith({ storage: server.storage, snapshot: server.read() });
      expect(live()).toBe(store);
      expect(columns()).toBe(4);
      expect(store.getState().saveStatus).toBe('conflict');
      await wait(1000);
      expect(server.saves).toEqual(['conflict@1']);

      act(() => screen.getByRole('button', { name: 'reload' }).click());
      view.rerenderWith({ storage: server.storage, snapshot: server.read() });
      expect(live()).not.toBe(store);
      expect(live().getState().saveStatus).toBe('saved');
      expect(live().getState().savedRevision).toBe(2);
    });

    it('does not count a reload asked for before a conflict as the person giving the draft up', async () => {
      vi.useFakeTimers();
      const server = revisionedServer();
      const view = renderProvider({
        storage: server.storage,
        snapshot: server.read(),
      });
      const store = live();
      // A reload while everything is saved (the link widgets asking for records).
      act(() => screen.getByRole('button', { name: 'reload' }).click());
      view.rerenderWith({ storage: server.storage, snapshot: server.read() });
      expect(live()).toBe(store);

      server.writeElsewhere(addWidget(createComposition(), first));
      act(() => store.getState().updateSettings({ columns: 4 }));
      await wait(1000);
      expect(store.getState().saveStatus).toBe('conflict');
      view.rerenderWith({ storage: server.storage, snapshot: server.read() });
      expect(live()).toBe(store);
      expect(columns()).toBe(4);
    });

    it('keeps an edit made while a save is in flight, through a refresh that echoes that save', async () => {
      vi.useFakeTimers();
      const server = revisionedServer();
      const view = renderProvider({
        storage: server.storage,
        snapshot: server.read(),
      });
      const store = live();
      const release = server.holdAnswers();
      act(() => store.getState().updateSettings({ columns: 4 }));
      await wait(500);
      expect(store.getState().saveStatus).toBe('saving');

      // The server already holds revision 2; its answer has not arrived.
      view.rerenderWith({ storage: server.storage, snapshot: server.read() });
      expect(live()).toBe(store);
      act(() => store.getState().updateSettings({ columns: 2 }));
      await act(async () => release());
      await wait(1000);

      expect(server.saves).toEqual(['ok@1->2', 'ok@2->3']);
      expect(live()).toBe(store);
      expect(columns()).toBe(2);
      expect(store.getState().saveStatus).toBe('saved');
    });

    it('keeps an edit whose save failed through a refresh, and Retry saves it', async () => {
      vi.useFakeTimers();
      const server = revisionedServer();
      const view = renderProvider({
        storage: server.storage,
        snapshot: server.read(),
      });
      const store = live();
      server.failSaves(true);
      act(() => store.getState().updateSettings({ columns: 4 }));
      await wait(2000);
      expect(store.getState().saveStatus).toBe('failed');

      view.rerenderWith({ storage: server.storage, snapshot: server.read() });
      expect(live()).toBe(store);
      expect(columns()).toBe(4);

      server.failSaves(false);
      act(() => store.getState().requestSave());
      await wait(100);
      expect(server.saves).toEqual(['failed@1', 'failed@1', 'ok@1->2']);
      expect(store.getState().saveStatus).toBe('saved');
    });

    it('a different dashboard replaces the store, and the pending edit is saved to the dashboard it was made on', async () => {
      vi.useFakeTimers();
      const server = revisionedServer();
      const view = renderProvider({
        storage: server.storage,
        snapshot: server.read(),
      });
      const store = live();
      act(() => store.getState().updateSettings({ columns: 4 }));
      await wait(100);

      const other = createComposition();
      view.rerenderWith({
        storage: server.storage,
        dashboardId: OTHER,
        snapshot: snapshotOf(other, 5),
      });
      expect(live()).not.toBe(store);
      expect(live().getState().composition).toBe(other);
      await wait(1000);
      expect(server.saveComposition).toHaveBeenCalledTimes(1);
      expect(server.saveComposition).toHaveBeenCalledWith(
        DASH,
        expect.objectContaining({
          settings: expect.objectContaining({ columns: 4 }),
        }),
        1,
      );
    });
  });
});
