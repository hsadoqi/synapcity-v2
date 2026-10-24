import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithStore } from '../../../testing/render-with-store';
import { WidgetsPanel } from './index';

describe('WidgetsPanel', () => {
  it('offers every widget type, in palette order', () => {
    const { store } = renderWithStore(<WidgetsPanel />);
    const palette = screen.getByRole('region', { name: 'Add to dashboard' });
    const names = within(palette)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names).toEqual([
      'Stat card',
      'Task list',
      'Recent activity',
      'Schedule',
      'Notes',
      'Habit tracker',
      'Goal tracker',
    ]);
    const before = store().getState().composition.widgets.length;
    fireEvent.click(within(palette).getByRole('button', { name: 'Task list' }));
    expect(store().getState().composition.widgets).toHaveLength(before + 1);
    expect(store().getState().composition.widgets.at(-1)?.type).toBe('tasks');
  });

  it('says when nothing is hidden or archived', () => {
    renderWithStore(<WidgetsPanel />);
    expect(screen.getByText('Nothing hidden.')).toBeDefined();
    expect(screen.getByText('Nothing archived.')).toBeDefined();
  });

  it('shows a hidden widget again', () => {
    const { store } = renderWithStore(<WidgetsPanel />);
    const widget = store().getState().composition.widgets[0]!;
    act(() => store().getState().setWidgetStatus(widget.id, 'hidden'));
    expect(screen.getByRole('heading', { name: 'Hidden (1)' })).toBeDefined();
    fireEvent.click(
      screen.getByRole('button', { name: `Show ${widget.title}` }),
    );
    expect(store().getState().composition.widgets[0]?.status).toBe('active');
  });

  it('deletes an archived widget only after confirming', async () => {
    const { store } = renderWithStore(<WidgetsPanel />);
    const widget = store().getState().composition.widgets[0]!;
    act(() => store().getState().setWidgetStatus(widget.id, 'archived'));
    fireEvent.click(
      screen.getByRole('button', { name: `Delete ${widget.title}` }),
    );
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(`Delete “${widget.title}”?`)).toBeDefined();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(
      store()
        .getState()
        .composition.widgets.some((w) => w.id === widget.id),
    ).toBe(true);
    fireEvent.click(
      screen.getByRole('button', { name: `Delete ${widget.title}` }),
    );
    fireEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Delete',
      }),
    );
    expect(
      store()
        .getState()
        .composition.widgets.some((w) => w.id === widget.id),
    ).toBe(false);
  });

  it('restores an archived widget', () => {
    const { store } = renderWithStore(<WidgetsPanel />);
    const widget = store().getState().composition.widgets[0]!;
    act(() => store().getState().setWidgetStatus(widget.id, 'archived'));
    fireEvent.click(
      screen.getByRole('button', { name: `Restore ${widget.title}` }),
    );
    expect(store().getState().composition.widgets[0]?.status).toBe('active');
  });
});
