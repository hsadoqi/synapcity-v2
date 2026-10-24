import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from '@synapcity/frontend-ui/core/sheet';

const renderSheet = (contentProps = {}, rootProps = {}) =>
  render(
    <Sheet {...rootProps}>
      <SheetTrigger>Open</SheetTrigger>
      <SheetContent {...contentProps}>
        <SheetHeader data-testid="header">
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
        </SheetHeader>
        <SheetFooter data-testid="footer">
          <SheetClose>Cancel</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>,
  );

describe('Sheet', () => {
  it('opens from its trigger as a named dialog', async () => {
    renderSheet();
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog', { name: 'Title' });

    expect(dialog.getAttribute('data-slot')).toBe('sheet-content');
    expect(screen.getByText('Description').getAttribute('data-slot')).toBe(
      'sheet-description',
    );
  });

  it('slides in from the right by default and honours side', async () => {
    const { unmount } = renderSheet({}, { defaultOpen: true });
    expect((await screen.findByRole('dialog')).getAttribute('data-side')).toBe(
      'right',
    );
    unmount();

    renderSheet({ side: 'left' }, { defaultOpen: true });
    expect((await screen.findByRole('dialog')).getAttribute('data-side')).toBe(
      'left',
    );
  });

  it('marks header and footer with their slots', async () => {
    renderSheet({}, { defaultOpen: true });
    await screen.findByRole('dialog');

    expect(screen.getByTestId('header').getAttribute('data-slot')).toBe(
      'sheet-header',
    );
    expect(screen.getByTestId('footer').getAttribute('data-slot')).toBe(
      'sheet-footer',
    );
  });

  it('shows a close button that dismisses it', async () => {
    const onOpenChange = vi.fn();
    renderSheet({}, { defaultOpen: true, onOpenChange });
    await screen.findByRole('dialog');

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalled());
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
  });

  it('omits the close button when asked', async () => {
    renderSheet({ showCloseButton: false }, { defaultOpen: true });
    await screen.findByRole('dialog');

    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('closes from SheetClose', async () => {
    const onOpenChange = vi.fn();
    renderSheet({}, { defaultOpen: true, onOpenChange });
    await screen.findByRole('dialog');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalled());
  });

  it('renders into a custom portal container', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    try {
      render(
        <Sheet defaultOpen>
          <SheetPortal container={host}>
            <SheetContent>
              <SheetTitle>Hosted</SheetTitle>
              <SheetDescription>Custom host.</SheetDescription>
            </SheetContent>
          </SheetPortal>
        </Sheet>,
      );
      const dialog = await screen.findByRole('dialog', { name: 'Hosted' });
      expect(host.contains(dialog)).toBe(true);
    } finally {
      host.remove();
    }
  });
});
