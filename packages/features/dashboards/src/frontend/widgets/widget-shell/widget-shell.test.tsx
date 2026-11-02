import { DEFAULT_SETTINGS, type Widget } from '@synapcity/domain-dashboards';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WidgetShell, type WidgetShellToolbar } from './index';

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
  {
    editMode = true,
    showWidgetTitles = true,
    toolbar,
  }: {
    editMode?: boolean;
    showWidgetTitles?: boolean;
    toolbar?: WidgetShellToolbar;
  } = {},
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
      toolbar={toolbar}
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

  it('returns focus to the rename button after Enter', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Rename Steps today' }));
    const input = screen.getByRole('textbox', { name: 'Widget title' });
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: 'Daily steps' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Rename Steps today' }),
    );
  });

  it('returns focus to the rename button after Escape', () => {
    const actions = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Rename Steps today' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Widget title' }), {
      key: 'Escape',
    });
    expect(actions.update).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Rename Steps today' }),
    );
  });

  it('does not rename on an Enter that confirms an IME composition', () => {
    const actions = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Rename Steps today' }));
    const input = screen.getByRole('textbox', { name: 'Widget title' });
    fireEvent.change(input, { target: { value: '歩数' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(actions.update).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Widget title' })).toBe(input);
  });

  it('keeps the Escape it consumes from reaching an enclosing overlay or shell', () => {
    // Base UI dismisses overlays from a document keydown listener, which does
    // not check defaultPrevented; shell shortcuts check it instead.
    const documentHandler = vi.fn();
    document.addEventListener('keydown', documentHandler);
    try {
      setup();
      fireEvent.click(
        screen.getByRole('button', { name: 'Rename Steps today' }),
      );
      const input = screen.getByRole('textbox', { name: 'Widget title' });
      const escape = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(escape);
      expect(escape.defaultPrevented).toBe(true);
      expect(documentHandler).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', documentHandler);
    }
  });

  it('commits on blur without pulling focus back from where the pointer went', () => {
    const actions = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Rename Steps today' }));
    const input = screen.getByRole('textbox', { name: 'Widget title' });
    fireEvent.change(input, { target: { value: 'Daily steps' } });
    const collapse = screen.getByRole('button', {
      name: 'Collapse Steps today',
    });
    collapse.focus();
    expect(actions.update).toHaveBeenCalledWith({ title: 'Daily steps' });
    expect(document.activeElement).toBe(collapse);
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

  it('shows the title in edit mode even when titles are hidden, so the rename button is never invisible', () => {
    setup({}, { editMode: true, showWidgetTitles: false });
    expect(
      screen.getByRole('heading', { name: 'Steps today' }).className,
    ).not.toContain('sr-only');
  });

  it('stays named while its title is edited', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Rename Steps today' }));
    expect(screen.getByRole('region', { name: 'Steps today' })).toBeDefined();
  });

  it('shows a drag cue only in edit mode', () => {
    setup({}, { editMode: false });
    expect(
      document.querySelector('[data-slot="widget-drag-handle"]'),
    ).toBeNull();
  });

  it('reveals the drag cue on hover or focus where the pointer can hover', () => {
    setup();
    const grip = document.querySelector('[data-slot="widget-drag-handle"]')!;
    expect(grip.getAttribute('aria-hidden')).toBe('true');
    const classes = grip.getAttribute('class')!;
    expect(classes).toContain('pointer-fine:opacity-0');
    expect(classes).toContain('pointer-fine:group-hover/widget:opacity-100');
    expect(classes).toContain(
      'pointer-fine:group-focus-within/widget:opacity-100',
    );
  });

  it('offers pin, hide and archive in view mode, and the layout actions only in edit mode', async () => {
    const actions = setup({}, { editMode: false });
    expect(screen.getByRole('button', { name: 'Pin' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Lock position' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
    expect(actions.update).toHaveBeenCalledWith({ pinned: true });

    const [compact] = screen.getAllByRole('button', { name: 'More actions' });
    fireEvent.click(compact!);
    const menu = await screen.findByRole('menu');
    expect(menu.textContent).toContain('Hide');
    expect(menu.textContent).toContain('Archive');
    expect(menu.textContent).not.toContain('Keep size');
  });

  it('locks, unpins and stops resizing through update', async () => {
    const actions = setup({ pinned: true, locked: false });
    fireEvent.click(screen.getByRole('button', { name: 'Unpin' }));
    expect(actions.update).toHaveBeenCalledWith({ pinned: false });
    fireEvent.click(screen.getByRole('button', { name: 'Lock position' }));
    expect(actions.update).toHaveBeenCalledWith({ locked: true });
    const [compact] = screen.getAllByRole('button', { name: 'More actions' });
    fireEvent.click(compact!);
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Keep size' }));
    expect(actions.update).toHaveBeenCalledWith({ resizable: false });
  });

  it('hides and archives from the toolbar', async () => {
    const actions = setup({}, { editMode: false });
    const [compact] = screen.getAllByRole('button', { name: 'More actions' });
    fireEvent.click(compact!);
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Hide' }));
    expect(actions.hide).toHaveBeenCalledTimes(1);
  });

  it('drops the drag cue of a locked widget', () => {
    setup({ locked: true });
    expect(
      document.querySelector('[data-slot="widget-drag-handle"]'),
    ).toBeNull();
  });

  it("shows the content's actions in the header", () => {
    const onSelect = vi.fn();
    setup({}, { toolbar: { actions: [{ label: 'Refresh', onSelect }] } });
    expect(
      document.querySelector('[data-slot="actions-toolbar"]'),
    ).not.toBeNull();
    expect(
      screen.getAllByRole('button', { name: 'More actions' }).length,
    ).toBeGreaterThan(0);
  });

  it("swaps the body for the content's settings in place, and back", () => {
    setup(
      {},
      {
        toolbar: {
          settings: {
            title: 'Steps settings',
            presentation: 'view',
            content: <p>Daily goal</p>,
          },
        },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(
      screen.getByRole('region', { name: 'Steps settings' }).textContent,
    ).toContain('Daily goal');
    expect(screen.queryByText('Body')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByText('Body')).toBeDefined();
  });
});
