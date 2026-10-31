import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { removeWidget } from '@synapcity/domain-dashboards';

import { renderWithStore, seededWorkspace } from '../../../testing';
import { DashboardConfigProvider } from '../../config';
import { WidgetsPanel } from './index';

function removeAllBut(
  composition: ReturnType<typeof seededWorkspace>['composition'],
  keep: string,
) {
  return composition.widgets
    .filter((w) => w.id !== keep)
    .reduce((c, w) => removeWidget(c, w.id), composition);
}

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
      'Agenda',
      'Notes',
      'Habit tracker',
      'Goal tracker',
      'Pinned',
      'Last opened',
      'Spaces',
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

  it('offers only the widget types the host allows', () => {
    renderWithStore(
      <DashboardConfigProvider widgetTypes={['pinned', 'spaces']}>
        <WidgetsPanel />
      </DashboardConfigProvider>,
    );
    const palette = screen.getByRole('region', { name: 'Add to dashboard' });
    expect(
      within(palette)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Pinned', 'Spaces']);
  });

  it('leaves out Hidden and Archived when the host stores no widget status', () => {
    renderWithStore(
      <DashboardConfigProvider persistsStatus={false}>
        <WidgetsPanel />
      </DashboardConfigProvider>,
    );
    expect(screen.queryByRole('heading', { name: /Hidden/ })).toBeNull();
    expect(screen.queryByRole('heading', { name: /Archived/ })).toBeNull();
  });

  describe('Arrange', () => {
    it('moves a widget earlier or later without pointing or spatial keys', () => {
      const { store } = renderWithStore(<WidgetsPanel />);
      const arrange = screen.getByRole('region', { name: 'Arrange' });
      const rows = () =>
        within(arrange)
          .getAllByRole('listitem')
          .map((li) => li.textContent);
      const before = rows();

      fireEvent.click(
        within(arrange).getByRole('button', {
          name: `Move ${before[1]} earlier`,
        }),
      );

      expect(rows()).toEqual([before[1], before[0], ...before.slice(2)]);
      expect(store().getState().announcement).toMatch(
        /moved earlier, position 1/,
      );
    });

    it('cannot move the first widget earlier or the last later', () => {
      renderWithStore(<WidgetsPanel />);
      const arrange = screen.getByRole('region', { name: 'Arrange' });
      const items = within(arrange).getAllByRole('listitem');
      expect(
        within(items[0]!)
          .getByRole('button', { name: /earlier/ })
          .hasAttribute('disabled'),
      ).toBe(true);
      expect(
        within(items.at(-1)!)
          .getByRole('button', { name: /later/ })
          .hasAttribute('disabled'),
      ).toBe(true);
    });

    it('is not shown for a single widget', () => {
      const { composition } = seededWorkspace();
      const single = removeAllBut(composition, composition.widgets[0]!.id);
      renderWithStore(<WidgetsPanel />, { composition: single });
      expect(screen.queryByRole('region', { name: 'Arrange' })).toBeNull();
    });
  });
});
