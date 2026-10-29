import { addWidget, createComposition } from '@synapcity/domain-dashboards';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  memoryDashboardStorage,
  seededWorkspace,
  SEED_NOW,
  SEED_OWNER,
} from '../../../testing';
import { useDashboardStoreApi } from '../../store';
import { DashboardWidgetsDestination } from '../dashboard-widgets-destination';
import { DashboardWorkspaceProvider } from '../dashboard-workspace';
import { DashboardEditorSurface } from './index';

const { composition: seeded, records } = seededWorkspace();
const storage = memoryDashboardStorage(SEED_OWNER);

/** Gives a test the store the surface is reading. */
const grabbed: { store?: ReturnType<typeof useDashboardStoreApi> } = {};
const store = {
  getState: () => grabbed.store!.getState(),
};
function Grab() {
  const api = useDashboardStoreApi();
  useEffect(() => {
    grabbed.store = api;
  });
  return null;
}

function renderSurface({
  composition = createComposition(),
  onOpenPalette,
  host = <DashboardWidgetsDestination />,
  announce,
}: {
  composition?: typeof seeded;
  onOpenPalette?: () => void;
  host?: React.ReactNode;
  announce?: boolean;
} = {}) {
  const ui = (c: typeof seeded, revision: number) => (
    <DashboardWorkspaceProvider
      dashboardId="d"
      ownerId={SEED_OWNER}
      storage={storage}
      snapshot={{ composition: c, records, revision }}
      now={() => SEED_NOW}
      breakpoint="lg"
    >
      <Grab />
      <DashboardEditorSurface
        onOpenPalette={onOpenPalette}
        announce={announce}
      />
      {host}
    </DashboardWorkspaceProvider>
  );
  const view = render(ui(composition, 1));
  return {
    ...view,
    replaceSnapshot: (c: typeof seeded) => view.rerender(ui(c, 2)),
  };
}

/** The surface's own toggle: the host's explanation also offers an Edit layout button. */
const editButton = () =>
  screen
    .getAllByRole('button', { name: 'Edit layout' })
    .find((button) => button.hasAttribute('aria-pressed'))!;

