import { createComposition } from '@synapcity/domain-dashboards';
import { emptyRecords } from '@synapcity/domain-prototypes';
import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand/vanilla';

import {
  createDashboardStore,
  DashboardStoreScope,
  useDashboardStore,
  type DashboardStore,
} from './index';

function newStore(editMode = false) {
  return createDashboardStore({
    composition: createComposition(),
    records: emptyRecords(),
    ownerId: '11111111-1111-4111-8111-111111111111',
    breakpoint: 'lg',
    editMode,
  });
}

/** Counts the live subscriptions on a store. */
function counted(store: StoreApi<DashboardStore>) {
  const tally = { live: 0, ever: 0 };
  const subscribe = store.subscribe;
  store.subscribe = (listener) => {
    tally.live += 1;
    tally.ever += 1;
    const off = subscribe(listener);
    return () => {
      tally.live -= 1;
      off();
    };
  };
  return tally;
}

const rendered = vi.fn();
function Mode() {
  rendered();
  return <p>{useDashboardStore((s) => (s.editMode ? 'edit' : 'view'))}</p>;
}

describe('DashboardStoreScope', () => {
  it('moves consumers from the old store to the new one with no subscription left behind', () => {
    const a = newStore(false);
    const b = newStore(true);
    const onA = counted(a);
    const onB = counted(b);
    const view = render(
      <DashboardStoreScope store={a}>
        <Mode />
      </DashboardStoreScope>,
    );
    expect(onA.live).toBe(1);
    expect(view.container.textContent).toBe('view');

    view.rerender(
      <DashboardStoreScope store={b}>
        <Mode />
      </DashboardStoreScope>,
    );
    expect(onA.live).toBe(0);
    expect(onB.live).toBe(1);
    expect(view.container.textContent).toBe('edit');
  });

  it('ignores later changes to the old store and follows the new one', () => {
    const a = newStore(false);
    const b = newStore(false);
    const view = render(
      <DashboardStoreScope store={a}>
        <Mode />
      </DashboardStoreScope>,
    );
    view.rerender(
      <DashboardStoreScope store={b}>
        <Mode />
      </DashboardStoreScope>,
    );
    rendered.mockClear();
    act(() => a.getState().toggleEditMode());
    expect(rendered).not.toHaveBeenCalled();
    expect(view.container.textContent).toBe('view');
    act(() => b.getState().toggleEditMode());
    expect(view.container.textContent).toBe('edit');
  });

  it('releases its subscription on unmount', () => {
    const a = newStore();
    const onA = counted(a);
    const view = render(
      <DashboardStoreScope store={a}>
        <Mode />
      </DashboardStoreScope>,
    );
    view.unmount();
    expect(onA.live).toBe(0);
  });
});

describe('createDashboardStore editMode', () => {
  it('starts in edit mode when asked, and never when read-only', () => {
    expect(newStore(true).getState().editMode).toBe(true);
    const readOnly = createDashboardStore({
      composition: createComposition(),
      records: emptyRecords(),
      ownerId: '11111111-1111-4111-8111-111111111111',
      breakpoint: 'lg',
      editMode: true,
      readOnly: true,
    });
    expect(readOnly.getState().editMode).toBe(false);
  });
});
