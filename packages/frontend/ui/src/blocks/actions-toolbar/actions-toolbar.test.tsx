import { fireEvent, render, screen } from '@testing-library/react';
import { Pin } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { ActionsToolbar } from '@synapcity/frontend-ui/blocks/actions-toolbar';
import { Button } from '@synapcity/frontend-ui/core/button';

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-slot="${name}"]`);

describe('ActionsToolbar', () => {
  it('renders nothing but its box without actions or settings', () => {
    const { container } = render(<ActionsToolbar />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(slot(container, 'actions-toolbar')).not.toBeNull();
  });

  it('makes icon actions toolbar buttons that fold away below @3xs', () => {
    const onSelect = vi.fn();
    render(
      <ActionsToolbar actions={[{ label: 'Pin', icon: <Pin />, onSelect }]} />,
    );
    const pin = screen.getByRole('button', { name: 'Pin' });
    expect(pin.className).toContain('@3xs/actions:inline-flex');
    fireEvent.click(pin);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('keeps every action in the compact menu and only icon-less ones in the wide menu', async () => {
    const { container } = render(
      <ActionsToolbar
        actions={[{ label: 'Pin', icon: <Pin /> }, { label: 'Help' }]}
      />,
    );
    fireEvent.click(
      slot(container, 'actions-toolbar-more-compact')!.querySelector('button')!,
    );
    let menu = await screen.findByRole('menu');
    expect(menu.textContent).toContain('Pin');
    expect(menu.textContent).toContain('Help');
    fireEvent.keyDown(menu, { key: 'Escape' });

    fireEvent.click(
      slot(container, 'actions-toolbar-more-wide')!.querySelector('button')!,
    );
    menu = await screen.findByRole('menu');
    expect(menu.textContent).toContain('Help');
  });

  it('leaves out the wide menu when every action has an icon', () => {
    const { container } = render(
      <ActionsToolbar actions={[{ label: 'Pin', icon: <Pin /> }]} />,
    );
    expect(slot(container, 'actions-toolbar-more-wide')).toBeNull();
  });

  it('opens settings as a dialog by default', async () => {
    render(
      <ActionsToolbar settings={{ title: 'Settings', content: <p>Body</p> }} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = await screen.findByRole('dialog', { name: 'Settings' });
    expect(dialog.textContent).toContain('Body');
  });

  it('calls onOpenView for view, with a custom trigger', () => {
    const onOpenView = vi.fn();
    render(
      <ActionsToolbar
        settings={{
          title: 'Settings',
          presentation: 'view',
          onOpenView,
          trigger: <Button>Configure</Button>,
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));
    expect(onOpenView).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders both settings triggers for auto, each behind its container query', () => {
    const { container } = render(
      <ActionsToolbar
        settings={{
          title: 'Settings',
          presentation: 'auto',
          onOpenView: vi.fn(),
        }}
      />,
    );
    expect(
      slot(container, 'actions-toolbar-settings-dialog')!.className,
    ).toContain('@3xs/actions:block');
    expect(
      slot(container, 'actions-toolbar-settings-view')!.className,
    ).toContain('@3xs/actions:hidden');
  });

  it('shows host controls at every width', () => {
    render(
      <ActionsToolbar>
        <Button>Collapse</Button>
      </ActionsToolbar>,
    );
    expect(
      screen.getByRole('button', { name: 'Collapse' }).parentElement!.className,
    ).not.toContain('hidden');
  });
});
