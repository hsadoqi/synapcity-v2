import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardConfigProvider } from '../../config';
import { LinkItemsLoader } from './link-items-loader';

const state = vi.hoisted(() => ({
  saveStatus: 'saved' as string,
  widgets: [] as { type: string }[],
}));

vi.mock('../../store', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store')>()),
  useDashboardStore: (select: (s: unknown) => unknown) =>
    select({
      saveStatus: state.saveStatus,
      composition: { widgets: state.widgets },
    }),
}));

function mount(
  unloaded: ('space' | 'document' | 'dashboard')[],
  onReload: (() => void) | null,
) {
  return render(
    <DashboardConfigProvider unloadedKinds={unloaded} onReload={onReload}>
      <LinkItemsLoader />
    </DashboardConfigProvider>,
  );
}

describe('LinkItemsLoader', () => {
  const reload = () => vi.fn();

  it('does nothing while no widget needs an unread kind', () => {
    state.saveStatus = 'saved';
    state.widgets = [{ type: 'spaces' }];
    const onReload = reload();
    mount(['document', 'dashboard'], onReload);
    expect(onReload).not.toHaveBeenCalled();
  });

  it('waits for the save, then asks the host to read again, once', () => {
    state.widgets = [{ type: 'pinned' }];
    const onReload = reload();

    state.saveStatus = 'unsaved';
    const { rerender } = mount(['document'], onReload);
    expect(onReload).not.toHaveBeenCalled();

    state.saveStatus = 'saving';
    rerender(
      <DashboardConfigProvider unloadedKinds={['document']} onReload={onReload}>
        <LinkItemsLoader />
      </DashboardConfigProvider>,
    );
    expect(onReload).not.toHaveBeenCalled();

    state.saveStatus = 'saved';
    rerender(
      <DashboardConfigProvider unloadedKinds={['document']} onReload={onReload}>
        <LinkItemsLoader />
      </DashboardConfigProvider>,
    );
    expect(onReload).toHaveBeenCalledOnce();

    // The host still cannot supply it: no loop.
    rerender(
      <DashboardConfigProvider unloadedKinds={['document']} onReload={onReload}>
        <LinkItemsLoader />
      </DashboardConfigProvider>,
    );
    expect(onReload).toHaveBeenCalledOnce();
  });

  it('does not ask a host that cannot re-read', () => {
    state.saveStatus = 'saved';
    state.widgets = [{ type: 'last-opened' }];
    expect(() => mount(['space'], null)).not.toThrow();
  });

  it('does not ask after a failed save or a conflict', () => {
    state.widgets = [{ type: 'pinned' }];
    for (const status of ['failed', 'conflict']) {
      state.saveStatus = status;
      const onReload = reload();
      mount(['document'], onReload);
      expect(onReload).not.toHaveBeenCalled();
    }
  });
});
