import { createRef, useState, type ComponentProps } from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';

import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@synapcity/frontend-ui/core/dialog';

function Example({
  rootProps,
  contentProps,
  footerClose = false,
  disabled = false,
}: {
  rootProps?: ComponentProps<typeof Dialog>;
  contentProps?: ComponentProps<typeof DialogContent>;
  footerClose?: boolean;
  disabled?: boolean;
}) {
  return (
    <Dialog {...rootProps}>
      <DialogTrigger disabled={disabled} render={<Button variant="outline" />}>
        Edit document
      </DialogTrigger>
      <DialogContent {...contentProps}>
        <DialogHeader data-testid="header" className="mb-2">
          <DialogTitle id="edit-title">Edit document details</DialogTitle>
          <DialogDescription id="edit-description">
            Change the document name.
          </DialogDescription>
        </DialogHeader>
        <label>
          Name
          <input name="name" defaultValue="My document" />
        </label>
        <DialogFooter
          data-testid="footer"
          className="mt-2"
          showCloseButton={footerClose}
        >
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

describe('Dialog', () => {
  it('starts closed and opens a labelled, described dialog from a composed trigger', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Edit document' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger.getAttribute('data-slot')).toBe('dialog-trigger');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.querySelector('button')).toBeNull();
    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', {
      name: 'Edit document details',
      description: 'Change the document name.',
    });
    expect(dialog.getAttribute('data-slot')).toBe('dialog-content');
    expect(dialog.getAttribute('aria-labelledby')).toBe(
      screen.getByRole('heading', { name: 'Edit document details' }).id,
    );
    expect(dialog.getAttribute('aria-describedby')).toBe(
      screen.getByText('Change the document name.').id,
    );
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(dialog.id);
  });

  it('supports defaultOpen and portals content outside the render container', async () => {
    const { container, baseElement } = render(
      <Example rootProps={{ defaultOpen: true }} />,
    );
    const dialog = await screen.findByRole('dialog');
    expect(container.contains(dialog)).toBe(false);
    expect(baseElement.contains(dialog)).toBe(true);
    expect(
      baseElement.querySelector('[data-slot="dialog-overlay"]'),
    ).not.toBeNull();
  });

  it.each(['Close', 'Cancel'])(
    'dismisses with the %s button and restores trigger state',
    async (name) => {
      render(<Example />);
      const trigger = screen.getByRole('button', { name: 'Edit document' });
      fireEvent.click(trigger);
      const dialog = await screen.findByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    },
  );

  it('dismisses on Escape', async () => {
    render(<Example rootProps={{ defaultOpen: true }} />);
    const dialog = await screen.findByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('reports opening and closing requests with their event details', async () => {
    const onOpenChange = vi.fn();
    render(<Example rootProps={{ onOpenChange }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit document' }));
    const dialog = await screen.findByRole('dialog');
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' }),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'close-press' }),
    );
  });

  it('keeps controlled state authoritative until the owner updates open', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Example rootProps={{ open: false, onOpenChange }} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit document' }));
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.any(Object));
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<Example rootProps={{ open: true, onOpenChange }} />);
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.any(Object));
    expect(screen.getByRole('dialog')).toBe(dialog);
    rerender(<Example rootProps={{ open: false, onOpenChange }} />);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('supports the complete controlled open and close flow', async () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return <Example rootProps={{ open, onOpenChange: setOpen }} />;
    }
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit document' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('can cancel dismissal through onOpenChange event details', async () => {
    render(
      <Example
        rootProps={{
          defaultOpen: true,
          onOpenChange: (open, details) => {
            if (!open) details.cancel();
          },
        }}
      />,
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    expect(screen.getByRole('dialog')).toBe(dialog);
  });

  it('does not open from a disabled trigger', () => {
    const onOpenChange = vi.fn();
    render(<Example disabled rootProps={{ onOpenChange }} />);
    const trigger = screen.getByRole('button', { name: 'Edit document' });
    expect(trigger.hasAttribute('disabled')).toBe(true);
    fireEvent.click(trigger);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('can omit the built-in corner close button while retaining an explicit close action', async () => {
    render(
      <Example
        rootProps={{ defaultOpen: true }}
        contentProps={{ showCloseButton: false }}
      />,
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: 'Close' })).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('can add a footer close button independently of the corner button', async () => {
    render(
      <Example
        rootProps={{ defaultOpen: true }}
        contentProps={{ showCloseButton: false }}
        footerClose
      />,
    );
    const dialog = await screen.findByRole('dialog');
    const close = within(screen.getByTestId('footer')).getByRole('button', {
      name: 'Close',
    });
    expect(
      within(dialog).getAllByRole('button', { name: 'Close' }),
    ).toHaveLength(1);
    fireEvent.click(close);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('forwards content attributes, refs and layout classes', async () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Example
        rootProps={{ defaultOpen: true }}
        contentProps={{
          ref,
          id: 'custom-dialog',
          className: 'sm:max-w-lg',
          'aria-label': 'Rename document',
        }}
      />,
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Edit document details',
    });
    expect(dialog.id).toBe('custom-dialog');
    expect(dialog.getAttribute('aria-label')).toBe('Rename document');
    expect(dialog.classList.contains('sm:max-w-lg')).toBe(true);
    expect(dialog.classList.contains('sm:max-w-sm')).toBe(false);
    expect(ref.current).toBe(dialog);
  });

  it('forwards header and footer props and marks the title and description slots', async () => {
    render(<Example rootProps={{ defaultOpen: true }} />);
    await screen.findByRole('dialog');
    expect(screen.getByTestId('header').getAttribute('data-slot')).toBe(
      'dialog-header',
    );
    expect(screen.getByTestId('header').classList.contains('mb-2')).toBe(true);
    expect(screen.getByTestId('footer').getAttribute('data-slot')).toBe(
      'dialog-footer',
    );
    expect(screen.getByTestId('footer').classList.contains('mt-2')).toBe(true);
    expect(screen.getByRole('heading').getAttribute('data-slot')).toBe(
      'dialog-title',
    );
    expect(
      screen.getByText('Change the document name.').getAttribute('data-slot'),
    ).toBe('dialog-description');
    expect(
      screen.getByRole('button', { name: 'Cancel' }).getAttribute('data-slot'),
    ).toBe('dialog-close');
  });

  it('supports title and description render composition and merged classes', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle render={<h3 />} className="mb-2">
            Details
          </DialogTitle>
          <DialogDescription className="mt-2">
            <a href="#help">Read help</a>
          </DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Details',
      description: 'Read help',
    });
    expect(
      within(dialog)
        .getByRole('heading', { level: 3 })
        .classList.contains('mb-2'),
    ).toBe(true);
    expect(
      screen.getByText('Read help').parentElement?.classList.contains('mt-2'),
    ).toBe(true);
  });

  it('forwards a custom portal container and overlay props', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const onClick = vi.fn();
    try {
      const { unmount } = render(
        <Dialog defaultOpen>
          <DialogPortal container={host}>
            <DialogOverlay
              className="fixed"
              data-testid="overlay"
              onClick={onClick}
            />
            <DialogPrimitive.Popup>
              <DialogTitle>Portal destination</DialogTitle>
              <DialogDescription>Custom host.</DialogDescription>
            </DialogPrimitive.Popup>
          </DialogPortal>
        </Dialog>,
      );
      const overlay = await screen.findByTestId('overlay');
      expect(host.contains(overlay)).toBe(true);
      expect(overlay.getAttribute('data-slot')).toBe('dialog-overlay');
      expect(overlay.classList.contains('fixed')).toBe(true);
      fireEvent.click(overlay);
      expect(onClick).toHaveBeenCalledTimes(1);
      unmount();
    } finally {
      host.remove();
    }
  });
});
