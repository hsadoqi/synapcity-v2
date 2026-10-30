import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@synapcity/frontend-ui/core/button';
import { Pin } from 'lucide-react';
import { AgendaActionsMenu } from '@/blocks/day-agenda/agenda-actions-menu';

describe('AgendaActionsMenu', () => {
  it('opens settings from the default cog and offers the add menu', async () => {
    render(<AgendaActionsMenu title="Settings" description="Preferences" />);
    // jsdom applies no CSS, so both the compact and the wide menu are present.
    expect(
      screen.getAllByRole('button', { name: 'More actions' }),
    ).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Agenda settings' }));
    expect(
      await screen.findByRole('dialog', { name: 'Settings' }),
    ).toBeDefined();
  });

  it('takes a custom trigger and body', async () => {
    render(
      <AgendaActionsMenu
        title="Settings"
        description="Preferences"
        trigger={<Button>Configure</Button>}
      >
        <p>Custom body</p>
      </AgendaActionsMenu>,
    );
    expect(
      screen.queryByRole('button', { name: 'Agenda settings' }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('Custom body');
  });
});

describe('AgendaActionsMenu toolbar', () => {
  const items = [
    { label: 'Pin', icon: <Pin />, onSelect: vi.fn() },
    { label: 'Help' },
  ];

  it('makes icon items toolbar buttons and keeps every item in the compact menu', async () => {
    const { container } = render(
      <AgendaActionsMenu
        title="Settings"
        description="Preferences"
        menuItems={items}
      />,
    );
    const pin = screen.getByRole('button', { name: 'Pin' });
    expect(pin.className).toContain('@toolbar-icons/actions:inline-flex');
    fireEvent.click(pin);
    expect(items[0]!.onSelect).toHaveBeenCalledTimes(1);

    const compact = container.querySelector(
      '[data-slot="actions-toolbar-more-compact"] button',
    )!;
    fireEvent.click(compact);
    const menu = await screen.findByRole('menu');
    expect(menu.textContent).toContain('Pin');
    expect(menu.textContent).toContain('Help');
  });

  it('leaves only icon-less items in the wide menu', async () => {
    const { container } = render(
      <AgendaActionsMenu
        title="Settings"
        description="Preferences"
        menuItems={items}
      />,
    );
    fireEvent.click(
      container.querySelector(
        '[data-slot="actions-toolbar-more-wide"] button',
      )!,
    );
    const menu = await screen.findByRole('menu');
    expect(menu.textContent).toContain('Help');
    expect(menu.textContent).not.toContain('Pin');
  });

  it('drops the wide menu when every item has an icon', () => {
    const { container } = render(
      <AgendaActionsMenu
        title="Settings"
        description="Preferences"
        menuItems={[{ label: 'Pin', icon: <Pin /> }]}
      />,
    );
    expect(
      container.querySelector('[data-slot="actions-toolbar-more-wide"]'),
    ).toBeNull();
  });
});

describe('AgendaActionsMenu settings presentation', () => {
  it('calls onOpenSettingsView instead of opening a dialog for view', () => {
    const onOpenSettingsView = vi.fn();
    render(
      <AgendaActionsMenu
        title="Settings"
        description="Preferences"
        settingsPresentation="view"
        onOpenSettingsView={onOpenSettingsView}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Agenda settings' }));
    expect(onOpenSettingsView).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders both triggers for auto, each behind its container query', () => {
    render(
      <AgendaActionsMenu
        title="Settings"
        description="Preferences"
        settingsPresentation="auto"
        onOpenSettingsView={vi.fn()}
      />,
    );
    const [dialogTrigger, viewTrigger] = screen.getAllByRole('button', {
      name: 'Agenda settings',
    });
    expect(dialogTrigger!.parentElement!.className).toContain(
      '@3xs/actions:block',
    );
    expect(viewTrigger!.parentElement!.className).toContain(
      '@3xs/actions:hidden',
    );
  });

  it('keeps a custom trigger working for view', () => {
    const onOpenSettingsView = vi.fn();
    render(
      <AgendaActionsMenu
        title="Settings"
        description="Preferences"
        settingsPresentation="view"
        onOpenSettingsView={onOpenSettingsView}
        trigger={<Button>Configure</Button>}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    expect(onOpenSettingsView).toHaveBeenCalledTimes(1);
  });
});
