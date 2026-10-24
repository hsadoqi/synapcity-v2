import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@synapcity/frontend-ui/core/button';
import { DialogPortalContainer } from '@synapcity/frontend-ui/blocks/dialog-portal-container';

describe('DialogPortalContainer', () => {
  it('opens from its trigger as a dialog named and described by its text', async () => {
    render(
      <DialogPortalContainer
        trigger={<Button>Open settings</Button>}
        title="Settings"
        description="Configure the agenda."
      >
        <p>Body</p>
      </DialogPortalContainer>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    const dialog = await screen.findByRole('dialog', { name: 'Settings' });
    expect(dialog.textContent).toContain('Configure the agenda.');
    expect(dialog.textContent).toContain('Body');
  });

  it('renders inline by default, inside the element that holds it', async () => {
    render(
      <section data-testid="scope">
        <DialogPortalContainer defaultOpen title="Inline" />
      </section>,
    );
    const dialog = await screen.findByRole('dialog');
    expect(screen.getByTestId('scope').contains(dialog)).toBe(true);
  });

  it('renders in body when asked', async () => {
    render(
      <section data-testid="scope">
        <DialogPortalContainer defaultOpen container="body" title="Global" />
      </section>,
    );
    const dialog = await screen.findByRole('dialog');
    expect(screen.getByTestId('scope').contains(dialog)).toBe(false);
    expect(
      document.querySelector('[data-slot="dialog-container-anchor"]'),
    ).toBeNull();
  });

  it('renders into a given container element', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    try {
      render(
        <DialogPortalContainer defaultOpen container={host} title="Hosted" />,
      );
      const dialog = await screen.findByRole('dialog');
      expect(host.contains(dialog)).toBe(true);
    } finally {
      host.remove();
    }
  });

  it('can omit the overlay and the close button', async () => {
    render(
      <DialogPortalContainer
        defaultOpen
        overlay={false}
        showCloseButton={false}
        title="Bare"
      />,
    );
    const dialog = await screen.findByRole('dialog');
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toBeNull();
    expect(within(dialog).queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('wraps the body in a scroll area only when scrollable', async () => {
    const { rerender } = render(
      <DialogPortalContainer defaultOpen title="Plain">
        <p>Body</p>
      </DialogPortalContainer>,
    );
    let dialog = await screen.findByRole('dialog');
    expect(dialog.querySelector('[data-slot="scroll-area"]')).toBeNull();

    rerender(
      <DialogPortalContainer defaultOpen scrollable title="Plain">
        <p>Body</p>
      </DialogPortalContainer>,
    );
    dialog = await screen.findByRole('dialog');
    expect(dialog.querySelector('[data-slot="scroll-area"]')).not.toBeNull();
  });

  it('renders a footer and stays controlled by its owner', async () => {
    const onOpenChange = vi.fn();
    render(
      <DialogPortalContainer
        open
        onOpenChange={onOpenChange}
        title="Controlled"
        footer={<Button>Save</Button>}
      />,
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDefined();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalled());
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
    // The owner did not update `open`, so the dialog stays.
    expect(screen.getByRole('dialog')).toBeDefined();
  });
});
