import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithStore } from '../../../testing';
import { UNDO_WINDOW_MS, UndoRemove } from './index';

describe('UndoRemove', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('offers nothing until something is removed', () => {
    renderWithStore(<UndoRemove />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('puts the removed widget back', () => {
    const { store } = renderWithStore(<UndoRemove />);
    const before = store().getState().composition;
    const widget = before.widgets[0]!;
    act(() => store().getState().removeWidget(widget.id));

    fireEvent.click(
      screen.getByRole('button', { name: `Undo remove ${widget.title}` }),
    );

    expect(store().getState().composition.widgets).toEqual(before.widgets);
    expect(store().getState().composition.layouts.lg).toHaveLength(
      before.layouts.lg.length,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('stops offering Undo after the window', () => {
    const { store } = renderWithStore(<UndoRemove />);
    act(() =>
      store()
        .getState()
        .removeWidget(store().getState().composition.widgets[0]!.id),
    );
    expect(screen.getByRole('button')).toBeDefined();
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS));
    expect(screen.queryByRole('button')).toBeNull();
    expect(store().getState().removed).toBeNull();
  });

  it('stops offering Undo with the next change', () => {
    const { store } = renderWithStore(<UndoRemove />);
    act(() =>
      store()
        .getState()
        .removeWidget(store().getState().composition.widgets[0]!.id),
    );
    act(() => store().getState().updateSettings({ columns: 2 }));
    expect(screen.queryByRole('button')).toBeNull();
  });
});
