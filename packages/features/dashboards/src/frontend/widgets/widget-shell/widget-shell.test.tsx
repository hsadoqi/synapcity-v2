import { DEFAULT_SETTINGS, type Widget } from '@synapcity/domain-dashboards';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WidgetShell } from './index';

const widget: Widget = {
  id: 'wgt_1',
  title: 'Steps today',
  collapsed: false,
  highlight: 'none',
  status: 'active',
  type: 'stat',
  source: { kind: 'metric', id: 'met_1' },
};

function setup(
  overrides: Partial<Widget> = {},
  { editMode = true, showWidgetTitles = true } = {},
) {
  const actions = {
    update: vi.fn(),
    duplicate: vi.fn(),
    hide: vi.fn(),
    archive: vi.fn(),
    remove: vi.fn(),
  };
  render(
    <WidgetShell
      widget={{ ...widget, ...overrides } as Widget}
      settings={{ ...DEFAULT_SETTINGS, showWidgetTitles }}
      editMode={editMode}
      actions={actions}
    >
      <p>Body</p>
    </WidgetShell>,
  );
  return actions;
}

describe('WidgetShell', () => {
  it('is a region named by its title', () => {
    setup({}, { editMode: false });
    expect(screen.getByRole('region', { name: 'Steps today' })).toBeDefined();
    expect(screen.getByText('Body')).toBeDefined();
  });

  it('keeps the title for screen readers when titles are hidden', () => {
    setup({}, { editMode: false, showWidgetTitles: false });
    expect(
      screen.getByRole('heading', { name: 'Steps today' }).className,
    ).toContain('sr-only');
  });

  it('renames on Enter with a trimmed, changed title', () => {
    const actions = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Rename Steps today' }));
    const input = screen.getByRole('textbox', { name: 'Widget title' });
    fireEvent.change(input, { target: { value: '  Daily steps ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(actions.update).toHaveBeenCalledWith({ title: 'Daily steps' });
  });

  it('cancels a rename on Escape and ignores an empty title', () => {
    const actions = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Rename Steps today' }));
    const input = screen.getByRole('textbox', { name: 'Widget title' });
    fireEvent.change(input, { target: { value: 'Other' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Rename Steps today' }));
    const again = screen.getByRole('textbox', { name: 'Widget title' });
    fireEvent.change(again, { target: { value: '   ' } });
    fireEvent.keyDown(again, { key: 'Enter' });
    expect(actions.update).not.toHaveBeenCalled();
  });

  it('lets the keyboard reach the body, which scrolls when it overflows', () => {
    setup({}, { editMode: false });
    const body = screen.getByRole('group', { name: 'Steps today content' });
    expect(body.getAttribute('tabindex')).toBe('0');
    expect(body.textContent).toBe('Body');
  });

  it('collapses and expands, hiding the body when collapsed', () => {
    const actions = setup();
    fireEvent.click(
      screen.getByRole('button', { name: 'Collapse Steps today' }),
    );
    expect(actions.update).toHaveBeenCalledWith({ collapsed: true });
  });

  it('hides the body of a collapsed widget', () => {
    setup({ collapsed: true });
    expect(screen.queryByText('Body')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Expand Steps today' }),
    ).toBeDefined();
  });

  it('offers highlight and widget actions in its settings', async () => {
    const actions = setup();
    fireEvent.click(
      screen.getByRole('button', { name: 'Settings for Steps today' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Accent highlight' }),
    );
    expect(actions.update).toHaveBeenCalledWith({ highlight: 'accent' });
    for (const [name, action] of [
      ['Duplicate widget', actions.duplicate],
      ['Hide widget', actions.hide],
      ['Archive widget', actions.archive],
      ['Remove widget', actions.remove],
    ] as const) {
      fireEvent.click(
        screen.getByRole('button', { name: 'Settings for Steps today' }),
      );
      fireEvent.click(await screen.findByRole('button', { name }));
      expect(action).toHaveBeenCalledTimes(1);
    }
  });

  it('has no settings or rename outside edit mode', () => {
    setup({}, { editMode: false });
    expect(
      screen.queryByRole('button', { name: 'Settings for Steps today' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Rename Steps today' }),
    ).toBeNull();
  });
});