describe('DashboardEditorSurface', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('renders no inline widgets column: the palette belongs to the host', () => {
    renderSurface({ composition: seeded, host: null });
    fireEvent.click(editButton());
    expect(screen.queryByRole('complementary', { name: 'Widgets' })).toBeNull();
    expect(
      screen.queryByRole('region', { name: 'Add to dashboard' }),
    ).toBeNull();
  });

  it('asks the host for the palette when Edit layout turns editing on, and not when it turns it off', () => {
    const onOpenPalette = vi.fn();
    renderSurface({ composition: seeded, onOpenPalette });
    const edit = editButton();
    fireEvent.click(edit);
    expect(onOpenPalette).toHaveBeenCalledTimes(1);
    expect(store.getState().editMode).toBe(true);
    fireEvent.click(edit);
    expect(onOpenPalette).toHaveBeenCalledTimes(1);
    expect(store.getState().editMode).toBe(false);
  });

  it('does not move focus from Edit layout when the host has no palette to show', () => {
    renderSurface({ composition: seeded, host: null });
    const edit = editButton();
    edit.focus();
    fireEvent.click(edit);
    act(() => vi.advanceTimersByTime(100));
    expect(document.activeElement).toBe(edit);
  });

  it('asks the host once from Add a widget in the empty state, turns editing on and focuses the palette', () => {
    const onOpenPalette = vi.fn();
    renderSurface({ onOpenPalette });
    fireEvent.click(screen.getByRole('button', { name: 'Add a widget' }));
    expect(onOpenPalette).toHaveBeenCalledTimes(1);
    expect(store.getState().editMode).toBe(true);
    act(() => vi.advanceTimersByTime(50));
    const palette = screen.getByRole('region', { name: 'Add to dashboard' });
    expect(document.activeElement).toBe(
      within(palette).getAllByRole('button')[0],
    );
  });

  it('asks the host again before focusing the palette once the last widget is removed', () => {
    const onOpenPalette = vi.fn();
    const one = addWidget(createComposition(), seeded.widgets[0]!);
    renderSurface({ composition: one, onOpenPalette });
    fireEvent.click(editButton());
    expect(onOpenPalette).toHaveBeenCalledTimes(1);
    act(() => store.getState().removeWidget(one.widgets[0]!.id));
    act(() => vi.advanceTimersByTime(200));
    expect(onOpenPalette).toHaveBeenCalledTimes(2);
  });

  it('waits for an inert palette, then focuses it, and never when editing has been turned off meanwhile', () => {
    const view = renderSurface({
      host: (
        <div id="slot" inert>
          <DashboardWidgetsDestination />
        </div>
      ),
      onOpenPalette: () => {},
    });
    const slot = () => view.container.ownerDocument.getElementById('slot')!;
    fireEvent.click(editButton());
    act(() => vi.advanceTimersByTime(100));
    expect(slot().contains(document.activeElement)).toBe(false);
    slot().removeAttribute('inert');
    act(() => vi.advanceTimersByTime(50));
    expect(slot().contains(document.activeElement)).toBe(true);

    // Second time: editing is turned off again before the panel opens.
    fireEvent.click(editButton()); // off
    (document.activeElement as HTMLElement | null)?.blur();
    slot().setAttribute('inert', '');
    fireEvent.click(editButton()); // on: the handoff starts and waits
    fireEvent.click(editButton()); // off: it is cancelled
    slot().removeAttribute('inert');
    act(() => vi.advanceTimersByTime(100));
    expect(slot().contains(document.activeElement)).toBe(false);
  });

  it('cancels a pending palette handoff when it unmounts', () => {
    const view = renderSurface({
      host: (
        <div id="slot" inert>
          <div data-slot="widget-palette">
            <button>Pinned</button>
          </div>
        </div>
      ),
      onOpenPalette: () => {},
    });
    fireEvent.click(editButton());
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not take focus to a widget that is inert behind a panel, and announces the addition', () => {
    const view = renderSurface({ composition: createComposition() });
    // The host covers the canvas: the surface's own region is inert.
    fireEvent.click(editButton());
    const palette = screen.getByRole('region', { name: 'Add to dashboard' });
    const pinned = within(palette).getByRole('button', { name: 'Pinned' });
    pinned.focus();
    const surface = view.container.firstElementChild as HTMLElement;
    surface.setAttribute('inert', '');
    fireEvent.click(pinned);
    act(() => vi.advanceTimersByTime(200));
    expect(document.activeElement).toBe(pinned);
    expect(screen.getByText('Pinned added')).toBeDefined();
  });

  it('can leave the live region to the host', () => {
    renderSurface({ announce: false, host: null });
    expect(screen.queryAllByRole('status').length).toBe(1); // the save status only
  });

  it('does not move focus when the store is replaced', () => {
    const view = renderSurface({ composition: seeded });
    fireEvent.click(editButton());
    const edit = editButton();
    edit.focus();
    view.replaceSnapshot(addWidget(createComposition(), seeded.widgets[0]!));
    act(() => vi.advanceTimersByTime(300));
    expect(editButton()).toBe(edit);
    expect(document.activeElement).toBe(edit);
    expect(store.getState().editMode).toBe(true);
  });

  it('keeps editing and its unsaved changes when the palette content is hidden and shown again', () => {
    const view = renderSurface({ composition: seeded });
    fireEvent.click(editButton());
    act(() => store.getState().addWidget('pinned'));
    const slotRoot = screen.getByRole('region', { name: 'Add to dashboard' })
      .parentElement!.parentElement!;
    slotRoot.hidden = true;
    slotRoot.hidden = false;
    expect(store.getState().editMode).toBe(true);
    expect(store.getState().saveStatus).toBe('unsaved');
    view.unmount();
  });
});
